import { type SQL } from "drizzle-orm";
import { BaseRepository } from "./base.repository.js";
import { aiAnswers, type AIAnswer, type NewAIAnswer, type AIAnswerCitation, type AIAnswerEndorsement } from "../db/schema.js";
export interface AIAnswerWithDetails extends AIAnswer {
    citations: AIAnswerCitation[];
    endorsedBy: string[];
    totalEndorsements: number;
    instructorEndorsements: number;
    studentEndorsements: number;
    instructorEndorsed: boolean;
}
export declare class AIAnswersRepository extends BaseRepository<typeof aiAnswers, AIAnswer, NewAIAnswer> {
    constructor();
    protected idEquals(id: string): SQL;
    protected fieldEquals<K extends keyof typeof this.table>(field: K, value: any): SQL;
    findByThreadId(threadId: string): Promise<AIAnswerWithDetails | null>;
    findByIdWithDetails(id: string): Promise<AIAnswerWithDetails | null>;
    createEndorsement(aiAnswerId: string, userId: string, tenantId: string): Promise<AIAnswerEndorsement>;
    hasUserEndorsed(aiAnswerId: string, userId: string): Promise<boolean>;
    getEndorsement(aiAnswerId: string, userId: string): Promise<{
        id: string;
        tenantId: string;
        createdAt: string;
        userId: string;
        aiAnswerId: string;
    }>;
    private enrichAIAnswer;
    getCitations(aiAnswerId: string): Promise<{
        id: string;
        tenantId: string;
        aiAnswerId: string;
        materialId: string;
        excerpt: string;
        relevanceScore: number;
        citationNumber: number;
    }[]>;
}
export declare const aiAnswersRepository: AIAnswersRepository;
//# sourceMappingURL=ai-answers.repository.d.ts.map