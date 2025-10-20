import { z } from "zod";
import { getUserIdParamsSchema, getNotificationIdParamsSchema, getNotificationsQuerySchema, listNotificationsResponseSchema, markReadResponseSchema, } from "../../schemas/notifications.schema.js";
import { notificationsRepository } from "../../repositories/notifications.repository.js";
import { usersRepository } from "../../repositories/users.repository.js";
import { NotFoundError } from "../../utils/errors.js";
export async function notificationsRoutes(fastify) {
    const server = fastify.withTypeProvider();
    server.get("/notifications", {
        schema: {
            querystring: getNotificationsQuerySchema.extend({
                userId: z.string(),
            }),
            response: {
                200: listNotificationsResponseSchema,
            },
            tags: ["notifications"],
            description: "List all notifications for a user",
        },
    }, async (request, reply) => {
        const { userId, unreadOnly, limit } = request.query;
        const user = await usersRepository.findById(userId);
        if (!user) {
            throw new NotFoundError("User");
        }
        const notifications = await notificationsRepository.findByUserId(userId, unreadOnly, limit);
        const unreadCount = await notificationsRepository.countUnread(userId);
        return {
            notifications: notifications,
            unreadCount,
        };
    });
    server.get("/notifications/unread-count", {
        schema: {
            querystring: z.object({
                userId: z.string(),
            }),
            response: {
                200: z.object({
                    unreadCount: z.number(),
                }),
            },
            tags: ["notifications"],
            description: "Get unread notification count",
        },
    }, async (request, reply) => {
        const { userId } = request.query;
        const user = await usersRepository.findById(userId);
        if (!user) {
            throw new NotFoundError("User");
        }
        const unreadCount = await notificationsRepository.countUnread(userId);
        return {
            unreadCount,
        };
    });
    server.get("/users/:userId/notifications", {
        schema: {
            params: getUserIdParamsSchema,
            querystring: getNotificationsQuerySchema,
            response: {
                200: listNotificationsResponseSchema,
            },
            tags: ["notifications"],
            description: "List all notifications for a user",
        },
    }, async (request, reply) => {
        const { userId } = request.params;
        const { unreadOnly, limit } = request.query;
        const user = await usersRepository.findById(userId);
        if (!user) {
            throw new NotFoundError("User");
        }
        const notifications = await notificationsRepository.findByUserId(userId, unreadOnly, limit);
        const unreadCount = await notificationsRepository.countUnread(userId);
        return {
            notifications: notifications,
            unreadCount,
        };
    });
    server.patch("/notifications/:id/read", {
        schema: {
            params: getNotificationIdParamsSchema,
            response: {
                200: markReadResponseSchema,
            },
            tags: ["notifications"],
            description: "Mark a notification as read",
        },
    }, async (request, reply) => {
        const { id } = request.params;
        const notification = await notificationsRepository.findById(id);
        if (!notification) {
            throw new NotFoundError("Notification");
        }
        const updated = await notificationsRepository.markAsRead(id);
        if (!updated) {
            throw new NotFoundError("Notification");
        }
        return updated;
    });
    server.patch("/notifications/mark-all-read", {
        schema: {
            querystring: z.object({
                userId: z.string(),
            }),
            response: {
                204: z.void(),
            },
            tags: ["notifications"],
            description: "Mark all notifications as read",
        },
    }, async (request, reply) => {
        const { userId } = request.query;
        const user = await usersRepository.findById(userId);
        if (!user) {
            throw new NotFoundError("User");
        }
        await notificationsRepository.markAllAsRead(userId);
        reply.code(204);
    });
    server.patch("/users/:userId/notifications/mark-all-read", {
        schema: {
            params: getUserIdParamsSchema,
            response: {
                204: z.void(),
            },
            tags: ["notifications"],
            description: "Mark all notifications as read",
        },
    }, async (request, reply) => {
        const { userId } = request.params;
        const user = await usersRepository.findById(userId);
        if (!user) {
            throw new NotFoundError("User");
        }
        await notificationsRepository.markAllAsRead(userId);
        reply.code(204);
    });
}
//# sourceMappingURL=notifications.routes.js.map