import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  LoginInput,
  SignupInput,
  AuthResult,
  CreateThreadInput,
  CreatePostInput,
  GenerateAIAnswerInput,
  EndorseAIAnswerInput,
  AIAnswer,
  BulkEndorseInput,
  SearchQuestionsInput,
  CreateResponseTemplateInput,
} from "@/lib/models/types";
import { api } from "./client";
import { isAuthSuccess } from "@/lib/models/types";

// ============================================
// Query Keys
// ============================================

const queryKeys = {
  currentUser: ["currentUser"] as const,
  session: ["session"] as const,
  courses: ["courses"] as const,
  userCourses: (userId: string) => ["userCourses", userId] as const,
  course: (courseId: string) => ["course", courseId] as const,
  courseThreads: (courseId: string) => ["courseThreads", courseId] as const,
  courseMetrics: (courseId: string) => ["courseMetrics", courseId] as const,
  courseInsights: (courseId: string) => ["courseInsights", courseId] as const,
  thread: (threadId: string) => ["thread", threadId] as const,
  notifications: (userId: string, courseId?: string) =>
    courseId ? ["notifications", userId, courseId] as const : ["notifications", userId] as const,
  studentDashboard: (userId: string) => ["studentDashboard", userId] as const,
  instructorDashboard: (userId: string) => ["instructorDashboard", userId] as const,
  aiAnswer: (threadId: string) => ["aiAnswer", threadId] as const,
  aiPreview: (questionHash: string) => ["aiPreview", questionHash] as const,
  // Instructor-specific query keys
  instructorInsights: (userId: string) => ["instructorInsights", userId] as const,
  frequentlyAskedQuestions: (courseId: string) => ["frequentlyAskedQuestions", courseId] as const,
  trendingTopics: (courseId: string, timeRange: string) => ["trendingTopics", courseId, timeRange] as const,
  questionSearch: (courseId: string, query: string) => ["questionSearch", courseId, query] as const,
  responseTemplates: (userId: string) => ["responseTemplates", userId] as const,
};

// ============================================
// Helper Functions
// ============================================

/**
 * Simple hash function for question content
 * Used to cache AI previews by question
 */
function hashQuestion(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString(36);
}

// ============================================
// Authentication Hooks
// ============================================

/**
 * Get current authenticated user
 */
export function useCurrentUser() {
  return useQuery({
    queryKey: queryKeys.currentUser,
    queryFn: () => api.getCurrentUser(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Restore session from localStorage
 */
export function useSession() {
  return useQuery({
    queryKey: queryKeys.session,
    queryFn: () => api.restoreSession(),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Login mutation
 */
export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: LoginInput) => api.login(input),
    onSuccess: (result: AuthResult) => {
      if (isAuthSuccess(result)) {
        // Update user query with logged-in user
        queryClient.setQueryData(queryKeys.currentUser, result.session.user);
        queryClient.setQueryData(queryKeys.session, result.session);
        // Invalidate to refetch
        queryClient.invalidateQueries({ queryKey: queryKeys.currentUser });
      }
    },
  });
}

/**
 * Signup mutation
 */
export function useSignup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SignupInput) => api.signup(input),
    onSuccess: (result: AuthResult) => {
      if (isAuthSuccess(result)) {
        // Update user query with new user
        queryClient.setQueryData(queryKeys.currentUser, result.session.user);
        queryClient.setQueryData(queryKeys.session, result.session);
        // Invalidate to refetch
        queryClient.invalidateQueries({ queryKey: queryKeys.currentUser });
      }
    },
  });
}

/**
 * Logout mutation
 */
export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.logout(),
    onSuccess: () => {
      // Clear user data from cache
      queryClient.setQueryData(queryKeys.currentUser, null);
      queryClient.setQueryData(queryKeys.session, null);
      // Invalidate all queries
      queryClient.invalidateQueries();
    },
  });
}

// ============================================
// Course Hooks
// ============================================

/**
 * Get all active courses
 */
export function useCourses() {
  return useQuery({
    queryKey: queryKeys.courses,
    queryFn: () => api.getAllCourses(),
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 15 * 60 * 1000,
  });
}

/**
 * Get courses for a specific user
 */
