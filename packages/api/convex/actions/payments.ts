"use node";

import { v } from "convex/values";
import { action, internalAction } from "../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "../_generated/api";
import { paymentsService } from "../../services/paymentsService";
import { Doc, Id } from "../_generated/dataModel";
import Stripe from "stripe";
import { buildQuestionnaireAnswersWithFees } from "../../operations/questionnaire";

// Lazy initialization of Stripe client to avoid crashes in test environment where key is missing
const getStripe = () => {
  const key = process.env.STRIPE_SECRET_KEY || "sk_test_dummy";
  return new Stripe(key, {
    apiVersion: "2025-02-24.acacia",
  });
};

/**
 * Create dynamic subscription checkout for 5-500 credits
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

    const result = await paymentsService.createDynamicSubscriptionCheckout(ctx, {
      creditAmount,
      userId,
      userEmail,
    });

    return result;
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
 * @deprecated Use createClassPaymentIntent for direct class payments instead
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

/***************************************************************
 * NEW DIRECT CLASS PAYMENT FLOW
 * Creates PaymentIntent for in-app Stripe Payment Sheet
 ***************************************************************/

/**
 * Create a PaymentIntent for direct class booking
 * Used with Stripe Payment Sheet in the mobile app
 * 
 * Flow:
 * 1. App calls this action to get PaymentIntent credentials
 * 2. App presents Stripe Payment Sheet (in-app, no redirect)
 * 3. User completes payment
 * 4. Webhook receives payment_intent.succeeded → booking is created
 */
