import ApiError from "../utils/ApiError.js";
import retryStrategy from "./retry.strategy.js";
import rateLimiter from "./rate.limiter.js";
import responseParser from "./response.parser.js";
import tokenCounter from "./token.counter.js";
import aiLogger from "./ai.logger.js";

/**
 * Centralized Google Gemini API Wrapper Service
 * Single authoritative access point for all Gemini LLM interactions across HirePilot AI.
 */
class GeminiService {
  /**
   * Resolve the default Gemini model at call time so the GEMINI_MODEL env override always applies
   */
  get defaultModel() {
    return process.env.GEMINI_MODEL || "gemini-2.5-flash";
  }

  /**
   * Resolve the Gemini API key at call time so env changes and dotenv loading order cannot stale it
   */
  get apiKey() {
    return process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "";
  }

  /**
   * Health check method to verify Gemini API key availability and service status
   */
  async healthCheck() {
    if (!this.apiKey) {
      return {
        status: "UNHEALTHY",
        message: "GEMINI_API_KEY is not configured in environment variables.",
      };
    }
    return {
      status: "HEALTHY",
      model: this.defaultModel,
      rateLimiterStats: rateLimiter.getStats(),
    };
  }

  /**
   * Primary text generation wrapper using exponential backoff and rate limiting
   * 
   * @param {Object} params - { prompt, systemPrompt, model, temperature, timeoutMs, moduleName, promptName }
   */
  async generateText({
    prompt,
    systemPrompt = "",
    model = this.defaultModel,
    temperature = 0.2,
    timeoutMs = 30000,
    moduleName = "AI_CORE",
    promptName = "GENERATE_TEXT",
    version = "1.0.0",
  }) {
    if (!prompt) {
      throw new ApiError(400, "Prompt is required for text generation.");
    }

    // Enforce rate limiting slot acquisition
    await rateLimiter.acquireSlot();

    const startTime = Date.now();

    return retryStrategy.execute(
      async () => {
        const fullPromptPayload = systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt;

        // Dynamic import of Google Generative AI SDK with HTTP REST fallback
        let responseText = "";
        try {
          const { GoogleGenerativeAI } = await import("@google/generative-ai");
          const genAI = new GoogleGenerativeAI(this.apiKey);
          const geminiModel = genAI.getGenerativeModel({
            model,
            systemInstruction: systemPrompt || undefined,
            generationConfig: { temperature },
          });

          const result = await Promise.race([
            geminiModel.generateContent(prompt),
            this._createTimeout(timeoutMs),
          ]);

          const response = await result.response;
          responseText = response.text();
        } catch (sdkError) {
          // REST Endpoint Fallback if SDK is unavailable or uninitialized
          responseText = await this._callGeminiRestApi(
            fullPromptPayload,
            model,
            temperature,
            timeoutMs
          );
        }

        const normalizedText = responseParser.stripMarkdown(responseText);
        const latencyMs = Date.now() - startTime;
        const tokenUsage = tokenCounter.estimateUsage(fullPromptPayload, normalizedText);

        aiLogger.logSuccess({
          moduleName,
          promptName,
          version,
          latencyMs,
          tokenUsage,
          model,
        });

        return {
          text: normalizedText,
          rawResponse: responseText,
          tokenUsage,
          latencyMs,
        };
      },
      {
        maxRetries: 3,
        moduleName,
        promptName,
        version,
      }
    );
  }

  /**
   * Generate structured JSON output with automatic parsing and recovery
   * 
   * @param {Object} params - { prompt, systemPrompt, model, temperature, timeoutMs, moduleName, promptName }
   */
  async generateStructuredJSON(params) {
    const jsonSystemPrompt = `${params.systemPrompt || ""}\n\nCRITICAL: You MUST respond ONLY with valid JSON. Do not include markdown headers or commentary outside the JSON.`.trim();

    const result = await this.generateText({
      ...params,
      systemPrompt: jsonSystemPrompt,
    });

    const parsedData = responseParser.parseJSON(result.text, {
      requiredKeys: params.requiredKeys || [],
    });
    const hallucinationCheck = responseParser.detectHallucination(parsedData);

    return {
      data: parsedData,
      tokenUsage: result.tokenUsage,
      latencyMs: result.latencyMs,
      hallucinationCheck,
    };
  }

  /**
   * Stream response for real-time text generation
   * @param {Object} params - { prompt, systemPrompt, onChunk }
   */
  async streamResponse({ prompt, systemPrompt = "", onChunk }) {
    if (!prompt) throw new ApiError(400, "Prompt is required for streaming.");

    await rateLimiter.acquireSlot();

    try {
      const { GoogleGenerativeAI } = await import("@google/generative-ai");
      const genAI = new GoogleGenerativeAI(this.apiKey);
      const geminiModel = genAI.getGenerativeModel({
        model: this.defaultModel,
        systemInstruction: systemPrompt || undefined,
      });

      const result = await geminiModel.generateContentStream(prompt);
      let fullText = "";

      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        fullText += chunkText;
        if (onChunk && typeof onChunk === "function") {
          onChunk(chunkText);
        }
      }

      return { text: fullText };
    } catch (error) {
      console.error("[Gemini Streaming Error]", error);
      throw new ApiError(500, `Streaming failed: ${error.message}`);
    }
  }

  /**
   * Direct REST fallback for Google Gemini API
   */
  async _callGeminiRestApi(promptText, model, temperature, timeoutMs) {
    if (!this.apiKey) {
      // Mocked output for offline development environment if API key is unconfigured
      return JSON.stringify({
        status: "MOCK_RESPONSE",
        message: "Gemini API key not configured. Mock AI response returned.",
        score: 85,
        skills: ["Node.js", "Express.js", "PostgreSQL", "Prisma"],
      });
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }],
          generationConfig: { temperature },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errBody = await response.text();
        const err = new Error(`Gemini REST API Error ${response.status}: ${errBody}`);
        err.status = response.status;
        throw err;
      }

      const data = await response.json();
      const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      return candidateText || "";
    } catch (error) {
      clearTimeout(timeout);
      throw error;
    }
  }

  /**
   * Timeout helper
   * @param {number} ms 
   */
  _createTimeout(ms) {
    return new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Gemini API request timed out after ${ms}ms`)), ms)
    );
  }
}

export default new GeminiService();
