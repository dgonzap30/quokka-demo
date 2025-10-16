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
// Course Material Types (Context-Aware AI)
// ============================================

/**
 * Types of course materials for AI context
 *
 * Extends CitationSourceType pattern for consistency.
 * Used for structured course content that AI can reference.
 */
export type CourseMaterialType =
  | "lecture"
  | "slide"
  | "assignment"
  | "reading"
  | "lab"
  | "textbook";

/**
 * Structured course material for AI context
 *
 * Represents educational content that can be searched,
 * referenced, and cited by the AI assistant. Materials
 * are linked to courses and categorized by type.
 *
 * @example
 * ```typescript
 * const lecture: CourseMaterial = {
 *   id: "mat-123",
 *   courseId: "cs-101",
 *   type: "lecture",
 *   title: "Binary Search Trees",
 *   content: "A binary search tree is...",
 *   keywords: ["bst", "trees", "algorithms"],
 *   metadata: { week: 5 },
 *   createdAt: "2025-10-16T00:00:00Z",
 *   updatedAt: "2025-10-16T00:00:00Z",
 * };
 * ```
 *
 * @see MaterialReference - Lightweight reference to materials
 * @see CourseMaterialType - Available material types
 */
export interface CourseMaterial {
  /** Unique material identifier */
  id: string;

  /** Course this material belongs to */
  courseId: string;

  /** Type of material */
  type: CourseMaterialType;

  /** Material title (e.g., "Lecture 5: Binary Search Trees") */
  title: string;

  /** Full text content for semantic search */
  content: string;

  /** Keywords for fast filtering and matching */
  keywords: string[];

  /** Structured metadata (extensible) */
  metadata: {
    /** Week number in course (optional) */
    week?: number;

    /** Material date (ISO 8601, optional) */
    date?: string;

    /** Chapter/section reference (optional) */
    chapter?: string;

    /** Page range for readings (optional) */
    pageRange?: string;

    /** Instructor who created it (optional) */
    authorId?: string;
  };

  /** ISO 8601 creation timestamp */
  createdAt: string;

  /** ISO 8601 last update timestamp */
  updatedAt: string;
}

/**
 * Lightweight reference to course material
 *
 * Used in AI responses to cite specific materials
 * without embedding full content. Similar to Citation
 * but references CourseMaterial entities.
 */
export interface MaterialReference {
  /** Referenced material ID */
  materialId: string;

  /** Material type (for display/icon) */
  type: CourseMaterialType;

  /** Material title */
  title: string;

  /** Relevant excerpt from content */
  excerpt: string;

  /** Relevance score 0-100 (higher = more relevant) */
  relevanceScore: number;

  /** Optional link to full material */
  link?: string;
}

/**
 * Page context for AI assistant
 *
 * Determines which features and content are available.
 */
export type PageContext = "dashboard" | "course" | "instructor";

/**
 * AI context information
 *
 * Tracks current page, user, and available courses
 * for context-aware AI responses.
 *
 * Replaces scattered optional props in component interfaces.
 */
export interface AIContext {
  /** Current page type */
  pageType: PageContext;

  /** Current user ID */
  userId: string;

  /** Currently selected course (if on course page) */
  currentCourseId?: string;

  /** Course name for display */
  currentCourseName?: string;

  /** Course code for display */
  currentCourseCode?: string;

  /** All enrolled course IDs (for multi-course awareness) */
  enrolledCourseIds: string[];

  /** Optional session ID for conversation threading */
  sessionId?: string;

  /** Context creation timestamp (ISO 8601) */
  timestamp: string;
}

/**
 * Enhanced AI response with material references
 *
 * Extends basic message structure with course material
 * citations and confidence scoring.
 */
export interface EnhancedAIResponse {
  /** Response unique ID */
  id: string;

  /** Response text content */
  content: string;

  /** Course materials referenced in response */
  materialReferences: MaterialReference[];

  /** Confidence score 0-100 */
  confidenceScore: number;

  /** Context used to generate response */
  context: AIContext;

  /** ISO 8601 generation timestamp */
  generatedAt: string;
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

  // Enhanced endorsement tracking (for Quokka Points system)
  endorsedBy?: string[];          // Array of user IDs who endorsed
  instructorEndorsed?: boolean;   // Flag if any instructor endorsed
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

  // NEW: Quokka Points gamification data
  quokkaPoints: QuokkaPointsData;

