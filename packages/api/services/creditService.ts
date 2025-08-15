import type { MutationCtx, QueryCtx } from "../convex/_generated/server";
import type { Id } from "../convex/_generated/dataModel";
import { Infer, v } from "convex/values";
import { nanoid } from "nanoid";
import { creditRules } from "../rules/credit";
import { omit } from "convex-helpers";
import { creditLedgerFields } from "../convex/schema";
import { getTransactionMeta, type CreditLedgerType } from "../utils/creditMappings";
import { creditExpirationUtils } from "../utils/creditExpiration";
import { createLedgerEntry } from "../operations/credits";

/**
 * Credit ledger entry for a transaction
 */
export const creditLedgerEntryArgs = v.object({
  ...omit(creditLedgerFields, [
    'transactionId',      // Will be set by the service
    'account',            // Will be derived from entity fields
    'description',        // Will be set from transaction description
    'idempotencyKey',     // Will be set by the service
    'effectiveAt',        // Will be set by the service
    'reconciledAt',       // Internal field
    'createdAt',          // Set by service
    'deleted',            // Soft delete field - set by service
  ])
});
export type CreditLedgerEntry = Infer<typeof creditLedgerEntryArgs>;

/**
 * Create transaction arguments
 */
export const createTransactionArgs = v.object({
  idempotencyKey: v.string(),
  transactionId: v.optional(v.string()), // Auto-generated if not provided
  description: v.string(),
  entries: v.array(creditLedgerEntryArgs),
});
export type CreateTransactionArgs = Infer<typeof createTransactionArgs>;

/**
 * Entity for balance queries
 */
export type CreditEntity =
  | { userId: Id<"users"> }
  | { businessId: Id<"businesses"> }
  | { systemEntity: "system" | "payment_processor" };

/**
 * Simplified Credit Service - Handles basic credit operations for fitness class bookings
 * 
 * This service handles:
 * 1. Adding credits (purchases)
 * 2. Spending credits (bookings)
 * 3. Checking balances
 * 4. Basic validation
 */
