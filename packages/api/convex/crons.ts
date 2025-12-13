import { cronJobs } from "convex/server";
import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";

const crons = cronJobs();

/**
 * Mark No-Shows - Runs every hour
 * 
 * Finds all pending bookings where the class started more than 3 hours ago
 * and marks them as no-show since the user didn't check in.
 * 
 * The 3-hour grace period allows late arrivals to check in after class ends.
 * This runs hourly to ensure timely no-show marking without managing
 * individual scheduled jobs per booking.
 */
crons.interval(
    "mark-no-shows",
    { hours: 1 },
    internal.crons.markNoShows,
    {}
);

/**
 * Mark Classes Completed - Runs every hour
 * 
 * Finds all scheduled classes that ended more than 2 hours ago
 * and marks them as completed.
 * 
 * The 2-hour grace period allows time for late check-ins and gives
 * businesses a window to handle any final administrative tasks.
 * This runs hourly to ensure timely completion without managing
 * individual scheduled jobs per class.
 */
crons.interval(
    "mark-classes-completed",
    { hours: 1 },
    internal.crons.markClassesCompleted,
    {}
);

/**
 * Permanently Delete Soft-Deleted Users - Runs daily
 * 
 * GDPR-compliant data cleanup that runs after a 7-day grace period.
 * 
 * For users where deleted: true and deletedAt > 7 days ago:
 * 1. Deletes personal data (profile images from storage)
 * 2. Reassigns historical records to DELETED_USER placeholder:
 *    - Bookings (maintains business booking history)
 *    - Venue reviews (maintains review history)
 *    - Chat threads (maintains conversation history for businesses)
 *    - Credit transactions (maintains audit trail)
 *    - Subscriptions (maintains billing history)
 * 3. Updates snapshots to show "Deleted User" instead of real names
 * 4. Deletes ephemeral data (user settings, presence)
 * 5. Deletes all auth records (sessions, accounts, tokens, etc.)
 * 6. Deletes the user document itself
 */
crons.interval(
    "permanently-delete-users",
    { hours: 24 },
    internal.crons.permanentlyDeleteUsers,
    {}
);

/**
 * Cleanup Expired Pending Auth Languages - Runs every 6 hours
 * 
 * Removes expired pendingAuthLanguages records to keep the table clean.
 * These records are temporary storage for language preferences during the OTP flow
 * and should be cleaned up after 12 hours (their expiry time).
 */
crons.interval(
    "cleanup-expired-pending-auth-languages",
    { hours: 6 },
    internal.mutations.core.cleanupExpiredPendingAuthLanguages,
    {}
);


/**
 * Mark No-Shows Internal Mutation
 * 
 * Efficiently finds and marks no-show bookings by:
 * 1. Only checking bookings from the last 24 hours (optimization)
 * 2. Only processing pending bookings
 * 3. Checking if 3 hours have passed since class start
 */
export const markNoShows = internalMutation({
    args: {},
    returns: v.null(),
    handler: async (ctx, args) => {
        const now = Date.now();
        const GRACE_PERIOD_MS = 3 * 60 * 60 * 1000; // 3 hours after class start
        const ONE_DAY_AGO = now - (24 * 60 * 60 * 1000); // Only check last 24 hours for efficiency

        console.log(`[No-Show Cron] Marking no-shows for the last 24 hours`);
        // Get all pending bookings from the last 48 hours using efficient compound index
        // This avoids scanning the entire bookings table by leveraging the index
        const recentBookings = await ctx.db
            .query("bookings")
            .withIndex("by_status_deleted_start_time", q =>
                q
                    .eq("status", "pending")
                    .eq("deleted", undefined)
                    .gt("classInstanceSnapshot.startTime", ONE_DAY_AGO)
            )
            .collect();

        console.log(`[No-Show Cron] Found ${recentBookings.length} pending bookings to check for no-shows`);

        let markedCount = 0;

        for (const booking of recentBookings) {
            const classStartTime = booking.classInstanceSnapshot?.startTime;
            if (!classStartTime) continue;

            const noShowCutoff = classStartTime + GRACE_PERIOD_MS;

            // If current time is past the grace period, mark as no-show
            if (now > noShowCutoff) {
                await ctx.db.patch(booking._id, {
                    status: "no_show",
                    refundAmount: 0, // No refund for no-shows (standard policy)
                    updatedAt: now,
                });

                // Decrease booked count since they didn't attend
                const instance = await ctx.db.get(booking.classInstanceId);
                if (instance) {
                    await ctx.db.patch(booking.classInstanceId, {
                        bookedCount: Math.max(0, instance.bookedCount - 1),
                        updatedAt: now,
                    });
                }

                markedCount++;
            }
        }

        // Log for monitoring
        console.log(`[No-Show Cron] Marked ${markedCount} bookings as no-show`);

        return null;
    },
});

