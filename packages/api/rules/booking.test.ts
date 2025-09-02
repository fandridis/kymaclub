/**
 * Unit tests for booking business rules
 * 
 * Tests Business Rule BL-001: Maximum Active Bookings Limit
 * - Pure function tests without context mocking
 * - All business logic validation with real data structures
 */

import { describe, test, expect } from "vitest";
import { ConvexError } from "convex/values";
import {
  countActiveBookings,
  validateActiveBookingsLimit,
  getActiveBookingsDetails,
} from "./booking";
import { ERROR_CODES } from "../utils/errorCodes";
import { BOOKING_LIMITS } from "../utils/constants";
import type { Doc } from "../convex/_generated/dataModel";

// Helper to create mock booking objects
const createMockBooking = (overrides: Partial<Doc<"bookings">> = {}): Doc<"bookings"> => ({
  _id: "booking123" as any,
  _creationTime: Date.now(),
  businessId: "business123" as any,
  userId: "user123" as any,
  classInstanceId: "class123" as any,
  status: "pending",
  originalPrice: 2000,
  finalPrice: 2000,
  creditsUsed: 40,
  creditTransactionId: "txn123",
  userSnapshot: {
    name: "Test User",
    email: "test@example.com"
  },
  classInstanceSnapshot: {
    startTime: Date.now() + 86400000, // 24 hours in future
    endTime: Date.now() + 90000000,   // 25 hours in future
    name: "Test Class",
    status: "scheduled",
    instructor: "Test Instructor",
    cancellationWindowHours: 24
  },
  venueSnapshot: {
    name: "Test Venue"
  },
  bookedAt: Date.now(),
  createdAt: Date.now(),
  createdBy: "user123" as any,
  deleted: false,
  ...overrides
});

