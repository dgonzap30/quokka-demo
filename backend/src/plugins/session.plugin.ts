/**
 * Session Plugin (Simple Demo Version)
 *
 * Uses @fastify/cookie for simple session management
 * Stores session data in signed cookies (good for demo, easy to scale to Redis later)
 */

import type { FastifyInstance, FastifyReply } from "fastify";
import fastifyCookie from "@fastify/cookie";
import fp from "fastify-plugin";

const SESSION_COOKIE_NAME = "quokka.session";
const SESSION_SECRET = process.env.SESSION_SECRET || "demo-secret-change-in-production";
const SESSION_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

export interface SessionData {
  userId: string;
  email: string;
  role: string;
  createdAt: string;
}

// Extend Fastify request type
declare module "fastify" {
  interface FastifyRequest {
    session?: SessionData;
  }
}

async function sessionPlugin(fastify: FastifyInstance) {
  // Register cookie plugin
  await fastify.register(fastifyCookie, {
    secret: SESSION_SECRET,
    hook: "onRequest",
  });

  // Decorator to get session from cookie
  fastify.decorateRequest("session", null);

  // Hook to parse session from cookie on every request
  fastify.addHook("onRequest", async (request, _reply) => {
    const sessionCookie = request.cookies[SESSION_COOKIE_NAME];

    if (sessionCookie) {
      try {
        // Verify and parse signed cookie
        const unsignedValue = request.unsignCookie(sessionCookie);

        if (unsignedValue.valid && unsignedValue.value) {
          const sessionData = JSON.parse(unsignedValue.value) as SessionData;
          request.session = sessionData;
        }
      } catch (error) {
        // Invalid session cookie, ignore and continue
        request.log.warn("Invalid session cookie, ignoring");
      }
    }
  });

  // Helper to set session
  fastify.decorate("setSession", function (reply: FastifyReply, sessionData: SessionData) {
    const cookieValue = JSON.stringify(sessionData);

    reply.setCookie(SESSION_COOKIE_NAME, cookieValue, {
      signed: true,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_MAX_AGE,
      path: "/",
    });
  });

  // Helper to clear session
  fastify.decorate("clearSession", function (reply: FastifyReply) {
    reply.clearCookie(SESSION_COOKIE_NAME, {
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
