import { Doc } from "../convex/_generated/dataModel";

export type UserSettings = Doc<"userSettings">;
export type UserSettingsNotifications = NonNullable<UserSettings['notifications']>;

export const DEFAULT_USER_NOTIFICATION_PREFERENCES: UserSettingsNotifications['preferences'] = {
    booking_confirmation: { email: true, web: true, push: true },
    booking_reminder: { email: true, web: true, push: true },
    class_cancelled: { email: true, web: true, push: true },
    class_rebookable: { email: true, web: true, push: true },
    booking_cancelled_by_business: { email: true, web: true, push: true },
    payment_receipt: { email: true, web: true, push: true },
    credits_received_subscription: { email: true, web: true, push: true },
    credits_received_admin_gift: { email: true, web: true, push: true },
    welcome_bonus: { email: true, web: true, push: true },
};