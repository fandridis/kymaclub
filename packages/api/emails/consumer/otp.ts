/**
 * OTP/Verification email templates for consumers
 */

import { createEmailTemplate } from "../base-template";
import type { OTPEmailTranslations } from "./types";

// Default English translations for backwards compatibility
const DEFAULT_OTP_TRANSLATIONS: OTPEmailTranslations = {
  subject: "Sign in to KymaClub",
  preheader: "Your verification code is {{code}}",
  title: "Welcome back!",
  body: "Use the verification code below to sign in to your KymaClub account. This code will expire in 15 minutes for your security.",
  code_label: "Verification Code",
  warning: "Never share this code with anyone. KymaClub will never ask you for this code via phone or email.",
  ignore_notice: "If you didn't request this code, you can safely ignore this email.",
  plain_text: "Welcome to KymaClub! Your verification code is: {{code}}. This code expires in 15 minutes.",
};

export interface CreateOTPEmailOptions {
  token: string;
  translations?: OTPEmailTranslations;
}

/**
 * Creates an OTP verification email for consumer sign-in
 */
export function createOTPEmail({
  token,
  translations,
}: CreateOTPEmailOptions): string {
  const t = translations ?? DEFAULT_OTP_TRANSLATIONS;

  return createEmailTemplate({
    title: t.title,
    preheader: t.preheader.replace("{{code}}", token),
    content: `
      <h1 class="content-title">${t.title}</h1>
      <p class="content-body">
        ${t.body}
      </p>
      
      <div class="otp-code">
        <div class="otp-digits">${token}</div>
        <div class="otp-label">${t.code_label}</div>
      </div>
      
      <p style="text-align: center; color: #64748b; font-size: 14px; margin-top: 32px;">
        ${t.warning}
      </p>
      
      <p style="text-align: center; color: #64748b; font-size: 14px; margin-top: 16px;">
        ${t.ignore_notice}
      </p>
    `,
  });
}

// Re-export the type for convenience
export type { OTPEmailTranslations } from "./types";
