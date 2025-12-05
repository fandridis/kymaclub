import { Doc } from "../convex/_generated/dataModel";

export type ScheduledNotification = Doc<"scheduledNotifications">;
export type ScheduledNotificationType = ScheduledNotification['type'];
export type ScheduledNotificationStatus = ScheduledNotification['status'];
export type ScheduledNotificationEntityType = ScheduledNotification['relatedEntity']['entityType'];
