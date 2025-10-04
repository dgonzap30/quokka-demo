"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "./client";
import type {
  CreateThreadInput,
  CreatePostInput,
  AskQuestionInput,
} from "@/lib/models/types";

// Query keys
export const queryKeys = {
  threads: ["threads"] as const,
  thread: (id: string) => ["thread", id] as const,
  currentUser: ["currentUser"] as const,
  instructorMetrics: ["instructorMetrics"] as const,
  unansweredThreads: ["unansweredThreads"] as const,
  similarThreads: (query: string) => ["similarThreads", query] as const,
  courses: ["courses"] as const,
  userCourses: (userId: string) => ["userCourses", userId] as const,
  courseThreads: (courseId: string) => ["courseThreads", courseId] as const,
  notifications: (userId: string, courseId?: string) =>
    courseId
      ? (["notifications", userId, courseId] as const)
      : (["notifications", userId] as const),
  courseInsights: (courseId: string) => ["courseInsights", courseId] as const,
  courseMetrics: (courseId: string) => ["courseMetrics", courseId] as const,
};

// Threads
export function useThreads() {
  return useQuery({
    queryKey: queryKeys.threads,
    queryFn: () => api.getThreads(),
  });
}

export function useThread(id: string) {
  return useQuery({
    queryKey: queryKeys.thread(id),
    queryFn: () => api.getThread(id),
    enabled: !!id,
  });
}

export function useCreateThread() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateThreadInput) => api.createThread(input),
    onSuccess: (thread) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.threads });
      queryClient.invalidateQueries({ queryKey: queryKeys.instructorMetrics });
      // Invalidate course-specific queries
      if (thread.courseId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.courseThreads(thread.courseId),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.courseMetrics(thread.courseId),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.courseInsights(thread.courseId),
        });
      }
    },
  });
}

export function useCreatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreatePostInput) => api.createPost(input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.thread(variables.threadId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.threads });
      queryClient.invalidateQueries({ queryKey: queryKeys.instructorMetrics });
      queryClient.invalidateQueries({
        queryKey: queryKeys.unansweredThreads,
      });
    },
  });
}

export function useEndorsePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (postId: string) => api.endorsePost(postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.threads });
      queryClient.invalidateQueries({ queryKey: queryKeys.instructorMetrics });
    },
  });
}

export function useFlagPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (postId: string) => api.flagPost(postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.threads });
      queryClient.invalidateQueries({ queryKey: queryKeys.instructorMetrics });
    },
  });
}

export function useResolveThread() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (threadId: string) => api.resolveThread(threadId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.threads });
      queryClient.invalidateQueries({ queryKey: queryKeys.instructorMetrics });
    },
  });
}

export function useUpdateThreadStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ threadId, status }: { threadId: string; status: "open" | "answered" | "resolved" | "canonical" }) =>
      api.updateThreadStatus(threadId, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.thread(variables.threadId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.threads });
      queryClient.invalidateQueries({ queryKey: queryKeys.instructorMetrics });
      queryClient.invalidateQueries({ queryKey: queryKeys.unansweredThreads });
    },
  });
}

export function useDeletePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (postId: string) => api.deletePost(postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.threads });
      queryClient.invalidateQueries({ queryKey: queryKeys.instructorMetrics });
    },
  });
}

export function useUndoDeletePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (postId: string) => api.undoDeletePost(postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.threads });
      queryClient.invalidateQueries({ queryKey: queryKeys.instructorMetrics });
    },
  });
}

// AI
export function useAskQuestion() {
  return useMutation({
    mutationFn: (input: AskQuestionInput) => api.askQuestion(input),
  });
}

export function useSimilarThreads(query: string, enabled: boolean = true) {
  return useQuery({
    queryKey: queryKeys.similarThreads(query),
    queryFn: () => api.getSimilarThreads(query),
    enabled: enabled && query.length > 3,
  });
}

// Instructor
export function useInstructorMetrics() {
  return useQuery({
    queryKey: queryKeys.instructorMetrics,
    queryFn: () => api.getInstructorMetrics(),
  });
}

export function useUnansweredThreads() {
  return useQuery({
    queryKey: queryKeys.unansweredThreads,
    queryFn: () => api.getUnansweredThreads(),
  });
}

// Users
export function useCurrentUser() {
  return useQuery({
    queryKey: queryKeys.currentUser,
    queryFn: () => api.getCurrentUser(),
  });
}

// Courses
export function useCourses() {
  return useQuery({
    queryKey: queryKeys.courses,
    queryFn: () => api.getAllCourses(),
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

export function useUserCourses(userId: string) {
  return useQuery({
    queryKey: queryKeys.userCourses(userId),
    queryFn: () => api.getUserCourses(userId),
    enabled: !!userId,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

export function useCourseThreads(courseId: string) {
  return useQuery({
    queryKey: queryKeys.courseThreads(courseId),
    queryFn: () => api.getCourseThreads(courseId),
    enabled: !!courseId,
  });
}

// Notifications
export function useNotifications(userId: string, courseId?: string) {
  return useQuery({
    queryKey: queryKeys.notifications(userId, courseId),
    queryFn: () => api.getNotifications(userId, courseId),
    enabled: !!userId,
    staleTime: 1000 * 30, // 30 seconds
    refetchInterval: 1000 * 60, // Refetch every minute
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) =>
      api.markNotificationRead(notificationId),
    onSuccess: () => {
      // Invalidate all notification queries
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

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

// Course Insights & Metrics
export function useCourseInsights(courseId: string) {
  return useQuery({
    queryKey: queryKeys.courseInsights(courseId),
    queryFn: () => api.getCourseInsights(courseId),
    enabled: !!courseId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useCourseMetrics(courseId: string) {
  return useQuery({
    queryKey: queryKeys.courseMetrics(courseId),
    queryFn: () => api.getCourseMetrics(courseId),
    enabled: !!courseId,
    staleTime: 1000 * 60, // 1 minute
  });
}
