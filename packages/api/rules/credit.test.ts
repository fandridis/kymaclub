import { describe, it, expect } from "vitest";
import { creditExpirationUtils } from "../utils/creditExpiration";
import type { Doc } from "../convex/_generated/dataModel";

describe('Credit Rules', () => {
    const baseTime = 1640995200000; // January 1, 2022 00:00:00 UTC
    const oneDayMs = 24 * 60 * 60 * 1000;
    const oneMonthMs = 30 * oneDayMs;

    const createMockCreditEntry = (overrides: Partial<Doc<"creditLedger">> = {}): Doc<"creditLedger"> => ({
        _id: "credit123" as any,
        _creationTime: baseTime,
        userId: "user123" as any,
        businessId: "business123" as any,
        accountType: "customer",
        creditType: "credit_purchase",
        amount: 100,
        balanceAfter: 100,
        description: "Test credit purchase",
        externalReference: "test_ref",
        expiresAt: baseTime + oneMonthMs,
        createdAt: baseTime,
        ...overrides
    });

    describe('isExpired', () => {
        it('should return false for credits without expiration', () => {
            const entry = createMockCreditEntry({ expiresAt: undefined });
            
            expect(creditExpirationUtils.isExpired(entry, baseTime)).toBe(false);
        });

        it('should return false for credits not yet expired', () => {
            const entry = createMockCreditEntry({ expiresAt: baseTime + oneDayMs });
            
            expect(creditExpirationUtils.isExpired(entry, baseTime)).toBe(false);
        });

        it('should return true for expired credits', () => {
            const entry = createMockCreditEntry({ expiresAt: baseTime - oneDayMs });
            
            expect(creditExpirationUtils.isExpired(entry, baseTime)).toBe(true);
        });

        it('should return true for credits that expire exactly at current time', () => {
            const entry = createMockCreditEntry({ expiresAt: baseTime });
            
            expect(creditExpirationUtils.isExpired(entry, baseTime)).toBe(true);
        });
    });

    describe('isExpiringWithinWarningPeriod', () => {
        it('should return false for credits without expiration', () => {
            const entry = createMockCreditEntry({ expiresAt: undefined });
            
            expect(creditExpirationUtils.isExpiringWithinWarningPeriod(entry, 30, baseTime)).toBe(false);
        });

        it('should return false for credits expiring beyond warning period', () => {
            const entry = createMockCreditEntry({ expiresAt: baseTime + (31 * oneDayMs) });
            
            expect(creditExpirationUtils.isExpiringWithinWarningPeriod(entry, 30, baseTime)).toBe(false);
        });

        it('should return true for credits expiring within warning period', () => {
            const entry = createMockCreditEntry({ expiresAt: baseTime + (15 * oneDayMs) });
            
            expect(creditExpirationUtils.isExpiringWithinWarningPeriod(entry, 30, baseTime)).toBe(true);
        });

        it('should return true for credits expiring exactly at warning boundary', () => {
            const entry = createMockCreditEntry({ expiresAt: baseTime + (30 * oneDayMs) });
            
            expect(creditExpirationUtils.isExpiringWithinWarningPeriod(entry, 30, baseTime)).toBe(true);
        });

        it('should handle custom warning periods', () => {
            const entry = createMockCreditEntry({ expiresAt: baseTime + (5 * oneDayMs) });
            
            expect(creditExpirationUtils.isExpiringWithinWarningPeriod(entry, 7, baseTime)).toBe(true);
            expect(creditExpirationUtils.isExpiringWithinWarningPeriod(entry, 3, baseTime)).toBe(false);
        });
    });

    describe('calculateExpirationDate', () => {
        const systemSettings = {
            credit_expiration_days_standard: 90,
            credit_expiration_days_extended: 150,
            credit_expiration_days_refund: 30
        };

        it('should return undefined for non-expiring credit types', () => {
            const nonExpiringTypes = [
                'revenue_earn',
                'system_refund_cost',
                'revenue_payout',
                'system_credit_cost',
                'system_payout_cost'
            ];

            nonExpiringTypes.forEach(type => {
                expect(creditExpirationUtils.calculateExpirationDate(type, systemSettings, false, baseTime))
                    .toBeUndefined();
            });
        });

        it('should use standard expiration for credit_purchase', () => {
            const result = creditExpirationUtils.calculateExpirationDate(
                'credit_purchase',
                systemSettings,
                false,
                baseTime
            );
            
            expect(result).toBe(baseTime + (90 * oneDayMs));
        });

        it('should use extended expiration for users with extended privileges', () => {
            const result = creditExpirationUtils.calculateExpirationDate(
                'credit_purchase',
                systemSettings,
                true,
                baseTime
            );
            
            expect(result).toBe(baseTime + (150 * oneDayMs));
        });

        it('should use refund-specific expiration for credit_refund', () => {
            const result = creditExpirationUtils.calculateExpirationDate(
                'credit_refund',
                systemSettings,
                false,
                baseTime
            );
            
            expect(result).toBe(baseTime + (30 * oneDayMs));
        });

        it('should return undefined for credit_expire type', () => {
            const result = creditExpirationUtils.calculateExpirationDate(
                'credit_expire',
                systemSettings,
                false,
                baseTime
            );
            
            expect(result).toBeUndefined();
        });

        it('should use default values when system settings are missing', () => {
            const emptySettings = {};
            
            const result = creditExpirationUtils.calculateExpirationDate(
                'credit_purchase',
                emptySettings,
                false,
                baseTime
            );
            
            expect(result).toBe(baseTime + (90 * oneDayMs));
        });

        it('should fallback to standard when extended setting is missing', () => {
            const partialSettings = { credit_expiration_days_standard: 60 };
            
            const result = creditExpirationUtils.calculateExpirationDate(
                'credit_purchase',
                partialSettings,
                true,
                baseTime
            );
            
            expect(result).toBe(baseTime + (60 * oneDayMs));
        });
    });

    describe('getDefaultExpirationDays', () => {
        it('should return correct defaults for known types', () => {
            expect(creditExpirationUtils.getDefaultExpirationDays('credit_purchase')).toBe(90);
            expect(creditExpirationUtils.getDefaultExpirationDays('credit_bonus')).toBe(30);
            expect(creditExpirationUtils.getDefaultExpirationDays('credit_refund')).toBe(30);
        });

        it('should return 90 days for unknown types', () => {
            expect(creditExpirationUtils.getDefaultExpirationDays('unknown_type' as any)).toBe(90);
        });
    });

    describe('shouldExpireCredits', () => {
        it('should return false for non-expiring credit types', () => {
            const nonExpiringTypes = [
                'revenue_earn',
                'system_refund_cost',
                'revenue_payout',
                'system_credit_cost',
                'system_payout_cost'
            ];

            nonExpiringTypes.forEach(type => {
                expect(creditExpirationUtils.shouldExpireCredits(type)).toBe(false);
            });
        });

        it('should return true for expiring credit types', () => {
            const expiringTypes = [
                'credit_purchase',
                'credit_bonus',
                'credit_refund',
                'unknown_type'
            ];

            expiringTypes.forEach(type => {
                expect(creditExpirationUtils.shouldExpireCredits(type)).toBe(true);
            });
        });
    });
});