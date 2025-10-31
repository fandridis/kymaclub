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

/***************************************************************
 * 🆕 ATOMIC WEBHOOK TRANSACTION MUTATIONS
 * Consolidate multiple operations into single transactions
 ***************************************************************/

/**
 * Atomic payment succeeded transaction
 * Consolidates: subscription update + credit allocation + event recording
 */
export const handlePaymentSucceededTransaction = internalMutation({
  args: v.object({
    stripeEventId: v.string(),
    subscriptionUpdate: v.object({
      stripeSubscriptionId: v.string(),
      status: v.union(v.literal("active"), v.literal("incomplete"), v.literal("past_due")),
    }),
    creditAllocation: v.optional(v.object({
      userId: v.id("users"),
      amount: v.number(),
      subscriptionId: v.id("subscriptions"),
      description: v.string(),
    })),
    eventData: v.object({
      eventType: v.string(),
      subscriptionId: v.optional(v.id("subscriptions")),
      creditsAllocated: v.optional(v.number()),
    }),
  }),
  handler: async (ctx, args) => {
    // 🛡️ IDEMPOTENCY CHECK: Prevent duplicate processing of the same Stripe event
    // This is critical for handling concurrent webhook calls
    // Check 1: Look for existing subscription event with credits allocated
    const existingEvent = await ctx.db
      .query("subscriptionEvents")
      .withIndex("by_stripe_event", (q) => q.eq("stripeEventId", args.stripeEventId))
      .first();

    if (existingEvent && existingEvent.creditsAllocated && existingEvent.creditsAllocated > 0) {
      // Return the existing result without processing again
      return {
        success: true,
        subscriptionId: existingEvent.subscriptionId || undefined,
        creditTransactionId: existingEvent.creditTransactionId ? (existingEvent.creditTransactionId as Id<"creditTransactions">) : undefined,
        creditsAllocated: existingEvent.creditsAllocated || 0,
      };
    }

    // Check 2: If we're about to allocate credits, check for existing credit transaction
    // This catches race conditions where two calls happen simultaneously
    if (args.creditAllocation) {
      const existingTransaction = await ctx.db
        .query("creditTransactions")
        .filter((q) =>
          q.and(
            q.eq(q.field("userId"), args.creditAllocation!.userId),
            q.eq(q.field("externalRef"), args.stripeEventId),
            q.eq(q.field("status"), "completed")
          )
        )
        .first();

      if (existingTransaction) {
        // Get subscription for return value
        const subscription = await ctx.db
          .query("subscriptions")
          .withIndex("by_stripe_subscription", q =>
            q.eq("stripeSubscriptionId", args.subscriptionUpdate.stripeSubscriptionId)
          )
          .first();

        return {
          success: true,
          subscriptionId: subscription?._id,
          creditTransactionId: existingTransaction._id,
          creditsAllocated: existingTransaction.amount,
        };
      }
    }

    let creditTransactionId: Id<"creditTransactions"> | undefined;

    // 1. Update subscription status
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_stripe_subscription", q =>
        q.eq("stripeSubscriptionId", args.subscriptionUpdate.stripeSubscriptionId)
      )
      .first();

    if (!subscription) {
      console.error('[Subscription] Subscription not found in database', {
        stripeSubscriptionId: args.subscriptionUpdate.stripeSubscriptionId,
      });
      throw new Error(`Subscription not found: ${args.subscriptionUpdate.stripeSubscriptionId}`);
    }

    await ctx.db.patch(subscription._id, {
      status: args.subscriptionUpdate.status,
      updatedAt: Date.now(),
      updatedBy: subscription.userId,
    });

    // 2. Allocate credits if specified
    if (args.creditAllocation) {
      creditTransactionId = await ctx.db.insert("creditTransactions", {
        userId: args.creditAllocation.userId,
        amount: args.creditAllocation.amount,
        type: "gift",
        reason: "subscription_renewal",
        description: args.creditAllocation.description,
        externalRef: args.stripeEventId,
        status: "completed",
        completedAt: Date.now(),
        createdAt: Date.now(),
        createdBy: args.creditAllocation.userId,
      });

      // Update user's credit balance
      const user = await ctx.db.get(args.creditAllocation.userId);
      if (user) {
        const oldCredits = user.credits || 0;
        const newCredits = oldCredits + args.creditAllocation.amount;

        await ctx.db.patch(args.creditAllocation.userId, {
          credits: newCredits,
        });
      } else {
        console.error('[Subscription] User not found when updating credits', {
          userId: args.creditAllocation.userId,
        });
      }
    }

    // 3. Record audit event
    await ctx.db.insert("subscriptionEvents", {
      subscriptionId: args.eventData.subscriptionId || subscription._id,
      stripeSubscriptionId: args.subscriptionUpdate.stripeSubscriptionId,
      stripeEventId: args.stripeEventId,
      eventType: args.eventData.eventType,
      processedAt: Date.now(),
      creditsAllocated: args.eventData.creditsAllocated,
      creditTransactionId: creditTransactionId ? `${creditTransactionId}` : undefined,
      createdAt: Date.now(),
      createdBy: subscription.userId,
    });

    const result = {
      success: true,
      subscriptionId: subscription._id,
      creditTransactionId,
      creditsAllocated: args.creditAllocation?.amount || 0,
    };

    return result;
  },
});

