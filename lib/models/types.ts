/**
 * Core data types for QuokkaQ Demo
 * These mirror the shapes we'd expect from a real backend
 */

export type UserRole = 'student' | 'instructor' | 'ta';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export interface Citation {
  url: string;
  snippet: string;
  title?: string;
}

export type ConfidenceLevel = 'high' | 'medium' | 'low';

export interface AiAnswer {
  id: string;
  threadId: string;
  text: string;
  citations: Citation[];
  confidence: number;
  confidenceLevel: ConfidenceLevel;
  createdAt: string;
}

export type ThreadStatus = 'open' | 'answered' | 'resolved' | 'canonical';

export interface Post {
  id: string;
  threadId: string;
  parentId?: string | null;
  authorId: string | null;
  author: User | null;
  content: string;
  createdAt: string;
  updatedAt: string;
  isAnswer?: boolean;
  endorsed?: boolean;
  flagged?: boolean;
}

export interface Thread {
  id: string;
  courseId: string;
  title: string;
  content: string;
  isAnonymous: boolean;
  authorId: string;
  author: User;
  status: ThreadStatus;
  createdAt: string;
  updatedAt: string;
  posts: Post[];
  aiAnswer?: AiAnswer;
  tags?: string[];
  views: number;
  endorsed?: boolean;
}

export interface KbDoc {
  id: string;
  title: string;
  url: string;
  snippet: string;
  courseId: string;
}

export interface SimilarThread {
  id: string;
  title: string;
  similarity: number;
  hasAnswer: boolean;
}

export interface InstructorMetrics {
  unansweredCount: number;
  answeredToday: number;
  averageResponseTime: string;
  endorsedCount: number;
  flaggedCount: number;
  activeStudents: number;
}

/**
 * Represents an academic course
 */
export interface Course {
  id: string;
  code: string;          // e.g., "CS101", "MATH221"
  name: string;          // e.g., "Introduction to Computer Science"
  term: string;          // e.g., "Fall 2025", "Spring 2025"
  description: string;
  instructorIds: string[];
  enrollmentCount: number;
  status: 'active' | 'archived';
  createdAt: string;
}

/**
 * Represents a user's enrollment in a course
 */
export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  role: UserRole;        // Reuses existing UserRole type
  enrolledAt: string;
}

/**
 * Types of notifications in the system
 */
export type NotificationType =
  | 'new_thread'
  | 'new_post'
  | 'endorsed'
  | 'resolved'
  | 'flagged';

/**
 * Represents an activity notification for a user
 */
export interface Notification {
  id: string;
  userId: string;
  courseId: string;
  threadId?: string;     // Optional: some notifications aren't thread-specific
  type: NotificationType;
  content: string;       // Human-readable notification text
  read: boolean;
  createdAt: string;
}

/**
 * AI-generated insights for a course
 */
export interface CourseInsight {
  id: string;
  courseId: string;
  summary: string;                // Brief course activity summary
  activeThreads: number;
  topQuestions: string[];         // Array of popular thread titles
  trendingTopics: string[];       // Array of trending tags/topics
  generatedAt: string;
}

/**
 * Metrics for course activity and engagement
 */
export interface CourseMetrics {
  threadCount: number;
  unansweredCount: number;
  answeredCount: number;
  resolvedCount: number;
  activeStudents: number;         // Unique students who posted
  recentActivity: number;         // Threads created in last 7 days
}

export interface Session {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface CreateThreadInput {
  title: string;
  content: string;
  authorId: string;
  courseId?: string;
  isAnonymous?: boolean;
}

export interface CreatePostInput {
  threadId: string;
  content: string;
  authorId: string;
  parentId?: string | null;
  isAnswer?: boolean;
}

export interface AskQuestionInput {
  question: string;
  courseId?: string;
}
