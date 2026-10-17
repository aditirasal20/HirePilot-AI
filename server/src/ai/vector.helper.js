import ApiError from "../utils/ApiError.js";

/**
 * Reusable Vector Helper & Similarity Math Utility
 * Provides cosine similarity calculations, vector normalization, and similarity ranking.
 */
class VectorHelper {
  /**
   * Calculate Cosine Similarity score between two vector float arrays
   * Score ranges from -1.0 to 1.0 (1.0 = identical direction / perfect match)
   * 
   * @param {number[]} vecA 
   * @param {number[]} vecB 
   * @returns {number} Similarity score normalized between 0.0 and 1.0
   */
  cosineSimilarity(vecA, vecB) {
    if (!Array.isArray(vecA) || !Array.isArray(vecB)) {
      throw new ApiError(400, "Vectors vecA and vecB must be arrays of numbers.");
    }

    if (vecA.length !== vecB.length) {
      throw new ApiError(
        400,
        `Vector dimension mismatch: vecA (${vecA.length}) vs vecB (${vecB.length}).`
      );
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      const a = vecA[i];
      const b = vecB[i];
      dotProduct += a * b;
      normA += a * a;
      normB += b * b;
    }

    if (normA === 0 || normB === 0) return 0;

    const similarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    
    // Scale cosine range [-1, 1] to match percentage score [0, 1]
    const normalizedScore = (similarity + 1) / 2;
    return Number(normalizedScore.toFixed(4));
  }

  /**
   * Normalize vector array to unit length (Magnitude = 1.0)
   * @param {number[]} vector 
   */
  normalizeVector(vector) {
    let sumSquares = 0;
    for (let i = 0; i < vector.length; i++) {
      sumSquares += vector[i] * vector[i];
    }

    const magnitude = Math.sqrt(sumSquares);
    if (magnitude === 0) return vector;

    return vector.map((val) => val / magnitude);
  }

  /**
   * Rank items by vector similarity relative to a target query vector
   * 
   * @param {number[]} queryVector 
   * @param {Array<{ id: string, vector: number[], data: any }>} candidateList 
   * @param {number} topK 
   */
  rankBySimilarity(queryVector, candidateList = [], topK = 10) {
    const scoredList = candidateList.map((item) => {
      const similarityScore = this.cosineSimilarity(queryVector, item.vector);
      return {
        ...item,
        similarityScore,
        matchPercentage: Math.round(similarityScore * 100),
      };
    });

    // Sort descending by similarityScore
    scoredList.sort((a, b) => b.similarityScore - a.similarityScore);

    return scoredList.slice(0, topK);
  }
}

export default new VectorHelper();
