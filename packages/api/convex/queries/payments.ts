import { v } from "convex/values";
import { query, internalQuery } from "../_generated/server";
import { Id } from "../_generated/dataModel";

/**
 * Get user's active subscription (internal query for service layer)
 */
export const getUserSubscription = internalQuery({
  args: v.object({
    userId: v.id("users"),
  }),
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query("subscriptions")
      .withIndex("by_user_status", (q) => q.eq("userId", userId).eq("status", "active"))
      .first();
  },
});

/**
 * Get subscription by Stripe subscription ID
 */
export const getSubscriptionByStripeId = internalQuery({
  args: v.object({
    stripeSubscriptionId: v.string(),
  }),
  handler: async (ctx, { stripeSubscriptionId }) => {
    return await ctx.db
      .query("subscriptions")
      .withIndex("by_stripe_subscription", (q) =>
        q.eq("stripeSubscriptionId", stripeSubscriptionId)
      )
      .first();
  },
});

/**
 * Check if Stripe event already processed
 */
export const getEventByStripeId = internalQuery({
  args: v.object({
    stripeEventId: v.string(),
  }),
  handler: async (ctx, { stripeEventId }) => {
    return await ctx.db
      .query("subscriptionEvents")
      .withIndex("by_stripe_event", (q) => q.eq("stripeEventId", stripeEventId))
      .first();
  },
});

/**
 * Get subscription events for a subscription (to check if credits were already allocated)
 */
export const getSubscriptionEvents = internalQuery({
  args: v.object({
    subscriptionId: v.id("subscriptions"),
  }),
  handler: async (ctx, { subscriptionId }) => {
    return await ctx.db
      .query("subscriptionEvents")
      .withIndex("by_subscription", (q) => q.eq("subscriptionId", subscriptionId))
      .collect();
  },
});

/**
 * Get subscription plans available for purchase (public query)
 */
export const getSubscriptionPlans = query({
  args: {},
  handler: async () => {
    return [
      {
        id: "basic" as const,
        name: "Basic Plan",
        credits: 20,
        priceInCents: 2000,
        currency: "eur",
        description: "Perfect for occasional fitness enthusiasts",
        features: [
          "20 credits per month",
          "Access to all classes",
          "Credits expire in 90 days",
          "Cancel anytime"
        ],
      },
      {
        id: "standard" as const,
        name: "Standard Plan",
        credits: 50,
        priceInCents: 4500,
        currency: "eur",
        description: "Great value for regular gym-goers",
        features: [
          "50 credits per month",
          "Access to all classes",
          "Credits expire in 90 days",
          "10% discount vs individual credits",
          "Cancel anytime"
        ],
        popular: true,
      },
      {
        id: "premium" as const,
        name: "Premium Plan",
        credits: 100,
        priceInCents: 8000,
        currency: "eur",
        description: "Best value for fitness enthusiasts",
        features: [
          "100 credits per month",
          "Access to all classes",
          "Credits expire in 90 days",
          "20% discount vs individual credits",
          "Priority booking support",
          "Cancel anytime"
        ],
      },
    ];
  },
});

/**
 * Get user's subscription history (public query)
 */
export const getSubscriptionHistory = query({
  args: v.object({
    userId: v.id("users"),
  }),
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});