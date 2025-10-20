import { type SQL } from "drizzle-orm";
import { BaseRepository } from "./base.repository.js";
import { courseMaterials, type CourseMaterial, type NewCourseMaterial } from "../db/schema.js";
export interface MaterialSearchResult {
    material: CourseMaterial & {
        keywords: string[];
    };
    relevanceScore: number;
    matchedKeywords: string[];
    snippet: string;
}
export declare class CourseMaterialsRepository extends BaseRepository<typeof courseMaterials, CourseMaterial, NewCourseMaterial> {
    constructor();
    protected idEquals(id: string): SQL;
    protected fieldEquals<K extends keyof typeof this.table>(field: K, value: any): SQL;
    findByCourse(courseId: string): Promise<Array<CourseMaterial & {
        keywords: string[];
    }>>;
    findByType(courseId: string, types: string[]): Promise<Array<CourseMaterial & {
        keywords: string[];
    }>>;
    searchMaterials(courseId: string, query: string, types?: string[], limit?: number, minRelevance?: number): Promise<MaterialSearchResult[]>;
    private extractKeywords;
    private isStopWord;
    private generateSnippet;
}
export declare const courseMaterialsRepository: CourseMaterialsRepository;
//# sourceMappingURL=materials.repository.d.ts.map