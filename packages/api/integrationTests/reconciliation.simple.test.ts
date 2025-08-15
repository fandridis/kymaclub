import { describe, expect, test } from "vitest";
import { internal } from "../convex/_generated/api";
import { initAuth, testT } from "./helpers";
import { CREDIT_LEDGER_TYPES } from "../utils/creditMappings";

/**
 * Simple reconciliation tests using internal.testFunctions
 * These tests verify the reconciliation service works end-to-end through the proper API pattern
 */
describe('Reconciliation Service - Simple Tests', () => {
    test('should reconcile user with mismatched cached balance', async () => {
        const { userId } = await initAuth();
        const asUser = testT.withIdentity({ subject: userId });

        // Step 1: Create ledger entry (100 credits)
        await asUser.mutation(internal.testFunctions.createCreditLedgerEntry, {
            userId,
            amount: 100,
            type: CREDIT_LEDGER_TYPES.CREDIT_PURCHASE,
            effectiveAt: Date.now() - 1000,
            creditValue: 2.0,
            description: "Test credits"
        });

        // Step 2: Set incorrect cached balance (50 credits)
        await asUser.mutation(internal.testFunctions.updateUserCredits, {
            userId,
            credits: 50,
            lifetimeCredits: 60,
            creditsLastUpdated: Date.now() - 60000
        });

        // Step 3: Reconcile using testFunctions
        const result = await asUser.mutation(internal.testFunctions.testReconcileUser, {
            userId
        });

        // Step 4: Verify reconciliation worked
        expect(result.userId).toBe(userId);
        expect(result.availableCredits).toBe(100); // From ledger
        expect(result.lifetimeCredits).toBe(100);   // From ledger
        expect(result.wasUpdated).toBe(true);       // Cache was updated
        expect(result.deltaAvailableCredits).toBe(50); // 100 - 50 = 50 delta
        expect(result.deltaLifetimeCredits).toBe(40);  // 100 - 60 = 40 delta
        expect(result.inconsistencyCount).toBe(0);     // No inconsistencies in basic test

        console.log('✅ Basic reconciliation test passed!');
    });

    test('should get user balance with reconciliation', async () => {
        const { userId } = await initAuth();
        const asUser = testT.withIdentity({ subject: userId });

        // Step 1: Create ledger entry
        await asUser.mutation(internal.testFunctions.createCreditLedgerEntry, {
            userId,
            amount: 75,
            type: CREDIT_LEDGER_TYPES.CREDIT_PURCHASE,
            effectiveAt: Date.now() - 2000,
            creditValue: 2.0,
            description: "Balance test credits"
        });

        // Step 2: Get balance with reconciliation (this should trigger reconciliation)
        const balance = await asUser.mutation(internal.testFunctions.testGetUserBalance, {
            userId,
            reconcile: true
        });

        // Step 3: Verify balance is correct
        expect(balance.availableCredits).toBe(75);
        expect(balance.heldCredits).toBe(0);
        expect(balance.lifetimeCredits).toBe(75);
        expect(balance.lastUpdated).toBeGreaterThan(Date.now() - 5000);

        console.log('✅ Get user balance test passed!');
    });

    test('should handle credit scenario reconciliation', async () => {
        const { userId } = await initAuth();
        const asUser = testT.withIdentity({ subject: userId });

        // Use the built-in test scenario function
        const result = await asUser.mutation(internal.testFunctions.testReconcileCreditScenario, {
            userId
        });

        // Verify the scenario worked
        expect(result.success).toBe(true);
        expect(result.initialBalance).toBe(50);    // Set by the scenario
        expect(result.finalBalance).toBe(100);     // Reconciled from ledger
        expect(result.wasReconciled).toBe(true);   // Cache was updated
        expect(result.message).toContain('Reconciled 50 -> 100 credits');

        console.log('✅ Credit scenario test passed!');
    });

    test('should reconcile user with no cached balance', async () => {
        const { userId } = await initAuth();
        const asUser = testT.withIdentity({ subject: userId });

        // Step 1: Create ledger entry without setting cached balance
        await asUser.mutation(internal.testFunctions.createCreditLedgerEntry, {
            userId,
            amount: 25,
            type: CREDIT_LEDGER_TYPES.CREDIT_BONUS,
            effectiveAt: Date.now() - 500,
            creditValue: 2.0,
            description: "Bonus credits"
        });

        // Step 2: Reconcile (user starts with 0 cached credits by default)
        const result = await asUser.mutation(internal.testFunctions.testReconcileUser, {
            userId,
            options: { includeAnalysis: true }
        });

        // Step 3: Verify reconciliation
        expect(result.availableCredits).toBe(25);
        expect(result.lifetimeCredits).toBe(25);
        expect(result.wasUpdated).toBe(true);
        expect(result.deltaAvailableCredits).toBe(25); // 25 - 0 = 25

        console.log('✅ No cached balance test passed!');
    });
});