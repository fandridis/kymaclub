import { type Infer, v } from "convex/values";
import { businessNotificationSettingsFields, notificationsFields, userNotificationSettingsFields } from "../convex/schema";

const notificationFieldObject = v.object(notificationsFields);

export type Notification = Infer<typeof notificationFieldObject>;
export type NotificationType = Notification['type'];
export type NotificationRecipientType = Notification['recipientType'];
export type NotificationDeliveryStatus = Notification['deliveryStatus'];

// user notification preferences
const UserNotificationSettingsFieldsObject = v.object(userNotificationSettingsFields);
export type UserNotificationSettings = Infer<typeof UserNotificationSettingsFieldsObject>;
export type UserNotificationSettingsNotificationPreferences = UserNotificationSettings['notificationPreferences'];
export type UserNotificationSettingsGlobalOptOut = UserNotificationSettings['globalOptOut'];

// business notification preferences
const BusinessNotificationSettingsFieldsObject = v.object(businessNotificationSettingsFields);
export type BusinessNotificationSettings = Infer<typeof BusinessNotificationSettingsFieldsObject>;
export type BusinessNotificationSettingsNotificationPreferences = BusinessNotificationSettings['notificationPreferences'];

