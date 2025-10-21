// ============================================
// Instructor API Module
// ============================================
//
// Handles instructor dashboard data, analytics, FAQ clustering, trending topics,
// insights, search, and response templates

import type {
  StudentDashboardData,
  InstructorDashboardData,
  FrequentlyAskedQuestion,
  TrendingTopic,
  InstructorInsight,
  InstructorMetrics,
  SearchQuestionsInput,
  QuestionSearchResult,
  ResponseTemplate,
  CreateResponseTemplateInput,
  CourseWithActivity,
  ActivityItem,
  CourseWithMetrics,
  CourseMetrics,
  CourseInsight,
  AIAnswer,
  TrendDirection,
  UrgencyLevel,
  Thread,
} from "@/lib/models/types";

import {
  seedData,
  getCourses,
  getThreads,
  getPosts,
  getNotifications,
  getUsers,
  getEnrollments,
  getThreadsByCourse,
  getAIAnswers,
  getAIAnswerById,
  getResponseTemplatesByUser,
  addResponseTemplate,
  deleteResponseTemplate as deleteResponseTemplateFromStore,
  getAssignments,
} from "@/lib/store/localStore";

import {
  createStatWithTrend,
  createGoal,
  generateSparkline,
  getCurrentWeekRange,
  getPreviousWeekRange,
  countInDateRange,
  calculateAICoverage,
} from "@/lib/utils/dashboard-calculations";

import { calculateQuokkaPoints } from "@/lib/utils/quokka-points";
import { calculateAllAssignmentQA } from "@/lib/utils/assignment-qa";

import { delay, generateId, extractKeywords, calculateMatchRatio } from "./utils";
import { httpGet, httpPost, httpDelete } from "./http.client";
import { BACKEND_FEATURE_FLAGS } from "@/lib/config/backend";

/**
 * Instructor API methods
 */
