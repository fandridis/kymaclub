import { query } from "../../_generated/server";
import { v } from "convex/values";
import { requireInternalUserOrThrow } from "../../utils";
import { startOfMonth, endOfMonth } from "date-fns";

export const getConsumerDetails = query({
    args: {
        userId: v.id("users"),
    },
    handler: async (ctx, args) => {
        await requireInternalUserOrThrow(ctx);

        const user = await ctx.db.get(args.userId);
        if (!user) {
            return null;
        }

        // Parallelize fetching bookings and transactions
        const [bookings, transactions] = await Promise.all([
            ctx.db
                .query("bookings")
                .withIndex("by_user", (q) => q.eq("userId", args.userId))
                .order("desc")
                .take(100), // Limit to last 100 bookings for performance
            ctx.db
                .query("creditTransactions")
                .withIndex("by_user", (q) => q.eq("userId", args.userId))
                .filter((q) => q.eq(q.field("deleted"), undefined))
                .order("desc")
                .take(100), // Limit to last 100 transactions
        ]);

        // Calculate metrics
        const now = new Date();
        const currentMonthStart = startOfMonth(now).getTime();
        const currentMonthEnd = endOfMonth(now).getTime();

        const bookingsThisMonthQuery = ctx.db
            .query("bookings")
            .withIndex("by_user_start_time", (q) =>
                q.eq("userId", args.userId)
                    .gte("classInstanceSnapshot.startTime", currentMonthStart)
                    .lte("classInstanceSnapshot.startTime", currentMonthEnd)
            )
            .filter((q) => q.eq(q.field("deleted"), undefined))
            .collect()
            .then(res => res.length);

        const [
            countBookingsThisMonth,
            countCancelledByConsumer,
            countCancelledByBusiness,
            countNoShows
        ] = await Promise.all([
            bookingsThisMonthQuery,
            ctx.db.query("bookings")
                .withIndex("by_user_status_deleted", (q) =>
                    q.eq("userId", args.userId)
                        .eq("status", "cancelled_by_consumer")
                        .eq("deleted", undefined)
                )
                .collect()
                .then(r => r.length),
            ctx.db.query("bookings")
                .withIndex("by_user_status_deleted", (q) =>
                    q.eq("userId", args.userId)
                        .eq("status", "cancelled_by_business")
                        .eq("deleted", undefined)
                )
                .collect()
                .then(r => r.length),
            ctx.db.query("bookings")
                .withIndex("by_user_status_deleted", (q) =>
                    q.eq("userId", args.userId)
                        .eq("status", "no_show")
                        .eq("deleted", undefined)
                )
                .collect()
                .then(r => r.length),
        ]);

        return {
            user,
            bookings,
            transactions,
            metrics: {
                bookingsThisMonth: countBookingsThisMonth,
                cancelledBookings: countCancelledByConsumer + countCancelledByBusiness,
                noShows: countNoShows,
            },
        };
    },
});
