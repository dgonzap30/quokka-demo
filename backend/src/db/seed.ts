/**
 * Database Seed Script
 *
 * Migrates mock data from ../../../mocks/*.json files into SQLite database
 * Handles all 18 tables with proper foreign key relationships
 */

import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { db } from "./client.js";
import * as schema from "./schema.js";
import { generateUuid } from "./helpers.js";

// Get current directory in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Demo tenant ID (hardcoded for now, multi-tenant support in future)
const DEMO_TENANT_ID = "tenant-demo-001";

/**
 * Load JSON file from mocks directory
 */
function loadMockFile<T>(filename: string): T[] {
  const path = join(__dirname, "../../../mocks", filename);
  const content = readFileSync(path, "utf-8");
  return JSON.parse(content);
}

/**
 * Main seed function
 */
async function seed() {
  console.log("🌱 Starting database seed...\n");

  try {
    // Clear existing data (in reverse dependency order)
    console.log("🗑️  Clearing existing data...");
    await db.delete(schema.notifications);
    await db.delete(schema.responseTemplates);
    await db.delete(schema.aiMessages);
    await db.delete(schema.aiConversations);
    await db.delete(schema.aiAnswerEndorsements);
    await db.delete(schema.postEndorsements);
    await db.delete(schema.threadUpvotes);
    await db.delete(schema.threadEndorsements);
    await db.delete(schema.aiAnswerCitations);
    await db.delete(schema.aiAnswers);
    await db.delete(schema.posts);
    await db.delete(schema.threads);
    await db.delete(schema.assignments);
    await db.delete(schema.courseMaterials);
    await db.delete(schema.enrollments);
    await db.delete(schema.authSessions);
    await db.delete(schema.courses);
    await db.delete(schema.users);
    console.log("✅ Existing data cleared\n");

    // 1. Seed Users
    console.log("👤 Seeding users...");
    const usersData = loadMockFile<any>("users.json");
    for (const user of usersData) {
      await db.insert(schema.users).values({
        id: user.id,
        name: user.name,
        email: user.email,
        password: user.password, // In production, would be hashed
        role: user.role,
        avatar: user.avatar || null,
        tenantId: DEMO_TENANT_ID,
        createdAt: user.createdAt,
      });
    }
    console.log(`✅ Seeded ${usersData.length} users\n`);

    // 2. Seed Courses
    console.log("📚 Seeding courses...");
    const coursesData = loadMockFile<any>("courses.json");
    for (const course of coursesData) {
      await db.insert(schema.courses).values({
        id: course.id,
        code: course.code,
        name: course.name,
        term: course.term,
        description: course.description,
        status: course.status,
        enrollmentCount: course.enrollmentCount || 0,
        tenantId: DEMO_TENANT_ID,
        createdAt: course.createdAt,
      });
    }
    console.log(`✅ Seeded ${coursesData.length} courses\n`);

    // 3. Seed Enrollments
    console.log("🎓 Seeding enrollments...");
    const enrollmentsData = loadMockFile<any>("enrollments.json");
    for (const enrollment of enrollmentsData) {
      await db.insert(schema.enrollments).values({
        id: enrollment.id,
        userId: enrollment.userId,
        courseId: enrollment.courseId,
        role: enrollment.role,
        enrolledAt: enrollment.enrolledAt,
        tenantId: DEMO_TENANT_ID,
      });
    }
    console.log(`✅ Seeded ${enrollmentsData.length} enrollments\n`);

    // 4. Seed Course Materials
    console.log("📖 Seeding course materials...");
    const materialsData = loadMockFile<any>("course-materials.json");
    for (const material of materialsData) {
      await db.insert(schema.courseMaterials).values({
        id: material.id,
        courseId: material.courseId,
        title: material.title,
        type: material.type,
        content: material.content,
        metadata: material.metadata ? JSON.stringify(material.metadata) : null,
        createdAt: material.createdAt,
        tenantId: DEMO_TENANT_ID,
      });
    }
    console.log(`✅ Seeded ${materialsData.length} course materials\n`);

    // 5. Seed Assignments
    console.log("✍️  Seeding assignments...");
    const assignmentsFile = loadMockFile<any>("assignments.json");
    const assignmentsData: any[] = Array.isArray(assignmentsFile) ? assignmentsFile : (assignmentsFile as any)?.assignments || [];
    for (const assignment of assignmentsData) {
      await db.insert(schema.assignments).values({
        id: assignment.id,
        courseId: assignment.courseId,
        title: assignment.title,
        description: assignment.description || "",
        dueDate: assignment.dueDate,
        status: assignment.status || "active",
        questionCount: assignment.questionCount || 0,
        tenantId: DEMO_TENANT_ID,
        createdAt: assignment.createdAt,
      });
    }
    console.log(`✅ Seeded ${assignmentsData.length} assignments\n`);

    // 6. Seed Threads
    console.log("💬 Seeding threads...");
    const threadsData = loadMockFile<any>("threads.json");
    for (const thread of threadsData) {
      await db.insert(schema.threads).values({
        id: thread.id,
        courseId: thread.courseId,
        authorId: thread.authorId,
        title: thread.title,
        content: thread.content,
        tags: thread.tags ? JSON.stringify(thread.tags) : null,
        status: thread.status,
        hasAIAnswer: thread.hasAIAnswer ? true : false,
        aiAnswerId: thread.aiAnswerId || null,
        replyCount: thread.replyCount || 0,
        viewCount: thread.viewCount || 0,
        endorsementCount: thread.endorsedBy?.length || 0,
        upvoteCount: thread.upvotedBy?.length || 0,
        duplicatesOf: thread.duplicatesOf || null,
        mergedInto: thread.mergedInto || null,
        createdAt: thread.createdAt,
        updatedAt: thread.updatedAt,
        tenantId: DEMO_TENANT_ID,
      });

      // Create thread endorsements (junction table)
      if (thread.endorsedBy && Array.isArray(thread.endorsedBy)) {
        for (const userId of thread.endorsedBy) {
          await db.insert(schema.threadEndorsements).values({
            id: generateUuid(),
            threadId: thread.id,
            userId,
            createdAt: thread.createdAt,
            tenantId: DEMO_TENANT_ID,
          });
        }
      }

      // Create thread upvotes (junction table)
      if (thread.upvotedBy && Array.isArray(thread.upvotedBy)) {
        for (const userId of thread.upvotedBy) {
          await db.insert(schema.threadUpvotes).values({
            id: generateUuid(),
            threadId: thread.id,
            userId,
            createdAt: thread.createdAt,
            tenantId: DEMO_TENANT_ID,
          });
        }
      }
    }
    console.log(`✅ Seeded ${threadsData.length} threads\n`);

    // 7. Seed Posts
    console.log("✉️  Seeding posts...");
    const postsData = loadMockFile<any>("posts.json");
    for (const post of postsData) {
      await db.insert(schema.posts).values({
        id: post.id,
        threadId: post.threadId,
        authorId: post.authorId,
        content: post.content,
        isInstructorAnswer: post.isInstructorAnswer ? true : false,
        endorsementCount: post.endorsedBy?.length || 0,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt || post.createdAt,
        tenantId: DEMO_TENANT_ID,
      });

      // Create post endorsements (junction table)
      if (post.endorsedBy && Array.isArray(post.endorsedBy)) {
        for (const userId of post.endorsedBy) {
          await db.insert(schema.postEndorsements).values({
            id: generateUuid(),
            postId: post.id,
            userId,
            createdAt: post.createdAt,
            tenantId: DEMO_TENANT_ID,
          });
        }
      }
    }
    console.log(`✅ Seeded ${postsData.length} posts\n`);

    // 8. Seed AI Answers
    console.log("🤖 Seeding AI answers...");
    const aiAnswersData = loadMockFile<any>("ai-answers.json");
    for (const answer of aiAnswersData) {
      await db.insert(schema.aiAnswers).values({
        id: answer.id,
        threadId: answer.threadId,
        courseId: answer.courseId,
        content: answer.content,
        confidenceLevel: answer.confidenceLevel,
        routing: answer.routing ? JSON.stringify(answer.routing) : null,
        endorsementCount: answer.endorsedBy?.length || 0,
        generatedAt: answer.generatedAt,
        tenantId: DEMO_TENANT_ID,
      });

      // Create AI answer citations if they exist
      if (answer.citations && Array.isArray(answer.citations)) {
        for (let i = 0; i < answer.citations.length; i++) {
          const citation = answer.citations[i];
          // Only create citation if materialId exists
          if (citation.materialId) {
            await db.insert(schema.aiAnswerCitations).values({
              id: generateUuid(),
              aiAnswerId: answer.id,
              materialId: citation.materialId,
              excerpt: citation.excerpt,
              relevanceScore: citation.relevanceScore || 80,
              citationNumber: i + 1,
              tenantId: DEMO_TENANT_ID,
            });
          }
        }
      }

      // Create AI answer endorsements (junction table)
      if (answer.endorsedBy && Array.isArray(answer.endorsedBy)) {
        for (const userId of answer.endorsedBy) {
          await db.insert(schema.aiAnswerEndorsements).values({
            id: generateUuid(),
            aiAnswerId: answer.id,
            userId,
            createdAt: answer.generatedAt,
            tenantId: DEMO_TENANT_ID,
          });
        }
      }
    }
    console.log(`✅ Seeded ${aiAnswersData.length} AI answers\n`);

    // 9. Seed Notifications
    console.log("🔔 Seeding notifications...");
    const notificationsData = loadMockFile<any>("notifications.json");
    for (const notification of notificationsData) {
      await db.insert(schema.notifications).values({
        id: notification.id,
        userId: notification.userId,
        type: notification.type,
        title: notification.title || notification.content || "Notification",
        message: notification.message || notification.content,
        threadId: notification.threadId || null,
        postId: notification.postId || null,
        read: notification.read ? true : false,
        createdAt: notification.createdAt,
        tenantId: DEMO_TENANT_ID,
      });
    }
    console.log(`✅ Seeded ${notificationsData.length} notifications\n`);

    // 10. Seed AI Conversations
    console.log("💬 Seeding AI conversations...");
    const conversationsData = loadMockFile<any>("ai-conversations.json");
    for (const conversation of conversationsData) {
      await db.insert(schema.aiConversations).values({
        id: conversation.id,
        userId: conversation.userId,
        courseId: conversation.courseId || null,
        title: conversation.title,
        messageCount: conversation.messageCount || 0,
        lastMessageAt: conversation.updatedAt,
        createdAt: conversation.createdAt,
        tenantId: DEMO_TENANT_ID,
      });
    }
    console.log(`✅ Seeded ${conversationsData.length} AI conversations\n`);

    // 11. Seed AI Messages
    console.log("💭 Seeding AI messages...");
    const messagesData = loadMockFile<any>("ai-messages.json");
    for (const message of messagesData) {
      await db.insert(schema.aiMessages).values({
        id: message.id,
        conversationId: message.conversationId,
        role: message.role,
        content: message.content,
        createdAt: message.timestamp,
        tenantId: DEMO_TENANT_ID,
      });
    }
    console.log(`✅ Seeded ${messagesData.length} AI messages\n`);

    // 12. Seed Response Templates
    console.log("📝 Seeding response templates...");
    const templatesData = loadMockFile<any>("response-templates.json");
    for (const template of templatesData) {
      await db.insert(schema.responseTemplates).values({
        id: template.id,
        userId: template.userId,
        title: template.title,
        content: template.content,
        tags: template.tags ? JSON.stringify(template.tags) : null,
        courseId: template.courseId || null,
        createdAt: template.createdAt,
        tenantId: DEMO_TENANT_ID,
      });
    }
    console.log(`✅ Seeded ${templatesData.length} response templates\n`);

    console.log("🎉 Database seed completed successfully!\n");
    console.log("📊 Summary:");
    console.log(`   - Users: ${usersData.length}`);
    console.log(`   - Courses: ${coursesData.length}`);
    console.log(`   - Enrollments: ${enrollmentsData.length}`);
    console.log(`   - Course Materials: ${materialsData.length}`);
    console.log(`   - Assignments: ${assignmentsData.length}`);
    console.log(`   - Threads: ${threadsData.length}`);
    console.log(`   - Posts: ${postsData.length}`);
    console.log(`   - AI Answers: ${aiAnswersData.length}`);
    console.log(`   - Notifications: ${notificationsData.length}`);
    console.log(`   - AI Conversations: ${conversationsData.length}`);
    console.log(`   - AI Messages: ${messagesData.length}`);
    console.log(`   - Response Templates: ${templatesData.length}`);
  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  }

  process.exit(0);
}

// Run seed
seed();