export const createClassPaymentIntent = action({
  args: {
    classInstanceId: v.id("classInstances"),
    // Questionnaire answers captured at booking time
    questionnaireAnswers: v.optional(v.array(v.object({
      questionId: v.string(),
      booleanAnswer: v.optional(v.boolean()),
      singleSelectAnswer: v.optional(v.string()),
      multiSelectAnswer: v.optional(v.array(v.string())),
      numberAnswer: v.optional(v.number()),
      textAnswer: v.optional(v.string()),
      feeApplied: v.number(),
    }))),
  },
  returns: v.object({
    paymentIntentClientSecret: v.string(),
    ephemeralKey: v.string(),
    customerId: v.string(),
    pendingBookingId: v.id("pendingBookings"),
    priceInCents: v.number(),
    expiresAt: v.number(),
  }),
  handler: async (
    ctx,
    { classInstanceId, questionnaireAnswers }
  ): Promise<{
    paymentIntentClientSecret: string;
    ephemeralKey: string;
    customerId: string;
    pendingBookingId: Id<"pendingBookings">;
    priceInCents: number;
    expiresAt: number;
  }> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be authenticated to book a class");
    }

    // Get user info for Stripe customer
    const authUser = await ctx.auth.getUserIdentity();
    let userEmail = authUser?.email;

    const dbUser: Doc<"users"> | null = await ctx.runQuery(
      internal.queries.core.getUserById,
      { userId }
    );

    if (!userEmail) {
      userEmail = dbUser?.email;
    }

    if (!userEmail) {
      throw new Error("User email is required for payment. Please update your profile.");
    }

    // Get class instance details for pricing
    const classDetails = await ctx.runQuery(
      internal.queries.classInstances.getClassInstanceForPayment,
      { classInstanceId }
    );

    if (!classDetails) {
      throw new Error("Class not found");
    }

    // Calculate price (use finalPrice which includes any discounts)
    const priceInCents = classDetails.finalPrice;
    const originalPriceInCents = classDetails.originalPrice;

    // IMPORTANT: Never trust feeApplied from the client. Recalculate fees from the class questionnaire snapshot.
    const normalizedQuestionnaireAnswers = questionnaireAnswers
      ? buildQuestionnaireAnswersWithFees(
        classDetails.questionnaire ?? [],
        questionnaireAnswers.map(({ feeApplied: _feeApplied, ...rest }) => rest)
      )
      : null;

    const questionnaireFeesInCents = normalizedQuestionnaireAnswers?.totalFees ?? 0;
    const totalAmountInCents = priceInCents + questionnaireFeesInCents;

    // Get business details for Stripe Connect
    const business = await ctx.runQuery(internal.queries.businesses.getBusinessById, {
      businessId: classDetails.businessId,
    });

    if (!business) throw new Error("Business not found");

    if (!business.stripeConnectedAccountId || business.stripeConnectedAccountStatus !== "enabled") {
      throw new Error("Business cannot receive payments - Stripe setup incomplete");
    }

    // Calculate application fee
    const platformFeeRate = business.feeStructure.baseFeeRate ?? 0.20;
    const applicationFeeAmount = Math.round(totalAmountInCents * platformFeeRate);

    // Get or create Stripe customer
    let stripeCustomerId = dbUser?.stripeCustomerId;

    if (!stripeCustomerId) {
      // Create a new Stripe customer
      const customer = await getStripe().customers.create({
        email: userEmail,
        name: dbUser?.name ?? undefined,
        metadata: {
          convexUserId: userId,
        },
      });
      stripeCustomerId = customer.id;

      // Save customer ID to user record
      await ctx.runMutation(internal.mutations.users.updateStripeCustomerId, {
        userId,
        stripeCustomerId,
      });
    }

    // Create ephemeral key for the Payment Sheet
    const ephemeralKey = await getStripe().ephemeralKeys.create(
      { customer: stripeCustomerId },
      { apiVersion: "2024-06-20" }
    );

    // Create PaymentIntent
    const paymentIntent = await getStripe().paymentIntents.create({
      amount: totalAmountInCents,
      currency: "eur",
      customer: stripeCustomerId,
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        type: "class_booking",
        classInstanceId,
        userId,
        originalPriceInCents: String(originalPriceInCents),
        hasDiscount: classDetails.hasDiscount ? "true" : "false",
        discountRuleName: classDetails.discountRuleName ?? "",
        questionnaireFeesInCents: String(questionnaireFeesInCents),
        totalAmountInCents: String(totalAmountInCents),
        platformFeeRate: String(platformFeeRate),
      },
      application_fee_amount: applicationFeeAmount,
      transfer_data: {
        destination: business.stripeConnectedAccountId,
      },
    });

    // Create pending booking reservation
    const reservation = await ctx.runMutation(
      internal.mutations.reservations.createReservation,
      {
        userId,
        classInstanceId,
        stripePaymentIntentId: paymentIntent.id,
        priceInCents,
        originalPriceInCents,
        appliedDiscount: classDetails.hasDiscount ? {
          source: classDetails.discountSource as "template_rule" | "instance_rule",
          discountType: "fixed_amount" as const,
          discountValue: originalPriceInCents - priceInCents,
          ruleName: classDetails.discountRuleName ?? "Discount",
        } : undefined,
        questionnaireAnswers: normalizedQuestionnaireAnswers ?? undefined,
        // Store fee rate for reconciliation
        platformFeeRate,
      }
    );

    return {
      paymentIntentClientSecret: paymentIntent.client_secret!,
      ephemeralKey: ephemeralKey.secret!,
      customerId: stripeCustomerId,
      pendingBookingId: reservation.pendingBookingId,
      priceInCents,
      expiresAt: reservation.expiresAt,
    };
  },
});

/**
 * Cancel a pending class payment reservation
 * Called when user dismisses Payment Sheet without completing
 */
export const cancelClassPaymentIntent = action({
  args: {
    pendingBookingId: v.id("pendingBookings"),
    stripePaymentIntentId: v.string(),
  },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, { pendingBookingId, stripePaymentIntentId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be authenticated");
    }

    // Cancel the Stripe PaymentIntent
    try {
      await getStripe().paymentIntents.cancel(stripePaymentIntentId);
    } catch (error) {
      // PaymentIntent might already be cancelled or completed, ignore
      console.log("Could not cancel PaymentIntent:", error);
    }

    // Cancel the pending booking reservation
    await ctx.runMutation(
      internal.mutations.reservations.cancelReservation,
      { pendingBookingId }
    );

    return { success: true };
  },
});

