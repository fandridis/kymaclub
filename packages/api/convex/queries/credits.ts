import { v } from "convex/values";
import { query } from "../_generated/server";
import { creditService } from "../../services/creditService";

/**
 * Get current credit balance for a user (from ledger - slower but accurate)
 */
export const getUserBalance = query({
  args: v.object({
    userId: v.id("users"),
  }),
  handler: async (ctx, args) => {
    const balance = await creditService.getBalance(ctx, { userId: args.userId });
    
    return {
      userId: args.userId,
      balance,
      balanceFormatted: `${balance} credits`,
      source: "ledger",
    };
  },
});

/**
 * Get cached credit balance for a user (from user object - fast)
 */
export const getUserCachedBalance = query({
  args: v.object({
    userId: v.id("users"),
  }),
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    const cachedCredits = (user as any).credits ?? 0;
    const lifetimeCredits = (user as any).lifetimeCredits ?? 0;
    const lastUpdated = (user as any).creditsLastUpdated;
    
    return {
      userId: args.userId,
      balance: cachedCredits,
      lifetimeCredits,
      balanceFormatted: `${cachedCredits} credits`,
      lastUpdated,
      source: "cache",
    };
  },
});

/**
 * Get current credit balance for a business
 */
export const getBusinessBalance = query({
  args: v.object({
    businessId: v.id("businesses"),
  }),
  handler: async (ctx, args) => {
    const balance = await creditService.getBalance(ctx, { businessId: args.businessId });
    
    return {
      businessId: args.businessId,
      balance,
      balanceFormatted: `${balance} credits`,
    };
  },
});

/**
 * Get system account balance
 */
export const getSystemBalance = query({
  args: v.object({}),
  handler: async (ctx) => {
    const balance = await creditService.getBalance(ctx, { systemEntity: "system" });
    
    return {
      account: "system",
      balance,
      balanceFormatted: `${balance} credits`,
    };
  },
});

/**
 * Get recent credit transactions for a user
 */
export const getUserTransactions = query({
  args: v.object({
    userId: v.id("users"),
    limit: v.optional(v.number()),
  }),
  handler: async (ctx, args) => {
    const limit = args.limit || 10;
    
    const entries = await ctx.db
      .query("creditLedger")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(limit);

    return entries
      .filter(entry => !entry.deleted)
      .map(entry => ({
        id: entry._id,
        amount: entry.amount,
        type: entry.type,
        description: entry.description,
        effectiveAt: entry.effectiveAt,
        transactionId: entry.transactionId,
        expiresAt: entry.expiresAt,
      }));
  },
});