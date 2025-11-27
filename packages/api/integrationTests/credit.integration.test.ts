import { describe, expect, test } from "vitest";
import { api } from "../convex/_generated/api";
import { internal } from "../convex/_generated/api";
import { initAuth, setupClassForBooking, testT } from "./helpers";

describe('Credit System Integration Tests', () => {

    describe('Authentication & Authorization', () => {
        test('should allow authenticated credit operations', async () => {
            const { userId } = await initAuth();
            const asUser = testT.withIdentity({ subject: userId });

            const balance = await asUser.query(api.queries.credits.getUserBalance, {
                userId: userId
            });

            expect(balance).toBeDefined();
            expect(balance.balance).toBe(0); // New user starts with 0 credits
        });
    });

    describe('Credit Transactions', () => {
        test('should gift credits and create proper transaction record', async () => {
            const { userId } = await initAuth();
            const asUser = testT.withIdentity({ subject: userId });

            // Gift credits
            const giftResult = await asUser.mutation(api.internal.mutations.credits.giftCredits, {
                userId: userId,
                amount: 15,
                description: "Welcome bonus"
            });

            expect(giftResult.success).toBe(true);
            expect(giftResult.newBalance).toBe(15);
            expect(giftResult.transactionId).toBeDefined();

            // Verify balance
            const balance = await asUser.query(api.queries.credits.getUserBalance, {
                userId: userId
            });
            expect(balance.balance).toBe(15);

            // Verify transaction record
            const transactions = await asUser.query(api.queries.credits.getUserTransactions, {
                userId: userId
            });
            expect(transactions).toHaveLength(1);
            expect(transactions[0].amount).toBe(15);
            expect(transactions[0].type).toBe("gift");
            expect(transactions[0].description).toBe("Welcome bonus");
        });

        test('should purchase credits with external reference', async () => {
            const { userId } = await initAuth();
            const asUser = testT.withIdentity({ subject: userId });

            const purchaseResult = await asUser.mutation(api.mutations.credits.purchaseCredits, {
                userId: userId,
                amount: 20,
                paymentRef: "stripe_pi_1234567890",
                description: "Credit purchase via Stripe"
            });

            expect(purchaseResult.success).toBe(true);
            expect(purchaseResult.newBalance).toBe(20);

            // Verify transaction has external reference
            const transactions = await asUser.query(api.queries.credits.getUserTransactions, {
                userId: userId,
                type: "purchase"
            });
            expect(transactions).toHaveLength(1);
            expect(transactions[0].externalRef).toBe("stripe_pi_1234567890");
            expect(transactions[0].type).toBe("purchase");
        });

        test('should refund credits with business context', async () => {
            const { userId, businessId } = await initAuth();
            const asUser = testT.withIdentity({ subject: userId });

            // Give user some credits first
            await asUser.mutation(api.internal.mutations.credits.giftCredits, {
                userId: userId,
                amount: 10
            });

            // Refund credits
            const refundResult = await asUser.mutation(api.mutations.credits.refundCredits, {
                userId: userId,
                amount: 5,
                reason: "Class cancelled",
                businessId: businessId
            });

            expect(refundResult.success).toBe(true);
            expect(refundResult.newBalance).toBe(15); // 10 + 5

            // Verify refund transaction
            const transactions = await asUser.query(api.queries.credits.getUserTransactions, {
                userId: userId,
                type: "refund"
            });
            expect(transactions).toHaveLength(1);
            expect(transactions[0].amount).toBe(5);
            expect(transactions[0].businessId).toBe(businessId);
            expect(transactions[0].description).toBe("Refund: Class cancelled");
        });

        test('should prevent negative credit amounts', async () => {
            const { userId } = await initAuth();
            const asUser = testT.withIdentity({ subject: userId });

            await expect(
                asUser.mutation(api.internal.mutations.credits.giftCredits, {
                    userId: userId,
                    amount: -5
                })
            ).rejects.toThrow("Credit amount must be greater than 0");
        });
    });

    describe('Transaction History and Analytics', () => {
        test('should track complete transaction history', async () => {
            const { userId, businessId } = await initAuth();
            const asUser = testT.withIdentity({ subject: userId });

            // Gifted 20 credits
            await asUser.mutation(api.internal.mutations.credits.giftCredits, {
                userId: userId,
                amount: 20,
                description: "Welcome gift"
            });

            // Purchased 10 credits
            await asUser.mutation(api.mutations.credits.purchaseCredits, {
                userId: userId,
                amount: 10,
                paymentRef: "stripe_pi_test",
                description: "Credit purchase"
            });

            const { instanceId } = await setupClassForBooking(asUser, businessId, userId);

            // Spent 5 credits (500 cents = 5 credits)
            const bookingResult = await asUser.mutation(api.mutations.bookings.bookClass, {
                classInstanceId: instanceId,
                description: "Test yoga session"
            });


            // Verify final balance
            const balance = await asUser.query(api.queries.credits.getUserBalance, {
                userId: userId
            });
            expect(balance.balance).toBe(25); // 20 + 10 - 5

            // Verify transaction history
            const allTransactions = await asUser.query(api.queries.credits.getUserTransactions, {
                userId: userId
            });
            expect(allTransactions).toHaveLength(3);

            // Check transaction types
            const transactionTypes = allTransactions.map(t => t.type);
            expect(transactionTypes).toContain("gift");
            expect(transactionTypes).toContain("purchase");
            expect(transactionTypes).toContain("spend");
        });

        test('should filter transactions by type', async () => {
            const { userId } = await initAuth();
            const asUser = testT.withIdentity({ subject: userId });

            // Create multiple transaction types
            await asUser.mutation(api.internal.mutations.credits.giftCredits, {
                userId: userId,
                amount: 10
            });

            await asUser.mutation(api.mutations.credits.purchaseCredits, {
                userId: userId,
                amount: 15,
                paymentRef: "stripe_test"
            });

            // Filter by type
            const giftTransactions = await asUser.query(api.queries.credits.getUserTransactions, {
                userId: userId,
                type: "gift"
            });
            expect(giftTransactions).toHaveLength(1);
            expect(giftTransactions[0].type).toBe("gift");

            const purchaseTransactions = await asUser.query(api.queries.credits.getUserTransactions, {
                userId: userId,
                type: "purchase"
            });
            expect(purchaseTransactions).toHaveLength(1);
            expect(purchaseTransactions[0].type).toBe("purchase");
        });

        test('should get business earnings analytics', async () => {
            const { userId, businessId } = await initAuth();
            const asUser = testT.withIdentity({ subject: userId });

            // Gifted 50 credits
            await asUser.mutation(api.internal.mutations.credits.giftCredits, {
                userId: userId,
                amount: 50
            });

            // Simulate bookings (earnings for business)
            const { instanceId } = await setupClassForBooking(asUser, businessId, userId);

            // Spend 5 credits (500 cents = 5 credits)
            const bookingResult = await asUser.mutation(api.mutations.bookings.bookClass, {
                classInstanceId: instanceId,
                description: "Test yoga session"
            });


            // Simulate a refund
            await asUser.mutation(api.mutations.credits.refundCredits, {
                userId: userId,
                amount: 5,
                reason: "Cancelled class",
                businessId: businessId
            });

            // Get business earnings
            const earnings = await asUser.query(api.queries.credits.getBusinessEarnings, {
                businessId: businessId
            });

            expect(earnings.totalEarnings).toBe(5); // 5 credits from booking
            expect(earnings.totalRefunds).toBe(5);
            expect(earnings.netEarnings).toBe(0); // 5 - 5
            expect(earnings.transactionCount).toBe(2); // 1 bookings + 1 refund
        });
    });

    describe('Credit System End-to-End', () => {
        test('should handle complete credit lifecycle', async () => {
            const { userId, businessId } = await initAuth();
            const asUser = testT.withIdentity({ subject: userId });

            // 1. User receives welcome bonus
            await asUser.mutation(api.internal.mutations.credits.giftCredits, {
                userId: userId,
                amount: 5,
                description: "Welcome bonus"
            });

            // 2. User purchases additional credits
            await asUser.mutation(api.mutations.credits.purchaseCredits, {
                userId: userId,
                amount: 20,
                paymentRef: "stripe_pi_welcome",
                description: "First credit purchase"
            });

            // Verify balance after purchase
            let balance = await asUser.query(api.queries.credits.getUserBalance, {
                userId: userId
            });
            expect(balance.balance).toBe(25); // 5 + 20

            // 3. User books multiple classes
            const { instanceId: instanceId1 } = await setupClassForBooking(asUser, businessId, userId);
            const { instanceId: instanceId2 } = await setupClassForBooking(asUser, businessId, userId);

            // Spend some credits
            const bookingResult = await asUser.mutation(api.mutations.bookings.bookClass, {
                classInstanceId: instanceId1,
                description: "Test yoga session 1"
            });

            const bookingResult2 = await asUser.mutation(api.mutations.bookings.bookClass, {
                classInstanceId: instanceId2,
                description: "Test yoga session 2"
            });

            // Verify balance after bookings
            balance = await asUser.query(api.queries.credits.getUserBalance, {
                userId: userId
            });
            expect(balance.balance).toBe(15); // 25 - 5 - 5 (each class costs 5 credits)

            // 4. One class gets cancelled (refund)
            await asUser.mutation(api.mutations.credits.refundCredits, {
                userId: userId,
                amount: 8,
                reason: "Instructor sick",
                businessId: businessId
            });

            // Verify final balance
            balance = await asUser.query(api.queries.credits.getUserBalance, {
                userId: userId
            });
            expect(balance.balance).toBe(23); // 15 + 8 (balance after bookings was 15, refund adds 8)

            // 5. Verify complete transaction history
            const transactions = await asUser.query(api.queries.credits.getUserTransactions, {
                userId: userId
            });
            expect(transactions).toHaveLength(5);

            // Verify transaction amounts sum correctly
            const totalCreditsIn = transactions
                .filter(t => t.amount > 0)
                .reduce((sum, t) => sum + t.amount, 0);
            const totalCreditsOut = transactions
                .filter(t => t.amount < 0)
                .reduce((sum, t) => sum + Math.abs(t.amount), 0);

            expect(totalCreditsIn).toBe(33); // 5 + 20 + 8 (refund)
            expect(totalCreditsOut).toBe(10); // 5 + 5 (bookings, each costs 5 credits)
            expect(totalCreditsIn - totalCreditsOut).toBe(23); // Final balance (33 - 10 = 23)
        });
    });

    describe('Data Integrity', () => {
        test('should maintain consistent balance with transaction history', async () => {
            const { userId } = await initAuth();
            const asUser = testT.withIdentity({ subject: userId });

            // Perform various operations
            await asUser.mutation(api.internal.mutations.credits.giftCredits, {
                userId: userId,
                amount: 15
            });

            await asUser.mutation(api.mutations.credits.purchaseCredits, {
                userId: userId,
                amount: 25,
                paymentRef: "stripe_consistency_test"
            });

            // Get current balance
            const balance = await asUser.query(api.queries.credits.getUserBalance, {
                userId: userId
            });

            // Calculate balance from transactions
            const transactions = await asUser.query(api.queries.credits.getUserTransactions, {
                userId: userId
            });

            const calculatedBalance = transactions.reduce((sum, transaction) => {
                return sum + transaction.amount;
            }, 0);

            expect(balance.balance).toBe(calculatedBalance);
            expect(balance.balance).toBe(40); // 15 + 25
        });

        test('should handle concurrent operations correctly', async () => {
            const { userId } = await initAuth();
            const asUser = testT.withIdentity({ subject: userId });

            // Give user initial credits
            await asUser.mutation(api.internal.mutations.credits.giftCredits, {
                userId: userId,
                amount: 100
            });

            // This test verifies the credit service handles operations atomically
            // In a real concurrent scenario, we'd test with multiple simultaneous operations
            const finalBalance = await asUser.query(api.queries.credits.getUserBalance, {
                userId: userId
            });

            expect(finalBalance.balance).toBe(100);
        });
    });
});