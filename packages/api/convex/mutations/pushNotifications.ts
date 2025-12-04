import { PushNotifications } from "@convex-dev/expo-push-notifications";
import { components } from "../_generated/api";
import { internalMutation, mutation } from "../_generated/server";
import { Infer, v } from "convex/values";
import { getAuthenticatedUserOrThrow } from "../utils";

const pushNotifications = new PushNotifications(components.pushNotifications);

export const recordPushNotificationToken = mutation({
    args: { token: v.string() },
    returns: v.null(),
    handler: async (ctx, args) => {
        const user = await getAuthenticatedUserOrThrow(ctx);

        await pushNotifications.recordToken(ctx, {
            userId: user._id,
            pushToken: args.token,
        });
    },
});

export const pausePushNotifications = mutation({
    args: { userId: v.id("users") },
    returns: v.null(),
    handler: async (ctx, args) => {
        await pushNotifications.pauseNotificationsForUser(ctx, { userId: args.userId });
    },
});

export const resumePushNotifications = mutation({
    args: { userId: v.id("users") },
    returns: v.null(),
    handler: async (ctx, args) => {
        await pushNotifications.unpauseNotificationsForUser(ctx, { userId: args.userId });
    },
});

/***************************************************************
 * Send Push Notification
 ***************************************************************/
export const sendPushNotificationArgs = v.object({
    to: v.id("users"),
    notification: v.object({
        data: v.optional(v.any()),
        title: v.string(),
        body: v.optional(v.string()),
        ttl: v.optional(v.number()),
        expiration: v.optional(v.number()),
        priority: v.optional(v.union(v.literal("default"), v.literal("normal"), v.literal("high"))),
        subtitle: v.optional(v.string()),
        sound: v.optional(v.union(v.string(), v.null())),
        badge: v.optional(v.number()),
        interruptionLevel: v.optional(v.union(v.literal("active"), v.literal("critical"), v.literal("passive"), v.literal("time-sensitive"))),
        channelId: v.optional(v.string()),
        categoryId: v.optional(v.string()),
        mutableContent: v.optional(v.boolean()),
    }),
});
export type SendPushNotificationArgs = Infer<typeof sendPushNotificationArgs>;

export const sendPushNotification = internalMutation({
    args: sendPushNotificationArgs,
    returns: v.optional(v.string()),
    handler: async (ctx, args) => {
        const pushId = await pushNotifications.sendPushNotification(ctx, {
            userId: args.to,
            notification: args.notification,
        });

        return pushId;
    },
});