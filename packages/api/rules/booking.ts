import type { Doc } from "../convex/_generated/dataModel";

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

export const bookingRules = {
    canBookClass,
    canCancelBooking,
};
