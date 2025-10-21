import { eq, and } from "drizzle-orm";
import { BaseRepository } from "./base.repository.js";
import { aiAnswers, aiAnswerCitations, aiAnswerEndorsements, users, } from "../db/schema.js";
import { db } from "../db/client.js";
export class AIAnswersRepository extends BaseRepository {
    constructor() {
        super(aiAnswers);
    }
    idEquals(id) {
        return eq(this.table.id, id);
    }
    fieldEquals(field, value) {
        const column = this.table[field];
        if (!column || typeof column === 'function') {
            throw new Error(`Invalid field: ${String(field)}`);
        }
        return eq(column, value);
    }
    async findByThreadId(threadId) {
        const [aiAnswer] = await db
            .select()
            .from(aiAnswers)
            .where(eq(aiAnswers.threadId, threadId))
            .limit(1);
        if (!aiAnswer) {
            return null;
        }
        return this.enrichAIAnswer(aiAnswer);
    }
    async findByIdWithDetails(id) {
        const [aiAnswer] = await db
            .select()
            .from(aiAnswers)
            .where(eq(aiAnswers.id, id))
            .limit(1);
        if (!aiAnswer) {
            return null;
        }
        return this.enrichAIAnswer(aiAnswer);
    }
    async createEndorsement(aiAnswerId, userId, tenantId) {
        const id = `ai-endorse-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const createdAt = new Date();
        const [endorsement] = await db
            .insert(aiAnswerEndorsements)
            .values({
            id,
            aiAnswerId,
            userId,
            createdAt,
            tenantId,
        })
            .returning();
        const endorsementCountResult = await db
            .select()
            .from(aiAnswerEndorsements)
            .where(eq(aiAnswerEndorsements.aiAnswerId, aiAnswerId));
        await db
            .update(aiAnswers)
            .set({
            endorsementCount: endorsementCountResult.length,
        })
            .where(eq(aiAnswers.id, aiAnswerId));
        return endorsement;
    }
    async hasUserEndorsed(aiAnswerId, userId) {
        const [endorsement] = await db
            .select()
            .from(aiAnswerEndorsements)
            .where(and(eq(aiAnswerEndorsements.aiAnswerId, aiAnswerId), eq(aiAnswerEndorsements.userId, userId)))
            .limit(1);
        return !!endorsement;
    }
    async getEndorsement(aiAnswerId, userId) {
        const [endorsement] = await db
            .select()
            .from(aiAnswerEndorsements)
            .where(and(eq(aiAnswerEndorsements.aiAnswerId, aiAnswerId), eq(aiAnswerEndorsements.userId, userId)))
            .limit(1);
        return endorsement || null;
    }
    async enrichAIAnswer(aiAnswer) {
        const citations = await db
            .select()
            .from(aiAnswerCitations)
            .where(eq(aiAnswerCitations.aiAnswerId, aiAnswer.id));
        const endorsements = await db
            .select({
            id: aiAnswerEndorsements.id,
            userId: aiAnswerEndorsements.userId,
            createdAt: aiAnswerEndorsements.createdAt,
            role: users.role,
        })
            .from(aiAnswerEndorsements)
            .innerJoin(users, eq(aiAnswerEndorsements.userId, users.id))
            .where(eq(aiAnswerEndorsements.aiAnswerId, aiAnswer.id));
        const endorsedBy = endorsements.map((e) => e.userId);
        const instructorEndorsements = endorsements.filter((e) => e.role === "instructor").length;
        const studentEndorsements = endorsements.filter((e) => e.role === "student").length;
        return {
            ...aiAnswer,
            citations,
            endorsedBy,
            totalEndorsements: endorsements.length,
            instructorEndorsements,
            studentEndorsements,
            instructorEndorsed: instructorEndorsements > 0,
        };
    }
    async getCitations(aiAnswerId) {
        return await db
            .select()
            .from(aiAnswerCitations)
            .where(eq(aiAnswerCitations.aiAnswerId, aiAnswerId))
            .orderBy(aiAnswerCitations.citationNumber);
    }
}
export const aiAnswersRepository = new AIAnswersRepository();
//# sourceMappingURL=ai-answers.repository.js.map