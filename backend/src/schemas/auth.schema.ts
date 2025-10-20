/**
 * Auth Schemas (Zod)
 *
 * Validation schemas for authentication endpoints
 */

import { z } from "zod";

/**
 * Dev Login Request
 * Simple email-based login for demo (no password validation)
 */
export const devLoginSchema = z.object({
  email: z.string().email("Invalid email format"),
});

export type DevLoginInput = z.infer<typeof devLoginSchema>;

/**
 * Auth Response
 * Returned after successful login
 */
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

export type AuthResponse = z.infer<typeof authResponseSchema>;

/**
 * Current User Response
 * Returned from GET /auth/me
 */
export const currentUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  role: z.enum(["student", "instructor", "ta"]),
  avatar: z.string().nullable(),
  createdAt: z.string(),
});

export type CurrentUser = z.infer<typeof currentUserSchema>;

/**
 * Logout Response
 */
export const logoutResponseSchema = z.object({
  message: z.string(),
});

export type LogoutResponse = z.infer<typeof logoutResponseSchema>;
