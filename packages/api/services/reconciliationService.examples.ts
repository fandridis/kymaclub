/**
 * RECONCILIATION SERVICE USAGE EXAMPLES
 * 
 * This file demonstrates how to use the reconciliationService in various scenarios.
 * These examples show the integration patterns with your existing credit operations.
 */

import type { MutationCtx } from "../convex/_generated/server";
import type { Id } from "../convex/_generated/dataModel";
import { reconciliationService } from "./reconciliationService";
import { creditService } from "./creditService";

// ============================================================================
// EXAMPLE 1: Reconcile after credit purchase
// ============================================================================

/**
 * Purchase credits and immediately reconcile cache
 */
export async function purchaseCreditsWithReconciliation(
  ctx: MutationCtx,
  userId: Id<"users">,
  amount: number,
  performedBy: Id<"users">
) {
  // 1. Purchase credits (updates ledger)
  await creditService.createTransaction(ctx, {
    idempotencyKey: `purchase-${userId}-${Date.now()}`,
    description: `User purchased ${amount} credits`,
    entries: [
      {
        userId,
        amount,
        type: 'credit_purchase',
        creditValue: 2.0,
        expiresAt: Date.now() + 90 * 24 * 60 * 60 * 1000 // 3 months
      }
    ]
  });

  // 2. Reconcile user cache with ledger
  const reconciliationResult = await reconciliationService.reconcileUser({
    ctx,
    args: { userId },
    performedBy
  });

  console.log(`Credits purchased and reconciled. Available: ${reconciliationResult.computedBalance.availableCredits}`);

  return reconciliationResult;
}

// ============================================================================
// EXAMPLE 2: Reconcile after booking (debit credits)
// ============================================================================

/**
 * Book a class and reconcile user credits
 */
export async function bookClassWithReconciliation(
  ctx: MutationCtx,
  userId: Id<"users">,
  classInstanceId: Id<"classInstances">,
  creditCost: number,
  performedBy: Id<"users">
) {
  // 1. Reconcile BEFORE booking to ensure accurate balance
  await reconciliationService.reconcileUser({
    ctx,
    args: { userId },
    performedBy
  });

  // 2. Check if user has enough credits
  const currentBalance = await reconciliationService.getUserBalance({
    ctx,
    userId,
    reconcile: false // Already reconciled above
  });

  if (currentBalance.availableCredits < creditCost) {
    throw new Error(`Insufficient credits. Need ${creditCost}, have ${currentBalance.availableCredits}`);
  }

  // 3. Debit credits for booking (updates ledger)
  await creditService.createTransaction(ctx, {
    idempotencyKey: `booking-${userId}-${classInstanceId}-${Date.now()}`,
    description: `Booked class for ${creditCost} credits`,
    entries: [
      {
        userId,
        amount: -creditCost,
        type: 'credit_spend',
        relatedClassInstanceId: classInstanceId
      }
    ]
  });

  // 4. Reconcile user cache after booking
  const reconciliationResult = await reconciliationService.reconcileUser({
    ctx,
    args: { userId },
    performedBy
  });

  return {
    bookingSuccess: true,
    newBalance: reconciliationResult.computedBalance.availableCredits,
    reconciliationResult
  };
}

// ============================================================================
// EXAMPLE 3: Gift credits via trigger (onboarding)
// ============================================================================

/**
 * Gift welcome credits to new users
 */
export async function giftWelcomeCredits(
  ctx: MutationCtx,
  userId: Id<"users">,
  giftAmount: number = 10
) {
  // 1. Add gift credits to ledger
  await creditService.createTransaction(ctx, {
    idempotencyKey: `onboarding-gift-${userId}`,
    description: `Welcome gift of ${giftAmount} credits`,
    entries: [
      {
        userId,
        amount: giftAmount,
        type: 'credit_bonus',
        creditValue: 2.0,
        expiresAt: Date.now() + 90 * 24 * 60 * 60 * 1000 // 3 months
      }
    ]
  });

  // 2. Reconcile user cache immediately
  const reconciliationResult = await reconciliationService.reconcileUser({
    ctx,
    args: { userId },
    performedBy: userId // System gift, use user as performer
  });

  console.log(`Gifted ${giftAmount} credits to user ${userId}. Total available: ${reconciliationResult.computedBalance.availableCredits}`);

  return reconciliationResult;
}

// ============================================================================
// EXAMPLE 4: Login reconciliation
// ============================================================================

/**
 * Reconcile user credits on login to ensure fresh data
 */
export async function reconcileOnLogin(
  ctx: MutationCtx,
  userId: Id<"users">
) {
  try {
    const reconciliationResult = await reconciliationService.reconcileUser({
      ctx,
      args: {
        userId,
        options: {
          includeAnalysis: true, // Get detailed inconsistency report
          forceUpdate: false     // Only update if needed
        }
      },
      performedBy: userId
    });

    // Log any inconsistencies for monitoring
    if (reconciliationResult.inconsistencies.length > 0) {
      console.warn(`User ${userId} login reconciliation found inconsistencies:`,
        reconciliationResult.inconsistencies);
    }

    return {
      availableCredits: reconciliationResult.computedBalance.availableCredits,
      heldCredits: reconciliationResult.computedBalance.heldCredits,
      lifetimeCredits: reconciliationResult.computedBalance.lifetimeCredits,
      wasUpdated: reconciliationResult.wasUpdated
    };

  } catch (error) {
    // Don't fail login if reconciliation fails - log and use cached values
    console.error(`Login reconciliation failed for user ${userId}:`, error);

    return await reconciliationService.getUserBalance({
      ctx,
      userId,
      reconcile: false // Use cached values as fallback
    });
  }
}

