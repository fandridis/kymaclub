import { describe, expect, test } from "vitest";
import { api } from "../convex/_generated/api";
import { internal } from "../convex/_generated/api";
import { initAuth, testT, createTestVenue, createTestClassTemplate, createTestClassInstance } from "./helpers";
import type { Id } from "../convex/_generated/dataModel";

describe('Booking with Discounts Integration Tests', () => {
    
    async function setupDiscountedClass(asUser: any, businessId: Id<"businesses">, userId: Id<"users">, options: {
        templateDiscountRules?: any[];
        instanceDiscountRules?: any[];
        classPrice?: number;
        startTime?: number;
    } = {}) {
        const venueId = await createTestVenue(asUser, "Test Yoga Studio");
        
        // Create template
        const templateId = await createTestClassTemplate(asUser, userId, businessId, venueId, {
            name: "Discounted Yoga Class",
            description: "A yoga class with potential discounts",
            duration: 60,
            capacity: 20,
            price: options.classPrice ?? 2000 // €20 = 2000 cents = 40 credits
        });

        // Add discount rules to template if provided
        if (options.templateDiscountRules) {
            await asUser.mutation(api.mutations.classTemplates.updateClassTemplate, {
                templateId,
                template: {
                    discountRules: options.templateDiscountRules
                }
            });
        }

        const startTime = options.startTime ?? Date.now() + (4 * 60 * 60 * 1000); // 4 hours from now

        // Create instance using the standard API
        const createResult = await asUser.mutation(api.mutations.classInstances.createClassInstance, {
            templateId,
            startTime
        });

        const instanceId = createResult.createdInstanceId;
        
        // If instance discount rules are provided, update the instance
        if (options.instanceDiscountRules) {
            await asUser.mutation(api.mutations.classInstances.updateSingleInstance, {
                instanceId,
                instance: {
                    discountRules: options.instanceDiscountRules
                }
            });
        }

        return { venueId, templateId, instanceId, startTime };
    }

    describe('Template Discount Application in Bookings', () => {
        test('should apply template discount correctly and preserve templateSnapshot in booking', async () => {
            const { userId, businessId } = await initAuth();
            const asUser = testT.withIdentity({ subject: userId });

            // Give user credits
            await asUser.mutation(api.mutations.credits.giftCredits, {
                userId: userId,
                amount: 50
            });

            // Create class with template discount (€5 off if booked 24+ hours before)
            const { instanceId, templateId, venueId } = await setupDiscountedClass(asUser, businessId, userId, {
                templateDiscountRules: [
                    {
                        id: "template_early_bird",
                        name: "Template Early Bird €5 Off",
                        condition: {
                            type: "hours_before_min",
                            hours: 24
                        },
                        discount: {
                            type: "fixed_amount",
                            value: 500 // €5 = 500 cents = 10 credits
                        },
                        createdAt: Date.now(),
                        createdBy: userId
                    }
                ],
                classPrice: 2000, // €20 = 40 credits
                startTime: Date.now() + (48 * 60 * 60 * 1000) // 48 hours from now (discount applies)
            });

            // Book the class
            const bookingResult = await asUser.mutation(api.mutations.bookings.bookClass, {
                classInstanceId: instanceId,
                description: "Booking with template discount"
            });

            // Verify booking was created with correct discount
            const booking = await asUser.query(api.queries.bookings.getBookingDetails, {
                bookingId: bookingResult.bookingId
            });

            expect(booking.originalPrice).toBe(2000); // €20 = 2000 cents
            expect(booking.finalPrice).toBe(1500);   // €15 = 1500 cents (2000 - 500 discount)
            expect(booking.creditsUsed).toBe(30);    // 1500 cents / 50 = 30 credits
            expect(booking.appliedDiscount).toBeTruthy();
            expect(booking.appliedDiscount?.source).toBe("template_rule");
            expect(booking.appliedDiscount?.creditsSaved).toBe(10); // €5 = 10 credits saved
            expect(booking.appliedDiscount?.ruleName).toBe("Template Early Bird €5 Off");

            // CRITICAL: Verify booking has instance snapshot for efficient queries
            expect(booking.classInstanceSnapshot).toBeTruthy();
            expect(booking.classInstanceSnapshot?.name).toBe("Discounted Yoga Class");
            expect(booking.classInstanceSnapshot?.startTime).toBeDefined();
            
            // CRITICAL: Verify templateSnapshot is preserved in the actual class instance
            const bookedInstance = await asUser.query(api.queries.classInstances.getClassInstanceById, {
                instanceId
            });
            expect(bookedInstance?.templateSnapshot).toBeTruthy();
            expect(bookedInstance?.templateSnapshot?.name).toBe("Discounted Yoga Class");
            expect(bookedInstance?.templateSnapshot?.discountRules).toBeTruthy();
            expect(bookedInstance?.templateSnapshot?.discountRules).toHaveLength(1);
            expect(bookedInstance?.templateSnapshot?.discountRules![0].name).toBe("Template Early Bird €5 Off");

            // Verify user's credit balance is correct
            const balance = await asUser.query(api.queries.credits.getUserBalance, {
                userId: userId
            });
            expect(balance.balance).toBe(20); // 50 - 30 (discounted price)

            // Verify credit transaction reflects discount
            const transactions = await asUser.query(api.queries.credits.getUserTransactions, {
                userId: userId,
                type: "spend"
            });
            expect(transactions).toHaveLength(1);
            expect(transactions[0].amount).toBe(-30); // Charged discounted amount
            expect(transactions[0].businessId).toBe(businessId);
            expect(transactions[0].venueId).toBe(venueId);
            expect(transactions[0].classTemplateId).toBe(templateId);
            expect(transactions[0].classInstanceId).toBe(instanceId);
        });

        test('should not apply template discount when conditions are not met', async () => {
            const { userId, businessId } = await initAuth();
            const asUser = testT.withIdentity({ subject: userId });

            // Give user credits
            await asUser.mutation(api.mutations.credits.giftCredits, {
                userId: userId,
                amount: 50
            });

            // Create class with template discount (€5 off if booked 48+ hours before)
            const { instanceId } = await setupDiscountedClass(asUser, businessId, userId, {
                templateDiscountRules: [
                    {
                        id: "strict_early_bird",
                        name: "Strict Early Bird €5 Off",
                        condition: {
                            type: "hours_before_min",
                            hours: 48 // Requires 48+ hours
                        },
                        discount: {
                            type: "fixed_amount",
                            value: 500 // €5 = 500 cents
                        },
                        createdAt: Date.now(),
                        createdBy: userId
                    }
                ],
                classPrice: 2000, // €20 = 40 credits
                startTime: Date.now() + (24 * 60 * 60 * 1000) // Only 24 hours from now (discount doesn't apply)
            });

            // Book the class
            const bookingResult = await asUser.mutation(api.mutations.bookings.bookClass, {
                classInstanceId: instanceId
            });

            // Verify no discount was applied
            const booking = await asUser.query(api.queries.bookings.getBookingDetails, {
                bookingId: bookingResult.bookingId
            });

            expect(booking.originalPrice).toBe(2000); // €20 = 2000 cents
            expect(booking.finalPrice).toBe(2000);   // No discount applied (2000 cents)
            expect(booking.creditsUsed).toBe(40);    // 2000 cents / 50 = 40 credits
            expect(booking.appliedDiscount).toBeUndefined();

            // Verify user charged full amount
            const balance = await asUser.query(api.queries.credits.getUserBalance, {
                userId: userId
            });
            expect(balance.balance).toBe(10); // 50 - 40 (full price)
        });
    });

    describe('Instance Discount Priority in Bookings', () => {
        test('should prioritize instance discount over template discount in booking', async () => {
            const { userId, businessId } = await initAuth();
            const asUser = testT.withIdentity({ subject: userId });

            // Give user credits
            await asUser.mutation(api.mutations.credits.giftCredits, {
                userId: userId,
                amount: 50
            });

            // Create class with both template and instance discounts
            const { instanceId } = await setupDiscountedClass(asUser, businessId, userId, {
                // Template discount: €3 off
                templateDiscountRules: [
                    {
                        id: "template_discount",
                        name: "Template €3 Off",
                        condition: { type: "always" },
                        discount: {
                            type: "fixed_amount",
                            value: 300 // €3 = 300 cents = 6 credits
                        },
                        createdAt: Date.now(),
                        createdBy: userId
                    }
                ],
                // Instance discount: €7 off (higher than template)
                instanceDiscountRules: [
                    {
                        id: "instance_special",
                        name: "Instance Special €7 Off",
                        condition: { type: "always" },
                        discount: {
                            type: "fixed_amount",
                            value: 700 // €7 = 700 cents = 14 credits
                        },
                        createdAt: Date.now(),
                        createdBy: userId
                    }
                ],
                classPrice: 2500 // €25 = 50 credits
            });

            // Book the class
            const bookingResult = await asUser.mutation(api.mutations.bookings.bookClass, {
                classInstanceId: instanceId
            });

            // Verify instance discount was applied (not template)
            const booking = await asUser.query(api.queries.bookings.getBookingDetails, {
                bookingId: bookingResult.bookingId
            });

            expect(booking.originalPrice).toBe(2500); // €25 = 2500 cents
            expect(booking.finalPrice).toBe(1800);   // €18 = 1800 cents (2500 - 700 instance discount)
            expect(booking.creditsUsed).toBe(36);    // 1800 cents / 50 = 36 credits
            expect(booking.appliedDiscount?.source).toBe("instance_rule");
            expect(booking.appliedDiscount?.creditsSaved).toBe(14); // €7 = 14 credits saved
            expect(booking.appliedDiscount?.ruleName).toBe("Instance Special €7 Off");

            // Verify correct charge
            const balance = await asUser.query(api.queries.credits.getUserBalance, {
                userId: userId
            });
            expect(balance.balance).toBe(14); // 50 - 36 (instance discounted price)
        });

        test('should fall back to template discount when instance discount conditions not met', async () => {
            const { userId, businessId } = await initAuth();
            const asUser = testT.withIdentity({ subject: userId });

            // Give user credits
            await asUser.mutation(api.mutations.credits.giftCredits, {
                userId: userId,
                amount: 50
            });

            // Create class with both template and instance discounts
            const { instanceId } = await setupDiscountedClass(asUser, businessId, userId, {
                // Template discount: Always applies
                templateDiscountRules: [
                    {
                        id: "template_backup",
                        name: "Template Backup €3 Off",
                        condition: { type: "always" },
                        discount: {
                            type: "fixed_amount",
                            value: 300 // €3 = 300 cents = 6 credits
                        },
                        createdAt: Date.now(),
                        createdBy: userId
                    }
                ],
                // Instance discount: Doesn't apply (requires 72+ hours, we only have 4)
                instanceDiscountRules: [
                    {
                        id: "instance_early",
                        name: "Instance Super Early €10 Off",
                        condition: {
                            type: "hours_before_min",
                            hours: 72 // Requires 72+ hours
                        },
                        discount: {
                            type: "fixed_amount",
                            value: 1000 // €10 = 1000 cents
                        },
                        createdAt: Date.now(),
                        createdBy: userId
                    }
                ],
                classPrice: 2000, // €20 = 40 credits
                startTime: Date.now() + (4 * 60 * 60 * 1000) // Only 4 hours (instance discount won't apply)
            });

            // Book the class
            const bookingResult = await asUser.mutation(api.mutations.bookings.bookClass, {
                classInstanceId: instanceId
            });

            // Verify template discount was applied (instance condition not met)
            const booking = await asUser.query(api.queries.bookings.getBookingDetails, {
                bookingId: bookingResult.bookingId
            });

            expect(booking.originalPrice).toBe(2000); // €20 = 2000 cents
            expect(booking.finalPrice).toBe(1700);   // €17 = 1700 cents (2000 - 300 template discount)
            expect(booking.creditsUsed).toBe(34);    // 1700 cents / 50 = 34 credits
            expect(booking.appliedDiscount?.source).toBe("template_rule");
            expect(booking.appliedDiscount?.creditsSaved).toBe(6); // €3 = 6 credits saved
            expect(booking.appliedDiscount?.ruleName).toBe("Template Backup €3 Off");
        });
    });

    describe('Edge Cases and Safety', () => {
        test('should handle free class correctly (discount equals full price)', async () => {
            const { userId, businessId } = await initAuth();
            const asUser = testT.withIdentity({ subject: userId });

            // Give user enough credits in case discount doesn't work (but discount should make it free)
            await asUser.mutation(api.mutations.credits.giftCredits, {
                userId: userId,
                amount: 25
            });

            // Create class where discount equals full price
            const { instanceId } = await setupDiscountedClass(asUser, businessId, userId, {
                templateDiscountRules: [
                    {
                        id: "full_discount",
                        name: "Full Discount - Free Class",
                        condition: { type: "always" },
                        discount: {
                            type: "fixed_amount",
                            value: 1000 // €10 = 1000 cents = 20 credits (equals class price)
                        },
                        createdAt: Date.now(),
                        createdBy: userId
                    }
                ],
                classPrice: 1000 // €10 = 20 credits (same as discount)
            });

            // Book the free class
            const bookingResult = await asUser.mutation(api.mutations.bookings.bookClass, {
                classInstanceId: instanceId
            });

            // Verify free booking
            const booking = await asUser.query(api.queries.bookings.getBookingDetails, {
                bookingId: bookingResult.bookingId
            });

            expect(booking.originalPrice).toBe(1000); // €10 = 1000 cents
            expect(booking.finalPrice).toBe(0);      // FREE (0 cents)
            expect(booking.creditsUsed).toBe(0);     // No credits used (0 cents / 50)
            expect(booking.appliedDiscount?.creditsSaved).toBe(20); // Full discount applied

            // Verify user's balance unchanged
            const balance = await asUser.query(api.queries.credits.getUserBalance, {
                userId: userId
            });
            expect(balance.balance).toBe(25); // No credits deducted
        });

        test('should cap discount at original price (discount exceeds price)', async () => {
            const { userId, businessId } = await initAuth();
            const asUser = testT.withIdentity({ subject: userId });

            // Give user credits
            await asUser.mutation(api.mutations.credits.giftCredits, {
                userId: userId,
                amount: 30
            });

            // Create class where discount exceeds price
            const { instanceId } = await setupDiscountedClass(asUser, businessId, userId, {
                templateDiscountRules: [
                    {
                        id: "super_discount",
                        name: "Super Discount €15 Off",
                        condition: { type: "always" },
                        discount: {
                            type: "fixed_amount",
                            value: 1500 // €15 = 1500 cents = 30 credits (exceeds €10 class price)
                        },
                        createdAt: Date.now(),
                        createdBy: userId
                    }
                ],
                classPrice: 1000 // €10 = 20 credits (less than discount)
            });

            // Book the class
            const bookingResult = await asUser.mutation(api.mutations.bookings.bookClass, {
                classInstanceId: instanceId
            });

            // Verify discount is capped at original price
            const booking = await asUser.query(api.queries.bookings.getBookingDetails, {
                bookingId: bookingResult.bookingId
            });

            expect(booking.originalPrice).toBe(1000); // €10 = 1000 cents
            expect(booking.finalPrice).toBe(0);      // FREE (capped at 0 cents)
            expect(booking.creditsUsed).toBe(0);     // No credits used (0 cents / 50)
            expect(booking.appliedDiscount?.creditsSaved).toBe(20); // Can only save original price, not 30
        });

        test('should preserve discount information in booking during cancellation', async () => {
            const { userId, businessId } = await initAuth();
            const asUser = testT.withIdentity({ subject: userId });

            // Give user credits
            await asUser.mutation(api.mutations.credits.giftCredits, {
                userId: userId,
                amount: 50
            });

            // Create discounted class far in future (within cancellation window)
            const { instanceId } = await setupDiscountedClass(asUser, businessId, userId, {
                templateDiscountRules: [
                    {
                        id: "cancel_test",
                        name: "Cancellation Test €5 Off",
                        condition: { type: "always" },
                        discount: {
                            type: "fixed_amount",
                            value: 500 // €5 = 500 cents = 10 credits
                        },
                        createdAt: Date.now(),
                        createdBy: userId
                    }
                ],
                classPrice: 2000, // €20 = 40 credits
                startTime: Date.now() + (48 * 60 * 60 * 1000) // 48 hours (within cancellation window)
            });

            // Book the class
            const bookingResult = await asUser.mutation(api.mutations.bookings.bookClass, {
                classInstanceId: instanceId
            });

            // Verify initial booking with discount
            let booking = await asUser.query(api.queries.bookings.getBookingDetails, {
                bookingId: bookingResult.bookingId
            });
            expect(booking.finalPrice).toBe(1500); // Discounted price (1500 cents = 30 credits)
            expect(booking.appliedDiscount?.creditsSaved).toBe(10);

            // Cancel the booking
            await asUser.mutation(api.mutations.bookings.cancelBooking, {
                bookingId: bookingResult.bookingId,
                reason: "Schedule change",
                cancelledBy: "consumer"
            });

            // Verify discount information is preserved after cancellation
            booking = await asUser.query(api.queries.bookings.getBookingDetails, {
                bookingId: bookingResult.bookingId
            });
            expect(booking.status).toBe("cancelled_by_consumer");
            expect(booking.appliedDiscount?.creditsSaved).toBe(10); // Discount info preserved
            expect(booking.finalPrice).toBe(1500); // Original discounted price preserved (1500 cents)
            
            // Verify refund based on discounted price (not original)
            const balance = await asUser.query(api.queries.credits.getUserBalance, {
                userId: userId
            });
            expect(balance.balance).toBe(50); // Full refund of discounted amount (30 credits)
        });
    });

    describe('Historical Data Preservation', () => {
        test('should preserve template and venue snapshots with discount rules in booking records', async () => {
            const { userId, businessId } = await initAuth();
            const asUser = testT.withIdentity({ subject: userId });

            // Give user credits
            await asUser.mutation(api.mutations.credits.giftCredits, {
                userId: userId,
                amount: 50
            });

            // Create class with template discount
            const { instanceId } = await setupDiscountedClass(asUser, businessId, userId, {
                templateDiscountRules: [
                    {
                        id: "historical_test",
                        name: "Historical Test €4 Off",
                        condition: { type: "always" },
                        discount: {
                            type: "fixed_amount",
                            value: 400 // €4 = 400 cents = 8 credits
                        },
                        createdAt: Date.now(),
                        createdBy: userId
                    }
                ],
                classPrice: 1800 // €18 = 36 credits
            });

            // Book the class
            const bookingResult = await asUser.mutation(api.mutations.bookings.bookClass, {
                classInstanceId: instanceId,
                description: "Historical preservation test"
            });

            // Verify booking preserves all snapshots
            const booking = await asUser.query(api.queries.bookings.getBookingDetails, {
                bookingId: bookingResult.bookingId
            });

            // Verify booking has minimal instance snapshot for efficient queries
            expect(booking.classInstanceSnapshot).toBeTruthy();
            expect(booking.classInstanceSnapshot?.name).toBe("Discounted Yoga Class");
            expect(booking.classInstanceSnapshot?.startTime).toBeDefined();

            // CRITICAL: Verify full templateSnapshot is preserved in the actual class instance
            const historicalInstance = await asUser.query(api.queries.classInstances.getClassInstanceById, {
                instanceId
            });
            expect(historicalInstance?.templateSnapshot).toBeTruthy();
            expect(historicalInstance?.templateSnapshot?.name).toBe("Discounted Yoga Class");
            expect(historicalInstance?.templateSnapshot?.discountRules).toBeTruthy();
            expect(historicalInstance?.templateSnapshot?.discountRules).toHaveLength(1);
            expect(historicalInstance?.templateSnapshot?.discountRules![0].name).toBe("Historical Test €4 Off");
            expect(historicalInstance?.templateSnapshot?.discountRules![0].discount.value).toBe(400);
            expect(historicalInstance?.price).toBe(1800); // Original price preserved in instance

            // Verify venue snapshot
            expect(booking.venueSnapshot).toBeTruthy();
            expect(booking.venueSnapshot?.name).toBe("Test Yoga Studio");

            // Verify user snapshot (for business access)
            expect(booking.userSnapshot).toBeTruthy();
            expect(booking.userSnapshot?.email).toBe("test@example.com");

            // This ensures that even if the template or venue is modified/deleted later,
            // the booking record maintains accurate historical data
        });
    });
});