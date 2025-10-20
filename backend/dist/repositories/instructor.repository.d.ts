import { type SQL } from "drizzle-orm";
import { BaseRepository } from "./base.repository.js";
import { responseTemplates, type ResponseTemplate, type NewResponseTemplate } from "../db/schema.js";
export declare class InstructorRepository extends BaseRepository<typeof responseTemplates, ResponseTemplate, NewResponseTemplate> {
    constructor();
    protected idEquals(id: string): SQL;
    protected fieldEquals<K extends keyof typeof this.table>(field: K, value: any): SQL;
    findByUserId(userId: string): Promise<ResponseTemplate[]>;
    deleteTemplate(id: string): Promise<void>;
}
export declare const instructorRepository: InstructorRepository;
//# sourceMappingURL=instructor.repository.d.ts.map