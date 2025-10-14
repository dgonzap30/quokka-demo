/**
 * Assignment Q&A calculation utilities
 * Metrics and recommendations for assignment-related Q&A engagement
 */

import type { Thread, Post, User, Assignment, AssignmentQAMetrics } from "@/lib/models/types";

// ============================================
// Assignment Q&A Calculation
// ============================================

/**
 * Calculate Q&A metrics for a single assignment
 *
 * @param assignment - Assignment metadata
 * @param allThreads - All threads in the system
 * @param allPosts - All posts in the system
 * @param allUsers - All users (for role checking)
 * @param userId - Current user ID
 * @returns AssignmentQAMetrics with engagement data
 */
export function calculateAssignmentQA(
  assignment: Assignment,
  allThreads: Thread[],
  allPosts: Post[],
  allUsers: User[],
  userId: string
): AssignmentQAMetrics {
  // 1. Find threads tagged with this assignment
  // Tag format: "assignment-{assignmentId}" (e.g., "assignment-1")
  const assignmentTag = `assignment-${assignment.id}`;
  const assignmentThreads = allThreads.filter(t =>
    t.courseId === assignment.courseId &&
    t.tags?.includes(assignmentTag)
  );

  // 2. Calculate total questions
  const totalQuestions = assignmentThreads.length;

  // 3. Calculate unanswered questions (status = 'open')
  const unansweredQuestions = assignmentThreads.filter(t =>
    t.status === 'open'
  ).length;

  // 4. Calculate user's questions
  const yourQuestions = assignmentThreads.filter(t =>
    t.authorId === userId
  ).length;

  // 5. Calculate user's answers (posts in assignment threads)
  const threadIds = assignmentThreads.map(t => t.id);
  const yourAnswers = allPosts.filter(p =>
    threadIds.includes(p.threadId) &&
    p.authorId === userId
  ).length;

  // 6. Calculate AI answers available
  const aiAnswersAvailable = assignmentThreads.filter(t =>
    t.hasAIAnswer
  ).length;

  // 7. Calculate active students (unique authors)
  const authorIds = new Set(assignmentThreads.map(t => t.authorId));
  const activeStudents = authorIds.size;

  // 8. Calculate recent activity (last 24 hours)
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recentThreads = assignmentThreads.filter(t =>
    new Date(t.createdAt) >= oneDayAgo
  );
  const recentActivity = recentThreads.length > 0
    ? `${recentThreads.length} question${recentThreads.length !== 1 ? 's' : ''} in last 24h`
    : undefined;

  // 9. Determine suggested action (server-side recommendation)
  let suggestedAction: "ask" | "answer" | "review";
  let actionReason: string;

  if (unansweredQuestions >= 5) {
    // Critical: many unanswered questions
    suggestedAction = "answer";
    actionReason = `${unansweredQuestions} unanswered questions need help`;
  } else if (unansweredQuestions >= 1 && unansweredQuestions < 5) {
    // Moderate: some unanswered questions
    suggestedAction = "answer";
    actionReason = `${unansweredQuestions} question${unansweredQuestions !== 1 ? 's' : ''} waiting for answers`;
  } else if (totalQuestions === 0 || yourQuestions === 0) {
    // No activity or user hasn't asked
    suggestedAction = "ask";
    actionReason = yourQuestions === 0
      ? "Start the discussion - ask a question"
      : "Be the first to ask about this assignment";
  } else if (aiAnswersAvailable > 0 && totalQuestions === yourQuestions + yourAnswers) {
    // All questions answered, AI answers available
    suggestedAction = "review";
    actionReason = "All questions answered - review AI responses";
  } else {
    // Default: encourage asking
    suggestedAction = "ask";
    actionReason = "Ask questions to clarify concepts";
  }

  // 10. Generate link to assignment Q&A page
  const link = `/courses/${assignment.courseId}/assignments/${assignment.id}/qa`;

  return {
    assignmentId: assignment.id,
    title: assignment.title,
    courseId: assignment.courseId,
    courseName: "", // Will be filled by caller
    dueDate: assignment.dueDate,
    totalQuestions,
    unansweredQuestions,
    yourQuestions,
    yourAnswers,
    aiAnswersAvailable,
    activeStudents,
    recentActivity,
    suggestedAction,
    actionReason,
    link,
  };
}

/**
 * Calculate Q&A metrics for all assignments in user's courses
 *
 * @returns Array of AssignmentQAMetrics sorted by due date (nearest first)
 */
export function calculateAllAssignmentQA(
  assignments: Assignment[],
  allThreads: Thread[],
  allPosts: Post[],
  allUsers: User[],
  userId: string,
  userCourses: Array<{ id: string; name: string }>
): AssignmentQAMetrics[] {
  // Filter assignments for user's enrolled courses
  const courseIds = userCourses.map(c => c.id);
  const userAssignments = assignments.filter(a =>
    courseIds.includes(a.courseId)
  );

  // Calculate metrics for each assignment
  const metrics = userAssignments.map(assignment => {
    const qa = calculateAssignmentQA(assignment, allThreads, allPosts, allUsers, userId);

    // Fill in course name
    const course = userCourses.find(c => c.id === assignment.courseId);
    qa.courseName = course?.name || "Unknown Course";

    return qa;
  });

  // Sort by due date (nearest first)
  metrics.sort((a, b) =>
    new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  );

  // Return top 5 upcoming assignments
  return metrics.slice(0, 5);
}
