CREATE TABLE `ai_answer_citations` (
	`id` text PRIMARY KEY NOT NULL,
	`ai_answer_id` text NOT NULL,
	`material_id` text NOT NULL,
	`excerpt` text NOT NULL,
	`relevance_score` integer NOT NULL,
	`citation_number` integer NOT NULL,
	`tenant_id` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `ai_answer_endorsements` (
	`id` text PRIMARY KEY NOT NULL,
	`ai_answer_id` text NOT NULL,
	`user_id` text NOT NULL,
	`created_at` text NOT NULL,
	`tenant_id` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `ai_answers` (
	`id` text PRIMARY KEY NOT NULL,
	`thread_id` text NOT NULL,
	`course_id` text NOT NULL,
	`content` text NOT NULL,
	`confidence_level` text NOT NULL,
	`routing` text,
	`endorsement_count` integer DEFAULT 0 NOT NULL,
	`generated_at` text NOT NULL,
	`tenant_id` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `ai_conversations` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`course_id` text,
	`title` text NOT NULL,
	`last_message_at` text NOT NULL,
	`message_count` integer DEFAULT 0 NOT NULL,
	`converted_thread_id` text,
	`created_at` text NOT NULL,
	`tenant_id` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `ai_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`conversation_id` text NOT NULL,
	`role` text NOT NULL,
	`content` text NOT NULL,
	`material_references` text,
	`confidence_score` integer,
	`created_at` text NOT NULL,
	`tenant_id` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `assignments` (
	`id` text PRIMARY KEY NOT NULL,
	`course_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`due_date` text NOT NULL,
	`status` text NOT NULL,
	`question_count` integer DEFAULT 0 NOT NULL,
	`tenant_id` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `auth_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`token` text NOT NULL,
	`expires_at` text NOT NULL,
	`created_at` text NOT NULL,
	`tenant_id` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `course_materials` (
	`id` text PRIMARY KEY NOT NULL,
	`course_id` text NOT NULL,
	`title` text NOT NULL,
	`type` text NOT NULL,
	`content` text NOT NULL,
	`metadata` text,
	`created_at` text NOT NULL,
	`tenant_id` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `courses` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`term` text NOT NULL,
	`description` text NOT NULL,
	`status` text NOT NULL,
	`enrollment_count` integer DEFAULT 0 NOT NULL,
	`tenant_id` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `enrollments` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`course_id` text NOT NULL,
	`role` text NOT NULL,
	`enrolled_at` text NOT NULL,
	`tenant_id` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`message` text NOT NULL,
	`thread_id` text,
	`post_id` text,
	`read` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL,
	`tenant_id` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `post_endorsements` (
	`id` text PRIMARY KEY NOT NULL,
	`post_id` text NOT NULL,
	`user_id` text NOT NULL,
	`created_at` text NOT NULL,
	`tenant_id` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `posts` (
	`id` text PRIMARY KEY NOT NULL,
	`thread_id` text NOT NULL,
	`author_id` text,
	`content` text NOT NULL,
	`is_instructor_answer` integer DEFAULT false NOT NULL,
	`endorsement_count` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`tenant_id` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `response_templates` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`course_id` text,
	`title` text NOT NULL,
	`content` text NOT NULL,
	`tags` text,
	`usage_count` integer DEFAULT 0 NOT NULL,
	`last_used_at` text,
	`created_at` text NOT NULL,
	`tenant_id` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `thread_endorsements` (
	`id` text PRIMARY KEY NOT NULL,
	`thread_id` text NOT NULL,
	`user_id` text NOT NULL,
	`created_at` text NOT NULL,
	`tenant_id` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `thread_upvotes` (
	`id` text PRIMARY KEY NOT NULL,
	`thread_id` text NOT NULL,
	`user_id` text NOT NULL,
	`created_at` text NOT NULL,
	`tenant_id` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `threads` (
	`id` text PRIMARY KEY NOT NULL,
	`course_id` text NOT NULL,
	`author_id` text,
	`title` text NOT NULL,
	`content` text NOT NULL,
	`tags` text,
	`status` text NOT NULL,
	`has_ai_answer` integer DEFAULT false NOT NULL,
	`ai_answer_id` text,
	`reply_count` integer DEFAULT 0 NOT NULL,
	`view_count` integer DEFAULT 0 NOT NULL,
	`endorsement_count` integer DEFAULT 0 NOT NULL,
	`upvote_count` integer DEFAULT 0 NOT NULL,
	`duplicates_of` text,
	`merged_into` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`tenant_id` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`password` text NOT NULL,
	`role` text NOT NULL,
	`avatar` text,
	`tenant_id` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_ai_answer_citations_answer` ON `ai_answer_citations` (`ai_answer_id`);--> statement-breakpoint
CREATE INDEX `idx_ai_answer_citations_material` ON `ai_answer_citations` (`material_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_ai_answer_endorsements_answer_user` ON `ai_answer_endorsements` (`ai_answer_id`,`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_ai_answers_thread` ON `ai_answers` (`thread_id`);--> statement-breakpoint
CREATE INDEX `idx_ai_answers_course` ON `ai_answers` (`course_id`);--> statement-breakpoint
CREATE INDEX `idx_ai_answers_confidence` ON `ai_answers` (`confidence_level`);--> statement-breakpoint
CREATE INDEX `idx_ai_conversations_user` ON `ai_conversations` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_ai_conversations_course` ON `ai_conversations` (`course_id`);--> statement-breakpoint
CREATE INDEX `idx_ai_conversations_last_message` ON `ai_conversations` (`last_message_at`);--> statement-breakpoint
CREATE INDEX `idx_ai_messages_conversation` ON `ai_messages` (`conversation_id`);--> statement-breakpoint
CREATE INDEX `idx_ai_messages_role` ON `ai_messages` (`role`);--> statement-breakpoint
CREATE INDEX `idx_ai_messages_created_at` ON `ai_messages` (`created_at`);--> statement-breakpoint
CREATE INDEX `idx_assignments_course` ON `assignments` (`course_id`);--> statement-breakpoint
CREATE INDEX `idx_assignments_due_date` ON `assignments` (`due_date`);--> statement-breakpoint
CREATE INDEX `idx_assignments_status` ON `assignments` (`status`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_auth_sessions_token` ON `auth_sessions` (`token`);--> statement-breakpoint
CREATE INDEX `idx_auth_sessions_user` ON `auth_sessions` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_auth_sessions_expires` ON `auth_sessions` (`expires_at`);--> statement-breakpoint
CREATE INDEX `idx_course_materials_course` ON `course_materials` (`course_id`);--> statement-breakpoint
CREATE INDEX `idx_course_materials_type` ON `course_materials` (`type`);--> statement-breakpoint
CREATE INDEX `idx_courses_code` ON `courses` (`code`);--> statement-breakpoint
CREATE INDEX `idx_courses_status` ON `courses` (`status`);--> statement-breakpoint
CREATE INDEX `idx_courses_tenant` ON `courses` (`tenant_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_enrollments_user_course` ON `enrollments` (`user_id`,`course_id`);--> statement-breakpoint
CREATE INDEX `idx_enrollments_course` ON `enrollments` (`course_id`);--> statement-breakpoint
CREATE INDEX `idx_notifications_user` ON `notifications` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_notifications_read` ON `notifications` (`read`);--> statement-breakpoint
CREATE INDEX `idx_notifications_created_at` ON `notifications` (`created_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_post_endorsements_post_user` ON `post_endorsements` (`post_id`,`user_id`);--> statement-breakpoint
CREATE INDEX `idx_posts_thread` ON `posts` (`thread_id`);--> statement-breakpoint
CREATE INDEX `idx_posts_author` ON `posts` (`author_id`);--> statement-breakpoint
CREATE INDEX `idx_posts_instructor` ON `posts` (`is_instructor_answer`);--> statement-breakpoint
CREATE INDEX `idx_posts_created_at` ON `posts` (`created_at`);--> statement-breakpoint
CREATE INDEX `idx_response_templates_user` ON `response_templates` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_response_templates_course` ON `response_templates` (`course_id`);--> statement-breakpoint
CREATE INDEX `idx_response_templates_usage` ON `response_templates` (`usage_count`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_thread_endorsements_thread_user` ON `thread_endorsements` (`thread_id`,`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_thread_upvotes_thread_user` ON `thread_upvotes` (`thread_id`,`user_id`);--> statement-breakpoint
CREATE INDEX `idx_threads_course` ON `threads` (`course_id`);--> statement-breakpoint
CREATE INDEX `idx_threads_author` ON `threads` (`author_id`);--> statement-breakpoint
CREATE INDEX `idx_threads_status` ON `threads` (`status`);--> statement-breakpoint
CREATE INDEX `idx_threads_has_ai_answer` ON `threads` (`has_ai_answer`);--> statement-breakpoint
CREATE INDEX `idx_threads_created_at` ON `threads` (`created_at`);--> statement-breakpoint
CREATE INDEX `idx_threads_duplicates_of` ON `threads` (`duplicates_of`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_users_email` ON `users` (`email`);--> statement-breakpoint
CREATE INDEX `idx_users_tenant` ON `users` (`tenant_id`);--> statement-breakpoint
CREATE INDEX `idx_users_role` ON `users` (`role`);