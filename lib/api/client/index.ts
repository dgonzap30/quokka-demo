// ============================================
// Main API Client - Aggregates All Modules
// ============================================
//
// This file aggregates all API modules into a single client instance.
// As modules are extracted from the monolithic client.ts, they are imported here.
//
// **Phase 3.1 Progress:** 4/9 modules extracted (auth, notifications, courses, materials)
// **Remaining:** threads, posts, ai-answers, conversations, instructor

import { authAPI } from "./auth";
import { notificationsAPI } from "./notifications";
import { coursesAPI } from "./courses";
import { materialsAPI } from "./materials";

// TODO: Import remaining modules as they are extracted
// import { threadsAPI } from "./threads";
// import { postsAPI } from "./posts";
// import { aiAnswersAPI } from "./ai-answers";
// import { conversationsAPI } from "./conversations";
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
 * - ⏳ threads (8 methods) - TODO
 * - ⏳ posts (3 methods) - TODO
 * - ⏳ ai-answers (5 methods) - TODO
 * - ⏳ conversations (6 methods) - TODO
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
  // Posts (TODO: Extract to posts.ts)
  // ============================================
  createPost: legacyAPI.createPost.bind(legacyAPI),

  // ============================================
  // AI Answers (TODO: Extract to ai-answers.ts)
  // ============================================
  generateAIAnswer: legacyAPI.generateAIAnswer.bind(legacyAPI),
  generateAIPreview: legacyAPI.generateAIPreview.bind(legacyAPI),
  getAIAnswer: legacyAPI.getAIAnswer.bind(legacyAPI),
  endorseAIAnswer: legacyAPI.endorseAIAnswer.bind(legacyAPI),
  bulkEndorseAIAnswers: legacyAPI.bulkEndorseAIAnswers.bind(legacyAPI),

  // ============================================
  // Conversations (TODO: Extract to conversations.ts)
  // ============================================
  createConversation: legacyAPI.createConversation.bind(legacyAPI),
  getAIConversations: legacyAPI.getAIConversations.bind(legacyAPI),
  getConversationMessages: legacyAPI.getConversationMessages.bind(legacyAPI),
  sendMessage: legacyAPI.sendMessage.bind(legacyAPI),
  deleteAIConversation: legacyAPI.deleteAIConversation.bind(legacyAPI),
  convertConversationToThread: legacyAPI.convertConversationToThread.bind(legacyAPI),

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