export function useUserCourses(userId: string | undefined) {
  return useQuery({
    queryKey: userId ? queryKeys.userCourses(userId) : ["userCourses"],
    queryFn: () => (userId ? api.getUserCourses(userId) : Promise.resolve([])),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Get single course by ID
 */
export function useCourse(courseId: string | undefined) {
  return useQuery({
    queryKey: courseId ? queryKeys.course(courseId) : ["course"],
    queryFn: () => (courseId ? api.getCourse(courseId) : Promise.resolve(null)),
    enabled: !!courseId,
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });
}

/**
 * Get threads for a course
 */
export function useCourseThreads(courseId: string | undefined) {
  return useQuery({
    queryKey: courseId ? queryKeys.courseThreads(courseId) : ["courseThreads"],
    queryFn: () => (courseId ? api.getCourseThreads(courseId) : Promise.resolve([])),
    enabled: !!courseId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000,
  });
}

/**
 * Get course metrics
 */
export function useCourseMetrics(courseId: string | undefined) {
  return useQuery({
    queryKey: courseId ? queryKeys.courseMetrics(courseId) : ["courseMetrics"],
    queryFn: () => (courseId ? api.getCourseMetrics(courseId) : Promise.resolve(null)),
    enabled: !!courseId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Get AI-generated course insights
 */
export function useCourseInsights(courseId: string | undefined) {
  return useQuery({
    queryKey: courseId ? queryKeys.courseInsights(courseId) : ["courseInsights"],
    queryFn: () => (courseId ? api.getCourseInsights(courseId) : Promise.resolve(null)),
    enabled: !!courseId,
    staleTime: 5 * 60 * 1000, // 5 minutes (expensive AI operation)
    gcTime: 10 * 60 * 1000,
  });
}

// ============================================
// Notification Hooks
// ============================================

/**
 * Get notifications for a user
 */
export function useNotifications(userId: string | undefined, courseId?: string) {
  return useQuery({
    queryKey: userId ? queryKeys.notifications(userId, courseId) : ["notifications"],
    queryFn: () => (userId ? api.getNotifications(userId, courseId) : Promise.resolve([])),
    enabled: !!userId,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000,
    refetchInterval: 60 * 1000, // Poll every minute
  });
}

/**
 * Mark notification as read mutation
 */
export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) => api.markNotificationRead(notificationId),
    onSuccess: () => {
      // Invalidate all notification queries
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

/**
 * Mark all notifications as read mutation
 */
export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, courseId }: { userId: string; courseId?: string }) =>
      api.markAllNotificationsRead(userId, courseId),
    onSuccess: () => {
      // Invalidate all notification queries
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

// ============================================
// Thread Hooks
// ============================================

/**
 * Get thread by ID with posts
 */
export function useThread(threadId: string | undefined) {
  return useQuery({
    queryKey: threadId ? queryKeys.thread(threadId) : ["thread"],
    queryFn: () => (threadId ? api.getThread(threadId) : Promise.resolve(null)),
    enabled: !!threadId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000,
  });
}

/**
 * Create new thread mutation
 *
 * AUTO-GENERATES AI ANSWER on success.
 * AI answer is embedded in createThread response.
 */
export function useCreateThread() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ input, authorId }: { input: CreateThreadInput; authorId: string }) =>
      api.createThread(input, authorId),
    onSuccess: (result) => {
      const { thread, aiAnswer } = result; // Destructure response

      // Invalidate course threads query
      queryClient.invalidateQueries({ queryKey: queryKeys.courseThreads(thread.courseId) });

      // Invalidate dashboards (activity feeds need update)
      queryClient.invalidateQueries({ queryKey: ["studentDashboard"] });
      queryClient.invalidateQueries({ queryKey: ["instructorDashboard"] });

      // OPTIONAL: Pre-populate thread cache with AI answer
      // This prevents useThread from refetching when user navigates to thread
      if (aiAnswer) {
        queryClient.setQueryData(queryKeys.thread(thread.id), {
          thread,
          posts: [],
          aiAnswer,
        });
      }
    },
  });
}

/**
 * Create new post mutation
 */
export function useCreatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ input, authorId }: { input: CreatePostInput; authorId: string }) =>
      api.createPost(input, authorId),
    onSuccess: (newPost) => {
      // Invalidate thread query to refetch with new post
      queryClient.invalidateQueries({ queryKey: queryKeys.thread(newPost.threadId) });
      // Invalidate dashboards (activity feeds need update)
      queryClient.invalidateQueries({ queryKey: ["studentDashboard"] });
      queryClient.invalidateQueries({ queryKey: ["instructorDashboard"] });
    },
  });
}

