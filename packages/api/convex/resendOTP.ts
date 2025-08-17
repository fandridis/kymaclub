import { Email } from "@convex-dev/auth/providers/Email";
import { Resend as ResendAPI } from "resend";
import { generateOTP6 } from "@repo/utils/crypto-utils";
import { createOTPEmail } from "../emails/templates";

export const ResendOTP = Email({
    id: "resend-otp",
    apiKey: process.env.AUTH_RESEND_KEY,
    maxAge: 60 * 15, // 15 minutes
    // This function can be asynchronous
    generateVerificationToken() {
        return generateOTP6();
    },
    async sendVerificationRequest({ identifier: email, provider, token }) {
        const resend = new ResendAPI(provider.apiKey);
        const htmlContent = createOTPEmail({ token });

        const { error } = await resend.emails.send({
            from: "Orcavo <hello@app.orcavo.com>",
            to: [email],
            subject: `Sign in to KymaClub`,
            html: htmlContent,
            text: `Welcome to KymaClub! Your verification code is: ${token}. This code expires in 15 minutes.`
        });

        if (error) {
            throw new Error(JSON.stringify(error));
        }
    },
}); 