/**
 * Booking-related email templates for businesses
 */

import { createEmailTemplate } from "../base-template";
import type {
  BusinessBookingEmailData,
  BusinessNewBookingTranslations,
  BusinessBookingCancelledByConsumerTranslations,
  BusinessBookingCancelledByBusinessTranslations,
  BusinessBookingAwaitingApprovalTranslations,
  BusinessBookingApprovedTranslations,
  BusinessBookingRejectedTranslations,
} from "./types";

// Default English translations for new booking
const DEFAULT_NEW_BOOKING: BusinessNewBookingTranslations = {
  subject: "New Booking: {{className}}",
  preheader: "{{customerName}} booked {{className}}",
  title: "New Booking Received!",
  body: "Great news! You have a new booking from {{customerName}}.",
  details_title: "Booking Details",
  customer_label: "Customer",
  email_label: "Email",
  class_label: "Class",
  venue_label: "Venue",
  time_label: "Time",
  amount_label: "Amount",
  cta_button: "View Dashboard",
  footer_note: "This booking has been automatically confirmed. You can view all your bookings and manage your classes in your business dashboard.",
};

// Default English translations for cancelled by consumer
const DEFAULT_CANCELLED_BY_CONSUMER: BusinessBookingCancelledByConsumerTranslations = {
  subject: "Booking Cancelled: {{className}}",
  preheader: "{{customerName}} cancelled {{className}}",
  title: "Booking Cancelled",
  body: "{{customerName}} has cancelled their booking for {{className}}.",
  details_title: "Cancelled Booking Details",
  customer_label: "Customer",
  email_label: "Email",
  class_label: "Class",
  venue_label: "Venue",
  time_label: "Time",
  amount_label: "Amount",
  cta_button: "View Dashboard",
  footer_note: "The customer's credits have been automatically refunded according to your cancellation policy. No action needed from your side.",
};

// Default English translations for cancelled by business
const DEFAULT_CANCELLED_BY_BUSINESS: BusinessBookingCancelledByBusinessTranslations = {
  subject: "Booking Cancelled: {{className}}",
  preheader: "Your booking for {{className}} has been cancelled",
  title: "Your Booking Cancelled",
  body: "Your booking for {{className}} has been cancelled. We apologize for any inconvenience.",
  details_title: "Cancelled Booking Details",
  customer_label: "Customer",
  email_label: "Email",
  class_label: "Class",
  venue_label: "Venue",
  time_label: "Time",
  amount_label: "Amount",
  cta_button: "View Dashboard",
  footer_note: "The customer's credits have been automatically refunded. This is a confirmation of the cancellation.",
};

// Default English translations for awaiting approval
const DEFAULT_AWAITING_APPROVAL: BusinessBookingAwaitingApprovalTranslations = {
  subject: "Booking Request: {{className}}",
  preheader: "{{customerName}} requested to book {{className}}",
  title: "New Booking Request",
  body: "{{customerName}} has requested to book {{className}}. Please review and approve or reject this request.",
  details_title: "Booking Request Details",
  customer_label: "Customer",
  email_label: "Email",
  class_label: "Class",
  venue_label: "Venue",
  time_label: "Time",
  amount_label: "Amount",
  cta_button: "Review Request",
  footer_note: "Please respond to this request as soon as possible. The customer is waiting for your confirmation.",
  action_required: "Action Required",
  approve_button: "Approve",
  reject_button: "Reject",
};

// Default English translations for approved
const DEFAULT_APPROVED: BusinessBookingApprovedTranslations = {
  subject: "Booking Approved: {{className}}",
  preheader: "You approved {{customerName}}'s booking for {{className}}",
  title: "Booking Approved",
  body: "You have approved the booking request from {{customerName}} for {{className}}.",
  details_title: "Approved Booking Details",
  customer_label: "Customer",
  email_label: "Email",
  class_label: "Class",
  venue_label: "Venue",
  time_label: "Time",
  amount_label: "Amount",
  cta_button: "View Dashboard",
  footer_note: "The customer has been notified. This is a confirmation of the approval.",
};

