// ============================================
// Notifications API Module
// ============================================
//
// Handles notification retrieval and management

import type { Notification } from "@/lib/models/types";

import {
  seedData,
  getNotifications as getNotificationsFromStore,
  markNotificationRead as markNotificationReadInStore,
  markAllNotificationsRead as markAllNotificationsReadInStore,
} from "@/lib/store/localStore";

import { delay } from "./utils";
import { useBackendFor } from "@/lib/config/features";
import { httpGet, httpPost } from "./http.client";

/**
 * Notifications API methods
 */
export const notificationsAPI = {
  /**
   * Get notifications for a user
   *
   * @param userId - ID of the user
   * @param courseId - Optional course ID to filter notifications
   * @returns Array of notifications sorted by creation date (newest first)
   *
   * @example
   * ```ts
   * // Get all notifications for user
   * const allNotifications = await notificationsAPI.getNotifications("user-123");
   *
   * // Get course-specific notifications
   * const courseNotifications = await notificationsAPI.getNotifications("user-123", "course-cs101");
   * ```
   */
  async getNotifications(
    userId: string,
    courseId?: string
  ): Promise<Notification[]> {
    // Check feature flag for backend
    if (useBackendFor('notifications')) {
      try {
        // Build query params
        const params = new URLSearchParams();
        if (courseId) {
          params.append('courseId', courseId);
        }

        // Call backend endpoint
        const response = await httpGet<{ notifications: Notification[] }>(
          `/api/v1/users/${userId}/notifications${params.toString() ? `?${params.toString()}` : ''}`
        );
        return response.notifications;
      } catch (error) {
        console.error('[Notifications] Backend fetch failed:', error);
        // Fall through to localStorage fallback
      }
    }

    // Fallback: Use localStorage
    await delay(200 + Math.random() * 200); // 200-400ms
    seedData();

    const notifications = getNotificationsFromStore(userId, courseId);
    return notifications.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  /**
   * Mark a notification as read
   *
   * @param notificationId - ID of the notification to mark as read
   *
   * @example
   * ```ts
   * await notificationsAPI.markNotificationRead("notif-123");
   * ```
   */
  async markNotificationRead(notificationId: string): Promise<void> {
    // Check feature flag for backend
    if (useBackendFor('notifications')) {
      try {
        // Call backend endpoint
        await httpPost<void>(
          `/api/v1/notifications/${notificationId}/read`,
          {}
        );
        return;
      } catch (error) {
        console.error('[Notifications] Backend mark read failed:', error);
        // Fall through to localStorage fallback
      }
    }

    // Fallback: Use localStorage
    await delay(50); // Quick action
    seedData();

    markNotificationReadInStore(notificationId);
  },

  /**
   * Mark all notifications as read for a user
   *
   * @param userId - ID of the user
   * @param courseId - Optional course ID to filter which notifications to mark
   *
   * @example
   * ```ts
   * // Mark all notifications as read
   * await notificationsAPI.markAllNotificationsRead("user-123");
   *
   * // Mark only course-specific notifications as read
   * await notificationsAPI.markAllNotificationsRead("user-123", "course-cs101");
   * ```
   */
  async markAllNotificationsRead(
    userId: string,
    courseId?: string
  ): Promise<void> {
    // Check feature flag for backend
    if (useBackendFor('notifications')) {
      try {
        // Call backend endpoint
        await httpPost<void>(
          `/api/v1/users/${userId}/notifications/read-all`,
          {
            courseId: courseId || null,
          }
        );
        return;
      } catch (error) {
        console.error('[Notifications] Backend mark all read failed:', error);
        // Fall through to localStorage fallback
      }
    }

    // Fallback: Use localStorage
    await delay(100);
    seedData();

    markAllNotificationsReadInStore(userId, courseId);
  },
};
