import { describe, it, expect } from "vitest";
import { makeIdempotencyKey, validateCreditAmount } from "./credits";
import type { 
    GrantCreditArgs, 
    TransferCreditArgs, 
    CreditLedgerEntry,
    CreditTransferResult,
    ReconcileResult 
} from "./credits";

describe('Credit Utils', () => {
    describe('makeIdempotencyKey', () => {
        it('should generate key with namespace and stable ID', () => {
            const key = makeIdempotencyKey('purchase', 'user123');
            
            expect(key).toBe('purchase:user123');
        });

        it('should generate key with namespace and numeric stable ID', () => {
            const key = makeIdempotencyKey('booking', 456);
            
            expect(key).toBe('booking:456');
        });

        it('should generate unique key when no stable ID provided', () => {
            const key1 = makeIdempotencyKey('random');
            const key2 = makeIdempotencyKey('random');
            
            expect(key1).toMatch(/^random:/);
            expect(key2).toMatch(/^random:/);
            expect(key1).not.toBe(key2);
        });

        it('should handle null and undefined stable IDs', () => {
            const keyNull = makeIdempotencyKey('test', null);
            const keyUndefined = makeIdempotencyKey('test', undefined);
            
            expect(keyNull).toMatch(/^test:/);
            expect(keyUndefined).toMatch(/^test:/);
            expect(keyNull).not.toBe(keyUndefined);
        });

        it('should handle zero as valid stable ID', () => {
            const key = makeIdempotencyKey('test', 0);
            
            expect(key).toBe('test:0');
        });

        it('should handle empty string as valid stable ID', () => {
            const key = makeIdempotencyKey('test', '');
            
            expect(key).toBe('test:');
        });
    });

    describe('validateCreditAmount', () => {
        it('should accept valid positive amounts', () => {
            expect(() => validateCreditAmount(1)).not.toThrow();
            expect(() => validateCreditAmount(100)).not.toThrow();
            expect(() => validateCreditAmount(9999)).not.toThrow();
        });

        it('should accept decimal amounts', () => {
            expect(() => validateCreditAmount(1.5)).not.toThrow();
            expect(() => validateCreditAmount(99.99)).not.toThrow();
        });

        it('should reject zero amount', () => {
            expect(() => validateCreditAmount(0))
                .toThrow('Credit amount must be positive');
        });

        it('should reject negative amounts', () => {
            expect(() => validateCreditAmount(-1))
                .toThrow('Credit amount must be positive');
            
            expect(() => validateCreditAmount(-100))
                .toThrow('Credit amount must be positive');
        });

        it('should reject infinite amounts', () => {
            expect(() => validateCreditAmount(Infinity))
                .toThrow('Credit amount must be a finite number');
            
            expect(() => validateCreditAmount(-Infinity))
                .toThrow('Credit amount must be positive'); // -Infinity is caught by the first check
        });

        it('should reject NaN', () => {
            expect(() => validateCreditAmount(NaN))
                .toThrow('Credit amount must be a finite number');
        });

        it('should reject amounts exceeding maximum limit', () => {
            expect(() => validateCreditAmount(10001))
                .toThrow('Credit amount exceeds maximum limit of 10,000');
            
            expect(() => validateCreditAmount(50000))
                .toThrow('Credit amount exceeds maximum limit of 10,000');
        });

        it('should accept amount at maximum limit', () => {
            expect(() => validateCreditAmount(10000)).not.toThrow();
        });
    });

    describe('Type definitions', () => {
        describe('GrantCreditArgs', () => {
            it('should have correct structure for purchase', () => {
                const args: GrantCreditArgs = {
                    idempotencyKey: 'purchase:user123',
                    userId: 'user123' as any,
                    amount: 100,
                    createdBy: 'admin123' as any,
                    description: 'Credit purchase',
                    externalReference: 'stripe_payment_123',
                    creditValue: 2,
                    expiresAt: Date.now() + 90 * 24 * 60 * 60 * 1000,
                    kind: 'purchase'
                };

                expect(args.kind).toBe('purchase');
                expect(args.amount).toBe(100);
                expect(args.creditValue).toBe(2);
                expect(typeof args.expiresAt).toBe('number');
            });

            it('should have correct structure for bonus', () => {
                const args: GrantCreditArgs = {
                    idempotencyKey: 'bonus:user123',
                    userId: 'user123' as any,
                    amount: 50,
                    createdBy: 'admin123' as any,
                    kind: 'bonus'
                };

                expect(args.kind).toBe('bonus');
                expect(args.description).toBeUndefined();
                expect(args.creditValue).toBeUndefined();
            });
        });

        describe('TransferCreditArgs', () => {
            it('should have correct structure', () => {
                const args: TransferCreditArgs = {
                    idempotencyKey: 'booking:instance123',
                    bookingId: 'booking123' as any,
                    classInstanceId: 'instance123' as any,
                    businessId: 'business123' as any,
                    userId: 'user123' as any,
                    creditsAmount: 5,
                    createdBy: 'user123' as any,
                    description: 'Yoga class booking'
                };

                expect(args.creditsAmount).toBe(5);
                expect(args.bookingId).toBeDefined();
                expect(args.classInstanceId).toBeDefined();
            });
        });

        describe('CreditLedgerEntry', () => {
            it('should support customer account entry', () => {
                const entry: CreditLedgerEntry = {
                    transactionId: 'txn123',
                    account: 'customer',
                    userId: 'user123' as any,
                    amount: 100,
                    type: 'credit_purchase',
                    description: 'Credit purchase',
                    idempotencyKey: 'purchase:user123',
                    effectiveAt: Date.now(),
                    createdAt: Date.now(),
                    createdBy: 'admin123' as any
                };

                expect(entry.account).toBe('customer');
                expect(entry.userId).toBeDefined();
                expect(entry.businessId).toBeUndefined();
            });

            it('should support business account entry', () => {
                const entry: CreditLedgerEntry = {
                    transactionId: 'txn123',
                    account: 'business',
                    businessId: 'business123' as any,
                    amount: -5,
                    type: 'revenue_earn',
                    description: 'Class booking revenue',
                    idempotencyKey: 'booking:instance123',
                    effectiveAt: Date.now(),
                    createdAt: Date.now(),
                    createdBy: 'user123' as any,
                    relatedBookingId: 'booking123' as any,
                    relatedClassInstanceId: 'instance123' as any
                };

                expect(entry.account).toBe('business');
                expect(entry.businessId).toBeDefined();
                expect(entry.amount).toBe(-5);
            });

            it('should support system account entry', () => {
                const entry: CreditLedgerEntry = {
                    transactionId: 'txn123',
                    account: 'system',
                    systemEntity: 'platform_fee',
                    amount: 1,
                    type: 'system_credit_cost',
                    description: 'Platform fee',
                    idempotencyKey: 'booking:instance123',
                    effectiveAt: Date.now(),
                    createdAt: Date.now(),
                    createdBy: 'system' as any
                };

                expect(entry.account).toBe('system');
                expect(entry.systemEntity).toBe('platform_fee');
                expect(entry.userId).toBeUndefined();
            });
        });

        describe('CreditTransferResult', () => {
            it('should have correct structure', () => {
                const result: CreditTransferResult = {
                    transactionId: 'txn_abc123'
                };

                expect(result.transactionId).toBe('txn_abc123');
                expect(typeof result.transactionId).toBe('string');
            });
        });

        describe('ReconcileResult', () => {
            it('should have correct structure', () => {
                const result: ReconcileResult = {
                    cachedCredits: 100,
                    computedCredits: 95,
                    deltaCredits: -5,
                    cachedLifetimeCredits: 500,
                    computedLifetimeCredits: 495,
                    deltaLifetimeCredits: -5,
                    updated: true
                };

                expect(result.deltaCredits).toBe(-5);
                expect(result.deltaLifetimeCredits).toBe(-5);
                expect(result.updated).toBe(true);
                expect(typeof result.cachedCredits).toBe('number');
            });

            it('should handle no changes scenario', () => {
                const result: ReconcileResult = {
                    cachedCredits: 100,
                    computedCredits: 100,
                    deltaCredits: 0,
                    cachedLifetimeCredits: 500,
                    computedLifetimeCredits: 500,
                    deltaLifetimeCredits: 0,
                    updated: false
                };

                expect(result.deltaCredits).toBe(0);
                expect(result.updated).toBe(false);
            });
        });
    });

    describe('Credit operation scenarios', () => {
        it('should handle purchase with expiration', () => {
            const purchaseArgs: GrantCreditArgs = {
                idempotencyKey: makeIdempotencyKey('purchase', 'stripe_123'),
                userId: 'user123' as any,
                amount: 200,
                createdBy: 'user123' as any,
                description: 'Credit package purchase',
                externalReference: 'stripe_123',
                creditValue: 2,
                expiresAt: Date.now() + (90 * 24 * 60 * 60 * 1000),
                kind: 'purchase'
            };

            expect(() => validateCreditAmount(purchaseArgs.amount)).not.toThrow();
            expect(purchaseArgs.idempotencyKey).toBe('purchase:stripe_123');
            expect(purchaseArgs.kind).toBe('purchase');
        });

        it('should handle booking transfer', () => {
            const transferArgs: TransferCreditArgs = {
                idempotencyKey: makeIdempotencyKey('booking', 'instance_456'),
                bookingId: 'booking456' as any,
                classInstanceId: 'instance456' as any,
                businessId: 'business123' as any,
                userId: 'user123' as any,
                creditsAmount: 5,
                createdBy: 'user123' as any,
                description: 'Yoga class booking payment'
            };

            expect(() => validateCreditAmount(transferArgs.creditsAmount)).not.toThrow();
            expect(transferArgs.idempotencyKey).toBe('booking:instance_456');
        });
    });
});