/**
 * Review notification email templates for businesses
 */

import { createEmailTemplate } from "../base-template";
import type { BusinessReviewTranslations } from "./types";

// Default English translations for review notification
const DEFAULT_REVIEW: BusinessReviewTranslations = {
  subject: "New Review for {{venueName}}",
  preheader: "{{reviewerName}} left a review for {{venueName}}",
  title: "New User Review!",
  body: "{{reviewerName}} left a new review for {{venueName}}.",
  business_label: "Business",
  venue_label: "Venue",
  rating_label: "Rating",
  comment_label: "Comment",
  cta_button: "View in Dashboard",
};

export interface CreateReviewNotificationEmailOptions {
  businessName: string;
  venueName: string;
  reviewerName?: string;
  rating: number;
  comment?: string;
  translations?: BusinessReviewTranslations;
}

/**
 * Creates a review notification email for businesses
 */
export function createReviewNotificationEmail({
  businessName,
  venueName,
  reviewerName,
  rating,
  comment,
  translations,
}: CreateReviewNotificationEmailOptions): string {
  const t = translations ?? DEFAULT_REVIEW;
  const safeReviewer = reviewerName || "A customer";

  // Generate star rating display
  const stars = "★".repeat(Math.max(0, Math.min(5, Math.round(rating)))) +
    "☆".repeat(Math.max(0, 5 - Math.round(rating)));

  const subject = t.subject.replace("{{venueName}}", venueName);
  const preheader = t.preheader
    .replace("{{reviewerName}}", safeReviewer)
    .replace("{{venueName}}", venueName);
  const body = t.body
    .replace("{{reviewerName}}", safeReviewer)
    .replace("{{venueName}}", venueName);

  return createEmailTemplate({
    title: subject,
    preheader,
    content: `
      <h1 class="content-title">${t.title}</h1>
      <p class="content-body">${body}</p>

      <div style="border: 2px solid #16a34a; border-radius: 12px; padding: 24px; margin: 24px 0; background: #f0fdf4;">
        <p style="margin: 0 0 8px 0;"><strong>${t.business_label}:</strong> ${businessName}</p>
        <p style="margin: 0 0 8px 0;"><strong>${t.venue_label}:</strong> ${venueName}</p>
        <p style="margin: 0 0 8px 0;"><strong>${t.rating_label}:</strong> <span style="color: #F59E0B;">${stars}</span> (${rating}/5)</p>
        ${comment ? `<p style="margin: 8px 0 0 0;"><strong>${t.comment_label}:</strong> ${comment}</p>` : ""}
      </div>

      <div style="text-align: center; margin: 32px 0;">
        <a href="https://partners.kymaclub.com/dashboard" class="cta-button">${t.cta_button}</a>
      </div>
    `,
  });
}

// Re-export type for convenience
export type { BusinessReviewTranslations } from "./types";