  // NEW: Assignment Q&A opportunities (sorted by due date, nearest first)
  assignmentQA: AssignmentQAMetrics[];
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
// Course Material Type Guards
// ============================================

/**
 * Type guard to check if object is a valid CourseMaterial
 */
export function isCourseMaterial(obj: unknown): obj is CourseMaterial {
  if (typeof obj !== "object" || obj === null) return false;

  const material = obj as Record<string, unknown>;

  return (
    typeof material.id === "string" &&
    typeof material.courseId === "string" &&
    typeof material.type === "string" &&
    ["lecture", "slide", "assignment", "reading", "lab", "textbook"].includes(material.type as string) &&
    typeof material.title === "string" &&
    typeof material.content === "string" &&
    Array.isArray(material.keywords) &&
    material.keywords.every((k: unknown) => typeof k === "string") &&
    typeof material.metadata === "object" &&
    material.metadata !== null &&
    typeof material.createdAt === "string" &&
    typeof material.updatedAt === "string"
  );
}

/**
 * Type guard to check if object is a valid MaterialReference
 */
export function isMaterialReference(obj: unknown): obj is MaterialReference {
  if (typeof obj !== "object" || obj === null) return false;

  const ref = obj as Record<string, unknown>;

  return (
    typeof ref.materialId === "string" &&
    typeof ref.type === "string" &&
    ["lecture", "slide", "assignment", "reading", "lab", "textbook"].includes(ref.type as string) &&
    typeof ref.title === "string" &&
    typeof ref.excerpt === "string" &&
    typeof ref.relevanceScore === "number" &&
    ref.relevanceScore >= 0 &&
    ref.relevanceScore <= 100
  );
}

/**
 * Type guard to check if AIContext is valid and complete
 */
export function isValidAIContext(obj: unknown): obj is AIContext {
  if (typeof obj !== "object" || obj === null) return false;

  const context = obj as Record<string, unknown>;

  return (
    typeof context.pageType === "string" &&
    ["dashboard", "course", "instructor"].includes(context.pageType as string) &&
    typeof context.userId === "string" &&
    Array.isArray(context.enrolledCourseIds) &&
    context.enrolledCourseIds.every((id: unknown) => typeof id === "string") &&
    typeof context.timestamp === "string"
  );
}

/**
 * Type guard to check if object is a valid EnhancedAIResponse
 */
export function isEnhancedAIResponse(obj: unknown): obj is EnhancedAIResponse {
  if (typeof obj !== "object" || obj === null) return false;

  const response = obj as Record<string, unknown>;

  return (
    typeof response.id === "string" &&
    typeof response.content === "string" &&
    Array.isArray(response.materialReferences) &&
    response.materialReferences.every((ref: unknown) => isMaterialReference(ref)) &&
    typeof response.confidenceScore === "number" &&
    response.confidenceScore >= 0 &&
    response.confidenceScore <= 100 &&
    typeof response.context === "object" &&
    isValidAIContext(response.context) &&
    typeof response.generatedAt === "string"
  );
}

/**
 * Validation: Check if material has sufficient content for AI
 */
export function hasSufficientContent(material: CourseMaterial): boolean {
  return (
    material.content.length >= 50 &&
    material.keywords.length >= 1 &&
    material.title.length >= 3
  );
}

/**
 * Validation: Check if material reference is high quality
 */
export function isHighQualityReference(ref: MaterialReference): boolean {
  return (
    ref.relevanceScore >= 70 &&
    ref.excerpt.length >= 50 &&
    ref.excerpt.length <= 500
  );
}

// ============================================
// Course Material Input Types
// ============================================

/**
 * Input for creating new course material
 */
export interface CreateCourseMaterialInput {
  courseId: string;
  type: CourseMaterialType;
  title: string;
  content: string;
  keywords: string[];
  metadata?: {
    week?: number;
    date?: string;
    chapter?: string;
    pageRange?: string;
    authorId?: string;
  };
}

/**
 * Input for updating existing course material
 */
export interface UpdateCourseMaterialInput {
  materialId: string;
  title?: string;
  content?: string;
  keywords?: string[];
  metadata?: Partial<CourseMaterial["metadata"]>;
}

/**
 * Input for searching course materials
 */
export interface SearchCourseMaterialsInput {
  /** Course to search within (required) */
  courseId: string;

  /** Search query (natural language or keywords) */
  query: string;

  /** Optional material type filter */
  types?: CourseMaterialType[];

  /** Maximum results to return */
  limit?: number;

