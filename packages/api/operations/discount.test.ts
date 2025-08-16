import { describe, it, expect } from "vitest";
import {
    createTimeBasedDiscount,
    discountPatterns
} from "./discount";

describe('Discount Operations', () => {
    describe('createTimeBasedDiscount', () => {
        it('should create valid time-based discount with percentage', () => {
            const result = createTimeBasedDiscount(
                "Early Bird Special",
                48,
                "percentage",
                0.20
            );

            expect(result).toEqual({
                name: "Early Bird Special",
                type: "time",
                discountType: "percentage",
                discountValue: 0.20,
                timeFields: { hoursBeforeStart: 48 }
            });
        });

        it('should create valid time-based discount with fixed amount', () => {
            const result = createTimeBasedDiscount(
                "24h Advance Booking",
                24,
                "fixed_amount",
                5
            );

            expect(result).toEqual({
                name: "24h Advance Booking",
                type: "time",
                discountType: "fixed_amount",
                discountValue: 5,
                timeFields: { hoursBeforeStart: 24 }
            });
        });

        it('should handle zero hours before start', () => {
            const result = createTimeBasedDiscount(
                "Last Minute Deal",
                0,
                "percentage",
                0.30
            );

            expect(result.timeFields.hoursBeforeStart).toBe(0);
        });

        it('should handle large hour values', () => {
            const result = createTimeBasedDiscount(
                "Week Advance Booking",
                168, // 7 days
                "percentage",
                0.25
            );

            expect(result.timeFields.hoursBeforeStart).toBe(168);
        });

        it('should preserve exact decimal values', () => {
            const result = createTimeBasedDiscount(
                "Custom Discount",
                36.5,
                "percentage",
                0.175
            );

            expect(result.timeFields.hoursBeforeStart).toBe(36.5);
            expect(result.discountValue).toBe(0.175);
        });
    });

    describe('discountPatterns', () => {
        describe('earlyBird', () => {
            it('should create early bird discount with default hours', () => {
                const result = discountPatterns.earlyBird(0.20);

                expect(result.name).toBe("Early Bird 20% Off");
                expect(result.type).toBe("time");
                expect(result.discountType).toBe("percentage");
                expect(result.discountValue).toBe(0.20);
                expect(result.timeFields.hoursBeforeStart).toBe(48);
            });

            it('should create early bird discount with custom hours', () => {
                const result = discountPatterns.earlyBird(0.25, 72);

                expect(result.name).toBe("Early Bird 25% Off");
                expect(result.timeFields.hoursBeforeStart).toBe(72);
            });

            it('should round percentage correctly in name', () => {
                const result = discountPatterns.earlyBird(0.175);

                expect(result.name).toBe("Early Bird 18% Off");
                expect(result.discountValue).toBe(0.175);
            });
        });

        describe('lastMinute', () => {
            it('should create last minute discount with default hours', () => {
                const result = discountPatterns.lastMinute(0.30);

                expect(result.name).toBe("Last Minute 30% Off");
                expect(result.type).toBe("time");
                expect(result.discountType).toBe("percentage");
                expect(result.discountValue).toBe(0.30);
                expect(result.timeFields.hoursBeforeStart).toBe(2);
            });

            it('should create last minute discount with custom hours', () => {
                const result = discountPatterns.lastMinute(0.40, 1);

                expect(result.name).toBe("Last Minute 40% Off");
                expect(result.timeFields.hoursBeforeStart).toBe(1);
            });

            it('should round percentage correctly in name', () => {
                const result = discountPatterns.lastMinute(0.125);

                expect(result.name).toBe("Last Minute 13% Off");
                expect(result.discountValue).toBe(0.125);
            });
        });

        describe('fixedAmount', () => {
            it('should create fixed amount discount with default hours', () => {
                const result = discountPatterns.fixedAmount(5);

                expect(result.name).toBe("24h Advance Booking - $5 Off");
                expect(result.type).toBe("time");
                expect(result.discountType).toBe("fixed_amount");
                expect(result.discountValue).toBe(5);
                expect(result.timeFields.hoursBeforeStart).toBe(24);
            });

            it('should create fixed amount discount with custom hours', () => {
                const result = discountPatterns.fixedAmount(10, 48);

                expect(result.name).toBe("48h Advance Booking - $10 Off");
                expect(result.timeFields.hoursBeforeStart).toBe(48);
            });

            it('should handle zero discount amount', () => {
                const result = discountPatterns.fixedAmount(0, 12);

                expect(result.name).toBe("12h Advance Booking - $0 Off");
                expect(result.discountValue).toBe(0);
            });
        });
    });

    describe('Integration and consistency', () => {
        it('should create consistent discount structures', () => {
            const timeDiscount = createTimeBasedDiscount("Test", 24, "percentage", 0.15);

            expect(timeDiscount.type).toBe("time");
            expect(timeDiscount.timeFields).toBeDefined();
        });

        it('should handle all discount type combinations', () => {
            const combinations: Array<{ type: "percentage" | "fixed_amount"; value: number }> = [
                { type: "percentage", value: 0.20 },
                { type: "percentage", value: 0.50 },
                { type: "fixed_amount", value: 5 },
                { type: "fixed_amount", value: 10 }
            ];

            combinations.forEach(({ type, value }) => {
                const timeResult = createTimeBasedDiscount("Test", 24, type, value);

                expect(timeResult.discountType).toBe(type);
                expect(timeResult.discountValue).toBe(value);
            });
        });

        it('should generate unique names for different patterns', () => {
            const earlyBird = discountPatterns.earlyBird(0.20);
            const lastMinute = discountPatterns.lastMinute(0.30);
            const fixedAmount = discountPatterns.fixedAmount(5);

            expect(earlyBird.name).not.toBe(lastMinute.name);
            expect(lastMinute.name).not.toBe(fixedAmount.name);
            expect(earlyBird.name).not.toBe(fixedAmount.name);
        });

        it('should maintain type safety across all functions', () => {
            // This test ensures TypeScript compilation works correctly
            const timeDiscount = createTimeBasedDiscount("Test", 24, "percentage", 0.20);

            // Should not have type errors
            expect(typeof timeDiscount.type).toBe("string");
            expect(typeof timeDiscount.discountType).toBe("string");
        });
    });
});
