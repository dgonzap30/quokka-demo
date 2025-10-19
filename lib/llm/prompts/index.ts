// ============================================
// LLM Prompts Module Public API
// ============================================
//
// Note: Prompt templates and CoursePromptBuilder removed in Phase 3 cleanup.
// These systems were never integrated into production.
// Production uses generic buildSystemPrompt() from lib/llm/utils.
//
// Restore from git if needed:
// - templates.ts (280 lines) - Course-specific prompts (CS, Math, General)
// - CoursePromptBuilder.ts (165 lines) - Prompt builder with template detection
//

// Schemas
export type { StructuredAIAnswer, Citation, Confidence } from "./schemas";
export {
  STRUCTURED_ANSWER_SCHEMA,
  getStructuredOutputInstructions,
  validateStructuredAnswer,
} from "./schemas";
