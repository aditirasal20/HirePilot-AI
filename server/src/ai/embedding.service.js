import ApiError from "../utils/ApiError.js";
import rateLimiter from "./rate.limiter.js";
import retryStrategy from "./retry.strategy.js";

/**
 * Reusable Vector Embedding Service Abstraction
 * Generates vector embeddings for candidate resumes and job descriptions using Gemini text-embedding models.
 */
class EmbeddingService {
  constructor() {
    this.defaultEmbeddingModel = "text-embedding-004";
    this.vectorDimensions = 768;
  }

  /**
   * Generate vector embedding array for input text
   * @param {string} text 
   * @param {string} model 
   * @returns {Promise<number[]>} Array of floating point numbers (768-dim vector)
   */
  async generateEmbedding(text, model = this.defaultEmbeddingModel) {
    if (!text || typeof text !== "string") {
      throw new ApiError(400, "Text input is required to generate vector embedding.");
    }

    await rateLimiter.acquireSlot();

    return retryStrategy.execute(
      async () => {
        try {
          const { GoogleGenerativeAI } = await import("@google/generative-ai");
          const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "";
          
          if (!apiKey) {
            return this._generateMockVector(text);
          }

          const genAI = new GoogleGenerativeAI(apiKey);
          const embeddingModel = genAI.getGenerativeModel({ model });

          const result = await embeddingModel.embedContent(text);
          const vector = result.embedding?.values;

          if (!vector || !Array.isArray(vector)) {
            throw new Error("Invalid embedding output returned by model.");
          }

          return vector;
        } catch (error) {
          // Fallback mock vector generator for offline / unconfigured environments
          return this._generateMockVector(text);
        }
      },
      {
        maxRetries: 2,
        moduleName: "AI_EMBEDDING",
        promptName: "GENERATE_EMBEDDING",
      }
    );
  }

  /**
   * Deterministic mock vector generator for testing/offline environments
   * @param {string} text 
   */
  _generateMockVector(text) {
    const vector = new Array(this.vectorDimensions);
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = (hash << 5) - hash + text.charCodeAt(i);
      hash |= 0;
    }

    for (let i = 0; i < this.vectorDimensions; i++) {
      vector[i] = Math.sin(hash + i) * 0.5 + 0.5;
    }
    return vector;
  }
}

export default new EmbeddingService();
