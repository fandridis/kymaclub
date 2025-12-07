import { query } from "../../_generated/server";
import { v } from "convex/values";
import { requireInternalUserOrThrow } from "../../utils";
import { startOfMonth, endOfMonth } from "date-fns";

export const getBusinessDetails = query({
    args: {
        businessId: v.id("businesses"),
    },
    handler: async (ctx, args) => {
        await requireInternalUserOrThrow(ctx);

        const business = await ctx.db.get(args.businessId);
        if (!business) {
            return null;
        }

        // Fetch owner
        const owner = await ctx.db
            .query("users")
            .withIndex("by_business_role", (q) =>
                q.eq("businessId", args.businessId).eq("businessRole", "owner")
            )
            .first();

        // Parallelize fetching related data
        const [venues, classTemplates, classInstances, bookings, earnings] = await Promise.all([
            ctx.db
                .query("venues")
                .withIndex("by_business_deleted", (q) => q.eq("businessId", args.businessId))
                .filter((q) => q.eq(q.field("deleted"), undefined))
                .collect(),
            ctx.db
                .query("classTemplates")
                .withIndex("by_business_deleted", (q) => q.eq("businessId", args.businessId))
                .filter((q) => q.eq(q.field("deleted"), undefined))
                .collect(),
            ctx.db
                .query("classInstances")
                .withIndex("by_business_start_time", (q) => q.eq("businessId", args.businessId))
                .filter((q) => q.eq(q.field("deleted"), undefined))
                .order("desc")
                .take(100), // Limit to last 100 instances
            ctx.db
                .query("bookings")
                .withIndex("by_business_created", (q) => q.eq("businessId", args.businessId))
                .filter((q) => q.eq(q.field("deleted"), undefined))
                .order("desc")
                .take(100), // Limit to last 100 bookings
            ctx.db
                .query("creditTransactions")
                .withIndex("by_business_created", (q) => q.eq("businessId", args.businessId))
                .filter((q) => q.eq(q.field("deleted"), undefined))
                .order("desc")
                .take(100), // Limit to last 100 earnings
        ]);

        // Calculate metrics
        const now = new Date();
        const currentMonthStart = startOfMonth(now).getTime();
        const currentMonthEnd = endOfMonth(now).getTime();

        // Metrics queries
        const [
            totalScheduledClasses,
            completedClassesThisMonth,
            cancelledClassesThisMonth,
            completedBookingsThisMonth,
            earningsThisMonth
        ] = await Promise.all([
            // Total scheduled classes (all time, or maybe just future? sticking to all time for now based on name)
            ctx.db.query("classInstances")
                .withIndex("by_business_status_start_time", (q) => q.eq("businessId", args.businessId).eq("status", "scheduled"))
                .filter((q) =>
                    q.eq(q.field("deleted"), undefined)
                )
                .collect()
                .then(res => res.length),

            // Completed classes this month
            ctx.db.query("classInstances")
                .withIndex("by_business_status_start_time", (q) => q.eq("businessId", args.businessId).eq("status", "completed").gte("startTime", currentMonthStart).lte("startTime", currentMonthEnd))
                .filter((q) =>
                    q.eq(q.field("deleted"), undefined)
                )
                .collect()
                .then(res => res.length),

            // Cancelled classes this month
            ctx.db.query("classInstances")
                .withIndex("by_business_status_start_time", (q) => q.eq("businessId", args.businessId).eq("status", "cancelled").gte("startTime", currentMonthStart).lte("startTime", currentMonthEnd))
                .filter((q) =>
                    q.eq(q.field("deleted"), undefined)
                )
                .collect()
                .then(res => res.length),

            // Completed bookings this month
            ctx.db.query("bookings")
                .withIndex("by_business_created", (q) => q.eq("businessId", args.businessId).gte("createdAt", currentMonthStart).lte("createdAt", currentMonthEnd))
                .filter((q) =>
                    q.eq(q.field("deleted"), undefined) &&
                    q.eq(q.field("status"), "completed")
                )
                .collect()
                .then(res => res.length),

            // Earnings this month (from creditTransactions)
            ctx.db.query("creditTransactions")
                .withIndex("by_business_type_created", (q) => q.eq("businessId", args.businessId))
                .filter((q) =>
                    q.eq(q.field("deleted"), undefined) &&
                    q.gte(q.field("createdAt"), currentMonthStart) &&
                    q.lte(q.field("createdAt"), currentMonthEnd) &&
                    q.gt(q.field("amount"), 0) // Only positive earnings
                )
                .collect()
                .then(res => res.reduce((acc, curr) => acc + curr.amount, 0))
        ]);

        return {
            business,
            owner,
            venues,
            classTemplates,
            classInstances,
            bookings,
            earnings,
            metrics: {
                totalScheduledClasses,
                completedClassesThisMonth,
                cancelledClassesThisMonth,
                completedBookingsThisMonth,
                earningsThisMonth,
            },
        };
    },
});
