import { query } from "../../_generated/server";
import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { requireInternalUserOrThrow } from "../../utils";
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns";

type BookingStatusFilter = "latest" | "awaiting_approval" | "cancelled_by_consumer" | "cancelled_by_business" | "rejected_by_business" | "no_show";
type BookingStatus = "awaiting_approval" | "pending" | "completed" | "cancelled_by_consumer" | "cancelled_by_business" | "cancelled_by_business_rebookable" | "rejected_by_business" | "no_show";

/**
 * Get all bookings across all businesses (admin/internal only)
 * Returns paginated results sorted by date
 * 
 * Follows Convex pagination pattern: takes paginationOpts and returns result from .paginate()
 */
export const getAllBookings = query({
    args: {
        paginationOpts: paginationOptsValidator,
        status: v.optional(v.union(
            v.literal("latest"),
            v.literal("awaiting_approval"),
            v.literal("cancelled_by_consumer"),
            v.literal("cancelled_by_business"),
            v.literal("rejected_by_business"),
            v.literal("no_show")
        )),
    },
    handler: async (ctx, args) => {
        const user = await requireInternalUserOrThrow(ctx);
        const status: BookingStatusFilter = args.status || "latest";

        // Helper to query bookings with status filter
        const queryBookings = (statusFilter: BookingStatus) => {
            return ctx.db
                .query("bookings")
                .withIndex("by_status_deleted_bookedAt", (q) =>
                    q.eq("status", statusFilter).eq("deleted", undefined)
                )
                .order("desc")
                .paginate(args.paginationOpts);
        };

        if (status === "latest") {
            // Latest across all statuses (single indexed query + Convex pagination)
            return await ctx.db
                .query("bookings")
                .withIndex("by_deleted_bookedAt", (q) =>
                    q.eq("deleted", undefined)
                )
                .order("desc")
                .paginate(args.paginationOpts);
        }

        // For specific status filters, use the index directly
        if (status === "awaiting_approval") {
            return await queryBookings("awaiting_approval");
        }

        if (status === "cancelled_by_consumer") {
            return await queryBookings("cancelled_by_consumer");
        }

        if (status === "cancelled_by_business") {
            return await queryBookings("cancelled_by_business");
        }

        if (status === "rejected_by_business") {
            return await queryBookings("rejected_by_business");
        }

        if (status === "no_show") {
            return await queryBookings("no_show");
        }

        // Fallback
        return await queryBookings("pending");
    },
});

export const getBookingsMetric = query({
    args: {},
    handler: async (ctx) => {
        await requireInternalUserOrThrow(ctx);
        const now = new Date();

        // 1. Time ranges
        const currentMonthStart = startOfMonth(now).getTime();
        const currentMonthEnd = endOfMonth(now).getTime();

        const lastMonthStart = startOfMonth(subMonths(now, 1)).getTime();
        const lastMonthEnd = endOfMonth(subMonths(now, 1)).getTime();

        // 2. Helper to count bookings by status in range
        const countBookingsInRange = async (start: number, end: number, status: BookingStatus) => {
            const falseResults = await ctx.db
                .query("bookings")
                .withIndex("by_status_deleted_bookedAt", (q) =>
                    q.eq("status", status).eq("deleted", false)
                        .gte("bookedAt", start).lte("bookedAt", end)
                )
                .collect();

            const undefinedResults = await ctx.db
                .query("bookings")
                .withIndex("by_status_deleted_bookedAt", (q) =>
                    q.eq("status", status).eq("deleted", undefined)
                        .gte("bookedAt", start).lte("bookedAt", end)
                )
                .collect();

            return [...falseResults, ...undefinedResults].length;
        };

        // 3. Fetch Metrics for current month
        const completedThisMonth = await countBookingsInRange(currentMonthStart, currentMonthEnd, "completed");
        const completedLastMonth = await countBookingsInRange(lastMonthStart, lastMonthEnd, "completed");

        const noShowsThisMonth = await countBookingsInRange(currentMonthStart, currentMonthEnd, "no_show");
        const noShowsLastMonth = await countBookingsInRange(lastMonthStart, lastMonthEnd, "no_show");

        const cancelledByUserThisMonth = await countBookingsInRange(currentMonthStart, currentMonthEnd, "cancelled_by_consumer");
        const cancelledByUserLastMonth = await countBookingsInRange(lastMonthStart, lastMonthEnd, "cancelled_by_consumer");

        const cancelledByBusinessThisMonth = await countBookingsInRange(currentMonthStart, currentMonthEnd, "cancelled_by_business");
        const cancelledByBusinessLastMonth = await countBookingsInRange(lastMonthStart, lastMonthEnd, "cancelled_by_business");

        // Total bookings this month (for no-show percentage calculation)
        const totalBookingsThisMonth = completedThisMonth + noShowsThisMonth + cancelledByUserThisMonth + cancelledByBusinessThisMonth;
        const totalBookingsLastMonth = completedLastMonth + noShowsLastMonth + cancelledByUserLastMonth + cancelledByBusinessLastMonth;

        // Calculate no-show percentage
        const noShowPercentageThisMonth = totalBookingsThisMonth > 0
            ? (noShowsThisMonth / totalBookingsThisMonth) * 100
            : 0;
        const noShowPercentageLastMonth = totalBookingsLastMonth > 0
            ? (noShowsLastMonth / totalBookingsLastMonth) * 100
            : 0;

        // 4. Calculate Trends (Last 12 months)
        const trendData: Array<{
            month: string;
            completed: number;
            cancelled: number;
            noShows: number;
        }> = [];
        for (let i = 11; i >= 0; i--) {
            const date = subMonths(now, i);
            const monthStart = startOfMonth(date).getTime();
            const monthEnd = endOfMonth(date).getTime();
            const monthLabel = format(date, "MMM"); // e.g., "Jan", "Feb"

            const completed = await countBookingsInRange(monthStart, monthEnd, "completed");
            const cancelled = await countBookingsInRange(monthStart, monthEnd, "cancelled_by_consumer") +
                await countBookingsInRange(monthStart, monthEnd, "cancelled_by_business");
            const noShows = await countBookingsInRange(monthStart, monthEnd, "no_show");

            trendData.push({
                month: monthLabel,
                completed,
                cancelled,
                noShows,
            });
        }

        // 5. Calculate Percentage Differences
        const calculateDiff = (current: number, previous: number) => {
            if (previous === 0) return current > 0 ? 100 : 0;
            return Math.round(((current - previous) / previous) * 100);
        };

        const calculatePercentageDiff = (current: number, previous: number) => {
            return Math.round((current - previous) * 100) / 100; // Round to 2 decimal places
        };

        return {
            completedBookings: {
                value: completedThisMonth,
                diff: calculateDiff(completedThisMonth, completedLastMonth),
                label: "Completed Bookings",
            },
            noShowPercentage: {
                value: Math.round(noShowPercentageThisMonth * 100) / 100, // Round to 2 decimal places
                diff: calculatePercentageDiff(noShowPercentageThisMonth, noShowPercentageLastMonth),
                label: "No-Show Percentage",
            },
            trend: trendData,
        };
    },
});

