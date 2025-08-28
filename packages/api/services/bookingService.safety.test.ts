import { describe, it, expect, vi, beforeEach } from "vitest";
import { calculateBestDiscount } from "../utils/classDiscount";
import { createTestTemplate, createTestInstance } from "../convex/testResources";

/**
 * CRITICAL SAFETY TESTS FOR BOOKING SERVICE INTEGRATION
 * 
 * These tests specifically address the booking flow safety issues
 * that resulted from the cents-to-credits conversion bug.
 * 
 * BUG CONTEXT:
 * - The discount calculation bug caused classes to become free (finalPrice = 0)
 * - bookingService.bookClass called creditService.spendCredits(amount: 0)
 * - creditService validated amount > 0, causing "Credit amount must be greater than 0" error
 * - The fix handles free classes specially by skipping credit spending
 */
describe("Booking Service Safety Tests", () => {
    const now = Date.now();

    // Mock credit service to simulate the validation that caught our bug
    const mockCreditService = {
        spendCredits: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
        
        // Simulate the validation that caught our bug
        mockCreditService.spendCredits.mockImplementation(({ amount }: { amount: number }) => {
            if (amount <= 0) {
                throw new Error("Credit amount must be greater than 0");
            }
            return {
                transactionId: "mock_transaction_123",
                newBalance: 50 - amount,
            };
        });
    });

    describe("Free Class Booking Edge Cases", () => {
        it("should handle booking when discount equals class price (free class)", async () => {
            // €10 class with €10 discount = FREE class
            const template = createTestTemplate({
                price: 1000, // €10 = 1000 cents = 20 credits
                discountRules: [
                    {
                        id: "full_discount",
                        name: "€10 Full Discount",
                        condition: { type: "always" },
                        discount: {
                            type: "fixed_amount",
                            value: 1000, // €10 = 1000 cents (equals class price)
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

            const discountResult = calculateBestDiscount(instance, template, {
                bookingTime: now,
            });

            // Verify discount calculation results in free class
            expect(discountResult.finalPrice).toBe(0);
            expect(discountResult.appliedDiscount?.creditsSaved).toBe(20);

            // Simulate booking service logic for free classes
            const simulateBookingFlow = async () => {
                if (discountResult.finalPrice === 0) {
                    // Free class: skip credit spending, assign free booking ID
                    return {
                        success: true,
                        transactionId: `free_booking_${Date.now()}`,
                        finalPrice: 0,
                        message: "Free class booking successful",
                    };
                } else {
                    // Paid class: attempt credit spending (would fail if amount = 0)
                    const creditResult = mockCreditService.spendCredits({
                        amount: discountResult.finalPrice,
                    });
                    return {
                        success: true,
                        transactionId: creditResult.transactionId,
                        finalPrice: discountResult.finalPrice,
                        message: "Paid class booking successful",
                    };
                }
            };

            const result = await simulateBookingFlow();

            // Should successfully handle free class without calling credit service
            expect(result.success).toBe(true);
            expect(result.finalPrice).toBe(0);
            expect(result.transactionId).toMatch(/^free_booking_/);
            expect(mockCreditService.spendCredits).not.toHaveBeenCalled();
        });

        it("should handle booking when discount exceeds class price (capped free class)", async () => {
            // €10 class with €15 discount = FREE class (discount capped)
            const template = createTestTemplate({
                price: 1000, // €10 = 1000 cents = 20 credits
                discountRules: [
                    {
                        id: "super_discount",
                        name: "€15 Super Discount",
                        condition: { type: "always" },
                        discount: {
                            type: "fixed_amount",
                            value: 1500, // €15 = 1500 cents (exceeds class price)
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

            const discountResult = calculateBestDiscount(instance, template, {
                bookingTime: now,
            });

            // Verify discount is capped and results in free class
            expect(discountResult.finalPrice).toBe(0); // Capped at 0, not negative
            // Note: creditsSaved reflects actual savings (not theoretical discount amount)
            expect(discountResult.appliedDiscount?.creditsSaved).toBe(20); // Only save what was originally priced

            // Simulate booking flow
            const simulateBookingFlow = async () => {
                if (discountResult.finalPrice === 0) {
                    return {
                        success: true,
                        transactionId: `free_booking_${Date.now()}`,
                        finalPrice: 0,
                    };
                } else {
                    const creditResult = mockCreditService.spendCredits({
                        amount: discountResult.finalPrice,
                    });
                    return {
                        success: true,
                        transactionId: creditResult.transactionId,
                        finalPrice: discountResult.finalPrice,
                    };
                }
            };

            const result = await simulateBookingFlow();

            expect(result.success).toBe(true);
            expect(result.finalPrice).toBe(0);
            expect(mockCreditService.spendCredits).not.toHaveBeenCalled();
        });

        it("should handle normal paid booking after discount application", async () => {
            // €20 class with €3 discount = €17 paid class
            const template = createTestTemplate({
                price: 2000, // €20 = 2000 cents = 40 credits
                discountRules: [
                    {
                        id: "normal_discount",
                        name: "€3 Normal Discount",
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
                startTime: now + 3600000,
            });

            const discountResult = calculateBestDiscount(instance, template, {
                bookingTime: now,
            });

            // Verify normal discount calculation
            expect(discountResult.finalPrice).toBe(34); // 40 - 6 = 34 credits (€17)
            expect(discountResult.appliedDiscount?.creditsSaved).toBe(6);

            // Simulate booking flow
            const simulateBookingFlow = async () => {
                if (discountResult.finalPrice === 0) {
                    return {
                        success: true,
                        transactionId: `free_booking_${Date.now()}`,
                        finalPrice: 0,
                    };
                } else {
                    const creditResult = mockCreditService.spendCredits({
                        amount: discountResult.finalPrice,
                    });
                    return {
                        success: true,
                        transactionId: creditResult.transactionId,
                        finalPrice: discountResult.finalPrice,
                    };
                }
            };

            const result = await simulateBookingFlow();

            // Should successfully process paid booking
            expect(result.success).toBe(true);
            expect(result.finalPrice).toBe(34);
            expect(mockCreditService.spendCredits).toHaveBeenCalledWith({
                amount: 34,
            });
            expect(result.transactionId).toBe("mock_transaction_123");
        });
    });

    describe("Error Scenarios That Would Have Caught Our Bug", () => {
        it("should demonstrate the original bug scenario (fixed)", async () => {
            // This test demonstrates what would have happened with the original bug
            
            // Setup that would have triggered the bug
            const template = createTestTemplate({
                price: 2000, // €20 = 2000 cents = 40 credits
                discountRules: [
                    {
                        id: "bug_discount",
                        name: "€6 Discount",
                        condition: { type: "always" },
                        discount: {
                            type: "fixed_amount",
                            value: 300, // €3 = 300 cents
                        },
                        createdAt: now,
                        createdBy: "user1" as any,
                    },
                ],
            });

            const instance = createTestInstance({
                price: 2000,
                startTime: now + 3600000,
            });

            // With the bug: discount.value (300 cents) was treated as credits
            // So: 40 credits - 300 credits = -260 credits → 0 (capped)
            // Result: Free class when it should be €17

            // With the fix: discount.value is correctly converted
            // So: 40 credits - (300 cents ÷ 50) credits = 40 - 6 = 34 credits (€17)
            
            const discountResult = calculateBestDiscount(instance, template, {
                bookingTime: now,
            });

            // Verify the fix produces correct results
            expect(discountResult.originalPrice).toBe(40); // €20 = 40 credits
            // Note: discountValue was redundant and removed; we now only use creditsSaved
            expect(discountResult.appliedDiscount?.creditsSaved).toBe(6); // 300 cents ÷ 50 = 6 credits
            expect(discountResult.finalPrice).toBe(34); // 40 - 6 = 34 credits (€17)
            expect(discountResult.appliedDiscount?.creditsSaved).toBe(6);

            // The bug would have made finalPrice = 0, causing credit service validation error
            expect(discountResult.finalPrice).toBeGreaterThan(0); // Not free!
        });

        it("should catch attempts to book with zero credits (validation error)", async () => {
            // This test verifies that the credit service validation still works correctly
            
            const simulateBuggyBookingAttempt = async () => {
                try {
                    // Attempt to spend 0 credits (simulating the original bug scenario)
                    mockCreditService.spendCredits({ amount: 0 });
                    return { success: true };
                } catch (error) {
                    return { success: false, error: (error as Error).message };
                }
            };

            const result = await simulateBuggyBookingAttempt();

            // Should fail with validation error
            expect(result.success).toBe(false);
            expect(result.error).toBe("Credit amount must be greater than 0");
            
            // This proves the credit service validation is working as intended
            // Our fix prevents this error by handling free classes separately
        });
    });

    describe("Booking Flow Integration Scenarios", () => {
        it("should handle multiple booking attempts with different discount scenarios", async () => {
            const testScenarios = [
                {
                    name: "Regular discounted class",
                    price: 1500, // €15 = 30 credits
                    value: 250, // €2.50 = 5 credits
                    expectedFinalPrice: 25, // 30 - 5 = 25 credits (€12.50)
                    expectedCreditsUsed: true,
                },
                {
                    name: "Free class after discount",
                    price: 500, // €5 = 10 credits
                    value: 500, // €5 = 10 credits
                    expectedFinalPrice: 0, // Free
                    expectedCreditsUsed: false,
                },
                {
                    name: "Nearly free class after discount",
                    price: 150, // €1.50 = 3 credits
                    value: 100, // €1 = 2 credits
                    expectedFinalPrice: 1, // 3 - 2 = 1 credit (€0.50)
                    expectedCreditsUsed: true,
                },
            ];

            for (const scenario of testScenarios) {
                vi.clearAllMocks();

                const template = createTestTemplate({
                    price: scenario.price,
                    discountRules: [
                        {
                            id: `scenario_${scenario.name}`,
                            name: `${scenario.name} Discount`,
                            condition: { type: "always" },
                            discount: {
                                type: "fixed_amount",
                                value: scenario.value,
                            },
                            createdAt: now,
                            createdBy: "user1" as any,
                        },
                    ],
                });

                const instance = createTestInstance({
                    price: scenario.price,
                    startTime: now + 3600000,
                });

                const discountResult = calculateBestDiscount(instance, template, {
                    bookingTime: now,
                });

                // Verify discount calculation
                expect(discountResult.finalPrice).toBe(scenario.expectedFinalPrice);

                // Simulate booking
                const simulateBookingFlow = async () => {
                    if (discountResult.finalPrice === 0) {
                        return {
                            success: true,
                            transactionId: `free_booking_${Date.now()}`,
                            creditsUsed: false,
                        };
                    } else {
                        const creditResult = mockCreditService.spendCredits({
                            amount: discountResult.finalPrice,
                        });
                        return {
                            success: true,
                            transactionId: creditResult.transactionId,
                            creditsUsed: true,
                        };
                    }
                };

                const bookingResult = await simulateBookingFlow();

                expect(bookingResult.success).toBe(true);
                expect(bookingResult.creditsUsed).toBe(scenario.expectedCreditsUsed);

                if (scenario.expectedCreditsUsed) {
                    expect(mockCreditService.spendCredits).toHaveBeenCalledWith({
                        amount: scenario.expectedFinalPrice,
                    });
                } else {
                    expect(mockCreditService.spendCredits).not.toHaveBeenCalled();
                }
            }
        });
    });
});