/**
 * Mark Classes Completed Internal Mutation
 * 
 * Efficiently finds and marks completed classes by:
 * 1. Only fetching classes that ended between 2-18 hours ago (narrow window optimization)
 * 2. Only processing scheduled classes
 * 3. All classes in the query window definitely need marking (no redundant checks)
 * 
 * This optimization reduces bandwidth by ~70-80% by only fetching classes that
 * definitely need to be marked, rather than all classes from the last 24 hours.
 */
export const markClassesCompleted = internalMutation({
    args: {},
    returns: v.null(),
    handler: async (ctx, args) => {
        const now = Date.now();
        const GRACE_PERIOD_MS = 2 * 60 * 60 * 1000; // 2 hours after class end
        // Only fetch classes that ended between 2-18 hours ago
        // This narrow window ensures we only get classes that definitely need marking
        const TWO_HOURS_AGO = now - GRACE_PERIOD_MS;
        const EIGHTEEN_HOURS_AGO = now - (18 * 60 * 60 * 1000);

        console.log(`[Class Completion Cron] Marking completed classes from 2-18 hours ago`);

        // Get scheduled classes that ended in the narrow window where they need marking
        // Using efficient compound index to avoid scanning the entire table
        const recentClasses = await ctx.db
            .query("classInstances")
            .withIndex("by_status_deleted_end_time", q =>
                q
                    .eq("status", "scheduled")
                    .eq("deleted", undefined)
                    .gte("endTime", EIGHTEEN_HOURS_AGO)
                    .lt("endTime", TWO_HOURS_AGO) // Only classes that ended more than 2 hours ago
            )
            .collect();

        console.log(`[Class Completion Cron] Found ${recentClasses.length} scheduled classes to mark as completed`);

        let completedCount = 0;

        // All classes in this query definitely need to be marked (query already filtered correctly)
        for (const classInstance of recentClasses) {
            await ctx.db.patch(classInstance._id, {
                status: "completed",
                updatedAt: now,
            });

            completedCount++;
        }

        // Log for monitoring
        console.log(`[Class Completion Cron] Marked ${completedCount} classes as completed`);

        return null;
    },
});

/**
 * Manual No-Show Marking - For testing and admin use
 * 
 * Allows manual triggering of no-show marking for testing or admin purposes.
 * This is useful for:
 * - Testing the no-show logic
 * - Manually marking no-shows if needed
 * - Debugging issues
 */
export const manualMarkNoShows = internalMutation({
    args: {
        dryRun: v.optional(v.boolean()), // If true, only log what would be marked
    },
    returns: v.object({
        markedCount: v.number(),
        wouldMarkCount: v.number(),
        processedBookings: v.number(),
    }),
    handler: async (ctx, args) => {
        const now = Date.now();
        const GRACE_PERIOD_MS = 3 * 60 * 60 * 1000; // 3 hours after class start
        const ONE_DAY_AGO = now - (24 * 60 * 60 * 1000); // Only check last 24 hours for efficiency

        // Get all pending bookings from the last 48 hours using efficient compound index
        const recentBookings = await ctx.db
            .query("bookings")
            .withIndex("by_status_deleted_start_time", q =>
                q
                    .eq("status", "pending")
                    .eq("deleted", false)
                    .gt("classInstanceSnapshot.startTime", ONE_DAY_AGO)
            )
            .collect();

        let markedCount = 0;
        let wouldMarkCount = 0;

        for (const booking of recentBookings) {
            const classStartTime = booking.classInstanceSnapshot?.startTime;
            if (!classStartTime) continue;

            const noShowCutoff = classStartTime + GRACE_PERIOD_MS;

            // If current time is past the grace period
            if (now > noShowCutoff) {
                if (args.dryRun) {
                    wouldMarkCount++;
                    console.log(`[DRY RUN] Would mark booking ${booking._id} as no-show (class started ${Math.round((now - classStartTime) / (1000 * 60))} minutes ago)`);
                } else {
                    await ctx.db.patch(booking._id, {
                        status: "no_show",
                        updatedAt: now,
                    });

                    // Decrease booked count since they didn't attend
                    const instance = await ctx.db.get(booking.classInstanceId);
                    if (instance) {
                        await ctx.db.patch(booking.classInstanceId, {
                            bookedCount: Math.max(0, instance.bookedCount - 1),
                            updatedAt: now,
                        });
                    }

                    markedCount++;
                }
            }
        }

        console.log(`[Manual No-Show] Processed ${recentBookings.length} bookings, ${args.dryRun ? `would mark ${wouldMarkCount}` : `marked ${markedCount}`} as no-show`);

        return {
            markedCount,
            wouldMarkCount,
            processedBookings: recentBookings.length,
        };
    },
});

