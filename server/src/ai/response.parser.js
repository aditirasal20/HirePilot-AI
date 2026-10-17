import ApiError from "../utils/ApiError.js";

/**
 * AI Response Parser Utility
 * Cleanly strips markdown code fences, extracts embedded JSON payloads, handles JSON recovery, and detects hallucinations.
 */
class ResponseParser {
  /**
   * Extract and parse JSON from AI model response string
   * @param {string} rawResponse 
   * @param {Object} options - { requiredKeys: string[] }
   * @returns {Object} Parsed JSON object
   */
  parseJSON(rawResponse, { requiredKeys = [] } = {}) {
    if (!rawResponse || typeof rawResponse !== "string") {
      throw new ApiError(500, "Empty or invalid response received from AI service.");
    }

    const cleanedText = this.stripMarkdown(rawResponse);

    let parsed;
    try {
      parsed = JSON.parse(cleanedText);
    } catch (firstError) {
      const extractedJSON = this._extractJSONSubstring(cleanedText);
      if (extractedJSON) {
        try {
          parsed = JSON.parse(extractedJSON);
        } catch (secondError) {
          const fixedJSON = this._fixMalformedJSON(extractedJSON);
          try {
            parsed = JSON.parse(fixedJSON);
          } catch (thirdError) {
            console.error("[ResponseParser Error] Failed all JSON recovery attempts:", rawResponse);
            throw new ApiError(500, "AI returned invalid or malformed JSON output format.");
          }
        }
      } else {
        throw new ApiError(500, "Failed to parse JSON structure from AI output.");
      }
    }

    if (requiredKeys.length > 0) {
      const missingKeys = requiredKeys.filter((key) => parsed?.[key] === undefined);
      if (missingKeys.length > 0) {
        throw new ApiError(
          500,
          `AI response is missing required fields: ${missingKeys.join(", ")}.`
        );
      }
    }

    return parsed;
  }

  /**
   * Strip markdown code blocks (` ```json ... ``` `) and trailing whitespace
   * @param {string} text 
   */
  stripMarkdown(text = "") {
    return text
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();
  }

  /**
   * Regex extraction for outermost JSON object `{...}` or array `[...]`
   * @param {string} text 
   */
  _extractJSONSubstring(text) {
    const objectMatch = text.match(/\{[\s\S]*\}/);
    if (objectMatch) return objectMatch[0];

    const arrayMatch = text.match(/\[[\s\S]*\]/);
    if (arrayMatch) return arrayMatch[0];

    return null;
  }

  /**
   * Fix common AI JSON errors (trailing commas, unescaped newlines)
   * @param {string} jsonStr 
   */
  _fixMalformedJSON(jsonStr) {
    return jsonStr
      .replace(/,\s*([}\]])/g, "$1") // Strip trailing commas
      .replace(/[\u0000-\u001F]+/g, " "); // Strip control characters
  }

  /**
   * Placeholder hallucination detection helper
   * Checks if response contains generic placeholders like "John Doe", "Company X", "Lorem Ipsum"
   * @param {Object|string} parsedData 
   */
  detectHallucination(parsedData) {
    const text = typeof parsedData === "string" ? parsedData : JSON.stringify(parsedData);
    const suspiciousPatterns = [
      "John Doe",
      "Jane Doe",
      "Lorem ipsum",
      "Company X",
      "Sample Company",
      "[Insert Name]",
      "[Your Name]",
    ];

    const matches = suspiciousPatterns.filter((pattern) =>
      text.toLowerCase().includes(pattern.toLowerCase())
    );

    return {
      hasSuspiciousContent: matches.length > 0,
      detectedPatterns: matches,
    };
  }
}

export default new ResponseParser();
