/**
 * Fastify Server
 *
 * Production-ready HTTP server with health checks
 * Phase 1: Basic setup with health endpoints
 * Future phases: Auth, validation, routes, plugins
 */

import Fastify from "fastify";
import cors from "@fastify/cors";
import { isDatabaseHealthy, closeDatabase } from "./db/client.js";

// Plugins
import sessionPlugin from "./plugins/session.plugin.js";
import validationPlugin from "./plugins/validation.plugin.js";
import errorPlugin from "./plugins/error.plugin.js";

// Routes
import healthRoutes from "./routes/v1/health.routes.js";
import { authRoutes } from "./routes/v1/auth.routes.js";
import { threadsRoutes } from "./routes/v1/threads.routes.js";
import { postsRoutes } from "./routes/v1/posts.routes.js";
import { coursesRoutes } from "./routes/v1/courses.routes.js";
import { materialsRoutes } from "./routes/v1/materials.routes.js";
import { aiAnswersRoutes } from "./routes/v1/ai-answers.routes.js";
import { conversationsRoutes } from "./routes/v1/conversations.routes.js";
import { instructorRoutes } from "./routes/v1/instructor.routes.js";
import { notificationsRoutes } from "./routes/v1/notifications.routes.js";

// Server configuration
const PORT = Number(process.env.PORT) || 3001;
const HOST = process.env.HOST || "0.0.0.0";
const NODE_ENV = process.env.NODE_ENV || "development";

// Create Fastify instance
const fastify = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || "info",
    transport:
      NODE_ENV === "development"
        ? {
            target: "pino-pretty",
            options: {
              colorize: true,
              translateTime: "HH:MM:ss Z",
              ignore: "pid,hostname",
            },
          }
        : undefined,
  },
});

// ============================================================================
// PLUGINS
// ============================================================================

// CORS for frontend integration
await fastify.register(cors, {
  origin: process.env.CORS_ORIGIN || "http://localhost:3000",
  credentials: true,
});

// Session management (must be before routes)
await fastify.register(sessionPlugin);

// Validation (Zod schemas)
await fastify.register(validationPlugin);

// Error handling (must be after other plugins)
await fastify.register(errorPlugin);

// ============================================================================
// HEALTH CHECK ROUTES
// ============================================================================

/**
 * GET /health
 * Liveness probe - checks if server is running
 */
fastify.get("/health", async (request, reply) => {
  return { status: "ok", timestamp: new Date().toISOString() };
});

/**
 * GET /api/v1/_status
 * Readiness probe - checks if server + database are ready
 */
fastify.get("/api/v1/_status", async (request, reply) => {
  const dbHealthy = isDatabaseHealthy();

  if (!dbHealthy) {
    reply.code(503);
    return {
      status: "unhealthy",
      database: "down",
      timestamp: new Date().toISOString(),
    };
  }

  return {
    status: "healthy",
    database: "up",
    environment: NODE_ENV,
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  };
});

// ============================================================================
// API ROUTES
// ============================================================================

// Health check routes (v1 API endpoints)
await fastify.register(healthRoutes, { prefix: "/api/v1" });

// Auth routes
await fastify.register(authRoutes, { prefix: "/api/v1/auth" });

// Threads routes
await fastify.register(threadsRoutes, { prefix: "/api/v1" });

// Posts routes
await fastify.register(postsRoutes, { prefix: "/api/v1" });

// Courses routes
await fastify.register(coursesRoutes, { prefix: "/api/v1" });

// Materials routes
await fastify.register(materialsRoutes, { prefix: "/api/v1" });

// AI Answers routes
await fastify.register(aiAnswersRoutes, { prefix: "/api/v1" });

// Conversations routes
await fastify.register(conversationsRoutes, { prefix: "/api/v1" });

// Instructor routes
await fastify.register(instructorRoutes, { prefix: "/api/v1" });

// Notifications routes
await fastify.register(notificationsRoutes, { prefix: "/api/v1" });

// ============================================================================
// GRACEFUL SHUTDOWN
// ============================================================================

const gracefulShutdown = async (signal: string) => {
  fastify.log.info(`Received ${signal}, shutting down gracefully...`);

  try {
    // Close Fastify server (stop accepting new requests)
    await fastify.close();
    fastify.log.info("Fastify server closed");

    // Close database connection
    closeDatabase();
    fastify.log.info("Database connection closed");

    process.exit(0);
  } catch (error) {
    fastify.log.error({ err: error }, "Error during shutdown");
    process.exit(1);
  }
};

// Handle shutdown signals
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// ============================================================================
// START SERVER
// ============================================================================

try {
  await fastify.listen({ port: PORT, host: HOST });
  fastify.log.info(`
🚀 QuokkaQ Backend Server is running!

   Environment: ${NODE_ENV}
   URL: http://${HOST}:${PORT}
   Health: http://${HOST}:${PORT}/health
   Status: http://${HOST}:${PORT}/api/v1/_status

   Ready to accept requests! 🎉
  `);
} catch (error) {
  fastify.log.error({ err: error }, "Failed to start server");
  process.exit(1);
}
