import { describe, expect, test } from "vitest";
import { api } from "../convex/_generated/api";
import { internal } from "../convex/_generated/api";
import { initAuth, testT, createTestVenue, createTestClassTemplate, createTestClassInstance, setupClassForBooking } from "./helpers";

describe('Booking System Integration Tests', () => {
    describe('Authentication & Authorization', () => {
        test('should reject unauthenticated booking operations', async () => {
            const { userId, businessId } = await initAuth();
            const asUser = testT.withIdentity({ subject: userId });
            const { instanceId } = await setupClassForBooking(asUser, businessId, userId);

            await expect(
                // use the unauthenticated user to book the class
                testT.mutation(api.mutations.bookings.bookClass, {
                    classInstanceId: instanceId,
                    description: "Test booking"
                })
            ).rejects.toThrow("User not found");
        });

        test('should allow authenticated users to book classes', async () => {
            const { userId, businessId } = await initAuth();
            const asUser = testT.withIdentity({ subject: userId });

            // Give user credits
            await asUser.mutation(api.mutations.credits.giftCredits, {
                userId: userId,
                amount: 20
            });

            const { instanceId } = await setupClassForBooking(asUser, businessId, userId);

            const bookingResult = await asUser.mutation(api.mutations.bookings.bookClass, {
                classInstanceId: instanceId,
                description: "Test yoga session"
            });

            expect(bookingResult.bookingId).toBeDefined();
            expect(bookingResult.transactionId).toBeDefined();
        });
    });

    describe('Booking Flow', () => {
        test('should create booking with proper credit transaction', async () => {
            const { userId, businessId } = await initAuth();
            const asUser = testT.withIdentity({ subject: userId });

            // Give user credits
            await asUser.mutation(api.mutations.credits.giftCredits, {
                userId: userId,
                amount: 30
            });

            const { instanceId, templateId, venueId } = await setupClassForBooking(asUser, businessId, userId);

            // Book the class
            const bookingResult = await asUser.mutation(api.mutations.bookings.bookClass, {
                classInstanceId: instanceId,
                description: "Morning yoga session"
            });

            // Verify booking was created
            const booking = await asUser.query(api.queries.bookings.getBookingDetails, {
                bookingId: bookingResult.bookingId
            });

            expect(booking.userId).toBe(userId);
            expect(booking.classInstanceId).toBe(instanceId);
            expect(booking.status).toBe("pending");
            expect(booking.originalPrice).toBe(10);
            expect(booking.finalPrice).toBe(10);
            expect(booking.creditsUsed).toBe(10);

            // Verify user's credit balance
            const balance = await asUser.query(api.queries.credits.getUserBalance, {
                userId: userId
            });
            expect(balance.balance).toBe(20); // 30 - 10

            // Verify credit transaction was created
            const transactions = await asUser.query(api.queries.credits.getUserTransactions, {
                userId: userId,
                type: "spend"
            });
            expect(transactions).toHaveLength(1);
            expect(transactions[0].amount).toBe(-10); // Negative for spending
            expect(transactions[0].businessId).toBe(businessId);
            expect(transactions[0].venueId).toBe(venueId);
            expect(transactions[0].classTemplateId).toBe(templateId);
            expect(transactions[0].classInstanceId).toBe(instanceId);
            expect(transactions[0].bookingId).toBe(booking._id);
        });

        test('should prevent booking without sufficient credits', async () => {
            const { userId, businessId } = await initAuth();
            const asUser = testT.withIdentity({ subject: userId });

            // Give user insufficient credits
            await asUser.mutation(api.mutations.credits.giftCredits, {
                userId: userId,
                amount: 5 // Class costs 10 credits
            });

            const { instanceId } = await setupClassForBooking(asUser, businessId, userId);

            await expect(
                asUser.mutation(api.mutations.bookings.bookClass, {
                    classInstanceId: instanceId
                })
            ).rejects.toThrow("Insufficient credits");
        });

        test('should prevent duplicate bookings', async () => {
            const { userId, businessId } = await initAuth();
            const asUser = testT.withIdentity({ subject: userId });

            // Give user credits
            await asUser.mutation(api.mutations.credits.giftCredits, {
                userId: userId,
                amount: 30
            });

            const { instanceId } = await setupClassForBooking(asUser, businessId, userId);

            // First booking should succeed
            const firstBooking = await asUser.mutation(api.mutations.bookings.bookClass, {
                classInstanceId: instanceId
            });

            // Second booking should return the same booking ID (idempotent)
            const secondBooking = await asUser.mutation(api.mutations.bookings.bookClass, {
                classInstanceId: instanceId
            });

            expect(firstBooking.bookingId).toBe(secondBooking.bookingId);

            // Verify user was only charged once
            const balance = await asUser.query(api.queries.credits.getUserBalance, {
                userId: userId
            });
            expect(balance.balance).toBe(20); // 30 - 10 (charged only once)
        });

        test('should prevent booking when class is full', async () => {
            const { userId, businessId } = await initAuth();
            const asUser = testT.withIdentity({ subject: userId });

            // Create a class with capacity of 1
            const venueId = await createTestVenue(asUser);
            const templateId = await createTestClassTemplate(asUser, userId, businessId, venueId, {
                name: "Small Class",
                description: "A small class",
                duration: 60,
                capacity: 1, // Only 1 spot
                baseCredits: 10
            });

            const startTime = Date.now() + (4 * 60 * 60 * 1000);
            const endTime = startTime + (60 * 60 * 1000);

            const instanceId = await createTestClassInstance(asUser, templateId, startTime, endTime, "UTC");

            // Create second user
            const user2Id = await testT.mutation(internal.testFunctions.createTestUser, {
                user: {
                    name: "User 2",
                    email: "user2@example.com"
                }
            });
            await testT.mutation(internal.testFunctions.attachUserToBusiness, {
                userId: user2Id,
                businessId: businessId,
                role: "user"
            });

            // Give both users credits
            await asUser.mutation(api.mutations.credits.giftCredits, {
                userId: userId,
                amount: 20
            });
            await asUser.mutation(api.mutations.credits.giftCredits, {
                userId: user2Id,
                amount: 20
            });

            // First user books successfully
            await asUser.mutation(api.mutations.bookings.bookClass, {
                classInstanceId: instanceId
            });

            // Second user should be rejected
            const asUser2 = testT.withIdentity({ subject: user2Id });
            await expect(
                asUser2.mutation(api.mutations.bookings.bookClass, {
                    classInstanceId: instanceId
                })
            ).rejects.toThrow("Class is full");
        });
    });

    describe('Booking Cancellation', () => {
        test('should cancel booking with full refund (within cancellation window)', async () => {
            const { userId, businessId } = await initAuth();
            const asUser = testT.withIdentity({ subject: userId });

            // Give user credits
            await asUser.mutation(api.mutations.credits.giftCredits, {
                userId: userId,
                amount: 30
            });

            // Create class far in the future (within cancellation window)
            const venueId = await createTestVenue(asUser);
            const templateId = await createTestClassTemplate(asUser, userId, businessId, venueId, {
                name: "Future Yoga",
                description: "A future yoga class",
                duration: 60,
                capacity: 20,
                baseCredits: 15
            });

            const startTime = Date.now() + (48 * 60 * 60 * 1000); // 48 hours from now
            const endTime = startTime + (60 * 60 * 1000);

            const instanceId = await createTestClassInstance(asUser, templateId, startTime, endTime, "UTC");

            // Book the class
            const bookingResult = await asUser.mutation(api.mutations.bookings.bookClass, {
                classInstanceId: instanceId
            });

            // Verify booking and balance
            let balance = await asUser.query(api.queries.credits.getUserBalance, {
                userId: userId
            });
            expect(balance.balance).toBe(15); // 30 - 15

            // Cancel the booking
            const cancelResult = await asUser.mutation(api.mutations.bookings.cancelBooking, {
                bookingId: bookingResult.bookingId,
                reason: "Schedule conflict",
                cancelledBy: "consumer"
            });

            expect(cancelResult.success).toBe(true);

            // Verify booking status
            const booking = await asUser.query(api.queries.bookings.getBookingDetails, {
                bookingId: bookingResult.bookingId
            });
            expect(booking.status).toBe("cancelled");
            expect(booking.cancelledAt).toBeDefined();

            // Verify full refund
            balance = await asUser.query(api.queries.credits.getUserBalance, {
                userId: userId
            });
            expect(balance.balance).toBe(30); // Full refund

            // Verify refund transaction
            const refundTransactions = await asUser.query(api.queries.credits.getUserTransactions, {
                userId: userId,
                type: "refund"
            });
            expect(refundTransactions).toHaveLength(1);
            expect(refundTransactions[0].amount).toBe(15);
            expect(refundTransactions[0].bookingId).toBe(booking._id);
        });

        test('should cancel booking with partial refund (outside cancellation window)', async () => {
            const { userId, businessId } = await initAuth();
            const asUser = testT.withIdentity({ subject: userId });

            // Give user credits
            await asUser.mutation(api.mutations.credits.giftCredits, {
                userId: userId,
                amount: 40
            });

            const venueId = await createTestVenue(asUser);
            // Default template is 10 hours window.
            const templateId = await createTestClassTemplate(asUser, userId, businessId, venueId, {
                name: "Soon Yoga",
                description: "A soon yoga class",
                duration: 60,
                capacity: 20,
                baseCredits: 20
            });

            // 8 hours from now - we are late!
            const startTime = Date.now() + (8 * 60 * 60 * 1000);
            const endTime = startTime + (60 * 60 * 1000);

            const instanceId = await createTestClassInstance(asUser, templateId, startTime, endTime, "UTC");

            // Book the class
            const bookingResult = await asUser.mutation(api.mutations.bookings.bookClass, {
                classInstanceId: instanceId
            });

            // Verify booking and balance
            let balance = await asUser.query(api.queries.credits.getUserBalance, {
                userId: userId
            });
            expect(balance.balance).toBe(20); // 40 - 20

            // Cancel the booking (late cancellation)
            const cancelResult = await asUser.mutation(api.mutations.bookings.cancelBooking, {
                bookingId: bookingResult.bookingId,
                reason: "Emergency",
                cancelledBy: "consumer"
            });

            expect(cancelResult.success).toBe(true);

            // Verify partial refund (50%)
            balance = await asUser.query(api.queries.credits.getUserBalance, {
                userId: userId
            });
            expect(balance.balance).toBe(30); // 20 + 10 (50% refund)

            // Verify refund transaction
            const refundTransactions = await asUser.query(api.queries.credits.getUserTransactions, {
                userId: userId,
                type: "refund"
            });
            expect(refundTransactions).toHaveLength(1);
            expect(refundTransactions[0].amount).toBe(10); // 50% of 20
        });

        test('should not allow cancelling already cancelled booking', async () => {
            const { userId, businessId } = await initAuth();
            const asUser = testT.withIdentity({ subject: userId });

            // Give user credits and book class
            await asUser.mutation(api.mutations.credits.giftCredits, {
                userId: userId,
                amount: 30
            });

            const { instanceId } = await setupClassForBooking(asUser, businessId, userId);
            const bookingResult = await asUser.mutation(api.mutations.bookings.bookClass, {
                classInstanceId: instanceId
            });

            // Cancel once
            await asUser.mutation(api.mutations.bookings.cancelBooking, {
                bookingId: bookingResult.bookingId,
                cancelledBy: "consumer"
            });

            // Try to cancel again
            await expect(
                asUser.mutation(api.mutations.bookings.cancelBooking, {
                    bookingId: bookingResult.bookingId,
                    cancelledBy: "consumer"
                })
            ).rejects.toThrow("Cannot cancel booking with status: cancelled");
        });

        test('should not allow unauthorized cancellation', async () => {
            const { userId, businessId } = await initAuth();
            const asUser = testT.withIdentity({ subject: userId });

            // Give user credits and book class
            await asUser.mutation(api.mutations.credits.giftCredits, {
                userId: userId,
                amount: 30
            });

            const { instanceId } = await setupClassForBooking(asUser, businessId, userId);
            const bookingResult = await asUser.mutation(api.mutations.bookings.bookClass, {
                classInstanceId: instanceId
            });

            // Create second user
            const user2Id = await testT.mutation(internal.testFunctions.createTestUser, {
                user: {
                    name: "User 2",
                    email: "user2@example.com"
                }
            });

            // User 2 tries to cancel User 1's booking
            const asUser2 = testT.withIdentity({ subject: user2Id });
            await expect(
                asUser2.mutation(api.mutations.bookings.cancelBooking, {
                    bookingId: bookingResult.bookingId,
                    cancelledBy: "consumer"
                })
            ).rejects.toThrow("You are not authorized to cancel this booking");
        });
    });

    describe('Booking Queries', () => {
        test('should get user bookings with details', async () => {
            const { userId, businessId } = await initAuth();
            const asUser = testT.withIdentity({ subject: userId });

            // Give user credits
            await asUser.mutation(api.mutations.credits.giftCredits, {
                userId: userId,
                amount: 50
            });

            const { instanceId } = await setupClassForBooking(asUser, businessId, userId);

            // Book the class
            const bookingResult = await asUser.mutation(api.mutations.bookings.bookClass, {
                classInstanceId: instanceId,
                description: "My yoga session"
            });

            // Get user bookings
            const bookings = await asUser.query(api.queries.bookings.getCurrentUserBookings, {
                paginationOpts: { numItems: 10, cursor: null }
            });

            expect(bookings.page).toHaveLength(1);
            const booking = bookings.page[0];
            expect(booking.userId).toBe(userId);
            expect(booking.status).toBe("pending");
            expect(booking.classInstance).toBeDefined();
            expect(booking.classTemplate).toBeDefined();
            expect(booking.venue).toBeDefined();
            expect(booking.classTemplate?.name).toBe("Morning Yoga");
            expect(booking.venue?.name).toBe("Test Yoga Studio");

            // Test userSnapshot is populated for business owners
            expect(booking.userSnapshot).toBeDefined();
            expect(booking.userSnapshot?.email).toBe("test@example.com"); // From initAuth helper
            expect(booking.userSnapshot?.name).toBe("Test User"); // From initAuth helper
        });

        test('should get upcoming bookings only', async () => {
            const { userId, businessId } = await initAuth();
            const asUser = testT.withIdentity({ subject: userId });

            // Give user credits
            await asUser.mutation(api.mutations.credits.giftCredits, {
                userId: userId,
                amount: 50
            });

            const { instanceId } = await setupClassForBooking(asUser, businessId, userId);

            // Book the class
            await asUser.mutation(api.mutations.bookings.bookClass, {
                classInstanceId: instanceId
            });

            // Get upcoming bookings
            const upcomingBookings = await asUser.query(api.queries.bookings.getCurrentUserUpcomingBookings, {
                daysAhead: 7
            });

            expect(upcomingBookings).toHaveLength(1);
            expect(upcomingBookings[0].status).toBe("pending");
            expect(upcomingBookings[0].classInstance?.startTime).toBeGreaterThan(Date.now());
        });

        test('should filter bookings by status', async () => {
            const { userId, businessId } = await initAuth();
            const asUser = testT.withIdentity({ subject: userId });

            // Give user credits
            await asUser.mutation(api.mutations.credits.giftCredits, {
                userId: userId,
                amount: 50
            });

            const { instanceId } = await setupClassForBooking(asUser, businessId, userId);

            // Book and then cancel
            const bookingResult = await asUser.mutation(api.mutations.bookings.bookClass, {
                classInstanceId: instanceId
            });

            await asUser.mutation(api.mutations.bookings.cancelBooking, {
                bookingId: bookingResult.bookingId,
                cancelledBy: "consumer"
            });

            // Get cancelled bookings
            const cancelledBookings = await asUser.query(api.queries.bookings.getCurrentUserBookings, {
                includeHistory: true,
                paginationOpts: { numItems: 10, cursor: null }
            });

            expect(cancelledBookings.page).toHaveLength(1);
            expect(cancelledBookings.page[0].status).toBe("cancelled");
        });
    });

    describe('Data Integrity', () => {
        test('should maintain consistent state across booking operations', async () => {
            const { userId, businessId } = await initAuth();
            const asUser = testT.withIdentity({ subject: userId });

            // Give user credits
            await asUser.mutation(api.mutations.credits.giftCredits, {
                userId: userId,
                amount: 100
            });

            const { instanceId } = await setupClassForBooking(asUser, businessId, userId);

            // Log current user balanace
            const c1 = await asUser.query(api.queries.credits.getUserBalance, {
                userId: userId
            });

            // Book class
            const bookingResult = await asUser.mutation(api.mutations.bookings.bookClass, {
                classInstanceId: instanceId
            });

            // Log current user balanace
            const c2 = await asUser.query(api.queries.credits.getUserBalance, {
                userId: userId
            });

            // Verify class instance booked count increased
            const instance = await asUser.query(api.queries.classInstances.getClassInstanceById, {
                instanceId: instanceId
            });
            expect(instance?.bookedCount).toBe(1);

            // Cancel booking
            await asUser.mutation(api.mutations.bookings.cancelBooking, {
                bookingId: bookingResult.bookingId,
                cancelledBy: "consumer"
            });

            // Verify class instance booked count decreased
            const updatedInstance = await asUser.query(api.queries.classInstances.getClassInstanceById, {
                instanceId: instanceId
            });
            expect(updatedInstance?.bookedCount).toBe(0);

            // Verify credit balance is back to original
            const balance = await asUser.query(api.queries.credits.getUserBalance, {
                userId: userId
            });
            expect(balance.balance).toBe(100); // Full refund
        });
    });
});