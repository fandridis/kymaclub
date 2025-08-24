/**
 * Backend deep linking utilities for generating notification deep links
 * These utilities match the mobile app's deep linking patterns
 */

import type { Id } from '../convex/_generated/dataModel';

// Base scheme for the app
const SCHEME = 'kymaclub://';

export type NotificationType =
  | 'booking_cancelled_by_business'
  | 'booking_confirmed'
  | 'booking_reminder'
  | 'class_time_changed'
  | 'waitlist_spot_available'
  | 'new_class_available';

/**
 * Generate deep link URL for class details modal
 */
export function generateClassDetailsDeepLink(classInstanceId: Id<"classInstances">): string {
  return `${SCHEME}class/${classInstanceId}`;
}

/**
 * Generate deep link URL for venue details screen
 */
export function generateVenueDetailsDeepLink(venueId: Id<"venues">): string {
  return `${SCHEME}venue/${venueId}`;
}

/**
 * Generate deep link URL for bookings screen
 */
export function generateBookingsDeepLink(): string {
  return `${SCHEME}home/bookings`;
}

/**
 * Generate deep link URL for home screen
 */
export function generateHomeDeepLink(): string {
  return `${SCHEME}home/news`;
}

/**
 * Generate appropriate deep link based on notification type
 */
export function generateNotificationDeepLink(
  type: NotificationType,
  data: {
    classInstanceId?: Id<"classInstances">;
    venueId?: Id<"venues">;
  }
): string {
  switch (type) {
    case 'booking_cancelled_by_business':
    case 'booking_reminder':
    case 'class_time_changed':
    case 'waitlist_spot_available':
    case 'new_class_available':
      if (data.classInstanceId) {
        return generateClassDetailsDeepLink(data.classInstanceId);
      }
      return generateBookingsDeepLink();

    case 'booking_confirmed':
      return generateBookingsDeepLink();

    default:
      return generateHomeDeepLink();
  }
}

/**
 * Create notification data object with deep link
 */
export function createNotificationWithDeepLink(
  type: NotificationType,
  title: string,
  body: string,
  data: {
    classInstanceId?: Id<"classInstances">;
    venueId?: Id<"venues">;
    bookingId?: Id<"bookings">;
    additionalData?: Record<string, any>;
  }
) {
  const deepLink = generateNotificationDeepLink(type, data);

  return {
    title,
    body,
    data: {
      deepLink,
      notificationType: type,
      classInstanceId: data.classInstanceId,
      venueId: data.venueId,
      bookingId: data.bookingId,
      ...data.additionalData,
    },
  };
}