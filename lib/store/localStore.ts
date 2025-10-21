import type { User, AuthSession, Course, Enrollment, Thread, Notification, Post, AIAnswer, ResponseTemplate, Assignment, CourseMaterial, AIConversation, AIMessage } from "@/lib/models/types";

import usersData from "@/mocks/users.json";
import coursesData from "@/mocks/courses.json";
import enrollmentsData from "@/mocks/enrollments.json";
import threadsData from "@/mocks/threads.json";
import postsData from "@/mocks/posts.json";
import notificationsData from "@/mocks/notifications.json";
import aiAnswersData from "@/mocks/ai-answers.json";
import assignmentsData from "@/mocks/assignments.json";
import courseMaterialsData from "@/mocks/course-materials.json";

/**
 * Mock data version - increment when mock data changes to force re-seed
 * This allows localStorage to update when we add/modify mock data
 */
const SEED_VERSION = 'v2.1.0';

const KEYS = {
  users: "quokkaq.users",
  authSession: "quokkaq.authSession",
  courses: "quokkaq.courses",
  enrollments: "quokkaq.enrollments",
  threads: "quokkaq.threads",
  posts: "quokkaq.posts",
  notifications: "quokkaq.notifications",
  aiAnswers: "quokkaq.aiAnswers",
  aiConversations: "quokkaq.aiConversations",
  conversationMessages: "quokkaq.conversationMessages",
  responseTemplates: "quokkaq.responseTemplates",
  assignments: "quokkaq.assignments",
  courseMaterials: "quokkaq.courseMaterials",
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
    let posts = postsData as Post[];
    const notifications = notificationsData as Notification[];
    const aiAnswers = aiAnswersData as unknown as AIAnswer[];
    const assignments = assignmentsData.assignments as Assignment[];
    const courseMaterials = courseMaterialsData as CourseMaterial[];

    // Backfill endorsement data for existing posts
    posts = posts.map(post => {
      if (post.endorsed && !post.endorsedBy) {
        // Randomly assign endorser (instructor or peer)
        const isInstructorEndorsement = Math.random() > 0.7;
        if (isInstructorEndorsement) {
          return {
            ...post,
            endorsedBy: ['user-instructor-1'],
            instructorEndorsed: true,
          };
        } else {
          // Random peer endorsers (1-3 students)
          const endorserCount = 1 + Math.floor(Math.random() * 3);
          const endorsers: string[] = [];
          for (let i = 0; i < endorserCount; i++) {
            const endorserId = `user-student-${2 + i}`;
            if (endorserId !== post.authorId) {
              endorsers.push(endorserId);
            }
          }
          return {
            ...post,
            endorsedBy: endorsers,
            instructorEndorsed: false,
          };
        }
      }
      return post;
    });

    localStorage.setItem(KEYS.users, JSON.stringify(users));
    localStorage.setItem(KEYS.courses, JSON.stringify(courses));
    localStorage.setItem(KEYS.enrollments, JSON.stringify(enrollments));
    localStorage.setItem(KEYS.threads, JSON.stringify(threads));
    localStorage.setItem(KEYS.posts, JSON.stringify(posts));
    localStorage.setItem(KEYS.notifications, JSON.stringify(notifications));
    localStorage.setItem(KEYS.aiAnswers, JSON.stringify(aiAnswers));
    localStorage.setItem(KEYS.assignments, JSON.stringify(assignments));
    localStorage.setItem(KEYS.courseMaterials, JSON.stringify(courseMaterials));
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
// AI Conversations Data Access
// ============================================

/**
 * Get all AI conversations from localStorage
 */
export function getAIConversations(): AIConversation[] {
  if (typeof window === "undefined") return [];

  const data = localStorage.getItem(KEYS.aiConversations);
  if (!data) {
    // Initialize empty array on first access
    localStorage.setItem(KEYS.aiConversations, JSON.stringify([]));
    return [];
  }

  try {
    return JSON.parse(data) as AIConversation[];
  } catch {
    return [];
  }
}

/**
 * Get AI conversations for a specific user
 */
export function getUserConversations(userId: string): AIConversation[] {
  const conversations = getAIConversations();
  return conversations
    .filter((c) => c.userId === userId)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

/**
 * Get conversation by ID
 */
export function getConversationById(conversationId: string): AIConversation | null {
  const conversations = getAIConversations();
  return conversations.find((c) => c.id === conversationId) ?? null;
}

/**
 * Add new conversation
 */
export function addConversation(conversation: AIConversation): void {
  if (typeof window === "undefined") return;

  const conversations = getAIConversations();
  conversations.push(conversation);
  localStorage.setItem(KEYS.aiConversations, JSON.stringify(conversations));
}

/**
 * Update conversation
 */
export function updateConversation(conversationId: string, updates: Partial<AIConversation>): void {
  if (typeof window === "undefined") return;

  const conversations = getAIConversations();
  const index = conversations.findIndex((c) => c.id === conversationId);

  if (index !== -1) {
    conversations[index] = { ...conversations[index], ...updates };
    localStorage.setItem(KEYS.aiConversations, JSON.stringify(conversations));
  }
}

/**
 * Delete conversation
 */
export function deleteConversation(conversationId: string): void {
  if (typeof window === "undefined") return;

  const conversations = getAIConversations();
  const filtered = conversations.filter((c) => c.id !== conversationId);
  localStorage.setItem(KEYS.aiConversations, JSON.stringify(filtered));

  // Also delete associated messages
  const messages = getConversationMessages(conversationId);
  const allMessages = getAllConversationMessages();
  const filteredMessages = allMessages.filter(
    (m) => !messages.find((msg) => msg.id === m.id)
  );
  localStorage.setItem(KEYS.conversationMessages, JSON.stringify(filteredMessages));
}

// ============================================
// Storage Quota Management
// ============================================

/**
 * Maximum messages to keep per conversation (sliding window)
 * Prevents localStorage quota exceeded errors
 *
 * Rationale:
 * - Average message size: ~1KB (including citations)
 * - 100 messages = ~100KB per conversation
 * - Allows ~50 active conversations before hitting 5MB quota
 * - Preserves recent context while preventing unbounded growth
 */
const MAX_MESSAGES_PER_CONVERSATION = 100;

/**
 * Calculate approximate localStorage usage in KB
 */
export function getStorageUsage(): { totalKB: number; messagesKB: number; percentage: number } {
  if (typeof window === "undefined") return { totalKB: 0, messagesKB: 0, percentage: 0 };

  let totalSize = 0;
  let messagesSize = 0;

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;

    const value = localStorage.getItem(key) || '';
    const size = new Blob([value]).size;
    totalSize += size;

    if (key === KEYS.conversationMessages) {
      messagesSize = size;
    }
  }

  // Most browsers limit localStorage to 5-10MB
  const quotaKB = 5 * 1024; // Conservative 5MB
  return {
    totalKB: Math.round(totalSize / 1024),
    messagesKB: Math.round(messagesSize / 1024),
    percentage: Math.round((totalSize / (quotaKB * 1024)) * 100),
  };
}

/**
 * Prune old messages from a conversation to enforce quota
 * Keeps most recent MAX_MESSAGES_PER_CONVERSATION messages
 */
function pruneConversationMessages(conversationId: string, allMessages: AIMessage[]): AIMessage[] {
  const conversationMessages = allMessages
    .filter((m) => m.conversationId === conversationId)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  if (conversationMessages.length <= MAX_MESSAGES_PER_CONVERSATION) {
    return allMessages; // No pruning needed
  }

  // Keep only the most recent MAX_MESSAGES_PER_CONVERSATION messages
  const toKeep = conversationMessages.slice(-MAX_MESSAGES_PER_CONVERSATION);
  const toKeepIds = new Set(toKeep.map((m) => m.id));

  // Return all messages except the pruned ones
  return allMessages.filter((m) =>
    m.conversationId !== conversationId || toKeepIds.has(m.id)
  );
}

/**
 * Manually purge old messages across all conversations
 * Call this when storage usage is high
 *
 * @returns Number of messages deleted
 */
export function purgeOldMessages(): number {
  if (typeof window === "undefined") return 0;

  const allMessages = getAllConversationMessages();
  const beforeCount = allMessages.length;

  // Get all unique conversation IDs
  const conversationIds = Array.from(new Set(allMessages.map((m) => m.conversationId)));

  // Prune each conversation
  let prunedMessages = allMessages;
  for (const conversationId of conversationIds) {
    prunedMessages = pruneConversationMessages(conversationId, prunedMessages);
  }

  // Save pruned messages
  localStorage.setItem(KEYS.conversationMessages, JSON.stringify(prunedMessages));

  const afterCount = prunedMessages.length;
  const deletedCount = beforeCount - afterCount;

  console.log(`[Storage] Purged ${deletedCount} old messages (${beforeCount} → ${afterCount})`);
  return deletedCount;
}

/**
 * Get all conversation messages from localStorage
 */
export function getAllConversationMessages(): AIMessage[] {
  if (typeof window === "undefined") return [];

  const data = localStorage.getItem(KEYS.conversationMessages);
  if (!data) {
    // Initialize empty array on first access
    localStorage.setItem(KEYS.conversationMessages, JSON.stringify([]));
    return [];
  }

  try {
    return JSON.parse(data) as AIMessage[];
  } catch {
    return [];
  }
}

/**
 * Get messages for a specific conversation
 */
export function getConversationMessages(conversationId: string): AIMessage[] {
  const messages = getAllConversationMessages();
  return messages
    .filter((m) => m.conversationId === conversationId)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

/**
 * Add message to conversation with automatic quota management
 *
 * Enforces MAX_MESSAGES_PER_CONVERSATION limit by pruning old messages
 * when the conversation exceeds the quota.
 */
export function addMessage(message: AIMessage): void {
  if (typeof window === "undefined") return;

  let messages = getAllConversationMessages();

  // Check for duplicate ID before adding
  const isDuplicate = messages.some((m) => m.id === message.id);
  if (isDuplicate) {
    console.warn(`[localStore] Attempted to add duplicate message ID: ${message.id}`);
    return; // Skip adding duplicate
  }

  messages.push(message);

  // Enforce quota for this conversation
  messages = pruneConversationMessages(message.conversationId, messages);

  localStorage.setItem(KEYS.conversationMessages, JSON.stringify(messages));

  // Update conversation's updatedAt and messageCount
  const conversation = getConversationById(message.conversationId);
  if (conversation) {
    const conversationMessages = messages.filter((m) => m.conversationId === message.conversationId);
    updateConversation(message.conversationId, {
      updatedAt: message.timestamp,
      messageCount: conversationMessages.length, // Accurate count after pruning
    });
  }
}

/**
 * Delete message from conversation
 */
export function deleteMessage(messageId: string): void {
  if (typeof window === "undefined") return;

  const messages = getAllConversationMessages();
  const filtered = messages.filter((m) => m.id !== messageId);
  localStorage.setItem(KEYS.conversationMessages, JSON.stringify(filtered));
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

// ============================================
// Assignment Data Access
// ============================================

/**
 * Get all assignments from localStorage
 */
export function getAssignments(): Assignment[] {
  if (typeof window === "undefined") return [];

  const data = localStorage.getItem(KEYS.assignments);
  if (!data) return [];

  try {
    return JSON.parse(data) as Assignment[];
  } catch {
    return [];
  }
}

/**
 * Get assignment by ID
 */
export function getAssignment(assignmentId: string): Assignment | null {
  const assignments = getAssignments();
  return assignments.find((a) => a.id === assignmentId) ?? null;
}

/**
 * Get assignments by course ID
 */
export function getAssignmentsByCourse(courseId: string): Assignment[] {
  const assignments = getAssignments();
  return assignments.filter((a) => a.courseId === courseId);
}

// ============================================
// Course Materials Data Access
// ============================================

/**
 * Get all course materials from localStorage
 */
export function getCourseMaterials(): CourseMaterial[] {
  if (typeof window === "undefined") return [];

  const data = localStorage.getItem(KEYS.courseMaterials);
  if (!data) return [];

  try {
    return JSON.parse(data) as CourseMaterial[];
  } catch {
    return [];
  }
}

/**
 * Get course materials by course ID
 */
export function getCourseMaterialsByCourse(courseId: string): CourseMaterial[] {
  const materials = getCourseMaterials();
  return materials.filter((m) => m.courseId === courseId);
}

/**
 * Get course material by ID
 */
export function getCourseMaterialById(materialId: string): CourseMaterial | null {
  const materials = getCourseMaterials();
  return materials.find((m) => m.id === materialId) ?? null;
}
