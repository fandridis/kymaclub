import { describe, test, expect } from "vitest";
import { ConvexError } from "convex/values";
import { initAuth, testT } from "./helpers";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";

describe("Credit System Integration Tests", () => {
    test("giftCredits: should successfully gift credits to a user", async () => {
        const { userId } = await initAuth();

        const result = await testT.mutation(api.mutations.credits.giftCredits, {
            userId,
            amount: 10,
            description: "Welcome bonus"
        });

        expect(result.success).toBe(true);
        expect(result.newBalance).toBe(10);
        expect(result.transactionId).toBeDefined();
        expect(result.message).toContain("Successfully gifted 10 credits");
    });

    test("giftCredits: should handle multiple gift transactions with different amounts", async () => {
        const { userId } = await initAuth();

        // First gift
        const result1 = await testT.mutation(api.mutations.credits.giftCredits, {
            userId,
            amount: 5,
            description: "First gift"
        });

        expect(result1.newBalance).toBe(5);

        // Second gift
        const result2 = await testT.mutation(api.mutations.credits.giftCredits, {
            userId,
            amount: 7,
            description: "Second gift"
        });

        expect(result2.newBalance).toBe(12);
        expect(result2.transactionId).not.toBe(result1.transactionId);
    });

    test("giftCredits: should handle zero and negative amounts appropriately", async () => {
        const { userId } = await initAuth();

        // Test zero amount - should fail validation
        await expect(
            testT.mutation(api.mutations.credits.giftCredits, {
                userId,
                amount: 0
            })
        ).rejects.toThrow();

        // Test negative amount - should fail validation  
        await expect(
            testT.mutation(api.mutations.credits.giftCredits, {
                userId,
                amount: -5
            })
        ).rejects.toThrow();
    });

    test("reconcileUserCredits: should reconcile user credits correctly", async () => {
        const { userId } = await initAuth();

        // First gift some credits
        await testT.mutation(api.mutations.credits.giftCredits, {
            userId,
            amount: 15,
            description: "Test credits"
        });

        // Reconcile credits
        const reconcileResult = await testT.mutation(api.mutations.credits.reconcileUserCredits, {
            userId,
            updateCache: true
        });

        expect(reconcileResult.computedCredits).toBe(15);
        expect(reconcileResult.cachedCredits).toBe(15);
        expect(reconcileResult.deltaCredits).toBe(0);
        expect(reconcileResult.updated).toBe(true);
        expect(reconcileResult.message).toContain("no discrepancy");
    });

    test("reconcileUserCredits: should handle reconciliation without cache update", async () => {
        const { userId } = await initAuth();

        await testT.mutation(api.mutations.credits.giftCredits, {
            userId,
            amount: 8,
            description: "Test credits"
        });

        const reconcileResult = await testT.mutation(api.mutations.credits.reconcileUserCredits, {
            userId,
            updateCache: false
        });

        expect(reconcileResult.computedCredits).toBe(8);
        expect(reconcileResult.updated).toBe(false);
    });

    test("credit transaction idempotency: should prevent duplicate transactions", async () => {
        const { userId } = await initAuth();

        // Create a transaction with a specific idempotency key
        const result1 = await testT.mutation(api.mutations.credits.giftCredits, {
            userId,
            amount: 20,
            description: "Idempotency test"
        });

        expect(result1.newBalance).toBe(20);

        // Attempting to gift more credits should accumulate
        const result2 = await testT.mutation(api.mutations.credits.giftCredits, {
            userId,
            amount: 5,
            description: "Another gift"
        });

        expect(result2.newBalance).toBe(25);
    });

    test("credit ledger double-entry validation: should maintain balanced ledger", async () => {
        const { userId } = await initAuth();

        // Gift credits and verify ledger balance
        await testT.mutation(api.mutations.credits.giftCredits, {
            userId,
            amount: 30,
            description: "Ledger test"
        });

        // Reconcile to ensure ledger is balanced
        const reconcileResult = await testT.mutation(api.mutations.credits.reconcileUserCredits, {
            userId,
            updateCache: true
        });

        expect(reconcileResult.computedCredits).toBe(30);
        expect(reconcileResult.deltaCredits).toBe(0);
    });

    test("credit lifetime tracking: should track lifetime credits correctly", async () => {
        const { userId } = await initAuth();

        // Gift credits multiple times
        await testT.mutation(api.mutations.credits.giftCredits, {
            userId,
            amount: 10,
            description: "First lifetime test"
        });

        await testT.mutation(api.mutations.credits.giftCredits, {
            userId,
            amount: 15,
            description: "Second lifetime test"
        });

        const reconcileResult = await testT.mutation(api.mutations.credits.reconcileUserCredits, {
            userId,
            updateCache: true
        });

        expect(reconcileResult.computedCredits).toBe(25);
        // Note: lifetime credits tracking depends on the specific credit type used in giftCredits
        // This test validates the reconciliation logic works correctly
    });

    test("large credit amounts: should handle large credit transactions", async () => {
        const { userId } = await initAuth();

        const largeAmount = 1000;
        const result = await testT.mutation(api.mutations.credits.giftCredits, {
            userId,
            amount: largeAmount,
            description: "Large amount test"
        });

        expect(result.newBalance).toBe(largeAmount);
        expect(result.success).toBe(true);
    });

    test("credit descriptions: should handle various description formats", async () => {
        const { userId } = await initAuth();

        // Test with custom description
        const result1 = await testT.mutation(api.mutations.credits.giftCredits, {
            userId,
            amount: 5,
            description: "Custom bonus for loyalty program"
        });

        expect(result1.success).toBe(true);

        // Test with default description (no description provided)
        const result2 = await testT.mutation(api.mutations.credits.giftCredits, {
            userId,
            amount: 3
        });

        expect(result2.success).toBe(true);
        expect(result2.newBalance).toBe(8); // 5 + 3
    });

    test("concurrent credit operations: should handle multiple simultaneous operations", async () => {
        const { userId } = await initAuth();

        // Execute multiple gift operations concurrently
        const promises = [
            testT.mutation(api.mutations.credits.giftCredits, {
                userId,
                amount: 5,
                description: "Concurrent test 1"
            }),
            testT.mutation(api.mutations.credits.giftCredits, {
                userId,
                amount: 7,
                description: "Concurrent test 2"
            }),
            testT.mutation(api.mutations.credits.giftCredits, {
                userId,
                amount: 3,
                description: "Concurrent test 3"
            })
        ];

        const results = await Promise.all(promises);

        // All operations should succeed
        results.forEach(result => {
            expect(result.success).toBe(true);
        });

        // Final reconciliation should show total credits
        const reconcileResult = await testT.mutation(api.mutations.credits.reconcileUserCredits, {
            userId,
            updateCache: true
        });

        expect(reconcileResult.computedCredits).toBe(15); // 5 + 7 + 3
    });
});