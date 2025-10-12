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
  | 'flagged'
  | 'ai_answer_ready'
  | 'ai_answer_endorsed';

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
  hasAIAnswer?: boolean;
  aiAnswerId?: string;
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

// ============================================
// AI Answer Types
// ============================================

/**
 * Confidence level for AI-generated answers
 */
export type ConfidenceLevel = 'high' | 'medium' | 'low';

/**
 * Source types for AI answer citations
 */
export type CitationSourceType =
  | 'lecture'
  | 'textbook'
  | 'slides'
  | 'lab'
  | 'assignment'
  | 'reading';

/**
 * Citation reference to course material
 */
export interface Citation {
  /** Unique identifier for the citation */
  id: string;

  /** Type of course material */
  sourceType: CitationSourceType;

  /** Name/title of the source (e.g., "Lecture 5: Binary Search") */
  source: string;

  /** Relevant excerpt from the source material */
  excerpt: string;

  /** Relevance score 0-100 (how well it supports the answer) */
  relevance: number;

  /** Optional link to course material (mock for demo) */
  link?: string;
}

/**
 * AI-generated answer for a thread question
 *
 * Generated automatically when a thread is created.
 * Includes confidence scoring, citations to course materials,
 * and instructor/peer endorsement tracking.
 */
export interface AIAnswer {
  /** Unique identifier for the AI answer */
  id: string;

  /** ID of the thread this answer belongs to */
  threadId: string;

  /** Course ID (for context-aware generation) */
  courseId: string;

  /** AI-generated answer content (rich text/markdown) */
  content: string;

  /** Confidence level (categorical) */
  confidenceLevel: ConfidenceLevel;

  /** Confidence score (0-100 numeric) */
  confidenceScore: number;

  /** Array of citations to course materials */
  citations: Citation[];

  /** Number of student endorsements */
  studentEndorsements: number;

  /** Number of instructor endorsements */
  instructorEndorsements: number;

  /** Total endorsement count (for sorting) */
  totalEndorsements: number;

  /** Array of user IDs who have endorsed (prevent double-endorsement) */
  endorsedBy: string[];

  /** Whether any instructor has endorsed */
  instructorEndorsed: boolean;

  /** ISO 8601 timestamp when generated */
  generatedAt: string;

  /** ISO 8601 timestamp when last updated */
  updatedAt: string;
}

/**
 * Input for generating an AI answer
 */
export interface GenerateAIAnswerInput {
  /** Thread to generate answer for */
  threadId: string;

  /** Course context for answer generation */
  courseId: string;

  /** Question title */
  title: string;

  /** Question content/details */
  content: string;

  /** Optional tags for context */
  tags?: string[];
}

/**
 * Input for endorsing an AI answer
 */
export interface EndorseAIAnswerInput {
  /** AI answer ID to endorse */
  aiAnswerId: string;

  /** User ID of the endorser */
  userId: string;

  /** Whether the endorser is an instructor */
  isInstructor: boolean;
}

/**
 * Thread enriched with AI answer data
 */
export interface ThreadWithAIAnswer extends Thread {
  /** The associated AI answer */
  aiAnswer: AIAnswer;
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
  | 'thread_answered'
  | 'ai_answer_generated'
  | 'ai_answer_endorsed';

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

  // NEW: Optional instructor-specific features
  /** Priority-ranked questions requiring attention */
  priorityQueue?: InstructorInsight[];

  /** Frequently asked question clusters */
  frequentlyAsked?: FrequentlyAskedQuestion[];

  /** Trending topics across courses */
  trendingTopics?: TrendingTopic[];

  /** Instructor's saved response templates */
  responseTemplates?: ResponseTemplate[];
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
  return ['thread_created', 'post_created', 'thread_resolved', 'post_endorsed', 'thread_answered', 'ai_answer_generated', 'ai_answer_endorsed'].includes(type);
}

// ============================================
// AI Answer Type Guards
// ============================================

/**
 * Type guard to check if AI answer has high confidence
 */
