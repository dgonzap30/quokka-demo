import { z } from "zod";
export const devLoginSchema = z.object({
    email: z.string().email("Invalid email format"),
});
export const authResponseSchema = z.object({
    user: z.object({
        id: z.string(),
        name: z.string(),
        email: z.string().email(),
        role: z.enum(["student", "instructor", "ta"]),
        avatar: z.string().nullable(),
    }),
    message: z.string(),
});
export const currentUserSchema = z.object({
    id: z.string(),
    name: z.string(),
    email: z.string().email(),
    role: z.enum(["student", "instructor", "ta"]),
    avatar: z.string().nullable(),
    createdAt: z.string(),
});
export const logoutResponseSchema = z.object({
    message: z.string(),
});
//# sourceMappingURL=auth.schema.js.map