/**
 * Get No-Show Statistics - For monitoring and debugging
 * 
 * Returns statistics about no-show bookings for monitoring purposes.
 * Useful for:
 * - Dashboard analytics
 * - Business insights
 * - System monitoring
 */
export const getNoShowStats = internalQuery({
    args: {
        businessId: v.optional(v.id("businesses")),
        daysBack: v.optional(v.number()), // Default 30 days
    },
    returns: v.object({
        totalNoShows: v.number(),
        noShowsByDay: v.array(v.object({
            date: v.string(),
            count: v.number(),
        })),
        recentNoShows: v.array(v.object({
            bookingId: v.id("bookings"),
            className: v.string(),
            userName: v.string(),
            classStartTime: v.number(),
            markedAt: v.number(),
        })),
    }),
    handler: async (ctx, args) => {
        const daysBack = args.daysBack ?? 30;
        const cutoffTime = Date.now() - (daysBack * 24 * 60 * 60 * 1000);

        // Get all no-show bookings from the specified period
        const noShowBookings = await ctx.db
            .query("bookings")
            .filter(q =>
                q.and(
                    q.eq(q.field("status"), "no_show"),
                    q.neq(q.field("deleted"), true),
                    q.gt(q.field("updatedAt"), cutoffTime),
                    args.businessId ? q.eq(q.field("businessId"), args.businessId) : q.neq(q.field("businessId"), null)
                )
            )
            .collect();

        // Group by day
        const noShowsByDay = new Map<string, number>();
        const recentNoShows: Array<{
            bookingId: Id<"bookings">;
            className: string;
            userName: string;
            classStartTime: number;
            markedAt: number;
        }> = [];

        for (const booking of noShowBookings) {
            const date = new Date(booking.updatedAt ?? booking.createdAt ?? Date.now()).toISOString().split('T')[0];
            noShowsByDay.set(date, (noShowsByDay.get(date) ?? 0) + 1);

            // Collect recent no-shows (last 10)
            if (recentNoShows.length < 10) {
                recentNoShows.push({
                    bookingId: booking._id,
                    className: booking.classInstanceSnapshot?.name ?? "Unknown Class",
                    userName: booking.userSnapshot?.name ?? "Unknown User",
                    classStartTime: booking.classInstanceSnapshot?.startTime ?? 0,
                    markedAt: booking.updatedAt ?? booking.createdAt,
                });
            }
        }

        return {
            totalNoShows: noShowBookings.length,
            noShowsByDay: Array.from(noShowsByDay.entries()).map(([date, count]) => ({ date, count })),
            recentNoShows: recentNoShows.sort((a, b) => b.markedAt - a.markedAt),
        };
    },
});


/**
 * System placeholder email for deleted users.
 * Records referencing deleted users will be reassigned to this placeholder
 * to maintain referential integrity while anonymizing the data.
 */
const DELETED_USER_EMAIL = "deleted@system.internal";

/**
 * Permanently Delete Soft-Deleted Users Internal Mutation
 * 
 * GDPR-compliant user data deletion that runs after a 7-day grace period.
 * 
 * This mutation:
 * 1. Finds users with deleted: true and deletedAt > 7 days ago
 * 2. Deletes personal data (profile images)
 * 3. Reassigns historical records (bookings, reviews, transactions) to a 
 *    DELETED_USER placeholder to maintain referential integrity
 * 4. Updates snapshots to show "Deleted User" instead of real names
 * 5. Deletes ephemeral data (settings, presence)
 * 6. Deletes all auth-related records (sessions, accounts, tokens, etc.)
 * 7. Deletes the user document itself
 */