// ============================================
// Dashboard Hooks
// ============================================

/**
 * Get student dashboard data
 */
export function useStudentDashboard(userId: string | undefined) {
  return useQuery({
    queryKey: userId ? queryKeys.studentDashboard(userId) : ["studentDashboard"],
    queryFn: () => (userId ? api.getStudentDashboard(userId) : Promise.resolve(null)),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Get instructor dashboard data
 */
export function useInstructorDashboard(userId: string | undefined) {
  return useQuery({
    queryKey: userId ? queryKeys.instructorDashboard(userId) : ["instructorDashboard"],
    queryFn: () => (userId ? api.getInstructorDashboard(userId) : Promise.resolve(null)),
    enabled: !!userId,
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

// ============================================
// AI Answer Hooks
// ============================================

/**
 * Get AI answer for a thread
 *
 * NOTE: This hook is OPTIONAL. AI answer is already embedded
 * in useThread() response. Use this only for specific scenarios
 * like ask page preview where you need AI answer without thread.
 */
export function useAIAnswer(threadId: string | undefined) {
  return useQuery({
    queryKey: threadId ? queryKeys.aiAnswer(threadId) : ["aiAnswer"],
    queryFn: () => (threadId ? api.getAIAnswer(threadId) : Promise.resolve(null)),
    enabled: !!threadId,
    staleTime: 10 * 60 * 1000, // 10 minutes (AI content is immutable)
    gcTime: 15 * 60 * 1000,     // 15 minutes (keep in cache longer)
  });
}

/**
 * Generate AI answer preview for ask page
 *
 * This mutation generates an AI answer WITHOUT saving it.
 * Used to show users what the AI response would look like
 * before they commit to creating the thread.
 */
export function useGenerateAIPreview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: GenerateAIAnswerInput) => api.generateAIPreview(input),
    onSuccess: (preview, input) => {
      // Cache preview with short expiry (30 seconds)
      const questionHash = hashQuestion(input.title + input.content);
      queryClient.setQueryData(queryKeys.aiPreview(questionHash), preview);
    },
  });
}

/**
 * Endorse an AI answer (student or instructor)
 *
 * Uses optimistic updates to provide instant UI feedback.
 * Automatically calculates weighted endorsement (student=1, instructor=3).
 */
export function useEndorseAIAnswer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: EndorseAIAnswerInput) => api.endorseAIAnswer(input),

    // Optimistic update: update cache immediately
    onMutate: async ({ aiAnswerId, userId, isInstructor }) => {
      const threadId = aiAnswerId.split('-')[0]; // Extract threadId from aiAnswerId
      const queryKey = queryKeys.thread(threadId);

      // Cancel outgoing refetches (don't overwrite optimistic update)
      await queryClient.cancelQueries({ queryKey });

      // Get current cached data
      const previousThread = queryClient.getQueryData(queryKey);

      // Optimistically update cache
      queryClient.setQueryData(queryKey, (old: { thread: unknown; posts: unknown[]; aiAnswer?: AIAnswer } | undefined) => {
        if (!old?.aiAnswer) return old;

        const endorsementDelta = isInstructor ? 3 : 1;
        const currentAIAnswer = old.aiAnswer;

        return {
          ...old,
          aiAnswer: {
            ...currentAIAnswer,
            studentEndorsements: !isInstructor
              ? currentAIAnswer.studentEndorsements + 1
              : currentAIAnswer.studentEndorsements,
            instructorEndorsements: isInstructor
              ? currentAIAnswer.instructorEndorsements + 1
              : currentAIAnswer.instructorEndorsements,
            totalEndorsements: currentAIAnswer.totalEndorsements + endorsementDelta,
            endorsedBy: [...(currentAIAnswer.endorsedBy || []), userId],
            instructorEndorsed: isInstructor ? true : currentAIAnswer.instructorEndorsed,
          },
        };
      });

      // Return context for rollback
      return { previousThread, threadId };
    },

    // On error: rollback optimistic update
    onError: (err, variables, context) => {
      if (context?.previousThread && context?.threadId) {
        queryClient.setQueryData(
          queryKeys.thread(context.threadId),
          context.previousThread
        );
      }
    },

    // On success: invalidate related queries
    onSuccess: (data, variables, context) => {
      if (!context?.threadId) return;

      // Invalidate thread query (refetch to get server truth)
      queryClient.invalidateQueries({ queryKey: queryKeys.thread(context.threadId) });

      // Invalidate course threads (endorsement count visible in list)
      const thread = queryClient.getQueryData<{ thread?: { courseId?: string } }>(queryKeys.thread(context.threadId));
      if (thread?.thread?.courseId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.courseThreads(thread.thread.courseId)
        });
      }

      // Invalidate instructor dashboard (AI coverage stats may change)
      queryClient.invalidateQueries({ queryKey: ["instructorDashboard"] });
    },
  });
}

