import type { Doc } from "../convex/_generated/dataModel";

export const canBookClass = (
    instance: Doc<"classInstances">,
    template: Doc<"classTemplates">,
    currentTime: number = Date.now()
): boolean => {
    console.log("📋 BOOKING_DOMAIN: checkBookingWindow - Checking if booking is allowed");

    const hoursUntilClass = (instance.startTime - currentTime) / (1000 * 60 * 60);

    // Mock booking window rules (e.g., can't book within 1 hour of class)
    const minAdvanceHours = 1;
    const maxAdvanceHours = 168; // 7 days

    if (hoursUntilClass < minAdvanceHours) {
        console.log(`❌ BOOKING_DOMAIN: Too late to book (${hoursUntilClass.toFixed(2)} < ${minAdvanceHours} hours)`);
        return false;
    }

    if (hoursUntilClass > maxAdvanceHours) {
        console.log(`❌ BOOKING_DOMAIN: Too early to book (${hoursUntilClass.toFixed(2)} > ${maxAdvanceHours} hours)`);
        return false;
    }

    console.log("✅ BOOKING_DOMAIN: Booking window is valid");
    return true;
};

export const canCancelBooking = (
    instance: Doc<"classInstances">,
    template: Doc<"classTemplates">,
    currentTime: number = Date.now()
): { canCancel: boolean; refundPercentage: number } => {
    console.log("📋 BOOKING_DOMAIN: checkCancellationWindow - Checking cancellation rules");

    const hoursUntilClass = (instance.startTime - currentTime) / (1000 * 60 * 60);
    const cancellationWindowHours = template.cancellationWindowHours;

    console.log(`📋 BOOKING_DOMAIN: Hours until class: ${hoursUntilClass.toFixed(2)}`);
    console.log(`📋 BOOKING_DOMAIN: Cancellation window: ${cancellationWindowHours} hours`);

    if (hoursUntilClass <= 0) {
        console.log("❌ BOOKING_DOMAIN: Class has already started - no cancellation");
        return { canCancel: false, refundPercentage: 0 };
    }

    if (hoursUntilClass >= cancellationWindowHours) {
        console.log("✅ BOOKING_DOMAIN: Full refund cancellation allowed");
        return { canCancel: true, refundPercentage: 1.0 };
    } else {
        console.log("⚠️ BOOKING_DOMAIN: Late cancellation - partial refund");
        return { canCancel: true, refundPercentage: 0.5 };
    }
};

export const bookingRules = {
    canBookClass,
    canCancelBooking,
};