  /** Minimum relevance score threshold (0-100) */
  minRelevance?: number;
}

/**
 * Search result with relevance scoring
 */
export interface CourseMaterialSearchResult {
  /** The matching material */
  material: CourseMaterial;

  /** Relevance score 0-100 */
  relevanceScore: number;

  /** Keywords that matched the query */
  matchedKeywords: string[];

  /** Snippet preview with highlights */
  snippet: string;
}

// ============================================
// AI Context Utility Types
// ============================================

/**
 * Lightweight course summary for context
 */
export type CourseSummary = Pick<Course, "id" | "code" | "name" | "term">;

/**
 * Material summary for quick reference
 */
export type MaterialSummary = Pick<CourseMaterial, "id" | "courseId" | "type" | "title">;

/**
 * Input for generating AI response with context
 */
export interface GenerateAIResponseInput {
  /** User question */
  query: string;

  /** AI context */
  context: AIContext;

  /** Conversation history (for multi-turn) */
  conversationHistory?: Message[];

  /** Whether to include material references */
  includeMaterials?: boolean;

  /** Maximum materials to reference */
  maxMaterials?: number;
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

  /** Message timestamp (ISO 8601 string) */
  timestamp: string;
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

  /** First message timestamp (ISO 8601 string) */
  startedAt: string;

  /** Last message timestamp (ISO 8601 string) */
  lastMessageAt: string;
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
    typeof msg.timestamp === "string"
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

// ============================================
// Quokka Points Types (Dashboard Q&A Gamification)
// ============================================

/**
 * Point source for Quokka Points breakdown
 *
 * Represents a category of actions that earn points.
 * Used to show users how they earned their points.
 */
export interface PointSource {
  /** Unique identifier for this point source type */
  id: string;

  /** Display label (e.g., "Peer Endorsements", "Helpful Answers") */
  label: string;

  /** Icon component from lucide-react */
  icon: React.ComponentType<{ className?: string }>;

  /** Total points earned from this source */
  points: number;

  /** Number of times this action occurred */
  count: number;

  /** Points awarded per action (e.g., 5 points per endorsement) */
  pointsPerAction: number;
}

/**
 * Milestone for Quokka Points progression
 *
 * Educational gamification - milestones celebrate progress
 * without creating competitive pressure.
 */
export interface PointMilestone {
  /** Milestone point threshold (e.g., 100, 500, 1000) */
  threshold: number;

  /** Milestone label (e.g., "Active Contributor") */
  label: string;

  /** Whether user has achieved this milestone */
  achieved: boolean;

  /** Optional badge icon */
  icon?: React.ComponentType<{ className?: string }>;
}

/**
 * Quokka Points data for student dashboard
 *
 * Complete point system data including balance, breakdown,
 * milestones, and sparkline visualization.
 */
export interface QuokkaPointsData {
  /** Total Quokka Points balance (lifetime) */
  totalPoints: number;

  /** Points earned this week */
  weeklyPoints: number;

  /** Breakdown of points by source type (sorted by points DESC) */
  pointSources: PointSource[];

  /** Milestone progression (sorted by threshold ASC) */
  milestones: PointMilestone[];

  /** Optional 7-day sparkline data (points earned per day) */
  sparklineData?: number[];
}

// ============================================
// Assignment Q&A Types (Course-Specific Opportunities)
// ============================================

/**
 * Assignment for Q&A opportunity tracking
 *
 * Minimal assignment metadata needed for dashboard.
 * Full assignment details would come from LMS integration.
 */
export interface Assignment {
  /** Unique assignment identifier */
  id: string;

  /** Course ID this assignment belongs to */
  courseId: string;

  /** Assignment title */
  title: string;

  /** Due date (ISO 8601) */
  dueDate: string;

  /** Creation date (ISO 8601) */
  createdAt: string;
}

/**
 * Q&A metrics for a specific assignment
 *
 * Aggregated metrics showing Q&A activity and engagement
 * for assignment-related threads. Used to identify
 * opportunities for students to ask or answer questions.
 */
export interface AssignmentQAMetrics {
  /** Assignment unique ID */
  assignmentId: string;

  /** Assignment title */
  title: string;

  /** Course ID */
  courseId: string;

  /** Course name for display */
  courseName: string;

  /** Assignment due date (ISO 8601) */
  dueDate: string;

  /** Q&A Engagement Metrics */
  totalQuestions: number;
  unansweredQuestions: number;
  yourQuestions: number;
  yourAnswers: number;
  aiAnswersAvailable: number;
  activeStudents: number;

