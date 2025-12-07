import type { MutationCtx, QueryCtx } from "../convex/_generated/server";
import type { Id } from "../convex/_generated/dataModel";
import { internal } from "../convex/_generated/api";
import type { ScheduledNotificationType, ScheduledNotificationStatus } from "../types/scheduledNotification";

/**
 * Scheduled Notification Service
 * 
 * Generic service for scheduling and managing push notifications.
 * Supports polymorphic entity references for different notification types.
 * 
 * Currently supports:
 * - class_reminder_1h: 1 hour before class start
 * - class_reminder_3h: 3 hours before class start (future)
 * - class_reminder_30m: 30 minutes before class start (future)
 */

// Time constants
const ONE_HOUR_MS = 60 * 60 * 1000;
const THREE_HOURS_MS = 3 * 60 * 60 * 1000;
const THIRTY_MINUTES_MS = 30 * 60 * 1000;

// Map reminder types to their time offsets (before class start)
const REMINDER_TIME_OFFSETS: Record<ScheduledNotificationType, number> = {
    class_reminder_1h: ONE_HOUR_MS,
    class_reminder_3h: THREE_HOURS_MS,
    class_reminder_30m: THIRTY_MINUTES_MS,
};

export const scheduledNotificationService = {
    /**
     * Schedule a class reminder notification
     * Creates a scheduled notification record and schedules the job to run at the specified time
     */
    scheduleClassReminder: async (
        ctx: MutationCtx,
        args: {
            bookingId: Id<"bookings">;
            userId: Id<"users">;
            classStartTime: number;
            reminderType: ScheduledNotificationType;
        }
    ): Promise<{ scheduledNotificationId: Id<"scheduledNotifications"> } | null> => {
        const { bookingId, userId, classStartTime, reminderType } = args;
        const now = Date.now();

        // Calculate when to send the notification
        const timeOffset = REMINDER_TIME_OFFSETS[reminderType];
        const scheduledFor = classStartTime - timeOffset;

        // Don't schedule if the time has already passed
        if (scheduledFor <= now) {
            return null;
        }

        // Check for duplicate - don't create if same booking + type already exists and is pending
        const existing = await ctx.db
            .query("scheduledNotifications")
            .withIndex("by_entity", q =>
                q.eq("relatedEntity.entityType", "bookings")
                    .eq("relatedEntity.entityId", bookingId)
            )
            .filter(q => q.and(
                q.eq(q.field("type"), reminderType),
                q.eq(q.field("status"), "pending")
            ))
            .first();

        if (existing) {
            // Already scheduled, return existing
            return { scheduledNotificationId: existing._id };
        }

        // Schedule the job to run at the specified time
        const scheduledJobId = await ctx.scheduler.runAt(
            scheduledFor,
            internal.mutations.scheduledNotifications.executeScheduledNotification,
            { scheduledNotificationId: "" as Id<"scheduledNotifications"> } // Placeholder, will be updated
        );

        // Create the scheduled notification record
        const scheduledNotificationId = await ctx.db.insert("scheduledNotifications", {
            type: reminderType,
            scheduledJobId,
            scheduledFor,
            status: "pending",
            relatedEntity: {
                entityType: "bookings",
                entityId: bookingId,
            },
            recipientUserId: userId,
            createdAt: now,
        });

        // Now we need to cancel the placeholder job and create a new one with the correct ID
        await ctx.scheduler.cancel(scheduledJobId);

        const actualJobId = await ctx.scheduler.runAt(
            scheduledFor,
            internal.mutations.scheduledNotifications.executeScheduledNotification,
            { scheduledNotificationId }
        );

        // Update the record with the actual job ID
        await ctx.db.patch(scheduledNotificationId, {
            scheduledJobId: actualJobId,
        });

        return { scheduledNotificationId };
    },

    /**
     * Cancel all pending notifications for a specific booking
     */
    cancelByBookingId: async (
        ctx: MutationCtx,
        args: { bookingId: Id<"bookings"> }
    ): Promise<{ cancelledCount: number }> => {
        const { bookingId } = args;
        const now = Date.now();

        // Find all pending notifications for this booking
        const pendingNotifications = await ctx.db
            .query("scheduledNotifications")
            .withIndex("by_entity", q =>
                q.eq("relatedEntity.entityType", "bookings")
                    .eq("relatedEntity.entityId", bookingId)
            )
            .filter(q => q.eq(q.field("status"), "pending"))
            .collect();

        let cancelledCount = 0;

        for (const notification of pendingNotifications) {
            // Cancel the scheduled job
            await ctx.scheduler.cancel(notification.scheduledJobId);

            // Update the notification status
            await ctx.db.patch(notification._id, {
                status: "cancelled",
            });

            cancelledCount++;
        }

        return { cancelledCount };
    },

    /**
     * Cancel all pending notifications for a specific class instance
     * Used when a class is cancelled to stop all reminders for all bookings
     */
    cancelByClassInstanceId: async (
        ctx: MutationCtx,
        args: { classInstanceId: Id<"classInstances"> }
    ): Promise<{ cancelledCount: number }> => {
        const { classInstanceId } = args;

        // First, get all bookings for this class instance
        const bookings = await ctx.db
            .query("bookings")
            .withIndex("by_class_instance_status", q => q.eq("classInstanceId", classInstanceId))
            .filter(q => q.neq(q.field("deleted"), true))
            .collect();

        let totalCancelledCount = 0;

        // Cancel notifications for each booking
        for (const booking of bookings) {
            const { cancelledCount } = await scheduledNotificationService.cancelByBookingId(ctx, {
                bookingId: booking._id,
            });
            totalCancelledCount += cancelledCount;
        }

        return { cancelledCount: totalCancelledCount };
    },

    /**
     * Mark a notification as sent
     */
    markAsSent: async (
        ctx: MutationCtx,
        args: { notificationId: Id<"scheduledNotifications"> }
    ): Promise<void> => {
        const now = Date.now();
        await ctx.db.patch(args.notificationId, {
            status: "sent",
            sentAt: now,
        });
    },

    /**
     * Mark a notification as failed
     */
    markAsFailed: async (
        ctx: MutationCtx,
        args: {
            notificationId: Id<"scheduledNotifications">;
            errorMessage: string;
        }
    ): Promise<void> => {
        await ctx.db.patch(args.notificationId, {
            status: "failed",
            errorMessage: args.errorMessage,
        });
    },

    /**
     * Get pending notifications for a user (for debugging/admin)
     */
    getPendingByUserId: async (
        ctx: QueryCtx,
        args: { userId: Id<"users"> }
    ): Promise<{ notifications: Array<{ _id: Id<"scheduledNotifications">; type: ScheduledNotificationType; scheduledFor: number }> }> => {
        const notifications = await ctx.db
            .query("scheduledNotifications")
            .withIndex("by_recipient", q => q.eq("recipientUserId", args.userId))
            .filter(q => q.eq(q.field("status"), "pending"))
            .collect();

        return {
            notifications: notifications.map(n => ({
                _id: n._id,
                type: n.type,
                scheduledFor: n.scheduledFor,
            })),
        };
    },
};
