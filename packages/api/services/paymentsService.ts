"use node";

import type { ActionCtx } from "../convex/_generated/server";
import { internal } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";
import Stripe from "stripe";
import {
  calculateSubscriptionPricing,
  validateCreditAmount,
  getSubscriptionProductName,
  getSubscriptionProductDescription,
  calculateOneTimePricing,
  validateOneTimeCreditAmount,
  getOneTimeProductName,
  getOneTimeProductDescription,
} from "../operations/payments";

// Stripe subscription products configuration
export const SUBSCRIPTION_PLANS = {
  basic: {
    credits: 20,
    priceInCents: 2300, // $23.00 ($2.30 per credit)
    planName: "20 Credits Monthly",
  },
  standard: {
    credits: 50,
    priceInCents: 5175, // $51.75 ($2.30 per credit with 10% discount)
    planName: "50 Credits Monthly",
  },
  premium: {
    credits: 100,
    priceInCents: 9200, // $92.00 ($2.30 per credit with 20% discount)
    planName: "100 Credits Monthly",
  },
} as const;

export type SubscriptionPlan = keyof typeof SUBSCRIPTION_PLANS;

/**
 * Get or create a Stripe customer for a user
 * This utility function prevents creating duplicate customers
 */
async function getOrCreateStripeCustomer(
  stripe: Stripe,
  userEmail: string,
  userId: Id<"users">,
  ctx: ActionCtx
): Promise<{ customer: Stripe.Customer; isNew: boolean }> {
  try {
    // First, try to find existing customer by email
    const existingCustomers = await stripe.customers.list({
      email: userEmail,
      limit: 1,
    });

    if (existingCustomers.data.length > 0) {
      const existingCustomer = existingCustomers.data[0];
      console.log(`Found existing Stripe customer: ${existingCustomer?.id} for user: ${userId}`);

      // Update the user's stripeCustomerId if it's not set
      await ctx.runMutation(internal.mutations.core.updateStripeCustomerId, {
        userId,
        stripeCustomerId: existingCustomer?.id!,
      });

      return { customer: existingCustomer!, isNew: false };
    }

    // Create new customer if none exists
    const newCustomer = await stripe.customers.create({
      email: userEmail,
      metadata: {
        convexUserId: userId,
      },
    });

    console.log(`Created new Stripe customer: ${newCustomer.id} for user: ${userId}`);

    // Update the user's stripeCustomerId
    await ctx.runMutation(internal.mutations.core.updateStripeCustomerId, {
      userId,
      stripeCustomerId: newCustomer.id,
    });

    return { customer: newCustomer, isNew: true };
  } catch (error) {
    console.error("Error in getOrCreateStripeCustomer:", error);
    throw new Error(`Failed to get or create Stripe customer: ${(error as Error).message}`);
  }
}

/**
 * Payments service - handles all Stripe subscription and payment business logic
 */
