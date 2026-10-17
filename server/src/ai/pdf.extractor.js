import zlib from "node:zlib";
import ApiError from "../utils/ApiError.js";

/**
 * PDF Text Extraction Utility
 * Extracts plain text, word count, and page metadata from PDF buffers.
 *
 * The default pdf-parse entry (index.js) runs a debug test harness on import and
 * crashes in ESM, so we load the library entry `pdf-parse/lib/pdf-parse.js` instead.
 * When pdf-parse fails, a dependency-free content-stream parser is used as a
 * fallback. Whatever the source, extracted text is validated so raw PDF binary
 * is never persisted or forwarded to the AI layer.
 */
class PDFExtractor {
  /**
   * Extract plain text and metadata from a PDF Buffer
   * @param {Buffer} pdfBuffer
   * @returns {Promise<Object>} { text, pageCount, wordCount, metadata, parser }
   */
  async extractText(pdfBuffer) {
    if (!pdfBuffer || !Buffer.isBuffer(pdfBuffer)) {
      throw new ApiError(400, "Invalid PDF buffer provided for text extraction.");
    }

    // Primary: pdf-parse (library entry, avoids the index.js debug harness crash)
    try {
      const pdfParseModule = await this._loadPdfParse();
      if (pdfParseModule) {
        const parsed = await pdfParseModule(pdfBuffer);
        const text = parsed?.text?.trim() || "";
        if (this.isReadableText(text)) {
          const words = text.split(/\s+/).filter(Boolean);
          return {
            text,
            pageCount: parsed.numpages || 1,
            wordCount: words.length,
            metadata: parsed.info || {},
            parser: "pdf-parse",
          };
        }
        console.warn("[PDF Extractor] pdf-parse returned unreadable content; trying content-stream fallback.");
      }
    } catch (error) {
      console.warn("[PDF Extractor] pdf-parse failed:", error.message);
    }

    // Fallback: built-in content-stream parser (no external dependencies)
    const fallback = this._extractViaContentStreams(pdfBuffer);
    if (fallback && this.isReadableText(fallback.text)) {
      return { ...fallback, parser: "content-streams" };
    }

    throw new ApiError(
      400,
      "Unable to extract readable text from this PDF. Please upload a text-based resume PDF (image-only scans are not supported)."
    );
  }

  /**
   * Load the pdf-parse function. Prefers the library entry point which exports
   * the parser directly and avoids the broken index.js debug harness.
   */
  async _loadPdfParse() {
    try {
      const libModule = await import("pdf-parse/lib/pdf-parse.js");
      return libModule?.default || libModule;
    } catch {
      try {
        const defaultModule = await import("pdf-parse");
        return defaultModule?.default || defaultModule;
      } catch {
        return null;
      }
    }
  }

  /**
   * Dependency-free extraction of text operators from PDF content streams.
   * Handles uncompressed and FlateDecode-compressed streams.
   * @param {Buffer} pdfBuffer
   */
  _extractViaContentStreams(pdfBuffer) {
    try {
      const latin1 = pdfBuffer.toString("latin1");
      const streamRe = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
      const chunks = [];
      let match;

      while ((match = streamRe.exec(latin1)) !== null) {
        const dictWindow = latin1.slice(Math.max(0, match.index - 250), match.index);
        const raw = match[1];
        let decoded;

        if (/\/FlateDecode\b/.test(dictWindow)) {
          try {
            decoded = zlib.inflateSync(Buffer.from(raw, "latin1")).toString("latin1");
          } catch {
            continue;
          }
        } else if (/\/LZWDecode\b|\/ASCIIHexDecode\b/.test(dictWindow)) {
          continue;
        } else {
          decoded = raw;
        }

        const text = this._extractTextFromContentStream(decoded);
        if (text) chunks.push(text);
      }

      const text = this.cleanExtractedText(chunks.join("\n"));
      const words = text.split(/\s+/).filter(Boolean);

      return {
        text,
        pageCount: Math.max(1, Math.ceil(words.length / 500)),
        wordCount: words.length,
        metadata: { info: "Extracted via built-in content-stream parser" },
      };
    } catch (error) {
      console.warn("[PDF Extractor] Content-stream fallback failed:", error.message);
      return null;
    }
  }

  /**
   * Pull literal/hex strings out of Tj / TJ text-showing operators.
   * @param {string} content
   */
  _extractTextFromContentStream(content) {
    const parts = [];
    const operatorRe =
      /\((?:[^()\\]|\\.)*\)\s*T[jJ]|<[0-9A-Fa-f\s]+>\s*T[jJ]|\[[\s\S]*?\]\s*TJ/g;
    let match;

    while ((match = operatorRe.exec(content)) !== null) {
      const token = match[0];
      if (token.startsWith("[")) {
        const inner = token.slice(0, token.lastIndexOf("]"));
        const strings = inner.match(/\((?:[^()\\]|\\.)*\)|<[0-9A-Fa-f\s]+>/g) || [];
        strings.forEach((s) => parts.push(this._decodePdfString(s)));
      } else {
        parts.push(this._decodePdfString(token.replace(/\s*T[jJ]$/, "")));
      }
    }

    return parts.join(" ");
  }

  /**
   * Decode a PDF string literal "(...)" or hex string "<...>".
   * @param {string} str
   */
  _decodePdfString(str) {
    if (str.startsWith("<")) {
      const hex = str.slice(1, -1).replace(/\s+/g, "");
      return Buffer.from(hex, "hex").toString("latin1");
    }

    let out = "";
    for (let i = 1; i < str.length - 1; i += 1) {
      const ch = str[i];
      if (ch === "\\") {
        const next = str[i + 1];
        if (next === "n") {
          out += "\n";
          i += 1;
        } else if (next === "r") {
          out += "\r";
          i += 1;
        } else if (next === "t") {
          out += "\t";
          i += 1;
        } else if (/[0-7]/.test(next)) {
          out += String.fromCharCode(parseInt(str.slice(i + 1, i + 4), 8));
          i += 3;
        } else {
          out += next || "";
          i += 1;
        }
      } else {
        out += ch;
      }
    }
    return out;
  }

  /**
   * Guard against raw binary being treated as resume text. Ensures the extracted
   * output looks like real readable prose before it is persisted or sent to AI.
   * @param {string} text
   */
  isReadableText(text = "") {
    if (!text || text.trim().length < 40) return false;

    const words = text.split(/\s+/).filter(Boolean);
    if (words.length < 15) return false;

    const sample = text.slice(0, 4000);
    let suspiciousCount = 0;
    let printableCount = 0;

    for (const ch of sample) {
      const code = ch.codePointAt(0);
      if (code === 0xfffd) {
        suspiciousCount += 1;
      } else if (code < 32 && code !== 9 && code !== 10 && code !== 13) {
        suspiciousCount += 1;
      } else if (code >= 0x80 && code <= 0x9f) {
        suspiciousCount += 1;
      }
      if (code >= 32 && code !== 127 && code !== 0xfffd) {
        printableCount += 1;
      }
    }

    const suspiciousRatio = suspiciousCount / sample.length;
    const printableRatio = printableCount / sample.length;

    return suspiciousRatio < 0.02 && printableRatio >= 0.8;
  }

  /**
   * Clean and normalize raw extracted resume text
   * @param {string} rawText
   */
  cleanExtractedText(rawText = "") {
    return rawText
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
      .replace(/[ \t]+/g, " ")
      .replace(/ *\n */g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }
}

export default new PDFExtractor();
