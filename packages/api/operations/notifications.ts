import type { UserNotificationSettingsNotificationPreferences } from "../types/notification";

export const getDefaultUserNotificationSettings = () => {
    return {
        booking_confirmation: { email: false, web: false, push: false },
        booking_reminder: { email: false, web: false, push: false },
        class_cancelled: { email: false, web: false, push: false },
        booking_cancelled_by_business: { email: false, web: false, push: false },
        payment_receipt: { email: false, web: false, push: false },
        class_rebookable: { email: false, web: false, push: false },
        credits_received_subscription: { email: true, web: true, push: true },
    } satisfies UserNotificationSettingsNotificationPreferences;
}