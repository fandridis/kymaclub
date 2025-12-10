/**
 * Credits-related email templates for consumers
 */

import { createEmailTemplate } from "../base-template";
import type { CreditsGiftTranslations, WelcomeEmailTranslations, CreditsReceivedTranslations } from "./types";

// Default English translations for credits gift
const DEFAULT_CREDITS_GIFT: CreditsGiftTranslations = {
  subject: "You've been gifted {{credits}} credits!",
  greeting: "Hi {{name}}, KymaClub have just sent you",
  credits_text: "{{credits}} credits",
  note_label: "Note",
  balance_title: "Your Credit Balance",
  balance_label: "Total Credits Available",
  cta_button: "Book a Class Now",
  footer: "Questions? We're here to help! Contact us at",
};

// Default English translations for welcome email
const DEFAULT_WELCOME: WelcomeEmailTranslations = {
  subject: "Welcome to KymaClub! Your {{credits}} bonus credits are ready",
  title: "Welcome to KymaClub!",
  greeting: "Hi {{name}}!",
  credits_label: "Welcome Bonus Credits",
  credits_ready: "Ready to use right now!",
  what_can_you_do_title: "What can you do with credits?",
  what_can_you_do_body: "Use your credits to book amazing fitness classes across the city - from yoga and pilates to HIIT and dance classes!",
  cta_button: "Explore Classes",
  how_to_start_title: "Here's how to get started:",
  step_1: "Browse classes by location, type, or time",
  step_2: "Find a class that fits your schedule",
  step_3: "Book instantly with your credits",
  step_4: "Show up and enjoy your workout!",
  help_text: "Need help? We're here for you! Contact us at",
};

// Default English translations for credits received (subscription)
const DEFAULT_CREDITS_RECEIVED: CreditsReceivedTranslations = {
  subject_renewal: "Your monthly credits have arrived!",
  subject_initial: "Welcome! Your subscription credits are ready",
  title_renewal: "Monthly Credits Renewed!",
  title_initial: "Welcome Credits!",
  greeting: "Hi {{name}}!",
  credits_label: "Credits Added",
  from_plan: "From your {{planName}}",
  balance_title: "Your Credit Balance",
  balance_label: "Total Credits Available",
  cta_button: "Book Your Next Class",
  pro_tip_title: "Pro Tip",
  pro_tip_renewal: "Your credits renew monthly, so make sure to use them before your next billing cycle!",
  pro_tip_initial: "Welcome to KymaClub! Use your credits to book amazing fitness classes across the city.",
  help_text: "Questions? We're here to help! Contact us at",
};

export interface CreateCreditsGiftEmailOptions {
  customerName: string;
  creditsGifted: number;
  totalCredits: number;
  giftMessage?: string;
  translations?: CreditsGiftTranslations;
}

/**
 * Creates a credits gift email for consumers (admin gift)
 */
