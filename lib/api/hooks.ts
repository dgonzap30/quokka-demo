import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  User,
  LoginInput,
  SignupInput,
  AuthResult,
  AuthSession,
  Course,
  Thread,
  Post,
  Notification,
  CourseMetrics,
  CourseInsight,
  CreateThreadInput,
  CreatePostInput,
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
};

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
 */
export function useCreateThread() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ input, authorId }: { input: CreateThreadInput; authorId: string }) =>
      api.createThread(input, authorId),
    onSuccess: (newThread) => {
      // Invalidate course threads query
      queryClient.invalidateQueries({ queryKey: queryKeys.courseThreads(newThread.courseId) });
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
    },
  });
}
