import { Email } from "@convex-dev/auth/providers/Email";
import { Resend as ResendAPI } from "resend";
import { generateOTP8 } from "@repo/utils/crypto-utils";


export const ResendOTP = Email({
    id: "resend-otp",
    apiKey: process.env.AUTH_RESEND_KEY,
    maxAge: 60 * 15, // 15 minutes
    // This function can be asynchronous
    generateVerificationToken() {
        return generateOTP8();
    },
    async sendVerificationRequest({ identifier: email, provider, token }) {
        const resend = new ResendAPI(provider.apiKey);
        const { error } = await resend.emails.send({
            from: "Orcavo <hello@app.orcavo.com>",
            to: [email],
            subject: `Sign in to Orcavo`,
            text: "Your code is " + token,
        });

        if (error) {
            throw new Error(JSON.stringify(error));
        }
    },
}); 