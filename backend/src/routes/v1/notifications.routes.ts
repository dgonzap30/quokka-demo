/**
 * Notifications Routes
 *
 * Notification endpoints (list, mark read, mark all read)
 */

import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "../../plugins/validation.plugin.js";
import { z } from "zod";
import {
  getUserIdParamsSchema,
  getNotificationIdParamsSchema,
  getNotificationsQuerySchema,
  listNotificationsResponseSchema,
  markReadResponseSchema,
} from "../../schemas/notifications.schema.js";
import { notificationsRepository } from "../../repositories/notifications.repository.js";
import { usersRepository } from "../../repositories/users.repository.js";
import { NotFoundError } from "../../utils/errors.js";

export async function notificationsRoutes(fastify: FastifyInstance) {
  const server = fastify.withTypeProvider<ZodTypeProvider>();

  /**
   * GET /api/v1/notifications?userId=<id>
   * List all notifications for a user (query param version)
   */
  server.get(
    "/notifications",
    {
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
    },
    async (request, reply) => {
      const { userId, unreadOnly, limit } = request.query;

      // Verify user exists
      const user = await usersRepository.findById(userId);
      if (!user) {
        throw new NotFoundError("User");
      }

      const notifications = await notificationsRepository.findByUserId(
        userId,
        unreadOnly,
        limit
      );

      const unreadCount = await notificationsRepository.countUnread(userId);

      return {
        notifications: notifications as any,
        unreadCount,
      };
    }
  );

  /**
   * GET /api/v1/notifications/unread-count?userId=<id>
   * Get unread notification count for a user
   */
  server.get(
    "/notifications/unread-count",
    {
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
    },
    async (request, reply) => {
      const { userId } = request.query;

      // Verify user exists
      const user = await usersRepository.findById(userId);
      if (!user) {
        throw new NotFoundError("User");
      }

      const unreadCount = await notificationsRepository.countUnread(userId);

      return {
        unreadCount,
      };
    }
  );

  /**
   * GET /api/v1/users/:userId/notifications
   * List all notifications for a user (legacy path param version)
   */
  server.get(
    "/users/:userId/notifications",
    {
      schema: {
        params: getUserIdParamsSchema,
        querystring: getNotificationsQuerySchema,
        response: {
          200: listNotificationsResponseSchema,
        },
        tags: ["notifications"],
        description: "List all notifications for a user",
      },
    },
    async (request, reply) => {
      const { userId } = request.params;
      const { unreadOnly, limit } = request.query;

      // Verify user exists
      const user = await usersRepository.findById(userId);
      if (!user) {
        throw new NotFoundError("User");
      }

      const notifications = await notificationsRepository.findByUserId(
        userId,
        unreadOnly,
        limit
      );

      const unreadCount = await notificationsRepository.countUnread(userId);

      return {
        notifications: notifications as any,
        unreadCount,
      };
    }
  );

  /**
   * PATCH /api/v1/notifications/:id/read
   * Mark a notification as read
   */
  server.patch(
    "/notifications/:id/read",
    {
      schema: {
        params: getNotificationIdParamsSchema,
        response: {
          200: markReadResponseSchema,
        },
        tags: ["notifications"],
        description: "Mark a notification as read",
      },
    },
    async (request, reply) => {
      const { id } = request.params;

      // Verify notification exists
      const notification = await notificationsRepository.findById(id);
      if (!notification) {
        throw new NotFoundError("Notification");
      }

      const updated = await notificationsRepository.markAsRead(id);
      if (!updated) {
        throw new NotFoundError("Notification");
      }

      return updated as any;
    }
  );

  /**
   * PATCH /api/v1/notifications/mark-all-read
   * Mark all notifications as read for a user (query param version)
   */
  server.patch(
    "/notifications/mark-all-read",
    {
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
    },
    async (request, reply) => {
      const { userId } = request.query;

      // Verify user exists
      const user = await usersRepository.findById(userId);
      if (!user) {
        throw new NotFoundError("User");
      }

      await notificationsRepository.markAllAsRead(userId);

      reply.code(204);
    }
  );

  /**
   * PATCH /api/v1/users/:userId/notifications/mark-all-read
   * Mark all notifications as read for a user (legacy path param version)
   */
  server.patch(
    "/users/:userId/notifications/mark-all-read",
    {
      schema: {
        params: getUserIdParamsSchema,
        response: {
          204: z.void(),
        },
        tags: ["notifications"],
        description: "Mark all notifications as read",
      },
    },
    async (request, reply) => {
      const { userId } = request.params;

      // Verify user exists
      const user = await usersRepository.findById(userId);
      if (!user) {
        throw new NotFoundError("User");
      }

      await notificationsRepository.markAllAsRead(userId);

      reply.code(204);
    }
  );
}
