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
} from "@/lib/models/types";

import aiResponsesData from "@/mocks/ai-responses.json";
import { getSession } from "@/lib/session";
import { generateId } from "@/lib/id";
import {
  seedData,
  getThreads,
  getThread,
  getUsers,
  addThread,
  addPost,
  updateThreadStatus,
  togglePostEndorsement,
  togglePostFlag,
  deletePost,
  undoDeletePost,
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
};