export const creditService = {
  /**
   * Create a credit transaction with multiple ledger entries.
   * This is the ONLY way to move credits in the system.
   * 
   * Enforces double-entry bookkeeping: all entries must sum to zero.
   */
  createTransaction: async (
    ctx: MutationCtx,
    args: CreateTransactionArgs
  ): Promise<{ transactionId: string }> => {
    const { idempotencyKey, description, entries } = args;
    const transactionId = args.transactionId || `tx_${Date.now()}_${nanoid(8)}`;
    const now = Date.now();

    // Validate all business rules
    creditRules.validateTransactionRules({ idempotencyKey, description, entries });

    // Check for existing transaction with same idempotency key
    const existingTransaction = await ctx.db
      .query("creditTransactions")
      .withIndex("by_idempotencyKey", (q) => q.eq("idempotencyKey", idempotencyKey))
      .first();

    // Apply transaction status rules
    if (existingTransaction) {
      if (existingTransaction.status === "completed") {
        return { transactionId: existingTransaction.transactionId };
      }
      creditRules.canRetryFailedTransaction(existingTransaction.status);
      // If pending, we'll continue and potentially override
    }

    try {
      // Determine transaction action and actor from ledger entries
      const { action, actor } = getTransactionMeta(
        entries.map(entry => ({ type: entry.type as CreditLedgerType, account: entry.userId ? "customer" : entry.businessId ? "business" : "system" }))
      );

      // Create transaction record
      await ctx.db.insert("creditTransactions", {
        idempotencyKey,
        transactionId,
        status: "pending",
        transactionActor: actor,
        transactionAction: action,
        description,
        amount: 0, // Double-entry ensures this is always ~0
        createdAt: now,
        deleted: false,
      });

      // Create all ledger entries atomically using operations
      for (const entry of entries) {
        const ledgerEntry = createLedgerEntry(
          entry,
          transactionId,
          description,
          idempotencyKey,
          now,
          creditExpirationUtils.shouldExpireCredits,
          creditExpirationUtils.calculateExpirationDate
        );

        await ctx.db.insert("creditLedger", ledgerEntry);
      }

      // Mark transaction as completed
      await ctx.db.patch(
        (await ctx.db
          .query("creditTransactions")
          .withIndex("by_idempotencyKey", (q) => q.eq("idempotencyKey", idempotencyKey))
          .first())!._id,
        {
          status: "completed",
          updatedAt: now,
        }
      );

      return { transactionId };

    } catch (error) {
      // Mark transaction as failed if it exists
      const failedTransaction = await ctx.db
        .query("creditTransactions")
        .withIndex("by_idempotencyKey", (q) => q.eq("idempotencyKey", idempotencyKey))
        .first();

      if (failedTransaction) {
        await ctx.db.patch(failedTransaction._id, {
          status: "failed",
          updatedAt: now,
        });
      }

      throw error;
    }
  },

  /**
   * Get current balance for an entity (derived from ledger)
   */
  getBalance: async (
    ctx: QueryCtx,
    entity: CreditEntity
  ): Promise<number> => {
    let entries;

    if ("userId" in entity) {
      entries = await ctx.db
        .query("creditLedger")
        .withIndex("by_user", (q) => q.eq("userId", entity.userId))
        .collect();
    } else if ("businessId" in entity) {
      entries = await ctx.db
        .query("creditLedger")
        .withIndex("by_business", (q) => q.eq("businessId", entity.businessId))
        .collect();
    } else {
      entries = await ctx.db
        .query("creditLedger")
        .withIndex("by_systemEntity", (q) => q.eq("systemEntity", entity.systemEntity))
        .collect();
    }

    return entries
      .filter(entry => !entry.deleted)
      .reduce((total, entry) => total + entry.amount, 0);
  },

  /**
   * Validate that an entity has sufficient balance
   */
  validateBalance: async (
    ctx: QueryCtx,
    entity: { userId: Id<"users"> } | { businessId: Id<"businesses"> },
    requiredAmount: number
  ): Promise<boolean> => {
    const currentBalance = await creditService.getBalance(ctx, entity);
    return currentBalance >= requiredAmount;
  },

  /**
   * Simple method to add credits to a user (e.g., from purchase)
   */
  addCredits: async (
    ctx: MutationCtx,
    args: { userId: Id<"users">; amount: number; description: string; idempotencyKey: string }
  ): Promise<{ transactionId: string }> => {
    return await creditService.createTransaction(ctx, {
      idempotencyKey: args.idempotencyKey,
      description: args.description,
      entries: [
        {
          userId: args.userId,
          type: "credit_purchase",
          amount: args.amount,
          businessId: undefined,
          systemEntity: undefined,
        },
        {
          userId: undefined,
          type: "credit_purchase",
          amount: -args.amount,
          businessId: undefined,
          systemEntity: "payment_processor",
        }
      ]
    });
  },

  /**
   * Simple method to spend credits from a user (e.g., for booking)
   */
  spendCredits: async (
    ctx: MutationCtx,
    args: { userId: Id<"users">; amount: number; description: string; idempotencyKey: string }
  ): Promise<{ transactionId: string }> => {
    // Check if user has enough credits
    const hasBalance = await creditService.validateBalance(ctx, { userId: args.userId }, args.amount);
    if (!hasBalance) {
      throw new Error(`Insufficient credits. Required: ${args.amount}`);
    }

    return await creditService.createTransaction(ctx, {
      idempotencyKey: args.idempotencyKey,
      description: args.description,
      entries: [
        {
          userId: args.userId,
          type: "credit_spend",
          amount: -args.amount,
          businessId: undefined,
          systemEntity: undefined,
        },
        {
          userId: undefined,
          type: "system_credit_cost",
          amount: args.amount,
          businessId: undefined,
          systemEntity: "system",
        }
      ]
    });
  },

  /**
   * Get all ledger entries for a user (for debugging/reconciliation if needed)
   */
  getLedgerEntriesForUser: async (
    ctx: QueryCtx | MutationCtx,
    userId: Id<"users">
  ): Promise<Array<{
    userId: Id<"users">;
    amount: number;
    type: string;
    effectiveAt: number;
    expiresAt?: number;
    deleted: boolean;
  }>> => {
    const entries = await ctx.db
      .query("creditLedger")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    return entries.map(entry => ({
      userId: entry.userId!,
      amount: entry.amount,
      type: entry.type,
      effectiveAt: entry.effectiveAt,
      expiresAt: entry.expiresAt,
      deleted: entry.deleted ?? false
    }));
  },

  /**
   * Get user balance and optionally reconcile cache
   * This is the main method other services should use
   */
  getUserCredits: async (
    ctx: QueryCtx | MutationCtx,
    userId: Id<"users">,
    reconcileCache = true
  ): Promise<number> => {
    // If we need to reconcile and have mutation context, do it
    if (reconcileCache && 'db' in ctx && 'patch' in ctx.db) {
      const { reconciliationService } = await import("./reconciliationService");
      await reconciliationService.reconcileUser({ ctx, userId, updateCache: true });
    }

    // Return the balance (either from cache or freshly reconciled)
    return await creditService.getBalance(ctx, { userId });
  }
};



