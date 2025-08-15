// Credit utility functions have been moved to utils/creditExpiration.ts
// This file should only contain business rules and authorization logic

import { v } from "convex/values";
import { ConvexError } from "convex/values";
import { ERROR_CODES } from "../utils/errorCodes";
import type { CreditLedgerEntry } from "../services/creditService";

export const creditRules = {
    /**
     * Validate that a transaction has at least one entry
     */
    validateTransactionHasEntries: (entries: CreditLedgerEntry[]) => {
        if (!entries?.length) {
            throw new ConvexError({
                message: "At least one entry required",
                code: ERROR_CODES.CREDIT_ENTRIES_REQUIRED
            });
        }
    },

    /**
     * Validate that each entry has exactly one entity (userId, businessId, or systemEntity)
     */
    validateEntryEntities: (entries: CreditLedgerEntry[]) => {
        for (const entry of entries) {
            const entityCount = [entry.userId, entry.businessId, entry.systemEntity].filter(Boolean).length;
            if (entityCount !== 1) {
                throw new ConvexError({
                    message: "Each entry needs exactly one entity",
                    code: ERROR_CODES.CREDIT_INVALID_ENTITY
                });
            }
        }
    },

    /**
     * Validate that all entry amounts are valid non-zero numbers
     */
    validateEntryAmounts: (entries: CreditLedgerEntry[]) => {
        for (const entry of entries) {
            if (!Number.isFinite(entry.amount) || entry.amount === 0) {
                throw new ConvexError({
                    message: "Amount must be non-zero number",
                    code: ERROR_CODES.CREDIT_INVALID_AMOUNT
                });
            }
        }
    },

    /**
     * Validate double-entry bookkeeping: entries must sum to zero
     */
    validateDoubleEntryBalance: (entries: CreditLedgerEntry[]) => {
        const totalAmount = entries.reduce((sum, entry) => sum + entry.amount, 0);
        if (Math.abs(totalAmount) > 0.001) {
            throw new ConvexError({
                message: `Entries must sum to zero. Current: ${totalAmount}`,
                code: ERROR_CODES.CREDIT_DOUBLE_ENTRY_VIOLATION
            });
        }
    },

    /**
     * Validate transaction description is provided
     */
    validateTransactionDescription: (description: string) => {
        if (!description?.trim()) {
            throw new ConvexError({
                message: "Transaction description required",
                code: ERROR_CODES.CREDIT_DESCRIPTION_REQUIRED
            });
        }
    },

    /**
     * Validate idempotency key is provided
     */
    validateIdempotencyKey: (idempotencyKey: string) => {
        if (!idempotencyKey?.trim()) {
            throw new ConvexError({
                message: "Idempotency key required",
                code: ERROR_CODES.CREDIT_IDEMPOTENCY_KEY_REQUIRED
            });
        }
    },

    /**
     * Validate all transaction rules at once
     */
    validateTransactionRules: (args: { idempotencyKey: string; description: string; entries: CreditLedgerEntry[] }) => {
        creditRules.validateIdempotencyKey(args.idempotencyKey);
        creditRules.validateTransactionDescription(args.description);
        creditRules.validateTransactionHasEntries(args.entries);
        creditRules.validateEntryEntities(args.entries);
        creditRules.validateEntryAmounts(args.entries);
        creditRules.validateDoubleEntryBalance(args.entries);
    },

    /**
     * Check if a failed transaction can be retried
     */
    canRetryFailedTransaction: (status: string) => {
        if (status === "failed") {
            throw new ConvexError({
                message: "Transaction previously failed and cannot be retried",
                code: ERROR_CODES.CREDIT_TRANSACTION_FAILED,
            });
        }
    },

    /**
     * Determine if transaction should proceed based on existing status
     */
    shouldProceedWithTransaction: (existingTransaction: any) => {
        if (!existingTransaction) return true;

        if (existingTransaction.status === "completed") {
            return false; // Already completed, return existing result
        }

        creditRules.canRetryFailedTransaction(existingTransaction.status);
        return true; // Can proceed (pending or other status)
    },

    /**
     * Validate that a user exists for operations that require it
     */
    validateUserExists: (user: any, userId: string) => {
        if (!user) {
            throw new Error(`User not found: ${userId}`);
        }
    },

    /**
 * Validate that an entity has sufficient balance for a transaction
 */
    validateSufficientBalance: (currentBalance: number, requiredAmount: number) => {
        if (currentBalance < requiredAmount) {
            throw new ConvexError({
                message: `Insufficient balance. Required: ${requiredAmount}, Available: ${currentBalance}`,
                code: "INSUFFICIENT_BALANCE"
            });
        }
    }
};