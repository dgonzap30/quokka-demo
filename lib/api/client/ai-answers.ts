// ============================================
// AI Answers API Module
// ============================================
//
// Handles AI answer generation, preview, and endorsements
// Supports both backend (HTTP) and fallback (localStorage) modes via feature flags.

import type {
  AIAnswer,
  GenerateAIAnswerInput,
  EndorseAIAnswerInput,
  BulkEndorseInput,
  BulkActionResult,
} from "@/lib/models/types";

import {
  seedData,
  getThreadById,
  getCourseById,
  addAIAnswer,
  updateThread,
  getAIAnswerByThread,
  getAIAnswerById,
  updateAIAnswer,
} from "@/lib/store/localStore";

import { trackPreviewGenerated } from "@/lib/store/metrics";

import { delay, generateId } from "./utils";
import { BACKEND_FEATURE_FLAGS } from "@/lib/config/backend";
import { httpGet, httpPost } from "./http.client";

/**
 * AI Answers API methods
 */
export const aiAnswersAPI = {
  /**
   * Generate AI answer for a thread
   *
   * Generates an AI answer using the `/api/answer` endpoint and saves it to the database.
   * Updates the thread to mark it as having an AI answer.
   *
   * @param input - AI answer generation parameters
   * @returns Generated AI answer object
   *
   * @throws Error if thread or course not found, or API fails
   *
   * @example
   * ```ts
   * const aiAnswer = await aiAnswersAPI.generateAIAnswer({
   *   threadId: "thread-123",
   *   courseId: "course-cs101",
   *   userId: "user-456",
   *   title: "How does binary search work?",
   *   content: "I need a detailed explanation of binary search..."
   * });
   * // Returns: { id: "ai-...", content: "Binary search is...", citations: [...], ... }
   * ```
   */
  async generateAIAnswer(input: GenerateAIAnswerInput): Promise<AIAnswer> {
    await delay(800 + Math.random() * 400); // 800-1200ms
    seedData();

    const thread = getThreadById(input.threadId);
    if (!thread) {
      throw new Error(`Thread not found: ${input.threadId}`);
    }

    const course = getCourseById(input.courseId);
    if (!course) {
      throw new Error(`Course not found: ${input.courseId}`);
    }

    // Generate AI response using /api/answer endpoint
    const response = await fetch("/api/answer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: `${input.title}\n\n${input.content}`,
        courseId: input.courseId,
        userId: input.userId,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI answer generation failed: ${response.statusText}`);
    }

    const data = await response.json();
    const aiAnswer: AIAnswer = {
      ...data.answer,
      id: generateId("ai"), // Override with our ID
      threadId: input.threadId,
    };

    addAIAnswer(aiAnswer);
    updateThread(input.threadId, {
      hasAIAnswer: true,
      aiAnswerId: aiAnswer.id,
      updatedAt: new Date().toISOString(),
    });

    // Track metrics
    trackPreviewGenerated();

    return aiAnswer;
  },

  /**
   * Generate AI answer preview (ask page only)
   *
   * Generates an AI answer preview without saving to the database.
   * Used on the ask page to show users what the AI answer would look like.
   *
   * @param input - AI answer generation parameters
   * @returns Preview AI answer object (not saved)
   *
   * @throws Error if course not found or API fails
   *
   * @example
   * ```ts
   * const preview = await aiAnswersAPI.generateAIPreview({
   *   threadId: "temp-123",
   *   courseId: "course-cs101",
   *   userId: "user-456",
   *   title: "What is recursion?",
   *   content: "Can you explain recursion with examples?"
   * });
   * // Returns preview (NOT saved to database)
   * ```
   */
  async generateAIPreview(input: GenerateAIAnswerInput): Promise<AIAnswer> {
    await delay(800 + Math.random() * 400); // 800-1200ms (AI simulation)
    seedData();

    const course = getCourseById(input.courseId);
    if (!course) {
      throw new Error(`Course not found: ${input.courseId}`);
    }

    // Generate AI response using /api/answer endpoint
    const response = await fetch("/api/answer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: `${input.title}\n\n${input.content}`,
        courseId: input.courseId,
        userId: input.userId,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI answer generation failed: ${response.statusText}`);
    }

    const data = await response.json();
    const preview: AIAnswer = {
      ...data.answer,
      id: `preview-${Date.now()}`, // Override with preview ID
      threadId: input.threadId,
      generatedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return preview;
  },

  /**
   * Get AI answer for a thread
   *
   * Retrieves the AI answer associated with a specific thread.
   *
   * @param threadId - ID of the thread
   * @returns AI answer object or null if not found
   *
   * @example
   * ```ts
   * const aiAnswer = await aiAnswersAPI.getAIAnswer("thread-123");
   * if (aiAnswer) {
   *   console.log(`AI Answer: ${aiAnswer.content}`);
   *   console.log(`Confidence: ${aiAnswer.confidenceLevel}`);
   * }
   * ```
   */
  async getAIAnswer(threadId: string): Promise<AIAnswer | null> {
    // Check feature flag for backend
    if (BACKEND_FEATURE_FLAGS.aiAnswers) {
      try {
        // Call backend endpoint
        const aiAnswer = await httpGet<AIAnswer>(
          `/api/v1/threads/${threadId}/ai-answer`
        );
        return aiAnswer;
      } catch (error) {
        // If 404, return null (no AI answer exists)
        if (error instanceof Error && error.message.includes('404')) {
          return null;
        }
        console.error('[AI Answers] Backend fetch failed:', error);
        // Fall through to localStorage fallback
      }
    }

    // Fallback: Use localStorage
    await delay(200 + Math.random() * 200); // 200-400ms
    seedData();

    const thread = getThreadById(threadId);
    if (!thread || !thread.hasAIAnswer || !thread.aiAnswerId) {
      return null;
    }

    return getAIAnswerByThread(threadId);
  },

  /**
   * Endorse an AI answer
   *
   * Records an endorsement for an AI answer. Instructor endorsements
   * are weighted 3x more than student endorsements.
   *
   * @param input - Endorsement parameters
   * @returns Updated AI answer with new endorsement counts
   *
   * @throws Error if AI answer not found or user already endorsed
   *
   * @example
   * ```ts
   * // Student endorsement
   * const endorsed = await aiAnswersAPI.endorseAIAnswer({
   *   aiAnswerId: "ai-123",
   *   userId: "user-456",
   *   isInstructor: false
   * });
   * // totalEndorsements increased by 1
   *
   * // Instructor endorsement
   * const instructorEndorsed = await aiAnswersAPI.endorseAIAnswer({
   *   aiAnswerId: "ai-123",
   *   userId: "instructor-789",
   *   isInstructor: true
   * });
   * // totalEndorsements increased by 3, instructorEndorsed = true
   * ```
   */
  async endorseAIAnswer(input: EndorseAIAnswerInput): Promise<AIAnswer> {
    // Check feature flag for backend
    if (BACKEND_FEATURE_FLAGS.aiAnswers) {
      try {
        // Call backend endpoint
        const updatedAnswer = await httpPost<AIAnswer>(
          `/api/v1/ai-answers/${input.aiAnswerId}/endorse`,
          {
            userId: input.userId,
            isInstructor: input.isInstructor,
          }
        );
        return updatedAnswer;
      } catch (error) {
        console.error('[AI Answers] Backend endorse failed:', error);
        // Fall through to localStorage fallback
      }
    }

    // Fallback: Use localStorage
    await delay(100); // Quick action
    seedData();

    const aiAnswer = getAIAnswerById(input.aiAnswerId);
    if (!aiAnswer) {
      throw new Error(`AI answer not found: ${input.aiAnswerId}`);
    }

    // Check if user already endorsed
    if (aiAnswer.endorsedBy.includes(input.userId)) {
      throw new Error("User has already endorsed this answer");
    }

    // Calculate endorsement weight (instructor = 3x)
    const weight = input.isInstructor ? 3 : 1;

    // Update endorsement counts
    const updates: Partial<AIAnswer> = {
      endorsedBy: [...aiAnswer.endorsedBy, input.userId],
      totalEndorsements: aiAnswer.totalEndorsements + weight,
      updatedAt: new Date().toISOString(),
    };

    if (input.isInstructor) {
      updates.instructorEndorsements = aiAnswer.instructorEndorsements + 1;
      updates.instructorEndorsed = true;
    } else {
      updates.studentEndorsements = aiAnswer.studentEndorsements + 1;
    }

    updateAIAnswer(input.aiAnswerId, updates);

    // Return updated answer
    const updatedAnswer = getAIAnswerById(input.aiAnswerId);
    if (!updatedAnswer) {
      throw new Error("Failed to retrieve updated AI answer");
    }

    return updatedAnswer;
  },

  /**
   * Bulk endorse AI answers (instructor only)
   *
   * Endorses multiple AI answers in a single operation. This is an instructor-only
   * operation for efficient moderation.
   *
   * @param input - Bulk endorsement parameters
   * @returns Result object with success/failure counts and errors
   *
   * @example
   * ```ts
   * const result = await aiAnswersAPI.bulkEndorseAIAnswers({
   *   aiAnswerIds: ["ai-1", "ai-2", "ai-3"],
   *   userId: "instructor-456"
   * });
   *
   * console.log(`Endorsed ${result.successCount} answers`);
   * if (result.failedCount > 0) {
   *   console.log(`Failed: ${result.errors}`);
   * }
   * // Returns: {
   * //   actionType: "endorse",
   * //   successCount: 3,
   * //   failedCount: 0,
   * //   errors: [],
   * //   timestamp: "2025-10-19T..."
   * // }
   * ```
   */
  async bulkEndorseAIAnswers(
    input: BulkEndorseInput
  ): Promise<BulkActionResult> {
    // Check feature flag for backend
    if (BACKEND_FEATURE_FLAGS.aiAnswers) {
      try {
        // Call backend endpoint
        const result = await httpPost<BulkActionResult>(
          `/api/v1/ai-answers/bulk-endorse`,
          {
            aiAnswerIds: input.aiAnswerIds,
            userId: input.userId,
          }
        );
        return result;
      } catch (error) {
        console.error('[AI Answers] Backend bulk endorse failed:', error);
        // Fall through to localStorage fallback
      }
    }

    // Fallback: Use localStorage
    await delay(200 + Math.random() * 100); // 200-300ms (faster than sequential)
    seedData();

    const { aiAnswerIds, userId } = input;
    const errors: Array<{ itemId: string; reason: string; code?: string }> =
      [];
    let successCount = 0;

    // Validate all AI answers exist and user hasn't endorsed
    for (const aiAnswerId of aiAnswerIds) {
      const aiAnswer = getAIAnswerById(aiAnswerId);

      if (!aiAnswer) {
        errors.push({
          itemId: aiAnswerId,
          reason: "AI answer not found",
          code: "NOT_FOUND",
        });
      } else if (aiAnswer.endorsedBy.includes(userId)) {
        errors.push({
          itemId: aiAnswerId,
          reason: "Already endorsed by this user",
          code: "ALREADY_ENDORSED",
        });
      }
    }

    // All-or-nothing: if any validation failed, return errors
    if (errors.length > 0) {
      return {
        actionType: "endorse",
        successCount: 0,
        failedCount: errors.length,
        errors,
        timestamp: new Date().toISOString(),
      };
    }

    // Perform bulk endorsement
    for (const aiAnswerId of aiAnswerIds) {
      try {
        await aiAnswersAPI.endorseAIAnswer({
          aiAnswerId,
          userId,
          isInstructor: true, // Bulk operations are instructor-only
        });
        successCount++;
      } catch (error) {
        errors.push({
          itemId: aiAnswerId,
          reason: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return {
      actionType: "endorse",
      successCount,
      failedCount: errors.length,
      errors,
      timestamp: new Date().toISOString(),
    };
  },
};