describe("Booking Rules", () => {
  describe("countActiveBookings", () => {
    test("should count only pending bookings with future start times", () => {
      const futureTime = Date.now() + 86400000; // 24 hours in future
      const pastTime = Date.now() - 86400000;   // 24 hours in past
      const currentTime = Date.now();

      const bookings: Doc<"bookings">[] = [
        createMockBooking({
          status: "pending",
          classInstanceSnapshot: {
            ...createMockBooking().classInstanceSnapshot!,
            startTime: futureTime
          }
        }), // Count
        createMockBooking({
          status: "pending",
          classInstanceSnapshot: {
            ...createMockBooking().classInstanceSnapshot!,
            startTime: pastTime
          }
        }),   // Skip - past
        createMockBooking({
          status: "completed",
          classInstanceSnapshot: {
            ...createMockBooking().classInstanceSnapshot!,
            startTime: futureTime
          }
        }), // Skip - completed
        createMockBooking({
          status: "cancelled_by_consumer",
          classInstanceSnapshot: {
            ...createMockBooking().classInstanceSnapshot!,
            startTime: futureTime
          }
        }), // Skip - cancelled
        createMockBooking({
          status: "pending",
          deleted: true,
          classInstanceSnapshot: {
            ...createMockBooking().classInstanceSnapshot!,
            startTime: futureTime
          }
        }), // Skip - deleted
        createMockBooking({
          status: "pending",
          classInstanceSnapshot: {
            ...createMockBooking().classInstanceSnapshot!,
            startTime: futureTime
          }
        }), // Count
      ];

      const count = countActiveBookings(bookings, currentTime);
      expect(count).toBe(2); // Only 2 pending future bookings
    });

    test("should return 0 for empty bookings array", () => {
      const count = countActiveBookings([]);
      expect(count).toBe(0);
    });

    test("should return 0 when all bookings are in the past", () => {
      const pastTime = Date.now() - 86400000;
      const bookings = [
        createMockBooking({
          status: "pending",
          classInstanceSnapshot: {
            ...createMockBooking().classInstanceSnapshot!,
            startTime: pastTime
          }
        }),
        createMockBooking({
          status: "pending",
          classInstanceSnapshot: {
            ...createMockBooking().classInstanceSnapshot!,
            startTime: pastTime
          }
        }),
      ];

      const count = countActiveBookings(bookings);
      expect(count).toBe(0);
    });

    test("should handle bookings without classInstanceSnapshot", () => {
      const bookings = [
        createMockBooking({ status: "pending", classInstanceSnapshot: null as any }),
        createMockBooking({ status: "pending", classInstanceSnapshot: undefined as any }),
        { ...createMockBooking({ status: "pending" }), classInstanceSnapshot: undefined }, // Missing classInstanceSnapshot
      ];

      const count = countActiveBookings(bookings);
      expect(count).toBe(0); // None should count without valid startTime
    });

    test("should use provided current time correctly", () => {
      const customCurrentTime = Date.now() - 1000000; // 16+ minutes ago
      const bookingTime = customCurrentTime + 500000;  // 8+ minutes after custom current time

      const bookings = [
        createMockBooking({
          status: "pending",
          classInstanceSnapshot: {
            ...createMockBooking().classInstanceSnapshot!,
            startTime: bookingTime
          }
        })
      ];

      // Should count as active with custom current time
      const count1 = countActiveBookings(bookings, customCurrentTime);
      expect(count1).toBe(1);

      // Should not count as active with real current time (booking is in past)
      const count2 = countActiveBookings(bookings, Date.now());
      expect(count2).toBe(0);
    });
  });

  describe("validateActiveBookingsLimit", () => {
    test("should pass validation when under limit", () => {
      // Create 4 active bookings (under limit of 5)
      const futureTime = Date.now() + 86400000;
      const bookings = Array.from({ length: 4 }, () =>
        createMockBooking({
          status: "pending",
          classInstanceSnapshot: {
            ...createMockBooking().classInstanceSnapshot!,
            startTime: futureTime
          }
        })
      );

      // Should not throw
      expect(() => validateActiveBookingsLimit(bookings)).not.toThrow();
    });

    test("should throw error when at the limit", () => {
      // Create exactly 5 active bookings (at limit - should prevent new booking)
      const futureTime = Date.now() + 86400000;
      const bookings = Array.from({ length: 5 }, () =>
        createMockBooking({
          status: "pending",
          classInstanceSnapshot: {
            ...createMockBooking().classInstanceSnapshot!,
            startTime: futureTime
          }
        })
      );

      // Should throw when at limit because user is trying to create another booking
      expect(() => validateActiveBookingsLimit(bookings)).toThrow(ConvexError);
      try {
        validateActiveBookingsLimit(bookings);
      } catch (error: any) {
        expect(error.data.code).toBe(ERROR_CODES.MAX_ACTIVE_BOOKINGS_EXCEEDED);
        expect(error.data.message).toContain("You can only have 5 active bookings");
        expect(error.data.field).toBe("activeBookingsLimit");
      }
    });

    test("should throw error when exceeding limit", () => {
      // Create 6 active bookings (exceeding limit of 5)
      const futureTime = Date.now() + 86400000;
      const bookings = Array.from({ length: 6 }, () =>
        createMockBooking({
          status: "pending",
          classInstanceSnapshot: {
            ...createMockBooking().classInstanceSnapshot!,
            startTime: futureTime
          }
        })
      );

      expect(() => validateActiveBookingsLimit(bookings)).toThrow(ConvexError);

      try {
        validateActiveBookingsLimit(bookings);
      } catch (error: any) {
        expect(error.data.code).toBe(ERROR_CODES.MAX_ACTIVE_BOOKINGS_EXCEEDED);
        expect(error.data.message).toContain("You can only have 5 active bookings");
        expect(error.data.field).toBe("activeBookingsLimit");
      }
    });

    test("should handle excludeBookingId parameter correctly", () => {
      // Create 5 active bookings (at limit)
      const futureTime = Date.now() + 86400000;
      const bookings = Array.from({ length: 5 }, (_, i) =>
        createMockBooking({
          _id: `booking${i}` as any,
          status: "pending",
          classInstanceSnapshot: {
            ...createMockBooking().classInstanceSnapshot!,
            startTime: futureTime
          }
        })
      );

      // Should pass when excluding one of the existing bookings (for updates)
      expect(() => validateActiveBookingsLimit(bookings, Date.now(), "booking0")).not.toThrow();

      // Should throw when not excluding any booking
      expect(() => validateActiveBookingsLimit(bookings)).toThrow(ConvexError);
    });

    test("should use current limit from constants", () => {
      // Create bookings equal to current limit + 1
      const futureTime = Date.now() + 86400000;
      const bookings = Array.from({ length: BOOKING_LIMITS.MAX_ACTIVE_BOOKINGS_PER_USER + 1 }, () =>
        createMockBooking({
          status: "pending",
          classInstanceSnapshot: {
            ...createMockBooking().classInstanceSnapshot!,
            startTime: futureTime
          }
        })
      );

      expect(() => validateActiveBookingsLimit(bookings)).toThrow(ConvexError);
    });

    test("should not count non-active bookings towards limit", () => {
      const futureTime = Date.now() + 86400000;
      const pastTime = Date.now() - 86400000;

      // Mix of active and non-active bookings totaling > 5
      const bookings = [
        // 3 active bookings
        ...Array.from({ length: 3 }, () =>
          createMockBooking({
            status: "pending",
            classInstanceSnapshot: {
              ...createMockBooking().classInstanceSnapshot!,
              startTime: futureTime
            }
          })
        ),
        // 3 past bookings (shouldn't count)
        ...Array.from({ length: 3 }, () =>
          createMockBooking({
            status: "pending",
            classInstanceSnapshot: {
              ...createMockBooking().classInstanceSnapshot!,
              startTime: pastTime
            }
          })
        ),
        // 2 cancelled future bookings (shouldn't count)
        ...Array.from({ length: 2 }, () =>
          createMockBooking({
            status: "cancelled_by_consumer",
            classInstanceSnapshot: {
              ...createMockBooking().classInstanceSnapshot!,
              startTime: futureTime
            }
          })
        ),
      ];

      // Should pass because only 3 are actually active
      expect(() => validateActiveBookingsLimit(bookings)).not.toThrow();
    });
  });

  describe("getActiveBookingsDetails", () => {
    test("should return active bookings with correct summary format", () => {
      const futureTime1 = Date.now() + 86400000;  // 24 hours
      const futureTime2 = Date.now() + 172800000; // 48 hours

      const bookings = [
        createMockBooking({
          _id: "booking1" as any,
          status: "pending",
          classInstanceSnapshot: {
            ...createMockBooking().classInstanceSnapshot!,
            startTime: futureTime2, // Later class
            name: "Advanced Yoga"
          },
          venueSnapshot: { name: "Studio A" }
        }),
        createMockBooking({
          _id: "booking2" as any,
          status: "pending",
          classInstanceSnapshot: {
            ...createMockBooking().classInstanceSnapshot!,
            startTime: futureTime1, // Earlier class
            name: "Beginner Yoga"
          },
          venueSnapshot: { name: "Studio B" }
        }),
        createMockBooking({
          status: "completed",
          classInstanceSnapshot: {
            ...createMockBooking().classInstanceSnapshot!,
            startTime: futureTime1
          }
        }), // Should be filtered out
      ];

      const result = getActiveBookingsDetails(bookings);

      expect(result).toHaveLength(2);

      // Should be sorted by start time (earliest first)
      expect(result[0]).toEqual({
        bookingId: "booking2",
        className: "Beginner Yoga",
        startTime: futureTime1,
        venueName: "Studio B"
      });

      expect(result[1]).toEqual({
        bookingId: "booking1",
        className: "Advanced Yoga",
        startTime: futureTime2,
        venueName: "Studio A"
      });
    });

    test("should handle missing snapshot data gracefully", () => {
      const futureTime = Date.now() + 86400000;

      const bookings = [
        createMockBooking({
          _id: "booking1" as any,
          status: "pending",
          classInstanceSnapshot: {
            ...createMockBooking().classInstanceSnapshot!,
            startTime: futureTime,
            name: undefined // Missing name
          },
          venueSnapshot: null as any // Missing venue
        }),
        createMockBooking({
          _id: "booking2" as any,
          status: "pending",
          classInstanceSnapshot: {
            ...createMockBooking().classInstanceSnapshot!,
            startTime: futureTime
          },
          // Not overriding venueSnapshot
        }),
      ];

      const result = getActiveBookingsDetails(bookings);

      expect(result).toHaveLength(2);
      expect(result[0].className).toBe("Unknown Class");
      expect(result[0].venueName).toBe("Unknown Venue");
      expect(result[1].venueName).toBe("Test Venue");
    });

    test("should return empty array when no active bookings", () => {
      const pastTime = Date.now() - 86400000;

      const bookings = [
        createMockBooking({
          status: "completed",
          classInstanceSnapshot: {
            ...createMockBooking().classInstanceSnapshot!,
            startTime: pastTime
          }
        }),
        createMockBooking({
          status: "cancelled_by_consumer",
          classInstanceSnapshot: {
            ...createMockBooking().classInstanceSnapshot!,
            startTime: pastTime
          }
        }),
      ];

      const result = getActiveBookingsDetails(bookings);
      expect(result).toEqual([]);
    });

    test("should sort bookings by start time ascending", () => {
      const time1 = Date.now() + 86400000;  // 1 day
      const time2 = Date.now() + 172800000; // 2 days
      const time3 = Date.now() + 259200000; // 3 days

      // Create bookings in random order
      const bookings = [
        createMockBooking({
          _id: "booking3" as any,
          status: "pending",
          classInstanceSnapshot: {
            ...createMockBooking().classInstanceSnapshot!,
            startTime: time3,
            name: "Class 3"
          }
        }),
        createMockBooking({
          _id: "booking1" as any,
          status: "pending",
          classInstanceSnapshot: {
            ...createMockBooking().classInstanceSnapshot!,
            startTime: time1,
            name: "Class 1"
          }
        }),
        createMockBooking({
          _id: "booking2" as any,
          status: "pending",
          classInstanceSnapshot: {
            ...createMockBooking().classInstanceSnapshot!,
            startTime: time2,
            name: "Class 2"
          }
        }),
      ];

      const result = getActiveBookingsDetails(bookings);

      expect(result).toHaveLength(3);
      expect(result[0].className).toBe("Class 1");
      expect(result[1].className).toBe("Class 2");
      expect(result[2].className).toBe("Class 3");

      // Verify times are in ascending order
      expect(result[0].startTime).toBeLessThan(result[1].startTime);
      expect(result[1].startTime).toBeLessThan(result[2].startTime);
    });
  });

  describe("Edge cases and business logic", () => {
    test("should handle very large numbers of bookings efficiently", () => {
      const futureTime = Date.now() + 86400000;

      // Create 100 bookings to test performance
      const bookings = Array.from({ length: 100 }, (_, i) =>
        createMockBooking({
          _id: `booking${i}` as any,
          status: "pending",
          classInstanceSnapshot: {
            ...createMockBooking().classInstanceSnapshot!,
            startTime: futureTime
          }
        })
      );

      const startTime = Date.now();
      const count = countActiveBookings(bookings);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(100); // Should be fast
      expect(count).toBe(100);
    });

    test("should handle mixed booking statuses correctly", () => {
      const futureTime = Date.now() + 86400000;
      const statuses = ["pending", "completed", "cancelled_by_consumer", "cancelled_by_business", "no_show"] as const;

      const bookings = statuses.map(status =>
        createMockBooking({
          status,
          classInstanceSnapshot: {
            ...createMockBooking().classInstanceSnapshot!,
            startTime: futureTime
          }
        })
      );

      const count = countActiveBookings(bookings);
      expect(count).toBe(1); // Only "pending" should count
    });

    test("should handle bookings at exact time boundaries", () => {
      const currentTime = Date.now();
      const exactTime = currentTime; // Exactly now
      const slightlyFuture = currentTime + 1; // 1ms in future
      const slightlyPast = currentTime - 1; // 1ms in past

      const bookings = [
        createMockBooking({
          status: "pending",
          classInstanceSnapshot: {
            ...createMockBooking().classInstanceSnapshot!,
            startTime: exactTime
          }
        }),
        createMockBooking({
          status: "pending",
          classInstanceSnapshot: {
            ...createMockBooking().classInstanceSnapshot!,
            startTime: slightlyFuture
          }
        }),
        createMockBooking({
          status: "pending",
          classInstanceSnapshot: {
            ...createMockBooking().classInstanceSnapshot!,
            startTime: slightlyPast
          }
        }),
      ];

      const count = countActiveBookings(bookings, currentTime);
      expect(count).toBe(1); // Only the slightly future one should count
    });
  });

  describe("Integration with constants", () => {
    test("should use MAX_ACTIVE_BOOKINGS_PER_USER from constants", () => {
      // Verify the constant is properly exported and has expected value
      expect(BOOKING_LIMITS.MAX_ACTIVE_BOOKINGS_PER_USER).toBe(5);
      expect(typeof BOOKING_LIMITS.MAX_ACTIVE_BOOKINGS_PER_USER).toBe("number");
    });

    test("should use correct error code from errorCodes", () => {
      expect(ERROR_CODES.MAX_ACTIVE_BOOKINGS_EXCEEDED).toBe("MAX_ACTIVE_BOOKINGS_EXCEEDED");
      expect(typeof ERROR_CODES.MAX_ACTIVE_BOOKINGS_EXCEEDED).toBe("string");
    });

    test("should validate with current system limit", () => {
      const futureTime = Date.now() + 86400000;

      // Create one more than the current limit
      const bookings = Array.from({ length: BOOKING_LIMITS.MAX_ACTIVE_BOOKINGS_PER_USER + 1 }, () =>
        createMockBooking({
          status: "pending",
          classInstanceSnapshot: {
            ...createMockBooking().classInstanceSnapshot!,
            startTime: futureTime
          }
        })
      );

      expect(() => validateActiveBookingsLimit(bookings)).toThrow();

      try {
        validateActiveBookingsLimit(bookings);
      } catch (error: any) {
        expect(error.data.message).toContain(`${BOOKING_LIMITS.MAX_ACTIVE_BOOKINGS_PER_USER}`);
      }
    });
  });
});