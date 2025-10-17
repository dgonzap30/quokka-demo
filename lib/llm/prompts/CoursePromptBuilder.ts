// ============================================
// Course-Aware Prompt Builder
// ============================================

import type { Course, CourseContext, MultiCourseContext } from "@/lib/models/types";
import { detectCourseTemplate, GENERAL_TEMPLATE, type PromptTemplate } from "./templates";
import { getStructuredOutputInstructions } from "./schemas";

/**
 * Course-aware prompt builder
 *
 * Builds specialized system prompts based on course context
 * and formats user prompts with relevant materials.
 *
 * Improvements over generic prompts:
 * - Subject-specific teaching styles
 * - Course-appropriate formatting guidelines
 * - Structured output schema enforcement
 * - Better material referencing
 */
export class CoursePromptBuilder {
  private course: Course | null;
  private template: PromptTemplate;

  constructor(course: Course | null = null) {
    this.course = course;
    this.template = detectCourseTemplate(course);
  }

  /**
   * Build complete system prompt
   *
   * Combines course-specific template with structured output
   * instructions and general guidelines.
   *
   * @param includeStructuredOutput - Whether to enforce JSON output schema
   */
  buildSystemPrompt(includeStructuredOutput: boolean = true): string {
    let prompt = this.template.systemPrompt;

    // Add formatting guidelines
    prompt += "\n\n" + this.template.formattingGuidelines;

    // Add examples if available
    if (this.template.examples) {
      prompt += "\n\n**Example Format:**\n" + this.template.examples;
    }

    // Add course-specific context if available
    if (this.course) {
      prompt += `\n\n**Current Course Context:**\n`;
      prompt += `- **Course:** ${this.course.code} - ${this.course.name}\n`;
      prompt += `- **Term:** ${this.course.term}\n`;
      if (this.course.description) {
        prompt += `- **Description:** ${this.course.description}\n`;
      }
    }

    // Add structured output instructions
    if (includeStructuredOutput) {
      prompt += "\n\n" + getStructuredOutputInstructions();
    }

    return prompt.trim();
  }

  /**
   * Build user prompt with course context
   *
   * Formats the user's question with relevant course materials
   * in a clear, structured way.
   *
   * @param question - Student's question
   * @param context - Course context with ranked materials
   */
  buildUserPrompt(question: string, context: CourseContext | null = null): string {
    let prompt = "";

    // Add course materials context if available
    if (context && context.contextText) {
      prompt += context.contextText;
      prompt += "\n\n---\n\n";
    }

    // Add the question
    prompt += `**Student Question:**\n${question}`;

    return prompt;
  }

  /**
   * Build user prompt for multi-course context
   *
   * Similar to buildUserPrompt but handles multiple courses.
   *
   * @param question - Student's question
   * @param context - Multi-course context
   */
  buildMultiCourseUserPrompt(
    question: string,
    context: MultiCourseContext | null = null
  ): string {
    let prompt = "";

    // Add combined course materials context
    if (context && context.combinedContextText) {
      prompt += context.combinedContextText;
      prompt += "\n\n---\n\n";
    }

    // Add the question
    prompt += `**Student Question:**\n${question}`;

    return prompt;
  }

  /**
   * Get the selected template
   */
  getTemplate(): PromptTemplate {
    return this.template;
  }

  /**
   * Get the course
   */
  getCourse(): Course | null {
    return this.course;
  }
}

/**
 * Create prompt builder for a course
 *
 * Convenience factory function.
 */
export function createCoursePromptBuilder(course: Course | null): CoursePromptBuilder {
  return new CoursePromptBuilder(course);
}

/**
 * Build complete prompt pair (system + user)
 *
 * One-shot function to create both prompts at once.
 *
 * @param course - Course for context-aware prompt selection
 * @param question - Student's question
 * @param context - Course materials context
 * @param includeStructuredOutput - Enforce JSON schema
 */
export function buildPromptPair(
  course: Course | null,
  question: string,
  context: CourseContext | null = null,
  includeStructuredOutput: boolean = true
): { systemPrompt: string; userPrompt: string } {
  const builder = new CoursePromptBuilder(course);

  return {
    systemPrompt: builder.buildSystemPrompt(includeStructuredOutput),
    userPrompt: builder.buildUserPrompt(question, context),
  };
}

/**
 * Build prompt pair for multi-course context
 */
export function buildMultiCoursePromptPair(
  question: string,
  context: MultiCourseContext | null = null,
  includeStructuredOutput: boolean = true
): { systemPrompt: string; userPrompt: string } {
  // Use general template for multi-course context
  const builder = new CoursePromptBuilder(null);

  return {
    systemPrompt: builder.buildSystemPrompt(includeStructuredOutput),
    userPrompt: builder.buildMultiCourseUserPrompt(question, context),
  };
}