// Default English translations for rejected
const DEFAULT_REJECTED: BusinessBookingRejectedTranslations = {
  subject: "Booking Rejected: {{className}}",
  preheader: "You rejected {{customerName}}'s booking for {{className}}",
  title: "Booking Rejected",
  body: "You have rejected the booking request from {{customerName}} for {{className}}.",
  details_title: "Rejected Booking Details",
  customer_label: "Customer",
  email_label: "Email",
  class_label: "Class",
  venue_label: "Venue",
  time_label: "Time",
  amount_label: "Amount",
  cta_button: "View Dashboard",
  footer_note: "The customer has been notified and their credits have been refunded.",
};

/**
 * Helper to create booking details HTML content
 */
function createBookingDetailsContent(
  data: BusinessBookingEmailData,
  t: BusinessNewBookingTranslations | BusinessBookingCancelledByConsumerTranslations | BusinessBookingCancelledByBusinessTranslations | BusinessBookingAwaitingApprovalTranslations | BusinessBookingApprovedTranslations | BusinessBookingRejectedTranslations,
  color: string,
  bgColor: string,
): string {
  return `
    <div style="border: 2px solid ${color}; border-radius: 12px; padding: 24px; margin: 24px 0; background: ${bgColor};">
      <h3 style="margin: 0 0 16px 0; color: ${color};">${t.details_title}</h3>
      <p style="margin: 0 0 8px 0;"><strong>${t.customer_label}:</strong> ${data.customerName}</p>
      ${data.customerEmail ? `<p style="margin: 0 0 8px 0;"><strong>${t.email_label}:</strong> ${data.customerEmail}</p>` : ""}
      <p style="margin: 0 0 8px 0;"><strong>${t.class_label}:</strong> ${data.className}</p>
      <p style="margin: 0 0 8px 0;"><strong>${t.venue_label}:</strong> ${data.venueName}</p>
      <p style="margin: 0 0 8px 0;"><strong>${t.time_label}:</strong> ${data.classTime}</p>
      <p style="margin: 0;"><strong>${t.amount_label}:</strong> ${data.bookingAmount}</p>
    </div>
  `;
}

export interface CreateBusinessBookingEmailOptions {
  data: BusinessBookingEmailData;
  translations?: BusinessNewBookingTranslations;
}

/**
 * Creates a new booking notification email for businesses
 */
export function createBusinessNewBookingEmail({
  data,
  translations,
}: CreateBusinessBookingEmailOptions): string {
  const t = translations ?? DEFAULT_NEW_BOOKING;

  const subject = t.subject.replace("{{className}}", data.className);
  const preheader = t.preheader
    .replace("{{customerName}}", data.customerName)
    .replace("{{className}}", data.className);
  const body = t.body.replace("{{customerName}}", data.customerName);

  return createEmailTemplate({
    title: subject,
    preheader,
    content: `
      <h1 class="content-title">${t.title}</h1>
      <p class="content-body">${body}</p>
      
      ${createBookingDetailsContent(data, t, "#16a34a", "#f0fdf4")}
      
      <div style="text-align: center; margin: 32px 0;">
        <a href="https://partners.kymaclub.com/dashboard" class="cta-button">${t.cta_button}</a>
      </div>
      
      <div style="background: #f8fafc; border-radius: 8px; padding: 16px; margin: 24px 0; border-left: 4px solid #16a34a;">
        <p style="margin: 0; font-size: 14px; color: #64748b;">${t.footer_note}</p>
      </div>
    `,
  });
}

export interface CreateBusinessBookingCancelledByConsumerEmailOptions {
  data: BusinessBookingEmailData;
  translations?: BusinessBookingCancelledByConsumerTranslations;
}

