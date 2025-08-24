/**
 * Deep linking utilities for the entire application
 * Uses database-generated types for type safety
 */

import type { Id } from '../convex/_generated/dataModel';
import type { NotificationType } from '../types/notification';

// Base scheme for the app
const SCHEME = 'kymaclub://';

export type DeepLinkType =
  | 'class-details'
  | 'venue-details'
  | 'bookings'
  | 'home'
  | 'explore'
  | 'settings'
  | 'profile'
  | 'notifications';

export interface DeepLinkData {
  type: DeepLinkType;
  params?: Record<string, string | number>;
}

/**
 * Generate deep link URL for class details modal
 */
export function generateClassDetailsLink(classInstanceId: Id<"classInstances">): string {
  return `${SCHEME}class/${classInstanceId}`;
}

/**
 * Generate deep link URL for venue details screen
 */
export function generateVenueDetailsLink(venueId: Id<"venues">): string {
  return `${SCHEME}venue/${venueId}`;
}

/**
 * Generate deep link URL for bookings screen
 */
export function generateBookingsLink(): string {
  return `${SCHEME}home/bookings`;
}

/**
 * Generate deep link URL for home screen
 */
export function generateHomeLink(): string {
  return `${SCHEME}home/news`;
}

/**
 * Generate deep link URL for explore screen
 */
export function generateExploreLink(): string {
  return `${SCHEME}home/explore`;
}

/**
 * Generate deep link URL for settings
 */
export function generateSettingsLink(): string {
  return `${SCHEME}settings/profile`;
}

/**
 * Generate appropriate deep link based on notification type
 * Uses database-generated NotificationType for type safety
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
    case 'class_cancelled':
    case 'booking_confirmation':
      if (data.classInstanceId) {
        return generateClassDetailsLink(data.classInstanceId);
      }
      return generateBookingsLink();

    case 'booking_created':
    case 'booking_cancelled_by_consumer':
    case 'payment_received':
    case 'payment_receipt':
      return generateBookingsLink();

    default:
      return generateHomeLink();
  }
}

/**
 * Generate deep link from notification data
 */
export function generateDeepLinkFromData(data: DeepLinkData): string {
  switch (data.type) {
    case 'class-details':
      if (!data.params?.classInstanceId) {
        throw new Error('classInstanceId is required for class-details deep link');
      }
      return generateClassDetailsLink(data.params.classInstanceId as Id<"classInstances">);

    case 'venue-details':
      if (!data.params?.venueId) {
        throw new Error('venueId is required for venue-details deep link');
      }
      return generateVenueDetailsLink(data.params.venueId as Id<"venues">);

    case 'bookings':
      return generateBookingsLink();

    case 'home':
      return generateHomeLink();

    case 'explore':
      return generateExploreLink();

    case 'settings':
    case 'profile':
    case 'notifications':
      return generateSettingsLink();

    default:
      return generateHomeLink();
  }
}

/**
 * Create notification data object with deep link
 * Uses database-generated NotificationType for type safety
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

/**
 * Parse deep link URL to extract route and params
 */
export function parseDeepLink(url: string): { route: string; params: Record<string, string> } | null {
  try {
    // Remove scheme and decode
    const cleanUrl = url.replace(SCHEME, '').replace(/^\/+/, '');

    if (!cleanUrl) {
      return { route: 'home', params: {} };
    }

    // Split path segments
    const segments = cleanUrl.split('/');

    // Handle different URL patterns
    if (segments[0] === 'class' && segments[1]) {
      return {
        route: 'ClassDetailsModal',
        params: { classInstanceId: segments[1] }
      };
    }

    if (segments[0] === 'venue' && segments[1]) {
      return {
        route: 'VenueDetailsScreen',
        params: { venueId: segments[1] }
      };
    }

    if (segments[0] === 'home') {
      const tabRoute = segments[1] || 'news';
      return {
        route: 'HomeTabs',
        params: { screen: tabRoute }
      };
    }

    if (segments[0] === 'settings') {
      const settingsRoute = segments[1] || 'profile';
      return {
        route: `Settings${settingsRoute.charAt(0).toUpperCase() + settingsRoute.slice(1)}`,
        params: {}
      };
    }

    return { route: 'HomeTabs', params: {} };
  } catch (error) {
    console.error('Error parsing deep link:', error);
    return null;
  }
}

/**
 * Create notification data for different scenarios
 * Uses proper database types for classInstanceId
 */
export const NotificationDeepLinks = {
  /**
   * Class cancelled by business - takes user to class details
   */
  classCancelledByBusiness: (classInstanceId: Id<"classInstances">): DeepLinkData => ({
    type: 'class-details',
    params: { classInstanceId }
  }),

  /**
   * New class available - takes user to class details
   */
  newClassAvailable: (classInstanceId: Id<"classInstances">): DeepLinkData => ({
    type: 'class-details',
    params: { classInstanceId }
  }),

  /**
   * Booking confirmed - takes user to bookings screen
   */
  bookingConfirmed: (): DeepLinkData => ({
    type: 'bookings'
  }),

  /**
   * Booking reminder - takes user to class details
   */
  bookingReminder: (classInstanceId: Id<"classInstances">): DeepLinkData => ({
    type: 'class-details',
    params: { classInstanceId }
  }),

  /**
   * Class time changed - takes user to class details
   */
  classTimeChanged: (classInstanceId: Id<"classInstances">): DeepLinkData => ({
    type: 'class-details',
    params: { classInstanceId }
  }),

  /**
   * Waitlist spot available - takes user to class details
   */
  waitlistSpotAvailable: (classInstanceId: Id<"classInstances">): DeepLinkData => ({
    type: 'class-details',
    params: { classInstanceId }
  }),
};

/**
 * Test if URL is a valid deep link for this app
 */
export function isValidDeepLink(url: string): boolean {
  return url.startsWith(SCHEME) || url.startsWith('https://kymaclub.com') || url.includes('kymaclub.com');
}

/**
 * Get the base scheme for the app
 */
export function getBaseScheme(): string {
  return SCHEME;
}

// Re-export the database-generated NotificationType for convenience
export type { NotificationType } from '../types/notification';