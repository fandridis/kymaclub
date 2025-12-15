import { v } from "convex/values";
import { internalQuery } from "../_generated/server";
import { reservationService } from "../../services/reservationService";

/**
 * Get pending booking by Stripe PaymentIntent ID
 */
export const getPendingBookingByPaymentIntent = internalQuery({
  args: {
    stripePaymentIntentId: v.string(),
  },
  handler: async (ctx, args) => {
    return reservationService.getPendingBookingByPaymentIntent(ctx, args);
  },
});

/**
 * Get pending booking by ID
 */
export const getPendingBookingById = internalQuery({
  args: {
    pendingBookingId: v.id("pendingBookings"),
  },
  handler: async (ctx, args) => {
    return reservationService.getPendingBooking(ctx, args);
  },
});

/**
 * Check if a class has availability (including pending reservations)
 */
export const hasAvailability = internalQuery({
  args: {
    classInstanceId: v.id("classInstances"),
  },
  handler: async (ctx, args) => {
    return reservationService.hasAvailability(ctx, args);
  },
});