  /** Recent activity summary (human-readable, optional) */
  recentActivity?: string;

  /** Suggested action based on metrics */
  suggestedAction: "ask" | "answer" | "review";

  /** Reason for suggested action (explainable AI) */
  actionReason: string;

  /** Optional link to assignment Q&A page */
  link?: string;
}

// ============================================
// Student Dashboard Widget Types
// ============================================

/**
 * Deadline for upcoming course events
 *
 * Used in UpcomingDeadlines component to display
 * assignment due dates, exams, office hours, etc.
 */
export interface Deadline {
  /** Unique deadline identifier */
  id: string;

  /** Deadline title (e.g., "Assignment 3 Due") */
  title: string;

  /** Course ID this deadline belongs to */
  courseId: string;

  /** Course name for display */
  courseName: string;

  /** Type of deadline */
  type: "assignment" | "exam" | "office-hours" | "quiz" | "project";

  /** ISO 8601 deadline timestamp */
  dueDate: string;

  /** Optional link to assignment/event details */
  link?: string;
}

/**
 * Quick action button for student dashboard
 *
 * Used in QuickActionsPanel component for
 * fast access to common student tasks.
 */
export interface QuickActionButton {
  /** Unique action identifier */
  id: string;

  /** Display label for the action */
  label: string;

  /** Icon component from lucide-react */
  icon: React.ComponentType<{ className?: string }>;

  /** Navigation href (uses Link) */
  href?: string;

  /** Click callback (alternative to href) */
  onClick?: () => void;

  /** Optional badge count (e.g., unread notifications) */
  badgeCount?: number;

  /** Visual variant */
  variant?: "default" | "primary" | "success";
}

/**
 * Recommended thread with relevance scoring
 *
 * Used in StudentRecommendations component to show
 * personalized thread suggestions based on activity.
 */
export interface RecommendedThread {
  /** The thread being recommended */
  thread: Thread;

  /** Course name for display context */
  courseName: string;

  /** Relevance score (0-100, higher = more relevant) */
  relevanceScore: number;

  /** Reason for recommendation */
  reason: "high-engagement" | "trending" | "unanswered" | "similar-interests";
}

// ============================================
// AI Conversation Types (LLM Integration)
// ============================================

/**
 * AI conversation session
 *
 * Represents a private conversation between a user and the AI assistant.
 * Conversations are stored per-user and can be converted to public threads.
 *
 * @see ConversationMessage - Individual messages in conversation
 * @see ConversationSession - Conversation with embedded messages
 */
export interface AIConversation {
  /** Unique conversation identifier */
  id: string;

  /** User who owns this conversation */
  userId: string;

  /** Optional course context (null = multi-course general view) */
  courseId: string | null;

  /** Conversation title (generated from first message) */
  title: string;

  /** ISO 8601 timestamp of creation */
  createdAt: string;

  /** ISO 8601 timestamp of last update */
  updatedAt: string;

  /** Number of messages in conversation */
  messageCount: number;

  /** Whether conversation has been converted to thread */
  convertedToThread?: boolean;

  /** Thread ID if converted */
  threadId?: string;
}

/**
 * Message in an AI conversation
 *
 * Individual message sent by user or assistant in a conversation.
 * Different from `Message` type (FloatingQuokka) - this is for stored conversations.
 */
export interface AIMessage {
  /** Unique message identifier */
  id: string;

  /** Conversation this message belongs to */
  conversationId: string;

  /** Message sender role */
  role: "user" | "assistant";

  /** Message text content */
  content: string;

  /** ISO 8601 timestamp (Breaking change: was Date in Message type) */
  timestamp: string;

  /** Optional material references (for assistant messages) */
  materialReferences?: MaterialReference[];

  /** Optional confidence score (for assistant messages) */
  confidenceScore?: number;
}

/**
 * Conversation with embedded messages
 *
 * Complete conversation data including all messages.
 * Used for display and conversion to threads.
 */
export interface ConversationSession {
  /** The conversation metadata */
  conversation: AIConversation;

  /** All messages in chronological order */
  messages: AIMessage[];
}

/**
 * Input for creating a new conversation
 */
export interface CreateConversationInput {
  /** User ID */
  userId: string;

  /** Optional course ID (null = general) */
  courseId?: string | null;

  /** Optional initial title */
  title?: string;
}

/**
 * Input for sending a message
 */
export interface SendMessageInput {
  /** Conversation ID */
  conversationId: string;

