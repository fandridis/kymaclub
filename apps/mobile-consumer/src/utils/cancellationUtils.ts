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
 * Translation strings for cancellation messages
 */
export interface CancellationTranslations {
  freeCancelWithTime: string;
  freeCancelWithoutTime: string;
  freeCancelStatus: string;
  withinWindowWithTime: string;
  withinWindowWithoutTime: string;
  withinWindowStatus: string;
  outsideWindow: string;
  outsideWindowStatus: string;
  windowClosed: string;
  specialCircumstances: string;
  specialPrivilege: string;
}

/**
 * Get all cancellation translations from a translation function
 * This helper makes it easy to pass translations to utility functions
 * @param t - Any translation function (typed or untyped)
 */
export function getCancellationTranslations(t: (key: any, options?: any) => string): CancellationTranslations {
  return {
    freeCancelWithTime: t('classes.cancellation.freeCancelWithTime'),
    freeCancelWithoutTime: t('classes.cancellation.freeCancelWithoutTime'),
    freeCancelStatus: t('classes.cancellation.freeCancelStatus'),
    withinWindowWithTime: t('classes.cancellation.withinWindowWithTime'),
    withinWindowWithoutTime: t('classes.cancellation.withinWindowWithoutTime'),
    withinWindowStatus: t('classes.cancellation.withinWindowStatus'),
    outsideWindow: t('classes.cancellation.outsideWindow'),
    outsideWindowStatus: t('classes.cancellation.outsideWindowStatus'),
    windowClosed: t('classes.cancellation.windowClosed'),
    specialCircumstances: t('classes.cancellation.specialCircumstances'),
    specialPrivilege: t('classes.cancellation.specialPrivilege'),
  };
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
export function formatCancellationStatus(
  cancellationInfo: CancellationInfo,
  translations: CancellationTranslations
): string {
  // Free cancellation privilege takes priority
  if (cancellationInfo.hasFreeCancel && cancellationInfo.timeRemaining) {
    const reason = cancellationInfo.freeCancelReason || translations.specialPrivilege;
    return translations.freeCancelStatus
      .replace('{{time}}', cancellationInfo.timeRemaining)
      .replace('{{reason}}', reason);
  }

  // Normal cancellation window
  if (cancellationInfo.isWithinWindow && cancellationInfo.timeRemaining) {
    return translations.withinWindowStatus.replace('{{time}}', cancellationInfo.timeRemaining);
  } else if (!cancellationInfo.isWithinWindow) {
    return translations.outsideWindowStatus.replace('{{percentage}}', String(cancellationInfo.refundPercentage));
  } else {
    return translations.windowClosed;
  }
}

/**
 * Get detailed cancellation message for action sheet
 */
export function getCancellationMessage(
  className: string,
  cancellationInfo: CancellationInfo,
  translations: CancellationTranslations
): string {
  // Free cancellation privilege - show special message
  if (cancellationInfo.hasFreeCancel) {
    const reason = cancellationInfo.freeCancelReason || translations.specialCircumstances;
    if (cancellationInfo.timeRemaining) {
      return translations.freeCancelWithTime
        .replace('{{reason}}', reason)
        .replace('{{time}}', cancellationInfo.timeRemaining);
    } else {
      return translations.freeCancelWithoutTime.replace('{{reason}}', reason);
    }
  }

  // Normal cancellation window
  if (cancellationInfo.isWithinWindow) {
    if (cancellationInfo.timeRemaining) {
      return translations.withinWindowWithTime.replace('{{time}}', cancellationInfo.timeRemaining);
    } else {
      return translations.withinWindowWithoutTime;
    }
  } else {
    return translations.outsideWindow
      .replace('{{hours}}', String(cancellationInfo.cancellationWindowHours))
      .replace('{{percentage}}', String(cancellationInfo.refundPercentage));
  }
}