/**
 * Atomic subscription creation transaction
 * Consolidates: subscription creation + event recording
 */
export const createSubscriptionWithEvent = internalMutation({
  args: v.object({
    stripeEventId: v.string(),
    subscription: v.object({
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
    }),
  }),
  handler: async (ctx, args) => {
    // 1. Create subscription record
    const subscriptionId = await ctx.db.insert("subscriptions", {
      ...args.subscription,
      createdAt: Date.now(),
      createdBy: args.subscription.userId,
    });

    // 2. Record creation event
    await ctx.db.insert("subscriptionEvents", {
      subscriptionId,
      stripeSubscriptionId: args.subscription.stripeSubscriptionId,
      stripeEventId: args.stripeEventId,
      eventType: "customer.subscription.created",
      processedAt: Date.now(),
      createdAt: Date.now(),
      createdBy: args.subscription.userId,
    });

    return {
      success: true,
      subscriptionId,
    };
  },
});

/**
 * Atomic subscription update transaction
 * Consolidates: subscription update + event recording
 */
export const updateSubscriptionWithEvent = internalMutation({
  args: v.object({
    stripeEventId: v.string(),
    stripeSubscriptionId: v.string(),
    updates: v.object({
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
      creditAmount: v.optional(v.number()),
      pricePerCycle: v.optional(v.number()),
      cancelAtPeriodEnd: v.optional(v.boolean()),
      canceledAt: v.optional(v.number()),
      endedAt: v.optional(v.number()),
    }),
    eventType: v.string(),
  }),
  handler: async (ctx, args) => {
    // 1. Find and update subscription
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_stripe_subscription", q =>
        q.eq("stripeSubscriptionId", args.stripeSubscriptionId)
      )
      .first();

    if (!subscription) {
      throw new Error(`Subscription not found: ${args.stripeSubscriptionId}`);
    }

    await ctx.db.patch(subscription._id, {
      ...args.updates,
      updatedAt: Date.now(),
      updatedBy: subscription.userId,
    });

    // 2. Record update event
    await ctx.db.insert("subscriptionEvents", {
      subscriptionId: subscription._id,
      stripeSubscriptionId: args.stripeSubscriptionId,
      stripeEventId: args.stripeEventId,
      eventType: args.eventType,
      processedAt: Date.now(),
      createdAt: Date.now(),
      createdBy: subscription.userId,
    });

    return {
      success: true,
      subscriptionId: subscription._id,
    };
  },
});