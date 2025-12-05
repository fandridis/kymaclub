import { internalQuery } from "../../_generated/server";
import { v } from "convex/values";
import { scheduledNotificationService } from "../../../services/scheduledNotificationService";

/***************************************************************
 * Get Pending Scheduled Notifications by User
 * For admin/testing purposes - returns pending notifications for a user
 ***************************************************************/
export const getPendingByUser = internalQuery({
    args: {
        userId: v.id("users"),
    },
    returns: v.object({
        notifications: v.array(v.object({
            _id: v.id("scheduledNotifications"),
            type: v.union(
                v.literal("class_reminder_1h"),
                v.literal("class_reminder_3h"),
                v.literal("class_reminder_30m")
            ),
            scheduledFor: v.number(),
        })),
    }),
    handler: async (ctx, args) => {
        return scheduledNotificationService.getPendingByUserId(ctx, args);
    },
});

/***************************************************************
 * Get All Scheduled Notifications (Admin)
 * For debugging and monitoring
 ***************************************************************/
export const getAll = internalQuery({
    args: {
        status: v.optional(v.union(
            v.literal("pending"),
            v.literal("sent"),
            v.literal("cancelled"),
            v.literal("failed")
        )),
        limit: v.optional(v.number()),
    },
    returns: v.array(v.object({
        _id: v.id("scheduledNotifications"),
        type: v.union(
            v.literal("class_reminder_1h"),
            v.literal("class_reminder_3h"),
            v.literal("class_reminder_30m")
        ),
        status: v.union(
            v.literal("pending"),
            v.literal("sent"),
            v.literal("cancelled"),
            v.literal("failed")
        ),
        scheduledFor: v.number(),
        recipientUserId: v.id("users"),
        createdAt: v.number(),
        sentAt: v.optional(v.number()),
        errorMessage: v.optional(v.string()),
    })),
    handler: async (ctx, args) => {
        const { status, limit = 100 } = args;

        let notifications;
        if (status) {
            notifications = await ctx.db
                .query("scheduledNotifications")
                .withIndex("by_status", q => q.eq("status", status))
                .take(limit);
        } else {
            notifications = await ctx.db
                .query("scheduledNotifications")
                .take(limit);
        }

        return notifications.map(n => ({
            _id: n._id,
            type: n.type,
            status: n.status,
            scheduledFor: n.scheduledFor,
            recipientUserId: n.recipientUserId,
            createdAt: n.createdAt,
            sentAt: n.sentAt,
            errorMessage: n.errorMessage,
        }));
    },
});
