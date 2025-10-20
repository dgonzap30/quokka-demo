// ============================================
// Courses API Module
// ============================================
//
// Handles course retrieval, metrics, and insights
// Supports both backend (HTTP) and fallback (localStorage) modes via feature flags.

import type { Course, CourseMetrics, CourseInsight } from "@/lib/models/types";

import {
  seedData,
  getCourses as getCoursesFromStore,
  getCourseById,
  getEnrollments,
  getThreadsByCourse,
  getUsers,
} from "@/lib/store/localStore";

import { delay } from "./utils";
import { BACKEND_FEATURE_FLAGS } from "@/lib/config/backend";
import { httpGet } from "./http.client";

/**
 * Courses API methods
 */
export const coursesAPI = {
  /**
   * Get all active courses
   *
   * @returns Array of active courses sorted by course code
   *
   * @example
   * ```ts
   * const courses = await coursesAPI.getAllCourses();
   * // Returns: [{ id: "course-cs101", code: "CS 101", ... }, ...]
   * ```
   */
  async getAllCourses(): Promise<Course[]> {
    // Check feature flag for backend
    if (BACKEND_FEATURE_FLAGS.courses) {
      try {
        // Call backend endpoint
        const response = await httpGet<{ items: Course[] }>('/api/v1/courses');
        // Backend already filters active courses and sorts them
        return response.items;
      } catch (error) {
        console.error('[Courses] Backend getAllCourses failed:', error);
        // Fall through to localStorage fallback
      }
    }

    // Fallback to localStorage (existing implementation)
    await delay();
    seedData();

    const courses = getCoursesFromStore();
    return courses
      .filter((c) => c.status === "active")
      .sort((a, b) => a.code.localeCompare(b.code));
  },

  /**
   * Get courses for a specific user
   *
   * Returns only active courses the user is enrolled in.
   *
   * @param userId - ID of the user
   * @returns Array of user's enrolled courses sorted by course code
   *
   * @example
   * ```ts
   * const myCourses = await coursesAPI.getUserCourses("user-123");
   * // Returns only courses user-123 is enrolled in
   * ```
   */
  async getUserCourses(userId: string): Promise<Course[]> {
    await delay();
    seedData();

    const enrollments = getEnrollments(userId);
    const allCourses = getCoursesFromStore();

    const courseIds = enrollments.map((e) => e.courseId);
    return allCourses
      .filter((c) => courseIds.includes(c.id) && c.status === "active")
      .sort((a, b) => a.code.localeCompare(b.code));
  },

  /**
   * Get course by ID
   *
   * @param courseId - ID of the course
   * @returns Course object if found, null otherwise
   *
   * @example
   * ```ts
   * const course = await coursesAPI.getCourse("course-cs101");
   * if (course) {
   *   console.log(`Found: ${course.name}`);
   * }
   * ```
   */
  async getCourse(courseId: string): Promise<Course | null> {
    // Check feature flag for backend
    if (BACKEND_FEATURE_FLAGS.courses) {
      try {
        // Call backend endpoint
        const course = await httpGet<Course>(`/api/v1/courses/${courseId}`);
        return course;
      } catch (error) {
        console.error('[Courses] Backend getCourse failed:', error);
        // Fall through to localStorage fallback
      }
    }

    // Fallback to localStorage (existing implementation)
    await delay();
    seedData();

    return getCourseById(courseId);
  },

  /**
   * Get course metrics
   *
   * Provides statistics about thread activity, student engagement,
   * and question resolution rates for a course.
   *
   * @param courseId - ID of the course
   * @returns CourseMetrics object with thread counts and activity stats
   *
   * @example
   * ```ts
   * const metrics = await coursesAPI.getCourseMetrics("course-cs101");
   * console.log(`${metrics.unansweredCount} unanswered questions`);
   * ```
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
   *
   * Analyzes course activity to generate insights about trending topics,
   * top questions, and overall activity patterns.
   *
   * @param courseId - ID of the course
   * @returns CourseInsight with AI-generated analysis
   *
   * @example
   * ```ts
   * const insights = await coursesAPI.getCourseInsights("course-cs101");
   * console.log(insights.summary);
   * console.log(`Trending: ${insights.trendingTopics.join(", ")}`);
   * ```
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
};