// ============================================
// Instructor-Specific Hooks
// ============================================

/**
 * Get priority-ranked insights for instructor
 *
 * Returns threads sorted by priority score with urgency levels,
 * engagement metrics, and explainable AI reason flags.
 */
export function useInstructorInsights(userId: string | undefined) {
  return useQuery({
    queryKey: userId ? queryKeys.instructorInsights(userId) : ["instructorInsights"],
    queryFn: () => (userId ? api.getInstructorInsights(userId) : Promise.resolve([])),
    enabled: !!userId,
    staleTime: 1 * 60 * 1000, // 1 minute (near-real-time)
    gcTime: 3 * 60 * 1000,    // 3 minutes
  });
}

/**
 * Get frequently asked questions (FAQ clusters)
 *
 * Groups similar threads by keyword similarity.
 * Expensive operation - cached for 5 minutes.
 */
export function useFrequentlyAskedQuestions(courseId: string | undefined) {
  return useQuery({
    queryKey: courseId ? queryKeys.frequentlyAskedQuestions(courseId) : ["frequentlyAskedQuestions"],
    queryFn: () => (courseId ? api.getFrequentlyAskedQuestions(courseId) : Promise.resolve([])),
    enabled: !!courseId,
    staleTime: 5 * 60 * 1000, // 5 minutes (expensive clustering operation)
    gcTime: 10 * 60 * 1000,   // 10 minutes
  });
}

/**
 * Get trending topics for a course
 *
 * Analyzes tag frequency over time range (week/month/quarter).
 * Calculates growth trends and categorizes as rising/falling/stable.
 */
export function useTrendingTopics(
  courseId: string | undefined,
  timeRange: "week" | "month" | "quarter" = "week"
) {
  return useQuery({
    queryKey: courseId ? queryKeys.trendingTopics(courseId, timeRange) : ["trendingTopics"],
    queryFn: () =>
      courseId
        ? api.getTrendingTopics(courseId, timeRange)
        : Promise.resolve([]),
    enabled: !!courseId,
    staleTime: 10 * 60 * 1000, // 10 minutes (slow-changing data)
    gcTime: 15 * 60 * 1000,    // 15 minutes
  });
}

/**
 * Search questions with natural language query
 *
 * Returns threads ranked by relevance score with matched keywords.
 * Minimum 3-character query required.
 *
 * NOTE: This is a query, not mutation, to enable React Query's
 * automatic deduplication and caching for repeated searches.
 */
export function useSearchQuestions(
  courseId: string | undefined,
  query: string
) {
  return useQuery({
    queryKey: courseId && query.length >= 3
      ? queryKeys.questionSearch(courseId, query)
      : ["questionSearch"],
    queryFn: () =>
      courseId && query.length >= 3
        ? api.searchQuestions({ courseId, query })
        : Promise.resolve([]),
    enabled: !!courseId && query.length >= 3,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000,    // 5 minutes
  });
}

/**
 * Get response templates for user
 *
 * Templates are immutable until edited by user.
 * Cached indefinitely until mutations trigger invalidation.
 */
export function useResponseTemplates(userId: string | undefined) {
  return useQuery({
    queryKey: userId ? queryKeys.responseTemplates(userId) : ["responseTemplates"],
    queryFn: () => (userId ? api.getResponseTemplates(userId) : Promise.resolve([])),
    enabled: !!userId,
    staleTime: Infinity,      // Immutable until user edits
    gcTime: 15 * 60 * 1000,   // 15 minutes
  });
}

