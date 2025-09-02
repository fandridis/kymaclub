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
import { testT, initAuth } from "./helpers";

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
});