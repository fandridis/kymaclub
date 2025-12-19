/**
 * Reservation Service - Temporary Seat Reservations During Payment
 * 
 * Manages the temporary seat reservation system that holds a spot for 10 minutes
 * while a user completes their Stripe payment. This prevents double-booking.
 * 
 * Flow:
 * 1. User taps "Book Class" → createReservation() holds a seat
 * 2. User completes Stripe Payment Sheet
 * 3. Webhook receives payment_intent.succeeded → confirmReservation() creates booking
 * 4. If payment fails/times out → reservation expires automatically
 */

import { MutationCtx, QueryCtx, ActionCtx } from "../convex/_generated/server";
import { Id, Doc } from "../convex/_generated/dataModel";
import { ConvexError } from "convex/values";

// Reservation configuration
export const RESERVATION_CONFIG = {
  // How long a seat is reserved during payment (10 minutes)
  RESERVATION_TTL_MS: 10 * 60 * 1000,

  // How often to run the expiration cleanup job (2 minutes)
  EXPIRATION_CHECK_INTERVAL_MS: 2 * 60 * 1000,
};

export const reservationService = {
  /**
   * Create a new seat reservation
   * Called when user initiates payment for a class
   */
  createReservation: async (
    ctx: MutationCtx,
    args: {
      userId: Id<"users">;
      classInstanceId: Id<"classInstances">;
      stripePaymentIntentId: string;
      priceInCents: number;
      originalPriceInCents: number;
      appliedDiscount?: {
        source: "template_rule" | "instance_rule";
        discountType: "percentage" | "fixed_amount";
        discountValue: number;
        ruleName: string;
      };
      questionnaireAnswers?: Doc<"bookings">["questionnaireAnswers"];
      platformFeeRate?: number;
    }
  ): Promise<{ pendingBookingId: Id<"pendingBookings">; expiresAt: number }> => {
    const now = Date.now();
    const expiresAt = now + RESERVATION_CONFIG.RESERVATION_TTL_MS;

    // Get class instance and template to check capacity
    const instance = await ctx.db.get(args.classInstanceId);
    if (!instance) {
      throw new ConvexError({
        message: "Class not found",
        code: "CLASS_NOT_FOUND",
      });
    }

    // Check if class has already started
    if (instance.startTime <= now) {
      throw new ConvexError({
        message: "Class has already started",
        code: "CLASS_STARTED",
      });
    }

    // Check if class is cancelled
    if (instance.status === "cancelled") {
      throw new ConvexError({
        message: "Class has been cancelled",
        code: "CLASS_CANCELLED",
      });
    }

    // Check capacity including pending reservations
    const effectiveCapacity = instance.capacity;
    if (effectiveCapacity) {
      const effectiveBookedCount = await reservationService.getEffectiveBookedCount(
        ctx,
        { classInstanceId: args.classInstanceId }
      );

      if (effectiveBookedCount >= effectiveCapacity) {
        throw new ConvexError({
          message: "Class is full",
          code: "CLASS_FULL",
        });
      }
    }

    // Check if user already has an active reservation for this class
    const existingReservation = await ctx.db
      .query("pendingBookings")
      .withIndex("by_class_instance_status", (q) =>
        q.eq("classInstanceId", args.classInstanceId).eq("status", "pending")
      )
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .first();

    if (existingReservation) {
      throw new ConvexError({
        message: "You already have a pending reservation for this class",
        code: "DUPLICATE_RESERVATION",
      });
    }

    // Check if user already has a confirmed booking for this class
    const existingBooking = await ctx.db
      .query("bookings")
      .withIndex("by_user_class", (q) =>
        q.eq("userId", args.userId).eq("classInstanceId", args.classInstanceId)
      )
      .filter((q) =>
        q.and(
          q.neq(q.field("deleted"), true),
          q.or(
            q.eq(q.field("status"), "pending"),
            q.eq(q.field("status"), "awaiting_approval")
          )
        )
      )
      .first();

    if (existingBooking) {
      throw new ConvexError({
        message: "You already have a booking for this class",
        code: "DUPLICATE_BOOKING",
      });
    }

    // Create the pending booking
    const pendingBookingId = await ctx.db.insert("pendingBookings", {
      userId: args.userId,
      classInstanceId: args.classInstanceId,
      businessId: instance.businessId,
      stripePaymentIntentId: args.stripePaymentIntentId,
      status: "pending",
      priceInCents: args.priceInCents,
      originalPriceInCents: args.originalPriceInCents,
      appliedDiscount: args.appliedDiscount,
      questionnaireAnswers: args.questionnaireAnswers,
      platformFeeRate: args.platformFeeRate,
      expiresAt,
      createdAt: now,
      createdBy: args.userId,
    });

    return { pendingBookingId, expiresAt };
  },

  /**
   * Get effective booked count including pending reservations
   * Used for accurate capacity checking
   */
  getEffectiveBookedCount: async (
    ctx: QueryCtx,
    args: { classInstanceId: Id<"classInstances"> }
  ): Promise<number> => {
    const now = Date.now();

    // Get confirmed bookings count
    const instance = await ctx.db.get(args.classInstanceId);
    const confirmedCount = instance?.bookedCount ?? 0;

    // Get active pending reservations count
    const pendingReservations = await ctx.db
      .query("pendingBookings")
      .withIndex("by_class_instance_status", (q) =>
        q.eq("classInstanceId", args.classInstanceId).eq("status", "pending")
      )
      .filter((q) => q.gt(q.field("expiresAt"), now))
      .collect();

    return confirmedCount + pendingReservations.length;
  },

  /**
   * Confirm a reservation after successful payment
   * Called by webhook when payment_intent.succeeded
   */
  confirmReservation: async (
    ctx: MutationCtx,
    args: { stripePaymentIntentId: string }
  ): Promise<{
    success: boolean;
    pendingBookingId?: Id<"pendingBookings">;
    alreadyConfirmed?: boolean;
  }> => {
    // Find the pending booking by PaymentIntent ID
    const pendingBooking = await ctx.db
      .query("pendingBookings")
      .withIndex("by_stripe_payment_intent", (q) =>
        q.eq("stripePaymentIntentId", args.stripePaymentIntentId)
      )
      .first();

    if (!pendingBooking) {
      // No pending booking found - might be a duplicate webhook or old reservation
      return { success: false };
    }

    // Check if already confirmed (idempotency)
    if (pendingBooking.status === "confirmed") {
      return {
        success: true,
        pendingBookingId: pendingBooking._id,
        alreadyConfirmed: true
      };
    }

    // Check if reservation has expired
    if (pendingBooking.status === "expired") {
      throw new ConvexError({
        message: "Reservation has expired",
        code: "RESERVATION_EXPIRED",
      });
    }

    // Mark as confirmed
    await ctx.db.patch(pendingBooking._id, {
      status: "confirmed",
      confirmedAt: Date.now(),
    });

    return {
      success: true,
      pendingBookingId: pendingBooking._id
    };
  },

  /**
   * Get pending booking by ID
   */
  getPendingBooking: async (
    ctx: QueryCtx,
    args: { pendingBookingId: Id<"pendingBookings"> }
  ): Promise<Doc<"pendingBookings"> | null> => {
    return ctx.db.get(args.pendingBookingId);
  },

  /**
   * Get pending booking by Stripe PaymentIntent ID
   */
  getPendingBookingByPaymentIntent: async (
    ctx: QueryCtx,
    args: { stripePaymentIntentId: string }
  ): Promise<Doc<"pendingBookings"> | null> => {
    return ctx.db
      .query("pendingBookings")
      .withIndex("by_stripe_payment_intent", (q) =>
        q.eq("stripePaymentIntentId", args.stripePaymentIntentId)
      )
      .first();
  },

  /**
   * Cancel a reservation (user cancelled payment)
   */
  cancelReservation: async (
    ctx: MutationCtx,
    args: { pendingBookingId: Id<"pendingBookings"> }
  ): Promise<{ success: boolean }> => {
    const pendingBooking = await ctx.db.get(args.pendingBookingId);
    if (!pendingBooking) {
      return { success: false };
    }

    if (pendingBooking.status === "pending") {
      await ctx.db.patch(args.pendingBookingId, {
        status: "cancelled",
      });
    }

    return { success: true };
  },

  /**
   * Mark a reservation as failed (payment failed)
   */
  failReservation: async (
    ctx: MutationCtx,
    args: { stripePaymentIntentId: string }
  ): Promise<{ success: boolean }> => {
    const pendingBooking = await ctx.db
      .query("pendingBookings")
      .withIndex("by_stripe_payment_intent", (q) =>
        q.eq("stripePaymentIntentId", args.stripePaymentIntentId)
      )
      .first();

    if (!pendingBooking) {
      return { success: false };
    }

    if (pendingBooking.status === "pending") {
      await ctx.db.patch(pendingBooking._id, {
        status: "failed",
      });
    }

    return { success: true };
  },

  /**
   * Expire old reservations
   * Called by scheduled job every 2 minutes
   */
  expireReservations: async (
    ctx: MutationCtx
  ): Promise<{ expiredCount: number }> => {
    const now = Date.now();

    // Find all pending reservations that have expired
    const expiredReservations = await ctx.db
      .query("pendingBookings")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .filter((q) => q.lt(q.field("expiresAt"), now))
      .collect();

    // Mark them as expired
    for (const reservation of expiredReservations) {
      await ctx.db.patch(reservation._id, {
        status: "expired",
      });
    }

    return { expiredCount: expiredReservations.length };
  },

  /**
   * Link a booking ID to a pending booking after it's been created
   */
  linkBooking: async (
    ctx: MutationCtx,
    args: {
      pendingBookingId: Id<"pendingBookings">;
      bookingId: Id<"bookings">
    }
  ): Promise<{ success: boolean }> => {
    await ctx.db.patch(args.pendingBookingId, {
      bookingId: args.bookingId,
    });
    return { success: true };
  },

  /**
   * Check if a class has availability (considering pending reservations)
   */
  hasAvailability: async (
    ctx: QueryCtx,
    args: { classInstanceId: Id<"classInstances"> }
  ): Promise<{ available: boolean; spotsLeft: number }> => {
    const instance = await ctx.db.get(args.classInstanceId);
    if (!instance) {
      return { available: false, spotsLeft: 0 };
    }

    const capacity = instance.capacity;
    if (!capacity) {
      // No capacity limit
      return { available: true, spotsLeft: Infinity };
    }

    const effectiveBookedCount = await reservationService.getEffectiveBookedCount(
      ctx,
      { classInstanceId: args.classInstanceId }
    );

    const spotsLeft = Math.max(0, capacity - effectiveBookedCount);

    return {
      available: spotsLeft > 0,
      spotsLeft,
    };
  },
};


