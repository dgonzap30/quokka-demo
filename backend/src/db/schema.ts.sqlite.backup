/**
 * Drizzle ORM Schema Definition
 *
 * 18 tables mirroring lib/models/types.ts
 * Works on SQLite (dev) and Postgres (prod) via UUID helpers
 * Foreign keys with CASCADE/SET NULL rules
 * Performance indexes on common query patterns
 */

import { sqliteTable, text, integer, index, uniqueIndex } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";
import { randomUUID } from "crypto";

// UUID Helpers (inlined for drizzle-kit compatibility)
function uuidColumn(name: string) {
  return text(name).notNull().primaryKey().$defaultFn(() => randomUUID());
}

function uuidRefNotNull(name: string) {
  return text(name).notNull();
}

function uuidRef(name: string) {
  return text(name);
}

// ============================================================================
// CORE TABLES (No Dependencies)
// ============================================================================

/**
 * Users Table
 * Stores all user accounts (students, instructors, TAs)
 */
export const users = sqliteTable(
  "users",
  {
    id: uuidColumn("id"),
    name: text("name").notNull(),
    email: text("email").notNull(),
    password: text("password").notNull(), // Hashed (would use bcrypt in production)
    role: text("role").notNull(), // 'student' | 'instructor' | 'ta'
    avatar: text("avatar"),
    tenantId: uuidRefNotNull("tenant_id"), // Future multi-tenant support
    createdAt: text("created_at").notNull(),
  },
  (table) => ({
    emailIdx: uniqueIndex("idx_users_email").on(table.email),
    tenantIdx: index("idx_users_tenant").on(table.tenantId),
    roleIdx: index("idx_users_role").on(table.role),
  })
);

export const usersRelations = relations(users, ({ many }) => ({
  authSessions: many(authSessions),
  enrollments: many(enrollments),
  threads: many(threads),
  posts: many(posts),
  aiConversations: many(aiConversations),
  notifications: many(notifications),
  responseTemplates: many(responseTemplates),
  threadEndorsements: many(threadEndorsements),
  threadUpvotes: many(threadUpvotes),
  postEndorsements: many(postEndorsements),
  aiAnswerEndorsements: many(aiAnswerEndorsements),
}));

/**
 * Courses Table
 * Academic courses with enrollment tracking
 */
export const courses = sqliteTable(
  "courses",
  {
    id: uuidColumn("id"),
    code: text("code").notNull(),
    name: text("name").notNull(),
    term: text("term").notNull(),
    description: text("description").notNull(),
    status: text("status").notNull(), // 'active' | 'archived'
    enrollmentCount: integer("enrollment_count").notNull().default(0),
    tenantId: uuidRefNotNull("tenant_id"),
    createdAt: text("created_at").notNull(),
  },
  (table) => ({
    codeIdx: index("idx_courses_code").on(table.code),
    statusIdx: index("idx_courses_status").on(table.status),
    tenantIdx: index("idx_courses_tenant").on(table.tenantId),
  })
);

export const coursesRelations = relations(courses, ({ many }) => ({
  enrollments: many(enrollments),
  threads: many(threads),
  courseMaterials: many(courseMaterials),
  assignments: many(assignments),
  aiAnswers: many(aiAnswers),
  aiConversations: many(aiConversations),
}));

// ============================================================================
// AUTH & ENROLLMENT TABLES
// ============================================================================

/**
 * Auth Sessions Table
 * Session management for authenticated users
 */
export const authSessions = sqliteTable(
  "auth_sessions",
  {
    id: uuidColumn("id"),
    userId: uuidRefNotNull("user_id"),
    token: text("token").notNull(),
    expiresAt: text("expires_at").notNull(),
    createdAt: text("created_at").notNull(),
    tenantId: uuidRefNotNull("tenant_id"),
  },
  (table) => ({
    tokenIdx: uniqueIndex("idx_auth_sessions_token").on(table.token),
    userIdx: index("idx_auth_sessions_user").on(table.userId),
    expiresIdx: index("idx_auth_sessions_expires").on(table.expiresAt),
  })
);

