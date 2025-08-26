import { v } from "convex/values";
import { mutation, internalMutation } from "../_generated/server";
import { Id } from "../_generated/dataModel";

/**
 * Create subscription record in database
 */
export const createSubscription = internalMutation({
  args: v.object({
    userId: v.id("users"),
    stripeCustomerId: v.string(),
    stripeSubscriptionId: v.string(),
    stripePriceId: v.string(),
    stripeProductId: v.string(),
    status: v.union(
      v.literal("active"),
      v.literal("canceled"),
      v.literal("incomplete"),
      v.literal("past_due"),
      v.literal("trialing"),
      v.literal("unpaid")
    ),
    currentPeriodStart: v.number(),
    currentPeriodEnd: v.number(),
    billingCycleAnchor: v.number(),
    creditAmount: v.number(),
    pricePerCycle: v.number(),
    currency: v.string(),
    planName: v.string(),
    startDate: v.number(),
    cancelAtPeriodEnd: v.optional(v.boolean()),
    canceledAt: v.optional(v.number()),
    endedAt: v.optional(v.number()),
  }),
  handler: async (ctx, args) => {
    return await ctx.db.insert("subscriptions", {
      ...args,
      createdAt: Date.now(),
      createdBy: args.userId, // Use userId as createdBy for webhook-created subscriptions
    });
  },
});

/**
 * Update subscription record
 */
export const updateSubscription = internalMutation({
  args: v.object({
    stripeSubscriptionId: v.string(),
    status: v.optional(v.union(
      v.literal("active"),
      v.literal("canceled"),
      v.literal("incomplete"),
      v.literal("past_due"),
      v.literal("trialing"),
      v.literal("unpaid")
    )),
    currentPeriodStart: v.optional(v.number()),
    currentPeriodEnd: v.optional(v.number()),
    cancelAtPeriodEnd: v.optional(v.boolean()),
    canceledAt: v.optional(v.number()),
    endedAt: v.optional(v.number()),
    creditAmount: v.optional(v.number()),
    pricePerCycle: v.optional(v.number()),
    planName: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const { stripeSubscriptionId, ...updateData } = args;

    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_stripe_subscription", (q) =>
        q.eq("stripeSubscriptionId", stripeSubscriptionId)
      )
      .first();

    if (!subscription) {
      throw new Error("Subscription not found");
    }

    await ctx.db.patch(subscription._id, {
      ...updateData,
      updatedAt: Date.now(),
    });

    return subscription._id;
  },
});

/**
 * Mark subscription as canceling (cancel at period end)
 */
export const markSubscriptionCanceling = internalMutation({
  args: v.object({
    subscriptionId: v.id("subscriptions"),
  }),
  handler: async (ctx, { subscriptionId }) => {
    await ctx.db.patch(subscriptionId, {
      cancelAtPeriodEnd: true,
      updatedAt: Date.now(),
    });

    return subscriptionId;
  },
});

/**
 * Reactivate canceled subscription
 */
export const reactivateSubscription = internalMutation({
  args: v.object({
    subscriptionId: v.id("subscriptions"),
  }),
  handler: async (ctx, { subscriptionId }) => {
    const updateData: any = {
      cancelAtPeriodEnd: false,
      updatedAt: Date.now(),
    };

    // Handle canceledAt properly by removing it from the document
    await ctx.db.patch(subscriptionId, updateData);

    return subscriptionId;
  },
});

/**
 * Record subscription event from Stripe webhook
 */
export const recordSubscriptionEvent = internalMutation({
  args: v.object({
    stripeEventId: v.string(),
    eventType: v.string(),
    stripeSubscriptionId: v.string(), // Stripe subscription ID
    subscriptionId: v.optional(v.id("subscriptions")), // Database subscription ID (optional)
    userId: v.id("users"), // Add userId for audit fields
    creditsAllocated: v.optional(v.number()),
    creditTransactionId: v.optional(v.id("creditTransactions")),
    eventData: v.any(),
  }),
  handler: async (ctx, args) => {
    return await ctx.db.insert("subscriptionEvents", {
      stripeEventId: args.stripeEventId,
      eventType: args.eventType,
      stripeSubscriptionId: args.stripeSubscriptionId,
      subscriptionId: args.subscriptionId, // Can be null if subscription not created yet
      creditsAllocated: args.creditsAllocated,
      creditTransactionId: args.creditTransactionId?.toString(),
      eventData: args.eventData,
      createdAt: Date.now(),
      createdBy: args.userId,
      processedAt: Date.now(),
    });
  },
});