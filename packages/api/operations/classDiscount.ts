/**
 * Create a time-based discount (early bird, last minute, etc.)
 */
export function createTimeBasedDiscount(
    name: string,
    hoursBeforeStart: number,
    discountType: "percentage" | "fixed_amount",
    discountValue: number
) {
    return {
        name,
        type: "time" as const,
        discountType,
        discountValue,
        timeFields: { hoursBeforeStart },
    };
}

/**
 * Common discount creation patterns
 */
export const discountPatterns = {
    /**
     * Early Bird: Encourage advance bookings
     */
    earlyBird: (percentage: number, hours: number = 48) =>
        createTimeBasedDiscount(
            `Early Bird ${Math.round(percentage * 100)}% Off`,
            hours,
            "percentage",
            percentage
        ),

    /**
     * Last Minute: Fill last-minute spots
     */
    lastMinute: (percentage: number, hours: number = 2) =>
        createTimeBasedDiscount(
            `Last Minute ${Math.round(percentage * 100)}% Off`,
            hours,
            "percentage",
            percentage
        ),

    /**
     * Fixed Amount: Consistent pricing
     */
    fixedAmount: (amount: number, hours: number = 24) =>
        createTimeBasedDiscount(
            `${hours}h Advance Booking - $${amount} Off`,
            hours,
            "fixed_amount",
            amount
        ),
};
