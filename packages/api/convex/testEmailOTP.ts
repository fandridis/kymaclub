import { Email } from "@convex-dev/auth/providers/Email";

export const TEST_EMAIL = "kymaclub@tester.com";
export const TEST_OTP_CODE = "123456";

export const TestEmailOTP = Email({
  id: "test-email-otp",
  apiKey: "not-needed",
  maxAge: 60 * 60 * 24, // 24 hours for testing convenience
  generateVerificationToken() {
    return TEST_OTP_CODE;
  },
  async sendVerificationRequest({ identifier: email, token }) {
    console.log(`[TestEmailOTP] Skipping email for ${email}, code: ${token}`);
    // No actual email sent - this is intentional for test accounts
  },
});
