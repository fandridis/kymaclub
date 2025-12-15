/**
 * Coupon Service - Free Class and Promotional Coupons
 * 
 * Manages coupons that give users free classes or discounts.
 * Coupons are GIVEN (welcome bonus, referrals, admin gifts), never purchased.
 * This replaces the old welcome bonus credits system.
 */

import { MutationCtx, QueryCtx } from "../convex/_generated/server";
import { Id, Doc } from "../convex/_generated/dataModel";
import { ConvexError } from "convex/values";

// Coupon configuration
export const COUPON_CONFIG = {
  // Welcome bonus: 1 free class coupon
  WELCOME_BONUS_TYPE: "free_class" as const,
  WELCOME_BONUS_EXPIRY_DAYS: 30, // Expires after 30 days
};

export const couponService = {
  /**
   * Create a new coupon for a user
   */
  createCoupon: async (
    ctx: MutationCtx,
    args: {
      userId: Id<"users">;
      type: "free_class" | "discount_percent" | "discount_fixed";
      source: "welcome_bonus" | "referral" | "admin_gift" | "campaign";
      maxRedemptions?: number;
      expiresInDays?: number;
      discountValue?: number;
      initiatedBy?: Id<"users">;
    }
  ): Promise<{ couponId: Id<"userCoupons"> }> => {
    const {
      userId,
      type,
      source,
      maxRedemptions = 1,
      expiresInDays,
      discountValue,
      initiatedBy
    } = args;

    // Calculate expiration
    let expiresAt: number | undefined;
    if (expiresInDays) {
      expiresAt = Date.now() + (expiresInDays * 24 * 60 * 60 * 1000);
    }

    // Validate discount value for discount coupons
    if ((type === "discount_percent" || type === "discount_fixed") && !discountValue) {
      throw new ConvexError({
        message: "Discount value is required for discount coupons",
        code: "INVALID_DISCOUNT_VALUE",
      });
    }

    const couponId = await ctx.db.insert("userCoupons", {
      userId,
      type,
      source,
      maxRedemptions,
      timesUsed: 0,
      expiresAt,
      isActive: true,
      discountValue,
      redemptions: [],
      createdAt: Date.now(),
      createdBy: initiatedBy ?? userId,
    });

    return { couponId };
  },

  /**
   * Create a welcome bonus coupon for a new user
   * Convenience method for the standard welcome flow
   */
  createWelcomeCoupon: async (
    ctx: MutationCtx,
    args: { userId: Id<"users"> }
  ): Promise<{ couponId: Id<"userCoupons"> }> => {
    return couponService.createCoupon(ctx, {
      userId: args.userId,
      type: COUPON_CONFIG.WELCOME_BONUS_TYPE,
      source: "welcome_bonus",
      maxRedemptions: 1,
      expiresInDays: COUPON_CONFIG.WELCOME_BONUS_EXPIRY_DAYS,
    });
  },

  /**
   * Get all available coupons for a user
   * Returns only active, non-expired coupons that haven't been fully used
   */
  getUserAvailableCoupons: async (
    ctx: QueryCtx,
    args: { userId: Id<"users"> }
  ): Promise<Doc<"userCoupons">[]> => {
    const now = Date.now();

    const coupons = await ctx.db
      .query("userCoupons")
      .withIndex("by_user_active", (q) =>
        q.eq("userId", args.userId).eq("isActive", true)
      )
      .collect();

    // Filter out expired and fully used coupons
    return coupons.filter((coupon) => {
      // Check expiration
      if (coupon.expiresAt && coupon.expiresAt < now) {
        return false;
      }
      // Check usage limit
      if (coupon.timesUsed >= coupon.maxRedemptions) {
        return false;
      }
      return true;
    });
  },

  /**
   * Check if user has a valid free class coupon
   */
  hasValidFreeClassCoupon: async (
    ctx: QueryCtx,
    args: { userId: Id<"users"> }
  ): Promise<{ hasValidCoupon: boolean; couponId: Id<"userCoupons"> | null }> => {
    const now = Date.now();

    const coupons = await ctx.db
      .query("userCoupons")
      .withIndex("by_user_type_active", (q) =>
        q.eq("userId", args.userId).eq("type", "free_class").eq("isActive", true)
      )
      .collect();

    // Find first valid coupon
    const validCoupon = coupons.find((coupon) => {
      if (coupon.expiresAt && coupon.expiresAt < now) {
        return false;
      }
      if (coupon.timesUsed >= coupon.maxRedemptions) {
        return false;
      }
      return true;
    });

    return {
      hasValidCoupon: !!validCoupon,
      couponId: validCoupon?._id ?? null,
    };
  },

  /**
   * Redeem a coupon for a booking
   * Marks the coupon as used and records the redemption
   */
  redeemCoupon: async (
    ctx: MutationCtx,
    args: {
      couponId: Id<"userCoupons">;
      userId: Id<"users">;
      bookingId: Id<"bookings">;
      classInstanceId: Id<"classInstances">;
    }
  ): Promise<{ success: boolean }> => {
    const { couponId, userId, bookingId, classInstanceId } = args;
    const now = Date.now();

    // Get the coupon
    const coupon = await ctx.db.get(couponId);
    if (!coupon) {
      throw new ConvexError({
        message: "Coupon not found",
        code: "COUPON_NOT_FOUND",
      });
    }

    // Verify ownership
    if (coupon.userId !== userId) {
      throw new ConvexError({
        message: "Coupon does not belong to this user",
        code: "COUPON_OWNERSHIP_ERROR",
      });
    }

    // Check if coupon is active
    if (!coupon.isActive) {
      throw new ConvexError({
        message: "Coupon is no longer active",
        code: "COUPON_INACTIVE",
      });
    }

    // Check expiration
    if (coupon.expiresAt && coupon.expiresAt < now) {
      throw new ConvexError({
        message: "Coupon has expired",
        code: "COUPON_EXPIRED",
      });
    }

    // Check usage limit
    if (coupon.timesUsed >= coupon.maxRedemptions) {
      throw new ConvexError({
        message: "Coupon has already been used",
        code: "COUPON_USED",
      });
    }

    // Record the redemption
    const redemptions = coupon.redemptions ?? [];
    redemptions.push({
      bookingId,
      classInstanceId,
      redeemedAt: now,
    });

    const newTimesUsed = coupon.timesUsed + 1;
    const isActive = newTimesUsed < coupon.maxRedemptions;

    await ctx.db.patch(couponId, {
      timesUsed: newTimesUsed,
      redemptions,
      isActive,
    });

    return { success: true };
  },

  /**
   * Deactivate a coupon (e.g., for admin cancellation)
   */
  deactivateCoupon: async (
    ctx: MutationCtx,
    args: { couponId: Id<"userCoupons"> }
  ): Promise<{ success: boolean }> => {
    await ctx.db.patch(args.couponId, { isActive: false });
    return { success: true };
  },

  /**
   * Get coupon by ID
   */
  getCoupon: async (
    ctx: QueryCtx,
    args: { couponId: Id<"userCoupons"> }
  ): Promise<Doc<"userCoupons"> | null> => {
    return ctx.db.get(args.couponId);
  },

  /**
   * Get all coupons for a user (including used/expired for history)
   */
  getAllUserCoupons: async (
    ctx: QueryCtx,
    args: { userId: Id<"users"> }
  ): Promise<Doc<"userCoupons">[]> => {
    return ctx.db
      .query("userCoupons")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },

  /**
   * Check if user has already received a welcome bonus coupon
   * Used to prevent duplicate welcome bonuses
   */
  hasReceivedWelcomeBonus: async (
    ctx: QueryCtx,
    args: { userId: Id<"users"> }
  ): Promise<boolean> => {
    const coupons = await ctx.db
      .query("userCoupons")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    return coupons.some((coupon) => coupon.source === "welcome_bonus");
  },
};


