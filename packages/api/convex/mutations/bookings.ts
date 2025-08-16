import { mutation } from "../_generated/server";
import { Infer, v } from "convex/values";
import { getAuthenticatedUserOrThrow } from "../utils";
import { bookingService } from "../../services/bookingService";


// Mutation args validation
export const bookClassArgs = v.object({
  classInstanceId: v.id("classInstances"),
  idempotencyKey: v.optional(v.string()),
  description: v.optional(v.string()),
});
export type BookClassArgs = Infer<typeof bookClassArgs>;


export const bookClass = mutation({
  args: bookClassArgs,
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUserOrThrow(ctx);
    console.log("📍 MUTATION: bookClass - Starting request");
    /** This means that this endpoint requires authentication */
    /** This would mean that this endpoint requires the user to be associated with a business */
    // const business = await getBusinessOrThrow(ctx, user.businessId);


    // Delegate to service layer
    const result = await bookingService.bookClass({ ctx, args, user });
    return result;
  },
});

export const cancelBooking = mutation({
  args: v.object({
    bookingId: v.id("bookings"),
    reason: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUserOrThrow(ctx);
    console.log("📍 MUTATION: cancelBooking - Starting request");
    console.log("✅ MUTATION: Cancel booking validation passed");

    // Would delegate to cancelBookingService
    console.log("🔄 MUTATION: Delegating to cancel booking service");
    const result = await bookingService.cancelBooking({ ctx, args, user });

    console.log("🔄 MUTATION: Cancel booking service returned: ", result);
    return result;
  },
});