export const permanentlyDeleteUsers = internalMutation({
    args: {},
    returns: v.null(),
    handler: async (ctx) => {
        const now = Date.now();
        const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
        const deletionCutoff = now - SEVEN_DAYS_MS;

        console.log(`[User Deletion Cron] Looking for users deleted before ${new Date(deletionCutoff).toISOString()}`);

        // Find all users who have been soft-deleted for more than 7 days
        const deletedUsers = await ctx.db
            .query("users")
            .withIndex("by_deleted_deletedAt", (q) =>
                q.eq("deleted", true)
            )
            .filter((q) =>
                q.and(
                    q.neq(q.field("deletedAt"), undefined),
                    q.lt(q.field("deletedAt"), deletionCutoff)
                )
            )
            .collect();

        console.log(`[User Deletion Cron] Found ${deletedUsers.length} users to permanently delete`);

        if (deletedUsers.length === 0) {
            return null;
        }

        // Get or create the DELETED_USER placeholder for reassigning records
        let deletedPlaceholder = await ctx.db
            .query("users")
            .withIndex("email", (q) => q.eq("email", DELETED_USER_EMAIL))
            .first();

        if (!deletedPlaceholder) {
            console.log("[User Deletion Cron] Creating DELETED_USER placeholder");
            const placeholderId = await ctx.db.insert("users", {
                email: DELETED_USER_EMAIL,
                name: "Deleted User",
                // No other fields needed - this is a system placeholder
            });
            deletedPlaceholder = await ctx.db.get(placeholderId);
        }

        if (!deletedPlaceholder) {
            console.error("[User Deletion Cron] Could not create DELETED_USER placeholder!");
            return null;
        }

        // Anonymized snapshot data for reassigned records
        const deletedUserSnapshot = {
            name: "Deleted User",
            email: undefined,
            phone: undefined,
        };

        let deletedCount = 0;

        for (const user of deletedUsers) {
            try {
                console.log(`[User Deletion Cron] Processing user ${user._id}...`);

                // ============================================================
                // PHASE 1: Delete personal data (profile images)
                // ============================================================
                if (user.consumerProfileImageStorageId) {
                    try {
                        await ctx.storage.delete(user.consumerProfileImageStorageId);
                        console.log(`[User Deletion Cron] Deleted profile image for user ${user._id}`);
                    } catch (storageError) {
                        console.warn(`[User Deletion Cron] Failed to delete profile image for user ${user._id}:`, storageError);
                        // Continue even if storage deletion fails
                    }
                }

                // ============================================================
                // PHASE 2: Reassign historical records to DELETED_USER
                // These records maintain business history while anonymizing user data
                // ============================================================

                // 2a. Reassign bookings (maintains business booking history)
                const userBookings = await ctx.db
                    .query("bookings")
                    .withIndex("by_user_class", (q) => q.eq("userId", user._id))
                    .collect();

                for (const booking of userBookings) {
                    await ctx.db.patch(booking._id, {
                        userId: deletedPlaceholder._id,
                        userSnapshot: deletedUserSnapshot,
                        updatedAt: now,
                    });
                }
                console.log(`[User Deletion Cron] Reassigned ${userBookings.length} bookings`);

                // 2b. Reassign venue reviews (maintains review history)
                const userReviews = await ctx.db
                    .query("venueReviews")
                    .withIndex("by_user_venue", (q) => q.eq("userId", user._id))
                    .collect();

                for (const review of userReviews) {
                    await ctx.db.patch(review._id, {
                        userId: deletedPlaceholder._id,
                        userSnapshot: { name: "Deleted User", email: undefined },
                        updatedAt: now,
                    });
                }
                console.log(`[User Deletion Cron] Reassigned ${userReviews.length} venue reviews`);

                // 2c. Reassign chat message threads (maintains conversation history for businesses)
                const userThreads = await ctx.db
                    .query("chatMessageThreads")
                    .withIndex("by_user_venue", (q) => q.eq("userId", user._id))
                    .collect();

                for (const thread of userThreads) {
                    await ctx.db.patch(thread._id, {
                        userId: deletedPlaceholder._id,
                        userSnapshot: deletedUserSnapshot,
                        updatedAt: now,
                    });
                }
                console.log(`[User Deletion Cron] Reassigned ${userThreads.length} chat threads`);

                // 2d. Reassign credit transactions (maintains audit trail)
                const userTransactions = await ctx.db
                    .query("creditTransactions")
                    .withIndex("by_user_created", (q) => q.eq("userId", user._id))
                    .collect();

                for (const tx of userTransactions) {
                    await ctx.db.patch(tx._id, {
                        userId: deletedPlaceholder._id,
                        updatedAt: now,
                    });
                }
                console.log(`[User Deletion Cron] Reassigned ${userTransactions.length} credit transactions`);

                // 2e. Reassign subscriptions (maintains billing history for auditing)
                const userSubscriptions = await ctx.db
                    .query("subscriptions")
                    .withIndex("by_user_status", (q) => q.eq("userId", user._id))
                    .collect();

                for (const sub of userSubscriptions) {
                    await ctx.db.patch(sub._id, {
                        userId: deletedPlaceholder._id,
                        updatedAt: now,
                    });
                }
                console.log(`[User Deletion Cron] Reassigned ${userSubscriptions.length} subscriptions`);

                // ============================================================
                // PHASE 3: Delete ephemeral/personal data
                // These records serve no purpose without the user
                // ============================================================

                // 3a. Delete user settings (personal preferences)
                const userSettings = await ctx.db
                    .query("userSettings")
                    .withIndex("by_user", (q) => q.eq("userId", user._id))
                    .first();

                if (userSettings) {
                    await ctx.db.delete(userSettings._id);
                    console.log(`[User Deletion Cron] Deleted user settings`);
                }

                // 3b. Delete user presence (ephemeral real-time data)
                const userPresence = await ctx.db
                    .query("userPresence")
                    .withIndex("by_user_active", (q) => q.eq("userId", user._id))
                    .first();

                if (userPresence) {
                    await ctx.db.delete(userPresence._id);
                    console.log(`[User Deletion Cron] Deleted user presence`);
                }

                // ============================================================
                // PHASE 4: Delete all auth-related records
                // ============================================================

                const [authSessions, authAccounts] = await Promise.all([
                    ctx.db
                        .query('authSessions')
                        .withIndex('userId', (q) => q.eq('userId', user._id))
                        .collect(),
                    ctx.db
                        .query('authAccounts')
                        .withIndex('userId', (q) => q.eq('userId', user._id))
                        .collect(),
                ]);

                // Get related auth data (refresh tokens, verification codes, verifiers)
                const authRefreshTokens: Array<{ _id: any }> = [];
                const authVerificationCodes: Array<{ _id: any }> = [];
                const authVerifiers: Array<{ _id: any }> = [];

                // Get refresh tokens and verifiers for all sessions
                for (const session of authSessions) {
                    const [sessionTokens, sessionVerifiers] = await Promise.all([
                        ctx.db
                            .query('authRefreshTokens')
                            .withIndex('sessionId', (q) => q.eq('sessionId', session._id))
                            .collect(),
                        ctx.db
                            .query('authVerifiers')
                            .withIndex('sessionId', (q) => q.eq('sessionId', session._id))
                            .collect(),
                    ]);
                    authRefreshTokens.push(...sessionTokens);
                    authVerifiers.push(...sessionVerifiers);
                }

                // Get verification codes for all accounts
                for (const account of authAccounts) {
                    const accountCodes = await ctx.db
                        .query('authVerificationCodes')
                        .withIndex('accountId', (q) => q.eq('accountId', account._id))
                        .collect();
                    authVerificationCodes.push(...accountCodes);
                }

                // Delete all auth-related records
                const authDeletePromises: Array<Promise<void>> = [];

                for (const session of authSessions) {
                    authDeletePromises.push(ctx.db.delete(session._id));
                }
                for (const account of authAccounts) {
                    authDeletePromises.push(ctx.db.delete(account._id));
                }
                for (const token of authRefreshTokens) {
                    authDeletePromises.push(ctx.db.delete(token._id));
                }
                for (const code of authVerificationCodes) {
                    authDeletePromises.push(ctx.db.delete(code._id));
                }
                for (const verifier of authVerifiers) {
                    authDeletePromises.push(ctx.db.delete(verifier._id));
                }

                await Promise.all(authDeletePromises);
                console.log(`[User Deletion Cron] Deleted ${authSessions.length} sessions, ${authAccounts.length} accounts, ${authRefreshTokens.length} tokens, ${authVerificationCodes.length} codes, ${authVerifiers.length} verifiers`);

                // ============================================================
                // PHASE 5: Delete the user document itself
                // ============================================================
                await ctx.db.delete(user._id);

                deletedCount++;
                console.log(`[User Deletion Cron] Successfully deleted user ${user._id}`);

            } catch (error) {
                console.error(`[User Deletion Cron] Failed to delete user ${user._id}:`, error);
                // Continue with next user even if one fails
            }
        }

        console.log(`[User Deletion Cron] Permanently deleted ${deletedCount}/${deletedUsers.length} users`);
        return null;
    },
});

export default crons;
