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
import {
  generatePaymentSuccessLink,
  generatePaymentCancelLink,
} from "../utils/deep-linking";

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
 * This utility function prevents creating duplicate customers by checking for existing customers first
 * 
 * @param stripe - Initialized Stripe client instance
 * @param userEmail - User's email address for customer creation/lookup
 * @param userId - Convex user ID for metadata and database updates
 * @param ctx - Convex action context for running mutations
 * @returns Promise resolving to customer object and boolean indicating if customer was newly created
 * @throws Error if Stripe operations fail
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

    // Update the user's stripeCustomerId
    await ctx.runMutation(internal.mutations.core.updateStripeCustomerId, {
      userId,
      stripeCustomerId: newCustomer.id,
    });

    return { customer: newCustomer, isNew: true };
  } catch (error) {
    throw new Error(`Failed to get or create Stripe customer: ${(error as Error).message}`);
  }
}

/**
 * Payments service - handles all Stripe subscription and payment business logic
 */
export const paymentsService = {
  /**
   * Create dynamic subscription checkout session for 5-150 credits
   * Uses centralized pricing logic with tiered discounts based on credit amount
   * 
   * @param ctx - Convex action context
   * @param args - Object containing creditAmount (5-150), userId, and userEmail
   * @returns Promise resolving to checkout URL and session ID
   * @throws Error for invalid parameters, missing environment variables, or Stripe failures
   */
  async createDynamicSubscriptionCheckout(
    ctx: ActionCtx,
    args: { creditAmount: number; userId: Id<"users">; userEmail: string }
  ) {
    const { creditAmount, userId, userEmail } = args;

    // Validate input parameters
    if (!creditAmount || !userId || !userEmail) {
      throw new Error("Missing required parameters: creditAmount, userId, and userEmail are required");
    }

    if (!validateCreditAmount(creditAmount)) {
      throw new Error("Invalid credit amount. Must be between 5-150 credits in increments of 5.");
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("Stripe secret key not configured");
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
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
            currency: "eur",
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
      success_url: generatePaymentSuccessLink("{CHECKOUT_SESSION_ID}", "subscription"),
      cancel_url: generatePaymentCancelLink("subscription"),
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
   * Create predefined plan subscription checkout session
   * Uses pre-configured subscription plans (basic, standard, premium)
   * 
   * @param ctx - Convex action context
   * @param args - Object containing planId, userId, and userEmail
   * @returns Promise resolving to checkout URL and session ID
   * @throws Error for invalid plan ID, missing parameters, or Stripe failures
   */
  async createPredefinedSubscriptionCheckout(
    ctx: ActionCtx,
    args: { planId: SubscriptionPlan; userId: Id<"users">; userEmail: string }
  ) {
    const { planId, userId, userEmail } = args;

    // Validate input parameters
    if (!planId || !userId || !userEmail) {
      throw new Error("Missing required parameters: planId, userId, and userEmail are required");
    }

    if (!SUBSCRIPTION_PLANS[planId]) {
      throw new Error(`Invalid plan ID: ${planId}`);
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("Stripe secret key not configured");
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
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
            currency: "eur",
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
      success_url: generatePaymentSuccessLink("{CHECKOUT_SESSION_ID}", "subscription"),
      cancel_url: generatePaymentCancelLink("subscription"),
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
   * Get current user subscription information
   * 
   * @param ctx - Convex action context
   * @param userId - Convex user ID
   * @returns Promise resolving to subscription object or null if not found
   * @throws Error for missing user ID
   */
  async getCurrentSubscription(ctx: ActionCtx, userId: Id<"users">): Promise<any> {
    if (!userId) {
      throw new Error("User ID is required");
    }

    return await ctx.runQuery(internal.queries.payments.getUserSubscription, {
      userId,
    });
  },

  /**
   * Cancel user subscription at the end of current billing period
   * Does not immediately cancel - allows user to use credits until period ends
   * 
   * @param ctx - Convex action context
   * @param args - Object containing userId
   * @returns Promise resolving to success object
   * @throws Error for missing user ID, no active subscription, or Stripe failures
   */
  async cancelSubscription(ctx: ActionCtx, args: { userId: Id<"users"> }) {
    const { userId } = args;

    // Validate input parameters
    if (!userId) {
      throw new Error("User ID is required");
    }

    const subscription = await ctx.runQuery(
      internal.queries.payments.getUserSubscription,
      { userId }
    );

    if (!subscription || subscription.status !== "active") {
      throw new Error("No active subscription found");
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("Stripe secret key not configured");
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
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
   * Reactivate a canceled subscription with simplified billing:
   * - If not expired: Just re-enable, no charge, no credits (can update amount for next billing)
   * - If expired: Create new subscription with full charge and credits
   * 
   * @param ctx - Convex action context
   * @param args - Object containing userId and newCreditAmount
   * @returns Promise resolving to object with success status, charge amount, credits allocated, billing date, and message
   * @throws Error for missing user ID, no subscription to reactivate, or Stripe failures
   */
  async reactivateSubscription(ctx: ActionCtx, args: { userId: Id<"users">, newCreditAmount: number }): Promise<{
    success: boolean;
    chargeAmount: number;
    creditsAllocated: number;
    newBillingDate: string;
    message: string;
  }> {
    const { userId, newCreditAmount } = args;

    // Validate input parameters
    if (!userId) {
      throw new Error("User ID is required");
    }
    if (!newCreditAmount || !validateCreditAmount(newCreditAmount)) {
      throw new Error("Valid credit amount is required (5-150 in increments of 5)");
    }

    const subscription = await ctx.runQuery(
      internal.queries.payments.getUserSubscription,
      { userId }
    );

    if (!subscription || !subscription.cancelAtPeriodEnd) {
      throw new Error("No cancelled subscription to reactivate");
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("Stripe secret key not configured");
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-02-24.acacia",
    });

    const now = Date.now();
    const subscriptionExpired = subscription.currentPeriodEnd < now;
    const creditsDifference = newCreditAmount - subscription.creditAmount;
    const isChangingCredits = creditsDifference !== 0;

    // Get the original subscription details from Stripe
    const stripeSubscriptionDetails = await stripe.subscriptions.retrieve(subscription.stripeSubscriptionId);

    // Calculate pricing for the NEW credit amount
    const newPricing = calculateSubscriptionPricing(newCreditAmount);

    // CASE 1: Subscription hasn't expired yet - just re-enable with new amount for next billing
    if (!subscriptionExpired) {
      // If changing credits, create a new price
      if (isChangingCredits) {
        const newStripePrice = await stripe.prices.create({
          product_data: {
            name: `Monthly Subscription - ${newCreditAmount} Credits`,
          },
          unit_amount: newPricing.priceInCents,
          currency: "eur",
          recurring: {
            interval: "month",
            interval_count: 1,
          },
          metadata: {
            creditAmount: newCreditAmount.toString(),
            pricePerCredit: newPricing.pricePerCredit.toString(),
            dynamicSubscription: "true",
          },
        });

        // Update the subscription with new price and re-enable
        await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
          cancel_at_period_end: false, // Re-enable
          items: [{
            id: stripeSubscriptionDetails.items.data[0]!.id,
            price: newStripePrice.id,
          }],
          proration_behavior: 'none', // No proration - changes apply next billing
        });

        // Update our database
        await ctx.runMutation(internal.mutations.payments.updateSubscription, {
          stripeSubscriptionId: subscription.stripeSubscriptionId,
          creditAmount: newCreditAmount,
          pricePerCycle: newPricing.priceInCents,
          cancelAtPeriodEnd: false,
          planName: `Monthly Subscription - ${newCreditAmount} Credits`,
        });
      } else {
        // Just re-enable without changing anything
        await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
          cancel_at_period_end: false,
        });

        // Update our database
        await ctx.runMutation(internal.mutations.payments.updateSubscription, {
          stripeSubscriptionId: subscription.stripeSubscriptionId,
          cancelAtPeriodEnd: false,
        });
      }

      const nextBillingDate = new Date(subscription.currentPeriodEnd).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });

      return {
        success: true,
        chargeAmount: 0,
        creditsAllocated: 0,
        newBillingDate: nextBillingDate,
        message: isChangingCredits
          ? `Subscription re-enabled with ${newCreditAmount} credits/month for €${(newPricing.priceInCents / 100).toFixed(2)}/month. Changes take effect on ${nextBillingDate}.`
          : `Subscription re-enabled! No charge needed. Next billing: ${nextBillingDate}`,
      };
    }

    // CASE 2: Subscription has expired - create a new subscription with full charge
    else {
      // Create new product and price
      const newStripeProduct = await stripe.products.create({
        name: `Monthly Subscription - ${newCreditAmount} Credits`,
        description: `${newCreditAmount} credits every month at €${newPricing.pricePerCredit.toFixed(2)} per credit`,
        metadata: {
          creditAmount: newCreditAmount.toString(),
          dynamicSubscription: "true",
        },
      });

      const newStripePrice = await stripe.prices.create({
        product: newStripeProduct.id,
        unit_amount: newPricing.priceInCents,
        currency: "eur",
        recurring: {
          interval: "month",
          interval_count: 1,
        },
        metadata: {
          creditAmount: newCreditAmount.toString(),
          pricePerCredit: newPricing.pricePerCredit.toString(),
          dynamicSubscription: "true",
        },
      });

      // Cancel the old expired subscription completely
      await stripe.subscriptions.cancel(subscription.stripeSubscriptionId, {
        prorate: false,
        invoice_now: false,
      });

      // Cancel the old expired subscription completely
      await stripe.subscriptions.cancel(subscription.stripeSubscriptionId, {
        prorate: false,
        invoice_now: false,
      });

      // Create a brand new subscription with immediate payment
      const newStripeSubscription = await stripe.subscriptions.create({
        customer: stripeSubscriptionDetails.customer as string,
        items: [{ price: newStripePrice.id }],
        payment_behavior: 'error_if_incomplete', // This ensures payment is collected immediately
        metadata: {
          convexUserId: subscription.userId,
          creditAmount: newCreditAmount.toString(),
          priceInCents: newPricing.priceInCents.toString(),
          dynamicSubscription: "true",
        },
      });

      const newPeriodEnd = now + (30 * 24 * 60 * 60 * 1000); // 30 days from now

      // Update our database - mark old subscription as canceled
      await ctx.runMutation(internal.mutations.payments.updateSubscription, {
        stripeSubscriptionId: subscription.stripeSubscriptionId,
        status: "canceled",
      });

      // Only create new record and allocate credits if payment succeeded
      if (newStripeSubscription.status === 'active') {
        // Create a new subscription record
        const newDatabaseSubscriptionId = await ctx.runMutation(internal.mutations.payments.createSubscription, {
          userId: subscription.userId,
          stripeCustomerId: stripeSubscriptionDetails.customer as string,
          stripeSubscriptionId: newStripeSubscription.id,
          stripePriceId: newStripePrice.id,
          stripeProductId: newStripeProduct.id,
          status: "active",
          currentPeriodStart: now,
          currentPeriodEnd: newPeriodEnd,
          billingCycleAnchor: now,
          creditAmount: newCreditAmount,
          pricePerCycle: newPricing.priceInCents,
          currency: "eur",
          planName: `Monthly Subscription - ${newCreditAmount} Credits`,
          startDate: now,
        });

        // Allocate credits immediately since payment succeeded
        await ctx.runMutation(
          internal.mutations.credits.addCreditsForSubscription,
          {
            userId,
            amount: newCreditAmount,
            subscriptionId: newDatabaseSubscriptionId,
            description: `New subscription - ${newCreditAmount} credits`,
          }
        );

        const newBillingDate = new Date(newPeriodEnd).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric'
        });

        return {
          success: true,
          chargeAmount: newPricing.priceInCents / 100,
          creditsAllocated: newCreditAmount,
          newBillingDate,
          message: `New subscription started! You've been charged €${(newPricing.priceInCents / 100).toFixed(2)} and received ${newCreditAmount} credits.`,
        };
      } else {
        // Payment failed or requires further action
        throw new Error("Payment failed. Please update your payment method and try again.");
      }
    }
  },

  /**
   * Update existing subscription to new credit amount
   * Simple update - changes take effect at next billing cycle
   * No immediate charges or credits
   * 
   * @param ctx - Convex action context
   * @param args - Object containing userId and newCreditAmount (5-150)
   * @returns Promise resolving to object with success status, new amount, price, and message
   * @throws Error for missing parameters, invalid credit amount, no active subscription, or Stripe failures
   */
  async updateSubscription(ctx: ActionCtx, args: { userId: Id<"users">; newCreditAmount: number }): Promise<{
    success: boolean;
    newCreditAmount: number;
    newPrice: number;
    creditsAllocated: number;
    message: string;
  }> {
    const { userId, newCreditAmount } = args;

    // Validate input parameters
    if (!newCreditAmount || !userId) {
      throw new Error("Missing required parameters: newCreditAmount and userId are required");
    }

    if (!validateCreditAmount(newCreditAmount)) {
      throw new Error("Credit amount must be between 5 and 150 credits in increments of 5");
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

    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("Stripe secret key not configured");
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-02-24.acacia",
    });

    // Calculate new pricing using centralized pricing logic
    const pricing = calculateSubscriptionPricing(newCreditAmount);

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

    // Get the current subscription to find the item ID
    const currentStripeSubscription = await stripe.subscriptions.retrieve(subscription.stripeSubscriptionId);

    // Update the subscription in Stripe - changes take effect next billing cycle
    const updatedStripeSubscription = await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      items: [
        {
          id: currentStripeSubscription.items.data[0]!.id,
          price: stripePrice.id,
        },
      ],
      // No proration - changes apply at next billing cycle
      proration_behavior: 'none',
    });

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
      eventData: {
        updatedAt: Date.now(),
        oldCreditAmount: subscription.creditAmount,
        newCreditAmount,
        oldPrice: subscription.pricePerCycle,
        newPrice: pricing.priceInCents,
        effectiveNextBilling: true, // Indicate changes apply next billing
      },
    });

    const nextBillingDate = new Date(subscription.currentPeriodEnd).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });

    return {
      success: true,
      newCreditAmount,
      newPrice: pricing.priceInCents / 100, // Return price in euros
      creditsAllocated: 0, // No immediate credits
      message: `Subscription updated to ${newCreditAmount} credits/month for €${(pricing.priceInCents / 100).toFixed(2)}/month. Changes take effect on ${nextBillingDate}.`,
    };
  },

  /**
   * Process all Stripe webhook events (unified endpoint)
   * Handles subscription lifecycle, payment events, and one-time purchases
   * Includes duplicate event protection and proper error handling
   * 
   * @param ctx - Convex action context
   * @param args - Object containing webhook signature and payload
   * @returns Promise resolving to success/error status
   * @throws Error for missing webhook secret, invalid signature, or processing failures
   */
  async processWebhook(
    ctx: ActionCtx,
    args: { signature: string; payload: string }
  ) {
    const { signature, payload } = args;

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2025-02-24.acacia",
    });

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

    // Validate webhook requirements
    if (!webhookSecret) {
      return { success: false, error: "Webhook secret not configured" };
    }

    if (!signature) {
      return { success: false, error: "No signature provided" };
    }

    if (!payload) {
      return { success: false, error: "No payload provided" };
    }

    try {
      const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);

      // Check for duplicate events
      const existingEvent = await ctx.runQuery(
        internal.queries.payments.getEventByStripeId,
        { stripeEventId: event.id }
      );

      if (existingEvent) {
        return { success: true };
      }

      // Route events to appropriate handlers
      switch (event.type) {
        // Subscription events
        case "customer.subscription.created":
          await this.handleSubscriptionCreated(ctx, event);
          break;

        case "customer.subscription.updated":
          await this.handleSubscriptionUpdated(ctx, event);
          break;

        case "customer.subscription.deleted":
          await this.handleSubscriptionDeleted(ctx, event);
          break;

        case "invoice.payment_succeeded":
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
          // No action needed for charge events
          break;

        // Invoice events (different variations Stripe sends)
        case "invoice.paid":
          await this.handlePaymentSucceeded(ctx, event);
          break;

        // Note: invoice_payment.paid might be a custom event type, handle it with caution
        // case "invoice_payment.paid":
        //   console.log(`[WEBHOOK DEBUG] 🎯 Invoice payment paid event detected - treating as invoice.payment_succeeded`);  
        //   await this.handlePaymentSucceeded(ctx, event);
        //   break;

        default:
          // Unhandled event types are logged but don't cause errors
          break;
      }

      return { success: true };
    } catch (error) {
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


    if (!userId) {
      throw new Error("Missing userId in subscription created event metadata");
    }

    let creditAmount: number;
    let pricePerCycle: number;
    let planName: string;


    if (isDynamicSubscription) {
      // Handle dynamic subscription
      creditAmount = parseInt(subscription.metadata?.creditAmount || "0");
      pricePerCycle = parseInt(subscription.metadata?.priceInCents || "0");
      planName = getSubscriptionProductName(creditAmount);


      if (!creditAmount || !pricePerCycle) {
        throw new Error(`Missing dynamic subscription metadata: creditAmount=${creditAmount}, pricePerCycle=${pricePerCycle}`);
      }
    } else {
      // Handle predefined plan subscription
      const planId = subscription.metadata?.planId as SubscriptionPlan;
      if (!planId) {
        throw new Error("Missing planId in predefined subscription metadata");
      }

      const plan = SUBSCRIPTION_PLANS[planId];
      creditAmount = plan.credits;
      pricePerCycle = plan.priceInCents;
      planName = plan.planName;

    }


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

    } catch (error) {
      throw new Error(`Failed to create subscription in database: ${(error as Error).message}`);
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
      // Subscription not found - might be out-of-order webhook, skip silently
      return;
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
      throw new Error(`Failed to update subscription ${subscription.id}: ${(error as Error).message}`);
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
      // Subscription not found - might be out-of-order webhook, skip silently
      return;
    }

    try {
      await ctx.runMutation(internal.mutations.payments.updateSubscription, {
        stripeSubscriptionId: subscription.id,
        status: "canceled",
        endedAt: Date.now(),
      });
    } catch (error) {
      throw new Error(`Failed to delete subscription ${subscription.id}: ${(error as Error).message}`);
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
    const invoice = event.data.object as Stripe.Invoice;

    if (invoice.subscription && (
      invoice.billing_reason === "subscription_cycle" ||
      invoice.billing_reason === "subscription_create"
    )) {
      // This is a subscription payment (initial or renewal) - allocate credits
      const subscription = await ctx.runQuery(
        internal.queries.payments.getSubscriptionByStripeId,
        { stripeSubscriptionId: invoice.subscription as string }
      );


      if (subscription) {
        // Check if this payment was already processed manually (to prevent double allocation)
        const recentEvents = await ctx.runQuery(internal.queries.payments.getEventByStripeId, {
          stripeEventId: event.id,
        });

        if (recentEvents) {
          return;
        }

        // Check for recent manual operations (reactivation/update) within last 5 minutes
        const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);

        // Update subscription status to active if it was incomplete
        if (subscription.status === "incomplete") {
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
      }
    }
  },

  /**
   * Create one-time credit purchase checkout session
   * Allows purchasing 1-200 credits as a one-time payment (not subscription)
   * Uses centralized pricing with discounts for larger packs
   * 
   * @param ctx - Convex action context
   * @param args - Object containing creditAmount (1-200), userId, and userEmail
   * @returns Promise resolving to checkout URL and session ID
   * @throws Error for invalid parameters, missing environment variables, or Stripe failures
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

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2025-02-24.acacia",
    });

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
            currency: "eur",
            product_data: {
              name: getOneTimeProductName(creditAmount),
              description: getOneTimeProductDescription(creditAmount),
            },
            unit_amount: pricing.priceInCents,
          },
          quantity: 1,
        },
      ],
      success_url: generatePaymentSuccessLink("{CHECKOUT_SESSION_ID}", "purchase"),
      cancel_url: generatePaymentCancelLink("purchase"),
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
        return null;
      }
    }
    console.warn(`No one-time purchase found for session ${session.id}`);
    return null;
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