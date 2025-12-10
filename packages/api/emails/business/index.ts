/**
 * Business email templates
 * These emails are sent to business owners/operators on the KymaClub platform
 */

// Booking-related emails (6 specific types)
export {
  createBusinessNewBookingEmail,
  createBusinessBookingCancelledByConsumerEmail,
  createBusinessBookingCancelledByBusinessEmail,
  createBusinessBookingAwaitingApprovalEmail,
  createBusinessBookingApprovedEmail,
  createBusinessBookingRejectedEmail,
} from "./booking";

export type {
  BusinessBookingEmailData,
  BusinessNewBookingTranslations,
  BusinessBookingCancelledByConsumerTranslations,
  BusinessBookingCancelledByBusinessTranslations,
  BusinessBookingAwaitingApprovalTranslations,
  BusinessBookingApprovedTranslations,
  BusinessBookingRejectedTranslations,
  CreateBusinessBookingEmailOptions,
  CreateBusinessBookingCancelledByConsumerEmailOptions,
  CreateBusinessBookingCancelledByBusinessEmailOptions,
  CreateBusinessBookingAwaitingApprovalEmailOptions,
  CreateBusinessBookingApprovedEmailOptions,
  CreateBusinessBookingRejectedEmailOptions,
} from "./booking";

// Review notification emails
export { createReviewNotificationEmail } from "./review";
export type {
  BusinessReviewTranslations,
  CreateReviewNotificationEmailOptions,
} from "./review";

// Re-export all types from types.ts for convenience
export * from "./types";