/***************************************************************
 * BOOKING CANCELLATION WITH STRIPE REFUND
 * Handles cancellation of confirmed bookings with refund processing
 * 
 * Refund Policy:
 * - Business cancellation: 100% refund (no fee)
 * - User cancellation >= 12 hours before class: 100% refund minus cancellation fee
 * - User cancellation < 12 hours before class: 50% refund minus cancellation fee
 * - No-show: 0% refund (handled separately)
 * 
 * Cancellation Fee (consumer cancellations only):
 * - Under €10: €0.50
 * - €10-20: €1.00
 * - €21+: €2.00
 ***************************************************************/

/**
 * Calculate cancellation fee based on paid amount (tiered)
 */
function getCancellationFeeCents(paidAmountCents: number): number {
  const paidEuros = paidAmountCents / 100;
  if (paidEuros < 10) {
    return 50; // €0.50
  } else if (paidEuros <= 20) {
    return 100; // €1.00
  } else {
    return 200; // €2.00
  }
}

/**
 * Cancel a confirmed booking and process Stripe refund
 */
export const cancelBookingWithRefund = action({
  args: {
    bookingId: v.id("bookings"),
    reason: v.optional(v.string()),
    cancelledBy: v.union(v.literal("consumer"), v.literal("business")),
  },
  returns: v.object({
    success: v.boolean(),
    refundedAmount: v.number(),
    refundPercentage: v.number(),
    cancellationFee: v.number(),
  }),
  handler: async (ctx, { bookingId, reason, cancelledBy }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be authenticated");
    }

    // Get booking details
    const booking: Doc<"bookings"> | null = await ctx.runQuery(
      internal.queries.bookings.getBookingById,
      { bookingId }
    );

    if (!booking) {
      throw new Error("Booking not found");
    }

    // Authorization check
    const user: Doc<"users"> | null = await ctx.runQuery(
      internal.queries.core.getUserById,
      { userId }
    );

    if (!user) {
      throw new Error("User not found");
    }

    // Check authorization: user must be booking owner or business owner
    if (booking.userId !== userId && booking.businessId !== user.businessId) {
      throw new Error("You are not authorized to cancel this booking");
    }

    // Get class instance for timing calculations
    const classInstance = await ctx.runQuery(
      internal.queries.classInstances.getClassInstanceByIdInternal,
      { classInstanceId: booking.classInstanceId }
    );

    if (!classInstance) {
      throw new Error("Class instance not found");
    }

    // Calculate refund percentage based on policy
    const now = Date.now();
    const hoursUntilClass = (classInstance.startTime - now) / (1000 * 60 * 60);
    const paidAmount = booking.paidAmount ?? 0;

    // Check for free cancellation privilege (e.g., from class rescheduling by business)
    // This gives users 100% refund with no fee even for late cancellations
    const hasFreeCancel = booking.hasFreeCancel
      && booking.freeCancelExpiresAt
      && now <= booking.freeCancelExpiresAt;

    let refundPercentage: number;
    let cancellationFee: number;

    if (cancelledBy === "business") {
      // Business cancellations: 100% refund, no fee
      refundPercentage = 100;
      cancellationFee = 0;
    } else if (hasFreeCancel) {
      // Free cancel privilege active (class was rescheduled): 100% refund, no fee
      refundPercentage = 100;
      cancellationFee = 0;
    } else {
      // Consumer cancellations: 100% if >= 12 hours, 50% if < 12 hours
      refundPercentage = hoursUntilClass >= 12 ? 100 : 50;
      // Apply tiered cancellation fee
      cancellationFee = getCancellationFeeCents(paidAmount);
    }

    // Calculate refund amount: (paidAmount * percentage) - cancellation fee
    const grossRefund = Math.round((paidAmount * refundPercentage) / 100);
    const refundedAmount = Math.max(0, grossRefund - cancellationFee);

    // Process Stripe refund if there's a payment to refund
    let stripeRefundId: string | undefined;

    if (booking.stripePaymentIntentId && paidAmount > 0 && refundedAmount > 0) {
      try {
        const refund = await getStripe().refunds.create({
          payment_intent: booking.stripePaymentIntentId,
          amount: refundedAmount,
          reason: cancelledBy === "business" ? "requested_by_customer" : "requested_by_customer",
          metadata: {
            bookingId: booking._id,
            cancelledBy,
            refundPercentage: String(refundPercentage),
            cancellationFee: String(cancellationFee),
          },
        });
        stripeRefundId = refund.id;
      } catch (error: any) {
        console.error("Stripe refund error:", error);
        throw new Error(`Failed to process refund: ${error.message}`);
      }
    }

    // Update booking status via internal mutation
    await ctx.runMutation(
      internal.mutations.bookings.updateBookingCancellation,
      {
        bookingId,
        cancelledBy,
        reason,
        refundedAmount,
        stripeRefundId,
        classInstanceId: booking.classInstanceId,
      }
    );

    return {
      success: true,
      refundedAmount,
      refundPercentage,
      cancellationFee,
    };
  },
});

