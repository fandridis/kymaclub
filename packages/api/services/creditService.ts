import type { MutationCtx, QueryCtx } from "../convex/_generated/server";
import type { Id } from "../convex/_generated/dataModel";
import { ConvexError } from "convex/values";
import { CreditTransactionType, CreditTransactionReason } from "../types/credit";

/**
 * Credit Service
 * 
 * This service handles:
 * 1. Add credits to user (purchase, gift, refund)
 * 2. Spend credits from user (booking)
 * 3. Get user balance (from user.credits field)
 * 4. Transaction history and business analytics
 */

export const creditService = {
  /**
   * Add credits to a user (purchase, gifts, refunds)
   */
  addCredits: async (
    ctx: MutationCtx,
    args: {
      userId: Id<"users">;
      amount: number;
      type: "purchase" | "gift" | "refund";
      reason?: CreditTransactionReason;
      description: string;
      externalRef?: string;
      businessId?: Id<"businesses">;
      classInstanceId?: Id<"classInstances">;
    }
  ): Promise<{ newBalance: number; transactionId: Id<"creditTransactions"> }> => {
    const { userId, amount, type, reason, description, externalRef, businessId, classInstanceId } = args;

    // Validate amount is positive
    if (amount <= 0) {
      throw new ConvexError({
        message: "Credit amount must be greater than 0",
        field: "amount",
        code: "INVALID_AMOUNT"
      });
    }

    // Get user
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new ConvexError({
        message: "User not found",
        field: "userId",
        code: "USER_NOT_FOUND"
      });
    }

    // Update user balance
    const currentCredits = user.credits || 0;
    const newBalance = currentCredits + amount;

    await ctx.db.patch(userId, {
      credits: newBalance
    });

    // Log transaction
    const transactionId = await ctx.db.insert("creditTransactions", {
      userId,
      amount,
      type,
      reason,
      businessId,
      classInstanceId,
      description,
      externalRef,
      createdAt: Date.now(),
      createdBy: userId
    });

    return { newBalance, transactionId };
  },

  /**
   * Spend credits from a user (booking)
   */
  spendCredits: async (
    ctx: MutationCtx,
    args: {
      userId: Id<"users">;
      amount: number;
      description: string;
      businessId: Id<"businesses">;
      classInstanceId?: Id<"classInstances">;
      externalRef?: string;
    }
  ): Promise<{ newBalance: number; transactionId: Id<"creditTransactions"> }> => {
    const { userId, amount, description, businessId, classInstanceId, externalRef } = args;

    // Validate amount is positive
    if (amount <= 0) {
      throw new ConvexError({
        message: "Credit amount must be greater than 0",
        field: "amount",
        code: "INVALID_AMOUNT"
      });
    }

    // Get user
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new ConvexError({
        message: "User not found",
        field: "userId",
        code: "USER_NOT_FOUND"
      });
    }

    // Check sufficient balance
    const currentCredits = user.credits || 0;
    if (currentCredits < amount) {
      throw new ConvexError({
        message: `Insufficient credits. Required: ${amount}, Available: ${currentCredits}`,
        field: "amount",
        code: "INSUFFICIENT_CREDITS"
      });
    }

    // Update user balance
    const newBalance = currentCredits - amount;

    await ctx.db.patch(userId, {
      credits: newBalance
    });

    // Log transaction (negative amount for spending)
    const transactionId = await ctx.db.insert("creditTransactions", {
      userId,
      amount: -amount,
      type: "spend",
      reason: "booking",
      businessId,
      classInstanceId,
      description,
      externalRef,
      createdAt: Date.now(),
      createdBy: userId
    });

    return { newBalance, transactionId };
  },

  /**
   * Get user's current credit balance
   */
  getBalance: async (
    ctx: QueryCtx | MutationCtx,
    userId: Id<"users">
  ): Promise<number> => {
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new ConvexError({
        message: "User not found",
        field: "userId",
        code: "USER_NOT_FOUND"
      });
    }

    return user.credits || 0;
  },

  /**
   * Get user's transaction history
   */
  getTransactionHistory: async (
    ctx: QueryCtx,
    args: {
      userId: Id<"users">;
      limit?: number;
      type?: CreditTransactionType;
    }
  ): Promise<Array<{
    id: Id<"creditTransactions">;
    amount: number;
    type: CreditTransactionType;
    reason?: CreditTransactionReason;
    businessId?: Id<"businesses">;
    classInstanceId?: Id<"classInstances">;
    description: string;
    externalRef?: string;
    createdAt: number;
  }>> => {
    const { userId, limit = 50, type } = args;

    let query = ctx.db
      .query("creditTransactions")
      .withIndex("by_user", q => q.eq("userId", userId));

    if (type) {
      query = ctx.db
        .query("creditTransactions")
        .withIndex("by_user_type", q => q.eq("userId", userId).eq("type", type));
    }

    const transactions = await query
      .order("desc")
      .take(limit);

    return transactions.map(tx => ({
      id: tx._id,
      amount: tx.amount,
      type: tx.type,
      reason: tx.reason,
      businessId: tx.businessId,
      classInstanceId: tx.classInstanceId,
      description: tx.description,
      externalRef: tx.externalRef,
      createdAt: tx.createdAt
    }));
  },

  /**
   * Get business earnings from credit transactions
   */
  getBusinessEarnings: async (
    ctx: QueryCtx,
    args: {
      businessId: Id<"businesses">;
      startDate?: number;
      endDate?: number;
    }
  ): Promise<{
    totalEarnings: number;
    totalRefunds: number;
    netEarnings: number;
    transactionCount: number;
  }> => {
    const { businessId, startDate, endDate } = args;

    let bookings = ctx.db
      .query("creditTransactions")
      .withIndex("by_business_type", q => q.eq("businessId", businessId).eq("type", "spend"));

    // Get all refund types for this business
    let allTransactions = ctx.db
      .query("creditTransactions")
      .withIndex("by_business", q => q.eq("businessId", businessId));

    if (startDate) {
      bookings = bookings.filter(q => q.gte(q.field("createdAt"), startDate));
      allTransactions = allTransactions.filter(q => q.gte(q.field("createdAt"), startDate));
    }

    if (endDate) {
      bookings = bookings.filter(q => q.lte(q.field("createdAt"), endDate));
      allTransactions = allTransactions.filter(q => q.lte(q.field("createdAt"), endDate));
    }

    const [bookingTxns, allTxns] = await Promise.all([
      bookings.collect(),
      allTransactions.collect()
    ]);

    const refundTxns = allTxns.filter(tx => tx.type === "refund");

    const totalEarnings = bookingTxns.reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
    const totalRefunds = refundTxns.reduce((sum, tx) => sum + tx.amount, 0);
    const netEarnings = totalEarnings - totalRefunds;

    return {
      totalEarnings,
      totalRefunds,
      netEarnings,
      transactionCount: bookingTxns.length + refundTxns.length
    };
  },

  /**
   * Analytics: Get credit breakdown by type and reason
   */
  getCreditAnalytics: async (
    ctx: QueryCtx,
    args: {
      startDate?: number;
      endDate?: number;
    }
  ): Promise<{
    purchased: number;
    giftWelcome: number;
    giftReferral: number;
    giftAdmin: number;
    giftCampaign: number;
    totalGifted: number;
    totalAdded: number;
    totalSpent: number;
    totalRefunded: number;
    refundsByReason: {
      userCancellation: number;
      businessCancellation: number;
      paymentIssue: number;
      general: number;
    };
  }> => {
    let query = ctx.db.query("creditTransactions");

    if (args.startDate) {
      query = query.filter(q => q.gte(q.field("createdAt"), args.startDate!));
    }

    if (args.endDate) {
      query = query.filter(q => q.lte(q.field("createdAt"), args.endDate!));
    }

    const transactions = await query.collect();

    const purchased = transactions
      .filter(tx => tx.type === "purchase")
      .reduce((sum, tx) => sum + tx.amount, 0);

    const giftWelcome = transactions
      .filter(tx => tx.type === "gift" && tx.reason === "welcome_bonus")
      .reduce((sum, tx) => sum + tx.amount, 0);

    const giftReferral = transactions
      .filter(tx => tx.type === "gift" && tx.reason === "referral_bonus")
      .reduce((sum, tx) => sum + tx.amount, 0);

    const giftAdmin = transactions
      .filter(tx => tx.type === "gift" && (tx.reason === "admin_gift" || !tx.reason))
      .reduce((sum, tx) => sum + tx.amount, 0);

    const giftCampaign = transactions
      .filter(tx => tx.type === "gift" && tx.reason === "campaign_bonus")
      .reduce((sum, tx) => sum + tx.amount, 0);

    const totalSpent = transactions
      .filter(tx => tx.type === "spend")
      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

    const refundsByReason = {
      userCancellation: transactions
        .filter(tx => tx.type === "refund" && tx.reason === "user_cancellation")
        .reduce((sum, tx) => sum + tx.amount, 0),
      businessCancellation: transactions
        .filter(tx => tx.type === "refund" && tx.reason === "business_cancellation")
        .reduce((sum, tx) => sum + tx.amount, 0),
      paymentIssue: transactions
        .filter(tx => tx.type === "refund" && tx.reason === "payment_issue")
        .reduce((sum, tx) => sum + tx.amount, 0),
      general: transactions
        .filter(tx => tx.type === "refund" && (tx.reason === "general_refund" || !tx.reason))
        .reduce((sum, tx) => sum + tx.amount, 0),
    };

    const totalRefunded = Object.values(refundsByReason).reduce((sum, amount) => sum + amount, 0);
    const totalGifted = giftWelcome + giftReferral + giftAdmin + giftCampaign;
    const totalAdded = purchased + totalGifted + totalRefunded;

    return {
      purchased,
      giftWelcome,
      giftReferral,
      giftAdmin,
      giftCampaign,
      totalGifted,
      totalAdded,
      totalSpent,
      totalRefunded,
      refundsByReason,
    };
  }
};