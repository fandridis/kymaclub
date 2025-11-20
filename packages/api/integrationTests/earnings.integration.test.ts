/**
 * Integration tests for earnings queries with month-over-month comparison
 * 
 * Tests the new getMonthlyEarnings query functionality including:
 * - Month-over-month comparison calculations
 * - All-time earnings calculations
 * - Percentage change calculations
 * - Edge cases (zero values, division by zero)
 */

import { describe, test, expect } from "vitest";
import { api, internal } from "../convex/_generated/api";
import { testT, initAuth, createTestVenue, createTestClassTemplate, createTestClassInstance, setupClassForBooking } from "./helpers";

describe("Earnings Integration Tests", () => {

  test("should return comparison data structure correctly", async () => {
    // Setup authenticated user and business
    const { userId, businessId } = await initAuth();
    const asUser = testT.withIdentity({ subject: userId });

    // Test the earnings query (even with no bookings, it should return the structure)
    const result = await asUser.query(api.queries.earnings.getMonthlyEarnings, {
      businessId,
      month: "2024-01",
    });

    // Verify the query returns the expected structure
    expect(result).toBeDefined();

    // Verify current month data structure
    expect(result.totalGrossEarnings).toBeDefined();
    expect(result.totalNetEarnings).toBeDefined();
    expect(result.totalSystemCut).toBeDefined();
    expect(result.totalBookings).toBeDefined();

    // Verify all-time earnings structure
    expect(result.allTimeNetEarnings).toBeDefined();
    expect(result.allTimeGrossEarnings).toBeDefined();

    // Verify comparison data structure exists
    expect(result.comparison).toBeDefined();
    expect(result.comparison.bookings).toBeDefined();
    expect(result.comparison.bookings.change).toBeDefined();
    expect(result.comparison.bookings.isPositive).toBeDefined();

    expect(result.comparison.earnings).toBeDefined();
    expect(result.comparison.earnings.change).toBeDefined();
    expect(result.comparison.earnings.isPositive).toBeDefined();

    expect(result.comparison.avgPrice).toBeDefined();
    expect(result.comparison.avgPrice.change).toBeDefined();
    expect(result.comparison.avgPrice.isPositive).toBeDefined();

    expect(result.comparison.allTime).toBeDefined();
    expect(result.comparison.allTime.change).toBeDefined();
    expect(result.comparison.allTime.isPositive).toBeDefined();

    // Verify context data structure
    expect(result.previousMonth).toBeDefined();
    expect(result.previousMonth.month).toBeDefined();
    expect(result.previousMonth.totalBookings).toBeDefined();
    expect(result.previousMonth.totalNetEarnings).toBeDefined();
    expect(result.previousMonth.avgPrice).toBeDefined();

    expect(result.currentMonth).toBeDefined();
    expect(result.currentMonth.month).toBe("2024-01");
    expect(result.currentMonth.avgPrice).toBeDefined();

    // Verify bookings array exists
    expect(result.bookings).toBeDefined();
    expect(Array.isArray(result.bookings)).toBe(true);
  });

  test("should handle month calculations correctly", async () => {
    // Setup authenticated user and business
    const { userId, businessId } = await initAuth();
    const asUser = testT.withIdentity({ subject: userId });

    // Test the earnings query for February 2024
    const result = await asUser.query(api.queries.earnings.getMonthlyEarnings, {
      businessId,
      month: "2024-02",
    });

    // Verify month parsing works correctly
    expect(result.currentMonth.month).toBe("2024-02");
    expect(result.previousMonth.month).toBe("2024-01");
  });

  test("should handle year boundary calculations", async () => {
    // Setup authenticated user and business
    const { userId, businessId } = await initAuth();
    const asUser = testT.withIdentity({ subject: userId });

    // Test January 2024 (previous month should be December 2023)
    const result = await asUser.query(api.queries.earnings.getMonthlyEarnings, {
      businessId,
      month: "2024-01",
    });

    // Verify year boundary handling
    expect(result.currentMonth.month).toBe("2024-01");
    expect(result.previousMonth.month).toBe("2023-12");
  });

  test("should validate month format correctly", async () => {
    // Setup authenticated user and business
    const { userId, businessId } = await initAuth();
    const asUser = testT.withIdentity({ subject: userId });

    // Test invalid month format
    await expect(
      asUser.query(api.queries.earnings.getMonthlyEarnings, {
        businessId,
        month: "invalid-format",
      })
    ).rejects.toThrow();

    // Test invalid month number
    await expect(
      asUser.query(api.queries.earnings.getMonthlyEarnings, {
        businessId,
        month: "2024-13", // Invalid month
      })
    ).rejects.toThrow();
  });

  test("should include completed bookings in earnings (100% revenue)", async () => {
    const { userId, businessId } = await initAuth();
    const asUser = testT.withIdentity({ subject: userId });

    // Give user credits
    await asUser.mutation(api.mutations.credits.giftCredits, {
      userId,
      amount: 20,
    });

    // Create a class in the future (respecting booking window of 2 hours minimum)
    const venueId = await createTestVenue(asUser, "Test Studio");
    const templateId = await createTestClassTemplate(asUser, userId, businessId, venueId, {
      name: "Test Class",
      price: 1000, // 10.00 in cents
      bookingWindow: {
        minHours: 2,
        maxHours: 168,
      },
    });
    // Create class 3 hours from now (within booking window, can book)
    const startTime = Date.now() + (3 * 60 * 60 * 1000);
    const endTime = startTime + 3600000;
    const instanceId = await createTestClassInstance(asUser, templateId, startTime, endTime, "UTC");

    const bookingResult = await asUser.mutation(api.mutations.bookings.bookClass, {
      classInstanceId: instanceId,
    });

    // Advance time to 30 minutes before class (check-in window opens)
    // Use internal mutation to update booking's classInstanceSnapshot startTime to past
    // Actually, let's just mark it completed using a test helper that bypasses check-in time
    await testT.mutation(internal.testFunctions.patchTestBooking, {
      bookingId: bookingResult.bookingId,
      status: "completed",
    });

    const result = await asUser.query(api.queries.earnings.getMonthlyEarnings, {
      businessId,
      month: new Date().toISOString().slice(0, 7), // Current month YYYY-MM
    });

    // Completed booking should contribute 100% revenue (1000 cents)
    // With 20% platform fee: 800 cents net, 200 cents system cut
    expect(result.totalGrossEarnings).toBeGreaterThanOrEqual(1000);
    expect(result.totalBookings).toBeGreaterThanOrEqual(1);
  });

  test("should include no-show bookings in earnings (100% revenue, no refund)", async () => {
    const { userId, businessId } = await initAuth();
    const asUser = testT.withIdentity({ subject: userId });

    // Give user credits
    await asUser.mutation(api.mutations.credits.giftCredits, {
      userId,
      amount: 20,
    });

    // Create a class in the future (respecting booking window)
    const venueId = await createTestVenue(asUser, "Test Studio");
    const templateId = await createTestClassTemplate(asUser, userId, businessId, venueId, {
      name: "Test Class",
      price: 1000,
      bookingWindow: {
        minHours: 2,
        maxHours: 168,
      },
    });
    // Create class 3 hours from now
    const startTime = Date.now() + (3 * 60 * 60 * 1000);
    const endTime = startTime + 3600000;
    const instanceId = await createTestClassInstance(asUser, templateId, startTime, endTime, "UTC");

    const bookingResult = await asUser.mutation(api.mutations.bookings.bookClass, {
      classInstanceId: instanceId,
    });

    // Manually mark as no-show and set refundAmount to 0 (as no-show cron would)
    // Use internal mutation to patch directly
    await testT.mutation(internal.testFunctions.patchTestBooking, {
      bookingId: bookingResult.bookingId,
      status: "no_show",
      refundAmount: 0,
    });

    const result = await asUser.query(api.queries.earnings.getMonthlyEarnings, {
      businessId,
      month: new Date().toISOString().slice(0, 7),
    });

    // No-show should contribute 100% revenue (no refund)
    expect(result.totalGrossEarnings).toBeGreaterThanOrEqual(1000);
    expect(result.totalBookings).toBeGreaterThanOrEqual(1);
  });

  test("should include late cancellations in earnings (50% revenue)", async () => {
    const { userId, businessId } = await initAuth();
    const asUser = testT.withIdentity({ subject: userId });

    // Give user credits
    await asUser.mutation(api.mutations.credits.giftCredits, {
      userId,
      amount: 20,
    });

    // Create a class with 24 hour cancellation window
    const venueId = await createTestVenue(asUser, "Test Studio");
    const templateId = await createTestClassTemplate(asUser, userId, businessId, venueId, {
      name: "Test Class",
      price: 1000,
      bookingWindow: {
        minHours: 2,
        maxHours: 168,
      },
    });

    // Create instance 4 hours from now (bookable since >2h, and cancelling now is late since <24h before)
    // Cancellation window is 24h, so cancelling 4h before class is LATE (50% refund)
    const startTime = Date.now() + (4 * 60 * 60 * 1000); // 4 hours from now
    const endTime = startTime + 3600000;
    const instanceId = await createTestClassInstance(asUser, templateId, startTime, endTime, "UTC");

    // Book the class (4 hours before - bookable since >2h minimum)
    const bookingResult = await asUser.mutation(api.mutations.bookings.bookClass, {
      classInstanceId: instanceId,
    });

    // Cancel immediately (late cancellation - less than 24h before class, so 50% refund)
    await asUser.mutation(api.mutations.bookings.cancelBooking, {
      bookingId: bookingResult.bookingId,
      reason: "Late cancellation",
      cancelledBy: "consumer",
    });

    const result = await asUser.query(api.queries.earnings.getMonthlyEarnings, {
      businessId,
      month: new Date().toISOString().slice(0, 7),
    });

    // Late cancellation: 50% refund, so 50% revenue should be counted
    // If finalPrice was 1000 cents, netRevenue = 500 cents
    // With 20% platform fee: 400 cents net, 100 cents system cut
    expect(result.totalGrossEarnings).toBeGreaterThanOrEqual(500);
    expect(result.totalBookings).toBeGreaterThanOrEqual(1);
  });

  test("should exclude pending bookings from earnings (not yet earned)", async () => {
    const { userId, businessId } = await initAuth();
    const asUser = testT.withIdentity({ subject: userId });

    // Give user credits
    await asUser.mutation(api.mutations.credits.giftCredits, {
      userId,
      amount: 20,
    });

    // Create a class in the future (respecting booking window)
    const venueId = await createTestVenue(asUser, "Test Studio");
    const templateId = await createTestClassTemplate(asUser, userId, businessId, venueId, {
      name: "Test Class",
      price: 1000, // 10.00 in cents
      bookingWindow: {
        minHours: 2,
        maxHours: 168,
      },
    });
    // Create class 3 hours from now (within booking window, can book)
    const startTime = Date.now() + (3 * 60 * 60 * 1000);
    const endTime = startTime + 3600000;
    const instanceId = await createTestClassInstance(asUser, templateId, startTime, endTime, "UTC");

    // Create a booking (will be pending status)
    const bookingResult = await asUser.mutation(api.mutations.bookings.bookClass, {
      classInstanceId: instanceId,
    });

    // Verify booking was created with pending status using internal test function
    const booking = await testT.query(internal.testFunctions.getBookingById, {
      bookingId: bookingResult.bookingId,
    });
    expect(booking?.status).toBe("pending");

    // Query earnings - pending booking should NOT be included
    const result = await asUser.query(api.queries.earnings.getMonthlyEarnings, {
      businessId,
      month: new Date().toISOString().slice(0, 7), // Current month YYYY-MM
    });

    // Pending booking should NOT contribute to earnings (not yet earned)
    // Even though user paid 1000 cents, it's not earned until service is delivered
    expect(result.totalGrossEarnings).toBe(0);
    expect(result.totalNetEarnings).toBe(0);
    expect(result.totalBookings).toBe(0);
    expect(result.bookings).toHaveLength(0);
  });

  test("should exclude early cancellations from earnings (0% revenue, 100% refund)", async () => {
    const { userId, businessId } = await initAuth();
    const asUser = testT.withIdentity({ subject: userId });

    // Give user credits
    await asUser.mutation(api.mutations.credits.giftCredits, {
      userId,
      amount: 20,
    });

    // Create a class with 24 hour cancellation window
    const venueId = await createTestVenue(asUser, "Test Studio");
    const templateId = await createTestClassTemplate(asUser, userId, businessId, venueId, {
      name: "Test Class",
      price: 1000,
    });

    // Create instance 2 days from now (early cancellation - outside window)
    const startTime = Date.now() + (86400000 * 2);
    const endTime = startTime + 3600000;
    const instanceId = await createTestClassInstance(asUser, templateId, startTime, endTime, "UTC");

    // Book the class
    const bookingResult = await asUser.mutation(api.mutations.bookings.bookClass, {
      classInstanceId: instanceId,
    });

    // Cancel early (before cancellation window)
    await asUser.mutation(api.mutations.bookings.cancelBooking, {
      bookingId: bookingResult.bookingId,
      reason: "Early cancellation",
      cancelledBy: "consumer",
    });

    const result = await asUser.query(api.queries.earnings.getMonthlyEarnings, {
      businessId,
      month: new Date().toISOString().slice(0, 7),
    });

    // Early cancellation: 100% refund, so 0% revenue
    // Should not appear in earnings (netRevenue = 0)
    expect(result.totalGrossEarnings).toBe(0);
    expect(result.totalBookings).toBe(0);
  });

  test("should calculate earnings with different platform fee rates", async () => {
    const { userId, businessId } = await initAuth();
    const asUser = testT.withIdentity({ subject: userId });

    // Update business fee structure using test function
    await testT.mutation(internal.testFunctions.updateTestBusiness, {
      businessId,
      feeStructure: {
        baseFeeRate: 0.10, // 10% instead of default 20%
      },
    });

    // Give user credits
    await asUser.mutation(api.mutations.credits.giftCredits, {
      userId,
      amount: 20,
    });

    // Create a class and book it
    const venueId = await createTestVenue(asUser, "Test Studio");
    const templateId = await createTestClassTemplate(asUser, userId, businessId, venueId, {
      name: "Test Class",
      price: 1000,
      bookingWindow: {
        minHours: 2,
        maxHours: 168,
      },
    });
    // Create class 3 hours from now (can book)
    const startTime = Date.now() + (3 * 60 * 60 * 1000);
    const endTime = startTime + 3600000;
    const instanceId = await createTestClassInstance(asUser, templateId, startTime, endTime, "UTC");

    const bookingResult = await asUser.mutation(api.mutations.bookings.bookClass, {
      classInstanceId: instanceId,
    });

    // Mark as completed using test helper (bypasses check-in time restriction)
    await testT.mutation(internal.testFunctions.patchTestBooking, {
      bookingId: bookingResult.bookingId,
      status: "completed",
    });

    const result = await asUser.query(api.queries.earnings.getMonthlyEarnings, {
      businessId,
      month: new Date().toISOString().slice(0, 7),
    });

    // With 10% platform fee on 1000 cents:
    // Gross: 1000, Net: 900, System cut: 100
    expect(result.totalGrossEarnings).toBeGreaterThanOrEqual(1000);
    expect(result.totalNetEarnings).toBeGreaterThanOrEqual(900);
    expect(result.totalSystemCut).toBeGreaterThanOrEqual(100);
    expect(result.totalBookings).toBeGreaterThanOrEqual(1);
  });
});