export function createCreditsGiftEmail({
  customerName,
  creditsGifted,
  totalCredits,
  giftMessage,
  translations,
}: CreateCreditsGiftEmailOptions): string {
  const t = translations ?? DEFAULT_CREDITS_GIFT;

  const subject = t.subject.replace("{{credits}}", String(creditsGifted));
  const greeting = t.greeting.replace("{{name}}", customerName);
  const creditsText = t.credits_text.replace("{{credits}}", String(creditsGifted));

  return createEmailTemplate({
    title: subject,
    content: `
      <div style="text-align: center; margin-bottom: 32px;">
        <p style="font-size: 18px; color: #1e293b; margin: 0;">
          ${greeting} <strong style="color: #059669;">${creditsText}</strong>!
        </p>
      </div>

      ${giftMessage ? `
      <div style="margin: 0 0 24px 0;">
        <p style="color: #6B7280; font-size: 14px; margin: 0 0 4px 0; font-weight: 500;">${t.note_label}</p>
        <p style="color: #374151; margin: 0; font-size: 14px;">${giftMessage}</p>
      </div>
      ` : ""}

      <div style="background: #F9FAFB; border-radius: 12px; padding: 24px; margin-bottom: 32px;">
        <h3 style="color: #059669; font-size: 18px; margin: 0 0 16px 0;">${t.balance_title}</h3>
        <table width="100%" cellpadding="0" cellspacing="0" style="background: white; border-radius: 8px;">
          <tr>
            <td style="padding: 16px; color: #4B5563; font-size: 16px;">${t.balance_label}</td>
            <td style="padding: 16px; color: #059669; font-size: 20px; font-weight: bold; text-align: right;">${totalCredits}</td>
          </tr>
        </table>
      </div>

      <div style="text-align: center; margin: 32px 0;">
        <a href="https://app.kymaclub.com" style="background: #059669; color: white; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; display: inline-block;">${t.cta_button}</a>
      </div>

      <div style="text-align: center; margin-top: 40px; padding-top: 24px; border-top: 1px solid #E5E7EB;">
        <p style="color: #6B7280; font-size: 14px; margin: 0;">
          ${t.footer} 
          <a href="mailto:support@orcavo.com" style="color: #059669; text-decoration: none;">support@orcavo.com</a>
        </p>
      </div>
    `,
  });
}

export interface CreateWelcomeEmailOptions {
  customerName: string;
  welcomeCredits: number;
  translations?: WelcomeEmailTranslations;
}

/**
 * Creates a welcome email for new consumers
 */
export function createWelcomeEmail({
  customerName,
  welcomeCredits,
  translations,
}: CreateWelcomeEmailOptions): string {
  const t = translations ?? DEFAULT_WELCOME;

  const subject = t.subject.replace("{{credits}}", String(welcomeCredits));
  const greeting = t.greeting.replace("{{name}}", customerName);

  return createEmailTemplate({
    title: subject,
    content: `
      <div style="text-align: center; margin-bottom: 32px;">
        <h1 style="color: #059669; font-size: 28px; margin-bottom: 16px;">${t.title}</h1>
        <p style="font-size: 18px; color: #4B5563; margin: 0;">${greeting}</p>
      </div>

      <div style="background: linear-gradient(135deg, #059669, #10B981); border-radius: 16px; padding: 32px; text-align: center; margin-bottom: 32px;">
        <div style="background: rgba(255, 255, 255, 0.95); border-radius: 12px; padding: 24px; margin-bottom: 24px;">
          <h2 style="color: #059669; font-size: 48px; font-weight: bold; margin: 0 0 8px 0;">${welcomeCredits}</h2>
          <p style="color: #4B5563; font-size: 18px; margin: 0; font-weight: 500;">${t.credits_label}</p>
        </div>
        <p style="color: white; font-size: 16px; margin: 0; opacity: 0.95;">${t.credits_ready}</p>
      </div>

      <div style="background: #EFF6FF; border-left: 4px solid #3B82F6; padding: 20px; margin: 24px 0; border-radius: 4px;">
        <h4 style="color: #1E40AF; margin: 0 0 8px 0; font-size: 16px;">${t.what_can_you_do_title}</h4>
        <p style="color: #1E40AF; margin: 0; font-size: 14px;">
          ${t.what_can_you_do_body}
        </p>
      </div>

      <div style="text-align: center; margin: 32px 0;">
        <a href="https://app.kymaclub.com" style="background: #059669; color: white; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; display: inline-block;">${t.cta_button}</a>
      </div>

      <div style="background: #F9FAFB; border-radius: 12px; padding: 24px; margin-bottom: 32px;">
        <h3 style="color: #059669; font-size: 18px; margin: 0 0 16px 0;">${t.how_to_start_title}</h3>
        <ol style="color: #4B5563; font-size: 14px; margin: 0; padding-left: 20px; line-height: 1.8;">
          <li>${t.step_1}</li>
          <li>${t.step_2}</li>
          <li>${t.step_3}</li>
          <li>${t.step_4}</li>
        </ol>
      </div>

      <div style="text-align: center; margin-top: 40px; padding-top: 24px; border-top: 1px solid #E5E7EB;">
        <p style="color: #6B7280; font-size: 14px; margin: 0;">
          ${t.help_text} 
          <a href="mailto:support@orcavo.com" style="color: #059669; text-decoration: none;">support@orcavo.com</a>
        </p>
      </div>
    `,
  });
}

