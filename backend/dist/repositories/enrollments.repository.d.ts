import { type SQL } from "drizzle-orm";
import { BaseRepository } from "./base.repository.js";
import { enrollments, type Enrollment, type NewEnrollment } from "../db/schema.js";
export declare class EnrollmentsRepository extends BaseRepository<typeof enrollments, Enrollment, NewEnrollment> {
    constructor();
    protected idEquals(id: string): SQL;
    protected fieldEquals<K extends keyof typeof this.table>(field: K, value: any): SQL;
    findByUserId(userId: string): Promise<{
        id: string;
        userId: string;
        courseId: string;
        role: string;
        enrolledAt: string;
        tenantId: string;
        course: {
            name: string;
            id: string;
            description: string;
            status: string;
            code: string;
            term: string;
        } | null;
    }[]>;
    findByCourseId(courseId: string): Promise<Enrollment[]>;
    findByUserAndCourse(userId: string, courseId: string): Promise<Enrollment | null>;
    isUserEnrolled(userId: string, courseId: string): Promise<boolean>;
}
export declare const enrollmentsRepository: EnrollmentsRepository;
//# sourceMappingURL=enrollments.repository.d.ts.map