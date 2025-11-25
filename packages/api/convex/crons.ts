import { cronJobs } from "convex/server";
import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

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
        const recentNoShows = [];

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


export default crons;