export const paymentsService = {
  /**
   * Create dynamic subscription checkout for 5-150 credits
   */
  async createDynamicSubscriptionCheckout(
    ctx: ActionCtx,
    args: { creditAmount: number; userId: Id<"users">; userEmail: string }
  ) {
    const { creditAmount, userId, userEmail } = args;

    // Validate credit amount
    if (!validateCreditAmount(creditAmount)) {
      throw new Error("Invalid credit amount. Must be between 5-150 credits in increments of 5.");
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2025-02-24.acacia",
    });

    const pricing = calculateSubscriptionPricing(creditAmount);

    // Get or create Stripe customer
    const { customer: stripeCustomer } = await getOrCreateStripeCustomer(
      stripe,
      userEmail,
      userId,
      ctx
    );

    // Create the subscription checkout session with dynamic pricing
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomer.id,
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: getSubscriptionProductName(creditAmount),
              description: getSubscriptionProductDescription(creditAmount),
            },
            unit_amount: pricing.priceInCents,
            recurring: {
              interval: "month",
            },
          },
          quantity: 1,
        },
      ],
      success_url: `kymaclub://payment/success?session_id={CHECKOUT_SESSION_ID}&type=subscription`,
      cancel_url: `kymaclub://payment/cancel?type=subscription`,
      metadata: {
        convexUserId: userId,
        creditAmount: creditAmount.toString(),
        priceInCents: pricing.priceInCents.toString(),
        dynamicSubscription: "true",
      },
      subscription_data: {
        metadata: {
          convexUserId: userId,
          creditAmount: creditAmount.toString(),
          priceInCents: pricing.priceInCents.toString(),
          dynamicSubscription: "true",
        },
      },
    });

    return {
      checkoutUrl: session.url,
      sessionId: session.id,
    };
  },

  /**
   * Create predefined plan subscription checkout
   */
  async createPredefinedSubscriptionCheckout(
    ctx: ActionCtx,
    args: { planId: SubscriptionPlan; userId: Id<"users">; userEmail: string }
  ) {
    const { planId, userId, userEmail } = args;

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2025-02-24.acacia",
    });

    const plan = SUBSCRIPTION_PLANS[planId];

    // Get or create Stripe customer
    const { customer: stripeCustomer } = await getOrCreateStripeCustomer(
      stripe,
      userEmail,
      userId,
      ctx
    );

    // Create subscription checkout session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomer.id,
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: plan.planName,
              description: `${plan.credits} credits every month`,
            },
            unit_amount: plan.priceInCents,
            recurring: {
              interval: "month",
            },
          },
          quantity: 1,
        },
      ],
      success_url: `kymaclub://payment/success?session_id={CHECKOUT_SESSION_ID}&type=subscription`,
      cancel_url: `kymaclub://payment/cancel?type=subscription`,
      metadata: {
        convexUserId: userId,
        planId: planId,
        creditAmount: plan.credits.toString(),
      },
      subscription_data: {
        metadata: {
          convexUserId: userId,
          planId: planId,
          creditAmount: plan.credits.toString(),
          priceInCents: plan.priceInCents.toString(),
          dynamicSubscription: "false",
        },
      },
    });

    return {
      checkoutUrl: session.url,
      sessionId: session.id,
    };
  },

  /**
   * Get current user subscription
   */
  async getCurrentSubscription(ctx: ActionCtx, userId: Id<"users">): Promise<any> {
    return await ctx.runQuery(internal.queries.payments.getUserSubscription, {
      userId,
    });
  },

  /**
   * Cancel subscription at period end
   */
  async cancelSubscription(ctx: ActionCtx, args: { userId: Id<"users"> }) {
    const { userId } = args;

    const subscription = await ctx.runQuery(
      internal.queries.payments.getUserSubscription,
      { userId }
    );

    if (!subscription || subscription.status !== "active") {
      throw new Error("No active subscription found");
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2025-02-24.acacia",
    });

    // Cancel at period end in Stripe
    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    // Update our database
    await ctx.runMutation(internal.mutations.payments.markSubscriptionCanceling, {
      subscriptionId: subscription._id,
    });

    return { success: true };
  },

  /**
   * Reactivate a canceled subscription with immediate full charge and new billing cycle
   */
  async reactivateSubscription(ctx: ActionCtx, args: { userId: Id<"users"> }): Promise<{
    success: boolean;
    chargeAmount: number;
    creditsAllocated: number;
    newBillingDate: string;
    message: string;
  }> {
    const { userId } = args;

    const subscription = await ctx.runQuery(
      internal.queries.payments.getUserSubscription,
      { userId }
    );

    if (!subscription || !subscription.cancelAtPeriodEnd) {
      throw new Error("No subscription to reactivate");
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2025-02-24.acacia",
    });

    // Cancel the old subscription and create a completely new one
    // This ensures we charge the full amount without Stripe's proration logic interfering

    const now = Date.now();
    const newPeriodEnd = now + (30 * 24 * 60 * 60 * 1000); // 30 days from now

    // Step 1: Get the original subscription details from Stripe to recreate it
    const stripeSubscriptionDetails = await stripe.subscriptions.retrieve(subscription.stripeSubscriptionId);
    const priceId = stripeSubscriptionDetails.items.data[0]!.price!.id;

    // Step 2: Cancel the existing subscription immediately (no proration)
    await stripe.subscriptions.cancel(subscription.stripeSubscriptionId, {
      prorate: false, // Don't prorate the cancellation
    });

    // Step 3: Create a completely new subscription with immediate billing
    const newStripeSubscription = await stripe.subscriptions.create({
      customer: stripeSubscriptionDetails.customer as string,
      items: [{ price: priceId }],
      // Start billing immediately
      billing_cycle_anchor: Math.floor(now / 1000),
      // Ensure immediate invoice
      collection_method: 'charge_automatically',
      // Copy over the metadata from old subscription
      metadata: {
        convexUserId: subscription.userId,
        creditAmount: subscription.creditAmount.toString(),
        priceInCents: subscription.pricePerCycle.toString(),
        dynamicSubscription: "true",
        reactivation: "true", // Flag this as a reactivation
      },
    });

    // Update our database with the new subscription ID and billing period
    await ctx.runMutation(internal.mutations.payments.updateSubscription, {
      stripeSubscriptionId: subscription.stripeSubscriptionId, // Update the old record
      status: "canceled", // Mark old subscription as canceled
    });

    // Create a new subscription record for the new Stripe subscription
    const newDatabaseSubscriptionId = await ctx.runMutation(internal.mutations.payments.createSubscription, {
      userId: subscription.userId,
      stripeCustomerId: stripeSubscriptionDetails.customer as string,
      stripeSubscriptionId: newStripeSubscription.id,
      stripePriceId: priceId,
      stripeProductId: stripeSubscriptionDetails.items.data[0]!.price!.product as string,
      status: "active",
      currentPeriodStart: now,
      currentPeriodEnd: newPeriodEnd,
      billingCycleAnchor: now,
      creditAmount: subscription.creditAmount,
      pricePerCycle: subscription.pricePerCycle,
      currency: subscription.currency || "usd",
      planName: subscription.planName,
      startDate: now,
    });

    // Allocate credits immediately since user is paying full amount now
    const creditTransactionId = await ctx.runMutation(
      internal.mutations.credits.addCreditsForSubscription,
      {
        userId,
        amount: subscription.creditAmount,
        subscriptionId: newDatabaseSubscriptionId,
        description: `Subscription reactivated - ${subscription.planName}`,
      }
    );

    // Record the reactivation event for the NEW subscription
    await ctx.runMutation(internal.mutations.payments.recordSubscriptionEvent, {
      stripeEventId: `reactivation_${now}`, // Generate unique event ID
      eventType: "subscription.reactivated",
      stripeSubscriptionId: newStripeSubscription.id, // Use NEW subscription ID
      subscriptionId: newDatabaseSubscriptionId, // Use NEW database ID
      userId,
      creditsAllocated: subscription.creditAmount,
      creditTransactionId,
      eventData: {
        reactivatedAt: now,
        newPeriodStart: now,
        newPeriodEnd: newPeriodEnd,
        chargeAmount: subscription.pricePerCycle,
        oldStripeSubscriptionId: subscription.stripeSubscriptionId, // Track the old one
        newStripeSubscriptionId: newStripeSubscription.id,
        manuallyProcessed: true, // Flag to indicate we handled credit allocation
      },
    });

    const newBillingDate = new Date(newPeriodEnd).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });

    return {
      success: true,
      chargeAmount: subscription.pricePerCycle / 100, // Convert cents to euros
      creditsAllocated: subscription.creditAmount,
      newBillingDate,
      message: `Subscription reactivated! You've been charged $${(subscription.pricePerCycle / 100).toFixed(2)} and received ${subscription.creditAmount} credits. Next billing: ${newBillingDate}`,
    };
  },

  /**
   * Update existing subscription to new credit amount
   */
  async updateSubscription(ctx: ActionCtx, args: { userId: Id<"users">; newCreditAmount: number }): Promise<{
    success: boolean;
    newCreditAmount: number;
    newPrice: number;
    creditsAllocated: number;
    message: string;
  }> {
    const { userId, newCreditAmount } = args;

    // Validate credit amount (same validation as dynamic subscriptions)
    if (newCreditAmount < 5 || newCreditAmount > 150) {
      throw new Error("Credit amount must be between 5 and 150 credits");
    }

    const subscription = await ctx.runQuery(
      internal.queries.payments.getUserSubscription,
      { userId }
    );

    if (!subscription || subscription.status !== "active") {
      throw new Error("No active subscription found to update");
    }

    // Check if the new credit amount is different from current
    if (subscription.creditAmount === newCreditAmount) {
      throw new Error("New credit amount is the same as current subscription");
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2025-02-24.acacia",
    });

    // Calculate new pricing
    const calculateDynamicPricing = (creditAmount: number): {
      priceInCents: number;
      pricePerCredit: number;
      creditAmount: number;
    } => {
      if (creditAmount < 5 || creditAmount > 150) {
        throw new Error("Credit amount must be between 5 and 150");
      }

      let pricePerCredit: number;
      if (creditAmount <= 40) {
        pricePerCredit = 2.00; // €2.00 per credit for 5-40 credits
      } else if (creditAmount <= 80) {
        pricePerCredit = 1.95; // €1.95 per credit for 41-80 credits (2.5% discount)
      } else if (creditAmount <= 120) {
        pricePerCredit = 1.90; // €1.90 per credit for 81-120 credits (5% discount)
      } else {
        pricePerCredit = 1.80; // €1.80 per credit for 121-150 credits (10% discount)
      }

      return {
        priceInCents: Math.round(creditAmount * pricePerCredit * 100),
        pricePerCredit,
        creditAmount,
      };
    };

    const pricing = calculateDynamicPricing(newCreditAmount);

    // Create a new Stripe price for the new credit amount
    const stripePrice = await stripe.prices.create({
      product_data: {
        name: `Monthly Subscription - ${newCreditAmount} Credits`,
      },
      unit_amount: pricing.priceInCents,
      currency: "eur",
      recurring: {
        interval: "month",
        interval_count: 1,
      },
      metadata: {
        creditAmount: newCreditAmount.toString(),
        pricePerCredit: pricing.pricePerCredit.toString(),
        dynamicSubscription: "true",
      },
    });

    // Update the subscription in Stripe
    const updatedStripeSubscription = await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      items: [
        {
          id: (await stripe.subscriptions.retrieve(subscription.stripeSubscriptionId)).items.data[0]!.id,
          price: stripePrice.id,
        },
      ],
      // Prorate the billing - user will be charged/credited the difference immediately
      proration_behavior: 'always_invoice',
    });

    // Calculate credit difference for immediate allocation
    const creditDifference = newCreditAmount - subscription.creditAmount;
    let creditTransactionId = null;

    // If user is upgrading (more credits), allocate the difference immediately
    if (creditDifference > 0) {
      creditTransactionId = await ctx.runMutation(
        internal.mutations.credits.addCreditsForSubscription,
        {
          userId,
          amount: creditDifference,
          subscriptionId: subscription._id,
          description: `Subscription upgrade - additional ${creditDifference} credits for ${subscription.planName}`,
        }
      );
    }

    // Update our database subscription
    await ctx.runMutation(internal.mutations.payments.updateSubscription, {
      stripeSubscriptionId: subscription.stripeSubscriptionId,
      creditAmount: newCreditAmount,
      pricePerCycle: pricing.priceInCents,
      planName: `Monthly Subscription - ${newCreditAmount} Credits`,
    });

    // Record the update event
    await ctx.runMutation(internal.mutations.payments.recordSubscriptionEvent, {
      stripeEventId: `update_${Date.now()}`, // Generate unique event ID
      eventType: "subscription.updated",
      stripeSubscriptionId: subscription.stripeSubscriptionId,
      subscriptionId: subscription._id,
      userId,
      creditsAllocated: creditDifference > 0 ? creditDifference : undefined,
      creditTransactionId: creditTransactionId || undefined,
      eventData: {
        updatedAt: Date.now(),
        oldCreditAmount: subscription.creditAmount,
        newCreditAmount,
        oldPrice: subscription.pricePerCycle,
        newPrice: pricing.priceInCents,
        creditDifference,
        manuallyProcessed: true, // Flag to indicate we handled credit allocation
      },
    });

    const upgradeMessage = creditDifference > 0
      ? ` You've received ${creditDifference} additional credits immediately.`
      : creditDifference < 0
        ? ` Your credit allocation will decrease to ${newCreditAmount} starting next billing cycle.`
        : '';

    return {
      success: true,
      newCreditAmount,
      newPrice: pricing.priceInCents / 100, // Return price in euros
      creditsAllocated: creditDifference > 0 ? creditDifference : 0,
      message: `Subscription updated to ${newCreditAmount} credits per month.${upgradeMessage}`,
    };
  },

  /**
   * Process all Stripe webhook events (unified endpoint)
   */
  async processWebhook(
    ctx: ActionCtx,
    args: { signature: string; payload: string }
  ) {
    const { signature, payload } = args;

    console.log("Processing webhook");

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2025-02-24.acacia",
    });

    console.log("Stripe instance created");

    console.log("USING THE SECRET", process.env.STRIPE_WEBHOOK_SECRET);
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

    // Debug logging
    console.log(`[WEBHOOK DEBUG] ===== Webhook Processing Start =====`);
    console.log(`[WEBHOOK DEBUG] Webhook secret (first 10 chars): ${webhookSecret?.substring(0, 10)}...`);
    console.log(`[WEBHOOK DEBUG] Signature (first 20 chars): ${signature?.substring(0, 20)}...`);
    console.log(`[WEBHOOK DEBUG] Payload length: ${payload?.length} bytes`);
    console.log(`[WEBHOOK DEBUG] Payload preview: ${payload?.substring(0, 100)}...`);
    console.log(`[WEBHOOK DEBUG] Full signature: ${signature}`);

    // Check if webhook secret exists
    if (!webhookSecret) {
      console.error(`[WEBHOOK DEBUG] ERROR: STRIPE_WEBHOOK_SECRET is not defined!`);
      return { success: false, error: "Webhook secret not configured" };
    }

    // Check if signature exists
    if (!signature) {
      console.error(`[WEBHOOK DEBUG] ERROR: No signature provided!`);
      return { success: false, error: "No signature provided" };
    }

    // Check if payload exists
    if (!payload) {
      console.error(`[WEBHOOK DEBUG] ERROR: No payload provided!`);
      return { success: false, error: "No payload provided" };
    }

    try {
      console.log(`[WEBHOOK DEBUG] Attempting to construct Stripe event...`);
      const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);

      console.log(`[WEBHOOK DEBUG] ✅ Event constructed successfully!`);
      console.log(`[WEBHOOK DEBUG] Processing Stripe event: ${event.type}`);

      // Debug: List all events we're receiving 
      if (event.type.includes('subscription') || event.type.includes('customer')) {
        console.log(`[WEBHOOK DEBUG] 🎯 Subscription/Customer event detected: ${event.type}`);
      }

      // Check for duplicate events
      const existingEvent = await ctx.runQuery(
        internal.queries.payments.getEventByStripeId,
        { stripeEventId: event.id }
      );

      if (existingEvent) {
        console.log(`Event ${event.id} already processed, skipping`);
        return { success: true };
      }

      // Route events to appropriate handlers
      switch (event.type) {
        // Subscription events
        case "customer.subscription.created":
          console.log(`[WEBHOOK DEBUG] 🎉 Received customer.subscription.created event`);
          await this.handleSubscriptionCreated(ctx, event);
          break;

        case "customer.subscription.updated":
          await this.handleSubscriptionUpdated(ctx, event);
          break;

        case "customer.subscription.deleted":
          await this.handleSubscriptionDeleted(ctx, event);
          break;

        case "invoice.payment_succeeded":
          console.log(`[WEBHOOK DEBUG] 🎯 Subscription/Customer event detected: invoice.payment_succeeded`);
          await this.handlePaymentSucceeded(ctx, event);
          break;

        case "invoice.payment_failed":
          await this.handlePaymentFailed(ctx, event);
          break;

        // One-time payment events
        case "checkout.session.completed":
          await this.handleOneTimePaymentSucceeded(ctx, event);
          break;

        case "payment_intent.payment_failed":
          await this.handleOneTimePaymentFailed(ctx, event);
          break;

        // Charge events (can be from both subscriptions and one-time payments)
        case "charge.succeeded":
        case "charge.updated":
          console.log(`Charge event ${event.type} processed successfully (no action needed)`);
          break;

        // Invoice events (different variations Stripe sends)
        case "invoice.paid":
          console.log(`[WEBHOOK DEBUG] 🎯 Invoice paid event detected - treating as invoice.payment_succeeded`);
          await this.handlePaymentSucceeded(ctx, event);
          break;

        // Note: invoice_payment.paid might be a custom event type, handle it with caution
        // case "invoice_payment.paid":
        //   console.log(`[WEBHOOK DEBUG] 🎯 Invoice payment paid event detected - treating as invoice.payment_succeeded`);  
        //   await this.handlePaymentSucceeded(ctx, event);
        //   break;

        default:
          console.log(`Unhandled Stripe event type: ${event.type}`);
      }

      return { success: true };
    } catch (error) {
      console.error("Stripe webhook error:", error);
      return { success: false, error: (error as Error).message };
    }
  },

  /**
   * Handle subscription created webhook
   */
  async handleSubscriptionCreated(ctx: ActionCtx, event: Stripe.Event) {
    const subscription = event.data.object as Stripe.Subscription;
    const userId = subscription.metadata?.convexUserId;
    const isDynamicSubscription = subscription.metadata?.dynamicSubscription === "true";

    console.log(`[SUBSCRIPTION DEBUG] ===== Processing subscription created =====`);
    console.log(`[SUBSCRIPTION DEBUG] Subscription ID: ${subscription.id}`);
    console.log(`[SUBSCRIPTION DEBUG] User ID from metadata: ${userId}`);
    console.log(`[SUBSCRIPTION DEBUG] Is dynamic subscription: ${isDynamicSubscription}`);
    console.log(`[SUBSCRIPTION DEBUG] Full metadata:`, JSON.stringify(subscription.metadata, null, 2));

    if (!userId) {
      console.error("[SUBSCRIPTION DEBUG] ERROR: Missing userId in subscription created event metadata");
      return;
    }

    let creditAmount: number;
    let pricePerCycle: number;
    let planName: string;

    console.log(`[SUBSCRIPTION DEBUG] Parsing subscription data...`);

    if (isDynamicSubscription) {
      console.log(`[SUBSCRIPTION DEBUG] Processing dynamic subscription`);
      // Handle dynamic subscription
      creditAmount = parseInt(subscription.metadata?.creditAmount || "0");
      pricePerCycle = parseInt(subscription.metadata?.priceInCents || "0");
      planName = getSubscriptionProductName(creditAmount);

      console.log(`[SUBSCRIPTION DEBUG] Dynamic subscription data:`, {
        creditAmount,
        pricePerCycle,
        planName
      });

      if (!creditAmount || !pricePerCycle) {
        console.error("[SUBSCRIPTION DEBUG] ERROR: Missing dynamic subscription metadata", {
          creditAmount,
          pricePerCycle
        });
        return;
      }
    } else {
      console.log(`[SUBSCRIPTION DEBUG] Processing predefined plan subscription`);
      // Handle predefined plan subscription
      const planId = subscription.metadata?.planId as SubscriptionPlan;
      if (!planId) {
        console.error("[SUBSCRIPTION DEBUG] ERROR: Missing planId in predefined subscription metadata");
        return;
      }

      const plan = SUBSCRIPTION_PLANS[planId];
      creditAmount = plan.credits;
      pricePerCycle = plan.priceInCents;
      planName = plan.planName;

      console.log(`[SUBSCRIPTION DEBUG] Predefined plan data:`, {
        planId,
        creditAmount,
        pricePerCycle,
        planName
      });
    }

    console.log(`[SUBSCRIPTION DEBUG] About to create subscription in database...`);
    console.log(`[SUBSCRIPTION DEBUG] Subscription creation args:`, {
      userId,
      stripeCustomerId: subscription.customer,
      stripeSubscriptionId: subscription.id,
      stripePriceId: subscription.items.data[0]!.price!.id,
      stripeProductId: subscription.items.data[0]!.price!.product,
      status: subscription.status,
      currentPeriodStart: subscription.current_period_start * 1000,
      currentPeriodEnd: subscription.current_period_end * 1000,
      billingCycleAnchor: new Date(subscription.current_period_start * 1000).getDate(),
      creditAmount,
      pricePerCycle,
      currency: "eur",
      planName,
      startDate: Date.now(),
    });

    let databaseSubscriptionId: Id<"subscriptions">;
    try {
      databaseSubscriptionId = await ctx.runMutation(internal.mutations.payments.createSubscription, {
        userId: userId as Id<"users">,
        stripeCustomerId: subscription.customer as string,
        stripeSubscriptionId: subscription.id,
        stripePriceId: subscription.items.data[0]!.price!.id,
        stripeProductId: subscription.items.data[0]!.price!.product as string,
        status: subscription.status as any,
        currentPeriodStart: subscription.current_period_start * 1000,
        currentPeriodEnd: subscription.current_period_end * 1000,
        billingCycleAnchor: new Date(subscription.current_period_start * 1000).getDate(),
        creditAmount,
        pricePerCycle,
        currency: "eur",
        planName,
        startDate: Date.now(),
      });

      console.log(`[SUBSCRIPTION DEBUG] ✅ Successfully created subscription record in database: ${databaseSubscriptionId}`);
    } catch (error) {
      console.error(`[SUBSCRIPTION DEBUG] ❌ ERROR creating subscription in database:`, error);
      throw error;
    }

    // Record the event
    await ctx.runMutation(internal.mutations.payments.recordSubscriptionEvent, {
      stripeEventId: event.id,
      eventType: event.type,
      stripeSubscriptionId: subscription.id,
      subscriptionId: databaseSubscriptionId, // Pass the database subscription ID
      userId: userId as Id<"users">,
      eventData: event.data.object,
    });
  },

  /**
   * Handle subscription updated webhook
   */
  async handleSubscriptionUpdated(ctx: ActionCtx, event: Stripe.Event) {
    const subscription = event.data.object as Stripe.Subscription;

    // First, check if the subscription exists
    const existingSubscription = await ctx.runQuery(
      internal.queries.payments.getSubscriptionByStripeId,
      { stripeSubscriptionId: subscription.id }
    );

    if (!existingSubscription) {
      console.warn(`Subscription ${subscription.id} not found during update webhook. This might be an out-of-order webhook.`);
      console.warn(`Skipping subscription update - will be handled when created event arrives.`);
      return; // Skip this update, let the created event handle it
    }

    try {
      await ctx.runMutation(internal.mutations.payments.updateSubscription, {
        stripeSubscriptionId: subscription.id,
        status: subscription.status as any,
        currentPeriodStart: subscription.current_period_start * 1000,
        currentPeriodEnd: subscription.current_period_end * 1000,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        canceledAt: subscription.canceled_at ? subscription.canceled_at * 1000 : undefined,
        endedAt: subscription.ended_at ? subscription.ended_at * 1000 : undefined,
      });
    } catch (error) {
      console.error(`Error updating subscription ${subscription.id}:`, error);
      throw error;
    }

    // Record the event
    await ctx.runMutation(internal.mutations.payments.recordSubscriptionEvent, {
      stripeEventId: event.id,
      eventType: event.type,
      stripeSubscriptionId: subscription.id,
      subscriptionId: existingSubscription._id, // Pass the database subscription ID
      userId: existingSubscription.userId,
      eventData: event.data.object,
    });
  },

  /**
   * Handle subscription deleted webhook
   */
  async handleSubscriptionDeleted(ctx: ActionCtx, event: Stripe.Event) {
    const subscription = event.data.object as Stripe.Subscription;

    // First, check if the subscription exists
    const existingSubscription = await ctx.runQuery(
      internal.queries.payments.getSubscriptionByStripeId,
      { stripeSubscriptionId: subscription.id }
    );

    if (!existingSubscription) {
      console.warn(`Subscription ${subscription.id} not found during delete webhook. This might be an out-of-order webhook.`);
      console.warn(`Skipping subscription deletion - will be handled when created event arrives.`);
      return; // Skip this update, let the created event handle it
    }

    try {
      await ctx.runMutation(internal.mutations.payments.updateSubscription, {
        stripeSubscriptionId: subscription.id,
        status: "canceled",
        endedAt: Date.now(),
      });
    } catch (error) {
      console.error(`Error updating subscription ${subscription.id}:`, error);
      throw error;
    }

    // Record the event
    await ctx.runMutation(internal.mutations.payments.recordSubscriptionEvent, {
      stripeEventId: event.id,
      eventType: event.type,
      stripeSubscriptionId: subscription.id,
      subscriptionId: existingSubscription._id, // Pass the database subscription ID
      userId: existingSubscription.userId,
      eventData: event.data.object,
    });
  },

  /**
   * Handle payment succeeded webhook
   */
  async handlePaymentSucceeded(ctx: ActionCtx, event: Stripe.Event) {
    console.log(`[PAYMENT DEBUG] ===== Processing payment succeeded =====`);
    const invoice = event.data.object as Stripe.Invoice;

    console.log(`[PAYMENT DEBUG] Invoice billing reason: ${invoice.billing_reason}`);
    console.log(`[PAYMENT DEBUG] Invoice subscription ID: ${invoice.subscription}`);

    if (invoice.subscription && (
      invoice.billing_reason === "subscription_cycle" ||
      invoice.billing_reason === "subscription_create"
    )) {
      // This is a subscription payment (initial or renewal) - allocate credits
      const subscription = await ctx.runQuery(
        internal.queries.payments.getSubscriptionByStripeId,
        { stripeSubscriptionId: invoice.subscription as string }
      );

      console.log(`[PAYMENT DEBUG] Found subscription:`, subscription ? `${subscription._id}` : 'null');

      if (subscription) {
        // Check if this payment was already processed manually (to prevent double allocation)
        const recentEvents = await ctx.runQuery(internal.queries.payments.getEventByStripeId, {
          stripeEventId: event.id,
        });

        if (recentEvents) {
          console.log(`[PAYMENT DEBUG] Event ${event.id} already processed - skipping`);
          return;
        }

        // Check for recent manual operations (reactivation/update) within last 5 minutes
        const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);

        // Update subscription status to active if it was incomplete
        if (subscription.status === "incomplete") {
          console.log(`[PAYMENT DEBUG] Updating subscription status from incomplete to active`);
          await ctx.runMutation(internal.mutations.payments.updateSubscription, {
            stripeSubscriptionId: subscription.stripeSubscriptionId,
            status: "active",
          });
        }

        // Only allocate credits for genuine renewals and new subscriptions
        // Skip if this was triggered by a manual reactivation or update
        const shouldAllocateCredits = invoice.billing_reason === "subscription_cycle" ||
          (invoice.billing_reason === "subscription_create" && subscription.status === "incomplete");

        if (shouldAllocateCredits) {
          // Allocate credits for the payment
          const isInitialPayment = invoice.billing_reason === "subscription_create";
          const description = isInitialPayment
            ? `Initial subscription payment - ${subscription.planName}`
            : `Monthly subscription renewal - ${subscription.planName}`;

          console.log(`[PAYMENT DEBUG] Allocating ${subscription.creditAmount} credits for user ${subscription.userId}`);

          const creditTransactionId = await ctx.runMutation(
            internal.mutations.credits.addCreditsForSubscription,
            {
              userId: subscription.userId,
              amount: subscription.creditAmount,
              subscriptionId: subscription._id,
              description,
            }
          );

          // Record the event with credit allocation
          await ctx.runMutation(internal.mutations.payments.recordSubscriptionEvent, {
            stripeEventId: event.id,
            eventType: event.type,
            stripeSubscriptionId: subscription.stripeSubscriptionId,
            subscriptionId: subscription._id,
            userId: subscription.userId,
            creditsAllocated: subscription.creditAmount,
            creditTransactionId,
            eventData: event.data.object,
          });
        } else {
          console.log(`[PAYMENT DEBUG] Skipping credit allocation - likely manual operation`);

          // Record the event without credit allocation
          await ctx.runMutation(internal.mutations.payments.recordSubscriptionEvent, {
            stripeEventId: event.id,
            eventType: event.type,
            stripeSubscriptionId: subscription.stripeSubscriptionId,
            subscriptionId: subscription._id,
            userId: subscription.userId,
            // NO creditsAllocated field
            eventData: event.data.object,
          });
        }
      }
    } else if (invoice.subscription && invoice.billing_reason === "subscription_update") {
      // This is a subscription update payment (proration) - DO NOT allocate credits
      // Credits are already allocated by the update service logic
      console.log(`[PAYMENT DEBUG] Subscription update detected - logging event only (no credit allocation)`);

      const subscription = await ctx.runQuery(
        internal.queries.payments.getSubscriptionByStripeId,
        { stripeSubscriptionId: invoice.subscription as string }
      );

      if (subscription) {
        // Record the event for audit purposes but don't allocate credits
        await ctx.runMutation(internal.mutations.payments.recordSubscriptionEvent, {
          stripeEventId: event.id,
          eventType: event.type,
          stripeSubscriptionId: subscription.stripeSubscriptionId,
          subscriptionId: subscription._id,
          userId: subscription.userId,
          // NO creditsAllocated field - this prevents double allocation
          eventData: event.data.object,
        });

        console.log(`[PAYMENT DEBUG] Subscription update event logged (no credits allocated)`);
      }
    }
  },

  /**
   * Handle payment failed webhook
   */
  async handlePaymentFailed(ctx: ActionCtx, event: Stripe.Event) {
    const invoice = event.data.object as Stripe.Invoice;

    if (invoice.subscription) {
      // Get the subscription to find the user ID
      const subscription = await ctx.runQuery(
        internal.queries.payments.getSubscriptionByStripeId,
        { stripeSubscriptionId: invoice.subscription as string }
      );

      if (subscription) {
        // Record the event
        await ctx.runMutation(internal.mutations.payments.recordSubscriptionEvent, {
          stripeEventId: event.id,
          eventType: event.type,
          stripeSubscriptionId: invoice.subscription as string,
          subscriptionId: subscription._id, // Pass the database subscription ID
          userId: subscription.userId,
          eventData: event.data.object,
        });
      } else {
        console.warn(`Subscription ${invoice.subscription} not found for payment failed event`);
      }
    } else {
      console.warn(`Payment failed event has no subscription ID`);
    }
  },

  /**
   * Create one-time credit purchase checkout
   */
  async createOneTimeCreditCheckout(
    ctx: ActionCtx,
    args: { creditAmount: number; userId: Id<"users">; userEmail: string }
  ) {
    const { creditAmount, userId, userEmail } = args;

    // Validate credit amount
    if (!validateOneTimeCreditAmount(creditAmount)) {
      throw new Error("Invalid credit amount. Must be between 1-200 credits.");
    }

    console.log("Creating one-time credit checkout for user", userId, "with credit amount", creditAmount);

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2025-02-24.acacia",
    });

    console.log("Stripe instance created");

    const pricing = calculateOneTimePricing(creditAmount);

    // Get or create Stripe customer
    const { customer: stripeCustomer } = await getOrCreateStripeCustomer(
      stripe,
      userEmail,
      userId,
      ctx
    );

    // Create the payment intent with one-time pricing
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomer.id,
      payment_method_types: ["card"],
      mode: "payment", // One-time payment, not subscription
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: getOneTimeProductName(creditAmount),
              description: getOneTimeProductDescription(creditAmount),
            },
            unit_amount: pricing.priceInCents,
          },
          quantity: 1,
        },
      ],
      success_url: `kymaclub://payment/success?session_id={CHECKOUT_SESSION_ID}&type=purchase`,
      cancel_url: `kymaclub://payment/cancel?type=purchase`,
      metadata: {
        convexUserId: userId,
        creditAmount: creditAmount.toString(),
        priceInCents: pricing.priceInCents.toString(),
        oneTimePurchase: "true",
      },
    });

    // Create pending purchase record using session ID as temporary payment intent ID
    // This will be updated with the actual payment intent ID when the webhook fires
    await ctx.runMutation(internal.mutations.credits.createPendingCreditPurchase, {
      userId: userId,
      amount: creditAmount,
      stripePaymentIntentId: session.id, // Use session ID temporarily 
      stripeCheckoutSessionId: session.id,
      packageName: getOneTimeProductName(creditAmount),
      priceInCents: pricing.priceInCents,
      currency: "eur",
      description: `One-time purchase of ${creditAmount} credits`,
    });

    return {
      checkoutUrl: session.url,
      sessionId: session.id,
    };
  },


  /**
   * Handle one-time payment succeeded
   */
  async handleOneTimePaymentSucceeded(ctx: ActionCtx, event: Stripe.Event) {
    const session = event.data.object as Stripe.Checkout.Session;

    if (session.metadata?.oneTimePurchase === "true") {
      console.log(`Processing one-time purchase: session ${session.id}, payment_intent: ${session.payment_intent}`);

      if (session.payment_intent) {
        // First, find the pending transaction by session ID and update it with payment intent ID
        await this.updatePendingTransactionWithPaymentIntent(ctx, {
          sessionId: session.id,
          paymentIntentId: session.payment_intent as string,
        });

        // Then complete the purchase using the payment intent ID
        const result = await ctx.runMutation(internal.mutations.credits.completeCreditPurchase, {
          stripePaymentIntentId: session.payment_intent as string,
        });

        console.log(`One-time credit purchase completed: ${session.payment_intent}`);
        return result;
      } else {
        console.warn(`No payment_intent found for session ${session.id}`);
      }
    }
  },

  /**
   * Handle one-time payment failed
   */
  async handleOneTimePaymentFailed(ctx: ActionCtx, event: Stripe.Event) {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;

    // Mark the pending transaction as failed
    // This is handled by the creditService.completePurchase method
    // which will update the status based on the payment intent status

    console.log(`One-time payment failed: ${paymentIntent.id}`);
  },

  /**
   * Update pending transaction with actual payment intent ID from session ID
   */
  async updatePendingTransactionWithPaymentIntent(
    ctx: ActionCtx,
    args: { sessionId: string; paymentIntentId: string }
  ) {
    // Find transaction by session ID (which we used as temporary payment intent ID)
    const transaction = await ctx.runQuery(internal.queries.credits.getCreditTransactionByStripeId, {
      stripePaymentIntentId: args.sessionId,
    });

    if (transaction) {
      // Update the transaction with the real payment intent ID
      await ctx.runMutation(internal.mutations.credits.updateCreditTransactionPaymentIntent, {
        transactionId: transaction._id,
        stripePaymentIntentId: args.paymentIntentId,
      });

      console.log(`Updated transaction ${transaction._id} with payment intent ${args.paymentIntentId}`);
    } else {
      console.warn(`No pending transaction found for session ${args.sessionId}`);
    }
  }
};