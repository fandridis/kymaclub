import { Infer, v } from "convex/values";
import { getAuthenticatedUserOrThrow } from "../utils";
import { bookingService } from "../../services/bookingService";
import { mutationWithTriggers } from "../triggers";

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