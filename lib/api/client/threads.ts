// ============================================
// Threads API Module
// ============================================
//
// Handles thread creation, retrieval, endorsements, and duplicate detection
// Supports both backend (HTTP) and fallback (localStorage) modes via feature flags.

import type {
  Thread,
  ThreadWithAIAnswer,
  CreateThreadInput,
  Post,
  AIAnswer,
  Endorsement,
  Upvote,
  SimilarThread,
} from "@/lib/models/types";

import {
  seedData,
  getThreadsByCourse,
  getThreadById,
  getAIAnswerById,
  getPostsByThread,
  updateThread,
  addThread,
  getUserById,
} from "@/lib/store/localStore";

import { trackThreadCreated } from "@/lib/store/metrics";

import { findSimilarDocuments } from "@/lib/utils/similarity";

import { delay, generateId } from "./utils";
import { aiAnswersAPI } from "./ai-answers";
import { BACKEND_FEATURE_FLAGS } from "@/lib/config/backend";
import { httpGet, httpPost } from "./http.client";

/**
 * Threads API methods
 */
export const threadsAPI = {
  /**
   * Get all threads for a course with AI answers
   *
   * Returns threads enriched with their AI answers, sorted by most recently updated first.
   *
   * @param courseId - ID of the course
   * @returns Array of threads with embedded AI answers
   *
   * @example
   * ```ts
   * const threads = await threadsAPI.getCourseThreads("course-cs101");
   * threads.forEach(thread => {
   *   console.log(thread.title);
   *   if (thread.aiAnswer) {
   *     console.log(`AI Answer: ${thread.aiAnswer.content}`);
   *   }
   * });
   * ```
   */
  async getCourseThreads(courseId: string): Promise<ThreadWithAIAnswer[]> {
    // Check feature flag for backend
    if (BACKEND_FEATURE_FLAGS.threads) {
      try {
        // Call backend endpoint (returns paginated results)
        // Backend doesn't have AI answers embedded yet, using any for flexibility
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const response = await httpGet<{
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          items: any[];
          nextCursor: string | null;
          hasNextPage: boolean;
        }>(`/api/v1/courses/${courseId}/threads?limit=100`);

        // Extract items for backward compatibility
        // Backend already returns threads with author, counts, etc.
        // AI answers are not embedded yet (backend doesn't have that endpoint)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return response.items.map((thread: any) => ({
          ...thread,
          aiAnswer: undefined, // AI answers not fetched from backend yet
        })) as ThreadWithAIAnswer[];
      } catch (error) {
        console.error('[Threads] Backend getCourseThreads failed:', error);
        // Fall through to localStorage fallback
      }
    }

    // Fallback to localStorage (existing implementation)
    await delay();
    seedData();

    const threads = getThreadsByCourse(courseId);

    // Enrich threads with AI answer data
    const enrichedThreads = threads.map((thread): ThreadWithAIAnswer => {
      // Check if thread has an AI answer
      if (thread.hasAIAnswer && thread.aiAnswerId) {
        const aiAnswer = getAIAnswerById(thread.aiAnswerId);
        if (aiAnswer) {
          // Return thread with embedded AI answer
          return { ...thread, aiAnswer };
        }
      }
      // Return thread without aiAnswer (will be undefined)
      return thread as ThreadWithAIAnswer;
    });

    return enrichedThreads.sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  },

  /**
   * Get single thread with posts and AI answer
   *
   * Retrieves complete thread details including all replies and the AI answer.
   * Increments the view count automatically.
   *
   * @param threadId - ID of the thread
   * @returns Thread details object or null if not found
   *
   * @example
   * ```ts
   * const details = await threadsAPI.getThread("thread-123");
   * if (details) {
   *   console.log(`Thread: ${details.thread.title}`);
   *   console.log(`${details.posts.length} replies`);
   *   if (details.aiAnswer) {
   *     console.log(`AI Answer: ${details.aiAnswer.content}`);
   *   }
   * }
   * ```
   */
  async getThread(
    threadId: string
  ): Promise<{ thread: Thread; posts: Post[]; aiAnswer: AIAnswer | null } | null> {
    // Check feature flag for backend
    if (BACKEND_FEATURE_FLAGS.threads) {
      try {
        // Fetch thread and posts in parallel
        const [thread, postsResponse] = await Promise.all([
          httpGet<Thread>(`/api/v1/threads/${threadId}`),
          httpGet<{
            items: Post[];
            nextCursor: string | null;
            hasNextPage: boolean;
          }>(`/api/v1/threads/${threadId}/posts?limit=100`),
        ]);

        // Backend increments view count automatically
        // AI answer not fetched yet (no backend endpoint)
        return {
          thread,
          posts: postsResponse.items,
          aiAnswer: null, // AI answers not fetched from backend yet
        };
      } catch (error) {
        console.error('[Threads] Backend getThread failed:', error);
        // Fall through to localStorage fallback
      }
    }

    // Fallback to localStorage (existing implementation)
    await delay();
    seedData();

    const thread = getThreadById(threadId);
    if (!thread) return null;

    const posts = getPostsByThread(threadId);
    const aiAnswer = thread.aiAnswerId
      ? getAIAnswerById(thread.aiAnswerId)
      : null;

    // Increment view count
    updateThread(threadId, { views: thread.views + 1 });

    return {
      thread: { ...thread, views: thread.views + 1 },
      posts: posts.sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      ),
      aiAnswer,
    };
  },

  /**
   * Create new thread with auto-generated AI answer
   *
   * Creates a discussion thread and automatically generates an AI answer for it.
   * Returns both the thread and AI answer for React Query cache pre-population.
   *
   * @param input - Thread creation parameters
   * @param authorId - ID of the user creating the thread
   * @returns Object containing created thread and AI answer (or null if generation fails)
   *
   * @example
   * ```ts
   * const { thread, aiAnswer } = await threadsAPI.createThread(
   *   {
   *     courseId: "course-cs101",
   *     title: "How does binary search work?",
   *     content: "I need help understanding the algorithm...",
   *     tags: ["algorithms", "searching"]
   *   },
   *   "user-456"
   * );
   * // Thread created with ID: thread-...
   * // AI answer automatically generated
   * ```
   */
  async createThread(
    input: CreateThreadInput,
    authorId: string
  ): Promise<{ thread: Thread; aiAnswer: AIAnswer | null }> {
    // Check feature flag for backend
    if (BACKEND_FEATURE_FLAGS.threads) {
      try {
        // Call backend endpoint to create thread
        const thread = await httpPost<Thread>('/api/v1/threads', {
          courseId: input.courseId,
          title: input.title,
          content: input.content,
        });

        // AI answer generation still happens in frontend (for now)
        // This keeps the existing AI/LLM integration working
        let aiAnswer: AIAnswer | null = null;
        try {
          aiAnswer = await aiAnswersAPI.generateAIAnswer({
            threadId: thread.id,
            courseId: input.courseId,
            userId: authorId,
            title: input.title,
            content: input.content,
            tags: input.tags,
          });
        } catch (error) {
          console.error('[Threads] AI answer generation failed:', error);
        }

        return { thread, aiAnswer };
      } catch (error) {
        console.error('[Threads] Backend createThread failed:', error);
        // Fall through to localStorage fallback
      }
    }

    // Fallback to localStorage (existing implementation)
    await delay(400 + Math.random() * 200); // 400-600ms
    seedData();

    const newThread: Thread = {
      id: generateId("thread"),
      courseId: input.courseId,
      title: input.title,
      content: input.content,
      authorId,
      status: "open",
      tags: input.tags || [],
      views: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addThread(newThread);

    // Track metrics
    trackThreadCreated();

    // Auto-generate AI answer for the new thread
    let aiAnswer: AIAnswer | null = null;
    try {
      aiAnswer = await aiAnswersAPI.generateAIAnswer({
        threadId: newThread.id,
        courseId: input.courseId,
        userId: authorId,
        title: input.title,
        content: input.content,
        tags: input.tags,
      });

      // Fetch updated thread with AI answer flags
      const updatedThread = getThreadById(newThread.id);
      return { thread: updatedThread || newThread, aiAnswer };
    } catch (error) {
      console.error("Failed to generate AI answer:", error);
      // Return thread without AI answer if generation fails (graceful degradation)
      return { thread: newThread, aiAnswer: null };
    }
  },

  /**
   * Endorse a thread (instructor/TA only)
   *
   * Marks a thread as endorsed by an instructor or TA, indicating high quality.
   * Operation is idempotent - multiple endorsements from the same user are ignored.
   *
   * @param threadId - ID of the thread to endorse
   * @param userId - ID of the user endorsing (must be instructor or TA)
   * @throws Error if thread not found, user not found, or user lacks permission
   *
   * @example
   * ```ts
   * await threadsAPI.endorseThread("thread-123", "instructor-456");
   * // Thread marked as endorsed with qualityStatus = "endorsed"
   * ```
   */
  async endorseThread(threadId: string, userId: string): Promise<void> {
    // Check feature flag for backend
    if (BACKEND_FEATURE_FLAGS.threads) {
      try {
        // Call backend endpoint
        await httpPost(`/api/v1/threads/${threadId}/endorse`, {});
        return;
      } catch (error) {
        console.error('[Threads] Backend endorseThread failed:', error);
        // Fall through to localStorage fallback
      }
    }

    // Fallback to localStorage (existing implementation)
    await delay(300 + Math.random() * 200); // 300-500ms
    seedData();

    // Validate thread exists
    const thread = getThreadById(threadId);
    if (!thread) {
      throw new Error(`Thread not found: ${threadId}`);
    }

    // Validate user has instructor or TA role
    const user = getUserById(userId);
    if (!user) {
      throw new Error(`User not found: ${userId}`);
    }
    if (user.role !== "instructor" && user.role !== "ta") {
      throw new Error("Only instructors and TAs can endorse threads");
    }

    // Check if already endorsed by this user
    const existingEndorsement = thread.endorsements?.find(
      (e) => e.userId === userId
    );
    if (existingEndorsement) {
      // Already endorsed, do nothing (idempotent)
      return;
    }

    // Add endorsement
    const endorsement: Endorsement = {
      userId,
      role: user.role === "instructor" ? "instructor" : "ta",
      timestamp: new Date().toISOString(),
    };

    const updatedThread: Thread = {
      ...thread,
      endorsements: [...(thread.endorsements || []), endorsement],
      qualityStatus: "endorsed", // Mark as endorsed
      updatedAt: new Date().toISOString(),
    };

    updateThread(threadId, updatedThread);
  },

  /**
   * Upvote a thread (all users)
   *
   * Adds an upvote to a thread as a quality signal. Students can upvote helpful threads
   * before instructor endorsement. Operation is idempotent.
   *
   * @param threadId - ID of the thread to upvote
   * @param userId - ID of the user upvoting
   * @throws Error if thread or user not found
   *
   * @example
   * ```ts
   * await threadsAPI.upvoteThread("thread-123", "user-456");
   * // Upvote added to thread
   * ```
   */
  async upvoteThread(threadId: string, userId: string): Promise<void> {
    // Check feature flag for backend
    if (BACKEND_FEATURE_FLAGS.threads) {
      try {
        // Call backend endpoint (toggle upvote)
        await httpPost(`/api/v1/threads/${threadId}/upvote`, {});
        return;
      } catch (error) {
        console.error('[Threads] Backend upvoteThread failed:', error);
        // Fall through to localStorage fallback
      }
    }

    // Fallback to localStorage (existing implementation)
    await delay(100); // 100ms (fast operation)
    seedData();

    // Validate thread exists
    const thread = getThreadById(threadId);
    if (!thread) {
      throw new Error(`Thread not found: ${threadId}`);
    }

    // Validate user exists
    const user = getUserById(userId);
    if (!user) {
      throw new Error(`User not found: ${userId}`);
    }

    // Check if already upvoted by this user
    const existingUpvote = thread.upvotes?.find((u) => u.userId === userId);
    if (existingUpvote) {
      // Already upvoted, do nothing (idempotent)
      return;
    }

    // Add upvote
    const upvote: Upvote = {
      userId,
      timestamp: new Date().toISOString(),
    };

    const updatedThread: Thread = {
      ...thread,
      upvotes: [...(thread.upvotes || []), upvote],
      updatedAt: new Date().toISOString(),
    };

    updateThread(threadId, updatedThread);
  },

  /**
   * Remove upvote from a thread
   *
   * Allows users to toggle their upvote on a thread.
   *
   * @param threadId - ID of the thread
   * @param userId - ID of the user removing their upvote
   * @throws Error if thread not found
   *
   * @example
   * ```ts
   * await threadsAPI.removeUpvote("thread-123", "user-456");
   * // Upvote removed from thread
   * ```
   */
  async removeUpvote(threadId: string, userId: string): Promise<void> {
    // Check feature flag for backend
    if (BACKEND_FEATURE_FLAGS.threads) {
      try {
        // Call backend endpoint (same as upvote - it toggles)
        await httpPost(`/api/v1/threads/${threadId}/upvote`, {});
        return;
      } catch (error) {
        console.error('[Threads] Backend removeUpvote failed:', error);
        // Fall through to localStorage fallback
      }
    }

    // Fallback to localStorage (existing implementation)
    await delay(100); // 100ms (fast operation)
    seedData();

    // Validate thread exists
    const thread = getThreadById(threadId);
    if (!thread) {
      throw new Error(`Thread not found: ${threadId}`);
    }

    // Remove upvote if exists
    const updatedThread: Thread = {
      ...thread,
      upvotes: (thread.upvotes || []).filter((u) => u.userId !== userId),
      updatedAt: new Date().toISOString(),
    };

    updateThread(threadId, updatedThread);
  },

  /**
   * Check for duplicate threads before posting
   *
   * Uses TF-IDF + cosine similarity to find existing threads similar to the proposed new thread.
   * Returns threads with 80%+ similarity to help prevent duplicate questions.
   *
   * NOTE: Backend endpoint not yet implemented - using localStorage implementation only.
   *
   * @param input - Thread creation input (title, content, courseId)
   * @returns Array of similar threads with similarity scores
   *
   * @example
   * ```ts
   * const duplicates = await threadsAPI.checkThreadDuplicates({
   *   courseId: "course-cs101",
   *   title: "How does binary search work?",
   *   content: "I need an explanation of binary search...",
   *   tags: []
   * });
   *
   * if (duplicates.length > 0) {
   *   console.log(`Found ${duplicates.length} similar threads:`);
   *   duplicates.forEach(dup => {
   *     console.log(`- ${dup.thread.title} (${dup.similarityPercent}% similar)`);
   *   });
   * }
   * ```
   */
  async checkThreadDuplicates(
    input: CreateThreadInput
  ): Promise<SimilarThread[]> {
    // Duplicate detection uses localStorage implementation
    // Backend endpoint not yet implemented - skip backend call to avoid 404 errors
    await delay(200 + Math.random() * 200); // 200-400ms
    seedData();

    // Get all threads in the same course
    const courseThreads = getThreadsByCourse(input.courseId);

    // Build query text from new thread
    const queryText = `${input.title} ${input.content}`;

    // Build candidate texts from existing threads
    const candidates = courseThreads.map((thread) => ({
      id: thread.id,
      text: `${thread.title} ${thread.content}`,
    }));

    // Find similar documents with 0.8 threshold (80% similarity)
    const similarDocs = findSimilarDocuments(queryText, candidates, 0.8);

    // Map to SimilarThread format
    const similarThreads: SimilarThread[] = similarDocs.map((doc) => {
      const thread = getThreadById(doc.id);
      if (!thread) {
        throw new Error(`Thread not found: ${doc.id}`);
      }

      return {
        thread,
        similarity: doc.similarity,
        similarityPercent: Math.round(doc.similarity * 100),
      };
    });

    return similarThreads;
  },

  /**
   * Merge duplicate threads (instructor/TA only)
   *
   * Merges sourceThread into targetThread:
   * - Marks source as merged (duplicatesOf = targetId)
   * - Updates target with mergedFrom array
   * - Preserves citations and content from both threads
   * - Creates permanent redirect
   *
   * @param sourceId - Thread to merge (will be marked as duplicate)
   * @param targetId - Thread to merge into (will remain active)
   * @param userId - User performing the merge (must be instructor/TA)
   * @returns Updated target thread with merge metadata
   *
   * @throws Error if threads not found, same thread, or user lacks permission
   *
   * @example
   * ```ts
   * const mergedThread = await threadsAPI.mergeThreads(
   *   "thread-duplicate-123",
   *   "thread-original-456",
   *   "instructor-789"
   * );
   * // Source thread marked as duplicate, redirects to target
   * // Target thread updated with mergedFrom: ["thread-duplicate-123"]
   * ```
   */
  async mergeThreads(
    sourceId: string,
    targetId: string,
    userId: string
  ): Promise<Thread> {
    // Check feature flag for backend
    if (BACKEND_FEATURE_FLAGS.threads) {
      try {
        // Call backend endpoint
        const mergedThread = await httpPost<Thread>('/api/v1/threads/merge', {
          sourceId,
          targetId,
        });
        return mergedThread;
      } catch (error) {
        console.error('[Threads] Backend mergeThreads failed:', error);
        // Fall through to localStorage fallback
      }
    }

    // Fallback to localStorage (existing implementation)
    await delay(300 + Math.random() * 200); // 300-500ms
    seedData();

    // Validate threads exist
    const sourceThread = getThreadById(sourceId);
    const targetThread = getThreadById(targetId);

    if (!sourceThread) {
      throw new Error(`Source thread not found: ${sourceId}`);
    }
    if (!targetThread) {
      throw new Error(`Target thread not found: ${targetId}`);
    }
    if (sourceId === targetId) {
      throw new Error("Cannot merge a thread with itself");
    }

    // Validate user has instructor or TA role
    const user = getUserById(userId);
    if (!user) {
      throw new Error(`User not found: ${userId}`);
    }
    if (user.role !== "instructor" && user.role !== "ta") {
      throw new Error("Only instructors and TAs can merge threads");
    }

    // Mark source thread as duplicate
    const updatedSource: Thread = {
      ...sourceThread,
      duplicatesOf: targetId,
      updatedAt: new Date().toISOString(),
    };
    updateThread(sourceId, updatedSource);

    // Update target thread with merge metadata
    const updatedTarget: Thread = {
      ...targetThread,
      mergedFrom: [...(targetThread.mergedFrom || []), sourceId],
      updatedAt: new Date().toISOString(),
    };
    updateThread(targetId, updatedTarget);

    return updatedTarget;
  },
};