export function isHighConfidence(answer: AIAnswer): boolean {
  return answer.confidenceLevel === 'high' && answer.confidenceScore >= 70;
}

/**
 * Type guard to check if AI answer has valid citations
 */
export function hasValidCitations(answer: AIAnswer, minCount: number = 3): boolean {
  return answer.citations.length >= minCount && answer.citations.every((c) => c.relevance >= 50);
}

/**
 * Type guard to check if thread has AI answer
 */
export function hasAIAnswer(thread: Thread): thread is Required<Pick<Thread, 'hasAIAnswer' | 'aiAnswerId'>> & Thread {
  return thread.hasAIAnswer === true && thread.aiAnswerId !== undefined;
}

// ============================================
// Conversation & Message Types
// ============================================

/**
 * Chat message for FloatingQuokka conversations
 */
export interface Message {
  /** Unique message identifier */
  id: string;

  /** Message sender role */
  role: "user" | "assistant";

  /** Message text content */
  content: string;

  /** Message timestamp */
  timestamp: Date;
}

/**
 * Metadata extracted from a conversation
 */
export interface ConversationMetadata {
  /** Number of messages in conversation */
  messageCount: number;

  /** Number of user messages */
  userMessageCount: number;

  /** Number of assistant messages */
  assistantMessageCount: number;

  /** First message timestamp */
  startedAt: Date;

  /** Last message timestamp */
  lastMessageAt: Date;
}

/**
 * Message formatted for display/preview
 */
export interface FormattedMessage {
  /** Message role label (e.g., "You", "Quokka") */
  roleLabel: string;

  /** Message content */
  content: string;

  /** ISO 8601 timestamp string */
  timestamp: string;
}

/**
 * Input for converting conversation to thread
 */
export interface ConversationToThreadInput {
  /** Array of conversation messages */
  messages: Message[];

  /** Target course ID */
  courseId: string;

  /** Course code (for context) */
  courseCode: string;
}

/**
 * Result of conversation-to-thread conversion
 */
export interface ConversationToThreadResult {
  /** CreateThreadInput ready for API */
  threadInput: CreateThreadInput;

  /** Formatted messages for preview */
  formattedMessages: FormattedMessage[];

  /** Conversation metadata */
  metadata: ConversationMetadata;
}

// ============================================
// Conversation Type Guards
// ============================================

/**
 * Type guard to validate conversation has minimum required messages
 */
export function isValidConversation(messages: Message[]): boolean {
  if (messages.length < 2) return false;

  const hasUser = messages.some((m) => m.role === "user");
  const hasAssistant = messages.some((m) => m.role === "assistant");

  return hasUser && hasAssistant;
}

/**
 * Type guard to check if object is a valid Message
 */
export function isMessage(obj: unknown): obj is Message {
  if (typeof obj !== "object" || obj === null) return false;

  const msg = obj as Record<string, unknown>;

  return (
    typeof msg.id === "string" &&
    (msg.role === "user" || msg.role === "assistant") &&
    typeof msg.content === "string" &&
    msg.timestamp instanceof Date
  );
}

// ============================================
// Instructor-Specific Types
// ============================================

/**
 * Urgency level for instructor insights (priority ranking)
 */
export type UrgencyLevel = 'critical' | 'high' | 'medium' | 'low';

/**
 * Trending direction for topics
 */
export type TrendDirection = 'rising' | 'falling' | 'stable';

/**
 * Category for response templates
 */
export type TemplateCategory =
  | 'clarification'
  | 'encouragement'
  | 'correction'
  | 'reference'
  | 'general';

/**
 * Types of bulk actions instructors can perform
 */
export type BulkActionType =
  | 'endorse'
  | 'flag'
  | 'resolve'
  | 'unresolve';

/**
 * Thread engagement metrics (reusable across features)
 */
export interface ThreadEngagement {
  /** Total views */
  views: number;

  /** Number of replies */
  replies: number;

  /** ISO 8601 timestamp of last activity */
  lastActivity: string;
}

/**
 * Priority-ranked thread with instructor insights
 *
 * Used in the instructor dashboard priority queue to show
 * which questions need attention first based on urgency,
 * engagement, and AI confidence.
 */