/**
 * Creates a booking cancelled by consumer notification email for businesses
 */
export function createBusinessBookingCancelledByConsumerEmail({
  data,
  translations,
}: CreateBusinessBookingCancelledByConsumerEmailOptions): string {
  const t = translations ?? DEFAULT_CANCELLED_BY_CONSUMER;

  const subject = t.subject.replace("{{className}}", data.className);
  const preheader = t.preheader
    .replace("{{customerName}}", data.customerName)
    .replace("{{className}}", data.className);
  const body = t.body
    .replace("{{customerName}}", data.customerName)
    .replace("{{className}}", data.className);

  return createEmailTemplate({
    title: subject,
    preheader,
    content: `
      <h1 class="content-title">${t.title}</h1>
      <p class="content-body">${body}</p>
      
      ${createBookingDetailsContent(data, t, "#F97316", "#fef3e2")}
      
      <div style="text-align: center; margin: 32px 0;">
        <a href="https://partners.kymaclub.com/dashboard" class="cta-button">${t.cta_button}</a>
      </div>
      
      <div style="background: #f8fafc; border-radius: 8px; padding: 16px; margin: 24px 0; border-left: 4px solid #F97316;">
        <p style="margin: 0; font-size: 14px; color: #64748b;">${t.footer_note}</p>
      </div>
    `,
  });
}

export interface CreateBusinessBookingCancelledByBusinessEmailOptions {
  data: BusinessBookingEmailData;
  translations?: BusinessBookingCancelledByBusinessTranslations;
}

/**
 * Creates a booking cancelled by business confirmation email
 */
export function createBusinessBookingCancelledByBusinessEmail({
  data,
  translations,
}: CreateBusinessBookingCancelledByBusinessEmailOptions): string {
  const t = translations ?? DEFAULT_CANCELLED_BY_BUSINESS;

  const subject = t.subject.replace("{{className}}", data.className);
  const preheader = t.preheader.replace("{{className}}", data.className);
  const body = t.body.replace("{{className}}", data.className);

  return createEmailTemplate({
    title: subject,
    preheader,
    content: `
      <h1 class="content-title">${t.title}</h1>
      <p class="content-body">${body}</p>
      
      ${createBookingDetailsContent(data, t, "#F97316", "#fef3e2")}
      
      <div style="text-align: center; margin: 32px 0;">
        <a href="https://partners.kymaclub.com/dashboard" class="cta-button">${t.cta_button}</a>
      </div>
      
      <div style="background: #f8fafc; border-radius: 8px; padding: 16px; margin: 24px 0; border-left: 4px solid #F97316;">
        <p style="margin: 0; font-size: 14px; color: #64748b;">${t.footer_note}</p>
      </div>
    `,
  });
}

export interface CreateBusinessBookingAwaitingApprovalEmailOptions {
  data: BusinessBookingEmailData;
  translations?: BusinessBookingAwaitingApprovalTranslations;
}

/**
 * Creates a booking awaiting approval notification email for businesses
 */
export function createBusinessBookingAwaitingApprovalEmail({
  data,
  translations,
}: CreateBusinessBookingAwaitingApprovalEmailOptions): string {
  const t = translations ?? DEFAULT_AWAITING_APPROVAL;

  const subject = t.subject.replace("{{className}}", data.className);
  const preheader = t.preheader
    .replace("{{customerName}}", data.customerName)
    .replace("{{className}}", data.className);
  const body = t.body
    .replace("{{customerName}}", data.customerName)
    .replace("{{className}}", data.className);

  return createEmailTemplate({
    title: subject,
    preheader,
    content: `
      <h1 class="content-title">${t.title}</h1>
      <p class="content-body">${body}</p>
      
      <div style="background: #FEF3C7; border: 2px solid #F59E0B; border-radius: 12px; padding: 16px; margin: 24px 0; text-align: center;">
        <p style="margin: 0; font-weight: 600; color: #92400E;">${t.action_required}</p>
      </div>
      
      ${createBookingDetailsContent(data, t, "#F59E0B", "#FFFBEB")}
      
      <div style="text-align: center; margin: 32px 0;">
        <a href="https://partners.kymaclub.com/dashboard" class="cta-button">${t.cta_button}</a>
      </div>
      
      <div style="background: #f8fafc; border-radius: 8px; padding: 16px; margin: 24px 0; border-left: 4px solid #F59E0B;">
        <p style="margin: 0; font-size: 14px; color: #64748b;">${t.footer_note}</p>
      </div>
    `,
  });
}

