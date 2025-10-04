import type { User, AuthSession, Course, Enrollment, Thread, Notification, Post } from "@/lib/models/types";

const KEYS = {
  users: "quokkaq.users",
  authSession: "quokkaq.authSession",
  courses: "quokkaq.courses",
  enrollments: "quokkaq.enrollments",
  threads: "quokkaq.threads",
  posts: "quokkaq.posts",
  notifications: "quokkaq.notifications",
  initialized: "quokkaq.initialized",
} as const;

// ============================================
// Initialization & Seeding
// ============================================

/**
 * Seed initial data from JSON files (runs once per browser)
 */
export function seedData(): void {
  if (typeof window === "undefined") return; // SSR guard

  const initialized = localStorage.getItem(KEYS.initialized);
  if (initialized) return; // Already seeded

  try {
    const users = require("@/mocks/users.json") as User[];
    const courses = require("@/mocks/courses.json") as Course[];
    const enrollments = require("@/mocks/enrollments.json") as Enrollment[];
    const threads = require("@/mocks/threads.json") as Thread[];
    const posts = require("@/mocks/posts.json") as Post[];

    localStorage.setItem(KEYS.users, JSON.stringify(users));
    localStorage.setItem(KEYS.courses, JSON.stringify(courses));
    localStorage.setItem(KEYS.enrollments, JSON.stringify(enrollments));
    localStorage.setItem(KEYS.threads, JSON.stringify(threads));
    localStorage.setItem(KEYS.posts, JSON.stringify(posts));
    localStorage.setItem(KEYS.notifications, JSON.stringify([])); // Empty notifications initially
    localStorage.setItem(KEYS.initialized, "true");
  } catch (error) {
    console.error("Failed to seed data:", error);
  }
}

// ============================================
// User Data Access
// ============================================

/**
 * Get all users from localStorage
 */
export function getUsers(): User[] {
  if (typeof window === "undefined") return [];

  const data = localStorage.getItem(KEYS.users);
  if (!data) return [];

  try {
    return JSON.parse(data) as User[];
  } catch {
    return [];
  }
}

/**
 * Get user by email
 */
export function getUserByEmail(email: string): User | null {
  const users = getUsers();
  return users.find((u) => u.email === email) ?? null;
}

/**
 * Get user by ID
 */
export function getUserById(id: string): User | null {
  const users = getUsers();
  return users.find((u) => u.id === id) ?? null;
}

/**
 * Validate credentials (mock password check)
 * WARNING: Production must use bcrypt/argon2 on backend
 */
export function validateCredentials(email: string, password: string): User | null {
  const user = getUserByEmail(email);
  if (!user) return null;

  // Plain text comparison for mock only
  if (user.password === password) {
    return user;
  }

  return null;
}

/**
 * Create new user
 */
export function createUser(user: User): void {
  const users = getUsers();
  users.push(user);
  localStorage.setItem(KEYS.users, JSON.stringify(users));
}

// ============================================
// Session Management
// ============================================

/**
 * Get current auth session
 */
export function getAuthSession(): AuthSession | null {
  if (typeof window === "undefined") return null;

  const data = localStorage.getItem(KEYS.authSession);
  if (!data) return null;

  try {
    const session = JSON.parse(data) as AuthSession;

    // Validate expiry
    if (new Date(session.expiresAt) < new Date()) {
      clearAuthSession();
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

/**
 * Set auth session
 */
export function setAuthSession(session: AuthSession): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEYS.authSession, JSON.stringify(session));
}

/**
 * Clear auth session
 */
export function clearAuthSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEYS.authSession);
}

/**
 * Check if session is valid (not expired)
 */
export function isSessionValid(session: AuthSession): boolean {
  return new Date(session.expiresAt) > new Date();
}

// ============================================
// Course Data Access
// ============================================

/**
 * Get all courses
 */
export function getCourses(): Course[] {
  if (typeof window === "undefined") return [];

  const data = localStorage.getItem(KEYS.courses);
  if (!data) return [];

  try {
    return JSON.parse(data) as Course[];
  } catch {
    return [];
  }
}

/**
 * Get course by ID
 */
export function getCourseById(id: string): Course | null {
  const courses = getCourses();
  return courses.find((c) => c.id === id) ?? null;
}

