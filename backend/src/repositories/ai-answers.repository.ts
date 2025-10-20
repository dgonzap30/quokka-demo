/**
 * AI Answers Repository
 *
 * Data access layer for ai_answers, ai_answer_citations, and ai_answer_endorsements tables
 */

import { eq, and, type SQL } from "drizzle-orm";
import { BaseRepository } from "./base.repository.js";
import {
  aiAnswers,
  aiAnswerCitations,
  aiAnswerEndorsements,
  users,
  type AIAnswer,
  type NewAIAnswer,
  type AIAnswerCitation,
  type AIAnswerEndorsement,
} from "../db/schema.js";
import { db } from "../db/client.js";

/**
 * Full AI Answer with computed fields
 */
export interface AIAnswerWithDetails extends AIAnswer {
  citations: AIAnswerCitation[];
  endorsedBy: string[];
  totalEndorsements: number;
  instructorEndorsements: number;
  studentEndorsements: number;
  instructorEndorsed: boolean;
}

export class AIAnswersRepository extends BaseRepository<
  typeof aiAnswers,
  AIAnswer,
  NewAIAnswer
> {
  constructor() {
    super(aiAnswers);
  }

  /**
   * Implement abstract method: ID equality check
   */
  protected idEquals(id: string): SQL {
    return eq(this.table.id, id);
  }

  /**
   * Implement abstract method: Field equality check
   */
  protected fieldEquals(field: string, value: any): SQL {
    return eq(this.table[field as keyof typeof this.table], value);
  }

  /**
   * Find AI answer by thread ID (with citations and endorsements)
   */
  async findByThreadId(threadId: string): Promise<AIAnswerWithDetails | null> {
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

  /**
   * Find AI answer by ID (with citations and endorsements)
   */
  async findByIdWithDetails(id: string): Promise<AIAnswerWithDetails | null> {
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

  /**
   * Create endorsement for AI answer
   */
  async createEndorsement(
    aiAnswerId: string,
    userId: string,
    tenantId: string
  ): Promise<AIAnswerEndorsement> {
    const id = `ai-endorse-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const createdAt = new Date().toISOString();

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

    // Update endorsement count (get count from database)
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

  /**
   * Check if user already endorsed AI answer
   */
  async hasUserEndorsed(aiAnswerId: string, userId: string): Promise<boolean> {
    const [endorsement] = await db
      .select()
      .from(aiAnswerEndorsements)
      .where(
        and(
          eq(aiAnswerEndorsements.aiAnswerId, aiAnswerId),
          eq(aiAnswerEndorsements.userId, userId)
        )
      )
      .limit(1);

    return !!endorsement;
  }

  /**
   * Get existing endorsement by user
   */
  async getEndorsement(aiAnswerId: string, userId: string) {
    const [endorsement] = await db
      .select()
      .from(aiAnswerEndorsements)
      .where(
        and(
          eq(aiAnswerEndorsements.aiAnswerId, aiAnswerId),
          eq(aiAnswerEndorsements.userId, userId)
        )
      )
      .limit(1);

    return endorsement || null;
  }

  /**
   * Private: Enrich AI answer with citations and endorsements
   */
  private async enrichAIAnswer(aiAnswer: AIAnswer): Promise<AIAnswerWithDetails> {
    // Get citations
    const citations = await db
      .select()
      .from(aiAnswerCitations)
      .where(eq(aiAnswerCitations.aiAnswerId, aiAnswer.id));

    // Get endorsements with user details
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

    // Compute endorsement metrics
    const endorsedBy = endorsements.map((e) => e.userId);
    const instructorEndorsements = endorsements.filter(
      (e) => e.role === "instructor"
    ).length;
    const studentEndorsements = endorsements.filter(
      (e) => e.role === "student"
    ).length;

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

  /**
   * Get citations for an AI answer
   */
  async getCitations(aiAnswerId: string) {
    return await db
      .select()
      .from(aiAnswerCitations)
      .where(eq(aiAnswerCitations.aiAnswerId, aiAnswerId))
      .orderBy(aiAnswerCitations.citationNumber);
  }
}

// Export singleton instance
export const aiAnswersRepository = new AIAnswersRepository();
