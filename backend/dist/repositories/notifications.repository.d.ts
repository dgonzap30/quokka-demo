import { type SQL } from "drizzle-orm";
import { BaseRepository } from "./base.repository.js";
import { notifications, type Notification, type NewNotification } from "../db/schema.js";
export declare class NotificationsRepository extends BaseRepository<typeof notifications, Notification, NewNotification> {
    constructor();
    protected idEquals(id: string): SQL;
    protected fieldEquals<K extends keyof typeof this.table>(field: K, value: any): SQL;
    findByUserId(userId: string, unreadOnly?: boolean, limit?: number): Promise<Notification[]>;
    countUnread(userId: string): Promise<number>;
    markAsRead(id: string): Promise<Notification | null>;
    markAllAsRead(userId: string): Promise<void>;
}
export declare const notificationsRepository: NotificationsRepository;
//# sourceMappingURL=notifications.repository.d.ts.map