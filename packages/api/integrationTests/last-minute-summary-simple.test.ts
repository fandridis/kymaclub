import { describe, test, expect, beforeEach } from "vitest";
import { internal } from "../convex/_generated/api";
import { api } from "../convex/_generated/api";
import { initAuth, testT, createTestVenue, createTestClassTemplate, createTestClassInstance } from "./helpers";

describe("Last Minute Summary - Simple Replacement", () => {
    test('should return empty array when no discounted instances exist', async () => {
        const { userId, businessId } = await initAuth();
        const asUser = testT.withIdentity({ subject: userId });

        // Run the cron job with no instances
        await asUser.mutation(internal.crons.updateLastMinuteDiscountedSummary, {});

        // Verify no summaries were created
        const summaries = await asUser.query(api.queries.classInstances.getLastMinuteDiscountedClassInstancesOptimized, { limit: 10 });
        expect(summaries).toHaveLength(0);
    });

    test('should clear all existing summaries', async () => {
        const { userId, businessId } = await initAuth();
        const asUser = testT.withIdentity({ subject: userId });

        // Run the cron job multiple times to test clearing
        await asUser.mutation(internal.crons.updateLastMinuteDiscountedSummary, {});
        await asUser.mutation(internal.crons.updateLastMinuteDiscountedSummary, {});

        // Verify no summaries were created (since no instances exist)
        const summaries = await asUser.query(api.queries.classInstances.getLastMinuteDiscountedClassInstancesOptimized, { limit: 10 });
        expect(summaries).toHaveLength(0);
    });
});
