import type {
  User,
  LoginInput,
  SignupInput,
  AuthResult,
  AuthSession,
  AuthError,
  Course,
  Enrollment,
  Thread,
  Post,
  Notification,
  CourseInsight,
  CourseMetrics,
  CreateThreadInput,
  CreatePostInput,
} from "@/lib/models/types";

import {
  seedData,
  getAuthSession,
  setAuthSession,
  clearAuthSession,
  getUserByEmail,
  validateCredentials,
  createUser,
  getCourses,
  getCourseById,
  getEnrollments,
  getThreads,
  getThreadsByCourse,
  getThreadById,
  addThread,
  updateThread,
  getPosts,
  getPostsByThread,
  addPost,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getUsers,
} from "@/lib/store/localStore";

// ============================================
// Helper Functions
// ============================================

/**
 * Simulates network delay for mock API
 */
function delay(ms?: number): Promise<void> {
  const baseDelay = ms ?? 200 + Math.random() * 300; // Default 200-500ms
  return new Promise((resolve) => setTimeout(resolve, baseDelay));
}

/**
 * Generates unique ID with prefix
 */
function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================
// API Client
// ============================================

/**
 * Mock API client for authentication
 *
 * WARNING: This is a mock implementation for frontend-only demos.
 * Production must use:
 * - bcrypt/argon2 for password hashing
 * - JWT tokens for sessions
 * - HTTPS only
 * - HTTP-only cookies
 * - CSRF protection
 */
