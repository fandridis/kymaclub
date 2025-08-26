import { v } from "convex/values";
import { query } from "../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

/**
 * Get current user's subscription status
 */
export const getCurrentUserSubscription = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_user_status", (q) => q.eq("userId", userId).eq("status", "active"))
      .first();

    return subscription;
  },
});

/**
 * Get subscription plans available for purchase
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
 * Get user's subscription history
 */
export const getSubscriptionHistory = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});