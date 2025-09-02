/**
 * Unit tests for earnings calculation helper functions
 * 
 * Tests the percentage change and average price calculation functions
 * including edge cases like division by zero
 */

import { describe, test, expect } from "vitest";

// Helper functions extracted for testing (normally these would be in the query file)
function calculatePercentageChange(current: number, previous: number): {
  change: number;
  isPositive: boolean;
} {
  // Handle edge cases
  if (previous === 0) {
    if (current === 0) {
      return { change: 0, isPositive: true };
    }
    // If previous is 0 but current has value, it's a 100% increase
    return { change: 100, isPositive: true };
  }
  
  const percentageChange = ((current - previous) / previous) * 100;
  return {
    change: Math.round(percentageChange * 10) / 10, // Round to 1 decimal place
    isPositive: percentageChange >= 0
  };
}

function calculateAveragePrice(totalEarnings: number, totalBookings: number): number {
  return totalBookings > 0 ? Math.round(totalEarnings / totalBookings) : 0;
}

describe("Earnings Helper Functions", () => {
  describe("calculatePercentageChange", () => {
    test("should calculate positive percentage change correctly", () => {
      const result = calculatePercentageChange(120, 100);
      expect(result.change).toBe(20);
      expect(result.isPositive).toBe(true);
    });

    test("should calculate negative percentage change correctly", () => {
      const result = calculatePercentageChange(80, 100);
      expect(result.change).toBe(-20);
      expect(result.isPositive).toBe(false);
    });

    test("should handle zero current value", () => {
      const result = calculatePercentageChange(0, 100);
      expect(result.change).toBe(-100);
      expect(result.isPositive).toBe(false);
    });

    test("should handle zero previous value with current value", () => {
      const result = calculatePercentageChange(100, 0);
      expect(result.change).toBe(100);
      expect(result.isPositive).toBe(true);
    });

    test("should handle both values being zero", () => {
      const result = calculatePercentageChange(0, 0);
      expect(result.change).toBe(0);
      expect(result.isPositive).toBe(true);
    });

    test("should round to 1 decimal place", () => {
      const result = calculatePercentageChange(333, 300); // 11% increase
      expect(result.change).toBe(11.0);
      expect(result.isPositive).toBe(true);
    });

    test("should handle floating point precision", () => {
      const result = calculatePercentageChange(1003, 1000); // 0.3% increase
      expect(result.change).toBe(0.3);
      expect(result.isPositive).toBe(true);
    });
  });

  describe("calculateAveragePrice", () => {
    test("should calculate average price correctly", () => {
      const result = calculateAveragePrice(10000, 5); // 2000 cents average
      expect(result).toBe(2000);
    });

    test("should handle zero bookings", () => {
      const result = calculateAveragePrice(10000, 0);
      expect(result).toBe(0);
    });

    test("should handle zero earnings", () => {
      const result = calculateAveragePrice(0, 5);
      expect(result).toBe(0);
    });

    test("should handle both zero values", () => {
      const result = calculateAveragePrice(0, 0);
      expect(result).toBe(0);
    });

    test("should round the result", () => {
      const result = calculateAveragePrice(1001, 3); // 333.67 -> 334
      expect(result).toBe(334);
    });
  });

  describe("Business logic scenarios", () => {
    test("should handle typical month-over-month increase", () => {
      // Current month: 5 bookings, 8000 cents net earnings
      // Previous month: 3 bookings, 6000 cents net earnings
      const bookingChange = calculatePercentageChange(5, 3);
      const earningsChange = calculatePercentageChange(8000, 6000);
      const currentAvg = calculateAveragePrice(8000, 5);
      const previousAvg = calculateAveragePrice(6000, 3);
      const avgPriceChange = calculatePercentageChange(currentAvg, previousAvg);

      expect(bookingChange.change).toBe(66.7); // ~67% increase
      expect(bookingChange.isPositive).toBe(true);
      
      expect(earningsChange.change).toBe(33.3); // ~33% increase
      expect(earningsChange.isPositive).toBe(true);
      
      expect(currentAvg).toBe(1600); // 8000/5 = 1600 cents
      expect(previousAvg).toBe(2000); // 6000/3 = 2000 cents
      expect(avgPriceChange.change).toBe(-20); // Average price decreased
      expect(avgPriceChange.isPositive).toBe(false);
    });

    test("should handle new business scenario (no previous data)", () => {
      // First month of business: 2 bookings, 3000 cents net earnings
      // No previous month data
      const bookingChange = calculatePercentageChange(2, 0);
      const earningsChange = calculatePercentageChange(3000, 0);
      const avgPriceChange = calculatePercentageChange(1500, 0);

      expect(bookingChange.change).toBe(100);
      expect(bookingChange.isPositive).toBe(true);
      
      expect(earningsChange.change).toBe(100);
      expect(earningsChange.isPositive).toBe(true);
      
      expect(avgPriceChange.change).toBe(100);
      expect(avgPriceChange.isPositive).toBe(true);
    });

    test("should handle slow month scenario", () => {
      // Current month: 1 booking, 1500 cents net earnings
      // Previous month: 4 bookings, 8000 cents net earnings
      const bookingChange = calculatePercentageChange(1, 4);
      const earningsChange = calculatePercentageChange(1500, 8000);
      const currentAvg = calculateAveragePrice(1500, 1);
      const previousAvg = calculateAveragePrice(8000, 4);
      const avgPriceChange = calculatePercentageChange(currentAvg, previousAvg);

      expect(bookingChange.change).toBe(-75); // 75% decrease
      expect(bookingChange.isPositive).toBe(false);
      
      expect(earningsChange.change).toBe(-81.2); // ~81% decrease
      expect(earningsChange.isPositive).toBe(false);
      
      expect(currentAvg).toBe(1500);
      expect(previousAvg).toBe(2000);
      expect(avgPriceChange.change).toBe(-25); // Average price decreased
      expect(avgPriceChange.isPositive).toBe(false);
    });
  });
});