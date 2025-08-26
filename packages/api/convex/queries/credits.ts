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