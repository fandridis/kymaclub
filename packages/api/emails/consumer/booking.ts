/**
 * Booking-related email templates for consumers
 */

import { createEmailTemplate } from "../base-template";
import type { BookingConfirmationTranslations, ClassCancellationTranslations } from "./types";

// Default English translations for booking confirmation
const DEFAULT_BOOKING_CONFIRMATION: BookingConfirmationTranslations = {
  subject: "Booking Confirmed: {{className}}",
  preheader: "Your {{className}} class is confirmed",
  title: "Booking Confirmed!",
  body: "Great news! Your class booking has been confirmed. We can't wait to see you there!",
  details_title: "Class Details",
  class_label: "Class",
  venue_label: "Venue",
  instructor_label: "Instructor",
  location_label: "Location",
  time_label: "Time",
  cta_button: "View My Bookings",
  reminder: "Please arrive 10-15 minutes early and bring a water bottle and towel if needed.",
};

// Default English translations for class cancellation
const DEFAULT_CLASS_CANCELLATION: ClassCancellationTranslations = {
  subject: "Class Cancelled: {{className}}",
  preheader: "{{className}} has been cancelled",
  title: "Class Cancellation Notice",
  body: "We're sorry to inform you that the following class has been cancelled by the studio:",
  cancelled_class_title: "Cancelled Class",
  class_label: "Class",
  venue_label: "Venue",
  original_time_label: "Original Time",
  refund_title: "Automatic Refund",
  refund_notice: "Your {{credits}} credits have been automatically refunded to your account and are available for immediate use.",
  cta_button: "Browse Other Classes",
  apology: "We apologize for any inconvenience caused. Thank you for your understanding!",
};

export interface CreateBookingConfirmationEmailOptions {
  className: string;
  venueName: string;
  venueLocation: string;
  startTime: string;
  instructorName: string;
  translations?: BookingConfirmationTranslations;
}

/**
 * Creates a booking confirmation email for consumers
 */
export function createBookingConfirmationEmail({
  className,
  venueName,
  venueLocation,
  startTime,
  instructorName,
  translations,
}: CreateBookingConfirmationEmailOptions): string {
  const t = translations ?? DEFAULT_BOOKING_CONFIRMATION;
  const formattedTime = new Date(startTime).toLocaleString();

  return createEmailTemplate({
    title: t.subject.replace("{{className}}", className),
    preheader: t.preheader.replace("{{className}}", className),
    content: `
      <h1 class="content-title">${t.title}</h1>
      <p class="content-body">
        ${t.body}
      </p>
      
      <div style="border: 2px solid #16a34a; border-radius: 12px; padding: 24px; margin: 24px 0; background: #f0fdf4;">
        <h3 style="margin: 0 0 16px 0; color: #16a34a;">${t.details_title}</h3>
        <p style="margin: 0 0 8px 0;"><strong>${t.class_label}:</strong> ${className}</p>
        <p style="margin: 0 0 8px 0;"><strong>${t.venue_label}:</strong> ${venueName}</p>
        <p style="margin: 0 0 8px 0;"><strong>${t.instructor_label}:</strong> ${instructorName}</p>
        <p style="margin: 0 0 8px 0;"><strong>${t.location_label}:</strong> ${venueLocation}</p>
        <p style="margin: 0;"><strong>${t.time_label}:</strong> ${formattedTime}</p>
      </div>
      
      <div style="text-align: center; margin: 32px 0;">
        <a href="https://app.kymaclub.com/bookings" class="cta-button">${t.cta_button}</a>
      </div>
      
      <div style="background: #f8fafc; border-radius: 8px; padding: 16px; margin: 24px 0; border-left: 4px solid #16a34a;">
        <p style="margin: 0; font-size: 14px; color: #64748b;">
          <strong>Remember:</strong> ${t.reminder}
        </p>
      </div>
    `,
  });
}

export interface CreateClassCancellationEmailOptions {
  className: string;
  venueName: string;
  startTime: string;
  refundAmount: number;
  translations?: ClassCancellationTranslations;
}

/**
 * Creates a class cancellation email for consumers (when business cancels the class)
 */
export function createClassCancellationEmail({
  className,
  venueName,
  startTime,
  refundAmount,
  translations,
}: CreateClassCancellationEmailOptions): string {
  const t = translations ?? DEFAULT_CLASS_CANCELLATION;
  const formattedTime = new Date(startTime).toLocaleString();

  return createEmailTemplate({
    title: t.subject.replace("{{className}}", className),
    preheader: t.preheader.replace("{{className}}", className),
    content: `
      <h1 class="content-title">${t.title}</h1>
      <p class="content-body">
        ${t.body}
      </p>
      
      <div style="border: 2px solid #F97316; border-radius: 12px; padding: 24px; margin: 24px 0; background: #fef3e2;">
        <h3 style="margin: 0 0 16px 0; color: #F97316;">${t.cancelled_class_title}</h3>
        <p style="margin: 0 0 8px 0;"><strong>${t.class_label}:</strong> ${className}</p>
        <p style="margin: 0 0 8px 0;"><strong>${t.venue_label}:</strong> ${venueName}</p>
        <p style="margin: 0;"><strong>${t.original_time_label}:</strong> ${formattedTime}</p>
      </div>
      
      <div style="border: 2px solid #16a34a; border-radius: 12px; padding: 24px; margin: 24px 0; background: #f0fdf4;">
        <h3 style="margin: 0 0 16px 0; color: #16a34a;">${t.refund_title}</h3>
        <p style="margin: 0;">${t.refund_notice.replace("{{credits}}", String(refundAmount))}</p>
      </div>
      
      <div style="text-align: center; margin: 32px 0;">
        <a href="https://app.kymaclub.com/classes" class="cta-button">${t.cta_button}</a>
      </div>
      
      <p style="text-align: center; color: #64748b; font-size: 14px;">
        ${t.apology}
      </p>
    `,
  });
}

// Re-export types for convenience
export type { BookingConfirmationTranslations, ClassCancellationTranslations } from "./types";
