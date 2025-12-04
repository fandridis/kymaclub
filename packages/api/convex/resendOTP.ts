import { Email } from "@convex-dev/auth/providers/Email";
import { Resend as ResendAPI } from "resend";
import { generateOTP6 } from "@repo/utils/crypto-utils";
import { createOTPEmail } from "../emails/templates";
import { getOTPEmailTranslations, interpolateText, DEFAULT_LANGUAGE } from "../utils/translations";
import { internal } from "./_generated/api";
import type { GenericActionCtx } from "convex/server";
import type { DataModel } from "./_generated/dataModel";

export const ResendOTP = Email({
    id: "resend-otp",
    apiKey: process.env.AUTH_RESEND_KEY,
    maxAge: 60 * 15, // 15 minutes
    // This function can be asynchronous
    generateVerificationToken() {
        return generateOTP6();
    },
    async sendVerificationRequest({ identifier: email, provider, token }, ctx) {
        const resend = new ResendAPI(provider.apiKey);
        
        // Get language preference from pending auth languages table
        let language: string = DEFAULT_LANGUAGE;
        
        try {
            // ctx is passed as the second parameter by @convex-dev/auth
            const actionCtx = ctx as GenericActionCtx<DataModel>;
            const pendingLang = await actionCtx.runQuery(
                internal.queries.core.getPendingAuthLanguage,
                { email: email.toLowerCase().trim() }
            );
            
            if (pendingLang?.language) {
                language = pendingLang.language;
                
                // Clean up the pending language record
                await actionCtx.runMutation(
                    internal.mutations.core.deletePendingAuthLanguage,
                    { email: email.toLowerCase().trim() }
                );
            }
        } catch (error) {
            // Log but don't fail - fallback to default language
            console.warn('[ResendOTP] Failed to get pending auth language:', error);
        }
        
        // Get translated content
        const t = getOTPEmailTranslations(language, 'otp_sign_in');
        
        const htmlContent = createOTPEmail({ 
            token, 
            translations: {
                title: t.title,
                body: t.body,
                code_label: t.code_label,
                warning: t.warning,
                ignore_notice: t.ignore_notice,
            }
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
    },
});