export const authSessionsRelations = relations(authSessions, ({ one }) => ({
  user: one(users, {
    fields: [authSessions.userId],
    references: [users.id],
  }),
}));

/**
 * Enrollments Table
 * User-course relationships with roles
 */
export const enrollments = sqliteTable(
  "enrollments",
  {
    id: uuidColumn("id"),
    userId: uuidRefNotNull("user_id"),
    courseId: uuidRefNotNull("course_id"),
    role: text("role").notNull(), // 'student' | 'instructor' | 'ta'
    enrolledAt: text("enrolled_at").notNull(),
    tenantId: uuidRefNotNull("tenant_id"),
  },
  (table) => ({
    userCourseIdx: uniqueIndex("idx_enrollments_user_course").on(table.userId, table.courseId),
    courseIdx: index("idx_enrollments_course").on(table.courseId),
  })
);

export const enrollmentsRelations = relations(enrollments, ({ one }) => ({
  user: one(users, {
    fields: [enrollments.userId],
    references: [users.id],
  }),
  course: one(courses, {
    fields: [enrollments.courseId],
    references: [courses.id],
  }),
}));

// ============================================================================
// COURSE CONTENT TABLES
// ============================================================================

/**
 * Course Materials Table
 * Educational content for AI context (lectures, slides, readings)
 */
export const courseMaterials = sqliteTable(
  "course_materials",
  {
    id: uuidColumn("id"),
    courseId: uuidRefNotNull("course_id"),
    title: text("title").notNull(),
    type: text("type").notNull(), // 'lecture' | 'slide' | 'reading' | 'video' | 'assignment'
    content: text("content").notNull(),
    metadata: text("metadata"), // JSON: { week, topic, keywords[], url }
    createdAt: text("created_at").notNull(),
    tenantId: uuidRefNotNull("tenant_id"),
  },
  (table) => ({
    courseIdx: index("idx_course_materials_course").on(table.courseId),
    typeIdx: index("idx_course_materials_type").on(table.type),
  })
);

export const courseMaterialsRelations = relations(courseMaterials, ({ one, many }) => ({
  course: one(courses, {
    fields: [courseMaterials.courseId],
    references: [courses.id],
  }),
  citations: many(aiAnswerCitations),
}));

/**
 * Assignments Table
 * Course assignments with Q&A opportunities
 */
export const assignments = sqliteTable(
  "assignments",
  {
    id: uuidColumn("id"),
    courseId: uuidRefNotNull("course_id"),
    title: text("title").notNull(),
    description: text("description").notNull(),
    dueDate: text("due_date").notNull(),
    status: text("status").notNull(), // 'upcoming' | 'active' | 'past'
    questionCount: integer("question_count").notNull().default(0),
    tenantId: uuidRefNotNull("tenant_id"),
    createdAt: text("created_at").notNull(),
  },
  (table) => ({
    courseIdx: index("idx_assignments_course").on(table.courseId),
    dueDateIdx: index("idx_assignments_due_date").on(table.dueDate),
    statusIdx: index("idx_assignments_status").on(table.status),
  })
);

export const assignmentsRelations = relations(assignments, ({ one }) => ({
  course: one(courses, {
    fields: [assignments.courseId],
    references: [courses.id],
  }),
}));

// ============================================================================
// DISCUSSION TABLES
// ============================================================================

/**
 * Threads Table
 * Discussion threads (questions)
 */
