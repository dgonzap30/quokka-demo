import { type SQL } from "drizzle-orm";
import { BaseRepository } from "./base.repository.js";
import { courses, type Course, type NewCourse } from "../db/schema.js";
export declare class CoursesRepository extends BaseRepository<typeof courses, Course, NewCourse> {
    constructor();
    protected idEquals(id: string): SQL;
    protected fieldEquals<K extends keyof typeof this.table>(field: K, value: any): SQL;
    findAll(includeArchived?: boolean): Promise<Course[]>;
    findByCode(code: string): Promise<Course | null>;
    findByIdOrThrow(id: string): Promise<Course>;
}
export declare const coursesRepository: CoursesRepository;
//# sourceMappingURL=courses.repository.d.ts.map