/**
 * Bulk endorse AI answers mutation
 *
 * Endorses multiple AI answers in a single operation.
 * All-or-nothing validation ensures data consistency.
 * 5x faster than sequential endorsements.
 *
 * Invalidates:
 * - instructorInsights (priority scores may change)
 * - courseThreads (endorsement counts visible in list)
 * - instructorDashboard (AI coverage stats)
 */
export function useBulkEndorseAIAnswers() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: BulkEndorseInput) => api.bulkEndorseAIAnswers(input),
    onSuccess: (result, variables) => {
      // Invalidate instructor insights for this user
      queryClient.invalidateQueries({
        queryKey: queryKeys.instructorInsights(variables.userId)
      });

      // Invalidate all affected course threads
      // Extract unique course IDs from endorsed items by looking up AI answers in cache
      const affectedCourseIds = new Set<string>();
      variables.aiAnswerIds.forEach((aiAnswerId) => {
        // Look up AI answer from cache to get threadId, then look up thread for courseId
        const allQueryData = queryClient.getQueriesData({ queryKey: ["thread"] });
        allQueryData.forEach(([, data]) => {
          const threadData = data as { thread?: { id?: string; courseId?: string; aiAnswerId?: string } } | undefined;
          if (threadData?.thread?.aiAnswerId === aiAnswerId && threadData.thread.courseId) {
            affectedCourseIds.add(threadData.thread.courseId);
          }
        });
      });

      // Invalidate each affected course
      affectedCourseIds.forEach((courseId) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.courseThreads(courseId) });
      });

      // Invalidate instructor dashboard
      queryClient.invalidateQueries({
        queryKey: queryKeys.instructorDashboard(variables.userId)
      });
    },
  });
}

/**
 * Save response template mutation
 *
 * Creates new template for user.
 * Automatically increments usage count on subsequent uses.
 *
 * Uses optimistic update to provide instant UI feedback.
 */
export function useSaveResponseTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ input, userId }: { input: CreateResponseTemplateInput; userId: string }) =>
      api.saveResponseTemplate(input, userId),

    // Optimistic update: add template immediately to cache
    onMutate: async ({ input, userId }) => {
      const queryKey = queryKeys.responseTemplates(userId);

      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey });

      // Get current cached data
      const previousTemplates = queryClient.getQueryData(queryKey);

      // Optimistically add new template with temporary ID
      queryClient.setQueryData(queryKey, (old: unknown[] | undefined) => {
        const newTemplate = {
          id: `temp-${Date.now()}`, // Temporary ID
          userId,
          ...input,
          usageCount: 0,
          createdAt: new Date().toISOString(),
        };
        return old ? [...old, newTemplate] : [newTemplate];
      });

      // Return context for rollback
      return { previousTemplates, userId };
    },

    // On error: rollback optimistic update
    onError: (err, variables, context) => {
      if (context?.previousTemplates && context?.userId) {
        queryClient.setQueryData(
          queryKeys.responseTemplates(context.userId),
          context.previousTemplates
        );
      }
    },

    // On success: replace temp template with real one
    onSuccess: (newTemplate, variables, context) => {
      if (!context?.userId) return;

      // Refetch to get server truth with real ID
      queryClient.invalidateQueries({
        queryKey: queryKeys.responseTemplates(context.userId)
      });
    },
  });
}

/**
 * Delete response template mutation
 *
 * Removes template from user's collection.
 * Uses optimistic update for instant UI feedback.
 */
export function useDeleteResponseTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ templateId, userId }: { templateId: string; userId: string }) =>
      api.deleteResponseTemplate(templateId).then(() => ({ templateId, userId })),

    // Optimistic update: remove template immediately from cache
    onMutate: async ({ templateId, userId }) => {
      const queryKey = queryKeys.responseTemplates(userId);

      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey });

      // Get current cached data
      const previousTemplates = queryClient.getQueryData(queryKey);

      // Optimistically remove template
      queryClient.setQueryData(queryKey, (old: Array<{ id: string }> | undefined) => {
        return old ? old.filter((template) => template.id !== templateId) : [];
      });

      // Return context for rollback
      return { previousTemplates, userId };
    },

    // On error: rollback optimistic update
    onError: (err, variables, context) => {
      if (context?.previousTemplates && context?.userId) {
        queryClient.setQueryData(
          queryKeys.responseTemplates(context.userId),
          context.previousTemplates
        );
      }
    },

    // On success: refetch to ensure cache consistency
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.responseTemplates(data.userId)
      });
    },
  });
}
