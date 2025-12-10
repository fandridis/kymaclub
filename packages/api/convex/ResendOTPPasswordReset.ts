import { Email } from "@convex-dev/auth/providers/Email";
import { Resend as ResendAPI } from "resend";
import { generateOTP6 } from "@repo/utils/crypto-utils";
import { createOTPEmail } from "../emails/consumer";
import { getOTPEmailTranslations, interpolateText, DEFAULT_LANGUAGE } from "../utils/translations";
import { internal } from "./_generated/api";
import type { GenericActionCtx } from "convex/server";
import type { DataModel } from "./_generated/dataModel";

// Type for the email verification request params
// @convex-dev/auth extends Auth.js types but passes ctx as second parameter
interface EmailVerificationParams {
    identifier: string;
    provider: { apiKey?: string };
    token: string;
}

export const ResendOTPPasswordReset = Email({
    id: "resend-otp-password-reset",
    apiKey: process.env.AUTH_RESEND_KEY,
    maxAge: 60 * 60 * 24, // 24 hours
    generateVerificationToken() {
        return generateOTP6();
    },
    // Note: @convex-dev/auth passes ctx as second parameter at runtime,
    // but Auth.js types don't reflect this. Using type assertion.
    sendVerificationRequest: (async (
        params: EmailVerificationParams,
        ctx: GenericActionCtx<DataModel>
    ) => {
        const { identifier: email, provider, token } = params;
        const resend = new ResendAPI(provider.apiKey);

        // Get language preference from pending auth languages table
        let language: string = DEFAULT_LANGUAGE;

        try {
            const pendingLang = await ctx.runQuery(
                internal.queries.core.getPendingAuthLanguage,
                { email: email.toLowerCase().trim() }
            );

            if (pendingLang?.language) {
                language = pendingLang.language;

                // Clean up the pending language record
                await ctx.runMutation(
                    internal.mutations.core.deletePendingAuthLanguage,
                    { email: email.toLowerCase().trim() }
                );
            }
        } catch (error) {
            // Log but don't fail - fallback to default language
            console.warn('[ResendOTPPasswordReset] Failed to get pending auth language:', error);
        }

        // Get translated content for password reset
        const t = getOTPEmailTranslations(language, 'otp_password_reset');

        const htmlContent = createOTPEmail({
            token,
            translations: t,
        });

        const { error } = await resend.emails.send({
            from: "Orcavo <hello@app.orcavo.com>",
            to: [email],
            subject: t.subject,
            html: htmlContent,
            text: interpolateText(t.plain_text, { code: token })
        });

        if (error) {
            throw new Error(JSON.stringify(error));
        }
    }) as any,
});
