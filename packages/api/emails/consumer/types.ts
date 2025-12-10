/**
 * Translation interfaces for consumer-facing emails
 */

/**
 * OTP/Verification email translations
 */
export interface OTPEmailTranslations {
  readonly subject: string;
  readonly preheader: string;
  readonly title: string;
  readonly body: string;
  readonly code_label: string;
  readonly warning: string;
  readonly ignore_notice: string;
  readonly plain_text: string;
}

/**
 * Booking confirmation email translations
 */
export interface BookingConfirmationTranslations {
  readonly subject: string;
  readonly preheader: string;
  readonly title: string;
  readonly body: string;
  readonly details_title: string;
  readonly class_label: string;
  readonly venue_label: string;
  readonly instructor_label: string;
  readonly location_label: string;
  readonly time_label: string;
  readonly cta_button: string;
  readonly reminder: string;
}

/**
 * Class cancellation email translations (sent to consumer when business cancels)
 */
export interface ClassCancellationTranslations {
  readonly subject: string;
  readonly preheader: string;
  readonly title: string;
  readonly body: string;
  readonly cancelled_class_title: string;
  readonly class_label: string;
  readonly venue_label: string;
  readonly original_time_label: string;
  readonly refund_title: string;
  readonly refund_notice: string;
  readonly cta_button: string;
  readonly apology: string;
}

/**
 * Credits gift email translations
 */
export interface CreditsGiftTranslations {
  readonly subject: string;
  readonly greeting: string;
  readonly credits_text: string;
  readonly note_label: string;
  readonly balance_title: string;
  readonly balance_label: string;
  readonly cta_button: string;
  readonly footer: string;
}

/**
 * Welcome email translations
 */
export interface WelcomeEmailTranslations {
  readonly subject: string;
  readonly title: string;
  readonly greeting: string;
  readonly credits_label: string;
  readonly credits_ready: string;
  readonly what_can_you_do_title: string;
  readonly what_can_you_do_body: string;
  readonly cta_button: string;
  readonly how_to_start_title: string;
  readonly step_1: string;
  readonly step_2: string;
  readonly step_3: string;
  readonly step_4: string;
  readonly help_text: string;
}

/**
 * Credits received (subscription) email translations
 */
export interface CreditsReceivedTranslations {
  readonly subject_renewal: string;
  readonly subject_initial: string;
  readonly title_renewal: string;
  readonly title_initial: string;
  readonly greeting: string;
  readonly credits_label: string;
  readonly from_plan: string;
  readonly balance_title: string;
  readonly balance_label: string;
  readonly cta_button: string;
  readonly pro_tip_title: string;
  readonly pro_tip_renewal: string;
  readonly pro_tip_initial: string;
  readonly help_text: string;
}
