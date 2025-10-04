import type { Thread, Post, User, Session } from "@/lib/models/types";
import { TEST_ACCOUNTS } from "@/lib/session";
import threadsData from "@/mocks/threads.json";
import usersData from "@/mocks/users.json";

const KEYS = {
  users: "quokkaq.users",
  threads: "quokkaq.threads",
  initialized: "quokkaq.initialized",
} as const;

// In-memory recently deleted buffer for undo functionality
const recentlyDeleted = new Map<string, { post: Post; threadId: string; timestamp: number }>();
const UNDO_TIMEOUT = 10000; // 10 seconds

/**
 * Load data from localStorage
 */
function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;

  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch (error) {
    console.error(`Failed to load ${key} from localStorage:`, error);
    return fallback;
  }
}

/**
 * Save data to localStorage
 */
function saveToStorage<T>(key: string, data: T): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Failed to save ${key} to localStorage:`, error);
  }
}

/**
 * Seed initial data if not already initialized
 */
export function seedData(): void {
  const initialized = loadFromStorage(KEYS.initialized, false);

  if (!initialized) {
    // Add demo accounts to users
    const demoUsers = [
      { ...TEST_ACCOUNTS.student },
      { ...TEST_ACCOUNTS.instructor },
    ];

    // Combine with existing mock users
    const allUsers = [...demoUsers, ...(usersData as User[])];

    // Transform threads to add courseId and isAnonymous
    const threads = (threadsData as Array<Record<string, unknown>>).map((thread) => ({
      ...thread,
      courseId: thread.courseId || "course-demo-101",
      isAnonymous: thread.isAnonymous || false,
    }));

    saveToStorage(KEYS.users, allUsers);
    saveToStorage(KEYS.threads, threads);
    saveToStorage(KEYS.initialized, true);
  }
}

/**
 * Get all users
 */
export function getUsers(): User[] {
  return loadFromStorage<User[]>(KEYS.users, []);
}

/**
 * Get all threads
 */
export function getThreads(): Thread[] {
  return loadFromStorage<Thread[]>(KEYS.threads, []);
}

/**
 * Get threads by course ID
 */
export function getThreadsByCourse(courseId: string): Thread[] {
  const threads = getThreads();
  return threads.filter((t) => t.courseId === courseId);
}

/**
 * Get single thread by ID
 */
export function getThread(id: string): Thread | null {
  const threads = getThreads();
  return threads.find((t) => t.id === id) || null;
}

/**
 * Get posts by thread ID
 */
export function getPostsByThread(threadId: string): Post[] {
  const thread = getThread(threadId);
  return thread?.posts || [];
}

/**
 * Get posts created by a specific user
 */
export function getMyPosts(userId: string): Post[] {
  const threads = getThreads();
  const allPosts: Post[] = [];

  threads.forEach((thread) => {
    const userPosts = thread.posts.filter((post) => post.authorId === userId);
    allPosts.push(...userPosts);
  });

  return allPosts;
}

/**
 * Check if a user can delete a post
 * Students can delete their own posts (if no child replies)
 * Instructors can delete any post (if no child replies)
 */
export function canDeletePost(user: Session | null, post: Post): boolean {
  if (!user) return false;

  // Check if post has child replies
  const thread = getThreads().find((t) => t.id === post.threadId);
  if (!thread) return false;

  const hasChildReplies = thread.posts.some((p) => p.parentId === post.id);
  if (hasChildReplies) return false;

  // Instructors and TAs can delete any post
  if (user.role === "instructor" || user.role === "ta") {
    return true;
  }

  // Students can only delete their own posts
  return post.authorId === user.id;
}

/**
 * Save threads to localStorage
 */
function saveThreads(threads: Thread[]): void {
  saveToStorage(KEYS.threads, threads);
}

/**
 * Add a new thread
 */
export function addThread(thread: Thread): void {
  const threads = getThreads();
  threads.unshift(thread);
  saveThreads(threads);
}

/**
 * Update a thread
 */
export function updateThread(threadId: string, updates: Partial<Thread>): void {
  const threads = getThreads();
  const index = threads.findIndex((t) => t.id === threadId);

  if (index !== -1) {
    threads[index] = { ...threads[index], ...updates };
    saveThreads(threads);
  }
}

/**
 * Add a post to a thread
 */
export function addPost(threadId: string, post: Post): void {
  const threads = getThreads();
  const thread = threads.find((t) => t.id === threadId);

  if (thread) {
    thread.posts.push(post);
    thread.updatedAt = new Date().toISOString();
    saveThreads(threads);
  }
}

/**
 * Update a post
 */
export function updatePost(threadId: string, postId: string, updates: Partial<Post>): void {
  const threads = getThreads();
  const thread = threads.find((t) => t.id === threadId);

  if (thread) {
    const postIndex = thread.posts.findIndex((p) => p.id === postId);
    if (postIndex !== -1) {
      thread.posts[postIndex] = { ...thread.posts[postIndex], ...updates };
      saveThreads(threads);
    }
  }
}

/**
 * Delete a post (soft delete - moved to recentlyDeleted buffer)
 */
export function deletePost(threadId: string, postId: string): void {
  const threads = getThreads();
  const thread = threads.find((t) => t.id === threadId);

  if (thread) {
    const postIndex = thread.posts.findIndex((p) => p.id === postId);
    if (postIndex !== -1) {
      const post = thread.posts[postIndex];

      // Save to recently deleted buffer
      recentlyDeleted.set(postId, {
        post,
        threadId,
        timestamp: Date.now(),
      });

      // Remove from thread
      thread.posts.splice(postIndex, 1);
      thread.updatedAt = new Date().toISOString();
      saveThreads(threads);

      // Clear from buffer after timeout
      setTimeout(() => {
        recentlyDeleted.delete(postId);
      }, UNDO_TIMEOUT);
    }
  }
}

/**
 * Undo post deletion (restore from recentlyDeleted buffer)
 */
export function undoDeletePost(postId: string): boolean {
  const deleted = recentlyDeleted.get(postId);

  if (!deleted) return false;

  const { post, threadId } = deleted;
  const threads = getThreads();
  const thread = threads.find((t) => t.id === threadId);

  if (thread) {
    thread.posts.push(post);
    thread.updatedAt = new Date().toISOString();
    saveThreads(threads);
    recentlyDeleted.delete(postId);
    return true;
  }

  return false;
}

/**
 * Update thread status
 */
export function updateThreadStatus(threadId: string, status: Thread["status"]): void {
  updateThread(threadId, { status });
}

/**
 * Toggle post endorsement
 */
export function togglePostEndorsement(threadId: string, postId: string): void {
  const threads = getThreads();
  const thread = threads.find((t) => t.id === threadId);

  if (thread) {
    const post = thread.posts.find((p) => p.id === postId);
    if (post) {
      post.endorsed = !post.endorsed;
      saveThreads(threads);
    }
  }
}

/**
 * Toggle post flag
 */
export function togglePostFlag(threadId: string, postId: string): void {
  const threads = getThreads();
  const thread = threads.find((t) => t.id === threadId);

  if (thread) {
    const post = thread.posts.find((p) => p.id === postId);
    if (post) {
      post.flagged = !post.flagged;
      saveThreads(threads);
    }
  }
}
