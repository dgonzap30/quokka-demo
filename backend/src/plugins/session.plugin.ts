/**
 * Session Plugin (JWT-Based)
 *
 * Uses JWT tokens stored in HTTP-only cookies for stateless authentication
 * Supports both access tokens (short-lived) and refresh tokens (long-lived)
 */

import type { FastifyInstance, FastifyReply } from "fastify";
import fastifyCookie from "@fastify/cookie";
import fp from "fastify-plugin";
import { generateTokenPair, verifyToken, refreshAccessToken } from "../auth/jwt.utils.js";

const ACCESS_TOKEN_COOKIE = "quokka.token";
const REFRESH_TOKEN_COOKIE = "quokka.refresh";
const ACCESS_TOKEN_MAX_AGE = 15 * 60; // 15 minutes in seconds
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds

export interface SessionData {
  userId: string;
  email: string;
  role: string;
  tenantId: string;
  createdAt?: string; // For backward compatibility
}

// Extend Fastify request type
declare module "fastify" {
  interface FastifyRequest {
    session?: SessionData;
  }
}

async function sessionPlugin(fastify: FastifyInstance) {
  // Register cookie plugin (no secret needed for JWT, tokens are self-signed)
  await fastify.register(fastifyCookie, {
    hook: "onRequest",
  });

  // Decorator to get session from JWT
  fastify.decorateRequest("session", null);

  // Hook to parse JWT from cookie on every request
  fastify.addHook("onRequest", async (request, reply) => {
    const accessToken = request.cookies[ACCESS_TOKEN_COOKIE];
    const refreshToken = request.cookies[REFRESH_TOKEN_COOKIE];

    if (accessToken) {
      try {
        // Verify access token
        const payload = await verifyToken(accessToken, "access");

        // Set session data from token payload
        request.session = {
          userId: payload.userId,
          email: payload.email,
          role: payload.role,
          tenantId: payload.tenantId,
        };
      } catch (error: any) {
        // Access token is invalid or expired
        if (error.message === "Token has expired" && refreshToken) {
          try {
            // Try to refresh the access token
            const newAccessToken = await refreshAccessToken(refreshToken);
            const payload = await verifyToken(newAccessToken, "access");

            // Set new access token cookie
            reply.setCookie(ACCESS_TOKEN_COOKIE, newAccessToken, {
              httpOnly: true,
              secure: process.env.NODE_ENV === "production",
              sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
              maxAge: ACCESS_TOKEN_MAX_AGE,
              path: "/",
            });

            // Set session data
            request.session = {
              userId: payload.userId,
              email: payload.email,
              role: payload.role,
              tenantId: payload.tenantId,
            };

            request.log.info("Access token refreshed successfully");
          } catch (refreshError) {
            // Refresh token is also invalid, clear cookies
            request.log.warn("Refresh token is invalid, clearing session");
            reply.clearCookie(ACCESS_TOKEN_COOKIE, { path: "/" });
            reply.clearCookie(REFRESH_TOKEN_COOKIE, { path: "/" });
          }
        } else {
          // Other errors, just clear the session
          request.log.warn({ error: error.message }, "Invalid access token");
        }
      }
    }
  });

  // Helper to set session (generates JWT tokens)
  fastify.decorate("setSession", async function (reply: FastifyReply, sessionData: SessionData) {
    try {
      // Generate access and refresh tokens
      const { accessToken, refreshToken } = await generateTokenPair({
        userId: sessionData.userId,
        email: sessionData.email,
        role: sessionData.role,
        tenantId: sessionData.tenantId,
      });

      // Set access token cookie (short-lived)
      reply.setCookie(ACCESS_TOKEN_COOKIE, accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
        maxAge: ACCESS_TOKEN_MAX_AGE,
        path: "/",
      });

      // Set refresh token cookie (long-lived)
      reply.setCookie(REFRESH_TOKEN_COOKIE, refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
        maxAge: REFRESH_TOKEN_MAX_AGE,
        path: "/",
      });
    } catch (error) {
      fastify.log.error({ error }, "Failed to generate session tokens");
      throw error;
    }
  });

  // Helper to clear session
  fastify.decorate("clearSession", function (reply: FastifyReply) {
    reply.clearCookie(ACCESS_TOKEN_COOKIE, {
      path: "/",
    });
    reply.clearCookie(REFRESH_TOKEN_COOKIE, {
      path: "/",
    });
  });
}

// Export as fastify plugin
export default fp(sessionPlugin, {
  name: "session-plugin",
});

// Type augmentation for fastify instance
declare module "fastify" {
  interface FastifyInstance {
    setSession(reply: FastifyReply, sessionData: SessionData): void;
    clearSession(reply: FastifyReply): void;
  }
}
