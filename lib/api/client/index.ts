// ============================================
// Main API Client - Aggregates All Modules
// ============================================
//
// This file aggregates all API modules into a single client instance.
// As modules are extracted from the monolithic client.ts, they are imported here.
//
// **Phase 3.1 Progress:** 6/9 modules extracted (auth, notifications, courses, materials, posts, conversations)
// **Remaining:** threads, ai-answers, instructor

import { authAPI } from "./auth";
import { notificationsAPI } from "./notifications";
import { coursesAPI } from "./courses";
import { materialsAPI } from "./materials";
import { postsAPI } from "./posts";
import { conversationsAPI } from "./conversations";

// TODO: Import remaining modules as they are extracted
// import { threadsAPI } from "./threads";
// import { aiAnswersAPI } from "./ai-answers";
// import { instructorAPI } from "./instructor";

// Temporary: Import all methods from original client.ts for non-extracted modules
// These will be removed as modules are extracted
import { api as legacyAPI } from "../client";

/**
 * Main API client - Aggregated from domain modules
 *
 * **Architecture:**
 * - Each domain (auth, courses, threads, etc.) is in its own module
 * - This index aggregates all modules into a single API instance
 * - Import paths stay the same: `import { api } from "@/lib/api/client"`
 *
 * **Migration Status:**
 * - ✅ auth (5 methods)
 * - ✅ notifications (3 methods)
 * - ✅ courses (5 methods)
 * - ✅ materials (2 methods)
 * - ✅ posts (1 method)
 * - ✅ conversations (6 methods)
 * - ⏳ threads (8 methods) - TODO
 * - ⏳ ai-answers (5 methods) - TODO
 * - ⏳ instructor (8 methods) - TODO
 *
 * @example
 * ```ts
 * import { api } from "@/lib/api/client";
 *
 * // Auth module (extracted)
 * const user = await api.login({ email, password });
 *
 * // Courses module (not yet extracted - uses legacy)
 * const courses = await api.getAllCourses();
 * ```
 */
export const api = {
  // ============================================
  // Authentication (Extracted Module)
  // ============================================
  ...authAPI,

  // ============================================
  // Notifications (Extracted Module)
  // ============================================
  ...notificationsAPI,

  // ============================================
  // Courses (Extracted Module)
  // ============================================
  ...coursesAPI,

  // ============================================
  // Materials (Extracted Module)
  // ============================================
  ...materialsAPI,

  // ============================================
  // Posts (Extracted Module)
  // ============================================
  ...postsAPI,

  // ============================================
  // Conversations (Extracted Module)
  // ============================================
  ...conversationsAPI,

  // ============================================
  // Threads (TODO: Extract to threads.ts)
  // ============================================
  getCourseThreads: legacyAPI.getCourseThreads.bind(legacyAPI),
  getThread: legacyAPI.getThread.bind(legacyAPI),
  createThread: legacyAPI.createThread.bind(legacyAPI),
  endorseThread: legacyAPI.endorseThread.bind(legacyAPI),
  upvoteThread: legacyAPI.upvoteThread.bind(legacyAPI),
  removeUpvote: legacyAPI.removeUpvote.bind(legacyAPI),
  checkThreadDuplicates: legacyAPI.checkThreadDuplicates.bind(legacyAPI),
  mergeThreads: legacyAPI.mergeThreads.bind(legacyAPI),

  // ============================================
  // AI Answers (TODO: Extract to ai-answers.ts)
  // ============================================
  generateAIAnswer: legacyAPI.generateAIAnswer.bind(legacyAPI),
  generateAIPreview: legacyAPI.generateAIPreview.bind(legacyAPI),
  getAIAnswer: legacyAPI.getAIAnswer.bind(legacyAPI),
  endorseAIAnswer: legacyAPI.endorseAIAnswer.bind(legacyAPI),
  bulkEndorseAIAnswers: legacyAPI.bulkEndorseAIAnswers.bind(legacyAPI),

  // ============================================
  // Instructor Tools (TODO: Extract to instructor.ts)
  // ============================================
  getStudentDashboard: legacyAPI.getStudentDashboard.bind(legacyAPI),
  getInstructorDashboard: legacyAPI.getInstructorDashboard.bind(legacyAPI),
  getFrequentlyAskedQuestions: legacyAPI.getFrequentlyAskedQuestions.bind(legacyAPI),
  getTrendingTopics: legacyAPI.getTrendingTopics.bind(legacyAPI),
  getInstructorInsights: legacyAPI.getInstructorInsights.bind(legacyAPI),
  searchQuestions: legacyAPI.searchQuestions.bind(legacyAPI),
  getResponseTemplates: legacyAPI.getResponseTemplates.bind(legacyAPI),
  saveResponseTemplate: legacyAPI.saveResponseTemplate.bind(legacyAPI),
  deleteResponseTemplate: legacyAPI.deleteResponseTemplate.bind(legacyAPI),
};
