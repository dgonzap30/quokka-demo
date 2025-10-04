import type {
  Thread,
  User,
  Post,
  AiAnswer,
  CreateThreadInput,
  CreatePostInput,
  AskQuestionInput,
  SimilarThread,
  InstructorMetrics,
  Course,
  Enrollment,
  Notification,
  CourseInsight,
  CourseMetrics,
} from "@/lib/models/types";

import aiResponsesData from "@/mocks/ai-responses.json";
import { getSession } from "@/lib/session";
import { generateId } from "@/lib/id";
import {
  seedData,
  getThreads,
  getThread,
  getThreadsByCourse,
  getUsers,
  addThread,
  addPost,
  updateThreadStatus,
  togglePostEndorsement,
  togglePostFlag,
  deletePost,
  undoDeletePost,
  getCourses,
  getUserCourses,
  getEnrollments,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/lib/store/localStore";

// Simulated network delay
const delay = (ms: number = 200 + Math.random() * 300) =>
  new Promise((resolve) => setTimeout(resolve, ms));

// Initialize data on first import
seedData();

/**
 * Helper to populate author objects in threads
 */
function hydrateThread(thread: Record<string, unknown>): Thread {
  const users = getUsers();
  const author = users.find((u) => u.id === thread.authorId);

  const posts = ((thread.posts as Array<Record<string, unknown>>) || []).map((post) => ({
    ...post,
    author: post.authorId ? users.find((u) => u.id === post.authorId) || null : null,
  })) as Post[];

  return {
    ...thread,
    author: author || {
      id: thread.authorId as string,
      name: "Unknown User",
      email: "unknown@demo.local",
      role: "student",
    },
    posts,
  } as Thread;
}

// API Client
export const api = {
  // Threads
  async getThreads(): Promise<Thread[]> {
    await delay();
    const threads = getThreads();
    return threads
      .map((t) => hydrateThread(t as unknown as Record<string, unknown>))
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
  },

  async getThread(id: string): Promise<Thread | null> {
    await delay();
    const thread = getThread(id);
    if (!thread) return null;
    return hydrateThread(thread as unknown as Record<string, unknown>);
  },

  async createThread(input: CreateThreadInput): Promise<Thread> {
    await delay();
    const users = getUsers();
    const author = users.find((u) => u.id === input.authorId);

    if (!author) {
      throw new Error("Author not found");
    }

    const newThread: Thread = {
      id: generateId("thread"),
      courseId: input.courseId || "course-demo-101",
      title: input.title,
      content: input.content,
      isAnonymous: input.isAnonymous || false,
      authorId: input.authorId,
      author,
      status: "open",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      posts: [],
      tags: [],
      views: 0,
    };

    addThread(newThread);
    return newThread;
  },

  async createPost(input: CreatePostInput): Promise<Post> {
    await delay();
    const thread = getThread(input.threadId);

    if (!thread) throw new Error("Thread not found");

    const users = getUsers();
    const author = users.find((u) => u.id === input.authorId);

    if (!author) {
      throw new Error("Author not found");
    }

    const newPost: Post = {
      id: generateId("post"),
      threadId: input.threadId,
      parentId: input.parentId || null,
      authorId: input.authorId,
      author,
      content: input.content,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isAnswer: input.isAnswer,
    };

    addPost(input.threadId, newPost);

    // Update thread status if marked as answer
    if (input.isAnswer && thread.status === "open") {
      updateThreadStatus(input.threadId, "answered");
    }

    return newPost;
  },

  async endorsePost(postId: string): Promise<void> {
    await delay(100);

    const threads = getThreads();
    for (const thread of threads) {
      const post = thread.posts.find((p) => p.id === postId);
      if (post) {
        togglePostEndorsement(thread.id, postId);
        return;
      }
    }
  },

  async flagPost(postId: string): Promise<void> {
    await delay(100);

    const threads = getThreads();
    for (const thread of threads) {
      const post = thread.posts.find((p) => p.id === postId);
      if (post) {
        togglePostFlag(thread.id, postId);
        return;
      }
    }
  },

  async resolveThread(threadId: string): Promise<void> {
    await delay(100);
    updateThreadStatus(threadId, "resolved");
  },

  async updateThreadStatus(
    threadId: string,
    status: Thread["status"]
  ): Promise<void> {
    await delay(100);
    updateThreadStatus(threadId, status);
  },

  async deletePost(postId: string): Promise<void> {
    await delay(100);

    const threads = getThreads();
    for (const thread of threads) {
      const post = thread.posts.find((p) => p.id === postId);
      if (post) {
        deletePost(thread.id, postId);
        return;
      }
    }

    throw new Error("Post not found");
  },

  async undoDeletePost(postId: string): Promise<boolean> {
    await delay(50);
    return undoDeletePost(postId);
  },

  // AI
  async askQuestion(input: AskQuestionInput): Promise<AiAnswer> {
    await delay(800); // Longer delay for "AI thinking"

    const question = input.question.toLowerCase();
    const responses = aiResponsesData.responses as Record<
      string,
      {
        text: string;
        citations: unknown[];
        confidence: number;
        confidenceLevel: string;
      }
    >;

    // Try to match question to a response
    let response = responses.default;
    for (const [key, value] of Object.entries(responses)) {
      if (question.includes(key)) {
        response = value;
        break;
      }
    }

    return {
      id: generateId("ai"),
      threadId: "",
      text: response.text,
      citations: response.citations,
      confidence: response.confidence,
      confidenceLevel: response.confidenceLevel,
      createdAt: new Date().toISOString(),
    } as AiAnswer;
  },

  async getSimilarThreads(query: string): Promise<SimilarThread[]> {
    await delay(300);

    const q = query.toLowerCase();
    const similarQuestions = aiResponsesData.similarQuestions as Record<
      string,
      unknown[]
    >;

    // Try to match query to similar questions
    for (const [key, value] of Object.entries(similarQuestions)) {
      if (q.includes(key)) {
        return value as SimilarThread[];
      }
    }

    return [];
  },

  // Instructor
  async getInstructorMetrics(): Promise<InstructorMetrics> {
    await delay();
    const threads = getThreads();

    const unansweredThreads = threads.filter((t) => t.status === "open");
    const answeredToday = threads.filter((t) => {
      const today = new Date().toDateString();
      return (
        (t.status === "answered" || t.status === "canonical") &&
        new Date(t.updatedAt).toDateString() === today
      );
    });

    const endorsedPosts = threads.flatMap((t) =>
      t.posts.filter((p) => p.endorsed)
    );
    const flaggedPosts = threads.flatMap((t) => t.posts.filter((p) => p.flagged));

    const uniqueStudents = new Set(threads.map((t) => t.authorId)).size;

    return {
      unansweredCount: unansweredThreads.length,
      answeredToday: answeredToday.length,
      averageResponseTime: "2.5 hours",
      endorsedCount: endorsedPosts.length,
      flaggedCount: flaggedPosts.length,
      activeStudents: uniqueStudents,
    };
  },

  async getUnansweredThreads(): Promise<Thread[]> {
    await delay();
    const threads = getThreads();
    return threads
      .filter((t) => t.status === "open")
      .map((t) => hydrateThread(t as unknown as Record<string, unknown>));
  },

  // Users
  async getCurrentUser(): Promise<User | null> {
    await delay(50);
    const session = getSession();

    if (!session) {
      return null;
    }

    return {
      id: session.id,
      name: session.name,
      email: session.email,
      role: session.role,
    };
  },

  // Courses
  async getAllCourses(): Promise<Course[]> {
    await delay();
    const courses = getCourses();
    return courses
      .filter((c) => c.status === "active")
      .sort((a, b) => a.code.localeCompare(b.code));
  },

  async getUserCourses(userId: string): Promise<Course[]> {
    await delay();
    const userCourses = getUserCourses(userId);
    return userCourses
      .filter((c) => c.status === "active")
      .sort((a, b) => a.code.localeCompare(b.code));
  },

  async getEnrollments(userId: string): Promise<Enrollment[]> {
    await delay();
    return getEnrollments(userId);
  },

  async getCourseThreads(courseId: string): Promise<Thread[]> {
    await delay();
    const threads = getThreadsByCourse(courseId);
    return threads
      .map((t) => hydrateThread(t as unknown as Record<string, unknown>))
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
  },

  // Notifications
  async getNotifications(
    userId: string,
    courseId?: string
  ): Promise<Notification[]> {
    await delay(200 + Math.random() * 200); // 200-400ms
    const notifications = getNotifications(userId, courseId);
    return notifications.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  async markNotificationRead(notificationId: string): Promise<void> {
    await delay(50); // Quick action
    markNotificationRead(notificationId);
  },

  async markAllNotificationsRead(
    userId: string,
    courseId?: string
  ): Promise<void> {
    await delay(100);
    markAllNotificationsRead(userId, courseId);
  },

  // Course Insights & Metrics
  async getCourseInsights(courseId: string): Promise<CourseInsight> {
    await delay(600 + Math.random() * 200); // 600-800ms (AI simulation)

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
    const tagCounts = allTags.reduce(
      (acc, tag) => {
        acc[tag] = (acc[tag] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

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
      id: generateId("insight"),
      courseId,
      summary,
      activeThreads,
      topQuestions,
      trendingTopics,
      generatedAt: new Date().toISOString(),
    };
  },

  async getCourseMetrics(courseId: string): Promise<CourseMetrics> {
    await delay();

    const threads = getThreadsByCourse(courseId);
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const unansweredCount = threads.filter((t) => t.status === "open").length;
    const answeredCount = threads.filter((t) => t.status === "answered").length;
    const resolvedCount = threads.filter((t) => t.status === "resolved").length;

    const recentActivity = threads.filter(
      (t) => new Date(t.createdAt) > oneWeekAgo
    ).length;

    // Count unique students who have posted
    const uniqueStudents = new Set(
      threads.flatMap((t) => [t.authorId, ...t.posts.map((p) => p.authorId)])
    ).size;

    return {
      threadCount: threads.length,
      unansweredCount,
      answeredCount,
      resolvedCount,
      activeStudents: uniqueStudents,
      recentActivity,
    };
  },
};
