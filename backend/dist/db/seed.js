import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { db } from "./client.js";
import * as schema from "./schema.js";
import { generateUuid } from "./helpers.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DEMO_TENANT_ID = "tenant-demo-001";
function loadMockFile(filename) {
    const path = join(__dirname, "../../../mocks", filename);
    const content = readFileSync(path, "utf-8");
    return JSON.parse(content);
}
function toDate(value) {
    if (!value)
        return null;
    return new Date(value);
}
async function seed() {
    console.log("🌱 Starting database seed...\n");
    try {
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
        console.log("👤 Seeding users...");
        const usersData = loadMockFile("users.json");
        for (const user of usersData) {
            await db.insert(schema.users).values({
                id: user.id,
                name: user.name,
                email: user.email,
                password: user.password,
                role: user.role,
                avatar: user.avatar || null,
                tenantId: DEMO_TENANT_ID,
                createdAt: toDate(user.createdAt) || new Date(),
            });
        }
        console.log(`✅ Seeded ${usersData.length} users\n`);
        console.log("📚 Seeding courses...");
        const coursesData = loadMockFile("courses.json");
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
                createdAt: toDate(course.createdAt) || new Date(),
            });
        }
        console.log(`✅ Seeded ${coursesData.length} courses\n`);
        console.log("🎓 Seeding enrollments...");
        const enrollmentsData = loadMockFile("enrollments.json");
        for (const enrollment of enrollmentsData) {
            await db.insert(schema.enrollments).values({
                id: enrollment.id,
                userId: enrollment.userId,
                courseId: enrollment.courseId,
                role: enrollment.role,
                enrolledAt: toDate(enrollment.enrolledAt) || new Date(),
                tenantId: DEMO_TENANT_ID,
            });
        }
        console.log(`✅ Seeded ${enrollmentsData.length} enrollments\n`);
        console.log("📖 Seeding course materials...");
        const materialsData = loadMockFile("course-materials.json");
        for (const material of materialsData) {
            await db.insert(schema.courseMaterials).values({
                id: material.id,
                courseId: material.courseId,
                title: material.title,
                type: material.type,
                content: material.content,
                metadata: material.metadata ? JSON.stringify(material.metadata) : null,
                createdAt: toDate(material.createdAt) || new Date(),
                tenantId: DEMO_TENANT_ID,
            });
        }
        console.log(`✅ Seeded ${materialsData.length} course materials\n`);
        console.log("✍️  Seeding assignments...");
        const assignmentsFile = loadMockFile("assignments.json");
        const assignmentsData = Array.isArray(assignmentsFile) ? assignmentsFile : assignmentsFile?.assignments || [];
        for (const assignment of assignmentsData) {
            await db.insert(schema.assignments).values({
                id: assignment.id,
                courseId: assignment.courseId,
                title: assignment.title,
                description: assignment.description || "",
                dueDate: toDate(assignment.dueDate) || new Date(),
                status: assignment.status || "active",
                questionCount: assignment.questionCount || 0,
                tenantId: DEMO_TENANT_ID,
                createdAt: toDate(assignment.createdAt) || new Date(),
            });
        }
        console.log(`✅ Seeded ${assignmentsData.length} assignments\n`);
        console.log("💬 Seeding threads...");
        const threadsData = loadMockFile("threads.json");
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
                createdAt: toDate(thread.createdAt) || new Date(),
                updatedAt: toDate(thread.updatedAt) || new Date(),
                tenantId: DEMO_TENANT_ID,
            });
            if (thread.endorsedBy && Array.isArray(thread.endorsedBy)) {
                for (const userId of thread.endorsedBy) {
                    await db.insert(schema.threadEndorsements).values({
                        id: generateUuid(),
                        threadId: thread.id,
                        userId,
                        createdAt: toDate(thread.createdAt) || new Date(),
                        tenantId: DEMO_TENANT_ID,
                    });
                }
            }
            if (thread.upvotedBy && Array.isArray(thread.upvotedBy)) {
                for (const userId of thread.upvotedBy) {
                    await db.insert(schema.threadUpvotes).values({
                        id: generateUuid(),
                        threadId: thread.id,
                        userId,
                        createdAt: toDate(thread.createdAt) || new Date(),
                        tenantId: DEMO_TENANT_ID,
                    });
                }
            }
        }
        console.log(`✅ Seeded ${threadsData.length} threads\n`);
        console.log("✉️  Seeding posts...");
        const postsData = loadMockFile("posts.json");
        for (const post of postsData) {
            await db.insert(schema.posts).values({
                id: post.id,
                threadId: post.threadId,
                authorId: post.authorId,
                content: post.content,
                isInstructorAnswer: post.isInstructorAnswer ? true : false,
                endorsementCount: post.endorsedBy?.length || 0,
                createdAt: toDate(post.createdAt) || new Date(),
                updatedAt: toDate(post.updatedAt || post.createdAt) || new Date(),
                tenantId: DEMO_TENANT_ID,
            });
            if (post.endorsedBy && Array.isArray(post.endorsedBy)) {
                for (const userId of post.endorsedBy) {
                    await db.insert(schema.postEndorsements).values({
                        id: generateUuid(),
                        postId: post.id,
                        userId,
                        createdAt: toDate(post.createdAt) || new Date(),
                        tenantId: DEMO_TENANT_ID,
                    });
                }
            }
        }
        console.log(`✅ Seeded ${postsData.length} posts\n`);
        console.log("🤖 Seeding AI answers...");
        const aiAnswersData = loadMockFile("ai-answers.json");
        for (const answer of aiAnswersData) {
            await db.insert(schema.aiAnswers).values({
                id: answer.id,
                threadId: answer.threadId,
                courseId: answer.courseId,
                content: answer.content,
                confidenceLevel: answer.confidenceLevel,
                routing: answer.routing ? JSON.stringify(answer.routing) : null,
                endorsementCount: answer.endorsedBy?.length || 0,
                generatedAt: toDate(answer.generatedAt) || new Date(),
                tenantId: DEMO_TENANT_ID,
            });
            if (answer.citations && Array.isArray(answer.citations)) {
                for (let i = 0; i < answer.citations.length; i++) {
                    const citation = answer.citations[i];
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
        console.log("🔔 Seeding notifications...");
        const notificationsData = loadMockFile("notifications.json");
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
                createdAt: toDate(notification.createdAt) || new Date(),
                tenantId: DEMO_TENANT_ID,
            });
        }
        console.log(`✅ Seeded ${notificationsData.length} notifications\n`);
        console.log("💬 Seeding AI conversations...");
        const conversationsData = loadMockFile("ai-conversations.json");
        for (const conversation of conversationsData) {
            await db.insert(schema.aiConversations).values({
                id: conversation.id,
                userId: conversation.userId,
                courseId: conversation.courseId || null,
                title: conversation.title,
                messageCount: conversation.messageCount || 0,
                lastMessageAt: toDate(conversation.updatedAt) || new Date(),
                createdAt: toDate(conversation.createdAt) || new Date(),
                tenantId: DEMO_TENANT_ID,
            });
        }
        console.log(`✅ Seeded ${conversationsData.length} AI conversations\n`);
        console.log("💭 Seeding AI messages...");
        const messagesData = loadMockFile("ai-messages.json");
        for (const message of messagesData) {
            await db.insert(schema.aiMessages).values({
                id: message.id,
                conversationId: message.conversationId,
                role: message.role,
                content: message.content,
                createdAt: toDate(message.timestamp) || new Date(),
                tenantId: DEMO_TENANT_ID,
            });
        }
        console.log(`✅ Seeded ${messagesData.length} AI messages\n`);
        console.log("📝 Seeding response templates...");
        const templatesData = loadMockFile("response-templates.json");
        for (const template of templatesData) {
            await db.insert(schema.responseTemplates).values({
                id: template.id,
                userId: template.userId,
                title: template.title,
                content: template.content,
                tags: template.tags ? JSON.stringify(template.tags) : null,
                courseId: template.courseId || null,
                createdAt: toDate(template.createdAt) || new Date(),
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
    }
    catch (error) {
        console.error("❌ Seed failed:", error);
        process.exit(1);
    }
    process.exit(0);
}
seed();
//# sourceMappingURL=seed.js.map