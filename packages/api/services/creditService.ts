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
      venueId?: Id<"venues">;
      classTemplateId?: Id<"classTemplates">;
      classInstanceId?: Id<"classInstances">;
      bookingId?: Id<"bookings">;
      // Enhanced purchase tracking fields
      stripePaymentIntentId?: string;
      stripeCheckoutSessionId?: string;
      packageName?: string;
      priceInCents?: number;
      currency?: string;
      status?: "pending" | "completed" | "failed" | "canceled" | "refunded";
      // Admin who initiated the gift (for tracking purposes)
      initiatedBy?: Id<"users">;
    }
  ): Promise<{ newBalance: number; transactionId: Id<"creditTransactions"> }> => {
    const {
      userId, amount, type, reason, description, externalRef, businessId, venueId,
      classTemplateId, classInstanceId, bookingId, stripePaymentIntentId,
      stripeCheckoutSessionId, packageName, priceInCents, currency, status, initiatedBy
    } = args;

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
      venueId,
      classTemplateId,
      classInstanceId,
      bookingId,
      description,
      externalRef,
      // Enhanced purchase tracking
      stripePaymentIntentId,
      stripeCheckoutSessionId,
      packageName,
      priceInCents,
      currency,
      status: status || "completed", // Default to completed for non-purchase transactions
      completedAt: status === "completed" || !status ? Date.now() : undefined,
      createdAt: Date.now(),
      createdBy: initiatedBy ?? userId // Use initiator if provided (for admin gifts), otherwise recipient
    });

    return { newBalance, transactionId };
  },

  /**
   * Create a pending credit purchase (for Stripe checkout)
   */
  createPendingPurchase: async (
    ctx: MutationCtx,
    args: {
      userId: Id<"users">;
      amount: number;
      stripePaymentIntentId: string;
      stripeCheckoutSessionId?: string;
      packageName: string;
      priceInCents: number;
      currency: string;
      description: string;
    }
  ): Promise<{ transactionId: Id<"creditTransactions"> }> => {
    const transactionId = await ctx.db.insert("creditTransactions", {
      userId: args.userId,
      amount: args.amount,
      type: "purchase" as const,
      reason: "user_buy" as const,
      description: args.description,
      externalRef: args.stripePaymentIntentId,
      stripePaymentIntentId: args.stripePaymentIntentId,
      stripeCheckoutSessionId: args.stripeCheckoutSessionId,
      packageName: args.packageName,
      priceInCents: args.priceInCents,
      currency: args.currency,
      status: "pending",
      createdAt: Date.now(),
      createdBy: args.userId
    });

    return { transactionId };
  },

  /**
   * Complete a pending purchase (called from webhook)
   */
  completePurchase: async (
    ctx: MutationCtx,
    args: {
      stripePaymentIntentId: string;
    }
  ): Promise<{ newBalance: number; transactionId: Id<"creditTransactions"> }> => {
    // Find the pending transaction
    const transaction = await ctx.db
      .query("creditTransactions")
      .withIndex("by_stripe_payment_intent", (q) => q.eq("stripePaymentIntentId", args.stripePaymentIntentId))
      .first();

    if (!transaction) {
      throw new ConvexError({
        message: "Purchase transaction not found",
        field: "stripePaymentIntentId",
        code: "TRANSACTION_NOT_FOUND"
      });
    }

    if (transaction.status !== "pending") {
      throw new ConvexError({
        message: "Transaction is not pending",
        field: "status",
        code: "INVALID_STATUS"
      });
    }

    // Get user and update balance
    const user = await ctx.db.get(transaction.userId);
    if (!user) {
      throw new ConvexError({
        message: "User not found",
        field: "userId",
        code: "USER_NOT_FOUND"
      });
    }

    const currentCredits = user.credits || 0;
    const newBalance = currentCredits + transaction.amount;

    // Update user balance
    await ctx.db.patch(transaction.userId, {
      credits: newBalance
    });

    // Mark transaction as completed
    await ctx.db.patch(transaction._id, {
      status: "completed",
      completedAt: Date.now()
    });

    return { newBalance, transactionId: transaction._id };
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
      venueId?: Id<"venues">;
      classTemplateId?: Id<"classTemplates">;
      classInstanceId?: Id<"classInstances">;
      bookingId?: Id<"bookings">;
      externalRef?: string;
    }
  ): Promise<{ newBalance: number; transactionId: Id<"creditTransactions"> }> => {
    const { userId, amount, description, businessId, venueId, classTemplateId, classInstanceId, bookingId, externalRef } = args;

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
      venueId,
      classTemplateId,
      classInstanceId,
      bookingId,
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
  ) => {
    const { userId, limit = 50, type } = args;

    let query;

    if (type) {
      // 🔥 OPTIMIZED: Use compound index for user + type
      query = ctx.db
        .query("creditTransactions")
        .withIndex("by_user_type", q => q.eq("userId", userId).eq("type", type));
    } else {
      query = ctx.db
        .query("creditTransactions")
        .withIndex("by_user", q => q.eq("userId", userId));
    }

    const transactions = await query
      .order("desc")
      .take(limit);

    return transactions;
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

    // 🔥 OPTIMIZED: Use compound indexes for business + type + date
    let bookingsQuery, refundsQuery;

    if (startDate) {
      bookingsQuery = ctx.db
        .query("creditTransactions")
        .withIndex("by_business_type_created", q =>
          q.eq("businessId", businessId)
            .eq("type", "spend")
            .gte("createdAt", startDate)
        );

      refundsQuery = ctx.db
        .query("creditTransactions")
        .withIndex("by_business_type_created", q =>
          q.eq("businessId", businessId)
            .eq("type", "refund")
            .gte("createdAt", startDate)
        );
    } else {
      bookingsQuery = ctx.db
        .query("creditTransactions")
        .withIndex("by_business_type", q =>
          q.eq("businessId", businessId).eq("type", "spend")
        );

      refundsQuery = ctx.db
        .query("creditTransactions")
        .withIndex("by_business_type", q =>
          q.eq("businessId", businessId).eq("type", "refund")
        );
    }

    // Apply end date filter if specified
    if (endDate) {
      bookingsQuery = bookingsQuery.filter(q => q.lte(q.field("createdAt"), endDate));
      refundsQuery = refundsQuery.filter(q => q.lte(q.field("createdAt"), endDate));
    }

    const [bookingTxns, refundTxns] = await Promise.all([
      bookingsQuery.collect(),
      refundsQuery.collect()
    ]);

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
    // 🔥 CRITICAL FIX: Use separate type-specific queries instead of scanning ALL transactions
    const queryPromises = ["purchase", "gift", "spend", "refund"].map(async (type) => {
      let query = ctx.db
        .query("creditTransactions")
        .withIndex("by_type", q => q.eq("type", type as any));

      // Apply date filters if specified (we can't use compound indexes for global analytics across all businesses)
      if (args.startDate) {
        query = query.filter(q => q.gte(q.field("createdAt"), args.startDate!));
      }
      if (args.endDate) {
        query = query.filter(q => q.lte(q.field("createdAt"), args.endDate!));
      }

      return {
        type: type as "purchase" | "gift" | "spend" | "refund",
        transactions: await query.collect()
      };
    });

    const results = await Promise.all(queryPromises);
    const transactionsByType = results.reduce((acc, { type, transactions }) => {
      acc[type] = transactions;
      return acc;
    }, {} as Record<string, any[]>);

    // 🔥 OPTIMIZED: Process each type directly from organized results
    const purchased = (transactionsByType.purchase ?? [])
      .reduce((sum, tx) => sum + tx.amount, 0);

    // 🔥 OPTIMIZED: Process each category directly from type-organized data
    const giftWelcome = (transactionsByType.gift ?? [])
      .filter(tx => tx.reason === "welcome_bonus")
      .reduce((sum, tx) => sum + tx.amount, 0);

    const giftReferral = (transactionsByType.gift ?? [])
      .filter(tx => tx.reason === "referral_bonus")
      .reduce((sum, tx) => sum + tx.amount, 0);

    const giftAdmin = (transactionsByType.gift ?? [])
      .filter(tx => tx.reason === "admin_gift" || !tx.reason)
      .reduce((sum, tx) => sum + tx.amount, 0);

    const giftCampaign = (transactionsByType.gift ?? [])
      .filter(tx => tx.reason === "campaign_bonus")
      .reduce((sum, tx) => sum + tx.amount, 0);

    const totalSpent = (transactionsByType.spend ?? [])
      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

    const refundsByReason = {
      userCancellation: (transactionsByType.refund ?? [])
        .filter(tx => tx.reason === "user_cancellation")
        .reduce((sum, tx) => sum + tx.amount, 0),
      businessCancellation: (transactionsByType.refund ?? [])
        .filter(tx => tx.reason === "business_cancellation")
        .reduce((sum, tx) => sum + tx.amount, 0),
      paymentIssue: (transactionsByType.refund ?? [])
        .filter(tx => tx.reason === "payment_issue")
        .reduce((sum, tx) => sum + tx.amount, 0),
      general: (transactionsByType.refund ?? [])
        .filter(tx => tx.reason === "general_refund" || !tx.reason)
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