import { ConvexError } from "convex/values";
import type { Id, Doc } from "../convex/_generated/dataModel";
import { ERROR_CODES } from "../utils/errorCodes";
import type {
  ReconciliationOptions,
  ReconcileUserArgs,
  BulkReconciliationArgs,
  UserCreditBalance
} from "../utils/reconciliation";

/**
 * Business rules and validations for credit reconciliation
 */
export const reconciliationRules = {
  /**
   * Validate that a user ID is provided and valid
   */
  validateUserId: (userId: Id<"users"> | undefined): void => {
    if (!userId) {
      throw new ConvexError({
        message: "User ID is required for reconciliation",
        field: "userId",
        code: ERROR_CODES.VALIDATION_ERROR
      });
    }
  },

  /**
   * Validate reconciliation options
   */
  validateReconciliationOptions: (options?: ReconciliationOptions): void => {
    if (options && typeof options !== 'object') {
      throw new ConvexError({
        message: "Invalid reconciliation options",
        field: "options",
        code: ERROR_CODES.VALIDATION_ERROR
      });
    }
  },

  /**
   * Validate bulk reconciliation arguments
   */
  validateBulkReconciliationArgs: (args: BulkReconciliationArgs): void => {
    if (args.batchSize !== undefined && (args.batchSize < 1 || args.batchSize > 1000)) {
      throw new ConvexError({
        message: "Batch size must be between 1 and 1000",
        field: "batchSize",
        code: ERROR_CODES.VALIDATION_ERROR
      });
    }

    if (args.userIds && args.userIds.length > 10000) {
      throw new ConvexError({
        message: "Cannot reconcile more than 10,000 users in one operation",
        field: "userIds",
        code: ERROR_CODES.VALIDATION_ERROR
      });
    }
  },

  /**
   * Validate that a user exists and can be reconciled
   */
  validateUserExists: (user: Doc<"users"> | null, userId: Id<"users">): Doc<"users"> => {
    if (!user) {
      throw new ConvexError({
        message: "User not found",
        field: "userId",
        code: ERROR_CODES.RESOURCE_NOT_FOUND
      });
    }

    // Could add additional business rules here:
    // - User is not deleted
    // - User is not suspended
    // - User is eligible for reconciliation

    return user;
  },

  /**
   * Validate calculated balance is reasonable
   */
  validateCalculatedBalance: (balance: UserCreditBalance, userId: Id<"users">): void => {
    // Business rule: No negative available credits
    if (balance.availableCredits < 0) {
      throw new ConvexError({
        message: `Invalid calculated balance: available credits cannot be negative (${balance.availableCredits})`,
        field: "availableCredits",
        code: ERROR_CODES.CREDIT_INVALID_AMOUNT
      });
    }

    // Business rule: No negative lifetime credits  
    if (balance.lifetimeCredits < 0) {
      throw new ConvexError({
        message: `Invalid calculated balance: lifetime credits cannot be negative (${balance.lifetimeCredits})`,
        field: "lifetimeCredits",
        code: ERROR_CODES.CREDIT_INVALID_AMOUNT
      });
    }

    // Business rule: Available + held credits cannot exceed total
    if (balance.availableCredits + balance.heldCredits > balance.totalCredits) {
      throw new ConvexError({
        message: "Invalid calculated balance: available + held credits exceed total credits",
        field: "calculatedBalance",
        code: ERROR_CODES.CREDIT_INVALID_AMOUNT
      });
    }

    // Business rule: Reasonable upper limit to detect calculation errors
    if (balance.lifetimeCredits > 1000000) {
      throw new ConvexError({
        message: `Unreasonable lifetime credits value (${balance.lifetimeCredits}), possible calculation error`,
        field: "lifetimeCredits",
        code: ERROR_CODES.CREDIT_TRANSACTION_FAILED
      });
    }
  },

  /**
   * Determine if cache update is needed based on business rules
   */
  shouldUpdateCache: (
    computedBalance: UserCreditBalance,
    cachedBalance: {
      credits: number;
      heldCredits: number;
      lifetimeCredits: number;
      creditsLastUpdated: number | null;
    },
    options?: ReconciliationOptions
  ): boolean => {
    // Always update if forced
    if (options?.forceUpdate) {
      return true;
    }

    // Always update if never updated before
    if (!cachedBalance.creditsLastUpdated) {
      return true;
    }

    // Update if any significant differences found
    const TOLERANCE = 0.01; // Allow for floating point precision issues

    const availableDiff = Math.abs(computedBalance.availableCredits - cachedBalance.credits);
    const heldDiff = Math.abs(computedBalance.heldCredits - cachedBalance.heldCredits);
    const lifetimeDiff = Math.abs(computedBalance.lifetimeCredits - cachedBalance.lifetimeCredits);

    return availableDiff > TOLERANCE || heldDiff > TOLERANCE || lifetimeDiff > TOLERANCE;
  },

  /**
   * Detect inconsistencies between ledger and cache
   */
  detectInconsistencies: (
    computedBalance: UserCreditBalance,
    cachedBalance: {
      credits: number;
      heldCredits: number;
      lifetimeCredits: number;
      creditsLastUpdated: number | null;
    },
    currentTime: number = Date.now()
  ): string[] => {
    const inconsistencies: string[] = [];
    const TOLERANCE = 0.01;

    const availableDiff = Math.abs(computedBalance.availableCredits - cachedBalance.credits);
    const heldDiff = Math.abs(computedBalance.heldCredits - cachedBalance.heldCredits);
    const lifetimeDiff = Math.abs(computedBalance.lifetimeCredits - cachedBalance.lifetimeCredits);

    if (availableDiff > TOLERANCE) {
      inconsistencies.push(
        `Available credits mismatch: cached=${cachedBalance.credits}, computed=${computedBalance.availableCredits}, diff=${availableDiff}`
      );
    }

    if (heldDiff > TOLERANCE) {
      inconsistencies.push(
        `Held credits mismatch: cached=${cachedBalance.heldCredits}, computed=${computedBalance.heldCredits}, diff=${heldDiff}`
      );
    }

    if (lifetimeDiff > TOLERANCE) {
      inconsistencies.push(
        `Lifetime credits mismatch: cached=${cachedBalance.lifetimeCredits}, computed=${computedBalance.lifetimeCredits}, diff=${lifetimeDiff}`
      );
    }

    // Check for stale data (not updated in over a week)
    const ONE_WEEK = 7 * 24 * 60 * 60 * 1000;
    if (cachedBalance.creditsLastUpdated && currentTime - cachedBalance.creditsLastUpdated > ONE_WEEK) {
      inconsistencies.push(
        `Stale cache data: last updated ${Math.round((currentTime - cachedBalance.creditsLastUpdated) / (24 * 60 * 60 * 1000))} days ago`
      );
    }

    return inconsistencies;
  },

  /**
   * Business rule: Maximum reconciliation frequency per user
   */
  validateReconciliationFrequency: (
    lastUpdated: number | null,
    minIntervalMs: number = 60000, // 1 minute by default
    currentTime: number = Date.now()
  ): void => {
    if (lastUpdated && currentTime - lastUpdated < minIntervalMs) {
      throw new ConvexError({
        message: `Reconciliation too frequent. Last updated ${Math.round((currentTime - lastUpdated) / 1000)} seconds ago`,
        field: "reconciliationFrequency",
        code: ERROR_CODES.BUSINESS_RULE_VIOLATION
      });
    }
  }
};