import { differenceInHours, differenceInMinutes, format } from 'date-fns';

export interface CancellationInfo {
  isWithinWindow: boolean;
  timeRemaining: string | null;
  refundPercentage: number;
  hoursUntilStart: number;
  cancellationWindowHours: number;
}

/**
 * Calculate cancellation window information for a booking
 */
export function getCancellationInfo(
  classStartTime: number,
  cancellationWindowHours: number
): CancellationInfo {
  const now = Date.now();
  const startTime = new Date(classStartTime);
  const currentTime = new Date(now);

  // Calculate hours until class starts
  const hoursUntilStart = differenceInHours(startTime, currentTime);

  // Check if we're within the cancellation window
  const isWithinWindow = hoursUntilStart >= cancellationWindowHours;

  // Calculate refund percentage based on cancellation policy
  const refundPercentage = isWithinWindow ? 100 : 50;

  // Calculate time remaining for free cancellation
  let timeRemaining: string | null = null;
  if (isWithinWindow) {
    const cancellationDeadline = new Date(classStartTime - (cancellationWindowHours * 60 * 60 * 1000));
    const minutesRemaining = differenceInMinutes(cancellationDeadline, currentTime);

    if (minutesRemaining > 0) {
      if (minutesRemaining >= 60) {
        const hours = Math.floor(minutesRemaining / 60);
        const remainingMinutes = minutesRemaining % 60;
        if (remainingMinutes === 0) {
          timeRemaining = `${hours}h`;
        } else {
          timeRemaining = `${hours}h ${remainingMinutes}m`;
        }
      } else {
        timeRemaining = `${minutesRemaining}m`;
      }
    }
  }

  return {
    isWithinWindow,
    timeRemaining,
    refundPercentage,
    hoursUntilStart,
    cancellationWindowHours
  };
}

/**
 * Format cancellation status text for display
 */
export function formatCancellationStatus(cancellationInfo: CancellationInfo): string {
  if (cancellationInfo.isWithinWindow && cancellationInfo.timeRemaining) {
    return `Free to cancel for ${cancellationInfo.timeRemaining}`;
  } else if (!cancellationInfo.isWithinWindow) {
    return `${cancellationInfo.refundPercentage}% refund if cancelled`;
  } else {
    return 'Cancellation window has closed';
  }
}

/**
 * Get detailed cancellation message for action sheet
 */
export function getCancellationMessage(
  className: string,
  cancellationInfo: CancellationInfo
): string {
  const baseMessage = `Cancel "${className}"?`;

  if (cancellationInfo.isWithinWindow) {
    if (cancellationInfo.timeRemaining) {
      return `${baseMessage}\n\nYou can cancel free of charge for the next ${cancellationInfo.timeRemaining}. After that, you'll receive a 50% refund. No-shows are not eligible for a refund.`;
    } else {
      return `${baseMessage}\n\nYou will receive a full refund as you're cancelling within the cancellation window.`;
    }
  } else {
    return `${baseMessage}\n\nAs you're cancelling within ${cancellationInfo.cancellationWindowHours} hours of the class, you'll receive a ${cancellationInfo.refundPercentage}% refund. No-shows are not eligible for a refund.`;
  }
}