// ============================================
// Posts API Module
// ============================================
//
// Handles post creation and management
// Supports both backend (HTTP) and fallback (localStorage) modes via feature flags.

import type { Post, CreatePostInput } from "@/lib/models/types";

import { seedData, addPost, updateThread } from "@/lib/store/localStore";

import { delay, generateId } from "./utils";
import { useBackendFor } from "@/lib/config/features";
import { httpPost } from "./http.client";

/**
 * Posts API methods
 */
export const postsAPI = {
  /**
   * Create a new post (reply) in a thread
   *
   * Creates a reply post in a discussion thread and updates the thread's
   * timestamp to reflect the new activity.
   *
   * @param input - Post creation parameters (threadId, content)
   * @param authorId - ID of the user creating the post
   * @returns Created post object
   *
   * @example
   * ```ts
   * const newPost = await postsAPI.createPost(
   *   {
   *     threadId: "thread-123",
   *     content: "This is my reply to the question."
   *   },
   *   "user-456"
   * );
   * // Returns: { id: "post-...", threadId: "thread-123", authorId: "user-456", ... }
   * ```
   */
  async createPost(input: CreatePostInput, authorId: string): Promise<Post> {
    // Check feature flag for backend
    if (useBackendFor('posts')) {
      try {
        // Call backend endpoint
        const post = await httpPost<Post>('/api/v1/posts', {
          threadId: input.threadId,
          content: input.content,
        });
        return post;
      } catch (error) {
        console.error('[Posts] Backend createPost failed:', error);
        // Fall through to localStorage fallback
      }
    }

    // Fallback to localStorage (existing implementation)
    await delay(300 + Math.random() * 200); // 300-500ms
    seedData();

    const newPost: Post = {
      id: generateId("post"),
      threadId: input.threadId,
      authorId,
      content: input.content,
      endorsed: false,
      flagged: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addPost(newPost);

    // Update thread's updatedAt timestamp
    updateThread(input.threadId, { updatedAt: new Date().toISOString() });

    return newPost;
  },
};
