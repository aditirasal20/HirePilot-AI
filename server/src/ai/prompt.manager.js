import ApiError from "../utils/ApiError.js";
import { PROMPT_TEMPLATES } from "./prompt.templates.js";

/**
 * Prompt Manager Service
 * Registers, versions, caches, resolves, and parameterizes AI prompts across all modules.
 */
class PromptManager {
  constructor() {
    this.promptRegistry = new Map();
    this.promptCache = new Map();

    // Register default system templates
    Object.values(PROMPT_TEMPLATES).forEach((template) => {
      this.registerPrompt(template.name, template);
    });
  }

  /**
   * Register a new or updated prompt template
   * @param {string} name 
   * @param {Object} template - { name, version, systemPrompt, userTemplate, description }
   */
  registerPrompt(name, template) {
    if (!name || !template.systemPrompt || !template.userTemplate) {
      throw new ApiError(400, `Invalid prompt template registration for '${name}'.`);
    }

    const promptKey = `${name}:v${template.version || "1.0.0"}`;
    this.promptRegistry.set(promptKey, template);
    this.promptRegistry.set(name, template); // Default pointing to latest version
    this.promptCache.clear(); // Flush cache on new registration

    console.log(`[PromptManager] Registered prompt '${name}' (v${template.version || "1.0.0"})`);
    return template;
  }

  /**
   * Get prompt template by name and optional version
   * @param {string} name 
   * @param {string} version 
   */
  getPrompt(name, version) {
    const key = version ? `${name}:v${version}` : name;
    const template = this.promptRegistry.get(key);

    if (!template) {
      throw new ApiError(404, `Prompt template '${key}' not found in registry.`);
    }

    return template;
  }

  /**
   * Resolve template placeholders with key-value data variables
   * Example: {{jobTitle}} -> "Senior Backend Engineer"
   * 
   * @param {string} name 
   * @param {Object} variables 
   * @param {string} version 
   * @returns {Object} { systemPrompt, userPrompt, version }
   */
  renderPrompt(name, variables = {}, version) {
    const template = this.getPrompt(name, version);

    let renderedUserPrompt = template.userTemplate;

    // Replace placeholders: {{variableName}}
    Object.entries(variables).forEach(([key, val]) => {
      const placeholder = new RegExp(`{{\\s*${key}\\s*}}`, "g");
      const stringValue = val !== null && val !== undefined ? String(val) : "";
      renderedUserPrompt = renderedUserPrompt.replace(placeholder, stringValue);
    });

    // Clean any unreplaced placeholders to prevent template leakage into prompts
    renderedUserPrompt = renderedUserPrompt.replace(/{{\s*[\w.\-]+\s*}}/g, "");

    return {
      systemPrompt: template.systemPrompt,
      userPrompt: renderedUserPrompt,
      version: template.version,
      name: template.name,
    };
  }
}

export default new PromptManager();
