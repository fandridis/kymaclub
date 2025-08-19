import type { ActionCtx } from "../convex/_generated/server";
import { ConvexError } from "convex/values";
import { ERROR_CODES } from "../utils/errorCodes";
import { components } from "../convex/_generated/api";
import { Resend } from "@convex-dev/resend";
import { createBusinessNotificationEmail } from "../emails/templates";
import { createBookingConfirmationEmail } from "../emails/templates";
import { createClassCancellationEmail } from "../emails/templates";
import { createEmailTemplate } from "../emails/templates";

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

            console.log(`✅ Email sent successfully - EmailId: ${emailId}`);
            return { emailId, success: true };

        } catch (error) {
            console.error("Failed to send booking notification email:", error);
            throw new ConvexError({
                message: "Failed to send email notification",
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

            console.log(`✅ Booking confirmation email sent - EmailId: ${emailId}`);
            return { emailId, success: true };

        } catch (error) {
            console.error("Failed to send booking confirmation email:", error);
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

            console.log(`✅ Class cancellation email sent - EmailId: ${emailId}`);
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
            console.log(`✅ Email cancelled successfully - EmailId: ${emailId}`);
            return { success: true };
        } catch (error) {
            console.error("Failed to cancel email:", error);
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

            console.log(`✅ Test email sent - EmailId: ${emailId}`);
            return { emailId, success: true };

        } catch (error) {
            console.error("Failed to send test email:", error);
            throw new ConvexError({
                message: "Failed to send test email",
                code: ERROR_CODES.UNKNOWN_ERROR
            });
        }
    },
};