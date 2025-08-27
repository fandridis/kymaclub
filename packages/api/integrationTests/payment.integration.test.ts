import { describe, expect, test, beforeEach } from "vitest";
import { api } from "../convex/_generated/api";
import { internal } from "../convex/_generated/api";
import { initAuth, testT } from "./helpers";
import type { Id } from "../convex/_generated/dataModel";
import { calculateSubscriptionPricing, calculateOneTimePricing, CREDIT_PACKS } from "../operations/payments";

describe('Payment System Integration Tests', () => {
  describe('Dynamic Subscription Creation', () => {
    test('should validate credit amounts correctly', async () => {
      const { userId } = await initAuth();
      const asUser = testT.withIdentity({ subject: userId });

      // Invalid amounts should throw errors
      await expect(
        asUser.action(api.actions.payments.createDynamicSubscriptionCheckout, {
          creditAmount: 4 // Below minimum
        })
      ).rejects.toThrow("Invalid credit amount");

      await expect(
        asUser.action(api.actions.payments.createDynamicSubscriptionCheckout, {
          creditAmount: 151 // Above maximum
        })
      ).rejects.toThrow("Invalid credit amount");

      await expect(
        asUser.action(api.actions.payments.createDynamicSubscriptionCheckout, {
          creditAmount: 7 // Not multiple of 5
        })
      ).rejects.toThrow("Invalid credit amount");
    });

  });

  describe('Predefined Subscription Plans', () => {
    test('should reject invalid plan IDs', async () => {
      const { userId } = await initAuth();
      const asUser = testT.withIdentity({ subject: userId });

      await expect(
        asUser.action(api.actions.payments.createSubscriptionCheckout, {
          planId: "invalid_plan" as any
        })
      ).rejects.toThrow();
    });
  });

  describe('One-Time Credit Purchases', () => {
    test('should validate one-time credit amounts', async () => {
      const { userId } = await initAuth();
      const asUser = testT.withIdentity({ subject: userId });

      // Invalid amounts
      await expect(
        asUser.action(api.actions.payments.createOneTimeCreditCheckout, {
          creditAmount: 9
        })
      ).rejects.toThrow("Invalid credit amount");

      await expect(
        asUser.action(api.actions.payments.createOneTimeCreditCheckout, {
          creditAmount: 501
        })
      ).rejects.toThrow("Invalid credit amount");
    });
  });

  describe('Subscription Management', () => {
    test('should retrieve current subscription (null for new user)', async () => {
      const { userId } = await initAuth();
      const asUser = testT.withIdentity({ subject: userId });

      const subscription = await asUser.action(api.actions.payments.getCurrentSubscription, {});

      // New users should have no subscription
      expect(subscription).toBeNull();
    });

    test('should handle subscription operations on non-existent subscription', async () => {
      const { userId } = await initAuth();
      const asUser = testT.withIdentity({ subject: userId });

      // Trying to cancel non-existent subscription should fail
      await expect(
        asUser.action(api.actions.payments.cancelSubscription, {})
      ).rejects.toThrow("No active subscription found");

      // Trying to update non-existent subscription should fail
      await expect(
        asUser.action(api.actions.payments.updateSubscription, {
          newCreditAmount: 30
        })
      ).rejects.toThrow("No active subscription found");
    });
  });

  describe('Webhook Processing', () => {
    test('should process webhook with proper signature validation', async () => {
      const { userId } = await initAuth();
      const asUser = testT.withIdentity({ subject: userId });

      // Test webhook processing validation (will fail without proper Stripe setup)
      await expect(
        asUser.action(internal.actions.payments.processWebhook, {
          signature: "invalid_signature",
          payload: JSON.stringify({ type: "test.event" })
        })
      ).rejects.toThrow();
    });
  });

  describe('Payment Error Handling', () => {
    test('should handle subscription operations on non-existent subscription', async () => {
      const { userId } = await initAuth();
      const asUser = testT.withIdentity({ subject: userId });

      await expect(
        asUser.action(api.actions.payments.cancelSubscription, {})
      ).rejects.toThrow("No active subscription found");

      await expect(
        asUser.action(api.actions.payments.updateSubscription, {
          newCreditAmount: 30
        })
      ).rejects.toThrow("No active subscription found");
    });
  });

  describe('Pricing Consistency Validation', () => {
    test('should maintain pricing consistency across operations and webhooks', async () => {
      // Verify pricing calculations match across all tiers
      const testAmounts = [5, 25, 95, 100, 150, 195, 200, 250, 295, 300, 400, 445, 450, 500];

      for (const amount of testAmounts) {
        const pricing = calculateSubscriptionPricing(amount);

        // Verify pricing makes sense
        expect(pricing.credits).toBe(amount);
        expect(pricing.priceInCents).toBeGreaterThan(0);
        expect(pricing.pricePerCredit).toBeGreaterThan(0);
        expect(pricing.discount).toBeGreaterThanOrEqual(0);

        // Verify tier boundaries are correct (based on 50 cents per credit base price)
        if (amount < 100) {
          expect(pricing.discount).toBe(0);
          expect(pricing.pricePerCredit).toBe(0.50);
        } else if (amount < 200) {
          expect(pricing.discount).toBe(3);
          expect(pricing.pricePerCredit).toBe(0.485);
        } else if (amount < 300) {
          expect(pricing.discount).toBe(5.0);
          expect(pricing.pricePerCredit).toBe(0.475);
        } else if (amount < 450) {
          expect(pricing.discount).toBe(7.0);
          expect(pricing.pricePerCredit).toBe(0.465);
        } else {
          expect(pricing.discount).toBe(10.0);
          expect(pricing.pricePerCredit).toBe(0.45);
        }
      }
    });

    test('should ensure one-time pricing matches predefined packs', async () => {
      for (const pack of CREDIT_PACKS) {
        const pricing = calculateOneTimePricing(pack.credits);

        expect(pricing.credits).toBe(pack.credits);
        expect(pricing.priceInCents).toBe(Math.round(pack.price * 100));

        if (pack.discount) {
          expect(pricing.discount).toBe(pack.discount);
        }
      }
    });
  });
});