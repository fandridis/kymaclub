import { differenceInMinutes } from 'date-fns';

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
  noWindow: string;
  noWindowStatus: string;
  classStarted: string;
  classStartedStatus: string;
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
    noWindow: t('classes.cancellation.noWindow'),
    noWindowStatus: t('classes.cancellation.noWindowStatus'),
    classStarted: t('classes.cancellation.classStarted'),
    classStartedStatus: t('classes.cancellation.classStartedStatus'),
    specialCircumstances: t('classes.cancellation.specialCircumstances'),
    specialPrivilege: t('classes.cancellation.specialPrivilege'),
  };
}

/**
 * Calculate cancellation window information for a booking
 */
export function getCancellationInfo(
  classStartTime: number,
  cancellationWindowHours: number | null | undefined,
  hasFreeCancel?: boolean,
  freeCancelExpiresAt?: number,
  freeCancelReason?: string
): CancellationInfo {
  const now = Date.now();
  const startTime = new Date(classStartTime);
  const currentTime = new Date(now);

  // Calculate minutes until class starts (can be negative if class has started)
  const minutesUntilStart = differenceInMinutes(startTime, currentTime);
  const hoursUntilStart = minutesUntilStart / 60;

  // Check if class has already started (with 10-minute grace period)
  // Users can cancel up to 10 minutes after class starts and still get 50% refund
  const GRACE_PERIOD_MINUTES = 10;
  const classHasStarted = minutesUntilStart < -GRACE_PERIOD_MINUTES;

  // Check if free cancellation is active (takes precedence over normal window)
  const hasActiveFreeCancel = hasFreeCancel && freeCancelExpiresAt && now <= freeCancelExpiresAt;

  // If free cancellation is active, always allow full refund (unless class has started)
  if (hasActiveFreeCancel && !classHasStarted) {
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
      cancellationWindowHours: cancellationWindowHours ?? 0,
      hasFreeCancel: true,
      freeCancelReason
    };
  }

  // If class has started, no refund
  if (classHasStarted) {
    return {
      isWithinWindow: false,
      timeRemaining: null,
      refundPercentage: 0,
      hoursUntilStart,
      cancellationWindowHours: cancellationWindowHours ?? 0,
      hasFreeCancel: false
    };
  }

  // If there's no cancellation window (0, null, or undefined), full refund
  const effectiveWindowHours = cancellationWindowHours ?? 0;
  if (effectiveWindowHours === 0) {
    return {
      isWithinWindow: true,
      timeRemaining: null,
      refundPercentage: 100,
      hoursUntilStart,
      cancellationWindowHours: 0,
      hasFreeCancel: false
    };
  }

  // Normal cancellation window logic
  const isWithinWindow = hoursUntilStart >= effectiveWindowHours;
  const refundPercentage = isWithinWindow ? 100 : 50;

  // Calculate time remaining for normal cancellation window
  let timeRemaining: string | null = null;
  if (isWithinWindow) {
    const cancellationDeadline = new Date(classStartTime - (effectiveWindowHours * 60 * 60 * 1000));
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
    cancellationWindowHours: effectiveWindowHours,
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
  // If class has started (more than 10 minutes ago), no refund
  // hoursUntilStart is negative when class has started, so we check if it's less than -10/60 hours
  if (cancellationInfo.hoursUntilStart < -10 / 60) {
    return translations.classStartedStatus;
  }

  // Free cancellation privilege takes priority
  if (cancellationInfo.hasFreeCancel && cancellationInfo.timeRemaining) {
    const reason = cancellationInfo.freeCancelReason || translations.specialPrivilege;
    return translations.freeCancelStatus
      .replace('{{time}}', cancellationInfo.timeRemaining)
      .replace('{{reason}}', reason);
  }

  // No cancellation window (0 hours) - full refund
  if (cancellationInfo.cancellationWindowHours === 0) {
    return translations.noWindowStatus;
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
  // If class has started (more than 10 minutes ago), no refund
  // hoursUntilStart is negative when class has started, so we check if it's less than -10/60 hours
  if (cancellationInfo.hoursUntilStart < -10 / 60) {
    return translations.classStarted;
  }

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

  // No cancellation window (0 hours) - full refund
  if (cancellationInfo.cancellationWindowHours === 0) {
    return translations.noWindow;
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