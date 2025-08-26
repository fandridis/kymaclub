"use node";

import { v } from "convex/values";
import { action, internalAction } from "../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "../_generated/api";
import { paymentsService } from "../../services/paymentsService";
import { Id, Doc } from "../_generated/dataModel";

/**
 * Create dynamic subscription checkout for 5-150 credits
 */
export const createDynamicSubscriptionCheckout = action({
  args: { 
    creditAmount: v.number(),
  },
  handler: async (ctx, { creditAmount }): Promise<{ checkoutUrl: string | null; sessionId: string }> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be authenticated to create subscription");
    }

    // Try to get email from auth identity first, fallback to database user record
    const authUser = await ctx.auth.getUserIdentity();
    let userEmail = authUser?.email;
    
    if (!userEmail) {
      const dbUser: Doc<"users"> | null = await ctx.runQuery(internal.queries.core.getUserById, { userId });
      userEmail = dbUser?.email;
    }
    
    if (!userEmail) {
      throw new Error("User email is required for subscription. Please update your profile.");
    }
    
    return await paymentsService.createDynamicSubscriptionCheckout(ctx, {
      creditAmount,
      userId,
      userEmail,
    });
  },
});

/**
 * Create predefined plan subscription checkout
 */
export const createSubscriptionCheckout = action({
  args: { 
    planId: v.union(v.literal("basic"), v.literal("standard"), v.literal("premium")),
  },
  handler: async (ctx, { planId }): Promise<{ checkoutUrl: string | null; sessionId: string }> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be authenticated to create subscription");
    }

    // Try to get email from auth identity first, fallback to database user record
    const authUser = await ctx.auth.getUserIdentity();
    let userEmail = authUser?.email;
    
    if (!userEmail) {
      const dbUser: Doc<"users"> | null = await ctx.runQuery(internal.queries.core.getUserById, { userId });
      userEmail = dbUser?.email;
    }
    
    if (!userEmail) {
      throw new Error("User email is required for subscription. Please update your profile.");
    }
    
    return await paymentsService.createPredefinedSubscriptionCheckout(ctx, {
      planId,
      userId,
      userEmail,
    });
  },
});

/**
 * Get current user's subscription status
 */
export const getCurrentSubscription = action({
  args: {},
  handler: async (ctx): Promise<any> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    return await paymentsService.getCurrentSubscription(ctx, userId);
  },
});

/**
 * Cancel subscription at period end
 */
export const cancelSubscription = action({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be authenticated");
    }

    return await paymentsService.cancelSubscription(ctx, { userId });
  },
});

/**
 * Reactivate a canceled subscription with smart billing
 * - If subscription hasn't expired and credits unchanged: just re-enable, no charge
 * - If subscription hasn't expired and credits changed: charge/credit the difference
 * - If subscription has expired: treat as new subscription
 */
export const reactivateSubscription = action({
  args: {
    newCreditAmount: v.number(), // The credit amount to reactivate with
  },
  handler: async (ctx, { newCreditAmount }): Promise<{
    success: boolean;
    chargeAmount: number;
    creditsAllocated: number;
    newBillingDate: string;
    message: string;
  }> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be authenticated");
    }

    return await paymentsService.reactivateSubscription(ctx, { userId, newCreditAmount });
  },
});

/**
 * Update existing subscription to new credit amount
 */
export const updateSubscription = action({
  args: {
    newCreditAmount: v.number(),
  },
  handler: async (ctx, { newCreditAmount }): Promise<{
    success: boolean;
    newCreditAmount: number;
    newPrice: number;
    creditsAllocated: number;
    message: string;
  }> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be authenticated");
    }

    return await paymentsService.updateSubscription(ctx, { userId, newCreditAmount });
  },
});

/**
 * Process Stripe webhook (unified endpoint for all events)
 */
export const processWebhook = internalAction({
  args: {
    signature: v.string(),
    payload: v.string(),
  },
  handler: async (ctx, args) => {
    return await paymentsService.processWebhook(ctx, args);
  },
});

/**
 * Create one-time credit purchase checkout
 */
export const createOneTimeCreditCheckout = action({
  args: { 
    creditAmount: v.number(),
  },
  handler: async (ctx, { creditAmount }): Promise<{ checkoutUrl: string | null; sessionId: string }> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be authenticated to purchase credits");
    }

    // Try to get email from auth identity first
    const authUser = await ctx.auth.getUserIdentity();
    let userEmail = authUser?.email;
    
    // If no email in auth identity, get it from the database user record
    if (!userEmail) {
      const dbUser: Doc<"users"> | null = await ctx.runQuery(internal.queries.core.getUserById, { userId });
      userEmail = dbUser?.email;
    }
    
    if (!userEmail) {
      throw new Error("User email is required for checkout. Please update your profile.");
    }
    
    return await paymentsService.createOneTimeCreditCheckout(ctx, {
      creditAmount,
      userId,
      userEmail,
    });
  },
});

