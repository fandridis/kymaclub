import { internalMutation } from "../_generated/server";
import { v } from "convex/values";
import { PushNotifications } from "@convex-dev/expo-push-notifications";
import { components } from "../_generated/api";
import { scheduledNotificationService } from "../../services/scheduledNotificationService";
import { coreService } from "../../services/coreService";
import { getPushNotificationText } from "../../utils/translations";
import { DEFAULT_USER_NOTIFICATION_PREFERENCES } from "../../types/userSettings";
import { createNotificationWithDeepLink } from "../../utils/deep-linking";
import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";

const pushNotifications = new PushNotifications(components.pushNotifications);

/**
 * Safe wrapper for sending push notifications.
 * Silently ignores "component not registered" errors that occur in test environments.
 */
async function safeSendPushNotification(
    ctx: MutationCtx,
    args: { userId: Id<"users">; notification: any }
): Promise<void> {
    try {
        await pushNotifications.sendPushNotification(ctx, args);
    } catch (error: any) {
        // Silently ignore "component not registered" errors (test environment)
        if (error?.message?.includes("not registered")) {
            return;
        }
        // Re-throw other errors
        throw error;
    }
}

/***************************************************************
 * Schedule Class Reminder
 * Called from booking trigger to schedule a reminder notification
 ***************************************************************/
export const scheduleClassReminder = internalMutation({
    args: {
        bookingId: v.id("bookings"),
        userId: v.id("users"),
        classStartTime: v.number(),
        reminderType: v.union(
            v.literal("class_reminder_1h"),
            v.literal("class_reminder_3h"),
            v.literal("class_reminder_30m")
        ),
    },
    returns: v.union(
        v.object({ scheduledNotificationId: v.id("scheduledNotifications") }),
        v.null()
    ),
    handler: async (ctx, args) => {
        return scheduledNotificationService.scheduleClassReminder(ctx, args);
    },
});

/***************************************************************
 * Execute Scheduled Notification
 * Called by the scheduler when it's time to send the notification
 ***************************************************************/
export const executeScheduledNotification = internalMutation({
    args: {
        scheduledNotificationId: v.id("scheduledNotifications"),
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        const { scheduledNotificationId } = args;

        // 1. Fetch the scheduled notification record
        const scheduledNotification = await ctx.db.get(scheduledNotificationId);
        if (!scheduledNotification) {
            console.log(`[ScheduledNotification] Notification ${scheduledNotificationId} not found`);
            return null;
        }

        // 2. Validate status is still "pending"
        if (scheduledNotification.status !== "pending") {
            console.log(`[ScheduledNotification] Notification ${scheduledNotificationId} status is ${scheduledNotification.status}, skipping`);
            return null;
        }

        // 3. Get the booking and validate it's still active
        if (scheduledNotification.relatedEntity.entityType !== "bookings") {
            console.log(`[ScheduledNotification] Unsupported entity type: ${scheduledNotification.relatedEntity.entityType}`);
            await scheduledNotificationService.markAsFailed(ctx, {
                notificationId: scheduledNotificationId,
                errorMessage: `Unsupported entity type: ${scheduledNotification.relatedEntity.entityType}`,
            });
            return null;
        }

        const booking = await ctx.db.get(scheduledNotification.relatedEntity.entityId);
        if (!booking) {
            console.log(`[ScheduledNotification] Booking ${scheduledNotification.relatedEntity.entityId} not found`);
            await scheduledNotificationService.markAsFailed(ctx, {
                notificationId: scheduledNotificationId,
                errorMessage: "Booking not found",
            });
            return null;
        }

        // Only send reminder for active bookings (pending status)
        if (booking.status !== "pending") {
            console.log(`[ScheduledNotification] Booking ${booking._id} status is ${booking.status}, skipping reminder`);
            await scheduledNotificationService.markAsFailed(ctx, {
                notificationId: scheduledNotificationId,
                errorMessage: `Booking status is ${booking.status}`,
            });
            return null;
        }

        // 4. Fetch user and check notification preferences
        const user = await ctx.db.get(scheduledNotification.recipientUserId);
        if (!user) {
            console.log(`[ScheduledNotification] User ${scheduledNotification.recipientUserId} not found`);
            await scheduledNotificationService.markAsFailed(ctx, {
                notificationId: scheduledNotificationId,
                errorMessage: "User not found",
            });
            return null;
        }

        // Get user notification settings
        const userSettings = await coreService.getUserSettings({
            ctx,
            userId: user._id,
        });

        // Check if user has opted out of booking reminders
        const notificationPreferences = userSettings?.notifications?.preferences ?? DEFAULT_USER_NOTIFICATION_PREFERENCES;
        const bookingReminderPref = notificationPreferences.booking_reminder ?? { push: true };

        if (!bookingReminderPref.push) {
            console.log(`[ScheduledNotification] User ${user._id} has opted out of push booking reminders`);
            await scheduledNotificationService.markAsFailed(ctx, {
                notificationId: scheduledNotificationId,
                errorMessage: "User opted out of push notifications",
            });
            return null;
        }

        // 5. Get localized push notification text
        const userLanguage = userSettings?.language;
        const className = booking.classInstanceSnapshot?.name ?? "Your class";

        // Map scheduled notification type to translation key
        const translationKey = scheduledNotification.type; // class_reminder_1h, etc.
        const { title, body } = getPushNotificationText(
            userLanguage,
            translationKey as any, // The translation keys match the scheduled notification types
            { className }
        );

        // 6. Create notification with deep link
        const notificationContent = createNotificationWithDeepLink(
            'booking_reminder', // Use existing notification type for deep linking
            title,
            body,
            {
                classInstanceId: booking.classInstanceId,
                bookingId: booking._id,
                additionalData: {
                    scheduledNotificationType: scheduledNotification.type,
                    className,
                    venueName: booking.venueSnapshot?.name,
                    classTime: booking.classInstanceSnapshot?.startTime,
                },
            }
        );

        // 7. Send push notification
        try {
            await safeSendPushNotification(ctx, {
                userId: user._id,
                notification: notificationContent,
            });

            // 8. Mark as sent
            await scheduledNotificationService.markAsSent(ctx, {
                notificationId: scheduledNotificationId,
            });

            console.log(`[ScheduledNotification] Successfully sent ${scheduledNotification.type} to user ${user._id}`);
        } catch (error: any) {
            console.error(`[ScheduledNotification] Failed to send notification:`, error);
            await scheduledNotificationService.markAsFailed(ctx, {
                notificationId: scheduledNotificationId,
                errorMessage: error?.message ?? "Unknown error",
            });
        }

        return null;
    },
});

/***************************************************************
 * Handle Cancel Scheduled Notifications
 * Called from triggers when booking/class is cancelled
 ***************************************************************/
export const handleCancelScheduledNotifications = internalMutation({
    args: {
        entityType: v.union(v.literal("bookings"), v.literal("classInstances")),
        entityId: v.string(),
    },
    returns: v.object({ cancelledCount: v.number() }),
    handler: async (ctx, args) => {
        const { entityType, entityId } = args;

        if (entityType === "bookings") {
            return scheduledNotificationService.cancelByBookingId(ctx, {
                bookingId: entityId as Id<"bookings">,
            });
        } else if (entityType === "classInstances") {
            return scheduledNotificationService.cancelByClassInstanceId(ctx, {
                classInstanceId: entityId as Id<"classInstances">,
            });
        }

        return { cancelledCount: 0 };
    },
});
