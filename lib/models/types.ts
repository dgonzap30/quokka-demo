// ============================================
// Core User Types
// ============================================

export type UserRole = "student" | "instructor" | "ta";

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;        // WARNING: Mock only! Production uses hashed passwords on backend
  role: UserRole;
  avatar?: string;
  createdAt: string;
}

// ============================================
// Authentication Types
// ============================================

/**
 * Represents an authenticated user session
 */
export interface AuthSession {
  user: User;              // Embedded user object for convenience
  token: string;           // Mock JWT token
  expiresAt: string;       // ISO 8601 timestamp
  createdAt: string;
}

/**
 * Authentication state for React context/hooks
 */
export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;           // null when not authenticated
  isLoading: boolean;          // true during login/logout/session restore
  error: string | null;        // null when no error
}

/**
 * Input for login authentication
 */
export interface LoginInput {
  email: string;
  password: string;
  rememberMe?: boolean;        // Optional: defaults to false
}

/**
 * Input for user registration
 */
export interface SignupInput {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;     // Frontend validation only
  role: UserRole;              // Reuses existing UserRole type
}

/**
 * Successful authentication response
 */
export interface AuthResponse {
  success: true;
  session: AuthSession;
  message?: string;            // Optional success message
}

/**
 * Authentication error response
 */
export interface AuthError {
  success: false;
  error: string;               // Human-readable error message
  code?: string;               // Optional error code (e.g., "INVALID_CREDENTIALS")
}

/**
 * Result of authentication operation (success or error)
 */
export type AuthResult = AuthResponse | AuthError;

// ============================================
// Type Guards for AuthResult
// ============================================

/**
 * Type guard to check if auth result is successful
 */
export function isAuthSuccess(result: AuthResult): result is AuthResponse {
  return result.success === true;
}

/**
 * Type guard to check if auth result is error
 */
export function isAuthError(result: AuthResult): result is AuthError {
  return result.success === false;
}

// ============================================
// Course & Enrollment Types
// ============================================

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
  role: UserRole;        // 'student' | 'instructor' | 'ta'
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

  // Trend data
  threadSparkline?: number[];       // 7-day thread creation trend
  activitySparkline?: number[];     // 7-day activity trend
  aiCoveragePercent?: number;       // % of threads with AI answers
}

// ============================================
// Thread & Post Types
// ============================================

export type ThreadStatus = 'open' | 'answered' | 'resolved';

export interface Thread {
  id: string;
  courseId: string;
  title: string;
  content: string;
  authorId: string;
  status: ThreadStatus;
  tags?: string[];
  views: number;
  createdAt: string;
  updatedAt: string;
}

export interface Post {
  id: string;
  threadId: string;
  authorId: string;
  content: string;
  endorsed: boolean;
  flagged: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Input for creating a new thread
 */
export interface CreateThreadInput {
  courseId: string;
  title: string;
  content: string;
  tags?: string[];
}

/**
 * Input for creating a new post/reply
 */
export interface CreatePostInput {
  threadId: string;
  content: string;
}

// ============================================
// Dashboard & Activity Types
// ============================================

/**
 * Types of activities that appear in activity feeds
 */
export type ActivityType =
  | 'thread_created'
  | 'post_created'
  | 'thread_resolved'
  | 'post_endorsed'
  | 'thread_answered';

/**
 * Activity feed item for student/instructor dashboards
 */
export interface ActivityItem {
  id: string;
  type: ActivityType;
  courseId: string;
  courseName: string;
  threadId: string;
  threadTitle: string;
  authorId: string;
  authorName: string;
  timestamp: string;
  summary: string;  // Human-readable description
}

/**
 * Course enriched with recent activity (student view)
 */
export interface CourseWithActivity extends Course {
  recentThreads: Thread[];
  unreadCount: number;
}

/**
 * Course enriched with metrics (instructor view)
 */
export interface CourseWithMetrics extends Course {
  metrics: CourseMetrics;
  insights?: CourseInsight;
}

/**
 * Student dashboard aggregated data
 */
export interface StudentDashboardData {
  enrolledCourses: CourseWithActivity[];
  recentActivity: ActivityItem[];
  notifications: Notification[];
  unreadCount: number;
  stats: {
    totalCourses: StatWithTrend;
    totalThreads: StatWithTrend;
    totalPosts: StatWithTrend;
    endorsedPosts: StatWithTrend;
  };
  goals: GoalProgress[];
}

/**
 * Instructor dashboard aggregated data
 */
export interface InstructorDashboardData {
  managedCourses: CourseWithMetrics[];
  unansweredQueue: Thread[];
  recentActivity: ActivityItem[];
  insights: CourseInsight[];
  stats: {
    totalCourses: StatWithTrend;
    totalThreads: StatWithTrend;
    unansweredThreads: StatWithTrend;
    activeStudents: StatWithTrend;
    aiCoverage: StatWithTrend;  // AI coverage percentage
  };
  goals: GoalProgress[];
}

/**
 * Dashboard data discriminated union
 */
export type DashboardData = StudentDashboardData | InstructorDashboardData;

// ============================================
// Dashboard Analytics & Trends
// ============================================

/**
 * A statistic with trend analysis compared to previous period
 */
export interface StatWithTrend {
  /** Current value (e.g., 12 threads) */
  value: number;

  /** Change from previous period (e.g., +3) */
  delta: number;

  /** Trend direction */
  trend: 'up' | 'down' | 'neutral';

  /** Percentage change (e.g., 15.5 for +15.5%) */
  trendPercent: number;

  /** Label for the statistic (e.g., "Threads", "Posts") */
  label: string;

  /** Optional sparkline data (7 daily values) */
  sparkline?: number[];
}

/**
 * Goal tracking with progress calculation
 */
export interface GoalProgress {
  /** Goal identifier (e.g., "weekly-participation") */
  id: string;

  /** Human-readable goal title */
  title: string;

  /** Detailed description */
  description: string;

  /** Current progress value */
  current: number;

  /** Target value to achieve */
  target: number;

  /** Progress percentage (0-100+) */
  progress: number;

  /** Whether goal is achieved */
  achieved: boolean;

  /** Time period for goal (e.g., "weekly", "monthly") */
  period: 'daily' | 'weekly' | 'monthly';

  /** Goal category (for filtering/grouping) */
  category: 'participation' | 'quality' | 'engagement' | 'response-time';
}

// ============================================
// Dashboard Type Guards
// ============================================

/**
 * Type guard for student dashboard data
 */
export function isStudentDashboard(data: DashboardData): data is StudentDashboardData {
  return 'enrolledCourses' in data && Array.isArray((data as StudentDashboardData).enrolledCourses);
}

/**
 * Type guard for instructor dashboard data
 */
export function isInstructorDashboard(data: DashboardData): data is InstructorDashboardData {
  return 'managedCourses' in data && Array.isArray((data as InstructorDashboardData).managedCourses);
}

/**
 * Type guard for activity type checking
 */
export function isActivityType(type: string): type is ActivityType {
  return ['thread_created', 'post_created', 'thread_resolved', 'post_endorsed', 'thread_answered'].includes(type);
}
