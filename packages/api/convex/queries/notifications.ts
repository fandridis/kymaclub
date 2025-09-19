import { paginationOptsValidator } from "convex/server";
import { query } from "../_generated/server";
import { v } from "convex/values";
import { notificationService } from "../../services/notificationService";
import { getAuthenticatedUserOrThrow } from "../utils";

/***************************************************************
 * Get User Notifications (Paginated)
 ***************************************************************/
export const getUserNotificationsArgs = v.object({
    paginationOpts: paginationOptsValidator,
    recipientType: v.optional(v.union(v.literal("business"), v.literal("consumer"))),
    unreadOnly: v.optional(v.boolean()),
});

export const getUserNotifications = query({
    args: getUserNotificationsArgs,
    handler: async (ctx, args) => {
        const user = await getAuthenticatedUserOrThrow(ctx);
        const serviceArgs = {
            paginationOpts: {
                numItems: args.paginationOpts.numItems,
                cursor: args.paginationOpts.cursor || null
            },
            recipientType: args.recipientType,
            unreadOnly: args.unreadOnly,
        };
        return await notificationService.getUserNotifications({ ctx, args: serviceArgs, user });
    }
});

/***************************************************************
 * Get Business Notifications (Paginated)
 ***************************************************************/
export const getBusinessNotificationsArgs = v.object({
    paginationOpts: paginationOptsValidator,
    unreadOnly: v.optional(v.boolean()),
});

export const getBusinessNotifications = query({
    args: getBusinessNotificationsArgs,
    handler: async (ctx, args) => {
        const user = await getAuthenticatedUserOrThrow(ctx);
        const serviceArgs = {
            paginationOpts: {
                numItems: args.paginationOpts.numItems,
                cursor: args.paginationOpts.cursor || null
            },
            unreadOnly: args.unreadOnly,
        };
        return await notificationService.getBusinessNotifications({ ctx, args: serviceArgs, user });
    }
});


