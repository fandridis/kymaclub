import { v } from "convex/values";
import { internalMutation } from "../_generated/server";
import { reservationService } from "../../services/reservationService";
import { questionnaireAnswersFields } from "../schema";

/**
 * Create a seat reservation for a class
 * Called by createClassPaymentIntent action
 */
export const createReservation = internalMutation({
  args: {
    userId: v.id("users"),
    classInstanceId: v.id("classInstances"),
    stripePaymentIntentId: v.string(),
    priceInCents: v.number(),
    originalPriceInCents: v.number(),
    appliedDiscount: v.optional(v.object({
      source: v.union(v.literal("template_rule"), v.literal("instance_rule")),
      discountType: v.union(v.literal("percentage"), v.literal("fixed_amount")),
      discountValue: v.number(),
      ruleName: v.string(),
    })),
    questionnaireAnswers: v.optional(v.object(questionnaireAnswersFields)),
    platformFeeRate: v.optional(v.number()),
  },
  returns: v.object({
    pendingBookingId: v.id("pendingBookings"),
    expiresAt: v.number(),
  }),
  handler: async (ctx, args) => {
    return reservationService.createReservation(ctx, args);
  },
});

/**
 * Cancel a seat reservation
 * Called when user cancels payment
 */
export const cancelReservation = internalMutation({
  args: {
    pendingBookingId: v.id("pendingBookings"),
  },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, args) => {
    return reservationService.cancelReservation(ctx, args);
  },
});

/**
 * Confirm a reservation after successful payment
 * Called by webhook handler
 */
export const confirmReservation = internalMutation({
  args: {
    stripePaymentIntentId: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    pendingBookingId: v.optional(v.id("pendingBookings")),
    alreadyConfirmed: v.optional(v.boolean()),
  }),
  handler: async (ctx, args) => {
    return reservationService.confirmReservation(ctx, args);
  },
});

/**
 * Mark a reservation as failed
 * Called when payment fails
 */
export const failReservation = internalMutation({
  args: {
    stripePaymentIntentId: v.string(),
  },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, args) => {
    return reservationService.failReservation(ctx, args);
  },
});

/**
 * Link a booking to a pending booking after creation
 */
export const linkBooking = internalMutation({
  args: {
    pendingBookingId: v.id("pendingBookings"),
    bookingId: v.id("bookings"),
  },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, args) => {
    return reservationService.linkBooking(ctx, args);
  },
});

/**
 * Expire old reservations
 * Called by scheduled job
 */
export const expireReservations = internalMutation({
  args: {},
  returns: v.object({ expiredCount: v.number() }),
  handler: async (ctx) => {
    return reservationService.expireReservations(ctx);
  },
});


