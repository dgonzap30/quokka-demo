/**
 * Notifications Repository
 *
 * Data access layer for notifications table
 */

import { eq, and, desc, type SQL } from "drizzle-orm";
import { BaseRepository } from "./base.repository.js";
import {
  notifications,
  type Notification,
  type NewNotification,
} from "../db/schema.js";
import { db } from "../db/client.js";

export class NotificationsRepository extends BaseRepository<
  typeof notifications,
  Notification,
  NewNotification
> {
  constructor() {
    super(notifications);
  }

  /**
   * Implement abstract method: ID equality check
   */
  protected idEquals(id: string): SQL {
    return eq(this.table.id, id);
  }

  /**
   * Implement abstract method: Field equality check
   */
  protected fieldEquals(field: string, value: any): SQL {
    return eq(this.table[field as keyof typeof this.table], value);
  }

  /**
   * Find notifications for a user
   */
  async findByUserId(
    userId: string,
    unreadOnly: boolean = false,
    limit: number = 50
  ): Promise<Notification[]> {
    const conditions = unreadOnly
      ? and(
          eq(notifications.userId, userId),
          eq(notifications.read, false)
        )
      : eq(notifications.userId, userId);

    const results = await db
      .select()
      .from(notifications)
      .where(conditions)
      .orderBy(desc(notifications.createdAt))
      .limit(limit);

    return results;
  }

  /**
   * Count unread notifications for a user
   */
  async countUnread(userId: string): Promise<number> {
    const results = await db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.read, false)
        )
      );

    return results.length;
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(id: string): Promise<Notification | null> {
    const [updated] = await db
      .update(notifications)
      .set({ read: true })
      .where(eq(notifications.id, id))
      .returning();

    return updated || null;
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ read: true })
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.read, false)
        )
      );
  }
}

// Export singleton instance
export const notificationsRepository = new NotificationsRepository();
