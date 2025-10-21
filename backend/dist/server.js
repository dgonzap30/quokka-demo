import Fastify from "fastify";
import cors from "@fastify/cors";
import { isDatabaseHealthy, closeDatabase } from "./db/client.js";
import sessionPlugin from "./plugins/session.plugin.js";
import validationPlugin from "./plugins/validation.plugin.js";
import errorPlugin from "./plugins/error.plugin.js";
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
const PORT = Number(process.env.PORT) || 3001;
const HOST = process.env.HOST || "0.0.0.0";
const NODE_ENV = process.env.NODE_ENV || "development";
const fastify = Fastify({
    logger: {
        level: process.env.LOG_LEVEL || "info",
        transport: NODE_ENV === "development"
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
const allowedOrigins = [
    "http://localhost:3000",
    process.env.FRONTEND_URL,
].filter((url) => typeof url === "string");
await fastify.register(cors, {
    origin: (origin, callback) => {
        if (!origin) {
            callback(null, true);
            return;
        }
        const originStr = origin;
        if (allowedOrigins.some((allowed) => originStr.startsWith(allowed))) {
            callback(null, true);
        }
        else {
            callback(new Error(`Origin ${originStr} not allowed by CORS`), false);
        }
    },
    credentials: true,
});
await fastify.register(sessionPlugin);
await fastify.register(validationPlugin);
await fastify.register(errorPlugin);
fastify.get("/health", async (request, reply) => {
    return { status: "ok", timestamp: new Date().toISOString() };
});
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
await fastify.register(healthRoutes, { prefix: "/api/v1" });
await fastify.register(authRoutes, { prefix: "/api/v1/auth" });
await fastify.register(threadsRoutes, { prefix: "/api/v1" });
await fastify.register(postsRoutes, { prefix: "/api/v1" });
await fastify.register(coursesRoutes, { prefix: "/api/v1" });
await fastify.register(materialsRoutes, { prefix: "/api/v1" });
await fastify.register(aiAnswersRoutes, { prefix: "/api/v1" });
await fastify.register(conversationsRoutes, { prefix: "/api/v1" });
await fastify.register(instructorRoutes, { prefix: "/api/v1" });
await fastify.register(notificationsRoutes, { prefix: "/api/v1" });
const gracefulShutdown = async (signal) => {
    fastify.log.info(`Received ${signal}, shutting down gracefully...`);
    try {
        await fastify.close();
        fastify.log.info("Fastify server closed");
        closeDatabase();
        fastify.log.info("Database connection closed");
        process.exit(0);
    }
    catch (error) {
        fastify.log.error({ err: error }, "Error during shutdown");
        process.exit(1);
    }
};
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
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
}
catch (error) {
    fastify.log.error({ err: error }, "Failed to start server");
    process.exit(1);
}
//# sourceMappingURL=server.js.map