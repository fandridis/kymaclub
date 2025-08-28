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
 * Get transaction history for a user - OPTIMIZED
 * Uses compound indexes instead of service layer
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
    // 🔥 OPTIMIZED: Direct query with compound index
    let query;
    
    if (args.type) {
      query = ctx.db
        .query("creditTransactions")
        .withIndex("by_user_type", q => q.eq("userId", args.userId).eq("type", args.type));
    } else {
      query = ctx.db
        .query("creditTransactions")
        .withIndex("by_user", q => q.eq("userId", args.userId));
    }

    return query
      .order("desc")
      .take(args.limit || 50);
  },
});

/**
 * Get business earnings from credit transactions - OPTIMIZED
 * Uses compound indexes instead of service layer
 */
export const getBusinessEarnings = query({
  args: v.object({
    businessId: v.id("businesses"),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  }),
  handler: async (ctx, args) => {
    // 🔥 OPTIMIZED: Use compound indexes for type-specific queries
    let bookingsQuery, refundsQuery;

    if (args.startDate) {
      bookingsQuery = ctx.db
        .query("creditTransactions")
        .withIndex("by_business_type_created", q => 
          q.eq("businessId", args.businessId)
           .eq("type", "spend")
           .gte("createdAt", args.startDate)
        );
      
      refundsQuery = ctx.db
        .query("creditTransactions")
        .withIndex("by_business_type_created", q => 
          q.eq("businessId", args.businessId)
           .eq("type", "refund")
           .gte("createdAt", args.startDate)
        );
    } else {
      bookingsQuery = ctx.db
        .query("creditTransactions")
        .withIndex("by_business_type", q => 
          q.eq("businessId", args.businessId).eq("type", "spend")
        );
      
      refundsQuery = ctx.db
        .query("creditTransactions")
        .withIndex("by_business_type", q => 
          q.eq("businessId", args.businessId).eq("type", "refund")
        );
    }

    // Apply end date filter if specified
    if (args.endDate) {
      bookingsQuery = bookingsQuery.filter(q => q.lte(q.field("createdAt"), args.endDate));
      refundsQuery = refundsQuery.filter(q => q.lte(q.field("createdAt"), args.endDate));
    }

    const [bookingTxns, refundTxns] = await Promise.all([
      bookingsQuery.collect(),
      refundsQuery.collect()
    ]);

    const totalEarnings = bookingTxns.reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
    const totalRefunds = refundTxns.reduce((sum, tx) => sum + tx.amount, 0);
    const netEarnings = totalEarnings - totalRefunds;

    return {
      totalEarnings,
      totalRefunds,
      netEarnings,
      transactionCount: bookingTxns.length + refundTxns.length,
      transactions: [...bookingTxns, ...refundTxns].slice(0, 100),
    };
  },
});

/**
 * Get credit analytics (purchases vs gifts) - OPTIMIZED  
 * Uses type-specific queries instead of full table scan
 */
export const getCreditAnalytics = query({
  args: v.object({
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  }),
  handler: async (ctx, args) => {
    // 🔥 CRITICAL FIX: Use separate type-specific queries instead of scanning ALL transactions
    const queryPromises = ["purchase", "gift", "spend", "refund"].map(async (type) => {
      let query = ctx.db
        .query("creditTransactions")
        .withIndex("by_type", q => q.eq("type", type as any));

      // Apply date filters
      if (args.startDate) {
        query = query.filter(q => q.gte(q.field("createdAt"), args.startDate!));
      }
      if (args.endDate) {
        query = query.filter(q => q.lte(q.field("createdAt"), args.endDate!));
      }

      return {
        type: type as "purchase" | "gift" | "spend" | "refund",
        transactions: await query.collect()
      };
    });

    const results = await Promise.all(queryPromises);
    const transactionsByType = results.reduce((acc, { type, transactions }) => {
      acc[type] = transactions;
      return acc;
    }, {} as Record<string, any[]>);

    // Process each type directly from organized data
    const purchased = transactionsByType.purchase.reduce((sum, tx) => sum + tx.amount, 0);
    const giftWelcome = transactionsByType.gift.filter(tx => tx.reason === "welcome_bonus").reduce((sum, tx) => sum + tx.amount, 0);
    const giftReferral = transactionsByType.gift.filter(tx => tx.reason === "referral_bonus").reduce((sum, tx) => sum + tx.amount, 0);
    const giftAdmin = transactionsByType.gift.filter(tx => tx.reason === "admin_gift" || !tx.reason).reduce((sum, tx) => sum + tx.amount, 0);
    const giftCampaign = transactionsByType.gift.filter(tx => tx.reason === "campaign_bonus").reduce((sum, tx) => sum + tx.amount, 0);
    const totalSpent = transactionsByType.spend.reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

    const refundsByReason = {
      userCancellation: transactionsByType.refund.filter(tx => tx.reason === "user_cancellation").reduce((sum, tx) => sum + tx.amount, 0),
      businessCancellation: transactionsByType.refund.filter(tx => tx.reason === "business_cancellation").reduce((sum, tx) => sum + tx.amount, 0),
      paymentIssue: transactionsByType.refund.filter(tx => tx.reason === "payment_issue").reduce((sum, tx) => sum + tx.amount, 0),
      general: transactionsByType.refund.filter(tx => tx.reason === "general_refund" || !tx.reason).reduce((sum, tx) => sum + tx.amount, 0),
    };

    const totalRefunded = Object.values(refundsByReason).reduce((sum, amount) => sum + amount, 0);
    const totalGifted = giftWelcome + giftReferral + giftAdmin + giftCampaign;
    const totalAdded = purchased + totalGifted + totalRefunded;

    return {
      purchased,
      giftWelcome,
      giftReferral,
      giftAdmin,
      giftCampaign,
      totalGifted,
      totalAdded,
      totalSpent,
      totalRefunded,
      refundsByReason,
    };
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