export interface InstructorInsight {
  /** The thread requiring attention */
  thread: Thread;

  /** Priority score (0-100, higher = more urgent) */
  priorityScore: number;

  /** Urgency category */
  urgency: UrgencyLevel;

  /** Engagement metrics for this thread */
  engagement: ThreadEngagement;

  /** Explainable reason flags for priority ranking */
  reasonFlags: string[];

  /** Optional AI answer for quick review */
  aiAnswer?: AIAnswer;
}

/**
 * Cluster of similar questions (FAQ detection)
 *
 * Groups related threads by keyword similarity to identify
 * frequently asked questions that could benefit from
 * standardized responses or documentation.
 */
export interface FrequentlyAskedQuestion {
  /** Unique identifier for this cluster */
  id: string;

  /** Representative question title */
  title: string;

  /** Array of related threads in this cluster */
  threads: Thread[];

  /** Common keywords across all threads */
  commonKeywords: string[];

  /** Frequency count (how many times asked) */
  frequency: number;

  /** Average AI confidence score across threads */
  avgConfidence: number;

  /** Whether any thread in cluster has instructor endorsement */
  hasInstructorEndorsement: boolean;
}

/**
 * Trending topic with frequency metrics
 *
 * Tracks popular topics based on tag frequency and
 * temporal analysis to show what students are asking
 * about most.
 */
export interface TrendingTopic {
  /** Topic name (usually a tag) */
  topic: string;

  /** Number of threads tagged with this topic */
  count: number;

  /** Sample thread IDs for this topic (top 3) */
  threadIds: string[];

  /** Percentage growth compared to previous period */
  recentGrowth: number;

  /** Trend direction category */
  trend: TrendDirection;

  /** Time range for this trending analysis */
  timeRange: {
    start: string;
    end: string;
  };
}

/**
 * Instructor's saved response template
 *
 * Reusable text snippets for common responses to
 * speed up instructor workflows. User-owned and
 * tracked for usage analytics.
 */
export interface ResponseTemplate {
  /** Unique template identifier */
  id: string;

  /** Owning instructor's user ID */
  userId: string;

  /** Template title (for picker dropdown) */
  title: string;

  /** Template content (markdown supported) */
  content: string;

  /** Category for organization */
  category: TemplateCategory;

  /** Tags for searchability */
  tags: string[];

  /** Number of times this template has been used */
  usageCount: number;

  /** ISO 8601 timestamp of last usage */
  lastUsed?: string;

  /** ISO 8601 timestamp of creation */
  createdAt: string;
}

/**
 * Result of a bulk action operation
 *
 * Provides detailed feedback on batch operations
 * including success/failure counts and per-item errors.
 */
export interface BulkActionResult {
  /** Type of bulk action performed */
  actionType: BulkActionType;

  /** Number of items successfully processed */
  successCount: number;

  /** Number of items that failed */
  failedCount: number;

  /** Array of errors (one per failed item) */
  errors: BulkActionError[];

  /** ISO 8601 timestamp of operation */
  timestamp: string;
}

/**
 * Individual error in a bulk action
 */
export interface BulkActionError {
  /** ID of the item that failed */
  itemId: string;

  /** Human-readable error message */
  reason: string;

  /** Optional error code */
  code?: string;
}

/**
 * Search result with relevance scoring
 *
 * Enhanced thread data with search-specific metadata
 * including relevance score, matched keywords, and
 * optional preview snippet.
 */
export interface QuestionSearchResult {
  /** The matching thread */
  thread: Thread;

  /** Relevance score (0-100) */
  relevanceScore: number;

  /** Keywords that matched the query */
  matchedKeywords: string[];

  /** Optional preview snippet with highlights */
  snippet?: string;

  /** Optional positions of matches in content */
  matchLocations?: Array<{ field: 'title' | 'content' | 'tags'; position: number }>;
}

// ============================================
// Instructor Input Types
// ============================================

/**
 * Input for creating a response template
 */