  /** Message content */
  content: string;

  /** Message role */
  role: "user" | "assistant";

  /** Optional material references */
  materialReferences?: MaterialReference[];

  /** Optional confidence score */
  confidenceScore?: number;
}

/**
 * Input for converting conversation to thread
 */
export interface ConvertConversationInput {
  /** Conversation ID to convert */
  conversationId: string;

  /** User ID (must own conversation) */
  userId: string;

  /** Target course ID */
  courseId: string;
}

/**
 * Result of conversation conversion
 */
export interface ConvertConversationResult {
  /** The created thread */
  thread: Thread;

  /** The AI answer (if generated) */
  aiAnswer?: AIAnswer;

  /** Updated conversation (marked as converted) */
  conversation: AIConversation;
}

// ============================================
// AI Conversation Type Guards
// ============================================

/**
 * Type guard for AIConversation
 */
export function isAIConversation(obj: unknown): obj is AIConversation {
  if (typeof obj !== "object" || obj === null) return false;

  const conv = obj as Record<string, unknown>;

  return (
    typeof conv.id === "string" &&
    typeof conv.userId === "string" &&
    (conv.courseId === null || typeof conv.courseId === "string") &&
    typeof conv.title === "string" &&
    typeof conv.createdAt === "string" &&
    typeof conv.updatedAt === "string" &&
    typeof conv.messageCount === "number"
  );
}

/**
 * Type guard for AIMessage
 */
export function isAIMessage(obj: unknown): obj is AIMessage {
  if (typeof obj !== "object" || obj === null) return false;

  const msg = obj as Record<string, unknown>;

  return (
    typeof msg.id === "string" &&
    typeof msg.conversationId === "string" &&
    (msg.role === "user" || msg.role === "assistant") &&
    typeof msg.content === "string" &&
    typeof msg.timestamp === "string"
  );
}

// ============================================
// LLM Provider Types
// ============================================

/**
 * LLM provider type
 */
export type LLMProviderType = "openai" | "anthropic";

/**
 * LLM provider configuration
 */
export interface LLMConfig {
  /** Provider type */
  provider: LLMProviderType;

  /** API key */
  apiKey: string;

  /** Model name */
  model: string;

  /** Temperature (0-1) */
  temperature: number;

  /** Top P (0-1) */
  topP: number;

  /** Maximum tokens to generate */
  maxTokens: number;
}

/**
 * LLM generation request
 */
export interface LLMRequest {
  /** System prompt */
  systemPrompt: string;

  /** User prompt */
  userPrompt: string;

  /** Optional conversation history */
  conversationHistory?: AIMessage[];

  /** Maximum tokens */
  maxTokens?: number;

  /** Temperature override */
  temperature?: number;

  /** Top P override */
  topP?: number;
}

/**
 * Token usage tracking
 */
export interface TokenUsage {
  /** Prompt tokens */
  promptTokens: number;

  /** Completion tokens */
  completionTokens: number;

  /** Total tokens */
  totalTokens: number;

  /** Estimated cost in USD */
  estimatedCost: number;
}

/**
 * Successful LLM response
 */
export interface LLMResponseSuccess {
  /** Success flag */
  success: true;

  /** Generated content */
  content: string;

  /** Model used */
  model: string;

  /** Provider used */
  provider: LLMProviderType;

  /** Token usage */
  usage: TokenUsage;

  /** Generation timestamp */
  generatedAt: string;
}

/**
 * Failed LLM response
 */
export interface LLMResponseError {
  /** Success flag */
  success: false;

  /** Error message */
  error: string;

  /** Error code */
  code: string;

  /** Provider that failed */
  provider: LLMProviderType;

  /** Whether to retry with different provider */
  retryable: boolean;
}

/**
 * LLM response (discriminated union)
 */
export type LLMResponse = LLMResponseSuccess | LLMResponseError;

/**
 * LLM streaming chunk
 */
export interface LLMStreamChunk {
  /** Chunk content */
  content: string;

  /** Whether this is the final chunk */
  done: boolean;