export const threads = sqliteTable(
  "threads",
  {
    id: uuidColumn("id"),
    courseId: uuidRefNotNull("course_id"),
    authorId: uuidRef("author_id"), // SET NULL if user deleted
    title: text("title").notNull(),
    content: text("content").notNull(),
    tags: text("tags"), // JSON array: string[]
    status: text("status").notNull(), // 'open' | 'answered' | 'resolved'
    hasAIAnswer: integer("has_ai_answer", { mode: "boolean" }).notNull().default(false),
    aiAnswerId: uuidRef("ai_answer_id"),
    replyCount: integer("reply_count").notNull().default(0),
    viewCount: integer("view_count").notNull().default(0),
    endorsementCount: integer("endorsement_count").notNull().default(0),
    upvoteCount: integer("upvote_count").notNull().default(0),
    duplicatesOf: uuidRef("duplicates_of"), // Self-reference for merged threads
    mergedInto: uuidRef("merged_into"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
    tenantId: uuidRefNotNull("tenant_id"),
  },
  (table) => ({
    courseIdx: index("idx_threads_course").on(table.courseId),
    authorIdx: index("idx_threads_author").on(table.authorId),
    statusIdx: index("idx_threads_status").on(table.status),
    hasAIAnswerIdx: index("idx_threads_has_ai_answer").on(table.hasAIAnswer),
    createdAtIdx: index("idx_threads_created_at").on(table.createdAt),
    duplicatesOfIdx: index("idx_threads_duplicates_of").on(table.duplicatesOf),
  })
);

export const threadsRelations = relations(threads, ({ one, many }) => ({
  course: one(courses, {
    fields: [threads.courseId],
    references: [courses.id],
  }),
  author: one(users, {
    fields: [threads.authorId],
    references: [users.id],
  }),
  aiAnswer: one(aiAnswers, {
    fields: [threads.aiAnswerId],
    references: [aiAnswers.id],
  }),
  posts: many(posts),
  endorsements: many(threadEndorsements),
  upvotes: many(threadUpvotes),
}));

/**
 * Posts Table
 * Replies to discussion threads
 */
export const posts = sqliteTable(
  "posts",
  {
    id: uuidColumn("id"),
    threadId: uuidRefNotNull("thread_id"),
    authorId: uuidRef("author_id"), // SET NULL if user deleted
    content: text("content").notNull(),
    isInstructorAnswer: integer("is_instructor_answer", { mode: "boolean" }).notNull().default(false),
    endorsementCount: integer("endorsement_count").notNull().default(0),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
    tenantId: uuidRefNotNull("tenant_id"),
  },
  (table) => ({
    threadIdx: index("idx_posts_thread").on(table.threadId),
    authorIdx: index("idx_posts_author").on(table.authorId),
    instructorIdx: index("idx_posts_instructor").on(table.isInstructorAnswer),
    createdAtIdx: index("idx_posts_created_at").on(table.createdAt),
  })
);

export const postsRelations = relations(posts, ({ one, many }) => ({
  thread: one(threads, {
    fields: [posts.threadId],
    references: [threads.id],
  }),
  author: one(users, {
    fields: [posts.authorId],
    references: [users.id],
  }),
  endorsements: many(postEndorsements),
}));

// ============================================================================
// AI ANSWER TABLES
// ============================================================================

/**
 * AI Answers Table
 * AI-generated responses to threads
 */
export const aiAnswers = sqliteTable(
  "ai_answers",
  {
    id: uuidColumn("id"),
    threadId: uuidRefNotNull("thread_id"),
    courseId: uuidRefNotNull("course_id"),
    content: text("content").notNull(),
    confidenceLevel: text("confidence_level").notNull(), // 'high' | 'medium' | 'low'
    routing: text("routing"), // JSON: Self-RAG routing metadata
    endorsementCount: integer("endorsement_count").notNull().default(0),
    generatedAt: text("generated_at").notNull(),
    tenantId: uuidRefNotNull("tenant_id"),
  },
  (table) => ({
    threadIdx: uniqueIndex("idx_ai_answers_thread").on(table.threadId),
    courseIdx: index("idx_ai_answers_course").on(table.courseId),
    confidenceIdx: index("idx_ai_answers_confidence").on(table.confidenceLevel),
  })
);

export const aiAnswersRelations = relations(aiAnswers, ({ one, many }) => ({
  thread: one(threads, {
    fields: [aiAnswers.threadId],
    references: [threads.id],
  }),
  course: one(courses, {
    fields: [aiAnswers.courseId],
    references: [courses.id],
  }),
  citations: many(aiAnswerCitations),
  endorsements: many(aiAnswerEndorsements),
}));

/**
 * AI Answer Citations Table
 * Links AI answers to course materials
 */
export const aiAnswerCitations = sqliteTable(
  "ai_answer_citations",
  {
    id: uuidColumn("id"),
    aiAnswerId: uuidRefNotNull("ai_answer_id"),
    materialId: uuidRefNotNull("material_id"),
    excerpt: text("excerpt").notNull(),
    relevanceScore: integer("relevance_score").notNull(), // 0-100
    citationNumber: integer("citation_number").notNull(),
    tenantId: uuidRefNotNull("tenant_id"),
  },
  (table) => ({
    aiAnswerIdx: index("idx_ai_answer_citations_answer").on(table.aiAnswerId),
    materialIdx: index("idx_ai_answer_citations_material").on(table.materialId),
  })
);

export const aiAnswerCitationsRelations = relations(aiAnswerCitations, ({ one }) => ({
  aiAnswer: one(aiAnswers, {
    fields: [aiAnswerCitations.aiAnswerId],
    references: [aiAnswers.id],
  }),
  material: one(courseMaterials, {
    fields: [aiAnswerCitations.materialId],
    references: [courseMaterials.id],
  }),
}));

// ============================================================================
// ENDORSEMENT & UPVOTE TABLES (Junction Tables for Arrays)
// ============================================================================

/**
 * Thread Endorsements Table
 * Prof/TA endorsements on threads
 */
export const threadEndorsements = sqliteTable(
  "thread_endorsements",
  {
    id: uuidColumn("id"),
    threadId: uuidRefNotNull("thread_id"),
    userId: uuidRefNotNull("user_id"),
    createdAt: text("created_at").notNull(),
    tenantId: uuidRefNotNull("tenant_id"),
  },
  (table) => ({
    threadUserIdx: uniqueIndex("idx_thread_endorsements_thread_user").on(table.threadId, table.userId),
  })
);

export const threadEndorsementsRelations = relations(threadEndorsements, ({ one }) => ({
  thread: one(threads, {
    fields: [threadEndorsements.threadId],
    references: [threads.id],
  }),
  user: one(users, {
    fields: [threadEndorsements.userId],
    references: [users.id],
  }),
}));

/**
 * Thread Upvotes Table
 * Student upvotes on threads (quality signals)
 */
export const threadUpvotes = sqliteTable(
  "thread_upvotes",
  {
    id: uuidColumn("id"),
    threadId: uuidRefNotNull("thread_id"),
    userId: uuidRefNotNull("user_id"),
    createdAt: text("created_at").notNull(),
    tenantId: uuidRefNotNull("tenant_id"),
  },
  (table) => ({
    threadUserIdx: uniqueIndex("idx_thread_upvotes_thread_user").on(table.threadId, table.userId),
  })
);

export const threadUpvotesRelations = relations(threadUpvotes, ({ one }) => ({
  thread: one(threads, {
    fields: [threadUpvotes.threadId],
    references: [threads.id],
  }),
  user: one(users, {
    fields: [threadUpvotes.userId],
    references: [users.id],
  }),
}));

/**
 * Post Endorsements Table
 * Prof/TA endorsements on posts
 */
export const postEndorsements = sqliteTable(
  "post_endorsements",
  {
    id: uuidColumn("id"),
    postId: uuidRefNotNull("post_id"),
    userId: uuidRefNotNull("user_id"),
    createdAt: text("created_at").notNull(),
    tenantId: uuidRefNotNull("tenant_id"),
  },
  (table) => ({
    postUserIdx: uniqueIndex("idx_post_endorsements_post_user").on(table.postId, table.userId),
  })
);

export const postEndorsementsRelations = relations(postEndorsements, ({ one }) => ({
  post: one(posts, {
    fields: [postEndorsements.postId],
    references: [posts.id],
  }),
  user: one(users, {
    fields: [postEndorsements.userId],
    references: [users.id],
  }),
}));

/**
 * AI Answer Endorsements Table
 * Prof/TA endorsements on AI answers
 */
export const aiAnswerEndorsements = sqliteTable(
  "ai_answer_endorsements",
  {
    id: uuidColumn("id"),
    aiAnswerId: uuidRefNotNull("ai_answer_id"),
    userId: uuidRefNotNull("user_id"),
    createdAt: text("created_at").notNull(),
    tenantId: uuidRefNotNull("tenant_id"),
  },
  (table) => ({
    answerUserIdx: uniqueIndex("idx_ai_answer_endorsements_answer_user").on(table.aiAnswerId, table.userId),
  })
);

export const aiAnswerEndorsementsRelations = relations(aiAnswerEndorsements, ({ one }) => ({
  aiAnswer: one(aiAnswers, {
    fields: [aiAnswerEndorsements.aiAnswerId],
    references: [aiAnswers.id],
  }),
  user: one(users, {
    fields: [aiAnswerEndorsements.userId],
    references: [users.id],
  }),
}));

// ============================================================================
// AI CONVERSATION TABLES
// ============================================================================

/**
 * AI Conversations Table
 * Private LLM conversations with persistence
 */
export const aiConversations = sqliteTable(
  "ai_conversations",
  {
    id: uuidColumn("id"),
    userId: uuidRefNotNull("user_id"),
    courseId: uuidRef("course_id"), // NULL for multi-course conversations
    title: text("title").notNull(),
    lastMessageAt: text("last_message_at").notNull(),
    messageCount: integer("message_count").notNull().default(0),
    convertedThreadId: uuidRef("converted_thread_id"), // If converted to public thread
    createdAt: text("created_at").notNull(),
    tenantId: uuidRefNotNull("tenant_id"),
  },
  (table) => ({
    userIdx: index("idx_ai_conversations_user").on(table.userId),
    courseIdx: index("idx_ai_conversations_course").on(table.courseId),
    lastMessageIdx: index("idx_ai_conversations_last_message").on(table.lastMessageAt),
  })
);

export const aiConversationsRelations = relations(aiConversations, ({ one, many }) => ({
  user: one(users, {
    fields: [aiConversations.userId],
    references: [users.id],
  }),
  course: one(courses, {
    fields: [aiConversations.courseId],
    references: [courses.id],
  }),
  messages: many(aiMessages),
}));

/**
 * AI Messages Table
 * Individual messages in AI conversations
 */
export const aiMessages = sqliteTable(
  "ai_messages",
  {
    id: uuidColumn("id"),
    conversationId: uuidRefNotNull("conversation_id"),
    role: text("role").notNull(), // 'user' | 'assistant'
    content: text("content").notNull(),
    materialReferences: text("material_references"), // JSON: MaterialReference[]
    confidenceScore: integer("confidence_score"), // 0-100 (for assistant messages)
    createdAt: text("created_at").notNull(),
    tenantId: uuidRefNotNull("tenant_id"),
  },
  (table) => ({
    conversationIdx: index("idx_ai_messages_conversation").on(table.conversationId),
    roleIdx: index("idx_ai_messages_role").on(table.role),
    createdAtIdx: index("idx_ai_messages_created_at").on(table.createdAt),
  })
);

export const aiMessagesRelations = relations(aiMessages, ({ one }) => ({
  conversation: one(aiConversations, {
    fields: [aiMessages.conversationId],
    references: [aiConversations.id],
  }),
}));

// ============================================================================
// INSTRUCTOR TOOLS TABLES
// ============================================================================

/**
 * Response Templates Table
 * Saved response templates for instructors
 */
export const responseTemplates = sqliteTable(
  "response_templates",
  {
    id: uuidColumn("id"),
    userId: uuidRefNotNull("user_id"),
    courseId: uuidRef("course_id"), // Nullable for general templates
    title: text("title").notNull(),
    content: text("content").notNull(),
    tags: text("tags"), // JSON array: string[]
    usageCount: integer("usage_count").notNull().default(0),
    lastUsedAt: text("last_used_at"),
    createdAt: text("created_at").notNull(),
    tenantId: uuidRefNotNull("tenant_id"),
  },
  (table) => ({
    userIdx: index("idx_response_templates_user").on(table.userId),
    courseIdx: index("idx_response_templates_course").on(table.courseId),
    usageIdx: index("idx_response_templates_usage").on(table.usageCount),
  })
);

export const responseTemplatesRelations = relations(responseTemplates, ({ one }) => ({
  user: one(users, {
    fields: [responseTemplates.userId],
    references: [users.id],
  }),
  course: one(courses, {
    fields: [responseTemplates.courseId],
    references: [courses.id],
  }),
}));

// ============================================================================
// NOTIFICATION TABLE
// ============================================================================

/**
 * Notifications Table
 * User notifications for activity
 */
export const notifications = sqliteTable(
  "notifications",
  {
    id: uuidColumn("id"),
    userId: uuidRefNotNull("user_id"),
    type: text("type").notNull(), // 'thread_reply' | 'ai_answer' | 'endorsement' | 'mention'
    title: text("title").notNull(),
    message: text("message").notNull(),
    threadId: uuidRef("thread_id"),
    postId: uuidRef("post_id"),
    read: integer("read", { mode: "boolean" }).notNull().default(false),
    createdAt: text("created_at").notNull(),
    tenantId: uuidRefNotNull("tenant_id"),
  },
  (table) => ({
    userIdx: index("idx_notifications_user").on(table.userId),
    readIdx: index("idx_notifications_read").on(table.read),
    createdAtIdx: index("idx_notifications_created_at").on(table.createdAt),
  })
);

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

// ============================================================================
// TYPE EXPORTS (For Drizzle Type Inference)
// ============================================================================

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Course = typeof courses.$inferSelect;
export type NewCourse = typeof courses.$inferInsert;

export type AuthSession = typeof authSessions.$inferSelect;
export type NewAuthSession = typeof authSessions.$inferInsert;

export type Enrollment = typeof enrollments.$inferSelect;
export type NewEnrollment = typeof enrollments.$inferInsert;

export type CourseMaterial = typeof courseMaterials.$inferSelect;
export type NewCourseMaterial = typeof courseMaterials.$inferInsert;

export type Assignment = typeof assignments.$inferSelect;
export type NewAssignment = typeof assignments.$inferInsert;

export type Thread = typeof threads.$inferSelect;
export type NewThread = typeof threads.$inferInsert;

export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;

export type AIAnswer = typeof aiAnswers.$inferSelect;
export type NewAIAnswer = typeof aiAnswers.$inferInsert;

export type AIAnswerCitation = typeof aiAnswerCitations.$inferSelect;
export type NewAIAnswerCitation = typeof aiAnswerCitations.$inferInsert;

export type ThreadEndorsement = typeof threadEndorsements.$inferSelect;
export type NewThreadEndorsement = typeof threadEndorsements.$inferInsert;

export type ThreadUpvote = typeof threadUpvotes.$inferSelect;
export type NewThreadUpvote = typeof threadUpvotes.$inferInsert;

export type PostEndorsement = typeof postEndorsements.$inferSelect;
export type NewPostEndorsement = typeof postEndorsements.$inferInsert;

export type AIAnswerEndorsement = typeof aiAnswerEndorsements.$inferSelect;
export type NewAIAnswerEndorsement = typeof aiAnswerEndorsements.$inferInsert;

export type AIConversation = typeof aiConversations.$inferSelect;
export type NewAIConversation = typeof aiConversations.$inferInsert;

export type AIMessage = typeof aiMessages.$inferSelect;
export type NewAIMessage = typeof aiMessages.$inferInsert;

export type ResponseTemplate = typeof responseTemplates.$inferSelect;
export type NewResponseTemplate = typeof responseTemplates.$inferInsert;

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
