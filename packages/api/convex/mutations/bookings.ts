import { Infer, v } from "convex/values";
import { getAuthenticatedUserOrThrow } from "../utils";
import { bookingService } from "../../services/bookingService";
import { mutationWithTriggers, internalMutationWithTriggers } from "../triggers";
import { questionnaireAnswersFields } from "../schema";

// Questionnaire answer input validator (without feeApplied - will be calculated server-side)
const questionnaireAnswerInputValidator = v.object({
  questionId: v.string(),
  booleanAnswer: v.optional(v.boolean()),
  singleSelectAnswer: v.optional(v.string()),
  multiSelectAnswer: v.optional(v.array(v.string())),
  numberAnswer: v.optional(v.number()),
  textAnswer: v.optional(v.string()),
});

// Mutation args validation
export const bookClassArgs = v.object({
  classInstanceId: v.id("classInstances"),
  idempotencyKey: v.optional(v.string()),
  description: v.optional(v.string()),
  // Pre-booking questionnaire answers (fees calculated server-side)
  questionnaireAnswers: v.optional(v.array(questionnaireAnswerInputValidator)),
});
export type BookClassArgs = Infer<typeof bookClassArgs>;


export const bookClass = mutationWithTriggers({
  args: bookClassArgs,
  returns: v.object({
    bookingId: v.id("bookings"),
    transactionId: v.string(),
  }),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUserOrThrow(ctx);

    // Delegate to service layer
    const result = await bookingService.bookClass({ ctx, args, user });
    return result;
  },
});

