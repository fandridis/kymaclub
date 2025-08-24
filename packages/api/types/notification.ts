import { type Infer, v } from "convex/values";
import { notificationsFields } from "../convex/schema";

const notificationFieldObject = v.object(notificationsFields);

export type Notification = Infer<typeof notificationFieldObject>;
export type NotificationType = Notification['type'];
export type NotificationRecipientType = Notification['recipientType'];
export type NotificationDeliveryStatus = Notification['deliveryStatus'];