// ============================================================================
// EXAMPLE 5: Admin bulk reconciliation
// ============================================================================

/**
 * Admin function to reconcile all users (maintenance operation)
 */
export async function adminBulkReconciliation(
  ctx: MutationCtx,
  adminUserId: Id<"users">,
  options?: {
    batchSize?: number;
    dryRun?: boolean;
    specificUsers?: Id<"users">[];
  }
) {
  const bulkResult = await reconciliationService.reconcileUsers({
    ctx,
    args: {
      userIds: options?.specificUsers,
      batchSize: options?.batchSize ?? 100,
      options: {
        includeAnalysis: true,
        dryRun: options?.dryRun ?? false
      }
    },
    performedBy: adminUserId
  });

  // Generate report
  const report = {
    summary: {
      totalProcessed: bulkResult.processedCount,
      totalUpdated: bulkResult.updatedCount,
      totalInconsistencies: bulkResult.inconsistencyCount,
      totalErrors: bulkResult.errors.length,
      processingTimeMs: bulkResult.processingTimeMs
    },
    topInconsistencies: bulkResult.results
      .filter(r => r.inconsistencies.length > 0)
      .slice(0, 10) // Top 10 users with issues
      .map(r => ({
        userId: r.userId,
        inconsistencies: r.inconsistencies,
        deltas: r.deltas
      })),
    errors: bulkResult.errors
  };

  console.log('Bulk reconciliation report:', JSON.stringify(report, null, 2));

  return report;
}

// ============================================================================
// EXAMPLE 6: Refund with reconciliation
// ============================================================================

/**
 * Process a booking refund and reconcile credits
 */
export async function refundBookingWithReconciliation(
  ctx: MutationCtx,
  userId: Id<"users">,
  bookingId: Id<"bookings">,
  refundAmount: number,
  performedBy: Id<"users">
) {
  // 1. Add refund credits to ledger
  await creditService.createTransaction(ctx, {
    idempotencyKey: `refund-${bookingId}-${Date.now()}`,
    description: `Refund for booking ${bookingId}`,
    entries: [
      {
        userId,
        amount: refundAmount,
        type: 'credit_refund',
        systemEntity: 'payment_processor',
        relatedBookingId: bookingId,
        creditValue: 2.0,
        expiresAt: Date.now() + 90 * 24 * 60 * 60 * 1000 // 3 months
      }
    ]
  });

  // 2. Reconcile user cache
  const reconciliationResult = await reconciliationService.reconcileUser({
    ctx,
    args: { userId },
    performedBy
  });

  return {
    refundProcessed: true,
    refundAmount,
    newBalance: reconciliationResult.computedBalance.availableCredits,
    reconciliationResult
  };
}

// ============================================================================
// EXAMPLE 7: Scheduled maintenance reconciliation
// ============================================================================

/**
 * Daily scheduled reconciliation for all users
 * (This would be called by a cron job or scheduled action)
 */
export async function scheduledMaintenanceReconciliation(
  ctx: MutationCtx,
  systemUserId: Id<"users">
) {
  console.log('Starting scheduled maintenance reconciliation...');

  // Get users who haven't been reconciled in the last 24 hours
  const staleUsers = await ctx.db
    .query("users")
    .filter(q => q.or(
      q.eq(q.field("creditsLastUpdated"), undefined),
      q.lt(q.field("creditsLastUpdated"), Date.now() - 24 * 60 * 60 * 1000)
    ))
    .take(1000); // Limit to prevent overwhelming system

  if (staleUsers.length === 0) {
    console.log('No users need reconciliation');
    return { message: 'All users up to date' };
  }

  const userIds = staleUsers.map(u => u._id);

  const result = await reconciliationService.reconcileUsers({
    ctx,
    args: {
      userIds,
      batchSize: 50, // Smaller batches for scheduled operations
      options: {
        includeAnalysis: true,
        forceUpdate: false
      }
    },
    performedBy: systemUserId
  });

  console.log(`Scheduled reconciliation completed: ${result.processedCount} users processed, ${result.updatedCount} updated`);

  return {
    message: 'Scheduled reconciliation completed',
    processedCount: result.processedCount,
    updatedCount: result.updatedCount,
    inconsistencyCount: result.inconsistencyCount,
    errorCount: result.errors.length
  };
}

// ============================================================================
// INTEGRATION PATTERNS
// ============================================================================

/**
 * Pattern 1: Reconcile before any credit operation
 */
export const PATTERN_RECONCILE_BEFORE = {
  description: "Always reconcile before checking/using credits",
  usage: "High accuracy operations, important transactions",
  performance: "Slower but most accurate"
};

/**
 * Pattern 2: Reconcile after credit operations
 */
export const PATTERN_RECONCILE_AFTER = {
  description: "Update cache after ledger changes",
  usage: "Keep cache fresh after modifications",
  performance: "Good balance of accuracy and speed"
};

/**
 * Pattern 3: Reconcile on user actions (login, page load)
 */
export const PATTERN_RECONCILE_ON_ACTION = {
  description: "Opportunistic reconciliation during user interactions",
  usage: "Background cache maintenance",
  performance: "Best user experience"
};

/**
 * Pattern 4: Scheduled reconciliation
 */
export const PATTERN_SCHEDULED = {
  description: "Batch reconciliation during low-traffic periods",
  usage: "System maintenance and consistency checks",
  performance: "Minimal impact on user operations"
};