/***************************************************************
 * BOOKING REJECTION WITH STRIPE REFUND
 * Handles rejection of awaiting_approval bookings with full refund
 * 
 * Rejections always get 100% refund (no fee) since it's business-initiated
 ***************************************************************/

/**
 * Reject a booking that was awaiting approval and process full Stripe refund
 */
export const rejectBookingWithRefund = action({
  args: {
    bookingId: v.id("bookings"),
    reason: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    refundedAmount: v.number(),
  }),
  handler: async (ctx, { bookingId, reason }): Promise<{
    success: boolean;
    refundedAmount: number;
  }> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be authenticated");
    }

    // Get booking details
    const booking: Doc<"bookings"> | null = await ctx.runQuery(
      internal.queries.bookings.getBookingById,
      { bookingId }
    );

    if (!booking) {
      throw new Error("Booking not found");
    }

    // Only allow rejection of awaiting_approval bookings
    if (booking.status !== "awaiting_approval") {
      throw new Error(`Cannot reject booking with status: ${booking.status}`);
    }

    // Authorization check - must be business owner
    const user: Doc<"users"> | null = await ctx.runQuery(
      internal.queries.core.getUserById,
      { userId }
    );

    if (!user) {
      throw new Error("User not found");
    }

    if (booking.businessId !== user.businessId) {
      throw new Error("You are not authorized to reject this booking");
    }

    // Full refund for rejections (no fee)
    const paidAmount: number = booking.paidAmount ?? 0;
    const refundedAmount: number = paidAmount; // 100% refund

    // Process Stripe refund if there's a payment to refund
    let stripeRefundId: string | undefined;

    if (booking.stripePaymentIntentId && paidAmount > 0) {
      try {
        const refund = await getStripe().refunds.create({
          payment_intent: booking.stripePaymentIntentId,
          amount: refundedAmount,
          reason: "requested_by_customer",
          metadata: {
            bookingId: booking._id,
            rejectionReason: reason || "Rejected by business",
          },
        });
        stripeRefundId = refund.id;
      } catch (error: any) {
        console.error("Stripe refund error:", error);
        throw new Error(`Failed to process refund: ${error.message}`);
      }
    }

    // Update booking status via internal mutation
    await ctx.runMutation(
      internal.mutations.bookings.updateBookingRejection,
      {
        bookingId,
        reason,
        refundedAmount,
        stripeRefundId,
        classInstanceId: booking.classInstanceId,
      }
    );

    return {
      success: true,
      refundedAmount,
    };
  },
});

