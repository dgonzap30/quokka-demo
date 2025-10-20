import { z } from "zod";
export declare const devLoginSchema: z.ZodObject<{
    email: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
}, {
    email: string;
}>;
export type DevLoginInput = z.infer<typeof devLoginSchema>;
export declare const authResponseSchema: z.ZodObject<{
    user: z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        email: z.ZodString;
        role: z.ZodEnum<["student", "instructor", "ta"]>;
        avatar: z.ZodNullable<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        id: string;
        email: string;
        role: "student" | "instructor" | "ta";
        avatar: string | null;
    }, {
        name: string;
        id: string;
        email: string;
        role: "student" | "instructor" | "ta";
        avatar: string | null;
    }>;
    message: z.ZodString;
}, "strip", z.ZodTypeAny, {
    message: string;
    user: {
        name: string;
        id: string;
        email: string;
        role: "student" | "instructor" | "ta";
        avatar: string | null;
    };
}, {
    message: string;
    user: {
        name: string;
        id: string;
        email: string;
        role: "student" | "instructor" | "ta";
        avatar: string | null;
    };
}>;
export type AuthResponse = z.infer<typeof authResponseSchema>;
export declare const currentUserSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    email: z.ZodString;
    role: z.ZodEnum<["student", "instructor", "ta"]>;
    avatar: z.ZodNullable<z.ZodString>;
    createdAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
    id: string;
    email: string;
    role: "student" | "instructor" | "ta";
    avatar: string | null;
    createdAt: string;
}, {
    name: string;
    id: string;
    email: string;
    role: "student" | "instructor" | "ta";
    avatar: string | null;
    createdAt: string;
}>;
export type CurrentUser = z.infer<typeof currentUserSchema>;
export declare const logoutResponseSchema: z.ZodObject<{
    message: z.ZodString;
}, "strip", z.ZodTypeAny, {
    message: string;
}, {
    message: string;
}>;
export type LogoutResponse = z.infer<typeof logoutResponseSchema>;
//# sourceMappingURL=auth.schema.d.ts.map