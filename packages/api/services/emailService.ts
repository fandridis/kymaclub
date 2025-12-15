import type { ActionCtx } from "../convex/_generated/server";
import { Id } from "../convex/_generated/dataModel";
import { ConvexError } from "convex/values";
import { ERROR_CODES } from "../utils/errorCodes";
import { components } from "../convex/_generated/api";
import { Resend } from "@convex-dev/resend";
import { formatCentsAsEuros } from "@repo/utils/credits";
import {
    getConsumerEmailTranslations,
    getBusinessEmailTranslations,
    interpolateText,
} from "../utils/translations";

// Consumer email templates
import {
    createBookingConfirmationEmail,
    createClassCancellationEmail,
    createCreditsGiftEmail,
    createWelcomeEmail,
    createCreditsReceivedEmail,
} from "../emails/consumer";

// Business email templates
import {
    createBusinessNewBookingEmail,
    createBusinessBookingCancelledByConsumerEmail,
    createBusinessBookingCancelledByBusinessEmail,
    createBusinessBookingAwaitingApprovalEmail,
    createBusinessBookingApprovedEmail,
    createBusinessBookingRejectedEmail,
    createReviewNotificationEmail,
} from "../emails/business";

// Base template for test emails
import { createEmailTemplate } from "../emails/base-template";

/***************************************************************
 * Email Service - Production-ready email operations with Resend
 ***************************************************************/

// Initialize Resend component with production settings
export const resend = new Resend(components.resend, {
    testMode: false, // Set to true for development/testing
    // onEmailEvent can be added later for webhook handling
});

