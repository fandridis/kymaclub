/**
 * Consumer email templates
 * These emails are sent to end users (consumers) of the KymaClub platform
 */

// OTP/Verification emails
export { createOTPEmail } from "./otp";
export type { OTPEmailTranslations, CreateOTPEmailOptions } from "./otp";

// Booking-related emails
export { createBookingConfirmationEmail, createClassCancellationEmail } from "./booking";
export type {
  BookingConfirmationTranslations,
  ClassCancellationTranslations,
  CreateBookingConfirmationEmailOptions,
  CreateClassCancellationEmailOptions,
} from "./booking";

// Credits-related emails
export {
  createCreditsGiftEmail,
  createWelcomeEmail,
  createCreditsReceivedEmail,
} from "./credits";
export type {
  CreditsGiftTranslations,
  WelcomeEmailTranslations,
  CreditsReceivedTranslations,
  CreateCreditsGiftEmailOptions,
  CreateWelcomeEmailOptions,
  CreateCreditsReceivedEmailOptions,
} from "./credits";

// Re-export all types from types.ts for convenience
export * from "./types";
