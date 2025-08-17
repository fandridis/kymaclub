import { mutation } from "../_generated/server";
import { Infer, v } from "convex/values";
import { getAuthenticatedUserOrThrow } from "../utils";
import { notificationService } from "../../services/notificationService";
import { notificationsFields, userNotificationSettingsFields, businessNotificationSettingsFields } from "../schema";
import { omit } from "convex-helpers";
import { mutationWithTriggers } from "../triggers";

/***************************************************************
 * Create Notification
 ***************************************************************/
export const createNotificationArgs = v.object({
    notification: v.object({
        ...omit(notificationsFields, [
            'createdAt', 'createdBy', 'updatedAt', 'updatedBy', 
            'seen', 'seenAt', 'deliveryStatus', 'failureReason', 'retryCount',
            'sentToEmail', 'sentToWeb', 'sentToPush', 'deleted', 'deletedAt', 'deletedBy'
        ])
    })
});
export type CreateNotificationArgs = Infer<typeof createNotificationArgs>;

export const createNotification = mutationWithTriggers({
    args: createNotificationArgs,
    handler: async (ctx, args) => {
        const user = await getAuthenticatedUserOrThrow(ctx);
        return notificationService.createNotification({ ctx, args: args.notification, user });
    }
});

/***************************************************************
 * Mark Notification as Seen
 ***************************************************************/
export const markNotificationSeenArgs = v.object({
    notificationId: v.id("notifications")
});
export type MarkNotificationSeenArgs = Infer<typeof markNotificationSeenArgs>;

export const markNotificationSeen = mutationWithTriggers({
    args: markNotificationSeenArgs,
    handler: async (ctx, args) => {
        const user = await getAuthenticatedUserOrThrow(ctx);
        return notificationService.markNotificationSeen({ ctx, args, user });
    }
});

/***************************************************************
 * Update Notification Delivery Status
 ***************************************************************/
export const updateNotificationDeliveryStatusArgs = v.object({
    notificationId: v.id("notifications"),
    deliveryStatus: v.union(v.literal("pending"), v.literal("sent"), v.literal("failed")),
    failureReason: v.optional(v.string()),
    sentToEmail: v.optional(v.boolean()),
    sentToWeb: v.optional(v.boolean()),
    sentToPush: v.optional(v.boolean()),
});
export type UpdateNotificationDeliveryStatusArgs = Infer<typeof updateNotificationDeliveryStatusArgs>;

export const updateNotificationDeliveryStatus = mutationWithTriggers({
    args: updateNotificationDeliveryStatusArgs,
    handler: async (ctx, args) => {
        const user = await getAuthenticatedUserOrThrow(ctx);
        return notificationService.updateNotificationDeliveryStatus({ ctx, args, user });
    }
});

/***************************************************************
 * Upsert User Notification Settings
 ***************************************************************/
export const upsertUserNotificationSettingsArgs = v.object({
    settings: v.object({
        ...omit(userNotificationSettingsFields, [
            'userId', 'createdAt', 'createdBy', 'updatedAt', 'updatedBy',
            'deleted', 'deletedAt', 'deletedBy'
        ])
    })
});
export type UpsertUserNotificationSettingsArgs = Infer<typeof upsertUserNotificationSettingsArgs>;

export const upsertUserNotificationSettings = mutationWithTriggers({
    args: upsertUserNotificationSettingsArgs,
    handler: async (ctx, args) => {
        const user = await getAuthenticatedUserOrThrow(ctx);
        return notificationService.upsertUserNotificationSettings({ ctx, args: args.settings, user });
    }
});

/***************************************************************
 * Upsert Business Notification Settings
 ***************************************************************/
export const upsertBusinessNotificationSettingsArgs = v.object({
    settings: v.object({
        ...omit(businessNotificationSettingsFields, [
            'businessId', 'createdAt', 'createdBy', 'updatedAt', 'updatedBy',
            'deleted', 'deletedAt', 'deletedBy'
        ])
    })
});
export type UpsertBusinessNotificationSettingsArgs = Infer<typeof upsertBusinessNotificationSettingsArgs>;

export const upsertBusinessNotificationSettings = mutationWithTriggers({
    args: upsertBusinessNotificationSettingsArgs,
    handler: async (ctx, args) => {
        const user = await getAuthenticatedUserOrThrow(ctx);
        return notificationService.upsertBusinessNotificationSettings({ ctx, args: args.settings, user });
    }
});