export const emailService = {
    /**
     * Send booking notification email to business
     * Uses specific templates based on notification type
     */
    sendBookingNotificationEmail: async ({
        ctx,
        args,
    }: {
        ctx: ActionCtx;
        args: {
            businessEmail: string;
            businessName: string;
            customerName: string;
            customerEmail?: string;
            className: string;
            venueName: string;
            classTime: string;
            bookingAmount: number;
            notificationType: "booking_created" | "booking_cancelled_by_consumer" | "booking_cancelled_by_business" | "booking_awaiting_approval" | "booking_approved" | "booking_rejected";
            language?: string;
        };
    }): Promise<{ emailId: string; success: boolean }> => {
        try {
            // Format booking amount in cents to euros for business display
            const formattedAmount = formatCentsAsEuros(args.bookingAmount);

            const data = {
                businessName: args.businessName,
                customerName: args.customerName,
                customerEmail: args.customerEmail,
                className: args.className,
                venueName: args.venueName,
                classTime: args.classTime,
                bookingAmount: formattedAmount,
            };

            let htmlContent: string;
            let subject: string;

            // Use specific template based on notification type
            switch (args.notificationType) {
                case "booking_created": {
                    const t = getBusinessEmailTranslations(args.language, 'new_booking');
                    htmlContent = createBusinessNewBookingEmail({ data, translations: t });
                    subject = interpolateText(t.subject, { className: args.className });
                    break;
                }
                case "booking_cancelled_by_consumer": {
                    const t = getBusinessEmailTranslations(args.language, 'booking_cancelled_by_consumer');
                    htmlContent = createBusinessBookingCancelledByConsumerEmail({ data, translations: t });
                    subject = interpolateText(t.subject, { className: args.className });
                    break;
                }
                case "booking_cancelled_by_business": {
                    const t = getBusinessEmailTranslations(args.language, 'booking_cancelled_by_business');
                    htmlContent = createBusinessBookingCancelledByBusinessEmail({ data, translations: t });
                    subject = interpolateText(t.subject, { className: args.className });
                    break;
                }
                case "booking_awaiting_approval": {
                    const t = getBusinessEmailTranslations(args.language, 'booking_awaiting_approval');
                    htmlContent = createBusinessBookingAwaitingApprovalEmail({ data, translations: t });
                    subject = interpolateText(t.subject, { className: args.className });
                    break;
                }
                case "booking_approved": {
                    const t = getBusinessEmailTranslations(args.language, 'booking_approved');
                    htmlContent = createBusinessBookingApprovedEmail({ data, translations: t });
                    subject = interpolateText(t.subject, { className: args.className });
                    break;
                }
                case "booking_rejected": {
                    const t = getBusinessEmailTranslations(args.language, 'booking_rejected');
                    htmlContent = createBusinessBookingRejectedEmail({ data, translations: t });
                    subject = interpolateText(t.subject, { className: args.className });
                    break;
                }
            }

            const emailId = await resend.sendEmail(ctx, {
                from: "KymaClub <notifications@app.orcavo.com>",
                to: args.businessEmail,
                subject,
                html: htmlContent,
                replyTo: ["support@orcavo.com"],
            });

            return { emailId, success: true };
        } catch (error) {
            throw new ConvexError({
                message: "Failed to send email notification",
                code: ERROR_CODES.UNKNOWN_ERROR
            });
        }
    },

    /**
     * Send review notification email to business
     */
    sendReviewNotificationEmail: async ({
        ctx,
        args,
    }: {
        ctx: ActionCtx;
        args: {
            businessEmail: string;
            businessName: string;
            venueName: string;
            reviewerName?: string;
            rating: number;
            comment?: string;
            language?: string;
        };
    }): Promise<{ emailId: string; success: boolean }> => {
        try {
            const t = getBusinessEmailTranslations(args.language, 'review');

            const htmlContent = createReviewNotificationEmail({
                businessName: args.businessName,
                venueName: args.venueName,
                reviewerName: args.reviewerName,
                rating: args.rating,
                comment: args.comment,
                translations: t,
            });

            const subject = interpolateText(t.subject, { venueName: args.venueName });

            const emailId = await resend.sendEmail(ctx, {
                from: "KymaClub <notifications@app.orcavo.com>",
                to: args.businessEmail,
                subject,
                html: htmlContent,
                replyTo: ["support@orcavo.com"],
            });

            return { emailId, success: true };
        } catch (error) {
            throw new ConvexError({
                message: "Failed to send review notification email",
                code: ERROR_CODES.UNKNOWN_ERROR
            });
        }
    },

    /**
     * Send booking confirmation email to customer
     */
    sendBookingConfirmationEmail: async ({
        ctx,
        args,
    }: {
        ctx: ActionCtx;
        args: {
            customerEmail: string;
            customerName: string;
            className: string;
            venueName: string;
            venueAddress: string;
            instructorName: string;
            startTime: number;
            bookingAmount: number;
            language?: string;
        };
    }): Promise<{ emailId: string; success: boolean }> => {
        try {
            const t = getConsumerEmailTranslations(args.language, 'booking_confirmation');

            const htmlContent = createBookingConfirmationEmail({
                className: args.className,
                venueName: args.venueName,
                venueLocation: args.venueAddress,
                startTime: new Date(args.startTime).toISOString(),
                instructorName: args.instructorName,
                translations: t,
            });

            const subject = interpolateText(t.subject, { className: args.className });

            const emailId = await resend.sendEmail(ctx, {
                from: "KymaClub <bookings@app.orcavo.com>",
                to: args.customerEmail,
                subject,
                html: htmlContent,
                replyTo: ["support@orcavo.com"],
            });

            return { emailId, success: true };

        } catch (error) {
            throw new ConvexError({
                message: "Failed to send confirmation email",
                code: ERROR_CODES.UNKNOWN_ERROR
            });
        }
    },

    /**
     * Send class cancellation email to customer
     */
    sendClassCancellationEmail: async ({
        ctx,
        args,
    }: {
        ctx: ActionCtx;
        args: {
            customerEmail: string;
            customerName: string;
            className: string;
            venueName: string;
            startTime: number;
            refundAmount: number;
            language?: string;
        };
    }): Promise<{ emailId: string; success: boolean }> => {
        try {
            const t = getConsumerEmailTranslations(args.language, 'class_cancellation');

            const htmlContent = createClassCancellationEmail({
                className: args.className,
                venueName: args.venueName,
                startTime: new Date(args.startTime).toISOString(),
                refundAmount: args.refundAmount,
                translations: t,
            });

            const subject = interpolateText(t.subject, { className: args.className });

            const emailId = await resend.sendEmail(ctx, {
                from: "KymaClub <notifications@app.orcavo.com>",
                to: args.customerEmail,
                subject,
                html: htmlContent,
                replyTo: ["support@orcavo.com"],
            });

            return { emailId, success: true };

        } catch (error) {
            console.error("Failed to send class cancellation email:", error);
            throw new ConvexError({
                message: "Failed to send cancellation email",
                code: ERROR_CODES.UNKNOWN_ERROR
            });
        }
    },

    /**
     * Get email status by ID
     */
    getEmailStatus: async ({
        ctx,
        emailId,
    }: {
        ctx: ActionCtx;
        emailId: any; // Using any for now to work with branded EmailId type
    }): Promise<{
        status: "waiting" | "queued" | "cancelled" | "sent" | "delivered" | "delivery_delayed" | "bounced" | "failed";
        opened: boolean;
        complained: boolean;
        errorMessage: string | null;
    } | null> => {
        try {
            return await resend.status(ctx, emailId);
        } catch (error) {
            console.error("Failed to get email status:", error);
            return null;
        }
    },

    /**
     * Cancel email by ID (only works if not yet sent)
     */
    cancelEmail: async ({
        ctx,
        emailId,
    }: {
        ctx: ActionCtx;
        emailId: any; // Using any for now to work with branded EmailId type
    }): Promise<{ success: boolean }> => {
        try {
            await resend.cancelEmail(ctx, emailId);
            return { success: true };
        } catch (error) {
            return { success: false };
        }
    },

    /**
     * Send test email (for development/debugging)
     */
    sendTestEmail: async ({
        ctx,
        args,
    }: {
        ctx: ActionCtx;
        args: {
            to: string;
            subject: string;
            content: string;
        };
    }): Promise<{ emailId: string; success: boolean }> => {
        try {
            const htmlContent = createEmailTemplate({
                title: args.subject,
                content: `
                    <h1 class="content-title">Test Email</h1>
                    <div class="content-body">
                        ${args.content}
                    </div>
                `
            });

            const emailId = await resend.sendEmail(ctx, {
                from: "KymaClub <test@app.orcavo.com>",
                to: args.to,
                subject: `[TEST] ${args.subject}`,
                html: htmlContent,
            });

            return { emailId, success: true };
        } catch (error) {
            throw new ConvexError({
                message: "Failed to send test email",
                code: ERROR_CODES.UNKNOWN_ERROR
            });
        }
    },

    /**
     * Send credits gifted email to customer (admin gift)
     */
    sendCreditsGiftEmail: async ({
        ctx,
        args,
    }: {
        ctx: ActionCtx;
        args: {
            customerEmail: string;
            customerName: string;
            creditsGifted: number;
            totalCredits: number;
            giftMessage?: string;
            language?: string;
        };
    }): Promise<{ emailId: string; success: boolean }> => {
        try {
            const t = getConsumerEmailTranslations(args.language, 'credits_gift');

            const htmlContent = createCreditsGiftEmail({
                customerName: args.customerName,
                creditsGifted: args.creditsGifted,
                totalCredits: args.totalCredits,
                giftMessage: args.giftMessage,
                translations: t,
            });

            const subject = interpolateText(t.subject, { credits: args.creditsGifted });

            const emailId = await resend.sendEmail(ctx, {
                from: "KymaClub <credits@app.orcavo.com>",
                to: args.customerEmail,
                subject,
                html: htmlContent,
                replyTo: ["support@orcavo.com"],
            });

            return { emailId, success: true };

        } catch (error) {
            console.error("Failed to send credits gifted email:", error);
            throw new ConvexError({
                message: "Failed to send credits gifted email",
                code: ERROR_CODES.UNKNOWN_ERROR
            });
        }
    },

    /**
     * Send welcome email to new consumer with free class coupon
     */
    sendWelcomeEmail: async ({
        ctx,
        args,
    }: {
        ctx: ActionCtx;
        args: {
            customerEmail: string;
            customerName: string;
            welcomeCouponId: Id<"userCoupons">;
            language?: string;
        };
    }): Promise<{ emailId: string; success: boolean }> => {
        try {
            const t = getConsumerEmailTranslations(args.language, 'welcome');

            const htmlContent = createWelcomeEmail({
                customerName: args.customerName,
                hasFreeClassCoupon: true,
                translations: t,
            });

            const subject = t.subject;

            const emailId = await resend.sendEmail(ctx, {
                from: "KymaClub <welcome@app.orcavo.com>",
                to: args.customerEmail,
                subject,
                html: htmlContent,
                replyTo: ["support@orcavo.com"],
            });

            return { emailId, success: true };

        } catch (error) {
            console.error("Failed to send welcome email:", error);
            throw new ConvexError({
                message: "Failed to send welcome email",
                code: ERROR_CODES.UNKNOWN_ERROR
            });
        }
    },

    /**
     * Send credits received email to customer (subscription)
     */
    sendCreditsReceivedEmail: async ({
        ctx,
        args,
    }: {
        ctx: ActionCtx;
        args: {
            customerEmail: string;
            customerName: string;
            creditsReceived: number;
            planName: string;
            isRenewal: boolean;
            totalCredits: number;
            language?: string;
        };
    }): Promise<{ emailId: string; success: boolean }> => {
        try {
            const t = getConsumerEmailTranslations(args.language, 'credits_received');

            const htmlContent = createCreditsReceivedEmail({
                customerName: args.customerName,
                creditsReceived: args.creditsReceived,
                planName: args.planName,
                isRenewal: args.isRenewal,
                totalCredits: args.totalCredits,
                translations: t,
            });

            const subject = args.isRenewal ? t.subject_renewal : t.subject_initial;

            const emailId = await resend.sendEmail(ctx, {
                from: "KymaClub <credits@app.orcavo.com>",
                to: args.customerEmail,
                subject,
                html: htmlContent,
                replyTo: ["support@orcavo.com"],
            });

            return { emailId, success: true };

        } catch (error) {
            console.error("Failed to send credits received email:", error);
            throw new ConvexError({
                message: "Failed to send credits received email",
                code: ERROR_CODES.UNKNOWN_ERROR
            });
        }
    },
};