export interface CreateResponseTemplateInput {
  title: string;
  content: string;
  category: TemplateCategory;
  tags: string[];
}

/**
 * Input for updating a response template
 */
export interface UpdateResponseTemplateInput {
  templateId: string;
  title?: string;
  content?: string;
  category?: TemplateCategory;
  tags?: string[];
}

/**
 * Input for bulk endorsement operation
 */
export interface BulkEndorseInput {
  /** Array of AI answer IDs to endorse */
  aiAnswerIds: string[];

  /** User ID of the instructor */
  userId: string;
}

/**
 * Input for searching questions
 */
export interface SearchQuestionsInput {
  /** Course to search within */
  courseId: string;

  /** Search query (natural language) */
  query: string;

  /** Maximum results to return */
  limit?: number;
}

// ============================================
// Instructor Type Guards
// ============================================

/**
 * Type guard for InstructorInsight
 */
export function isInstructorInsight(obj: unknown): obj is InstructorInsight {
  if (typeof obj !== "object" || obj === null) return false;

  const insight = obj as Record<string, unknown>;

  return (
    typeof insight.priorityScore === "number" &&
    insight.priorityScore >= 0 &&
    insight.priorityScore <= 100 &&
    typeof insight.urgency === "string" &&
    ['critical', 'high', 'medium', 'low'].includes(insight.urgency as string) &&
    typeof insight.thread === "object" &&
    Array.isArray(insight.reasonFlags)
  );
}

/**
 * Type guard for FrequentlyAskedQuestion
 */
export function isFrequentlyAskedQuestion(obj: unknown): obj is FrequentlyAskedQuestion {
  if (typeof obj !== "object" || obj === null) return false;

  const faq = obj as Record<string, unknown>;

  return (
    typeof faq.id === "string" &&
    typeof faq.title === "string" &&
    Array.isArray(faq.threads) &&
    Array.isArray(faq.commonKeywords) &&
    typeof faq.frequency === "number" &&
    typeof faq.avgConfidence === "number" &&
    faq.avgConfidence >= 0 &&
    faq.avgConfidence <= 100
  );
}

/**
 * Type guard for TrendingTopic
 */
export function isTrendingTopic(obj: unknown): obj is TrendingTopic {
  if (typeof obj !== "object" || obj === null) return false;

  const topic = obj as Record<string, unknown>;

  return (
    typeof topic.topic === "string" &&
    typeof topic.count === "number" &&
    Array.isArray(topic.threadIds) &&
    typeof topic.recentGrowth === "number" &&
    typeof topic.trend === "string" &&
    ['rising', 'falling', 'stable'].includes(topic.trend as string)
  );
}

/**
 * Type guard for ResponseTemplate
 */
export function isResponseTemplate(obj: unknown): obj is ResponseTemplate {
  if (typeof obj !== "object" || obj === null) return false;

  const template = obj as Record<string, unknown>;

  return (
    typeof template.id === "string" &&
    typeof template.userId === "string" &&
    typeof template.title === "string" &&
    typeof template.content === "string" &&
    typeof template.category === "string" &&
    Array.isArray(template.tags)
  );
}

/**
 * Type guard for BulkActionResult
 */
export function isBulkActionResult(obj: unknown): obj is BulkActionResult {
  if (typeof obj !== "object" || obj === null) return false;

  const result = obj as Record<string, unknown>;

  return (
    typeof result.actionType === "string" &&
    typeof result.successCount === "number" &&
    typeof result.failedCount === "number" &&
    Array.isArray(result.errors)
  );
}

/**
 * Type guard for QuestionSearchResult
 */
export function isQuestionSearchResult(obj: unknown): obj is QuestionSearchResult {
  if (typeof obj !== "object" || obj === null) return false;

  const searchResult = obj as Record<string, unknown>;

  return (
    typeof searchResult.thread === "object" &&
    typeof searchResult.relevanceScore === "number" &&
    searchResult.relevanceScore >= 0 &&
    searchResult.relevanceScore <= 100 &&
    Array.isArray(searchResult.matchedKeywords)
  );
}
