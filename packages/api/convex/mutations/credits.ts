import { v } from "convex/values";
import { mutation, internalMutation } from "../_generated/server";
import { creditService } from "../../services/creditService";

/**
 * Gift credits to a user (admin function)
 */
export const giftCredits = mutation({
  args: v.object({
    userId: v.id("users"),
    amount: v.number(),
    description: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const { userId, amount, description = `Gift of ${amount} credits` } = args;

    const result = await creditService.addCredits(ctx, {
      userId,
      amount,
      type: "gift",
      reason: "admin_gift",
      description,
    });

    return {
      success: true,
      transactionId: result.transactionId,
      newBalance: result.newBalance,
      message: `Successfully gifted ${amount} credits. New balance: ${result.newBalance}`,
    };
  },
});

/**
 * Purchase credits (user function)
 */
export const purchaseCredits = mutation({
  args: v.object({
    userId: v.id("users"),
    amount: v.number(),
    paymentRef: v.string(),
    description: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const { userId, amount, paymentRef, description = `Purchased ${amount} credits` } = args;

    const result = await creditService.addCredits(ctx, {
      userId,
      amount,
      type: "purchase",
      reason: "user_buy",
      description,
      externalRef: paymentRef,
    });

    return {
      success: true,
      transactionId: result.transactionId,
      newBalance: result.newBalance,
      message: `Successfully purchased ${amount} credits. New balance: ${result.newBalance}`,
    };
  },
});

/**
 * Refund credits to a user
 */
export const refundCredits = mutation({
  args: v.object({
    userId: v.id("users"),
    amount: v.number(),
    reason: v.string(),
    businessId: v.optional(v.id("businesses")),
    classInstanceId: v.optional(v.id("classInstances")),
  }),
  handler: async (ctx, args) => {
    const { userId, amount, reason, businessId, classInstanceId } = args;

    const result = await creditService.addCredits(ctx, {
      userId,
      amount,
      type: "refund",
      reason: "general_refund",
      description: `Refund: ${reason}`,
      businessId,
      classInstanceId,
    });

    return {
      success: true,
      transactionId: result.transactionId,
      newBalance: result.newBalance,
      message: `Successfully refunded ${amount} credits. New balance: ${result.newBalance}`,
    };
  },
});

/**
 * Add credits for subscription renewal (internal function for webhooks)
 */
export const addCreditsForSubscription = internalMutation({
  args: v.object({
    userId: v.id("users"),
    amount: v.number(),
    subscriptionId: v.id("subscriptions"),
    description: v.string(),
  }),
  handler: async (ctx, { userId, amount, subscriptionId, description }) => {
    const result = await creditService.addCredits(ctx, {
      userId,
      amount,
      type: "purchase", // Subscription credits are purchased via monthly payment
      reason: "subscription_renewal",
      description,
      externalRef: subscriptionId,
      packageName: "Monthly Subscription Credits",
    });

    return result.transactionId;
  },
});

/**
 * Create pending credit purchase (for Stripe checkout)
 */
export const createPendingCreditPurchase = internalMutation({
  args: v.object({
    userId: v.id("users"),
    amount: v.number(),
    stripePaymentIntentId: v.string(),
    stripeCheckoutSessionId: v.optional(v.string()),
    packageName: v.string(),
    priceInCents: v.number(),
    currency: v.string(),
    description: v.string(),
  }),
  handler: async (ctx, args) => {
    const result = await creditService.createPendingPurchase(ctx, args);
    return result.transactionId;
  },
});

/**
 * Complete credit purchase (called from Stripe webhook)
 */
export const completeCreditPurchase = internalMutation({
  args: v.object({
    stripePaymentIntentId: v.string(),
  }),
  handler: async (ctx, { stripePaymentIntentId }) => {
    const result = await creditService.completePurchase(ctx, {
      stripePaymentIntentId,
    });
    return result;
  },
});

/**
 * Update credit transaction with actual payment intent ID
 */
export const updateCreditTransactionPaymentIntent = internalMutation({
  args: v.object({
    transactionId: v.id("creditTransactions"),
    stripePaymentIntentId: v.string(),
  }),
  handler: async (ctx, { transactionId, stripePaymentIntentId }) => {
    await ctx.db.patch(transactionId, {
      stripePaymentIntentId,
      updatedAt: Date.now(),
    });
    
    return transactionId;
  },
});