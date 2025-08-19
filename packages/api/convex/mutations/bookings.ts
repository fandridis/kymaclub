import { mutation } from "../_generated/server";
import { Infer, v } from "convex/values";
import { getAuthenticatedUserOrThrow } from "../utils";
import { bookingService } from "../../services/bookingService";
import { mutationWithTriggers } from "../triggers";


// Mutation args validation
export const bookClassArgs = v.object({
  classInstanceId: v.id("classInstances"),
  idempotencyKey: v.optional(v.string()),
  description: v.optional(v.string()),
});
export type BookClassArgs = Infer<typeof bookClassArgs>;


export const bookClass = mutationWithTriggers({
  args: bookClassArgs,
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
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUserOrThrow(ctx);

    const result = await bookingService.cancelBooking({ ctx, args, user });

    return result;
  },
});