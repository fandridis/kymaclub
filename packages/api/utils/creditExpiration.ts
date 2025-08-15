import type { Doc } from "../convex/_generated/dataModel";

/**
 * Pure credit expiration utility functions
 * No database calls - all logic based on provided data
 */

/**
 * Check if a credit ledger entry has expired
 */
export const isExpired = (entry: Doc<"creditLedger">, currentTime: number = Date.now()): boolean => {
    return entry.expiresAt ? entry.expiresAt <= currentTime : false;
};

/**
 * Check if a credit will expire within the warning period
 */
export const isExpiringWithinWarningPeriod = (
    entry: Doc<"creditLedger">,
    warningDays: number = 30,
    currentTime: number = Date.now()
): boolean => {
    if (!entry.expiresAt) return false;
    const warningTime = currentTime + (warningDays * 24 * 60 * 60 * 1000);
    return entry.expiresAt <= warningTime;
};

/**
 * Calculate expiration date based on credit type and configuration
 * Pure function - no database calls
 */
export const calculateExpirationDate = (
    creditType: string,
    systemSettings: Record<string, number>,
    userHasExtendedExpiration: boolean = false,
    baseTime: number = Date.now()
): number | undefined => {
    // Credits that never expire
    const nonExpiringTypes = [
        'revenue_earn',           // Business earnings don't expire
        'system_refund_cost',     // Business refund costs are permanent
        'revenue_payout',         // Payout debits are permanent
        'system_credit_cost',     // System balancing entries
        'system_payout_cost'      // System payment balancing
    ];

    if (nonExpiringTypes.includes(creditType)) {
        return undefined; // No expiration
    }

    // Get default expiration days for credit type
    let expirationDays: number;

    switch (creditType) {
        case 'credit_purchase':
        case 'credit_bonus': {
            const baseKey = "credit_expiration_days_standard";
            const extendedKey = "credit_expiration_days_extended";

            expirationDays = userHasExtendedExpiration
                ? (systemSettings[extendedKey] ?? systemSettings[baseKey] ?? 90)
                : (systemSettings[baseKey] ?? 90);
            break;
        }

        case 'credit_refund': {
            expirationDays = systemSettings["credit_expiration_days_refund"] ?? 30;
            break;
        }

        case 'credit_expire': {
            // Credits from expiration processing don't get new expiration
            return undefined;
        }

        default: {
            // Default for unknown types
            expirationDays = systemSettings["credit_expiration_days_standard"] ?? 90;
        }
    }

    return baseTime + (expirationDays * 24 * 60 * 60 * 1000);
};

/**
 * Get default expiration days for a credit type
 * Used for fallbacks when system settings aren't available
 */
export const getDefaultExpirationDays = (creditType: 'credit_purchase' | 'credit_bonus' | 'credit_refund'): number => {
    const defaults = {
        credit_purchase: 90,   // 3 months
        credit_bonus: 30,      // 1 month
        credit_refund: 30,     // 1 month
    };

    return defaults[creditType as keyof typeof defaults] ?? 90;
};

/**
 * Determine if credits should expire (business policy)
 */
export const shouldExpireCredits = (creditType: string): boolean => {
    const nonExpiringTypes = [
        'revenue_earn',
        'system_refund_cost',
        'revenue_payout',
        'system_credit_cost',
        'system_payout_cost'
    ];
    return !nonExpiringTypes.includes(creditType);
};

export const creditExpirationUtils = {
    isExpired,
    isExpiringWithinWarningPeriod,
    calculateExpirationDate,
    getDefaultExpirationDays,
    shouldExpireCredits,
};