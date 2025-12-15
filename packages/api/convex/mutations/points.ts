import { v } from "convex/values";
import { internalMutation, mutation } from "../_generated/server";
import { pointsService, calculatePointsForPurchase } from "../../services/pointsService";
import { getAuthenticatedUserOrThrow } from "../utils";

/**
 * Award booking cashback points (internal)
 * Called by webhook after successful payment
 */
export const awardBookingCashback = internalMutation({
  args: {
    userId: v.id("users"),
    bookingId: v.id("bookings"),
    classInstanceId: v.id("classInstances"),
    paidAmountInCents: v.number(),
  },
  returns: v.union(
    v.null(),
    v.object({
      pointsAwarded: v.number(),
      newBalance: v.number(),
      transactionId: v.id("pointTransactions"),
    })
  ),
  handler: async (ctx, args) => {
    const result = await pointsService.awardBookingCashback(ctx, args);

    // Update booking with points awarded
    if (result) {
      await ctx.db.patch(args.bookingId, {
        pointsAwarded: result.pointsAwarded,
      });
    }

    return result;
  },
});

/**
 * Add points to user (internal - for gifts/bonuses)
 */
export const addPoints = internalMutation({
  args: {
    userId: v.id("users"),
    amount: v.number(),
    type: v.union(v.literal("earn"), v.literal("gift")),
    reason: v.union(
      v.literal("booking_cashback"),
      v.literal("referral_bonus"),
      v.literal("welcome_bonus"),
      v.literal("admin_gift"),
      v.literal("campaign_bonus")
    ),
    description: v.string(),
    bookingId: v.optional(v.id("bookings")),
    classInstanceId: v.optional(v.id("classInstances")),
    initiatedBy: v.optional(v.id("users")),
  },
  returns: v.object({
    newBalance: v.number(),
    transactionId: v.id("pointTransactions"),
  }),
  handler: async (ctx, args) => {
    return pointsService.addPoints(ctx, args);
  },
});

/**
 * Redeem points for a perk (public mutation)
 */
export const redeemPoints = mutation({
  args: {
    amount: v.number(),
    reason: v.union(
      v.literal("free_class"),
      v.literal("merchandise"),
      v.literal("other_perk")
    ),
    description: v.string(),
    bookingId: v.optional(v.id("bookings")),
    classInstanceId: v.optional(v.id("classInstances")),
  },
  returns: v.object({
    newBalance: v.number(),
    transactionId: v.id("pointTransactions"),
  }),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUserOrThrow(ctx);
    return pointsService.redeemPoints(ctx, {
      userId: user._id,
      ...args,
    });
  },
});


