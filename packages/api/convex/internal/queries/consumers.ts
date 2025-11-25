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

        // Fetch user information for gift transactions (createdBy field)
        const giftTransactions = transactions.filter(t => t.type === "gift" && t.createdBy);
        const giftGiverIds = [...new Set(giftTransactions.map(t => t.createdBy).filter((id): id is NonNullable<typeof id> => Boolean(id)))];
        const giftGivers = await Promise.all(
            giftGiverIds.map(userId => ctx.db.get(userId))
        );
        const giftGiversMap = new Map(
            giftGivers.filter((user): user is NonNullable<typeof user> => user !== null).map(user => [user._id, user])
        );

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

        // Enrich transactions with gift giver info
        const enrichedTransactions = transactions.map(transaction => {
            if (transaction.type === "gift" && transaction.createdBy) {
                const giftGiver = giftGiversMap.get(transaction.createdBy);
                return {
                    ...transaction,
                    giftGiver: giftGiver ? {
                        _id: giftGiver._id,
                        name: giftGiver.name ?? undefined,
                        email: giftGiver.email ?? undefined,
                    } : undefined,
                };
            }
            return transaction;
        });

        return {
            user,
            bookings,
            transactions: enrichedTransactions,
            metrics: {
                bookingsThisMonth: countBookingsThisMonth,
                cancelledBookings: countCancelledByConsumer + countCancelledByBusiness,
                noShows: countNoShows,
            },
        };
    },
});
