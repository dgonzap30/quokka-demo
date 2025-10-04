import type {
  Thread,
  Post,
  User,
  Session,
  Course,
  Enrollment,
  Notification,
} from "@/lib/models/types";
import { TEST_ACCOUNTS } from "@/lib/session";
import threadsData from "@/mocks/threads.json";
import usersData from "@/mocks/users.json";
import coursesData from "@/mocks/courses.json";
import enrollmentsData from "@/mocks/enrollments.json";
import notificationsData from "@/mocks/notifications.json";

const KEYS = {
  users: "quokkaq.users",
  threads: "quokkaq.threads",
  initialized: "quokkaq.initialized",
  courses: "quokkaq.courses",
  enrollments: "quokkaq.enrollments",
  notifications: "quokkaq.notifications",
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
      courseId: thread.courseId || "course-cs101",
      isAnonymous: thread.isAnonymous || false,
    }));

    saveToStorage(KEYS.users, allUsers);
    saveToStorage(KEYS.threads, threads);
    saveToStorage(KEYS.courses, coursesData as Course[]);
    saveToStorage(KEYS.enrollments, enrollmentsData as Enrollment[]);
    saveToStorage(KEYS.notifications, notificationsData as Notification[]);
    saveToStorage(KEYS.initialized, true);
  }
}

/**
 * Get all users
 */
export function getUsers(): User[] {
  seedData(); // Ensure data is seeded
  return loadFromStorage<User[]>(KEYS.users, []);
}

/**
 * Get all threads
 */
export function getThreads(): Thread[] {
  seedData(); // Ensure data is seeded
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

/**
 * Get all courses
 */
export function getCourses(): Course[] {
  seedData(); // Ensure data is seeded
  return loadFromStorage<Course[]>(KEYS.courses, []);
}

/**
 * Get courses by IDs
 */
export function getCoursesByIds(ids: string[]): Course[] {
  const courses = getCourses();
  return courses.filter((c) => ids.includes(c.id));
}

/**
 * Get single course by ID
 */
export function getCourse(id: string): Course | null {
  const courses = getCourses();
  return courses.find((c) => c.id === id) || null;
}

/**
 * Get enrollments for a user
 */
export function getEnrollments(userId: string): Enrollment[] {
  seedData(); // Ensure data is seeded
  const enrollments = loadFromStorage<Enrollment[]>(KEYS.enrollments, []);
  return enrollments.filter((e) => e.userId === userId);
}

/**
 * Get user's enrolled courses
 */
export function getUserCourses(userId: string): Course[] {
  const enrollments = getEnrollments(userId);
  const courseIds = enrollments.map((e) => e.courseId);
  const courses = getCourses();
  return courses.filter((c) => courseIds.includes(c.id));
}

/**
 * Get all notifications, optionally filtered by user and/or course
 */
export function getNotifications(userId: string, courseId?: string): Notification[] {
  const notifications = loadFromStorage<Notification[]>(KEYS.notifications, []);

  let filtered = notifications.filter((n) => n.userId === userId);

  if (courseId) {
    filtered = filtered.filter((n) => n.courseId === courseId);
  }

  return filtered;
}

/**
 * Mark a notification as read
 */
export function markNotificationRead(notificationId: string): void {
  const notifications = loadFromStorage<Notification[]>(KEYS.notifications, []);
  const notification = notifications.find((n) => n.id === notificationId);

  if (notification) {
    notification.read = true;
    saveToStorage(KEYS.notifications, notifications);
  }
}

/**
 * Mark all notifications as read for a user, optionally filtered by course
 */
export function markAllNotificationsRead(userId: string, courseId?: string): void {
  const notifications = loadFromStorage<Notification[]>(KEYS.notifications, []);

  notifications.forEach((notification) => {
    if (notification.userId === userId) {
      if (!courseId || notification.courseId === courseId) {
        notification.read = true;
      }
    }
  });

  saveToStorage(KEYS.notifications, notifications);
}

/**
 * Add a new notification
 */
export function addNotification(notification: Notification): void {
  const notifications = loadFromStorage<Notification[]>(KEYS.notifications, []);
  notifications.unshift(notification);
  saveToStorage(KEYS.notifications, notifications);
}