  /** Optional token usage (final chunk only) */
  usage?: TokenUsage;
}

// ============================================
// LLM Provider Type Guards
// ============================================

/**
 * Type guard for successful LLM response
 */
export function isLLMSuccess(response: LLMResponse): response is LLMResponseSuccess {
  return response.success === true;
}

/**
 * Type guard for failed LLM response
 */
export function isLLMError(response: LLMResponse): response is LLMResponseError {
  return response.success === false;
}

// ============================================
// Course Context Types (LLM Context Building)
// ============================================

/**
 * Ranked course material with relevance score
 *
 * Material selected for LLM context with relevance ranking.
 */
export interface RankedMaterial extends CourseMaterial {
  /** Relevance score (0-100) */
  relevanceScore: number;

  /** Matched keywords from query */
  matchedKeywords: string[];
}

/**
 * Built context for single course
 *
 * Aggregated course materials formatted for LLM prompt.
 */
export interface CourseContext {
  /** Course ID */
  courseId: string;

  /** Course code */
  courseCode: string;

  /** Course name */
  courseName: string;

  /** Selected materials for context */
  materials: RankedMaterial[];

  /** Formatted context text for LLM */
  contextText: string;

  /** Total tokens (estimated) */
  estimatedTokens: number;

  /** Build timestamp */
  builtAt: string;
}

/**
 * Multi-course context
 *
 * Aggregated context from multiple enrolled courses.
 */
export interface MultiCourseContext {
  /** User ID */
  userId: string;

  /** All enrolled course IDs */
  courseIds: string[];

  /** Individual course contexts */
  courseContexts: CourseContext[];

  /** Combined context text */
  combinedContextText: string;

  /** Total tokens (estimated) */
  estimatedTokens: number;

  /** Build timestamp */
  builtAt: string;
}

/**
 * Course detection result
 *
 * Auto-detected relevant course from query.
 */
export interface CourseDetectionResult {
  /** Detected course ID */
  courseId: string;

  /** Course code */
  courseCode: string;

  /** Course name */
  courseName: string;

  /** Confidence score (0-100) */
  confidence: number;

  /** Matched keywords */
  matchedKeywords: string[];

  /** Whether confidence exceeds threshold for auto-selection */
  autoSelect: boolean;
}

/**
 * Context building options
 */
export interface ContextBuildOptions {
  /** Maximum materials to include */
  maxMaterials?: number;

  /** Minimum relevance score (0-100) */
  minRelevance?: number;

  /** Maximum tokens allowed */
  maxTokens?: number;

  /** Material types to prioritize */
  priorityTypes?: CourseMaterialType[];
}

// ============================================
// LMS Integration Types
// ============================================

/**
 * LMS provider type
 */
export type LMSProviderType = "canvas" | "blackboard" | "moodle" | "mock";

/**
 * Generic LMS content
 */
export interface LMSContent {
  /** Unique identifier */
  id: string;

  /** Content type */
  type: "syllabus" | "schedule" | "assignment" | "announcement" | "module";

  /** Title */
  title: string;

  /** Content body */
  content: string;

  /** ISO 8601 timestamp */
  publishedAt: string;

  /** ISO 8601 timestamp */
  updatedAt: string;

  /** Optional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Syllabus data from LMS
 */
export interface SyllabusData {
  /** Course ID */
  courseId: string;

  /** Syllabus content (HTML or markdown) */
  content: string;

  /** Extracted sections */
  sections: {
    title: string;
    content: string;
  }[];

  /** Sync timestamp */
  syncedAt: string;
}

/**
 * Schedule entry from LMS
 */
export interface ScheduleEntry {
  /** Entry ID */
  id: string;

  /** Course ID */
  courseId: string;

  /** Event title */
  title: string;

  /** Event type */
  type: "lecture" | "lab" | "exam" | "office-hours" | "deadline";

  /** Start time (ISO 8601) */
  startTime: string;

  /** End time (ISO 8601) */
  endTime: string;

  /** Optional description */
  description?: string;

  /** Optional location */
  location?: string;
}

/**
 * LMS sync result
 */
export interface LMSSyncResult {
  /** Success flag */
  success: boolean;

  /** Provider used */
  provider: LMSProviderType;

  /** Course ID synced */
  courseId: string;

  /** Number of items synced */
  itemsSynced: number;

  /** Sync timestamp */
  syncedAt: string;

  /** Optional error message */
  error?: string;
}

/**
 * LMS webhook payload
 */
export interface LMSWebhookPayload {
  /** Event type */
  event: "content_updated" | "assignment_created" | "announcement_posted";

  /** Course ID */
  courseId: string;

  /** Content ID */
  contentId: string;

  /** Event timestamp */
  timestamp: string;

  /** Event data */
  data: Record<string, unknown>;
}
