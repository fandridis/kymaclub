import { query } from "../../_generated/server";
import { v } from "convex/values";
import { requireInternalUserOrThrow } from "../../utils";

/**
 * Get dashboard metrics for internal admin panel
 * Returns key metrics for consumers, bookings, and classes
 */
export const getDashboardMetrics = query({
    args: {},
    returns: v.object({
        consumers: v.object({
            activeCount: v.number(),
            signupsLastMonth: v.number(),
        }),
        bookings: v.object({
            thisMonth: v.number(),
            changeFromLastMonth: v.number(), // Percentage change (can be negative)
        }),
        classes: v.object({
            currentlyScheduled: v.number(),
            completedLastMonth: v.number(),
        }),
    }),
    handler: async (ctx) => {
        await requireInternalUserOrThrow(ctx);

        const now = Date.now();
        const ninetyDaysAgo = now - (90 * 24 * 60 * 60 * 1000);

        // Calculate month boundaries
        const currentDate = new Date(now);
        const currentMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getTime();
        const currentMonthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59, 999).getTime();

        const lastMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1).getTime();
        const lastMonthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0, 23, 59, 59, 999).getTime();

        // 1. Active consumers: Users who have booked a class in the last 90 days
        // Get all bookings in the last 90 days (pending or completed)
        // Use index with queries for each status and deleted state combination
        // Note: deleted can be false or undefined, so we query both
        const pendingRecentFalse = await ctx.db
            .query("bookings")
            .withIndex("by_status_deleted_bookedAt", (q) =>
                q
                    .eq("status", "pending")
                    .eq("deleted", false)
                    .gte("bookedAt", ninetyDaysAgo)
            )
            .collect();

        const pendingRecentUndefined = await ctx.db
            .query("bookings")
            .withIndex("by_status_deleted_bookedAt", (q) =>
                q
                    .eq("status", "pending")
                    .eq("deleted", undefined)
                    .gte("bookedAt", ninetyDaysAgo)
            )
            .collect();

        const completedRecentFalse = await ctx.db
            .query("bookings")
            .withIndex("by_status_deleted_bookedAt", (q) =>
                q
                    .eq("status", "completed")
                    .eq("deleted", false)
                    .gte("bookedAt", ninetyDaysAgo)
            )
            .collect();

        const completedRecentUndefined = await ctx.db
            .query("bookings")
            .withIndex("by_status_deleted_bookedAt", (q) =>
                q
                    .eq("status", "completed")
                    .eq("deleted", undefined)
                    .gte("bookedAt", ninetyDaysAgo)
            )
            .collect();

        const recentBookings = [...pendingRecentFalse, ...pendingRecentUndefined, ...completedRecentFalse, ...completedRecentUndefined];

        // Get unique user IDs from recent bookings
        const activeUserIds = new Set(recentBookings.map(booking => booking.userId));
        const activeCount = activeUserIds.size;

        // 2. Consumers added last month
        const consumersLastMonth = await ctx.db
            .query("users")
            .filter((q) =>
                q.and(
                    q.gte(q.field('_creationTime'), lastMonthStart),
                    q.lte(q.field('_creationTime'), lastMonthEnd),
                    q.neq(q.field("deleted"), true)
                )
            )
            .collect();

        const signupsLastMonth = consumersLastMonth.length;

        // 3. Bookings this month (pending or completed)
        // Use index with queries for each status and deleted state combination
        const pendingThisMonthFalse = await ctx.db
            .query("bookings")
            .withIndex("by_status_deleted_bookedAt", (q) =>
                q
                    .eq("status", "pending")
                    .eq("deleted", false)
                    .gte("bookedAt", currentMonthStart)
                    .lte("bookedAt", currentMonthEnd)
            )
            .collect();

        const pendingThisMonthUndefined = await ctx.db
            .query("bookings")
            .withIndex("by_status_deleted_bookedAt", (q) =>
                q
                    .eq("status", "pending")
                    .eq("deleted", undefined)
                    .gte("bookedAt", currentMonthStart)
                    .lte("bookedAt", currentMonthEnd)
            )
            .collect();

        const completedThisMonthFalse = await ctx.db
            .query("bookings")
            .withIndex("by_status_deleted_bookedAt", (q) =>
                q
                    .eq("status", "completed")
                    .eq("deleted", false)
                    .gte("bookedAt", currentMonthStart)
                    .lte("bookedAt", currentMonthEnd)
            )
            .collect();

        const completedThisMonthUndefined = await ctx.db
            .query("bookings")
            .withIndex("by_status_deleted_bookedAt", (q) =>
                q
                    .eq("status", "completed")
                    .eq("deleted", undefined)
                    .gte("bookedAt", currentMonthStart)
                    .lte("bookedAt", currentMonthEnd)
            )
            .collect();

        const bookingsThisMonth = [...pendingThisMonthFalse, ...pendingThisMonthUndefined, ...completedThisMonthFalse, ...completedThisMonthUndefined];

        const thisMonthCount = bookingsThisMonth.length;

        // 4. Bookings last month (for comparison)
        // Use index with queries for each status and deleted state combination
        const pendingLastMonthFalse = await ctx.db
            .query("bookings")
            .withIndex("by_status_deleted_bookedAt", (q) =>
                q
                    .eq("status", "pending")
                    .eq("deleted", false)
                    .gte("bookedAt", lastMonthStart)
                    .lte("bookedAt", lastMonthEnd)
            )
            .collect();

        const pendingLastMonthUndefined = await ctx.db
            .query("bookings")
            .withIndex("by_status_deleted_bookedAt", (q) =>
                q
                    .eq("status", "pending")
                    .eq("deleted", undefined)
                    .gte("bookedAt", lastMonthStart)
                    .lte("bookedAt", lastMonthEnd)
            )
            .collect();

        const completedLastMonthFalse = await ctx.db
            .query("bookings")
            .withIndex("by_status_deleted_bookedAt", (q) =>
                q
                    .eq("status", "completed")
                    .eq("deleted", false)
                    .gte("bookedAt", lastMonthStart)
                    .lte("bookedAt", lastMonthEnd)
            )
            .collect();

        const completedLastMonthUndefined = await ctx.db
            .query("bookings")
            .withIndex("by_status_deleted_bookedAt", (q) =>
                q
                    .eq("status", "completed")
                    .eq("deleted", undefined)
                    .gte("bookedAt", lastMonthStart)
                    .lte("bookedAt", lastMonthEnd)
            )
            .collect();

        const bookingsLastMonth = [...pendingLastMonthFalse, ...pendingLastMonthUndefined, ...completedLastMonthFalse, ...completedLastMonthUndefined];

        const lastMonthCount = bookingsLastMonth.length;

        // Calculate percentage change
        let changeFromLastMonth = 0;
        if (lastMonthCount > 0) {
            changeFromLastMonth = ((thisMonthCount - lastMonthCount) / lastMonthCount) * 100;
        } else if (thisMonthCount > 0) {
            // If last month had 0 bookings but this month has some, it's 100% increase
            changeFromLastMonth = 100;
        }
        // If both are 0, changeFromLastMonth stays 0

        // 5. Classes metrics
        // Currently scheduled classes: status="scheduled", deleted=undefined, startTime >= now
        // Use index by_status_deleted_start_time for efficient querying
        const scheduledClasses = await ctx.db
            .query("classInstances")
            .withIndex("by_status_deleted_start_time", (q) =>
                q
                    .eq("status", "scheduled")
                    .eq("deleted", undefined)
                    .gte("startTime", now)
            )
            .collect();

        const currentlyScheduled = scheduledClasses.length;

        // Completed classes last month: status="completed", deleted=undefined, endTime within last month
        // Use index by_status_deleted_end_time for efficient querying
        // Use .gte() in index query and .filter() with .lte() for upper bound (following codebase pattern)
        const completedClassesLastMonth = await ctx.db
            .query("classInstances")
            .withIndex("by_status_deleted_end_time", (q) =>
                q
                    .eq("status", "completed")
                    .eq("deleted", undefined)
                    .gte("endTime", lastMonthStart)
            )
            .filter((q) => q.lte(q.field("endTime"), lastMonthEnd))
            .collect();

        const completedLastMonth = completedClassesLastMonth.length;

        return {
            consumers: {
                activeCount,
                signupsLastMonth,
            },
            bookings: {
                thisMonth: thisMonthCount,
                changeFromLastMonth: Math.round(changeFromLastMonth * 100) / 100, // Round to 2 decimal places
            },
            classes: {
                currentlyScheduled,
                completedLastMonth,
            },
        };
    },
});