export const cancelBooking = mutationWithTriggers({
  args: v.object({
    bookingId: v.id("bookings"),
    reason: v.optional(v.string()),
    cancelledBy: v.union(v.literal("consumer"), v.literal("business")),
  }),
  returns: v.object({
    success: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUserOrThrow(ctx);

    const result = await bookingService.cancelBooking({ ctx, args, user });

    return result;
  },
});

export const deleteBooking = mutationWithTriggers({
  args: v.object({
    bookingId: v.id("bookings"),
  }),
  returns: v.object({
    success: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUserOrThrow(ctx);
    const result = await bookingService.deleteBooking({ ctx, args, user });
    return result;
  },
});

export const allowRebooking = mutationWithTriggers({
  args: v.object({
    bookingId: v.id("bookings"),
  }),
  returns: v.object({
    success: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUserOrThrow(ctx);
    const result = await bookingService.allowRebooking({ ctx, args, user });
    return result;
  },
});

/***************************************************************
 * Approve Booking
 * Business approves a booking that requires confirmation
 ***************************************************************/
export const approveBooking = mutationWithTriggers({
  args: v.object({
    bookingId: v.id("bookings"),
  }),
  returns: v.object({
    success: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUserOrThrow(ctx);
    const result = await bookingService.approveBooking({ ctx, args, user });
    return result;
  },
});

/***************************************************************
 * Reject Booking
 * Business rejects a booking that requires confirmation
 * Full refund is issued to the user
 ***************************************************************/
export const rejectBooking = mutationWithTriggers({
  args: v.object({
    bookingId: v.id("bookings"),
    reason: v.optional(v.string()),
  }),
  returns: v.object({
    success: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUserOrThrow(ctx);
    const result = await bookingService.rejectBooking({ ctx, args, user });
    return result;
  },
});

export const completeBooking = mutationWithTriggers({
  args: v.object({
    bookingId: v.id("bookings"),
  }),
  returns: v.object({
    success: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUserOrThrow(ctx);
    const result = await bookingService.completeBooking({ ctx, args, user });
    return result;
  },
});

/***************************************************************
 * Create Paid Booking (Internal)
 * Called by webhook after successful Stripe payment
 * Creates a booking for direct class payment (no credits)
 ***************************************************************/
export const createPaidBooking = internalMutationWithTriggers({
  args: {
    userId: v.id("users"),
    classInstanceId: v.id("classInstances"),
    pendingBookingId: v.id("pendingBookings"),
    stripePaymentIntentId: v.string(),
    paidAmount: v.number(),
    originalPrice: v.number(),
    finalPrice: v.number(),
    appliedDiscount: v.optional(v.object({
      source: v.union(v.literal("template_rule"), v.literal("instance_rule")),
      discountType: v.union(v.literal("percentage"), v.literal("fixed_amount")),
      creditsSaved: v.number(),
      ruleName: v.string(),
    })),
    questionnaireAnswers: v.optional(v.object(questionnaireAnswersFields)),
  },
  returns: v.object({
    bookingId: v.id("bookings"),
  }),
  handler: async (ctx, args) => {
    const now = Date.now();

    // Get class instance for data
    const instance = await ctx.db.get(args.classInstanceId);
    if (!instance) {
      throw new Error("Class instance not found");
    }

    // Get user for snapshot
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Get venue for snapshot
    const venue = await ctx.db.get(instance.venueId);

    // Determine initial status (based on requiresConfirmation)
    const requiresConfirmation = instance.requiresConfirmation ?? false;
    const initialStatus = requiresConfirmation ? "awaiting_approval" : "pending";

    // Get platform fee rate from system settings or use default
    const platformFeeRate = 0.20; // 20% default

    // Create the booking
    const bookingId = await ctx.db.insert("bookings", {
      businessId: instance.businessId,
      userId: args.userId,
      classInstanceId: args.classInstanceId,
      userSnapshot: {
        name: user.name,
        email: user.email,
        phone: user.phone,
      },
      classInstanceSnapshot: {
        startTime: instance.startTime,
        endTime: instance.endTime,
        name: instance.name ?? instance.templateSnapshot?.name,
        status: instance.status,
        cancellationWindowHours: instance.cancellationWindowHours,
        instructor: instance.instructor ?? instance.templateSnapshot?.instructor,
      },
      venueSnapshot: {
        name: venue?.name,
      },
      status: initialStatus,
      originalPrice: args.originalPrice,
      finalPrice: args.finalPrice,
      creditTransactionId: `stripe_${args.stripePaymentIntentId}`, // Use Stripe ID as transaction ref
      platformFeeRate,
      appliedDiscount: args.appliedDiscount,
      stripePaymentIntentId: args.stripePaymentIntentId,
      paidAmount: args.paidAmount,
      bookedAt: now,
      questionnaireAnswers: args.questionnaireAnswers,
      createdAt: now,
      createdBy: args.userId,
    });

    // Increment instance booked count
    await ctx.db.patch(args.classInstanceId, {
      bookedCount: (instance.bookedCount ?? 0) + 1,
      updatedAt: now,
      updatedBy: args.userId,
    });

    return { bookingId };
  },
});

/***************************************************************
 * Update Booking Cancellation (Internal)
 * Called by cancelBookingWithRefund action after Stripe refund is processed
 * Updates booking status and refund information
 ***************************************************************/
export const updateBookingCancellation = internalMutationWithTriggers({
  args: {
    bookingId: v.id("bookings"),
    cancelledBy: v.union(v.literal("consumer"), v.literal("business")),
    reason: v.optional(v.string()),
    refundedAmount: v.number(),
    stripeRefundId: v.optional(v.string()),
    classInstanceId: v.id("classInstances"),
  },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, args) => {
    const now = Date.now();

    // Get booking to verify it exists
    const booking = await ctx.db.get(args.bookingId);
    if (!booking) {
      throw new Error("Booking not found");
    }

    // Get class instance to decrement booked count
    const instance = await ctx.db.get(args.classInstanceId);
    if (!instance) {
      throw new Error("Class instance not found");
    }

    // Update booking status and refund info
    await ctx.db.patch(args.bookingId, {
      status: args.cancelledBy === "consumer" ? "cancelled_by_consumer" : "cancelled_by_business",
      cancelledAt: now,
      cancelledBy: args.cancelledBy,
      refundAmount: args.refundedAmount,
      refundedAmount: args.refundedAmount,
      stripeRefundId: args.stripeRefundId,
      ...(args.cancelledBy === "business" && args.reason ? { cancelByBusinessReason: args.reason } : {}),
      updatedAt: now,
    });

    // Decrease booked count
    await ctx.db.patch(args.classInstanceId, {
      bookedCount: Math.max(0, (instance.bookedCount ?? 0) - 1),
      updatedAt: now,
    });

    return { success: true };
  },
});

/***************************************************************
 * Update Booking Rejection (Internal)
 * Called by rejectBookingWithRefund action after Stripe refund is processed
 * Updates booking status to rejected_by_business with refund info
 ***************************************************************/
export const updateBookingRejection = internalMutationWithTriggers({
  args: {
    bookingId: v.id("bookings"),
    reason: v.optional(v.string()),
    refundedAmount: v.number(),
    stripeRefundId: v.optional(v.string()),
    classInstanceId: v.id("classInstances"),
  },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, args) => {
    const now = Date.now();

    // Get booking to verify it exists
    const booking = await ctx.db.get(args.bookingId);
    if (!booking) {
      throw new Error("Booking not found");
    }

    // Get class instance to decrement booked count
    const instance = await ctx.db.get(args.classInstanceId);
    if (!instance) {
      throw new Error("Class instance not found");
    }

    // Update booking status to rejected with refund info
    await ctx.db.patch(args.bookingId, {
      status: "rejected_by_business",
      rejectedAt: now,
      rejectByBusinessReason: args.reason,
      refundAmount: args.refundedAmount,
      refundedAmount: args.refundedAmount,
      stripeRefundId: args.stripeRefundId,
      updatedAt: now,
    });

    // Decrease booked count
    await ctx.db.patch(args.classInstanceId, {
      bookedCount: Math.max(0, (instance.bookedCount ?? 0) - 1),
      updatedAt: now,
    });

    return { success: true };
  },
});