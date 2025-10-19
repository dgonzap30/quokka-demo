// ============================================
// Main API Client - Aggregates All Modules
// ============================================
//
// This file aggregates all API modules into a single client instance.
// As modules are extracted from the monolithic client.ts, they are imported here.
//
// **Phase 3.1 Progress:** 8/9 modules extracted (auth, notifications, courses, materials, posts, conversations, ai-answers, threads)
// **Remaining:** instructor

import { authAPI } from "./auth";
import { notificationsAPI } from "./notifications";
import { coursesAPI } from "./courses";
import { materialsAPI } from "./materials";
import { postsAPI } from "./posts";
import { conversationsAPI } from "./conversations";
import { aiAnswersAPI } from "./ai-answers";
import { threadsAPI } from "./threads";

// TODO: Import remaining modules as they are extracted
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
 * - ✅ ai-answers (5 methods)
 * - ✅ threads (8 methods)
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
  // AI Answers (Extracted Module)
  // ============================================
  ...aiAnswersAPI,

  // ============================================
  // Threads (Extracted Module)
  // ============================================
  ...threadsAPI,

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
