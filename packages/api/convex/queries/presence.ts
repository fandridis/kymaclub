import { query } from "../_generated/server";
import { v } from "convex/values";
import { getAuthenticatedUserOrThrow } from "../utils";
import { presenceService } from "../../services/presenceService";

/**
 * Get current user's presence status
 * Returns active presence data for authenticated user
 */
export const getUserPresence = query({
  args: {},
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUserOrThrow(ctx);
    return presenceService.getUserPresence({ ctx, userId: user._id });
  },
});

/**
 * Get presence for specific user (if allowed)
 * Returns presence data for specified user
 */
export const getPresenceForUser = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Ensure requesting user is authenticated
    await getAuthenticatedUserOrThrow(ctx);
    
    return presenceService.getUserPresence({ ctx, userId: args.userId });
  },
});

/**
 * Get active users in a thread
 * Returns all users currently present in a conversation
 */
export const getThreadPresence = query({
  args: {
    threadId: v.id("chatMessageThreads"),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUserOrThrow(ctx);
    return presenceService.getThreadPresence({ ctx, threadId: args.threadId });
  },
});

/**
 * Check if notification should be delivered
 * Returns delivery decision for smart notifications
 */
export const shouldDeliverNotification = query({
  args: {
    recipientUserId: v.string(),
    threadId: v.optional(v.string()),
    messageTimestamp: v.number(),
  },
  handler: async (ctx, args) => {
    // No authentication required - this is used by internal notification system
    return presenceService.shouldDeliverNotification({
      ctx,
      context: {
        recipientUserId: args.recipientUserId,
        threadId: args.threadId,
        messageTimestamp: args.messageTimestamp,
      },
    });
  },
});