export const api = {
  /**
   * Login with email and password
   */
  async login(input: LoginInput): Promise<AuthResult> {
    await delay(300 + Math.random() * 200); // 300-500ms

    seedData(); // Ensure data is seeded

    const user = validateCredentials(input.email, input.password);

    if (!user) {
      const error: AuthError = {
        success: false,
        error: "Invalid email or password",
        code: "INVALID_CREDENTIALS",
      };
      return error;
    }

    // Create session (7 days expiry for mock)
    const session: AuthSession = {
      user: {
        ...user,
        password: "", // Never expose password in session
      },
      token: `mock-token-${generateId("tok")}`,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
    };

    setAuthSession(session);

    return {
      success: true,
      session,
      message: "Login successful",
    };
  },

  /**
   * Register new user account
   */
  async signup(input: SignupInput): Promise<AuthResult> {
    await delay(400 + Math.random() * 200); // 400-600ms

    seedData(); // Ensure data is seeded

    // Check if user exists
    const existingUser = getUserByEmail(input.email);
    if (existingUser) {
      const error: AuthError = {
        success: false,
        error: "Email already registered",
        code: "USER_EXISTS",
      };
      return error;
    }

    // Validate passwords match
    if (input.password !== input.confirmPassword) {
      const error: AuthError = {
        success: false,
        error: "Passwords do not match",
        code: "VALIDATION_ERROR",
      };
      return error;
    }

    // Create new user
    const newUser: User = {
      id: generateId("user"),
      name: input.name,
      email: input.email,
      password: input.password, // Mock only - would hash in production
      role: input.role,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(input.name)}`,
      createdAt: new Date().toISOString(),
    };

    createUser(newUser);

    // Create session
    const session: AuthSession = {
      user: {
        ...newUser,
        password: "", // Never expose password
      },
      token: `mock-token-${generateId("tok")}`,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
    };

    setAuthSession(session);

    return {
      success: true,
      session,
      message: "Account created successfully",
    };
  },

  /**
   * Logout current user
   */
  async logout(): Promise<void> {
    await delay(50 + Math.random() * 50); // 50-100ms
    clearAuthSession();
  },

  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<User | null> {
    await delay(200 + Math.random() * 200); // 200-400ms

    const session = getAuthSession();
    if (!session) return null;

    return session.user;
  },

  /**
   * Restore session from localStorage
   */
  async restoreSession(): Promise<AuthSession | null> {
    await delay(100 + Math.random() * 100); // 100-200ms

    return getAuthSession();
  },

  // ============================================
  // Course API Methods
  // ============================================

  /**
   * Get all active courses
   */
  async getAllCourses(): Promise<Course[]> {
    await delay();
    seedData();

    const courses = getCourses();
    return courses
      .filter((c) => c.status === "active")
      .sort((a, b) => a.code.localeCompare(b.code));
  },

  /**
   * Get courses for a specific user
   */
  async getUserCourses(userId: string): Promise<Course[]> {
    await delay();
    seedData();

    const enrollments = getEnrollments(userId);
    const allCourses = getCourses();

    const courseIds = enrollments.map((e) => e.courseId);
    return allCourses
      .filter((c) => courseIds.includes(c.id) && c.status === "active")
      .sort((a, b) => a.code.localeCompare(b.code));
  },

  /**
   * Get course by ID
   */
  async getCourse(courseId: string): Promise<Course | null> {
    await delay();
    seedData();

    return getCourseById(courseId);
  },

  /**
   * Get threads for a course
   */
  async getCourseThreads(courseId: string): Promise<Thread[]> {
    await delay();
    seedData();

    const threads = getThreadsByCourse(courseId);
    return threads.sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  },

  /**
   * Get course metrics
   */
  async getCourseMetrics(courseId: string): Promise<CourseMetrics> {
    await delay(300 + Math.random() * 200); // 300-500ms
    seedData();

    const threads = getThreadsByCourse(courseId);
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Get unique student authors
    const users = getUsers();
    const studentAuthors = new Set(
      threads
        .map((t) => t.authorId)
        .filter((authorId) => {
          const user = users.find((u) => u.id === authorId);
          return user?.role === "student";
        })
    );

    const recentThreads = threads.filter(
      (t) => new Date(t.createdAt) >= sevenDaysAgo
    );

    return {
      threadCount: threads.length,
      unansweredCount: threads.filter((t) => t.status === "open").length,
      answeredCount: threads.filter((t) => t.status === "answered").length,
      resolvedCount: threads.filter((t) => t.status === "resolved").length,
      activeStudents: studentAuthors.size,
      recentActivity: recentThreads.length,
    };
  },

  /**
   * Get AI-generated course insights
   */
  async getCourseInsights(courseId: string): Promise<CourseInsight> {
    await delay(600 + Math.random() * 200); // 600-800ms (AI simulation)
    seedData();

    const threads = getThreadsByCourse(courseId);
    const activeThreads = threads.filter(
      (t) => t.status === "open" || t.status === "answered"
    ).length;

    // Get top questions by view count
    const topQuestions = threads
      .sort((a, b) => b.views - a.views)
      .slice(0, 5)
      .map((t) => t.title);

    // Get trending topics from tags
    const allTags = threads.flatMap((t) => t.tags || []);
    const tagCounts = allTags.reduce((acc, tag) => {
      acc[tag] = (acc[tag] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const trendingTopics = Object.entries(tagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([tag]) => tag);

    // Generate summary based on activity
    const unansweredCount = threads.filter((t) => t.status === "open").length;
    const summary =
      unansweredCount > 5
        ? `High activity with ${unansweredCount} open questions. Students are actively engaging with ${trendingTopics[0] || "course"} topics.`
        : `Moderate activity. Most questions are answered. Focus areas: ${trendingTopics.slice(0, 2).join(", ") || "general concepts"}.`;

    return {
      id: `insight-${courseId}-${Date.now()}`,
      courseId,
      summary,
      activeThreads,
      topQuestions,
      trendingTopics,
      generatedAt: new Date().toISOString(),
    };
  },

  // ============================================
  // Notification API Methods
  // ============================================

  /**
   * Get notifications for a user
   */
  async getNotifications(
    userId: string,
    courseId?: string
  ): Promise<Notification[]> {
    await delay(200 + Math.random() * 200); // 200-400ms
    seedData();

    const notifications = getNotifications(userId, courseId);
    return notifications.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  /**
   * Mark notification as read
   */
  async markNotificationRead(notificationId: string): Promise<void> {
    await delay(50); // Quick action
    seedData();

    markNotificationRead(notificationId);
  },

  /**
   * Mark all notifications as read
   */
  async markAllNotificationsRead(
    userId: string,
    courseId?: string
  ): Promise<void> {
    await delay(100);
    seedData();

    markAllNotificationsRead(userId, courseId);
  },

  // ============================================
  // Thread API Methods
  // ============================================

  /**
   * Get thread by ID with posts
   */
  async getThread(threadId: string): Promise<{ thread: Thread; posts: Post[] } | null> {
    await delay();
    seedData();

    const thread = getThreadById(threadId);
    if (!thread) return null;

    const posts = getPostsByThread(threadId);

    // Increment view count
    updateThread(threadId, { views: thread.views + 1 });

    return {
      thread: { ...thread, views: thread.views + 1 },
      posts: posts.sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      ),
    };
  },

  /**
   * Create new thread
   */
  async createThread(input: CreateThreadInput, authorId: string): Promise<Thread> {
    await delay(400 + Math.random() * 200); // 400-600ms
    seedData();

    const newThread: Thread = {
      id: `thread-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
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
    return newThread;
  },

  /**
   * Create new post/reply
   */
  async createPost(input: CreatePostInput, authorId: string): Promise<Post> {
    await delay(300 + Math.random() * 200); // 300-500ms
    seedData();

    const newPost: Post = {
      id: `post-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
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
