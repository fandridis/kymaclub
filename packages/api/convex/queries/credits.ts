import { v } from "convex/values";
import { query, internalQuery } from "../_generated/server";
import { creditService } from "../../services/creditService";

/**
 * Get current credit balance for a user
 */
export const getUserBalance = query({
  args: v.object({
    userId: v.id("users"),
  }),
  handler: async (ctx, args) => {
    const balance = await creditService.getBalance(ctx, args.userId);

    return {
      userId: args.userId,
      balance,
      balanceFormatted: `${balance} credits`,
    };
  },
});

/**
 * Get transaction history for a user
 */
export const getUserTransactions = query({
  args: v.object({
    userId: v.id("users"),
    limit: v.optional(v.number()),
    type: v.optional(v.union(
      v.literal("purchase"),
      v.literal("gift"),
      v.literal("spend"),
      v.literal("refund")
    )),
  }),
  handler: async (ctx, args) => {
    return await creditService.getTransactionHistory(ctx, args);
  },
});

/**
 * Get business earnings from credit transactions
 */
export const getBusinessEarnings = query({
  args: v.object({
    businessId: v.id("businesses"),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  }),
  handler: async (ctx, args) => {
    return await creditService.getBusinessEarnings(ctx, args);
  },
});

/**
 * Get credit analytics (purchases vs gifts)
 */
export const getCreditAnalytics = query({
  args: v.object({
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  }),
  handler: async (ctx, args) => {
    return await creditService.getCreditAnalytics(ctx, args);
  },
});

/**
 * Get credit transaction by Stripe payment intent ID (internal)
 */
export const getCreditTransactionByStripeId = internalQuery({
  args: v.object({
    stripePaymentIntentId: v.string(),
  }),
  handler: async (ctx, { stripePaymentIntentId }) => {
    return await ctx.db
      .query("creditTransactions")
      .withIndex("by_stripe_payment_intent", (q) =>
        q.eq("stripePaymentIntentId", stripePaymentIntentId)
      )
      .first();
  },
});

/***************************************************************
 * 🆕 OPTIMIZED QUERIES WITH COMPOUND INDEXES
 * Eliminate expensive filter operations
 ***************************************************************/

/**
 * Get user transactions with date range - OPTIMIZED
 * Uses compound index instead of filter operations
 */
export const getUserTransactionsOptimized = query({
  args: v.object({
    userId: v.id("users"),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    type: v.optional(v.union(
      v.literal("purchase"),
      v.literal("gift"),
      v.literal("spend"),
      v.literal("refund")
    )),
    limit: v.optional(v.number()),
  }),
  handler: async (ctx, args) => {
    let query;

    if (args.type && args.startDate) {
      // 🔥 OPTIMIZED: Use compound index for type + date range
      query = ctx.db
        .query("creditTransactions")
        .withIndex("by_user_type_created", (q) =>
          q.eq("userId", args.userId)
            .eq("type", args.type!)
            .gte("createdAt", args.startDate!)
        );
    } else if (args.startDate) {
      // 🔥 OPTIMIZED: Use compound index for date range
      query = ctx.db
        .query("creditTransactions")
        .withIndex("by_user_created", (q) =>
          q.eq("userId", args.userId)
            .gte("createdAt", args.startDate!)
        );
    } else if (args.type) {
      query = ctx.db
        .query("creditTransactions")
        .withIndex("by_user_type", (q) =>
          q.eq("userId", args.userId).eq("type", args.type!)
        );
    } else {
      query = ctx.db
        .query("creditTransactions")
        .withIndex("by_user", (q) => q.eq("userId", args.userId));
    }

    // Apply end date filter if specified (can't be in compound index)
    if (args.endDate) {
      query = query.filter(q => q.lte(q.field("createdAt"), args.endDate!));
    }

    return query
      .order("desc")
      .take(args.limit || 50);
  },
});

/**
 * Get business earnings with date range - OPTIMIZED
 * Uses compound index to eliminate expensive filters
 */
export const getBusinessEarningsOptimized = query({
  args: v.object({
    businessId: v.id("businesses"),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  }),
  handler: async (ctx, args) => {
    // 🔥 OPTIMIZED: Use compound index for business + date
    let transactionsQuery = ctx.db
      .query("creditTransactions")
      .withIndex("by_business_type_created", (q) =>
        q.eq("businessId", args.businessId)
          .eq("type", "spend")
      );

    if (args.startDate) {
      transactionsQuery = ctx.db
        .query("creditTransactions")
        .withIndex("by_business_type_created", (q) =>
          q.eq("businessId", args.businessId)
            .eq("type", "spend")
            .gte("createdAt", args.startDate!)
        );
    }

    // Apply end date filter if specified
    if (args.endDate) {
      transactionsQuery = transactionsQuery.filter(q =>
        q.lte(q.field("createdAt"), args.endDate!)
      );
    }

    const transactions = await transactionsQuery.collect();

    // Calculate earnings (business gets 80%, system takes 20%)
    const totalRevenue = transactions.reduce((sum, tx) => sum + tx.amount, 0);
    const businessEarnings = Math.floor(totalRevenue * 0.8); // 80% to business
    const systemFee = totalRevenue - businessEarnings; // 20% to system

    return {
      totalTransactions: transactions.length,
      totalRevenue,
      businessEarnings,
      systemFee,
      transactions: transactions.slice(0, 100), // Return first 100 for display
    };
  },
});