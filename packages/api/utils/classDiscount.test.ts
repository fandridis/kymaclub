import { describe, it, expect } from "vitest";
import { calculateBestDiscount, getApplicableDiscounts } from "./classDiscount";
import { createTestTemplate, createTestInstance } from "../convex/testResources";

describe("Flexible Discount System", () => {
    const now = Date.now();
    const template = createTestTemplate({
        discountRules: [
            {
                id: "early_bird_001",
                name: "2-Day Early Bird",
                condition: {
                    type: "hours_before_min",
                    hours: 48, // 48 hours = 2 days
                },
                discount: {
                    type: "fixed_amount",
                    value: 2, // 2 credits off
                },
                createdAt: Date.now(),
                createdBy: "user1" as any,
            },
            {
                id: "early_bird_002",
                name: "12h Early Bird",
                condition: {
                    type: "hours_before_min",
                    hours: 12, // 12 hours
                },
                discount: {
                    type: "fixed_amount",
                    value: 1, // 1 credit off
                },
                createdAt: Date.now(),
                createdBy: "user1" as any,
            },
            {
                id: "last_minute_001",
                name: "Last Minute Rush",
                condition: {
                    type: "hours_before_max",
                    hours: 2, // 2 hours
                },
                discount: {
                    type: "fixed_amount",
                    value: 3, // 3 credits off
                },
                createdAt: Date.now(),
                createdBy: "user1" as any,
            },
        ],
    });

    describe("calculateBestDiscount", () => {
        it("should apply 2-day early bird discount when booked 3 days before", () => {
            const instance = createTestInstance({
                startTime: now + 259200000, // 3 days from now
            });

            const result = calculateBestDiscount(instance, template, {
                bookingTime: now,
            });

            expect(result.appliedDiscount).toBeTruthy();
            expect(result.appliedDiscount?.source).toBe("template_rule");
            expect(result.appliedDiscount?.discountType).toBe("fixed_amount");
            expect(result.appliedDiscount?.discountValue).toBe(2);
            expect(result.appliedDiscount?.ruleName).toBe("2-Day Early Bird");
            expect(result.originalPrice).toBe(10);
            expect(result.finalPrice).toBe(8); // 10 - 2
            expect(result.appliedDiscount?.creditsSaved).toBe(2);
        });

        it("should apply 12h early bird discount when booked 18 hours before", () => {
            const instance = createTestInstance({
                startTime: now + 64800000, // 18 hours from now
            });

            const result = calculateBestDiscount(instance, template, {
                bookingTime: now,
            });

            expect(result.appliedDiscount).toBeTruthy();
            expect(result.appliedDiscount?.source).toBe("template_rule");
            expect(result.appliedDiscount?.discountType).toBe("fixed_amount");
            expect(result.appliedDiscount?.discountValue).toBe(1);
            expect(result.appliedDiscount?.ruleName).toBe("12h Early Bird");
            expect(result.originalPrice).toBe(10);
            expect(result.finalPrice).toBe(9); // 10 - 1
            expect(result.appliedDiscount?.creditsSaved).toBe(1);
        });

        it("should apply last minute discount when booked 1 hour before", () => {
            const instance = createTestInstance({
                startTime: now + 3600000, // 1 hour from now
            });

            const result = calculateBestDiscount(instance, template, {
                bookingTime: now,
            });

            expect(result.appliedDiscount).toBeTruthy();
            expect(result.appliedDiscount?.source).toBe("template_rule");
            expect(result.appliedDiscount?.discountType).toBe("fixed_amount");
            expect(result.appliedDiscount?.discountValue).toBe(3);
            expect(result.appliedDiscount?.ruleName).toBe("Last Minute Rush");
            expect(result.originalPrice).toBe(10);
            expect(result.finalPrice).toBe(7); // 10 - 3
            expect(result.appliedDiscount?.creditsSaved).toBe(3);
        });

        it("should return no discount when booked 6 hours before (no rules apply)", () => {
            const instance = createTestInstance({
                startTime: now + 21600000, // 6 hours from now
            });

            const result = calculateBestDiscount(instance, template, {
                bookingTime: now,
            });

            expect(result.appliedDiscount).toBeNull();
            expect(result.originalPrice).toBe(10);
            expect(result.finalPrice).toBe(10);
        });

        it("should apply the highest discount when multiple rules apply", () => {
            const instance = createTestInstance({
                startTime: now + 259200000, // 3 days from now (72 hours - both 48h and 12h early bird apply)
            });

            const result = calculateBestDiscount(instance, template, {
                bookingTime: now,
            });

            expect(result.appliedDiscount).toBeTruthy();
            expect(result.appliedDiscount?.source).toBe("template_rule");
            expect(result.appliedDiscount?.discountType).toBe("fixed_amount");
            expect(result.appliedDiscount?.discountValue).toBe(2); // 48h discount (2 credits) is higher than 12h discount (1 credit)
            expect(result.appliedDiscount?.ruleName).toBe("2-Day Early Bird");
            expect(result.originalPrice).toBe(10);
            expect(result.finalPrice).toBe(8); // 10 - 2
            expect(result.appliedDiscount?.creditsSaved).toBe(2);
        });

        it("should apply discount rules when time conditions are met", () => {
            const templateWithRule = createTestTemplate({
                discountRules: [
                    {
                        id: "early_bird_001",
                        name: "24h Early Bird",
                        condition: {
                            type: "hours_before_min",
                            hours: 24,
                        },
                        discount: {
                            type: "fixed_amount",
                            value: 2,
                        },
                        createdAt: Date.now(),
                        createdBy: "user1" as any,
                    },
                ],
            });

            const instance = createTestInstance({
                startTime: now + 86400000, // 24 hours from now
            });

            const result = calculateBestDiscount(instance, templateWithRule, {
                bookingTime: now,
            });

            // Since the schema doesn't have an isActive field, the discount rule should still apply
            expect(result.appliedDiscount).toBeTruthy();
            expect(result.appliedDiscount?.source).toBe("template_rule");
            expect(result.appliedDiscount?.discountType).toBe("fixed_amount");
            expect(result.appliedDiscount?.discountValue).toBe(2);
            expect(result.appliedDiscount?.ruleName).toBe("24h Early Bird");
            expect(result.originalPrice).toBe(10);
            expect(result.finalPrice).toBe(8); // 10 - 2
            expect(result.appliedDiscount?.creditsSaved).toBe(2);
        });

        it("should prioritize instance rules over template rules", () => {
            const instance = createTestInstance({
                discountRules: [
                    {
                        id: "instance_special_001",
                        name: "Instance Special",
                        condition: {
                            type: "hours_before_min",
                            hours: 24,
                        },
                        discount: {
                            type: "fixed_amount",
                            value: 4, // Higher than template rule
                        },
                        createdAt: Date.now(),
                        createdBy: "user1" as any,
                    },
                ],
                startTime: now + 86400000, // 24 hours from now
            });

            const result = calculateBestDiscount(instance, template, {
                bookingTime: now,
            });

            expect(result.appliedDiscount).toBeTruthy();
            expect(result.appliedDiscount?.source).toBe("instance_rule");
            expect(result.appliedDiscount?.discountType).toBe("fixed_amount");
            expect(result.appliedDiscount?.discountValue).toBe(4);
            expect(result.appliedDiscount?.ruleName).toBe("Instance Special");
            expect(result.originalPrice).toBe(10);
            expect(result.finalPrice).toBe(6); // 10 - 4
            expect(result.appliedDiscount?.creditsSaved).toBe(4);
        });

        it("should handle always-applying discount rules", () => {
            const templateWithAlwaysRule = createTestTemplate({
                discountRules: [
                    {
                        id: "always_discount_001",
                        name: "Member Discount",
                        condition: {
                            type: "always",
                        },
                        discount: {
                            type: "fixed_amount",
                            value: 1,
                        },
                        createdAt: Date.now(),
                        createdBy: "user1" as any,
                    },
                ],
            });

            const instance = createTestInstance({
                startTime: now + 3600000, // 1 hour from now
            });

            const result = calculateBestDiscount(instance, templateWithAlwaysRule, {
                bookingTime: now,
            });

            expect(result.appliedDiscount).toBeTruthy();
            expect(result.appliedDiscount?.source).toBe("template_rule");
            expect(result.appliedDiscount?.discountType).toBe("fixed_amount");
            expect(result.appliedDiscount?.discountValue).toBe(1);
            expect(result.appliedDiscount?.ruleName).toBe("Member Discount");
            expect(result.originalPrice).toBe(10);
            expect(result.finalPrice).toBe(9); // 10 - 1
            expect(result.appliedDiscount?.creditsSaved).toBe(1);
        });
    });

    describe("getApplicableDiscounts", () => {
        it("should return all applicable discounts for display", () => {
            const instance = createTestInstance({
                startTime: now + 21600000, // 6 hours from now
            });

            const discounts = getApplicableDiscounts(instance, template, {
                bookingTime: now,
            });

            expect(discounts).toHaveLength(3); // 3 template rules

            // Template rule discounts
            const templateDiscounts = discounts.filter(d => d.type === "template_rule");
            expect(templateDiscounts).toHaveLength(3);

            // 48h early bird should not apply (6 hours < 48 hours)
            const discount48h = templateDiscounts.find(d => d.ruleName === "2-Day Early Bird");
            expect(discount48h?.applies).toBe(false);

            // 12h early bird should not apply (6 hours < 12 hours)
            const discount12h = templateDiscounts.find(d => d.ruleName === "12h Early Bird");
            expect(discount12h?.applies).toBe(false);

            // Last minute should not apply (6 hours > 2 hours)
            const lastMinute = templateDiscounts.find(d => d.ruleName === "Last Minute Rush");
            expect(lastMinute?.applies).toBe(false);
        });

        it("should handle instances without discount rules", () => {
            const instance = createTestInstance({
                startTime: now + 21600000, // 6 hours from now
            });

            const discounts = getApplicableDiscounts(instance, template, {
                bookingTime: now,
            });

            expect(discounts).toHaveLength(3); // Only template rule discounts
            expect(discounts.every(d => d.type === "template_rule")).toBe(true);
        });

        it("should include rule details for template discounts", () => {
            const instance = createTestInstance({
                startTime: now + 86400000, // 24 hours from now
            });

            const discounts = getApplicableDiscounts(instance, template, {
                bookingTime: now,
            });

            const earlyBirdRule = discounts.find(d => d.ruleName === "2-Day Early Bird");
            expect(earlyBirdRule?.ruleDetails).toBeTruthy();
            expect(earlyBirdRule?.ruleDetails?.conditionType).toBe("hours_before_min");
            expect(earlyBirdRule?.ruleDetails?.hours).toBe(48);
        });

        it("should handle instances with custom discount rules", () => {
            const instance = createTestInstance({
                discountRules: [
                    {
                        id: "super_early_bird_001",
                        name: "Super Early Bird",
                        condition: {
                            type: "hours_before_min",
                            hours: 72, // 3 days
                        },
                        discount: {
                            type: "fixed_amount",
                            value: 5,
                        },
                        createdAt: Date.now(),
                        createdBy: "user1" as any,
                    },
                ],
                startTime: now + 259200000, // 3 days from now
            });

            const discounts = getApplicableDiscounts(instance, template, {
                bookingTime: now,
            });

            // Should include both instance rules and template rules
            const instanceRules = discounts.filter(d => d.type === "instance_rule");
            expect(instanceRules).toHaveLength(1);

            const superEarlyBird = instanceRules[0];
            expect(superEarlyBird.ruleName).toBe("Super Early Bird");
            expect(superEarlyBird.value).toBe(5);
            expect(superEarlyBird.applies).toBe(true);
            expect(superEarlyBird.ruleDetails?.conditionType).toBe("hours_before_min");
            expect(superEarlyBird.ruleDetails?.hours).toBe(72);
        });
    });
});
