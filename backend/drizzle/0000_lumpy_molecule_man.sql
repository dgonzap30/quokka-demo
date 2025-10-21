CREATE TABLE IF NOT EXISTS "ai_answer_citations" (
	"id" text PRIMARY KEY NOT NULL,
	"ai_answer_id" text NOT NULL,
	"material_id" text NOT NULL,
	"excerpt" text NOT NULL,
	"relevance_score" integer NOT NULL,
	"citation_number" integer NOT NULL,
	"tenant_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ai_answer_endorsements" (
	"id" text PRIMARY KEY NOT NULL,
	"ai_answer_id" text NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"tenant_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ai_answers" (
	"id" text PRIMARY KEY NOT NULL,
	"thread_id" text NOT NULL,
	"course_id" text NOT NULL,
	"content" text NOT NULL,
	"confidence_level" varchar(50) NOT NULL,
	"routing" text,
	"endorsement_count" integer DEFAULT 0 NOT NULL,
	"generated_at" timestamp DEFAULT now() NOT NULL,
	"tenant_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ai_conversations" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"course_id" text,
	"title" varchar(500) NOT NULL,
	"last_message_at" timestamp DEFAULT now() NOT NULL,
	"message_count" integer DEFAULT 0 NOT NULL,
	"converted_thread_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"tenant_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ai_messages" (
	"id" text PRIMARY KEY NOT NULL,
	"conversation_id" text NOT NULL,
	"role" varchar(50) NOT NULL,
	"content" text NOT NULL,
	"material_references" text,
	"confidence_score" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"tenant_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "assignments" (
	"id" text PRIMARY KEY NOT NULL,
	"course_id" text NOT NULL,
	"title" varchar(500) NOT NULL,
	"description" text NOT NULL,
	"due_date" timestamp NOT NULL,
	"status" varchar(50) NOT NULL,
	"question_count" integer DEFAULT 0 NOT NULL,
	"tenant_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "auth_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"token" varchar(255) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"tenant_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "course_materials" (
	"id" text PRIMARY KEY NOT NULL,
	"course_id" text NOT NULL,
	"title" varchar(500) NOT NULL,
	"type" varchar(50) NOT NULL,
	"content" text NOT NULL,
	"metadata" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"tenant_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "courses" (
	"id" text PRIMARY KEY NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"term" varchar(50) NOT NULL,
	"description" text NOT NULL,
	"status" varchar(50) NOT NULL,
	"enrollment_count" integer DEFAULT 0 NOT NULL,
	"tenant_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "enrollments" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"course_id" text NOT NULL,
	"role" varchar(50) NOT NULL,
	"enrolled_at" timestamp DEFAULT now() NOT NULL,
	"tenant_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notifications" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"type" varchar(50) NOT NULL,
	"title" varchar(500) NOT NULL,
	"message" text NOT NULL,
	"thread_id" text,
	"post_id" text,
	"read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"tenant_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "post_endorsements" (
	"id" text PRIMARY KEY NOT NULL,
	"post_id" text NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"tenant_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "posts" (
	"id" text PRIMARY KEY NOT NULL,
	"thread_id" text NOT NULL,
	"author_id" text,
	"content" text NOT NULL,
	"is_instructor_answer" boolean DEFAULT false NOT NULL,
	"endorsement_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"tenant_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "response_templates" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"course_id" text,
	"title" varchar(500) NOT NULL,
	"content" text NOT NULL,
	"tags" text,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"last_used_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"tenant_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "thread_endorsements" (
	"id" text PRIMARY KEY NOT NULL,
	"thread_id" text NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"tenant_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "thread_upvotes" (
	"id" text PRIMARY KEY NOT NULL,
	"thread_id" text NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"tenant_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "threads" (
	"id" text PRIMARY KEY NOT NULL,
	"course_id" text NOT NULL,
	"author_id" text,
	"title" varchar(500) NOT NULL,
	"content" text NOT NULL,
	"tags" text,
	"status" varchar(50) NOT NULL,
	"has_ai_answer" boolean DEFAULT false NOT NULL,
	"ai_answer_id" text,
	"reply_count" integer DEFAULT 0 NOT NULL,
	"view_count" integer DEFAULT 0 NOT NULL,
	"endorsement_count" integer DEFAULT 0 NOT NULL,
	"upvote_count" integer DEFAULT 0 NOT NULL,
	"duplicates_of" text,
	"merged_into" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"tenant_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password" varchar(255) NOT NULL,
	"role" varchar(50) NOT NULL,
	"avatar" varchar(500),
	"tenant_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ai_answer_citations_answer" ON "ai_answer_citations" USING btree ("ai_answer_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ai_answer_citations_material" ON "ai_answer_citations" USING btree ("material_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_ai_answer_endorsements_answer_user" ON "ai_answer_endorsements" USING btree ("ai_answer_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_ai_answers_thread" ON "ai_answers" USING btree ("thread_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ai_answers_course" ON "ai_answers" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ai_answers_confidence" ON "ai_answers" USING btree ("confidence_level");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ai_conversations_user" ON "ai_conversations" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ai_conversations_course" ON "ai_conversations" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ai_conversations_last_message" ON "ai_conversations" USING btree ("last_message_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ai_messages_conversation" ON "ai_messages" USING btree ("conversation_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ai_messages_role" ON "ai_messages" USING btree ("role");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ai_messages_created_at" ON "ai_messages" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_assignments_course" ON "assignments" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_assignments_due_date" ON "assignments" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_assignments_status" ON "assignments" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_auth_sessions_token" ON "auth_sessions" USING btree ("token");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_auth_sessions_user" ON "auth_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_auth_sessions_expires" ON "auth_sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_course_materials_course" ON "course_materials" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_course_materials_type" ON "course_materials" USING btree ("type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_courses_code" ON "courses" USING btree ("code");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_courses_status" ON "courses" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_courses_tenant" ON "courses" USING btree ("tenant_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_enrollments_user_course" ON "enrollments" USING btree ("user_id","course_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_enrollments_course" ON "enrollments" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_notifications_user" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_notifications_read" ON "notifications" USING btree ("read");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_notifications_created_at" ON "notifications" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_post_endorsements_post_user" ON "post_endorsements" USING btree ("post_id","user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_posts_thread" ON "posts" USING btree ("thread_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_posts_author" ON "posts" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_posts_instructor" ON "posts" USING btree ("is_instructor_answer");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_posts_created_at" ON "posts" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_response_templates_user" ON "response_templates" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_response_templates_course" ON "response_templates" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_response_templates_usage" ON "response_templates" USING btree ("usage_count");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_thread_endorsements_thread_user" ON "thread_endorsements" USING btree ("thread_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_thread_upvotes_thread_user" ON "thread_upvotes" USING btree ("thread_id","user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_threads_course" ON "threads" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_threads_author" ON "threads" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_threads_status" ON "threads" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_threads_has_ai_answer" ON "threads" USING btree ("has_ai_answer");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_threads_created_at" ON "threads" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_threads_duplicates_of" ON "threads" USING btree ("duplicates_of");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_users_email" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_users_tenant" ON "users" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_users_role" ON "users" USING btree ("role");