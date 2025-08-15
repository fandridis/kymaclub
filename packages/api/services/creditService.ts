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
 * Credit Service - Handles all credit transactions through double-entry ledger
 * 
 * This service is transaction-type agnostic and only cares about:
 * 1. Double-entry ledger mechanics (transactions must balance to zero)
 * 2. Idempotency (preventing duplicate transactions)
 * 3. Data integrity validation
 * 4. Atomic transaction creation
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

      console.log(`💳 CREDIT_SERVICE: Transaction ${transactionId} completed with ${entries.length} entries`);
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

      console.error(`💳 CREDIT_SERVICE: Transaction ${transactionId} failed:`, error);
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
   * Reconcile user's cached credit balance with ledger
   * This should be called on login or periodically to ensure accuracy
   */
  reconcileUserCredits: async (
    ctx: MutationCtx,
    args: { userId: Id<"users">; updateCache?: boolean }
  ): Promise<{
    cachedCredits: number;
    computedCredits: number;
    deltaCredits: number;
    cachedLifetimeCredits: number;
    computedLifetimeCredits: number;
    deltaLifetimeCredits: number;
    updated: boolean;
  }> => {
    const user = await ctx.db.get(args.userId);
    creditRules.validateUserExists(user, args.userId);

    // Compute actual balances from ledger
    const { computedCredits, computedLifetimePurchased } = await creditService._computeUserCreditSums(ctx, args.userId);

    const cachedCredits = user!.credits ?? 0;
    const cachedLifetime = user!.lifetimeCredits ?? 0;
    const deltaCredits = computedCredits - cachedCredits;
    const deltaLifetimeCredits = computedLifetimePurchased - cachedLifetime;

    let updated = false;
    if (args.updateCache) {
      await ctx.db.patch(args.userId, {
        credits: computedCredits,
        creditsLastUpdated: Date.now(),
        lifetimeCredits: computedLifetimePurchased,
      });
      updated = true;
    }

    return {
      cachedCredits,
      computedCredits,
      deltaCredits,
      cachedLifetimeCredits: cachedLifetime,
      computedLifetimeCredits: computedLifetimePurchased,
      deltaLifetimeCredits,
      updated,
    };
  },

  /**
   * Internal helper to compute user credit sums from ledger
   */
  _computeUserCreditSums: async (
    ctx: MutationCtx,
    userId: Id<"users">
  ): Promise<{ computedCredits: number; computedLifetimePurchased: number }> => {
    const now = Date.now();
    let computedCredits = 0;
    let computedLifetimePurchased = 0;

    const entries = await ctx.db
      .query("creditLedger")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    for (const entry of entries) {
      // Skip soft-deleted or future-dated entries
      if (entry.deleted || entry.effectiveAt > now) continue;

      // Only user-facing balance changes (customer account)
      if (entry.account === "customer") {
        computedCredits += entry.amount;
      }

      // Lifetime purchased credits only count actual purchases
      if (entry.type === "credit_purchase" && entry.amount > 0) {
        computedLifetimePurchased += entry.amount;
      }
    }

    return { computedCredits, computedLifetimePurchased };
  },
};