export interface CreateCreditsReceivedEmailOptions {
  customerName: string;
  creditsReceived: number;
  planName: string;
  isRenewal: boolean;
  totalCredits: number;
  translations?: CreditsReceivedTranslations;
}

/**
 * Creates a credits received email for subscription renewals or initial credits
 */
export function createCreditsReceivedEmail({
  customerName,
  creditsReceived,
  planName,
  isRenewal,
  totalCredits,
  translations,
}: CreateCreditsReceivedEmailOptions): string {
  const t = translations ?? DEFAULT_CREDITS_RECEIVED;

  const subject = isRenewal ? t.subject_renewal : t.subject_initial;
  const title = isRenewal ? t.title_renewal : t.title_initial;
  const greeting = t.greeting.replace("{{name}}", customerName);
  const fromPlan = t.from_plan.replace("{{planName}}", planName);
  const proTip = isRenewal ? t.pro_tip_renewal : t.pro_tip_initial;

  return createEmailTemplate({
    title: subject,
    content: `
      <div style="text-align: center; margin-bottom: 32px;">
        <h1 style="color: #059669; font-size: 28px; margin-bottom: 16px;">${title}</h1>
        <p style="font-size: 18px; color: #4B5563; margin: 0;">${greeting}</p>
      </div>

      <div style="background: linear-gradient(135deg, #059669, #10B981); border-radius: 16px; padding: 32px; text-align: center; margin-bottom: 32px;">
        <div style="background: rgba(255, 255, 255, 0.95); border-radius: 12px; padding: 24px; margin-bottom: 24px;">
          <h2 style="color: #059669; font-size: 48px; font-weight: bold; margin: 0 0 8px 0;">${creditsReceived}</h2>
          <p style="color: #4B5563; font-size: 18px; margin: 0; font-weight: 500;">${t.credits_label}</p>
        </div>
        <p style="color: white; font-size: 16px; margin: 0; opacity: 0.95;">${fromPlan}</p>
      </div>

      <div style="background: #F9FAFB; border-radius: 12px; padding: 24px; margin-bottom: 32px;">
        <h3 style="color: #059669; font-size: 20px; margin: 0 0 16px 0;">${t.balance_title}</h3>
        <div style="display: flex; justify-content: space-between; align-items: center; background: white; border-radius: 8px; padding: 16px;">
          <span style="color: #4B5563; font-size: 16px;">${t.balance_label}</span>
          <span style="color: #059669; font-size: 20px; font-weight: bold;">${totalCredits}</span>
        </div>
      </div>

      <div style="text-align: center; margin: 32px 0;">
        <a href="https://app.kymaclub.com" style="background: #059669; color: white; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; display: inline-block;">${t.cta_button}</a>
      </div>

      <div style="background: #EFF6FF; border-left: 4px solid #3B82F6; padding: 20px; margin: 24px 0; border-radius: 4px;">
        <h4 style="color: #1E40AF; margin: 0 0 8px 0; font-size: 16px;">${t.pro_tip_title}</h4>
        <p style="color: #1E40AF; margin: 0; font-size: 14px;">
          ${proTip}
        </p>
      </div>

      <div style="text-align: center; margin-top: 40px; padding-top: 24px; border-top: 1px solid #E5E7EB;">
        <p style="color: #6B7280; font-size: 14px; margin: 0;">
          ${t.help_text} 
          <a href="mailto:support@orcavo.com" style="color: #059669; text-decoration: none;">support@orcavo.com</a>
        </p>
      </div>
    `,
  });
}

// Re-export types for convenience
export type { CreditsGiftTranslations, WelcomeEmailTranslations, CreditsReceivedTranslations } from "./types";
