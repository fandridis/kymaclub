import { differenceInHours, differenceInMinutes, format } from 'date-fns';

export interface CancellationInfo {
  isWithinWindow: boolean;
  timeRemaining: string | null;
  refundPercentage: number;
  hoursUntilStart: number;
  cancellationWindowHours: number;
  hasFreeCancel: boolean;
  freeCancelReason?: string;
}

/**
 * Calculate cancellation window information for a booking
 */
export function getCancellationInfo(
  classStartTime: number,
  cancellationWindowHours: number,
  hasFreeCancel?: boolean,
  freeCancelExpiresAt?: number,
  freeCancelReason?: string
): CancellationInfo {
  const now = Date.now();
  const startTime = new Date(classStartTime);
  const currentTime = new Date(now);

  // Calculate hours until class starts
  const hoursUntilStart = differenceInHours(startTime, currentTime);

  // Check if free cancellation is active (takes precedence over normal window)
  const hasActiveFreeCancel = hasFreeCancel && freeCancelExpiresAt && now <= freeCancelExpiresAt;

  // If free cancellation is active, always allow full refund
  if (hasActiveFreeCancel) {
    const freeCancelDeadline = new Date(freeCancelExpiresAt!);
    const minutesRemaining = differenceInMinutes(freeCancelDeadline, currentTime);

    let timeRemaining: string | null = null;
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

    return {
      isWithinWindow: true,
      timeRemaining,
      refundPercentage: 100,
      hoursUntilStart,
      cancellationWindowHours,
      hasFreeCancel: true,
      freeCancelReason
    };
  }

  // Normal cancellation window logic
  const isWithinWindow = hoursUntilStart >= cancellationWindowHours;
  const refundPercentage = isWithinWindow ? 100 : 50;

  // Calculate time remaining for normal cancellation window
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
    cancellationWindowHours,
    hasFreeCancel: false
  };
}

/**
 * Format cancellation status text for display
 */
export function formatCancellationStatus(cancellationInfo: CancellationInfo): string {
  // Free cancellation privilege takes priority
  if (cancellationInfo.hasFreeCancel && cancellationInfo.timeRemaining) {
    return `Free cancellation for ${cancellationInfo.timeRemaining} (${cancellationInfo.freeCancelReason || 'special privilege'})`;
  }

  // Normal cancellation window
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
  // Free cancellation privilege - show special message
  if (cancellationInfo.hasFreeCancel) {
    const reason = cancellationInfo.freeCancelReason || 'special circumstances';
    if (cancellationInfo.timeRemaining) {
      return `Due to ${reason}, you can cancel this class free of charge for the next ${cancellationInfo.timeRemaining}. You will receive a full refund of your credits.`;
    } else {
      return `Due to ${reason}, you can cancel this class and receive a full refund of your credits.`;
    }
  }

  // Normal cancellation window
  if (cancellationInfo.isWithinWindow) {
    if (cancellationInfo.timeRemaining) {
      return `You can cancel free of charge for the next ${cancellationInfo.timeRemaining}. After that, you'll receive a 50% refund. No-shows are not eligible for a refund.`;
    } else {
      return `You will receive a full refund as you're cancelling within the cancellation window.`;
    }
  } else {
    return `As you're cancelling within ${cancellationInfo.cancellationWindowHours} hours of the class, you'll receive a ${cancellationInfo.refundPercentage}% refund. No-shows are not eligible for a refund.`;
  }
}