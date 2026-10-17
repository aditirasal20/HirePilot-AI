/**
 * Token Counter & Cost Estimation Utility
 * Provides lightweight token estimation (approx. 4 characters per token) and model pricing calculations.
 */
class TokenCounter {
  constructor() {
    // Model pricing per 1 million tokens (USD)
    this.pricingTier = {
      "gemini-1.5-pro": {
        inputPerMillion: 3.5,
        outputPerMillion: 10.5,
      },
      "gemini-1.5-flash": {
        inputPerMillion: 0.35,
        outputPerMillion: 1.05,
      },
    };
  }

  /**
   * Estimate token count for a text string (4 chars ~ 1 token for English text)
   * @param {string} text 
   * @returns {number} Estimated token count
   */
  estimateTokens(text = "") {
    if (!text || typeof text !== "string") return 0;
    const trimmed = text.trim();
    if (trimmed.length === 0) return 0;

    // Word heuristic combined with character length for higher precision
    const words = trimmed.split(/\s+/).length;
    const charEstimate = Math.ceil(trimmed.length / 4);
    const wordEstimate = Math.ceil(words * 1.3);

    return Math.max(charEstimate, wordEstimate);
  }

  /**
   * Estimate token usage for prompt payload and expected response length
   * @param {string} promptText 
   * @param {string} responseText 
   */
  estimateUsage(promptText = "", responseText = "") {
    const promptTokens = this.estimateTokens(promptText);
    const responseTokens = this.estimateTokens(responseText);
    const totalTokens = promptTokens + responseTokens;

    return {
      promptTokens,
      responseTokens,
      totalTokens,
    };
  }

  /**
   * Calculate estimated USD cost for model usage
   * @param {number} promptTokens 
   * @param {number} responseTokens 
   * @param {string} model 
   */
  calculateCostUSD(promptTokens = 0, responseTokens = 0, model = "gemini-1.5-pro") {
    const pricing = this.pricingTier[model] || this.pricingTier["gemini-1.5-pro"];

    const inputCost = (promptTokens / 1_000_000) * pricing.inputPerMillion;
    const outputCost = (responseTokens / 1_000_000) * pricing.outputPerMillion;
    const totalCost = inputCost + outputCost;

    return {
      inputCostUSD: Number(inputCost.toFixed(6)),
      outputCostUSD: Number(outputCost.toFixed(6)),
      totalCostUSD: Number(totalCost.toFixed(6)),
      model,
    };
  }
}

export default new TokenCounter();