export interface CreateBusinessBookingApprovedEmailOptions {
  data: BusinessBookingEmailData;
  translations?: BusinessBookingApprovedTranslations;
}

/**
 * Creates a booking approved confirmation email for businesses
 */
export function createBusinessBookingApprovedEmail({
  data,
  translations,
}: CreateBusinessBookingApprovedEmailOptions): string {
  const t = translations ?? DEFAULT_APPROVED;

  const subject = t.subject.replace("{{className}}", data.className);
  const preheader = t.preheader
    .replace("{{customerName}}", data.customerName)
    .replace("{{className}}", data.className);
  const body = t.body
    .replace("{{customerName}}", data.customerName)
    .replace("{{className}}", data.className);

  return createEmailTemplate({
    title: subject,
    preheader,
    content: `
      <h1 class="content-title">${t.title}</h1>
      <p class="content-body">${body}</p>
      
      ${createBookingDetailsContent(data, t, "#16a34a", "#f0fdf4")}
      
      <div style="text-align: center; margin: 32px 0;">
        <a href="https://partners.kymaclub.com/dashboard" class="cta-button">${t.cta_button}</a>
      </div>
      
      <div style="background: #f8fafc; border-radius: 8px; padding: 16px; margin: 24px 0; border-left: 4px solid #16a34a;">
        <p style="margin: 0; font-size: 14px; color: #64748b;">${t.footer_note}</p>
      </div>
    `,
  });
}

export interface CreateBusinessBookingRejectedEmailOptions {
  data: BusinessBookingEmailData;
  translations?: BusinessBookingRejectedTranslations;
}

/**
 * Creates a booking rejected confirmation email for businesses
 */
export function createBusinessBookingRejectedEmail({
  data,
  translations,
}: CreateBusinessBookingRejectedEmailOptions): string {
  const t = translations ?? DEFAULT_REJECTED;

  const subject = t.subject.replace("{{className}}", data.className);
  const preheader = t.preheader
    .replace("{{customerName}}", data.customerName)
    .replace("{{className}}", data.className);
  const body = t.body
    .replace("{{customerName}}", data.customerName)
    .replace("{{className}}", data.className);

  return createEmailTemplate({
    title: subject,
    preheader,
    content: `
      <h1 class="content-title">${t.title}</h1>
      <p class="content-body">${body}</p>
      
      ${createBookingDetailsContent(data, t, "#EF4444", "#FEF2F2")}
      
      <div style="text-align: center; margin: 32px 0;">
        <a href="https://partners.kymaclub.com/dashboard" class="cta-button">${t.cta_button}</a>
      </div>
      
      <div style="background: #f8fafc; border-radius: 8px; padding: 16px; margin: 24px 0; border-left: 4px solid #EF4444;">
        <p style="margin: 0; font-size: 14px; color: #64748b;">${t.footer_note}</p>
      </div>
    `,
  });
}

// Re-export types for convenience
export type {
  BusinessBookingEmailData,
  BusinessNewBookingTranslations,
  BusinessBookingCancelledByConsumerTranslations,
  BusinessBookingCancelledByBusinessTranslations,
  BusinessBookingAwaitingApprovalTranslations,
  BusinessBookingApprovedTranslations,
  BusinessBookingRejectedTranslations,
} from "./types";
