/**
 * Translation interfaces for business-facing emails
 */

/**
 * Base booking notification fields (shared across all booking emails)
 */
interface BaseBookingEmailTranslations {
  readonly subject: string;
  readonly preheader: string;
  readonly title: string;
  readonly body: string;
  readonly details_title: string;
  readonly customer_label: string;
  readonly email_label: string;
  readonly class_label: string;
  readonly venue_label: string;
  readonly time_label: string;
  readonly amount_label: string;
  readonly cta_button: string;
  readonly footer_note: string;
}

/**
 * New booking email translations (business receives when customer books)
 */
export interface BusinessNewBookingTranslations extends BaseBookingEmailTranslations { }

/**
 * Booking cancelled by consumer email translations
 */
export interface BusinessBookingCancelledByConsumerTranslations extends BaseBookingEmailTranslations { }

/**
 * Booking cancelled by business email translations (confirmation to business)
 */
export interface BusinessBookingCancelledByBusinessTranslations extends BaseBookingEmailTranslations { }

/**
 * Booking awaiting approval email translations
 */
export interface BusinessBookingAwaitingApprovalTranslations extends BaseBookingEmailTranslations {
  readonly action_required: string;
  readonly approve_button: string;
  readonly reject_button: string;
}

/**
 * Booking approved email translations (confirmation to business)
 */
export interface BusinessBookingApprovedTranslations extends BaseBookingEmailTranslations { }

/**
 * Booking rejected email translations (confirmation to business)
 */
export interface BusinessBookingRejectedTranslations extends BaseBookingEmailTranslations { }

/**
 * Review notification email translations
 */
export interface BusinessReviewTranslations {
  readonly subject: string;
  readonly preheader: string;
  readonly title: string;
  readonly body: string;
  readonly business_label: string;
  readonly venue_label: string;
  readonly rating_label: string;
  readonly comment_label: string;
  readonly cta_button: string;
}

/**
 * Common booking email data passed to templates
 */
export interface BusinessBookingEmailData {
  businessName: string;
  customerName: string;
  customerEmail?: string;
  className: string;
  venueName: string;
  classTime: string;
  bookingAmount: string; // Formatted amount (e.g., "15,00 €")
}
