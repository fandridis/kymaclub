/**
 * Booking utility functions for calculating prices, earnings, and filtering bookings
 * 
 * All monetary values are in cents for consistency with the database schema.
 * Use conversion functions from credits.ts to display in euros or credits.
 */

/**
 * Booking interface for utility functions
 * Matches the structure used in earnings queries
 */
export interface BookingForCalculation {
    /** Final price paid for the booking (in cents) */
    finalPrice: number;
    /** Refund amount (in cents, 0 if no refund, undefined if not yet processed) */
    refundAmount?: number;
    /** Platform fee rate (0.0 to 1.0, e.g., 0.20 = 20%) */
    platformFeeRate: number;
    /** Booking status */
    status?: string;
}

/**
 * Calculate the actual price paid by the consumer for a booking
 * 
 * This is the net revenue after refunds: finalPrice - refundAmount
 * 
 * @param booking - Booking object with finalPrice and optional refundAmount
 * @returns Actual price paid in cents (finalPrice - refundAmount)
 * 
 * @example
 * ```typescript
 * const booking = { finalPrice: 1000, refundAmount: 500, platformFeeRate: 0.20 };
 * const pricePaid = getBookingFinalPrice(booking); // Returns: 500 (cents)
 * ```
 */
export function getBookingFinalPrice(booking: BookingForCalculation): number {
    const refundAmount = booking.refundAmount ?? 0;
    return booking.finalPrice - refundAmount;
}

/**
 * Calculate the platform fee amount for a booking
 * 
 * Platform fee is calculated on the net revenue (finalPrice - refundAmount)
 * 
 * @param booking - Booking object with finalPrice, refundAmount, and platformFeeRate
 * @returns Platform fee amount in cents
 * 
 * @example
 * ```typescript
 * const booking = { finalPrice: 1000, refundAmount: 500, platformFeeRate: 0.20 };
 * const fee = getBookingPlatformFee(booking); // Returns: 100 (cents, 20% of 500)
 * ```
 */
export function getBookingPlatformFee(booking: BookingForCalculation): number {
    const pricePaid = getBookingFinalPrice(booking);
    return Math.round(pricePaid * booking.platformFeeRate);
}

/**
 * Calculate the business earnings from a booking
 * 
 * Earnings = (finalPrice - refundAmount) * (1 - platformFeeRate)
 * 
 * @param booking - Booking object with finalPrice, refundAmount, and platformFeeRate
 * @returns Business earnings in cents (what the business actually receives)
 * 
 * @example
 * ```typescript
 * const booking = { finalPrice: 1000, refundAmount: 500, platformFeeRate: 0.20 };
 * const earnings = getBookingEarnings(booking); // Returns: 400 (cents, 80% of 500)
 * ```
 */
export function getBookingEarnings(booking: BookingForCalculation): number {
    const pricePaid = getBookingFinalPrice(booking);
    return Math.round(pricePaid * (1 - booking.platformFeeRate));
}

/**
 * Calculate total earnings from an array of bookings
 * 
 * Sums up the earnings from all bookings (after refunds and platform fees)
 * 
 * @param bookings - Array of booking objects
 * @returns Total earnings in cents
 * 
 * @example
 * ```typescript
 * const bookings = [
 *   { finalPrice: 1000, refundAmount: 0, platformFeeRate: 0.20 },
 *   { finalPrice: 1000, refundAmount: 500, platformFeeRate: 0.20 }
 * ];
 * const total = getEarningsSum(bookings); // Returns: 1200 (cents)
 * ```
 */
export function getEarningsSum(bookings: BookingForCalculation[]): number {
    return bookings.reduce((sum, booking) => {
        return sum + getBookingEarnings(booking);
    }, 0);
}

/**
 * Calculate total gross revenue from an array of bookings
 * 
 * Sums up the net revenue (finalPrice - refundAmount) from all bookings
 * 
 * @param bookings - Array of booking objects
 * @returns Total gross revenue in cents (before platform fees)
 * 
 * @example
 * ```typescript
 * const bookings = [
 *   { finalPrice: 1000, refundAmount: 0, platformFeeRate: 0.20 },
 *   { finalPrice: 1000, refundAmount: 500, platformFeeRate: 0.20 }
 * ];
 * const total = getGrossRevenueSum(bookings); // Returns: 1500 (cents)
 * ```
 */
export function getGrossRevenueSum(bookings: BookingForCalculation[]): number {
    return bookings.reduce((sum, booking) => {
        return sum + getBookingFinalPrice(booking);
    }, 0);
}

/**
 * Calculate total platform fees from an array of bookings
 * 
 * Sums up the platform fees from all bookings
 * 
 * @param bookings - Array of booking objects
 * @returns Total platform fees in cents
 * 
 * @example
 * ```typescript
 * const bookings = [
 *   { finalPrice: 1000, refundAmount: 0, platformFeeRate: 0.20 },
 *   { finalPrice: 1000, refundAmount: 500, platformFeeRate: 0.20 }
 * ];
 * const total = getPlatformFeesSum(bookings); // Returns: 300 (cents)
 * ```
 */
export function getPlatformFeesSum(bookings: BookingForCalculation[]): number {
    return bookings.reduce((sum, booking) => {
        return sum + getBookingPlatformFee(booking);
    }, 0);
}

