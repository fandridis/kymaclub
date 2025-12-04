import { mutation } from "../_generated/server";
import { Infer, v } from "convex/values";
import { getAuthenticatedUserOrThrow } from "../utils";
import { presenceService } from "../../services/presenceService";

// Mutation args validation
export const updatePresenceArgs = v.object({
  isActive: v.boolean(),
  activeThreadId: v.optional(v.union(v.id("chatMessageThreads"), v.null())),
  appState: v.union(
    v.literal("active"),
    v.literal("background"), 
    v.literal("inactive")
  ),
  deviceId: v.optional(v.string()),
  deviceType: v.optional(v.union(
    v.literal("mobile"),
    v.literal("web"),
    v.literal("desktop")
  )),
});
export type UpdatePresenceArgs = Infer<typeof updatePresenceArgs>;

export const cleanupStalePresenceArgs = v.object({
  batchSize: v.optional(v.number()),
});
export type CleanupStalePresenceArgs = Infer<typeof cleanupStalePresenceArgs>;

/**
 * Update User Presence Mutation
 * Updates or creates user presence record for smart notification delivery
 */
export const updateUserPresence = mutation({
  args: updatePresenceArgs,
  returns: v.object({
    success: v.boolean(),
    presenceId: v.id("userPresence"),
  }),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUserOrThrow(ctx);
    
    return await presenceService.updateUserPresence({
      ctx,
      userId: user._id,
      payload: {
        isActive: args.isActive,
        activeThreadId: args.activeThreadId,
        appState: args.appState,
        deviceId: args.deviceId,
        deviceType: args.deviceType,
      },
    });
  },
});

/**
 * Clear User Presence Mutation
 * Removes user presence record (used on logout)
 */
export const clearUserPresence = mutation({
  args: {},
  returns: v.object({
    success: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUserOrThrow(ctx);
    
    return await presenceService.clearUserPresence({
      ctx,
      userId: user._id,
    });
  },
});

/**
 * Cleanup Stale Presence Mutation
 * Administrative function to clean up old presence records
 * Should be called periodically via cron job
 */
export const cleanupStalePresence = mutation({
  args: cleanupStalePresenceArgs,
  returns: v.object({
    deletedCount: v.number(),
    remainingCount: v.number(),
  }),
  handler: async (ctx, args) => {
    // No authentication required - this is an internal cleanup function
    return await presenceService.cleanupStalePresence({
      ctx,
      batchSize: args.batchSize,
    });
  },
});