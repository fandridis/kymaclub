import { describe, it, expect } from "vitest";
import type { PricingContext, PricingResult, DynamicPricingRule, DiscountRule, DiscountCondition } from "./pricing";

describe('Pricing Utils', () => {
    describe('PricingContext type', () => {
        it('should have correct structure', () => {
            const context: PricingContext = {
                hoursUntilClass: 24,
                capacityUtilization: 0.8,
                userTier: "premium",
                isRecurringCustomer: true,
                bookingCount: 5
            };

            expect(context.hoursUntilClass).toBe(24);
            expect(context.capacityUtilization).toBe(0.8);
            expect(context.userTier).toBe("premium");
            expect(context.isRecurringCustomer).toBe(true);
            expect(context.bookingCount).toBe(5);
        });

        it('should support all user tiers', () => {
            const tiers: PricingContext['userTier'][] = ['standard', 'premium', 'vip'];
            
            tiers.forEach(tier => {
                const context: PricingContext = {
                    hoursUntilClass: 0,
                    capacityUtilization: 0,
                    userTier: tier,
                    isRecurringCustomer: false,
                    bookingCount: 0
                };
                
                expect(context.userTier).toBe(tier);
            });
        });
    });

    describe('PricingResult type', () => {
        it('should have correct structure', () => {
            const result: PricingResult = {
                originalPrice: 25,
                finalPrice: 20,
                discountPercentage: 20,
                discountAmount: 5
            };

            expect(result.originalPrice).toBe(25);
            expect(result.finalPrice).toBe(20);
            expect(result.discountPercentage).toBe(20);
            expect(result.discountAmount).toBe(5);
        });
    });

    describe('DynamicPricingRule type', () => {
        it('should support time-based pricing rules', () => {
            const rule: DynamicPricingRule = {
                id: "peak_hours",
                name: "Peak Hours Pricing",
                priceMultiplier: 1.5,
                conditions: [
                    {
                        field: "hoursUntilClass",
                        operator: "lt",
                        value: 2
                    }
                ]
            };

            expect(rule.id).toBe("peak_hours");
            expect(rule.priceMultiplier).toBe(1.5);
            expect(rule.conditions).toHaveLength(1);
            expect(rule.conditions[0].field).toBe("hoursUntilClass");
        });

        it('should support capacity-based pricing rules', () => {
            const rule: DynamicPricingRule = {
                id: "high_demand",
                name: "High Demand Pricing",
                priceMultiplier: 1.25,
                conditions: [
                    {
                        field: "capacityUtilization",
                        operator: "gte",
                        value: 0.9
                    }
                ]
            };

            expect(rule.conditions[0].field).toBe("capacityUtilization");
            expect(rule.conditions[0].operator).toBe("gte");
            expect(rule.conditions[0].value).toBe(0.9);
        });

        it('should support multiple conditions', () => {
            const rule: DynamicPricingRule = {
                id: "premium_last_minute",
                name: "Premium Last Minute",
                priceMultiplier: 2.0,
                conditions: [
                    {
                        field: "hoursUntilClass",
                        operator: "lt",
                        value: 1
                    },
                    {
                        field: "capacityUtilization",
                        operator: "gt",
                        value: 0.8
                    }
                ]
            };

            expect(rule.conditions).toHaveLength(2);
            expect(rule.priceMultiplier).toBe(2.0);
        });

        it('should support all operators', () => {
            const operators: Array<DynamicPricingRule['conditions'][0]['operator']> = 
                ['gt', 'lt', 'eq', 'gte', 'lte'];
            
            operators.forEach(operator => {
                const rule: DynamicPricingRule = {
                    id: `test_${operator}`,
                    name: `Test ${operator}`,
                    priceMultiplier: 1.0,
                    conditions: [{
                        field: "hoursUntilClass",
                        operator,
                        value: 1
                    }]
                };
                
                expect(rule.conditions[0].operator).toBe(operator);
            });
        });
    });

    describe('DiscountRule type', () => {
        it('should support early booking discounts', () => {
            const rule: DiscountRule = {
                id: "early_bird",
                name: "Early Bird Discount",
                percentage: 15,
                conditions: [
                    {
                        type: "time_advance",
                        operator: "gte",
                        value: 48
                    }
                ]
            };

            expect(rule.percentage).toBe(15);
            expect(rule.conditions[0].type).toBe("time_advance");
            expect(rule.conditions[0].value).toBe(48);
        });

        it('should support user tier discounts', () => {
            const rule: DiscountRule = {
                id: "vip_discount",
                name: "VIP Member Discount",
                percentage: 25,
                conditions: [
                    {
                        type: "user_tier",
                        operator: "eq",
                        value: 3 // VIP tier level
                    }
                ]
            };

            expect(rule.conditions[0].type).toBe("user_tier");
            expect(rule.conditions[0].operator).toBe("eq");
        });

        it('should support bulk booking discounts', () => {
            const rule: DiscountRule = {
                id: "bulk_discount",
                name: "Bulk Booking Discount",
                percentage: 10,
                conditions: [
                    {
                        type: "bulk_booking",
                        operator: "gte",
                        value: 5
                    }
                ]
            };

            expect(rule.conditions[0].type).toBe("bulk_booking");
            expect(rule.percentage).toBe(10);
        });

        it('should support low utilization discounts', () => {
            const rule: DiscountRule = {
                id: "low_utilization",
                name: "Fill Empty Slots",
                percentage: 30,
                conditions: [
                    {
                        type: "capacity_utilization",
                        operator: "lt",
                        value: 0.3
                    }
                ]
            };

            expect(rule.conditions[0].type).toBe("capacity_utilization");
            expect(rule.conditions[0].value).toBe(0.3);
        });
    });

    describe('DiscountCondition type', () => {
        it('should support all condition types', () => {
            const types: DiscountCondition['type'][] = [
                'time_advance',
                'capacity_utilization', 
                'user_tier',
                'bulk_booking'
            ];

            types.forEach(type => {
                const condition: DiscountCondition = {
                    type,
                    operator: "eq",
                    value: 1
                };
                
                expect(condition.type).toBe(type);
            });
        });

        it('should support all operators', () => {
            const operators: DiscountCondition['operator'][] = [
                'gt', 'lt', 'eq', 'gte', 'lte'
            ];

            operators.forEach(operator => {
                const condition: DiscountCondition = {
                    type: "time_advance",
                    operator,
                    value: 24
                };
                
                expect(condition.operator).toBe(operator);
            });
        });
    });

    describe('Complex pricing scenarios', () => {
        it('should handle combined pricing and discount rules', () => {
            const pricingRule: DynamicPricingRule = {
                id: "peak_time",
                name: "Peak Time Multiplier",
                priceMultiplier: 1.3,
                conditions: [
                    {
                        field: "hoursUntilClass",
                        operator: "lt",
                        value: 3
                    }
                ]
            };

            const discountRule: DiscountRule = {
                id: "vip_override",
                name: "VIP Peak Discount",
                percentage: 20,
                conditions: [
                    {
                        type: "user_tier",
                        operator: "eq",
                        value: 3
                    }
                ]
            };

            expect(pricingRule.priceMultiplier).toBeGreaterThan(1);
            expect(discountRule.percentage).toBeGreaterThan(0);
        });

        it('should support complex multi-condition rules', () => {
            const complexRule: DiscountRule = {
                id: "premium_loyalty",
                name: "Premium Loyalty Discount",
                percentage: 15,
                conditions: [
                    {
                        type: "user_tier",
                        operator: "gte",
                        value: 2
                    },
                    {
                        type: "bulk_booking",
                        operator: "gte",
                        value: 3
                    },
                    {
                        type: "capacity_utilization",
                        operator: "lt",
                        value: 0.7
                    }
                ]
            };

            expect(complexRule.conditions).toHaveLength(3);
            expect(complexRule.conditions.every(c => c.value !== undefined)).toBe(true);
        });
    });
});