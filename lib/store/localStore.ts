import type { User, AuthSession, Course, Enrollment, Thread, Notification, Post, AIAnswer, ResponseTemplate } from "@/lib/models/types";

import usersData from "@/mocks/users.json";
import coursesData from "@/mocks/courses.json";
import enrollmentsData from "@/mocks/enrollments.json";
import threadsData from "@/mocks/threads.json";
import postsData from "@/mocks/posts.json";
import notificationsData from "@/mocks/notifications.json";
import aiAnswersData from "@/mocks/ai-answers.json";

/**
 * Mock data version - increment when mock data changes to force re-seed
 * This allows localStorage to update when we add/modify mock data
 */
const SEED_VERSION = 'v2.0.0';

const KEYS = {
  users: "quokkaq.users",
  authSession: "quokkaq.authSession",
  courses: "quokkaq.courses",
  enrollments: "quokkaq.enrollments",
  threads: "quokkaq.threads",
  posts: "quokkaq.posts",
  notifications: "quokkaq.notifications",
  aiAnswers: "quokkaq.aiAnswers",
  responseTemplates: "quokkaq.responseTemplates",
  seedVersion: "quokkaq.seedVersion",
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

  const currentVersion = localStorage.getItem(KEYS.seedVersion);
  if (currentVersion === SEED_VERSION) return; // Same version, skip

  try {
    const users = usersData as User[];
    const courses = coursesData as Course[];
    const enrollments = enrollmentsData as Enrollment[];
    const threads = threadsData as Thread[];
    const posts = postsData as Post[];
    const notifications = notificationsData as Notification[];
    const aiAnswers = aiAnswersData as unknown as AIAnswer[];

    localStorage.setItem(KEYS.users, JSON.stringify(users));
    localStorage.setItem(KEYS.courses, JSON.stringify(courses));
    localStorage.setItem(KEYS.enrollments, JSON.stringify(enrollments));
    localStorage.setItem(KEYS.threads, JSON.stringify(threads));
    localStorage.setItem(KEYS.posts, JSON.stringify(posts));
    localStorage.setItem(KEYS.notifications, JSON.stringify(notifications));
    localStorage.setItem(KEYS.aiAnswers, JSON.stringify(aiAnswers));
    localStorage.setItem(KEYS.seedVersion, SEED_VERSION);
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

// ============================================
// AI Answer Data Access
// ============================================

/**
 * Get all AI answers from localStorage
 */
export function getAIAnswers(): AIAnswer[] {
  if (typeof window === "undefined") return [];

  const data = localStorage.getItem(KEYS.aiAnswers);
  if (!data) return [];

  try {
    return JSON.parse(data) as AIAnswer[];
  } catch {
    return [];
  }
}

/**
 * Get AI answer by thread ID
 */
export function getAIAnswerByThread(threadId: string): AIAnswer | null {
  const aiAnswers = getAIAnswers();
  return aiAnswers.find((a) => a.threadId === threadId) ?? null;
}

/**
 * Get AI answer by ID
 */
export function getAIAnswerById(aiAnswerId: string): AIAnswer | null {
  const aiAnswers = getAIAnswers();
  return aiAnswers.find((a) => a.id === aiAnswerId) ?? null;
}

/**
 * Add new AI answer to localStorage
 */
export function addAIAnswer(aiAnswer: AIAnswer): void {
  if (typeof window === "undefined") return;

  const aiAnswers = getAIAnswers();
  aiAnswers.push(aiAnswer);
  localStorage.setItem(KEYS.aiAnswers, JSON.stringify(aiAnswers));
}

/**
 * Update existing AI answer in localStorage
 */
export function updateAIAnswer(aiAnswerId: string, updates: Partial<AIAnswer>): void {
  if (typeof window === "undefined") return;

  const aiAnswers = getAIAnswers();
  const index = aiAnswers.findIndex((a) => a.id === aiAnswerId);

  if (index !== -1) {
    aiAnswers[index] = { ...aiAnswers[index], ...updates };
    localStorage.setItem(KEYS.aiAnswers, JSON.stringify(aiAnswers));
  }
}

// ============================================
// Response Template Data Access (Instructor-Specific)
// ============================================

/**
 * Get all response templates from localStorage
 */
export function getResponseTemplates(): ResponseTemplate[] {
  if (typeof window === "undefined") return [];

  const data = localStorage.getItem(KEYS.responseTemplates);
  if (!data) {
    // Initialize empty array on first access
    localStorage.setItem(KEYS.responseTemplates, JSON.stringify([]));
    return [];
  }

  try {
    return JSON.parse(data) as ResponseTemplate[];
  } catch {
    return [];
  }
}

/**
 * Get response templates for a specific user
 */
export function getResponseTemplatesByUser(userId: string): ResponseTemplate[] {
  const templates = getResponseTemplates();
  return templates.filter((t) => t.userId === userId);
}

/**
 * Get response template by ID
 */
export function getResponseTemplateById(templateId: string): ResponseTemplate | null {
  const templates = getResponseTemplates();
  return templates.find((t) => t.id === templateId) ?? null;
}

/**
 * Add new response template
 */
export function addResponseTemplate(template: ResponseTemplate): void {
  if (typeof window === "undefined") return;

  const templates = getResponseTemplates();
  templates.push(template);
  localStorage.setItem(KEYS.responseTemplates, JSON.stringify(templates));
}

/**
 * Update existing response template
 */
export function updateResponseTemplate(templateId: string, updates: Partial<ResponseTemplate>): void {
  if (typeof window === "undefined") return;

  const templates = getResponseTemplates();
  const index = templates.findIndex((t) => t.id === templateId);

  if (index !== -1) {
    templates[index] = { ...templates[index], ...updates };
    localStorage.setItem(KEYS.responseTemplates, JSON.stringify(templates));
  }
}

/**
 * Delete response template
 */
export function deleteResponseTemplate(templateId: string): void {
  if (typeof window === "undefined") return;

  const templates = getResponseTemplates();
  const filtered = templates.filter((t) => t.id !== templateId);
  localStorage.setItem(KEYS.responseTemplates, JSON.stringify(filtered));
}

/**
 * Increment template usage count and update lastUsed timestamp
 */
export function incrementTemplateUsage(templateId: string): void {
  if (typeof window === "undefined") return;

  const templates = getResponseTemplates();
  const template = templates.find((t) => t.id === templateId);

  if (template) {
    template.usageCount = (template.usageCount || 0) + 1;
    template.lastUsed = new Date().toISOString();
    localStorage.setItem(KEYS.responseTemplates, JSON.stringify(templates));
  }
}
