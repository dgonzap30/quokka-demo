/**
 * Auth Routes
 *
 * Authentication endpoints (dev-login, me, logout)
 */

import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "../../plugins/validation.plugin.js";
import { devLoginSchema, authResponseSchema, currentUserSchema, logoutResponseSchema } from "../../schemas/auth.schema.js";
import { usersRepository } from "../../repositories/users.repository.js";
import { UnauthorizedError, NotFoundError, serializeDate } from "../../utils/errors.js";
import type { SessionData } from "../../plugins/session.plugin.js";

export async function authRoutes(fastify: FastifyInstance) {
  const server = fastify.withTypeProvider<ZodTypeProvider>();

  /**
   * POST /api/v1/auth/dev-login
   * Simple email-based login for demo (no password required)
   */
  server.post(
    "/dev-login",
    {
      schema: {
        body: devLoginSchema,
        response: {
          200: authResponseSchema,
        },
        tags: ["auth"],
        description: "Dev login (email only, no password)",
      },
    },
    async (request, reply) => {
      const { email } = request.body;

      // Find user by email
      const user = await usersRepository.findByEmail(email);

      if (!user) {
        throw new NotFoundError("User with this email");
      }

      // Create session data
      const sessionData: SessionData = {
        userId: user.id,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
        createdAt: new Date().toISOString(),
      };

      // Set session cookie (JWT-based)
      await fastify.setSession(reply, sessionData);

      return {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role as "student" | "instructor" | "ta",
          avatar: user.avatar,
        },
        message: "Logged in successfully",
      };
    }
  );

  /**
   * GET /api/v1/auth/me
   * Get current logged-in user
   */
  server.get(
    "/me",
    {
      schema: {
        response: {
          200: currentUserSchema,
        },
        tags: ["auth"],
        description: "Get current user",
      },
    },
    async (request, reply) => {
      // Check if user is authenticated
      if (!request.session) {
        throw new UnauthorizedError("Not authenticated");
      }

      // Get full user data from database
      const user = await usersRepository.findById(request.session.userId);

      if (!user) {
        throw new UnauthorizedError("Session user not found");
      }

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role as "student" | "instructor" | "ta",
        avatar: user.avatar,
        createdAt: serializeDate(user.createdAt)!,
      };
    }
  );

  /**
   * POST /api/v1/auth/logout
   * Log out current user
   */
  server.post(
    "/logout",
    {
      schema: {
        response: {
          200: logoutResponseSchema,
        },
        tags: ["auth"],
        description: "Logout current user",
      },
    },
    async (request, reply) => {
      // Clear session cookie
      fastify.clearSession(reply);

      return {
        message: "Logged out successfully",
      };
    }
  );
}
