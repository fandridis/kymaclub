import { describe, it, expect } from "vitest";
import { calculateBestDiscount } from "./classDiscount";
import { createTestTemplate, createTestInstance } from "../convex/testResources";
import type { Doc } from "../convex/_generated/dataModel";

/**
 * CRITICAL SAFETY TESTS FOR DISCOUNT CALCULATION
 * 
 * These tests specifically address the cents-to-credits conversion bug
 * that caused classes to become free instead of properly discounted.
 * 
 * BUG CONTEXT:
 * - Discount values are stored in cents in the database
 * - They must be converted to credits (÷50) before applying to prices
 * - Original bug: €20 class with €3 discount became FREE instead of €17
 * - Root cause: 2000 cents (40 credits) - 300 cents = 1700 cents, but we were doing 40 - 300 = 0
 */
describe("Discount Calculation Safety Tests", () => {
    const now = Date.now();

    describe("Unit Conversion Safety (Cents ↔ Credits)", () => {
        it("should correctly convert discount values from cents to credits", () => {
            // €20 class with €3 discount should result in €17 final price
            const template = createTestTemplate({
                price: 2000, // €20 = 2000 cents = 40 credits
                discountRules: [
                    {
                        id: "discount_001",
                        name: "€3 Fixed Discount",
                        condition: { type: "always" },
                        discount: {
                            type: "fixed_amount",
                            value: 300, // €3 = 300 cents (NOT 3 credits)
                        },
                        createdAt: now,
                        createdBy: "user1" as any,
                    },
                ],
            });

            const instance = createTestInstance({
                price: 2000, // Override instance price to €20
                startTime: now + 3600000, // 1 hour from now
            });

            const result = calculateBestDiscount(instance, template, {
                bookingTime: now,
            });

            // Critical assertions for unit conversion
            expect(result.originalPrice).toBe(40); // 2000 cents ÷ 50 = 40 credits
            // Note: discountValue was redundant and removed; we now only use creditsSaved
            expect(result.appliedDiscount?.creditsSaved).toBe(6); // 300 cents ÷ 50 = 6 credits
            expect(result.appliedDiscount?.creditsSaved).toBe(6); // 6 credits saved
            expect(result.finalPrice).toBe(34); // 40 - 6 = 34 credits (€17)

            // Ensure class is NOT free
            expect(result.finalPrice).toBeGreaterThan(0);
        });

        it("should handle edge case where discount equals original price", () => {
            // €10 class with €10 discount should result in FREE class
            const template = createTestTemplate({
                price: 1000, // €10 = 1000 cents = 20 credits
                discountRules: [
                    {
                        id: "full_discount",
                        name: "€10 Full Discount",
                        condition: { type: "always" },
                        discount: {
                            type: "fixed_amount",
                            value: 1000, // €10 = 1000 cents
                        },
                        createdAt: now,
                        createdBy: "user1" as any,
                    },
                ],
            });

            const instance = createTestInstance({
                price: 1000,
                startTime: now + 3600000,
            });

            const result = calculateBestDiscount(instance, template, {
                bookingTime: now,
            });

            expect(result.originalPrice).toBe(20); // 1000 cents ÷ 50 = 20 credits
            // Note: discountValue was redundant and removed; we now only use creditsSaved
            expect(result.appliedDiscount?.creditsSaved).toBe(20); // 1000 cents ÷ 50 = 20 credits
            expect(result.finalPrice).toBe(0); // 20 - 20 = 0 credits (FREE)
            expect(result.appliedDiscount?.creditsSaved).toBe(20);
        });

        it("should handle edge case where discount exceeds original price", () => {
            // €10 class with €15 discount should result in FREE class (not negative)
            const template = createTestTemplate({
                price: 1000, // €10 = 1000 cents = 20 credits
                discountRules: [
                    {
                        id: "super_discount",
                        name: "€15 Super Discount",
                        condition: { type: "always" },
                        discount: {
                            type: "fixed_amount",
                            value: 1500, // €15 = 1500 cents
                        },
                        createdAt: now,
                        createdBy: "user1" as any,
                    },
                ],
            });

            const instance = createTestInstance({
                price: 1000,
                startTime: now + 3600000,
            });

            const result = calculateBestDiscount(instance, template, {
                bookingTime: now,
            });

            expect(result.originalPrice).toBe(20); // 1000 cents ÷ 50 = 20 credits
            expect(result.finalPrice).toBe(0); // Math.max(0, 20 - 30) = 0
            // Note: creditsSaved reflects actual savings (not theoretical discount amount)
            expect(result.appliedDiscount?.creditsSaved).toBe(20); // Can only save what was originally priced
        });

        it("should correctly handle multiple discount values with proper conversion", () => {
            // Test multiple discounts with different cent values
            const template = createTestTemplate({
                price: 3000, // €30 = 3000 cents = 60 credits
                discountRules: [
                    {
                        id: "small_discount",
                        name: "€2.50 Discount",
                        condition: {
                            type: "hours_before_min",
                            hours: 12,
                        },
                        discount: {
                            type: "fixed_amount",
                            value: 250, // €2.50 = 250 cents = 5 credits
                        },
                        createdAt: now,
                        createdBy: "user1" as any,
                    },
                    {
                        id: "big_discount",
                        name: "€7.50 Discount",
                        condition: {
                            type: "hours_before_min",
                            hours: 48,
                        },
                        discount: {
                            type: "fixed_amount",
                            value: 750, // €7.50 = 750 cents = 15 credits
                        },
                        createdAt: now,
                        createdBy: "user1" as any,
                    },
                ],
            });

            const instance = createTestInstance({
                price: 3000,
                startTime: now + 259200000, // 3 days from now (both rules apply)
            });

            const result = calculateBestDiscount(instance, template, {
                bookingTime: now,
            });

            // Should select the bigger discount (€7.50)
            expect(result.originalPrice).toBe(60); // 3000 cents ÷ 50 = 60 credits
            // Note: discountValue was redundant and removed; we now only use creditsSaved
            expect(result.appliedDiscount?.creditsSaved).toBe(15); // 750 cents ÷ 50 = 15 credits
            expect(result.appliedDiscount?.ruleName).toBe("€7.50 Discount");
            expect(result.finalPrice).toBe(45); // 60 - 15 = 45 credits (€22.50)
            expect(result.appliedDiscount?.creditsSaved).toBe(15);
        });
    });

    describe("Real-World Pricing Scenarios", () => {
        it("should handle common class pricing with typical discounts", () => {
            // Common scenario: €15 yoga class with €2 early bird discount
            const template = createTestTemplate({
                price: 1500, // €15 = 1500 cents = 30 credits
                discountRules: [
                    {
                        id: "early_bird",
                        name: "Early Bird €2 Off",
                        condition: {
                            type: "hours_before_min",
                            hours: 24,
                        },
                        discount: {
                            type: "fixed_amount",
                            value: 200, // €2 = 200 cents = 4 credits
                        },
                        createdAt: now,
                        createdBy: "user1" as any,
                    },
                ],
            });

            const instance = createTestInstance({
                price: 1500,
                startTime: now + 86400000, // 24 hours from now
            });

            const result = calculateBestDiscount(instance, template, {
                bookingTime: now,
            });

            expect(result.originalPrice).toBe(30); // €15 = 30 credits
            // Note: discountValue was redundant and removed; we now only use creditsSaved
            expect(result.appliedDiscount?.creditsSaved).toBe(4); // €2 = 4 credits
            expect(result.finalPrice).toBe(26); // €13 = 26 credits
            expect(result.appliedDiscount?.creditsSaved).toBe(4);
        });

        it("should handle premium class pricing with percentage-like discounts", () => {
            // Premium class: €50 with €5 discount (10% off)
            const template = createTestTemplate({
                price: 5000, // €50 = 5000 cents = 100 credits
                discountRules: [
                    {
                        id: "premium_discount",
                        name: "€5 Premium Discount",
                        condition: { type: "always" },
                        discount: {
                            type: "fixed_amount",
                            value: 500, // €5 = 500 cents = 10 credits
                        },
                        createdAt: now,
                        createdBy: "user1" as any,
                    },
                ],
            });

            const instance = createTestInstance({
                price: 5000,
                startTime: now + 3600000,
            });

            const result = calculateBestDiscount(instance, template, {
                bookingTime: now,
            });

            expect(result.originalPrice).toBe(100); // €50 = 100 credits
            // Note: discountValue was redundant and removed; we now only use creditsSaved
            expect(result.appliedDiscount?.creditsSaved).toBe(10); // €5 = 10 credits
            expect(result.finalPrice).toBe(90); // €45 = 90 credits
            expect(result.appliedDiscount?.creditsSaved).toBe(10);
        });
    });

    describe("Instance vs Template Discount Priority", () => {
        it("should apply instance discounts with correct unit conversion over template discounts", () => {
            // Template has €3 discount, instance overrides with €5 discount
            const template = createTestTemplate({
                price: 2000, // €20 = 40 credits
                discountRules: [
                    {
                        id: "template_discount",
                        name: "Template €3 Discount",
                        condition: { type: "always" },
                        discount: {
                            type: "fixed_amount",
                            value: 300, // €3 = 300 cents = 6 credits
                        },
                        createdAt: now,
                        createdBy: "user1" as any,
                    },
                ],
            });

            const instance = createTestInstance({
                price: 2000,
                discountRules: [
                    {
                        id: "instance_discount",
                        name: "Instance €5 Discount",
                        condition: { type: "always" },
                        discount: {
                            type: "fixed_amount",
                            value: 500, // €5 = 500 cents = 10 credits
                        },
                        createdAt: now,
                        createdBy: "user1" as any,
                    },
                ],
                startTime: now + 3600000,
            });

            const result = calculateBestDiscount(instance, template, {
                bookingTime: now,
            });

            // Should use instance discount (higher priority and higher value)
            expect(result.appliedDiscount?.source).toBe("instance_rule");
            expect(result.originalPrice).toBe(40); // €20 = 40 credits
            // Note: discountValue was redundant and removed; we now only use creditsSaved
            expect(result.appliedDiscount?.creditsSaved).toBe(10); // €5 = 10 credits
            expect(result.finalPrice).toBe(30); // €15 = 30 credits
            expect(result.appliedDiscount?.creditsSaved).toBe(10);
            expect(result.appliedDiscount?.ruleName).toBe("Instance €5 Discount");
        });
    });

    describe("Price Fallback Chain with Discounts", () => {
        it("should handle template price fallback with discount conversion", () => {
            // Instance has no price, falls back to template price with discount
            const template = createTestTemplate({
                price: 1200, // €12 = 1200 cents = 24 credits (template fallback)
                discountRules: [
                    {
                        id: "fallback_discount",
                        name: "Template €1.50 Discount",
                        condition: { type: "always" },
                        discount: {
                            type: "fixed_amount",
                            value: 150, // €1.50 = 150 cents = 3 credits
                        },
                        createdAt: now,
                        createdBy: "user1" as any,
                    },
                ],
            });

            const instance = createTestInstance({
                price: undefined, // Explicitly undefined to use template.price
                startTime: now + 3600000,
            });

            const result = calculateBestDiscount(instance, template, {
                bookingTime: now,
            });

            // Template price should be used when instance price is undefined

            // Should use template price and apply discount
            expect(result.originalPrice).toBe(24); // Template price: 1200 cents = 24 credits
            // Note: discountValue was redundant and removed; we now only use creditsSaved
            expect(result.appliedDiscount?.creditsSaved).toBe(3); // 150 cents = 3 credits
            expect(result.finalPrice).toBe(21); // 24 - 3 = 21 credits (€10.50)
            expect(result.appliedDiscount?.creditsSaved).toBe(3);
        });

        it("should handle default price fallback with discount conversion", () => {
            // Both instance and template have no price, uses default with discount
            const template = createTestTemplate({
                price: undefined, // Explicitly remove template price to force default fallback
                discountRules: [
                    {
                        id: "default_discount",
                        name: "Default €2 Discount",
                        condition: { type: "always" },
                        discount: {
                            type: "fixed_amount",
                            value: 200, // €2 = 200 cents = 4 credits
                        },
                        createdAt: now,
                        createdBy: "user1" as any,
                    },
                ],
            });

            const instance = createTestInstance({
                price: undefined, // Explicitly undefined to use template.price || default
                startTime: now + 3600000,
            });

            const result = calculateBestDiscount(instance, template, {
                bookingTime: now,
            });

            // Should use default price (1000 cents = 20 credits) and apply discount
            expect(result.originalPrice).toBe(20); // Default: 1000 cents = 20 credits
            // Note: discountValue was redundant and removed; we now only use creditsSaved
            expect(result.appliedDiscount?.creditsSaved).toBe(4); // 200 cents = 4 credits
            expect(result.finalPrice).toBe(16); // 20 - 4 = 16 credits (€8)
            expect(result.appliedDiscount?.creditsSaved).toBe(4);
        });
    });
});