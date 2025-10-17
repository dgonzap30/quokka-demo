// ============================================
// LLM Prompts Module Public API
// ============================================

// Schemas
export type { StructuredAIAnswer, Citation, Confidence } from "./schemas";
export {
  STRUCTURED_ANSWER_SCHEMA,
  getStructuredOutputInstructions,
  validateStructuredAnswer,
} from "./schemas";

// Templates
export type { PromptTemplate } from "./templates";
export {
  CS_TEMPLATE,
  MATH_TEMPLATE,
  GENERAL_TEMPLATE,
  detectCourseTemplate,
} from "./templates";

// Prompt Builder
export {
  CoursePromptBuilder,
  createCoursePromptBuilder,
  buildPromptPair,
  buildMultiCoursePromptPair,
} from "./CoursePromptBuilder";
