import { Email } from "@convex-dev/auth/providers/Email";
import { Resend as ResendAPI } from "resend";
import { generateOTP6 } from "@repo/utils/crypto-utils";
import { createOTPEmail } from "../emails/templates";

export const ResendOTPPasswordReset = Email({
    id: "resend-otp-password-reset",
    apiKey: process.env.AUTH_RESEND_KEY,
    maxAge: 60 * 15, // 15 minutes
    generateVerificationToken() {
        return generateOTP6();
    },
    async sendVerificationRequest({ identifier: email, provider, token }) {
        const resend = new ResendAPI(provider.apiKey);
        // We can reuse the OTP email template or create a specific one for password reset if needed.
        // For now, reusing the generic one but with a specific subject/text.
        const htmlContent = createOTPEmail({ token });

        const { error } = await resend.emails.send({
            from: "Orcavo <hello@app.orcavo.com>",
            to: [email],
            subject: `Reset your password - Orcavo`,
            html: htmlContent,
            text: `Reset your password. Your verification code is: ${token}. This code expires in 15 minutes.`,
        });

        if (error) {
            throw new Error(JSON.stringify(error));
        }
    },
});
