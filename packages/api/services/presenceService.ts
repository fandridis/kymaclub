import type { Doc, Id } from "../convex/_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../convex/_generated/server";
import type {
    UserPresence,
    PresenceUpdatePayload,
    NotificationDeliveryContext,
    NotificationDeliveryDecision,
    ActiveUserPresence
} from "../types/presence";
import { presenceOperations } from "../operations/presence";
import { ERROR_CODES } from "../utils/errorCodes";
import { ConvexError } from "convex/values";
import { logger } from "../utils/logger";

/***************************************************************
 * Presence Service - All user presence tracking operations
 * 
 * Handles real-time user presence for smart notification delivery.
 * Integrates with operations layer for business logic and provides
 * database operations for presence management.
 ***************************************************************/
export const presenceService = {
    /***************************************************************
     * Update User Presence Handler
     * Creates or updates user presence record with current activity state
     ***************************************************************/
    updateUserPresence: async ({
        ctx,
        userId,
        payload,
    }: {
        ctx: MutationCtx;
        userId: Id<"users">;
        payload: PresenceUpdatePayload;
    }): Promise<{ success: boolean; presenceId: Id<"userPresence"> }> => {
        try {
            // Prepare validated presence data using operations layer
            const presenceData = presenceOperations.preparePresenceUpdate(userId, payload);

            // Check if user already has a presence record
            const existingPresence = await ctx.db
                .query("userPresence")
                .withIndex("by_user", q => q.eq("userId", userId))
                .first();

            let presenceId: Id<"userPresence">;

            if (existingPresence) {
                // Update existing presence record
                await ctx.db.patch(existingPresence._id, {
                    ...presenceData,
                    updatedAt: Date.now(),
                    updatedBy: userId,
                });
                presenceId = existingPresence._id;

                logger.debug("Updated user presence", {
                    userId,
                    presenceId: existingPresence._id,
                    isActive: payload.isActive,
                    activeThreadId: payload.activeThreadId
                });
            } else {
                // Create new presence record
                presenceId = await ctx.db.insert("userPresence", {
                    ...presenceData,
                    createdAt: Date.now(),
                    createdBy: userId,
                });

                logger.debug("Created new user presence", {
                    userId,
                    presenceId,
                    isActive: payload.isActive,
                    activeThreadId: payload.activeThreadId
                });
            }

            return { success: true, presenceId };

        } catch (error) {
            logger.error("Failed to update user presence", {
                userId,
                payload,
                error: error instanceof Error ? error.message : String(error)
            });

            throw new ConvexError({
                message: "Failed to update user presence",
                code: ERROR_CODES.UNKNOWN_ERROR,
            });
        }
    },

    /***************************************************************
     * Get User Presence Handler
     * Retrieves current presence state for a specific user
     ***************************************************************/
    getUserPresence: async ({
        ctx,
        userId,
    }: {
        ctx: QueryCtx;
        userId: Id<"users">;
    }): Promise<ActiveUserPresence | null> => {
        try {
            const presence = await ctx.db
                .query("userPresence")
                .withIndex("by_user", q => q.eq("userId", userId))
                .first();

            if (!presence) {
                return null;
            }

            // Convert to ActiveUserPresence format
            return {
                userId: presence.userId,
                isActive: presence.isActive,
                activeThreadId: presence.activeThreadId || null,
                lastSeen: presence.lastSeen,
                appState: presence.appState,
            };

        } catch (error) {
            logger.error("Failed to get user presence", {
                userId,
                error: error instanceof Error ? error.message : String(error)
            });

            return null; // Fail gracefully for presence queries
        }
    },

    /***************************************************************
     * Get Thread Presence Handler
     * Gets all users currently active in a specific conversation thread
     ***************************************************************/
    getThreadPresence: async ({
        ctx,
        threadId,
    }: {
        ctx: QueryCtx;
        threadId: Id<"chatMessageThreads">;
    }): Promise<ActiveUserPresence[]> => {
        try {
            const presences = await ctx.db
                .query("userPresence")
                .withIndex("by_thread_active", q =>
                    q.eq("activeThreadId", threadId).eq("isActive", true)
                )
                .collect();

            // Filter for recent activity (last 60 seconds)
            const recentThreshold = Date.now() - 60000;
            const activePresences = presences
                .filter(p => p.lastSeen > recentThreshold)
                .map(p => ({
                    userId: p.userId,
                    isActive: p.isActive,
                    activeThreadId: p.activeThreadId || null,
                    lastSeen: p.lastSeen,
                    appState: p.appState,
                }));

            return activePresences;

        } catch (error) {
            logger.error("Failed to get thread presence", {
                threadId,
                error: error instanceof Error ? error.message : String(error)
            });

            return []; // Fail gracefully
        }
    },

    /***************************************************************
     * Should Deliver Notification Handler
     * Determines if notification should be sent based on user presence
     ***************************************************************/
    shouldDeliverNotification: async ({
        ctx,
        context,
    }: {
        ctx: QueryCtx;
        context: NotificationDeliveryContext;
    }): Promise<NotificationDeliveryDecision> => {
        try {
            // Validate context using operations layer
            const validatedContext = presenceOperations.validateNotificationContext(context);

            // Get user's current presence
            const userPresence = await presenceService.getUserPresence({
                ctx,
                userId: validatedContext.recipientUserId as Id<"users">,
            });

            // Use operations layer for smart delivery decision
            return presenceOperations.shouldDeliverNotification(userPresence, validatedContext);

        } catch (error) {
            logger.error("Failed to determine notification delivery", {
                context,
                error: error instanceof Error ? error.message : String(error)
            });

            // Fail-safe: always deliver notifications when there's an error
            return {
                shouldSend: true,
                reason: "Error determining presence - fail-safe delivery",
            };
        }
    },

    /***************************************************************
     * Cleanup Stale Presence Handler
     * Removes old presence records to prevent database bloat
     ***************************************************************/
    cleanupStalePresence: async ({
        ctx,
        batchSize = 50,
    }: {
        ctx: MutationCtx;
        batchSize?: number;
    }): Promise<{ deletedCount: number; remainingCount: number }> => {
        try {
            const cleanupThreshold = presenceOperations.calculatePresenceCleanupThreshold();

            // Find stale presence records
            const stalePresences = await ctx.db
                .query("userPresence")
                .withIndex("by_last_seen", q => q.lte("lastSeen", cleanupThreshold))
                .take(batchSize);

            // Delete stale records
            for (const presence of stalePresences) {
                await ctx.db.delete(presence._id);
            }

            // Count remaining stale records
            const remainingStale = await ctx.db
                .query("userPresence")
                .withIndex("by_last_seen", q => q.lte("lastSeen", cleanupThreshold))
                .take(1);

            const deletedCount = stalePresences.length;
            const remainingCount = remainingStale.length > 0 ? 1 : 0; // Approximate

            if (deletedCount > 0) {
                logger.info("Cleaned up stale presence records", {
                    deletedCount,
                    cleanupThreshold,
                    batchSize
                });
            }

            return { deletedCount, remainingCount };

        } catch (error) {
            logger.error("Failed to cleanup stale presence", {
                error: error instanceof Error ? error.message : String(error)
            });

            return { deletedCount: 0, remainingCount: 0 };
        }
    },

    /***************************************************************
     * Clear User Presence Handler
     * Removes presence record when user logs out or disconnects
     ***************************************************************/
    clearUserPresence: async ({
        ctx,
        userId,
    }: {
        ctx: MutationCtx;
        userId: Id<"users">;
    }): Promise<{ success: boolean }> => {
        try {
            const presence = await ctx.db
                .query("userPresence")
                .withIndex("by_user", q => q.eq("userId", userId))
                .first();

            if (presence) {
                await ctx.db.delete(presence._id);
                logger.debug("Cleared user presence", { userId, presenceId: presence._id });
            }

            return { success: true };

        } catch (error) {
            logger.error("Failed to clear user presence", {
                userId,
                error: error instanceof Error ? error.message : String(error)
            });

            throw new ConvexError({
                message: "Failed to clear user presence",
                code: ERROR_CODES.UNKNOWN_ERROR,
            });
        }
    },
};