export const instructorAPI = {
  /**
   * Get student dashboard data
   *
   * Returns comprehensive dashboard data for a student including enrolled courses,
   * recent activity, notifications, weekly stats, goals, Quokka Points, and assignment Q&A opportunities.
   *
   * @param userId - ID of the student
   * @returns Student dashboard data object
   *
   * @example
   * ```ts
   * const dashboard = await instructorAPI.getStudentDashboard("user-123");
   * // Returns: {
   * //   enrolledCourses: [...],
   * //   recentActivity: [...],
   * //   notifications: [...],
   * //   stats: { totalCourses, totalThreads, totalPosts, endorsedPosts },
   * //   goals: [...],
   * //   quokkaPoints: { ... },
   * //   assignmentQA: [...]
   * // }
   * ```
   */
  async getStudentDashboard(userId: string): Promise<StudentDashboardData> {
    // Check if backend is enabled
    if (BACKEND_FEATURE_FLAGS.instructor || BACKEND_FEATURE_FLAGS.courses) {
      try {
        // Define response type
        type EnrollmentResponse = {
          items: Array<{
            id: string;
            userId: string;
            courseId: string;
            role: string;
            enrolledAt: string;
            tenantId: string;
            course: {
              id: string;
              code: string;
              name: string;
              term: string;
              description: string;
              status: string;
            } | null;
          }>;
        };

        // Fetch enrollments from backend
        const enrollmentsResponse = await httpGet<EnrollmentResponse>(`/api/v1/courses/enrollments?userId=${userId}`);

        // Fetch other data from localStorage (for now - will be migrated later)
        seedData();
        const allThreads = getThreads();
        const allPosts = getPosts();
        const notifications = getNotifications(userId);
        const users = getUsers();

        // Transform backend enrollments to CourseWithActivity format
        const enrolledCourses: CourseWithActivity[] = enrollmentsResponse.items
          .filter(enrollment => enrollment.course !== null)
          .map(enrollment => {
            const course = enrollment.course!;

            const courseThreads = allThreads.filter((t) => t.courseId === course.id);
            const recentThreads = courseThreads
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .slice(0, 3);

            const unreadCount = notifications.filter(
              (n) => n.courseId === course.id && !n.read
            ).length;

            return {
              // Full Course fields
              id: course.id,
              code: course.code,
              name: course.name,
              term: course.term,
              description: course.description,
              status: course.status as 'active' | 'archived',
              instructorIds: [], // Not provided by backend enrollment endpoint
              enrollmentCount: 0, // Not provided by backend enrollment endpoint
              createdAt: enrollment.enrolledAt, // Use enrollment date as fallback
              // CourseWithActivity fields
              recentThreads,
              unreadCount,
            };
          });

        // Continue with rest of function using backend enrolledCourses
        // Generate recent activity (last 10 items)
        const userThreads = allThreads.filter((t) => t.authorId === userId);
        const userPosts = allPosts.filter((p) => p.authorId === userId);

        const activities: ActivityItem[] = [];

        // Add thread creations
        userThreads.forEach((thread) => {
          const course = enrolledCourses.find((c) => c.id === thread.courseId);
          const author = users.find((u) => u.id === thread.authorId);
          if (course && author) {
            activities.push({
              id: `activity-${thread.id}`,
              type: 'thread_created',
              courseId: course.id,
              courseName: course.name,
              threadId: thread.id,
              threadTitle: thread.title,
              authorId: author.id,
              authorName: author.name,
              timestamp: thread.createdAt,
              summary: `You created a thread: "${thread.title}"`,
            });
          }
        });

        // Add post creations
        userPosts.forEach((post) => {
          const thread = allThreads.find((t) => t.id === post.threadId);
          const course = thread ? enrolledCourses.find((c) => c.id === thread.courseId) : null;
          const author = users.find((u) => u.id === post.authorId);
          if (thread && course && author) {
            activities.push({
              id: `activity-${post.id}`,
              type: 'post_created',
              courseId: course.id,
              courseName: course.name,
              threadId: thread.id,
              threadTitle: thread.title,
              authorId: author.id,
              authorName: author.name,
              timestamp: post.createdAt,
              summary: `You replied to "${thread.title}"`,
            });
          }
        });

        // Add endorsed posts
        userPosts.filter((p) => p.endorsed).forEach((post) => {
          const thread = allThreads.find((t) => t.id === post.threadId);
          const course = thread ? enrolledCourses.find((c) => c.id === thread.courseId) : null;
          const author = users.find((u) => u.id === post.authorId);
          if (thread && course && author) {
            activities.push({
              id: `activity-endorsed-${post.id}`,
              type: 'post_endorsed',
              courseId: course.id,
              courseName: course.name,
              threadId: thread.id,
              threadTitle: thread.title,
              authorId: author.id,
              authorName: author.name,
              timestamp: post.updatedAt,
              summary: `Your reply to "${thread.title}" was endorsed`,
            });
          }
        });

        // Sort by timestamp and take last 10
        const recentActivity = activities
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, 10);

        // Calculate current week stats
        const currentWeek = getCurrentWeekRange();
        const previousWeek = getPreviousWeekRange();

        const currentCourses = enrolledCourses.length;
        const previousCourses = enrolledCourses.length; // Courses don't change weekly in mock

        const currentThreads = countInDateRange(userThreads, currentWeek);
        const previousThreads = countInDateRange(userThreads, previousWeek);

        const currentPosts = countInDateRange(userPosts, currentWeek);
        const previousPosts = countInDateRange(userPosts, previousWeek);

        const currentEndorsed = userPosts.filter(
          (p) => p.endorsed && new Date(p.createdAt) >= currentWeek.start
        ).length;
        const previousEndorsed = userPosts.filter(
          (p) => p.endorsed && new Date(p.createdAt) >= previousWeek.start && new Date(p.createdAt) < currentWeek.start
        ).length;

        // Generate sparklines
        const threadSparkline = generateSparkline(`student-${userId}-threads`, 7, userThreads.length / 7);
        const postSparkline = generateSparkline(`student-${userId}-posts`, 7, userPosts.length / 7);
        const courseSparkline = generateSparkline(`student-${userId}-courses`, 7, enrolledCourses.length / 7);
        const endorsedSparkline = generateSparkline(`student-${userId}-endorsed`, 7, userPosts.filter((p) => p.endorsed).length / 7);

        // Create stats with trends
        const stats = {
          totalCourses: createStatWithTrend(currentCourses, previousCourses, "Courses", courseSparkline),
          totalThreads: createStatWithTrend(currentThreads, previousThreads, "Threads", threadSparkline),
          totalPosts: createStatWithTrend(currentPosts, previousPosts, "Replies", postSparkline),
          endorsedPosts: createStatWithTrend(currentEndorsed, previousEndorsed, "Endorsed", endorsedSparkline),
        };

        // Create student goals
        const goals = [
          createGoal(
            "weekly-participation",
            "Weekly Participation",
            "Post in 2 threads per week",
            currentPosts,
            2,
            "weekly",
            "participation"
          ),
          createGoal(
            "weekly-endorsements",
            "Get Endorsed",
            "Receive 1 endorsement per week",
            currentEndorsed,
            1,
            "weekly",
            "quality"
          ),
          createGoal(
            "weekly-questions",
            "Ask Questions",
            "Ask 1 question per week",
            currentThreads,
            1,
            "weekly",
            "engagement"
          ),
        ];

        const unreadCount = notifications.filter((n) => !n.read).length;

        // Calculate Quokka Points
        const quokkaPoints = calculateQuokkaPoints(userId, userThreads, userPosts);

        // Calculate Assignment Q&A Opportunities
        const assignments = getAssignments();
        const assignmentQA = calculateAllAssignmentQA(
          assignments,
          allThreads,
          allPosts,
          users,
          userId,
          enrolledCourses.map(c => ({ id: c.id, name: c.name }))
        );

        console.log('[Instructor API] getStudentDashboard using BACKEND enrollments:', enrolledCourses.length, 'courses');

        return {
          enrolledCourses,
          recentActivity,
          notifications: notifications.slice(0, 5), // Top 5 notifications
          unreadCount,
          stats,
          goals,
          quokkaPoints,
          assignmentQA,
        };
      } catch (error) {
        console.error('[Instructor API] Backend getStudentDashboard failed, falling back to localStorage:', error);
        // Fall through to localStorage implementation below
      }
    }

    // Fallback: Use localStorage (original implementation)
    await delay(200 + Math.random() * 200); // 200-400ms (faster for landing page)
    seedData();

    const enrollments = getEnrollments(userId);
    const allCourses = getCourses();
    const allThreads = getThreads();
    const allPosts = getPosts();
    const notifications = getNotifications(userId);
    const users = getUsers();

    // Get enrolled courses with recent activity
    const enrolledCourses: CourseWithActivity[] = enrollments.map((enrollment) => {
      const course = allCourses.find((c) => c.id === enrollment.courseId);
      if (!course) return null;

      const courseThreads = allThreads.filter((t) => t.courseId === course.id);
      const recentThreads = courseThreads
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 3);

      const unreadCount = notifications.filter(
        (n) => n.courseId === course.id && !n.read
      ).length;

      return {
        ...course,
        recentThreads,
        unreadCount,
      };
    }).filter((c): c is CourseWithActivity => c !== null);

    // Generate recent activity (last 10 items)
    const userThreads = allThreads.filter((t) => t.authorId === userId);
    const userPosts = allPosts.filter((p) => p.authorId === userId);

    const activities: ActivityItem[] = [];

    // Add thread creations
    userThreads.forEach((thread) => {
      const course = allCourses.find((c) => c.id === thread.courseId);
      const author = users.find((u) => u.id === thread.authorId);
      if (course && author) {
        activities.push({
          id: `activity-${thread.id}`,
          type: 'thread_created',
          courseId: course.id,
          courseName: course.name,
          threadId: thread.id,
          threadTitle: thread.title,
          authorId: author.id,
          authorName: author.name,
          timestamp: thread.createdAt,
          summary: `You created a thread: "${thread.title}"`,
        });
      }
    });

    // Add post creations
    userPosts.forEach((post) => {
      const thread = allThreads.find((t) => t.id === post.threadId);
      const course = thread ? allCourses.find((c) => c.id === thread.courseId) : null;
      const author = users.find((u) => u.id === post.authorId);
      if (thread && course && author) {
        activities.push({
          id: `activity-${post.id}`,
          type: 'post_created',
          courseId: course.id,
          courseName: course.name,
          threadId: thread.id,
          threadTitle: thread.title,
          authorId: author.id,
          authorName: author.name,
          timestamp: post.createdAt,
          summary: `You replied to "${thread.title}"`,
        });
      }
    });

    // Add endorsed posts
    userPosts.filter((p) => p.endorsed).forEach((post) => {
      const thread = allThreads.find((t) => t.id === post.threadId);
      const course = thread ? allCourses.find((c) => c.id === thread.courseId) : null;
      const author = users.find((u) => u.id === post.authorId);
      if (thread && course && author) {
        activities.push({
          id: `activity-endorsed-${post.id}`,
          type: 'post_endorsed',
          courseId: course.id,
          courseName: course.name,
          threadId: thread.id,
          threadTitle: thread.title,
          authorId: author.id,
          authorName: author.name,
          timestamp: post.updatedAt,
          summary: `Your reply to "${thread.title}" was endorsed`,
        });
      }
    });

    // Sort by timestamp and take last 10
    const recentActivity = activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);

    // Calculate current week stats
    const currentWeek = getCurrentWeekRange();
    const previousWeek = getPreviousWeekRange();

    const currentCourses = enrolledCourses.length;
    const previousCourses = enrolledCourses.length; // Courses don't change weekly in mock

    const currentThreads = countInDateRange(userThreads, currentWeek);
    const previousThreads = countInDateRange(userThreads, previousWeek);

    const currentPosts = countInDateRange(userPosts, currentWeek);
    const previousPosts = countInDateRange(userPosts, previousWeek);

    const currentEndorsed = userPosts.filter(
      (p) => p.endorsed && new Date(p.createdAt) >= currentWeek.start
    ).length;
    const previousEndorsed = userPosts.filter(
      (p) => p.endorsed && new Date(p.createdAt) >= previousWeek.start && new Date(p.createdAt) < currentWeek.start
    ).length;

    // Generate sparklines
    const threadSparkline = generateSparkline(`student-${userId}-threads`, 7, userThreads.length / 7);
    const postSparkline = generateSparkline(`student-${userId}-posts`, 7, userPosts.length / 7);
    const courseSparkline = generateSparkline(`student-${userId}-courses`, 7, enrolledCourses.length / 7);
    const endorsedSparkline = generateSparkline(`student-${userId}-endorsed`, 7, userPosts.filter((p) => p.endorsed).length / 7);

    // Create stats with trends
    const stats = {
      totalCourses: createStatWithTrend(currentCourses, previousCourses, "Courses", courseSparkline),
      totalThreads: createStatWithTrend(currentThreads, previousThreads, "Threads", threadSparkline),
      totalPosts: createStatWithTrend(currentPosts, previousPosts, "Replies", postSparkline),
      endorsedPosts: createStatWithTrend(currentEndorsed, previousEndorsed, "Endorsed", endorsedSparkline),
    };

    // Create student goals
    const goals = [
      createGoal(
        "weekly-participation",
        "Weekly Participation",
        "Post in 2 threads per week",
        currentPosts,
        2,
        "weekly",
        "participation"
      ),
      createGoal(
        "weekly-endorsements",
        "Get Endorsed",
        "Receive 1 endorsement per week",
        currentEndorsed,
        1,
        "weekly",
        "quality"
      ),
      createGoal(
        "weekly-questions",
        "Ask Questions",
        "Ask 1 question per week",
        currentThreads,
        1,
        "weekly",
        "engagement"
      ),
    ];

    const unreadCount = notifications.filter((n) => !n.read).length;

    // Calculate Quokka Points
    const quokkaPoints = calculateQuokkaPoints(userId, userThreads, userPosts);

    // Calculate Assignment Q&A Opportunities
    const assignments = getAssignments();
    const assignmentQA = calculateAllAssignmentQA(
      assignments,
      allThreads,
      allPosts,
      users,
      userId,
      enrolledCourses.map(c => ({ id: c.id, name: c.name }))
    );

    return {
      enrolledCourses,
      recentActivity,
      notifications: notifications.slice(0, 5), // Top 5 notifications
      unreadCount,
      stats,
      goals,
      quokkaPoints,
      assignmentQA,
    };
  },

  /**
   * Get instructor dashboard data (aggregated)
   *
   * Returns comprehensive dashboard data for instructors including managed courses,
   * unanswered queue, recent activity, insights, stats, and goals.
   *
   * @param userId - ID of the instructor
   * @returns Instructor dashboard data object
   *
   * @example
   * ```ts
   * const dashboard = await instructorAPI.getInstructorDashboard("instructor-123");
   * // Returns: {
   * //   managedCourses: [...],
   * //   unansweredQueue: [...],
   * //   recentActivity: [...],
   * //   insights: [...],
   * //   stats: { totalCourses, totalThreads, unansweredThreads, activeStudents, aiCoverage },
   * //   goals: [...]
   * // }
   * ```
   */
  async getInstructorDashboard(userId: string): Promise<InstructorDashboardData> {
    await delay(300 + Math.random() * 200); // 300-500ms
    seedData();

    const allCourses = getCourses();
    const allThreads = getThreads();
    const users = getUsers();

    // Get courses where user is instructor
    const managedCourses: CourseWithMetrics[] = allCourses
      .filter((course) => course.instructorIds.includes(userId))
      .map((course) => {
        const courseThreads = allThreads.filter((t) => t.courseId === course.id);

        // Calculate metrics
        const metrics: CourseMetrics = {
          threadCount: courseThreads.length,
          unansweredCount: courseThreads.filter((t) => t.status === 'open').length,
          answeredCount: courseThreads.filter((t) => t.status === 'answered').length,
          resolvedCount: courseThreads.filter((t) => t.status === 'resolved').length,
          activeStudents: new Set(
            courseThreads.map((t) => t.authorId)
          ).size,
          recentActivity: courseThreads.filter(
            (t) => new Date(t.createdAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
          ).length,
        };

        return {
          ...course,
          metrics,
        };
      });

    // Get unanswered threads across all managed courses
    const managedCourseIds = managedCourses.map((c) => c.id);
    const unansweredQueue = allThreads
      .filter((t) => managedCourseIds.includes(t.courseId) && t.status === 'open')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10); // Top 10 unanswered

    // Generate recent activity
    const activities: ActivityItem[] = [];

    managedCourseIds.forEach((courseId) => {
      const course = allCourses.find((c) => c.id === courseId);
      if (!course) return;

      const courseThreads = allThreads
        .filter((t) => t.courseId === courseId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);

      courseThreads.forEach((thread) => {
        const author = users.find((u) => u.id === thread.authorId);
        if (author) {
          activities.push({
            id: `activity-${thread.id}`,
            type: 'thread_created',
            courseId: course.id,
            courseName: course.name,
            threadId: thread.id,
            threadTitle: thread.title,
            authorId: author.id,
            authorName: author.name,
            timestamp: thread.createdAt,
            summary: `New thread in ${course.code}: "${thread.title}"`,
          });
        }
      });
    });

    const recentActivity = activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);

    // Mock insights (would be AI-generated in production)
    const insights: CourseInsight[] = managedCourses.map((course) => ({
      id: `insight-${course.id}`,
      courseId: course.id,
      summary: `${course.code} has ${course.metrics.activeStudents} active students with ${course.metrics.recentActivity} threads this week.`,
      activeThreads: course.metrics.threadCount,
      topQuestions: allThreads
        .filter((t) => t.courseId === course.id)
        .sort((a, b) => b.views - a.views)
        .slice(0, 3)
        .map((t) => t.title),
      trendingTopics: [],
      generatedAt: new Date().toISOString(),
    }));

    // Calculate current and previous week stats
    const currentWeek = getCurrentWeekRange();
    const previousWeek = getPreviousWeekRange();

    const allManagedThreads = allThreads.filter((t) => managedCourseIds.includes(t.courseId));

    const currentCourses = managedCourses.length;
    const previousCourses = managedCourses.length; // Courses don't change weekly

    const currentThreads = countInDateRange(allManagedThreads, currentWeek);
    const previousThreads = countInDateRange(allManagedThreads, previousWeek);

    const currentUnanswered = allManagedThreads.filter(
      (t) => t.status === 'open' && new Date(t.createdAt) >= currentWeek.start
    ).length;
    const previousUnanswered = allManagedThreads.filter(
      (t) => t.status === 'open' && new Date(t.createdAt) >= previousWeek.start && new Date(t.createdAt) < currentWeek.start
    ).length;

    const currentStudents = new Set(
      allManagedThreads
        .filter((t) => new Date(t.createdAt) >= currentWeek.start)
        .map((t) => t.authorId)
    ).size;
    const previousStudents = new Set(
      allManagedThreads
        .filter((t) => new Date(t.createdAt) >= previousWeek.start && new Date(t.createdAt) < currentWeek.start)
        .map((t) => t.authorId)
    ).size;

    // Calculate AI coverage (mock)
    const avgAICoverage = managedCourseIds.reduce((sum, id) => sum + calculateAICoverage(id), 0) / managedCourseIds.length;
    const currentAICoverage = Math.round(avgAICoverage);
    const previousAICoverage = Math.round(avgAICoverage - 2); // Mock: slight improvement over time

    // Generate sparklines
    const threadSparkline = generateSparkline(`instructor-threads`, 7, allManagedThreads.length / 7);
    const unansweredSparkline = generateSparkline(`instructor-unanswered`, 7, unansweredQueue.length / 7);

    // Create stats with trends
    const stats = {
      totalCourses: createStatWithTrend(currentCourses, previousCourses, "Courses"),
      totalThreads: createStatWithTrend(currentThreads, previousThreads, "Threads", threadSparkline),
      unansweredThreads: createStatWithTrend(currentUnanswered, previousUnanswered, "Unanswered", unansweredSparkline),
      activeStudents: createStatWithTrend(currentStudents, previousStudents, "Active Students"),
      aiCoverage: createStatWithTrend(currentAICoverage, previousAICoverage, "AI Coverage"),
    };

    // Create instructor goals
    const goals = [
      createGoal(
        "response-time",
        "Response Time",
        "Respond to 80% of threads within 24h",
        75, // Mock current
        80,
        "weekly",
        "response-time"
      ),
      createGoal(
        "ai-coverage",
        "AI Coverage",
        "Maintain 70%+ AI coverage",
        currentAICoverage,
        70,
        "weekly",
        "engagement"
      ),
      createGoal(
        "student-engagement",
        "Student Engagement",
        "60%+ students actively participating",
        55, // Mock current
        60,
        "weekly",
        "engagement"
      ),
    ];

    return {
      managedCourses,
      unansweredQueue,
      recentActivity,
      insights,
      stats,
      goals,
    };
  },

  /**
   * Get frequently asked questions (FAQ clusters)
   *
   * Groups similar threads by keyword matching to identify common questions.
   * Uses a 40% similarity threshold to cluster threads together.
   *
   * @param courseId - ID of the course
   * @returns Array of FAQ clusters sorted by frequency
   *
   * @example
   * ```ts
   * const faqs = await instructorAPI.getFrequentlyAskedQuestions("course-cs101");
   * // Returns: [
   * //   {
   * //     id: "faq-...",
   * //     title: "How does binary search work?",
   * //     threads: [...], // 5 similar threads
   * //     commonKeywords: ["binary", "search", "algorithm"],
   * //     frequency: 5,
   * //     avgConfidence: 85,
   * //     hasInstructorEndorsement: true
   * //   }
   * // ]
   * ```
   */
  async getFrequentlyAskedQuestions(courseId: string): Promise<FrequentlyAskedQuestion[]> {
    await delay(400 + Math.random() * 200); // 400-600ms (expensive O(n²) operation)
    seedData();

    const threads = getThreadsByCourse(courseId);
    const aiAnswers = getAIAnswers();

    // Group threads by similarity (keyword matching)
    const clusters: Map<string, Thread[]> = new Map();
    const processed = new Set<string>();

    threads.forEach((thread, idx) => {
      if (processed.has(thread.id)) return;

      const threadKeywords = extractKeywords(`${thread.title} ${thread.content} ${thread.tags?.join(' ') || ''}`);
      const cluster: Thread[] = [thread];
      processed.add(thread.id);

      // Find similar threads
      threads.slice(idx + 1).forEach((otherThread) => {
        if (processed.has(otherThread.id)) return;

        const otherKeywords = extractKeywords(`${otherThread.title} ${otherThread.content} ${otherThread.tags?.join(' ') || ''}`);
        const similarity = calculateMatchRatio(threadKeywords, otherKeywords);

        if (similarity >= 0.4) { // 40% similarity threshold
          cluster.push(otherThread);
          processed.add(otherThread.id);
        }
      });

      // Only create FAQ if 2+ similar threads
      if (cluster.length >= 2) {
        clusters.set(thread.id, cluster);
      }
    });

    // Convert clusters to FrequentlyAskedQuestion objects
    const faqs: FrequentlyAskedQuestion[] = Array.from(clusters.entries()).map(([representativeId, clusterThreads]) => {
      const representative = clusterThreads[0];

      // Extract common keywords
      const allKeywords = clusterThreads.map(t =>
        extractKeywords(`${t.title} ${t.content} ${t.tags?.join(' ') || ''}`)
      );
      const keywordCounts = allKeywords.flat().reduce((acc, keyword) => {
        acc[keyword] = (acc[keyword] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const commonKeywords = Object.entries(keywordCounts)
        .filter(([, count]) => count >= clusterThreads.length * 0.5) // Present in 50%+ of threads
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([keyword]) => keyword);

      // Calculate average AI confidence
      const confidenceScores = clusterThreads
        .map(t => {
          if (t.aiAnswerId) {
            const aiAnswer = aiAnswers.find((a: AIAnswer) => a.id === t.aiAnswerId);
            return aiAnswer?.confidenceScore || 0;
          }
          return 0;
        })
        .filter(score => score > 0);

      const avgConfidence = confidenceScores.length > 0
        ? Math.round(confidenceScores.reduce((sum, score) => sum + score, 0) / confidenceScores.length)
        : 0;

      // Check for instructor endorsement
      const hasInstructorEndorsement = clusterThreads.some(t => {
        if (t.aiAnswerId) {
          const aiAnswer = aiAnswers.find((a: AIAnswer) => a.id === t.aiAnswerId);
          return aiAnswer?.instructorEndorsed || false;
        }
        return false;
      });

      return {
        id: generateId('faq'),
        title: representative.title,
        threads: clusterThreads,
        commonKeywords,
        frequency: clusterThreads.length,
        avgConfidence,
        hasInstructorEndorsement,
      };
    });

    // Sort by frequency (most common first)
    return faqs.sort((a, b) => b.frequency - a.frequency);
  },

  /**
   * Get trending topics with frequency analysis
   *
   * Analyzes tag frequencies over the specified time range and calculates growth trends.
   *
   * @param courseId - ID of the course
   * @param timeRange - Time range for trend analysis ('week', 'month', or 'quarter')
   * @returns Array of trending topics with growth metrics (top 10)
   *
   * @example
   * ```ts
   * const topics = await instructorAPI.getTrendingTopics("course-cs101", "week");
   * // Returns: [
   * //   {
   * //     topic: "binary-search",
   * //     count: 12,
   * //     threadIds: ["thread-1", "thread-2", "thread-3"],
   * //     recentGrowth: 50, // 50% growth
   * //     trend: "rising",
   * //     timeRange: { start: "...", end: "..." }
   * //   }
   * // ]
   * ```
   */
  async getTrendingTopics(courseId: string, timeRange: 'week' | 'month' | 'quarter' = 'week'): Promise<TrendingTopic[]> {
    await delay(300 + Math.random() * 200); // 300-500ms
    seedData();

    const threads = getThreadsByCourse(courseId);
    const now = new Date();

    // Calculate time ranges
    const rangeMs = timeRange === 'week' ? 7 * 24 * 60 * 60 * 1000
                  : timeRange === 'month' ? 30 * 24 * 60 * 60 * 1000
                  : 90 * 24 * 60 * 60 * 1000;

    const currentStart = new Date(now.getTime() - rangeMs);
    const previousStart = new Date(now.getTime() - (rangeMs * 2));

    // Get threads in current and previous periods
    const currentThreads = threads.filter(t => new Date(t.createdAt) >= currentStart);
    const previousThreads = threads.filter(t =>
      new Date(t.createdAt) >= previousStart && new Date(t.createdAt) < currentStart
    );

    // Count tag frequencies
    const currentTagCounts: Record<string, { count: number; threadIds: string[] }> = {};
    currentThreads.forEach(thread => {
      thread.tags?.forEach(tag => {
        if (!currentTagCounts[tag]) {
          currentTagCounts[tag] = { count: 0, threadIds: [] };
        }
        currentTagCounts[tag].count++;
        if (currentTagCounts[tag].threadIds.length < 3) {
          currentTagCounts[tag].threadIds.push(thread.id);
        }
      });
    });

    const previousTagCounts: Record<string, number> = {};
    previousThreads.forEach(thread => {
      thread.tags?.forEach(tag => {
        previousTagCounts[tag] = (previousTagCounts[tag] || 0) + 1;
      });
    });

    // Calculate trends
    const topics: TrendingTopic[] = Object.entries(currentTagCounts).map(([topic, data]) => {
      const currentCount = data.count;
      const previousCount = previousTagCounts[topic] || 0;

      // Calculate percentage growth
      const growth = previousCount > 0
        ? ((currentCount - previousCount) / previousCount) * 100
        : currentCount > 0 ? 100 : 0;

      // Determine trend direction
      let trend: TrendDirection = 'stable';
      if (growth > 20) trend = 'rising';
      else if (growth < -20) trend = 'falling';

      return {
        topic,
        count: currentCount,
        threadIds: data.threadIds,
        recentGrowth: Math.round(growth),
        trend,
        timeRange: {
          start: currentStart.toISOString(),
          end: now.toISOString(),
        },
      };
    });

    // Sort by count (most popular first)
    return topics.sort((a, b) => b.count - a.count).slice(0, 10);
  },

  /**
   * Get instructor insights with priority ranking
   *
   * Analyzes threads across managed courses and calculates priority scores based on
   * views, time open, AI confidence, and answered status. Returns top 20 prioritized items.
   *
   * @param userId - ID of the instructor
   * @returns Array of instructor insights sorted by priority (top 20)
   *
   * @example
   * ```ts
   * const insights = await instructorAPI.getInstructorInsights("instructor-123");
   * // Returns: [
   * //   {
   * //     thread: { ... },
   * //     priorityScore: 95,
   * //     urgency: "critical",
   * //     engagement: { views: 120, replies: 5, lastActivity: "..." },
   * //     reasonFlags: ["high_views", "unanswered_48h"],
   * //     aiAnswer: { ... }
   * //   }
   * // ]
   * ```
   */
  async getInstructorInsights(userId: string): Promise<InstructorInsight[]> {
    await delay(200 + Math.random() * 100); // 200-300ms
    seedData();

    const allCourses = getCourses();
    const allThreads = getThreads();
    const allPosts = getPosts();
    const aiAnswers = getAIAnswers();

    // Get courses managed by this instructor
    const managedCourseIds = allCourses
      .filter(c => c.instructorIds.includes(userId))
      .map(c => c.id);

    // Get threads from managed courses
    const managedThreads = allThreads.filter(t => managedCourseIds.includes(t.courseId));

    // Calculate priority for each thread
    const insights: InstructorInsight[] = managedThreads.map(thread => {
      const posts = allPosts.filter(p => p.threadId === thread.id);
      const aiAnswer = thread.aiAnswerId ? aiAnswers.find((a: AIAnswer) => a.id === thread.aiAnswerId) : undefined;

      // Calculate time open (in hours)
      const createdAt = new Date(thread.createdAt);
      const now = new Date();
      const hoursOpen = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

      // Priority score calculation (0-100)
      // Formula: (views * 0.3) + (hoursOpen * 0.4) + reviewBoost + unansweredBoost
      let priorityScore = 0;
      const reasonFlags: string[] = [];

      // Views weight (0-30 points)
      priorityScore += Math.min(30, thread.views * 0.5);
      if (thread.views > 50) reasonFlags.push('high_views');

      // Time open weight (0-40 points)
      priorityScore += Math.min(40, hoursOpen * 0.5);
      if (hoursOpen > 48) reasonFlags.push('unanswered_48h');
      else if (hoursOpen > 24) reasonFlags.push('unanswered_24h');

      // AI review needed boost (10 points)
      if (aiAnswer && aiAnswer.confidenceLevel === 'low') {
        priorityScore += 10;
        reasonFlags.push('low_ai_confidence');
      }

      // Unanswered boost (20 points)
      if (thread.status === 'open') {
        priorityScore += 20;
        reasonFlags.push('unanswered');
      }

      // Determine urgency level
      let urgency: UrgencyLevel = 'low';
      if (priorityScore >= 80) urgency = 'critical';
      else if (priorityScore >= 60) urgency = 'high';
      else if (priorityScore >= 40) urgency = 'medium';

      return {
        thread,
        priorityScore: Math.min(100, Math.round(priorityScore)),
        urgency,
        engagement: {
          views: thread.views,
          replies: posts.length,
          lastActivity: thread.updatedAt,
        },
        reasonFlags,
        aiAnswer,
      };
    });

    // Sort by priority score (highest first)
    return insights
      .sort((a, b) => b.priorityScore - a.priorityScore)
      .slice(0, 20); // Return top 20
  },

  /**
   * Search questions with natural language query
   *
   * Performs keyword-based search across threads with relevance scoring.
   * Minimum 3 characters required, 20% relevance threshold.
   *
   * @param input - Search parameters (courseId, query, limit)
   * @returns Array of search results with relevance scores
   *
   * @example
   * ```ts
   * const results = await instructorAPI.searchQuestions({
   *   courseId: "course-cs101",
   *   query: "binary search algorithm",
   *   limit: 20
   * });
   * // Returns: [
   * //   {
   * //     thread: { ... },
   * //     relevanceScore: 85,
   * //     matchedKeywords: ["binary", "search", "algorithm"]
   * //   }
   * // ]
   * ```
   */
  async searchQuestions(input: SearchQuestionsInput): Promise<QuestionSearchResult[]> {
    await delay(200 + Math.random() * 100); // 200-300ms
    seedData();

    const { courseId, query, limit = 20 } = input;

    // Minimum 3 characters
    if (query.trim().length < 3) {
      return [];
    }

    const threads = getThreadsByCourse(courseId);
    const queryKeywords = extractKeywords(query);

    // Search and score each thread
    const results: QuestionSearchResult[] = threads.map(thread => {
      const threadText = `${thread.title} ${thread.content} ${thread.tags?.join(' ') || ''}`;
      const threadKeywords = extractKeywords(threadText);

      // Calculate relevance score
      const matchedKeywords = queryKeywords.filter(k => threadKeywords.includes(k));
      const relevanceScore = matchedKeywords.length > 0
        ? Math.round((matchedKeywords.length / queryKeywords.length) * 100)
        : 0;

      return {
        thread,
        relevanceScore,
        matchedKeywords,
      };
    });

    // Filter by minimum relevance (20%) and sort
    return results
      .filter(r => r.relevanceScore >= 20)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);
  },

  /**
   * Get response templates for a user
   *
   * Returns all response templates created by the user, sorted by usage count.
   *
   * @param userId - ID of the user
   * @returns Array of response templates sorted by usage count
   *
   * @example
   * ```ts
   * const templates = await instructorAPI.getResponseTemplates("instructor-123");
   * // Returns: [
   * //   {
   * //     id: "template-1",
   * //     title: "Office Hours",
   * //     content: "Please join office hours...",
   * //     category: "admin",
   * //     usageCount: 45
   * //   }
   * // ]
   * ```
   */
  async getResponseTemplates(userId: string): Promise<ResponseTemplate[]> {
    // Check feature flag for backend
    if (BACKEND_FEATURE_FLAGS.instructor) {
      try {
        // Call backend endpoint
        const response = await httpGet<{ templates: ResponseTemplate[] }>(
          `/api/v1/users/${userId}/response-templates`
        );
        return response.templates;
      } catch (error) {
        console.error('[Instructor] Backend get templates failed:', error);
        // Fall through to localStorage fallback
      }
    }

    // Fallback: Use localStorage
    await delay(100 + Math.random() * 50); // 100-150ms (fast)
    seedData();

    const templates = getResponseTemplatesByUser(userId);

    // Sort by usage count (most used first)
    return templates.sort((a, b) => b.usageCount - a.usageCount);
  },

  /**
   * Save new response template
   *
   * Creates a new response template for the user to reuse in replies.
   *
   * @param input - Template creation parameters
   * @param userId - ID of the user creating the template
   * @returns Created response template
   *
   * @example
   * ```ts
   * const template = await instructorAPI.saveResponseTemplate({
   *   title: "Office Hours Reminder",
   *   content: "Please join office hours on Tuesdays at 2 PM.",
   *   category: "admin",
   *   tags: ["office-hours", "admin"]
   * }, "instructor-123");
   * ```
   */
  async saveResponseTemplate(input: CreateResponseTemplateInput, userId: string): Promise<ResponseTemplate> {
    // Check feature flag for backend
    if (BACKEND_FEATURE_FLAGS.instructor) {
      try {
        // Call backend endpoint
        // Note: Backend uses courseId, frontend uses category. Using "course-general" as fallback.
        const response = await httpPost<ResponseTemplate>(
          `/api/v1/response-templates`,
          {
            userId,
            courseId: "course-general", // TODO: Get from context or make category-to-courseId mapping
            title: input.title,
            content: input.content,
            tags: input.tags,
          }
        );
        return response;
      } catch (error) {
        console.error('[Instructor] Backend save template failed:', error);
        // Fall through to localStorage fallback
      }
    }

    // Fallback: Use localStorage
    await delay(100 + Math.random() * 50); // 100-150ms
    seedData();

    const newTemplate: ResponseTemplate = {
      id: generateId('template'),
      userId,
      title: input.title,
      content: input.content,
      category: input.category,
      tags: input.tags,
      usageCount: 0,
      createdAt: new Date().toISOString(),
    };

    addResponseTemplate(newTemplate);

    return newTemplate;
  },

  /**
   * Delete response template
   *
   * Permanently deletes a response template.
   *
   * @param templateId - ID of the template to delete
   *
   * @example
   * ```ts
   * await instructorAPI.deleteResponseTemplate("template-123");
   * ```
   */
  async deleteResponseTemplate(templateId: string): Promise<void> {
    // Check feature flag for backend
    if (BACKEND_FEATURE_FLAGS.instructor) {
      try {
        // Call backend endpoint
        await httpDelete<void>(`/api/v1/response-templates/${templateId}`);
        return;
      } catch (error) {
        console.error('[Instructor] Backend delete template failed:', error);
        // Fall through to localStorage fallback
      }
    }

    // Fallback: Use localStorage
    await delay(50); // Quick action
    seedData();

    deleteResponseTemplateFromStore(templateId);
  },

  /**
   * Get instructor metrics for a course
   *
   * Returns ROI metrics, engagement stats, and top contributors for a course.
   *
   * @param courseId - ID of the course
   * @param timeRange - Time range for metrics
   * @returns Instructor metrics data
   *
   * @example
   * ```ts
   * const metrics = await instructorAPI.getInstructorMetrics('course-cs101', 'week');
   * ```
   */
  async getInstructorMetrics(
    courseId: string,
    timeRange: 'week' | 'month' | 'quarter' | 'all-time' = 'week'
  ): Promise<InstructorMetrics> {
    // Check feature flag for backend
    if (BACKEND_FEATURE_FLAGS.instructor) {
      try {
        // Call backend endpoint
        const metrics = await httpGet<InstructorMetrics>(
          `/api/v1/instructor/metrics?courseId=${courseId}&timeRange=${timeRange}`
        );
        return metrics;
      } catch (error) {
        console.error('[Instructor] Backend getInstructorMetrics failed:', error);
        // Fall through to localStorage fallback
      }
    }

    // Fallback: Use mock data
    await delay(300);

    // Return mock metrics data
    const metrics: InstructorMetrics = {
      courseId,
      timeRange,
      questionsAutoAnswered: 42,
      timeSavedMinutes: 210, // 3.5 hours
      citationCoverage: 85,
      endorsedThreadsCount: 15,
      endorsedThreadsViews: 450,
      averageViewsPerEndorsed: 30,
      totalThreads: 87,
      totalReplies: 234,
      activeStudents: 45,
      topContributors: [
        {
          userId: 'user-alice',
          name: 'Alice Chen',
          threadCount: 12,
          replyCount: 34,
        },
        {
          userId: 'user-bob',
          name: 'Bob Smith',
          threadCount: 9,
          replyCount: 28,
        },
      ],
      topTopics: [
        { tag: 'algorithms', count: 15, trend: 'up' as const },
        { tag: 'data-structures', count: 12, trend: 'stable' as const },
        { tag: 'recursion', count: 8, trend: 'down' as const },
      ],
    };

    return metrics;
  },
};
