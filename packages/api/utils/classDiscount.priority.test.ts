import { describe, it, expect } from "vitest";
import { calculateBestDiscount, getApplicableDiscounts } from "./classDiscount";
import { createTestTemplate, createTestInstance } from "../convex/testResources";

/**
 * COMPREHENSIVE DISCOUNT PRIORITY EDGE CASE TESTS
 * 
 * These tests ensure that the discount priority system (instance > template) 
 * works correctly in all edge cases and maintains data integrity.
 * 
 * Priority Order:
 * 1. Instance discount rules (highest priority)
 * 2. Template discount rules (fallback)
 * 3. No discount (when no rules apply)
 */
describe("Discount Priority Edge Cases", () => {
    const now = Date.now();

    describe("Multiple Competing Discounts", () => {
        it("should select highest instance discount when multiple instance rules apply", () => {
            const template = createTestTemplate({
                price: 3000, // €30 = 60 credits
                discountRules: [
                    {
                        id: "template_small",
                        name: "Template Small €2 Off",
                        condition: { type: "always" },
                        discount: {
                            type: "fixed_amount",
                            value: 200 // €2 = 200 cents = 2 credits
                        },
                        createdAt: now,
                        createdBy: "user1" as any
                    }
                ]
            });

            const instance = createTestInstance({
                price: 3000,
                discountRules: [
                    {
                        id: "instance_medium",
                        name: "Instance Medium €5 Off",
                        condition: { type: "always" },
                        discount: {
                            type: "fixed_amount",
                            value: 500 // €5 = 500 cents = 5 credits
                        },
                        createdAt: now,
                        createdBy: "user1" as any
                    },
                    {
                        id: "instance_large",
                        name: "Instance Large €8 Off",
                        condition: { type: "always" },
                        discount: {
                            type: "fixed_amount",
                            value: 800 // €8 = 800 cents = 8 credits
                        },
                        createdAt: now,
                        createdBy: "user1" as any
                    }
                ],
                startTime: now + 3600000
            });

            const result = calculateBestDiscount(instance, template, {
                bookingTime: now
            });

            // Should select the largest instance discount, not template
            expect(result.appliedDiscount?.source).toBe("instance_rule");
            expect(result.appliedDiscount?.ruleName).toBe("Instance Large €8 Off");
            expect(result.appliedDiscount?.creditsSaved).toBe(8);
            expect(result.finalPrice).toBe(2200); // 3000 - 800 cents
        });

        it("should select highest template discount when no instance rules apply", () => {
            const template = createTestTemplate({
                price: 2500, // €25 = 25 credits
                discountRules: [
                    {
                        id: "template_early",
                        name: "Template Early €3 Off",
                        condition: {
                            type: "hours_before_min",
                            hours: 48
                        },
                        discount: {
                            type: "fixed_amount",
                            value: 300 // €3 = 300 cents = 3 credits
                        },
                        createdAt: now,
                        createdBy: "user1" as any
                    },
                    {
                        id: "template_super_early",
                        name: "Template Super Early €7 Off",
                        condition: {
                            type: "hours_before_min",
                            hours: 72
                        },
                        discount: {
                            type: "fixed_amount",
                            value: 700 // €7 = 700 cents = 7 credits
                        },
                        createdAt: now,
                        createdBy: "user1" as any
                    }
                ]
            });

            const instance = createTestInstance({
                price: 2500,
                startTime: now + 259200000 // 3 days from now (both template rules apply)
            });

            const result = calculateBestDiscount(instance, template, {
                bookingTime: now
            });

            // Should select the larger template discount
            expect(result.appliedDiscount?.source).toBe("template_rule");
            expect(result.appliedDiscount?.ruleName).toBe("Template Super Early €7 Off");
            expect(result.appliedDiscount?.creditsSaved).toBe(7);
            expect(result.finalPrice).toBe(1800); // 2500 - 700 cents
        });

        it("should prioritize smallest instance discount over largest template discount", () => {
            const template = createTestTemplate({
                price: 4000, // €40 = 40 credits
                discountRules: [
                    {
                        id: "template_huge",
                        name: "Template Huge €15 Off",
                        condition: { type: "always" },
                        discount: {
                            type: "fixed_amount",
                            value: 1500 // €15 = 1500 cents = 15 credits
                        },
                        createdAt: now,
                        createdBy: "user1" as any
                    }
                ]
            });

            const instance = createTestInstance({
                price: 4000,
                discountRules: [
                    {
                        id: "instance_tiny",
                        name: "Instance Tiny €1 Off",
                        condition: { type: "always" },
                        discount: {
                            type: "fixed_amount",
                            value: 100 // €1 = 100 cents = 1 credit (much smaller than template)
                        },
                        createdAt: now,
                        createdBy: "user1" as any
                    }
                ],
                startTime: now + 3600000
            });

            const result = calculateBestDiscount(instance, template, {
                bookingTime: now
            });

            // Instance priority should override template even if template is larger
            expect(result.appliedDiscount?.source).toBe("instance_rule");
            expect(result.appliedDiscount?.ruleName).toBe("Instance Tiny €1 Off");
            expect(result.appliedDiscount?.creditsSaved).toBe(1);
            expect(result.finalPrice).toBe(3900); // 4000 - 100 cents (NOT 2500 from template)
        });
    });

    describe("Conditional Logic Edge Cases", () => {
        it("should fall back to template when instance rule conditions not met", () => {
            const template = createTestTemplate({
                price: 2000, // €20 = 40 credits
                discountRules: [
                    {
                        id: "template_always",
                        name: "Template Always €3 Off",
                        condition: { type: "always" },
                        discount: {
                            type: "fixed_amount",
                            value: 300 // €3 = 300 cents = 3 credits
                        },
                        createdAt: now,
                        createdBy: "user1" as any
                    }
                ]
            });

            const instance = createTestInstance({
                price: 2000,
                discountRules: [
                    {
                        id: "instance_strict",
                        name: "Instance Strict €10 Off",
                        condition: {
                            type: "hours_before_min",
                            hours: 168 // Requires 7 days (168 hours)
                        },
                        discount: {
                            type: "fixed_amount",
                            value: 1000 // €10 = 1000 cents = 10 credits
                        },
                        createdAt: now,
                        createdBy: "user1" as any
                    }
                ],
                startTime: now + 86400000 // Only 1 day from now (24 hours)
            });

            const result = calculateBestDiscount(instance, template, {
                bookingTime: now
            });

            // Instance condition not met, should fall back to template
            expect(result.appliedDiscount?.source).toBe("template_rule");
            expect(result.appliedDiscount?.ruleName).toBe("Template Always €3 Off");
            expect(result.appliedDiscount?.creditsSaved).toBe(3);
            expect(result.finalPrice).toBe(1700); // 2000 - 300 cents
        });

        it("should handle mixed condition types correctly", () => {
            const template = createTestTemplate({
                price: 3500, // €35 = 70 credits
                discountRules: [
                    {
                        id: "template_early",
                        name: "Template Early €4 Off",
                        condition: {
                            type: "hours_before_min",
                            hours: 12
                        },
                        discount: {
                            type: "fixed_amount",
                            value: 400 // €4 = 400 cents = 4 credits
                        },
                        createdAt: now,
                        createdBy: "user1" as any
                    }
                ]
            });

            const instance = createTestInstance({
                price: 3500,
                discountRules: [
                    {
                        id: "instance_last_minute",
                        name: "Instance Last Minute €6 Off",
                        condition: {
                            type: "hours_before_max",
                            hours: 2 // Must be within 2 hours of class
                        },
                        discount: {
                            type: "fixed_amount",
                            value: 600 // €6 = 600 cents = 6 credits
                        },
                        createdAt: now,
                        createdBy: "user1" as any
                    }
                ],
                startTime: now + 3600000 // 1 hour from now
            });

            const result = calculateBestDiscount(instance, template, {
                bookingTime: now
            });

            // Instance last-minute rule should apply (1 hour < 2 hours max)
            expect(result.appliedDiscount?.source).toBe("instance_rule");
            expect(result.appliedDiscount?.ruleName).toBe("Instance Last Minute €6 Off");
            expect(result.appliedDiscount?.creditsSaved).toBe(6);
            expect(result.finalPrice).toBe(2900); // 3500 - 600 cents
        });

        it("should handle no applicable discounts gracefully", () => {
            const template = createTestTemplate({
                price: 1500, // €15 = 30 credits
                discountRules: [
                    {
                        id: "template_impossible",
                        name: "Template Impossible €5 Off",
                        condition: {
                            type: "hours_before_min",
                            hours: 168 // 7 days
                        },
                        discount: {
                            type: "fixed_amount",
                            value: 500 // €5 = 500 cents = 5 credits
                        },
                        createdAt: now,
                        createdBy: "user1" as any
                    }
                ]
            });

            const instance = createTestInstance({
                price: 1500,
                discountRules: [
                    {
                        id: "instance_impossible",
                        name: "Instance Impossible €8 Off",
                        condition: {
                            type: "hours_before_min",
                            hours: 336 // 14 days
                        },
                        discount: {
                            type: "fixed_amount",
                            value: 800 // €8 = 800 cents = 8 credits
                        },
                        createdAt: now,
                        createdBy: "user1" as any
                    }
                ],
                startTime: now + 7200000 // 2 hours from now (neither rule applies)
            });

            const result = calculateBestDiscount(instance, template, {
                bookingTime: now
            });

            // No discounts should apply
            expect(result.appliedDiscount).toBeNull();
            expect(result.originalPrice).toBe(1500);
            expect(result.finalPrice).toBe(1500); // No discount
        });
    });

    describe("Data Integrity During Priority Selection", () => {
        it("should maintain proper price chain during discount priority evaluation", () => {
            // Test price fallback: instance.price -> template.price -> default
            const template = createTestTemplate({
                price: 1800, // Template has price
                discountRules: [
                    {
                        id: "template_discount",
                        name: "Template €2 Off",
                        condition: { type: "always" },
                        discount: {
                            type: "fixed_amount",
                            value: 200 // €2 = 200 cents = 2 credits
                        },
                        createdAt: now,
                        createdBy: "user1" as any
                    }
                ]
            });

            const instance = createTestInstance({
                price: undefined, // Instance has no price, should use template.price
                discountRules: [
                    {
                        id: "instance_discount",
                        name: "Instance €3 Off",
                        condition: { type: "always" },
                        discount: {
                            type: "fixed_amount",
                            value: 300 // €3 = 300 cents = 3 credits
                        },
                        createdAt: now,
                        createdBy: "user1" as any
                    }
                ],
                startTime: now + 3600000
            });

            const result = calculateBestDiscount(instance, template, {
                bookingTime: now
            });

            // Should use template.price (1800 cents = 36 credits) with instance discount
            expect(result.originalPrice).toBe(1800); // From template.price
            expect(result.appliedDiscount?.source).toBe("instance_rule");
            expect(result.appliedDiscount?.creditsSaved).toBe(3);
            expect(result.finalPrice).toBe(1500); // 1800 - 300 cents
        });

        it("should handle zero/free pricing scenarios with priority", () => {
            const template = createTestTemplate({
                price: 500, // €5 = 10 credits
                discountRules: [
                    {
                        id: "template_partial",
                        name: "Template €2 Off",
                        condition: { type: "always" },
                        discount: {
                            type: "fixed_amount",
                            value: 200 // €2 = 200 cents = 2 credits
                        },
                        createdAt: now,
                        createdBy: "user1" as any
                    }
                ]
            });

            const instance = createTestInstance({
                price: 500,
                discountRules: [
                    {
                        id: "instance_free",
                        name: "Instance Free Class",
                        condition: { type: "always" },
                        discount: {
                            type: "fixed_amount",
                            value: 500 // €5 = 500 cents = 5 credits (equals full price)
                        },
                        createdAt: now,
                        createdBy: "user1" as any
                    }
                ],
                startTime: now + 3600000
            });

            const result = calculateBestDiscount(instance, template, {
                bookingTime: now
            });

            // Instance makes it free, not template partial discount
            expect(result.appliedDiscount?.source).toBe("instance_rule");
            expect(result.originalPrice).toBe(500);
            expect(result.finalPrice).toBe(0); // FREE
            expect(result.appliedDiscount?.creditsSaved).toBe(5); // Full discount
        });
    });

    describe("getApplicableDiscounts Priority Display", () => {
        it("should list both instance and template discounts with correct priority indication", () => {
            const template = createTestTemplate({
                price: 2000, // €20 = 40 credits
                discountRules: [
                    {
                        id: "template_rule_1",
                        name: "Template €3 Off",
                        condition: { type: "always" },
                        discount: {
                            type: "fixed_amount",
                            value: 300 // €3 = 300 cents = 3 credits
                        },
                        createdAt: now,
                        createdBy: "user1" as any
                    }
                ]
            });

            const instance = createTestInstance({
                price: 2000,
                discountRules: [
                    {
                        id: "instance_rule_1",
                        name: "Instance €5 Off",
                        condition: { type: "always" },
                        discount: {
                            type: "fixed_amount",
                            value: 500 // €5 = 500 cents = 5 credits
                        },
                        createdAt: now,
                        createdBy: "user1" as any
                    }
                ],
                startTime: now + 3600000
            });

            const discounts = getApplicableDiscounts(instance, template, {
                bookingTime: now
            });

            // Should include both types
            const instanceDiscounts = discounts.filter(d => d.type === "instance_rule");
            const templateDiscounts = discounts.filter(d => d.type === "template_rule");

            expect(instanceDiscounts).toHaveLength(1);
            expect(templateDiscounts).toHaveLength(1);

            // Instance discount should be marked as applicable
            expect(instanceDiscounts[0].applies).toBe(true);
            expect(instanceDiscounts[0].ruleName).toBe("Instance €5 Off");

            // Template discount should also be marked as applicable but lower priority
            expect(templateDiscounts[0].applies).toBe(true);
            expect(templateDiscounts[0].ruleName).toBe("Template €3 Off");

            // Instance has higher priority in actual calculation
            const bestDiscount = calculateBestDiscount(instance, template, { bookingTime: now });
            expect(bestDiscount.appliedDiscount?.source).toBe("instance_rule");
        });
    });
});