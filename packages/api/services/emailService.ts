import type { ActionCtx } from "../convex/_generated/server";
import { ConvexError } from "convex/values";
import { ERROR_CODES } from "../utils/errorCodes";
import { components } from "../convex/_generated/api";
import { Resend } from "@convex-dev/resend";
import { createBusinessNotificationEmail } from "../emails/templates";
import { createBookingConfirmationEmail } from "../emails/templates";
import { createClassCancellationEmail } from "../emails/templates";
import { createEmailTemplate } from "../emails/templates";
import { createReviewNotificationEmail } from "../emails/templates";

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
            notificationType: "booking_created" | "booking_cancelled_by_consumer" | "booking_cancelled_by_business";
        };
    }): Promise<{ emailId: string; success: boolean }> => {
        try {
            const subject = args.notificationType === "booking_created"
                ? `New Booking: ${args.className}`
                : args.notificationType === "booking_cancelled_by_consumer"
                    ? `Booking Cancelled: ${args.className}`
                    : `Your Booking Cancelled: ${args.className}`;

            const htmlContent = createBusinessNotificationEmail({
                businessName: args.businessName,
                customerName: args.customerName,
                customerEmail: args.customerEmail,
                className: args.className,
                venueName: args.venueName,
                classTime: args.classTime,
                bookingAmount: args.bookingAmount,
                notificationType: args.notificationType,
            });

            const emailId = await resend.sendEmail(ctx, {
                from: "KymaClub <notifications@app.orcavo.com>",
                to: args.businessEmail,
                subject: subject,
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
        };
    }): Promise<{ emailId: string; success: boolean }> => {
        try {
            const subject = "New user review!";

            const htmlContent = createReviewNotificationEmail({
                businessName: args.businessName,
                venueName: args.venueName,
                reviewerName: args.reviewerName,
                rating: args.rating,
                comment: args.comment,
            });

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
        };
    }): Promise<{ emailId: string; success: boolean }> => {
        try {
            const htmlContent = createBookingConfirmationEmail({
                className: args.className,
                venueName: args.venueName,
                venueLocation: args.venueAddress,
                startTime: new Date(args.startTime).toISOString(),
                instructorName: args.instructorName,
            });

            const emailId = await resend.sendEmail(ctx, {
                from: "KymaClub <bookings@app.orcavo.com>",
                to: args.customerEmail,
                subject: `Booking Confirmed: ${args.className}`,
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
        };
    }): Promise<{ emailId: string; success: boolean }> => {
        try {
            const htmlContent = createClassCancellationEmail({
                className: args.className,
                venueName: args.venueName,
                startTime: new Date(args.startTime).toISOString(),
                refundAmount: args.refundAmount,
            });

            const emailId = await resend.sendEmail(ctx, {
                from: "KymaClub <notifications@app.orcavo.com>",
                to: args.customerEmail,
                subject: `Class Cancelled: ${args.className}`,
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
     * Send credits received email to customer
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
        };
    }): Promise<{ emailId: string; success: boolean }> => {
        try {
            const subject = args.isRenewal
                ? `Your monthly credits have arrived! 🎉`
                : `Welcome! Your subscription credits are ready 🚀`;

            const htmlContent = createEmailTemplate({
                title: subject,
                content: `
                    <div style="text-align: center; margin-bottom: 32px;">
                        <h1 style="color: #059669; font-size: 28px; margin-bottom: 16px;">${args.isRenewal ? '🎉 Monthly Credits Renewed!' : '🚀 Welcome Credits!'}</h1>
                        <p style="font-size: 18px; color: #4B5563; margin: 0;">Hi ${args.customerName}!</p>
                    </div>

                    <div style="background: linear-gradient(135deg, #059669, #10B981); border-radius: 16px; padding: 32px; text-align: center; margin-bottom: 32px;">
                        <div style="background: rgba(255, 255, 255, 0.95); border-radius: 12px; padding: 24px; margin-bottom: 24px;">
                            <h2 style="color: #059669; font-size: 48px; font-weight: bold; margin: 0 0 8px 0;">${args.creditsReceived}</h2>
                            <p style="color: #4B5563; font-size: 18px; margin: 0; font-weight: 500;">Credits Added</p>
                        </div>
                        <p style="color: white; font-size: 16px; margin: 0; opacity: 0.95;">From your ${args.planName}</p>
                    </div>

                    <div style="background: #F9FAFB; border-radius: 12px; padding: 24px; margin-bottom: 32px;">
                        <h3 style="color: #059669; font-size: 20px; margin: 0 0 16px 0;">📊 Your Credit Balance</h3>
                        <div style="display: flex; justify-content: space-between; align-items: center; background: white; border-radius: 8px; padding: 16px;">
                            <span style="color: #4B5563; font-size: 16px;">Total Credits Available</span>
                            <span style="color: #059669; font-size: 20px; font-weight: bold;">${args.totalCredits}</span>
                        </div>
                    </div>

                    <div style="text-align: center; margin: 32px 0;">
                        <a href="https://app.orcavo.com" style="background: #059669; color: white; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; display: inline-block;">Book Your Next Class</a>
                    </div>

                    <div style="background: #EFF6FF; border-left: 4px solid #3B82F6; padding: 20px; margin: 24px 0; border-radius: 4px;">
                        <h4 style="color: #1E40AF; margin: 0 0 8px 0; font-size: 16px;">💡 Pro Tip</h4>
                        <p style="color: #1E40AF; margin: 0; font-size: 14px;">
                            ${args.isRenewal
                        ? 'Your credits renew monthly, so make sure to use them before your next billing cycle!'
                        : 'Welcome to KymaClub! Use your credits to book amazing fitness classes across the city.'
                    }
                        </p>
                    </div>

                    <div style="text-align: center; margin-top: 40px; padding-top: 24px; border-top: 1px solid #E5E7EB;">
                        <p style="color: #6B7280; font-size: 14px; margin: 0;">
                            Questions? We're here to help! Contact us at 
                            <a href="mailto:support@orcavo.com" style="color: #059669; text-decoration: none;">support@orcavo.com</a>
                        </p>
                    </div>
                `
            });

            const emailId = await resend.sendEmail(ctx, {
                from: "KymaClub <credits@app.orcavo.com>",
                to: args.customerEmail,
                subject: subject,
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
