/**
 * System constants and configurable limits
 * 
 * Usage:
 * ```typescript
 * import { BOOKING_LIMITS } from "../utils/constants";
 * 
 * if (activeBookingsCount >= BOOKING_LIMITS.MAX_ACTIVE_BOOKINGS_PER_USER) {
 *   // Handle limit exceeded
 * }
 * ```
 */

export const BOOKING_LIMITS = {
  /**
   * Maximum number of active (pending) bookings a consumer can have simultaneously
   * 
   * Active bookings are those with:
   * - status: "pending" 
   * - classInstanceSnapshot.startTime > current time (future classes)
   * - not deleted
   * 
   * This prevents consumers from overbooking and reduces book/cancel churn
   * Business rule: BL-001 - Maximum Active Bookings Limit
   */
  MAX_ACTIVE_BOOKINGS_PER_USER: 5,
} as const;

export const CREDIT_LIMITS = {
  /**
   * Credit to cents conversion rate
   * 1 credit = 100 cents spending value (1 credit = 1 euro)
   */
  CENTS_PER_CREDIT: 100,
} as const;