/**
 * Get enrollments for a user
 */
export function getEnrollments(userId: string): Enrollment[] {
  if (typeof window === "undefined") return [];

  const data = localStorage.getItem(KEYS.enrollments);
  if (!data) return [];

  try {
    const allEnrollments = JSON.parse(data) as Enrollment[];
    return allEnrollments.filter((e) => e.userId === userId);
  } catch {
    return [];
  }
}

// ============================================
// Thread Data Access
// ============================================

/**
 * Get all threads
 */
export function getThreads(): Thread[] {
  if (typeof window === "undefined") return [];

  const data = localStorage.getItem(KEYS.threads);
  if (!data) return [];

  try {
    return JSON.parse(data) as Thread[];
  } catch {
    return [];
  }
}

/**
 * Get threads by course ID
 */
export function getThreadsByCourse(courseId: string): Thread[] {
  const threads = getThreads();
  return threads.filter((t) => t.courseId === courseId);
}

/**
 * Get thread by ID
 */
export function getThreadById(id: string): Thread | null {
  const threads = getThreads();
  return threads.find((t) => t.id === id) ?? null;
}

/**
 * Add new thread
 */
export function addThread(thread: Thread): void {
  if (typeof window === "undefined") return;

  const threads = getThreads();
  threads.push(thread);
  localStorage.setItem(KEYS.threads, JSON.stringify(threads));
}

/**
 * Update thread
 */
export function updateThread(threadId: string, updates: Partial<Thread>): void {
  if (typeof window === "undefined") return;

  const threads = getThreads();
  const thread = threads.find((t) => t.id === threadId);

  if (thread) {
    Object.assign(thread, updates);
    localStorage.setItem(KEYS.threads, JSON.stringify(threads));
  }
}

// ============================================
// Post Data Access
// ============================================

/**
 * Get all posts
 */
export function getPosts(): Post[] {
  if (typeof window === "undefined") return [];

  const data = localStorage.getItem(KEYS.posts);
  if (!data) return [];

  try {
    return JSON.parse(data) as Post[];
  } catch {
    return [];
  }
}

/**
 * Get posts by thread ID
 */
export function getPostsByThread(threadId: string): Post[] {
  const posts = getPosts();
  return posts.filter((p) => p.threadId === threadId);
}

/**
 * Add new post
 */
export function addPost(post: Post): void {
  if (typeof window === "undefined") return;

  const posts = getPosts();
  posts.push(post);
  localStorage.setItem(KEYS.posts, JSON.stringify(posts));
}

// ============================================
// Notification Data Access
// ============================================

/**
 * Get notifications for a user
 */
export function getNotifications(userId: string, courseId?: string): Notification[] {
  if (typeof window === "undefined") return [];

  const data = localStorage.getItem(KEYS.notifications);
  if (!data) return [];

  try {
    const allNotifications = JSON.parse(data) as Notification[];
    let filtered = allNotifications.filter((n) => n.userId === userId);

    if (courseId) {
      filtered = filtered.filter((n) => n.courseId === courseId);
    }

    return filtered;
  } catch {
    return [];
  }
}

/**
 * Mark notification as read
 */
export function markNotificationRead(notificationId: string): void {
  if (typeof window === "undefined") return;

  const data = localStorage.getItem(KEYS.notifications);
  if (!data) return;

  try {
    const notifications = JSON.parse(data) as Notification[];
    const notification = notifications.find((n) => n.id === notificationId);

    if (notification) {
      notification.read = true;
      localStorage.setItem(KEYS.notifications, JSON.stringify(notifications));
    }
  } catch (error) {
    console.error("Failed to mark notification as read:", error);
  }
}

/**
 * Mark all notifications as read for a user (optionally filtered by course)
 */
export function markAllNotificationsRead(userId: string, courseId?: string): void {
  if (typeof window === "undefined") return;

  const data = localStorage.getItem(KEYS.notifications);
  if (!data) return;

  try {
    const notifications = JSON.parse(data) as Notification[];

    notifications.forEach((n) => {
      if (n.userId === userId && (!courseId || n.courseId === courseId)) {
        n.read = true;
      }
    });

    localStorage.setItem(KEYS.notifications, JSON.stringify(notifications));
  } catch (error) {
    console.error("Failed to mark notifications as read:", error);
  }
}
