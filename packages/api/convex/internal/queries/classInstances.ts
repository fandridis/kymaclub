import { query } from "../../_generated/server";
import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { requireInternalUserOrThrow } from "../../utils";
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns";

type SortBy = "latest" | "most_expensive" | "capacity";

/**
 * Get all class instances across all businesses (admin/internal only)
 * Returns paginated results sorted by the specified option
 * 
 * Follows Convex pagination pattern: takes paginationOpts and returns result from .paginate()
 */
export const getAllClassInstances = query({
    args: {
        paginationOpts: paginationOptsValidator,
        sortBy: v.optional(v.union(v.literal("latest"), v.literal("most_expensive"), v.literal("capacity"))),
    },
    handler: async (ctx, args) => {
        const user = await requireInternalUserOrThrow(ctx);
        const sortBy: SortBy = args.sortBy || "latest";

        // Use appropriate index based on sortBy option
        if (sortBy === "latest") {
            return await ctx.db
                .query("classInstances")
                .withIndex("by_deleted_start_time", (q) =>
                    q.eq("deleted", undefined)
                )
                .filter((q) => q.eq(q.field("status"), "scheduled"))
                .order("desc") // Most recent startTime first
                .paginate(args.paginationOpts);
        }

        if (sortBy === "most_expensive") {
            return await ctx.db
                .query("classInstances")
                .withIndex("by_deleted_price", (q) =>
                    q.eq("deleted", undefined)
                )
                .filter((q) => q.eq(q.field("status"), "scheduled"))
                .order("desc") // Most expensive first
                .paginate(args.paginationOpts);
        }

        if (sortBy === "capacity") {
            return await ctx.db
                .query("classInstances")
                .withIndex("by_deleted_capacity", (q) =>
                    q.eq("deleted", undefined)
                )
                .filter((q) => q.eq(q.field("status"), "scheduled"))
                .order("desc") // Highest capacity first
                .paginate(args.paginationOpts);
        }

        // Fallback (should not reach here)
        return await ctx.db
            .query("classInstances")
            .withIndex("by_deleted_start_time", (q) =>
                q.eq("deleted", undefined)
            )
            .filter((q) => q.eq(q.field("status"), "scheduled"))
            .order("desc")
            .paginate(args.paginationOpts);
    },
});

export const getClassInstancesMetric = query({
    args: {},
    handler: async (ctx) => {
        const now = new Date();

        // 1. Time ranges
        const currentMonthStart = startOfMonth(now).getTime();
        const currentMonthEnd = endOfMonth(now).getTime();

        const lastMonthStart = startOfMonth(subMonths(now, 1)).getTime();
        const lastMonthEnd = endOfMonth(subMonths(now, 1)).getTime();

        // 2. Helper to count in range
        const countScheduledInRange = async (start: number, end: number) => {
            return (await ctx.db
                .query("classInstances")
                .withIndex("by_deleted_start_time", (q) =>
                    q.eq("deleted", undefined).gte("startTime", start).lte("startTime", end)
                )
                .filter((q) => q.eq(q.field("status"), "scheduled"))
                .collect()).length;
        };

        // 3. Fetch Metrics

        // Scheduled Classes
        const scheduledClassesCurrentMonth = await countScheduledInRange(currentMonthStart, currentMonthEnd);
        const scheduledClassesLastMonth = await countScheduledInRange(lastMonthStart, lastMonthEnd);

        // Average Class Cost (Last 100 classes)
        const last100Classes = await ctx.db
            .query("classInstances")
            .withIndex("by_deleted_start_time", (q) =>
                q.eq("deleted", undefined)
            )
            .order("desc")
            .take(100);

        let totalCost = 0;
        let classesWithPrice = 0;

        for (const instance of last100Classes) {
            if (instance.price !== undefined && instance.price !== null) {
                totalCost += instance.price;
                classesWithPrice++;
            }
        }

        const averageCost = classesWithPrice > 0 ? totalCost / classesWithPrice : 0;


        // 4. Calculate Trends (Last 12 months)
        const trendData: Array<{
            month: string;
            classes: number;
        }> = [];
        for (let i = 11; i >= 0; i--) {
            const date = subMonths(now, i);
            const monthStart = startOfMonth(date).getTime();
            const monthEnd = endOfMonth(date).getTime();
            const monthLabel = format(date, "MMM"); // e.g., "Jan", "Feb"

            const count = await countScheduledInRange(monthStart, monthEnd);

            trendData.push({
                month: monthLabel,
                classes: count,
            });
        }

        // 5. Calculate Percentage Differences
        const calculateDiff = (current: number, previous: number) => {
            if (previous === 0) return current > 0 ? 100 : 0;
            return Math.round(((current - previous) / previous) * 100);
        };

        return {
            scheduledClasses: {
                value: scheduledClassesCurrentMonth,
                diff: calculateDiff(scheduledClassesCurrentMonth, scheduledClassesLastMonth),
                label: "Scheduled Classes",
            },
            averageClassCost: {
                value: averageCost,
                label: "Average Class Cost",
            },
            trend: trendData,
        };
    },
});