/**
 * Filter bookings to only include those with actual revenue
 * 
 * A booking has revenue if: (finalPrice - refundAmount) > 0
 * 
 * This filters out:
 * - Early cancellations (100% refund)
 * - Business cancellations (100% refund)
 * - Any booking where the net revenue is zero or negative
 * 
 * @param bookings - Array of booking objects
 * @returns Array of bookings with positive revenue
 * 
 * @example
 * ```typescript
 * const bookings = [
 *   { finalPrice: 1000, refundAmount: 0, platformFeeRate: 0.20 }, // Has revenue
 *   { finalPrice: 1000, refundAmount: 1000, platformFeeRate: 0.20 }, // No revenue (full refund)
 *   { finalPrice: 1000, refundAmount: 500, platformFeeRate: 0.20 } // Has revenue (partial refund)
 * ];
 * const withRevenue = getFinalEarnings(bookings);
 * // Returns: [first booking, third booking]
 * ```
 */
export function getFinalEarnings(bookings: BookingForCalculation[]): BookingForCalculation[] {
    return bookings.filter(booking => {
        const pricePaid = getBookingFinalPrice(booking);
        return pricePaid > 0;
    });
}

/**
 * Check if a booking has revenue (non-zero final price after refunds)
 * 
 * @param booking - Booking object
 * @returns true if booking has revenue, false otherwise
 * 
 * @example
 * ```typescript
 * const booking1 = { finalPrice: 1000, refundAmount: 0, platformFeeRate: 0.20 };
 * const booking2 = { finalPrice: 1000, refundAmount: 1000, platformFeeRate: 0.20 };
 * hasRevenue(booking1); // Returns: true
 * hasRevenue(booking2); // Returns: false
 * ```
 */
export function hasRevenue(booking: BookingForCalculation): boolean {
    return getBookingFinalPrice(booking) > 0;
}

/**
 * Check if a booking is reconciled (should be included in earnings reports)
 * 
 * A booking is reconciled if:
 * - Status is "completed" (service delivered)
 * - Status is "no_show" (service delivered, customer didn't attend)
 * - Status is "cancelled_by_consumer" AND has revenue (late cancellation with partial refund)
 * - Status is "cancelled_by_business" AND has revenue (business cancelled but fees apply)
 * 
 * Pending bookings are NOT reconciled because:
 * - Service hasn't been delivered yet
 * - Booking can still be cancelled and refunded
 * - Revenue hasn't been earned yet (unearned/deferred revenue)
 * 
 * This follows accrual accounting principles where revenue is recognized when earned,
 * not when payment is received.
 * 
 * @param booking - Booking object with status and revenue information
 * @returns true if booking should be included in earnings, false otherwise
 * 
 * @example
 * ```typescript
 * const completed = { status: "completed", finalPrice: 1000, refundAmount: 0, platformFeeRate: 0.20 };
 * const pending = { status: "pending", finalPrice: 1000, refundAmount: 0, platformFeeRate: 0.20 };
 * const lateCancel = { status: "cancelled_by_consumer", finalPrice: 1000, refundAmount: 500, platformFeeRate: 0.20 };
 * const earlyCancel = { status: "cancelled_by_consumer", finalPrice: 1000, refundAmount: 1000, platformFeeRate: 0.20 };
 * 
 * isReconciledBooking(completed); // Returns: true
 * isReconciledBooking(pending); // Returns: false (not yet earned)
 * isReconciledBooking(lateCancel); // Returns: true (has revenue)
 * isReconciledBooking(earlyCancel); // Returns: false (no revenue)
 * ```
 */
export function isReconciledBooking(booking: BookingForCalculation): boolean {
    const hasRevenue = getBookingFinalPrice(booking) > 0;
    const status = booking.status;

    // Always include completed and no-show bookings (service was delivered)
    if (status === "completed" || status === "no_show") {
        return true;
    }

    // Include cancelled bookings only if they have revenue (partial refunds)
    if (status === "cancelled_by_consumer" || status === "cancelled_by_business") {
        return hasRevenue;
    }

    // Exclude pending and other statuses (not yet earned)
    return false;
}

/**
 * Filter bookings to only include reconciled bookings (for earnings reports)
 * 
 * This is a stricter filter than getFinalEarnings() - it also excludes pending bookings.
 * 
 * @param bookings - Array of booking objects
 * @returns Array of reconciled bookings (completed, no_show, or cancelled with revenue)
 * 
 * @example
 * ```typescript
 * const bookings = [
 *   { status: "completed", finalPrice: 1000, refundAmount: 0, platformFeeRate: 0.20 },
 *   { status: "pending", finalPrice: 1000, refundAmount: 0, platformFeeRate: 0.20 },
 *   { status: "cancelled_by_consumer", finalPrice: 1000, refundAmount: 500, platformFeeRate: 0.20 }
 * ];
 * const reconciled = getReconciledEarnings(bookings);
 * // Returns: [first booking, third booking] (excludes pending)
 * ```
 */
export function getReconciledEarnings(bookings: BookingForCalculation[]): BookingForCalculation[] {
    return bookings.filter(booking => isReconciledBooking(booking));
}

