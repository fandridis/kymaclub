import type { Doc } from "../convex/_generated/dataModel";
import { ConvexError } from "convex/values";
import { ERROR_CODES } from "../utils/errorCodes";
import { BOOKING_LIMITS } from "../utils/constants";

export const canBookClass = (
  instance: Doc<"classInstances">,
  template: Doc<"classTemplates">,
  currentTime: number = Date.now()
): boolean => {
  const hoursUntilClass = (instance.startTime - currentTime) / (1000 * 60 * 60);

  // Mock booking window rules (e.g., can't book within 1 hour of class)
  const minAdvanceHours = 1;
  const maxAdvanceHours = 168; // 7 days

  if (hoursUntilClass < minAdvanceHours) {
    return false;
  }

  if (hoursUntilClass > maxAdvanceHours) {
    return false;
  }

  return true;
};

export const canCancelBooking = (
  instance: Doc<"classInstances">,
  template: Doc<"classTemplates">,
  currentTime: number = Date.now()
): { canCancel: boolean; refundPercentage: number } => {

  const hoursUntilClass = (instance.startTime - currentTime) / (1000 * 60 * 60);
  const cancellationWindowHours = template.cancellationWindowHours;


  if (hoursUntilClass <= 0) {
    return { canCancel: false, refundPercentage: 0 };
  }

  if (hoursUntilClass >= cancellationWindowHours) {
    return { canCancel: true, refundPercentage: 1.0 };
  } else {
    return { canCancel: true, refundPercentage: 0.5 };
  }
};

/**
 * Counts the number of active bookings for a user
 * 
 * Active bookings are defined as:
 * - status = "pending" OR "awaiting_approval" (not cancelled, completed, rejected, or no_show)
 * - classInstanceSnapshot.startTime > current time (future classes only)
 * - deleted != true (not soft deleted)
 * 
 * @param bookings - Array of user's bookings to filter
 * @param currentTime - Current timestamp for filtering future bookings (defaults to Date.now())
 * @returns The count of active bookings
 * 
 * @example
 * ```typescript
 * const activeCount = countActiveBookings(userBookings);
 * if (activeCount >= BOOKING_LIMITS.MAX_ACTIVE_BOOKINGS_PER_USER) {
 *   throw new ConvexError({
 *     message: `You can only have ${BOOKING_LIMITS.MAX_ACTIVE_BOOKINGS_PER_USER} active bookings`,
 *     code: ERROR_CODES.MAX_ACTIVE_BOOKINGS_EXCEEDED
 *   });
 * }
 * ```
 */
export function countActiveBookings(
  bookings: Doc<"bookings">[],
  currentTime: number = Date.now()
): number {
  return bookings.filter(booking => {
    // Must be pending or awaiting_approval status
    if (booking.status !== "pending" && booking.status !== "awaiting_approval") return false;

    // Must not be deleted
    if (booking.deleted === true) return false;

    // Must have future start time
    const startTime = booking.classInstanceSnapshot?.startTime;
    return startTime && startTime > currentTime;
  }).length;
}

/**
 * Validates that a user hasn't exceeded the maximum active bookings limit
 * 
 * Throws ConvexError if the user already has the maximum number of active bookings
 * 
 * @param bookings - Array of user's bookings to check
 * @param currentTime - Current timestamp for filtering (defaults to Date.now())
 * @param excludeBookingId - Optional booking ID to exclude from count (for updates)
 * @throws ConvexError with MAX_ACTIVE_BOOKINGS_EXCEEDED code if limit exceeded
 * 
 * @example
 * ```typescript
 * // Validate before creating a new booking
 * validateActiveBookingsLimit(userBookings);
 * ```
 */
export function validateActiveBookingsLimit(
  bookings: Doc<"bookings">[],
  currentTime: number = Date.now(),
  excludeBookingId?: string
): void {
  // Filter out the excluded booking if specified
  const filteredBookings = excludeBookingId
    ? bookings.filter(b => b._id !== excludeBookingId)
    : bookings;

  const activeCount = countActiveBookings(filteredBookings, currentTime);

  if (activeCount >= BOOKING_LIMITS.MAX_ACTIVE_BOOKINGS_PER_USER) {
    throw new ConvexError({
      message: `You can only have ${BOOKING_LIMITS.MAX_ACTIVE_BOOKINGS_PER_USER} active bookings at the same time. Please cancel an existing booking before booking a new class.`,
      field: "activeBookingsLimit",
      code: ERROR_CODES.MAX_ACTIVE_BOOKINGS_EXCEEDED
    });
  }
}

/**
 * Gets active bookings details for a user (for UX display)
 * 
 * Returns the actual active bookings with minimal information needed for display
 * 
 * @param bookings - Array of user's bookings to filter
 * @param currentTime - Current timestamp for filtering (defaults to Date.now())
 * @returns Array of active booking summaries
 * 
 * @example
 * ```typescript
 * const activeBookings = getActiveBookingsDetails(userBookings);
 * ```
 */
export interface ActiveBookingSummary {
  bookingId: string;
  className: string;
  startTime: number;
  venueName: string;
}

export function getActiveBookingsDetails(
  bookings: Doc<"bookings">[],
  currentTime: number = Date.now()
): ActiveBookingSummary[] {
  return bookings
    .filter(booking => {
      // Same filter logic as countActiveBookings
      if (booking.status !== "pending" && booking.status !== "awaiting_approval") return false;
      if (booking.deleted === true) return false;

      const startTime = booking.classInstanceSnapshot?.startTime;
      return startTime && startTime > currentTime;
    })
    .map(booking => ({
      bookingId: booking._id,
      className: booking.classInstanceSnapshot?.name || "Unknown Class",
      startTime: booking.classInstanceSnapshot?.startTime || 0,
      venueName: booking.venueSnapshot?.name || "Unknown Venue"
    }))
    .sort((a, b) => a.startTime - b.startTime); // Sort by start time (earliest first)
}

export const bookingRules = {
  canBookClass,
  canCancelBooking,
  countActiveBookings,
  validateActiveBookingsLimit,
  getActiveBookingsDetails,
};
