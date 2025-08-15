import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { creditService } from "../../services/creditService";
import { nanoid } from "nanoid";
import { CREDIT_LEDGER_TYPES } from "../../utils/creditMappings";
import { reconciliationService } from "../../services/reconciliationService";

/**
 * Gift credits to a user from the system account.
 * This is for manual testing and administrative purposes.
 */
export const giftCredits = mutation({
  args: v.object({
    userId: v.id("users"),
    amount: v.number(),
    description: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const { userId, amount, description = `Gift of ${amount} credits` } = args;

    // Validate amount is positive
    if (amount <= 0) {
      throw new Error("Credit amount must be greater than 0");
    }

    // Validate user exists
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Create double-entry transaction: System -> User
    const idempotencyKey = `gift_${userId}_${Date.now()}_${nanoid(8)}`;

    const result = await creditService.createTransaction(ctx, {
      idempotencyKey,
      description,
      entries: [
        {
          // Debit system account (negative amount)
          systemEntity: "system",
          amount: -amount,
          type: CREDIT_LEDGER_TYPES.SYSTEM_CREDIT_COST,
        },
        {
          // Credit user account (positive amount)
          userId,
          amount: amount,
          type: CREDIT_LEDGER_TYPES.CREDIT_BONUS,
          creditValue: 2.0, // €2 per credit default value
        }
      ]
    });

    // Reconcile user's cached balance after gifting
    const reconciliation = await reconciliationService.reconcileUser({
      ctx,
      userId,
      updateCache: true,
    });

    console.log(`💝 GIFT_CREDITS: Gifted ${amount} credits to user ${userId}. Balance: ${reconciliation.actualCredits}`);

    return {
      success: true,
      transactionId: result.transactionId,
      newBalance: reconciliation.actualCredits,
      message: `Successfully gifted ${amount} credits to user. New balance: ${reconciliation.actualCredits}`,
    };
  },
});

/**
 * Reconcile a user's cached credit balance with the ledger.
 * Useful for fixing discrepancies or updating on login.
 */
export const reconcileUserCredits = mutation({
  args: v.object({
    userId: v.id("users"),
    updateCache: v.optional(v.boolean()),
  }),
  handler: async (ctx, args) => {
    const updateCache = args.updateCache ?? true;

    const result = await reconciliationService.reconcileUser({
      ctx,
      userId: args.userId,
      updateCache,
    });

    console.log(`🔄 RECONCILE: User ${args.userId} - Cached: ${result.cachedCredits}, Computed: ${result.actualCredits}, Delta: ${result.actualCredits - result.cachedCredits}`);

    return {
      ...result,
      message: `Reconciliation ${result.wasUpdated ? 'completed' : 'checked'}: ${result.actualCredits - result.cachedCredits === 0 ? 'no discrepancy' : `corrected ${result.actualCredits - result.cachedCredits} credits`}`,
    };
  },
});