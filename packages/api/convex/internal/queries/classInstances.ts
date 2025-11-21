import { query } from "../../_generated/server";
import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { requireInternalUserOrThrow } from "../../utils";
import { startOfMonth, endOfMonth, subYears, subMonths, format } from "date-fns";

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

        const lastYearSameMonthStart = startOfMonth(subYears(now, 1)).getTime();
        const lastYearSameMonthEnd = endOfMonth(subYears(now, 1)).getTime();

        // 2. Helper to count in range
        const countInRange = async (tableName: "classInstances" | "users", start: number, end: number) => {
            return (await ctx.db
                .query(tableName)
                .withIndex("by_creation_time", (q) =>
                    q.gte("_creationTime", start).lte("_creationTime", end)
                )
                .collect()).length;
        };

        // 3. Fetch Metrics

        // Class Instances
        const classInstancesCurrentMonth = await countInRange("classInstances", currentMonthStart, currentMonthEnd);
        const classInstancesLastYear = await countInRange("classInstances", lastYearSameMonthStart, lastYearSameMonthEnd);

        // Users (Sign-ups)
        const usersCurrentMonth = await countInRange("users", currentMonthStart, currentMonthEnd);
        const usersLastYear = await countInRange("users", lastYearSameMonthStart, lastYearSameMonthEnd);

        // 4. Calculate Trends (Last 12 months)
        const trendData = [];
        for (let i = 11; i >= 0; i--) {
            const date = subMonths(now, i);
            const monthStart = startOfMonth(date).getTime();
            const monthEnd = endOfMonth(date).getTime();
            const monthLabel = format(date, "MMM"); // e.g., "Jan", "Feb"

            const count = await countInRange("classInstances", monthStart, monthEnd);

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
            classInstances: {
                value: classInstancesCurrentMonth,
                diff: calculateDiff(classInstancesCurrentMonth, classInstancesLastYear),
                label: "Total Class Instances",
            },
            newSignups: {
                value: usersCurrentMonth,
                diff: calculateDiff(usersCurrentMonth, usersLastYear),
                label: "New Sign-ups",
            },
            trend: trendData,
        };
    },
});

