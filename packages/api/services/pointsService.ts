/**
 * Points Service - Loyalty Points System
 * 
 * Manages the loyalty points that users earn from class bookings.
 * Points are EARNED (3% cashback), never purchased.
 * Points can be redeemed for perks like free classes or merchandise.
 */

import { MutationCtx, QueryCtx } from "../convex/_generated/server";
import { Id, Doc } from "../convex/_generated/dataModel";
import { ConvexError } from "convex/values";

// Points configuration
export const POINTS_CONFIG = {
  // Cashback percentage for class bookings (3% = 0.03)
  BOOKING_CASHBACK_RATE: 0.03,

  // Redemption costs
  FREE_CLASS_POINTS: 2000,      // Points needed for a free class
  TSHIRT_POINTS: 5000,          // Points needed for a t-shirt

  // Future: point expiration (not implemented yet)
  EXPIRATION_DAYS: null,        // null = no expiration
};

/**
 * Calculate points to award for a booking payment
 * @param amountInCents - The amount paid in cents
 * @returns The number of points to award (rounded down)
 */
export function calculatePointsForPurchase(amountInCents: number): number {
  return Math.floor(amountInCents * POINTS_CONFIG.BOOKING_CASHBACK_RATE);
}

export const pointsService = {
  /**
   * Get user's current points balance
   */
  getBalance: async (
    ctx: QueryCtx,
    args: { userId: Id<"users"> }
  ): Promise<{ balance: number }> => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new ConvexError({
        message: "User not found",
        code: "USER_NOT_FOUND",
      });
    }

    return { balance: user.points ?? 0 };
  },

  /**
   * Add points to a user's balance
   * Used for booking cashback, gifts, referrals, etc.
   */
  addPoints: async (
    ctx: MutationCtx,
    args: {
      userId: Id<"users">;
      amount: number;
      type: "earn" | "gift";
      reason: "booking_cashback" | "referral_bonus" | "welcome_bonus" | "admin_gift" | "campaign_bonus";
      description: string;
      bookingId?: Id<"bookings">;
      classInstanceId?: Id<"classInstances">;
      initiatedBy?: Id<"users">;
    }
  ): Promise<{ newBalance: number; transactionId: Id<"pointTransactions"> }> => {
    const { userId, amount, type, reason, description, bookingId, classInstanceId, initiatedBy } = args;

    if (amount <= 0) {
      throw new ConvexError({
        message: "Points amount must be positive",
        code: "INVALID_AMOUNT",
      });
    }

    // Get current user
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new ConvexError({
        message: "User not found",
        code: "USER_NOT_FOUND",
      });
    }

    // Calculate new balance
    const currentPoints = user.points ?? 0;
    const newBalance = currentPoints + amount;

    // Update user's points balance
    await ctx.db.patch(userId, { points: newBalance });

    // Create transaction record
    const transactionId = await ctx.db.insert("pointTransactions", {
      userId,
      amount,
      type,
      reason,
      description,
      bookingId,
      classInstanceId,
      createdAt: Date.now(),
      createdBy: initiatedBy ?? userId,
    });

    return { newBalance, transactionId };
  },

  /**
   * Redeem points for a perk
   * Deducts points from user's balance
   */
  redeemPoints: async (
    ctx: MutationCtx,
    args: {
      userId: Id<"users">;
      amount: number;
      reason: "free_class" | "merchandise" | "other_perk";
      description: string;
      bookingId?: Id<"bookings">;
      classInstanceId?: Id<"classInstances">;
    }
  ): Promise<{ newBalance: number; transactionId: Id<"pointTransactions"> }> => {
    const { userId, amount, reason, description, bookingId, classInstanceId } = args;

    if (amount <= 0) {
      throw new ConvexError({
        message: "Points amount must be positive",
        code: "INVALID_AMOUNT",
      });
    }

    // Get current user
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new ConvexError({
        message: "User not found",
        code: "USER_NOT_FOUND",
      });
    }

    // Check sufficient balance
    const currentPoints = user.points ?? 0;
    if (currentPoints < amount) {
      throw new ConvexError({
        message: `Insufficient points. Required: ${amount}, Available: ${currentPoints}`,
        code: "INSUFFICIENT_POINTS",
      });
    }

    // Calculate new balance
    const newBalance = currentPoints - amount;

    // Update user's points balance
    await ctx.db.patch(userId, { points: newBalance });

    // Create transaction record (negative amount for redemption)
    const transactionId = await ctx.db.insert("pointTransactions", {
      userId,
      amount: -amount,
      type: "redeem",
      reason,
      description,
      bookingId,
      classInstanceId,
      createdAt: Date.now(),
      createdBy: userId,
    });

    return { newBalance, transactionId };
  },

  /**
   * Award booking cashback points
   * Convenience method for the standard 3% cashback flow
   */
  awardBookingCashback: async (
    ctx: MutationCtx,
    args: {
      userId: Id<"users">;
      bookingId: Id<"bookings">;
      classInstanceId: Id<"classInstances">;
      paidAmountInCents: number;
    }
  ): Promise<{ pointsAwarded: number; newBalance: number; transactionId: Id<"pointTransactions"> } | null> => {
    const pointsToAward = calculatePointsForPurchase(args.paidAmountInCents);

    // Don't create a transaction for 0 points
    if (pointsToAward <= 0) {
      return null;
    }

    const result = await pointsService.addPoints(ctx, {
      userId: args.userId,
      amount: pointsToAward,
      type: "earn",
      reason: "booking_cashback",
      description: `Earned ${pointsToAward} points from class booking`,
      bookingId: args.bookingId,
      classInstanceId: args.classInstanceId,
    });

    return {
      pointsAwarded: pointsToAward,
      newBalance: result.newBalance,
      transactionId: result.transactionId,
    };
  },

  /**
   * Check if user has enough points for a specific redemption
   */
  canRedeem: async (
    ctx: QueryCtx,
    args: { userId: Id<"users">; pointsRequired: number }
  ): Promise<boolean> => {
    const { balance } = await pointsService.getBalance(ctx, { userId: args.userId });
    return balance >= args.pointsRequired;
  },

  /**
   * Get user's point transaction history
   */
  getTransactionHistory: async (
    ctx: QueryCtx,
    args: {
      userId: Id<"users">;
      limit?: number;
    }
  ): Promise<Doc<"pointTransactions">[]> => {
    const limit = args.limit ?? 50;

    const transactions = await ctx.db
      .query("pointTransactions")
      .withIndex("by_user_created", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(limit);

    return transactions;
  },

  /**
   * Get points analytics for a user
   */
  getAnalytics: async (
    ctx: QueryCtx,
    args: { userId: Id<"users"> }
  ): Promise<{
    totalEarned: number;
    totalRedeemed: number;
    totalGifted: number;
    currentBalance: number;
  }> => {
    const transactions = await ctx.db
      .query("pointTransactions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    let totalEarned = 0;
    let totalRedeemed = 0;
    let totalGifted = 0;

    for (const tx of transactions) {
      if (tx.type === "earn") {
        totalEarned += tx.amount;
      } else if (tx.type === "redeem") {
        totalRedeemed += Math.abs(tx.amount);
      } else if (tx.type === "gift") {
        totalGifted += tx.amount;
      }
    }

    const { balance } = await pointsService.getBalance(ctx, { userId: args.userId });

    return {
      totalEarned,
      totalRedeemed,
      totalGifted,
      currentBalance: balance,
    };
  },
};


