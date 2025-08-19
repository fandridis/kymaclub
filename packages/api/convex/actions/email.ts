"use node";

import { internalAction } from "../_generated/server";
import { v } from "convex/values";
import { emailService } from "../../services/emailService";

/***************************************************************
 * Email Notification Actions - Production-ready with Resend
 ***************************************************************/

/**
 * Send booking notification email to business
 */
export const sendBookingNotificationEmail = internalAction({
    args: v.object({
        businessEmail: v.string(),
        businessName: v.string(),
        customerName: v.string(),
        customerEmail: v.optional(v.string()),
        className: v.string(),
        venueName: v.string(),
        classTime: v.string(),
        bookingAmount: v.number(),
        notificationType: v.union(v.literal("booking_created"), v.literal("booking_cancelled"), v.literal("booking_cancelled_by_business")),
    }),
    handler: async (ctx, args) => {
        try {
            const result = await emailService.sendBookingNotificationEmail({
                ctx,
                args: {
                    businessEmail: args.businessEmail,
                    businessName: args.businessName,
                    customerName: args.customerName,
                    customerEmail: args.customerEmail,
                    className: args.className,
                    venueName: args.venueName,
                    classTime: args.classTime,
                    bookingAmount: args.bookingAmount,
                    notificationType: args.notificationType,
                }
            });

            console.log(`✅ Booking notification email queued successfully - EmailId: ${result.emailId}`);
            return { 
                success: true, 
                emailSent: true, 
                emailId: result.emailId,
                reason: "Email sent successfully" 
            };

        } catch (error) {
            console.error("Failed to send booking notification email:", error);
            return { 
                success: false, 
                emailSent: false, 
                reason: error instanceof Error ? error.message : "Unknown error" 
            };
        }
    }
});

/**
 * Send booking confirmation email to customer
 */
export const sendBookingConfirmationEmail = internalAction({
    args: v.object({
        customerEmail: v.string(),
        customerName: v.string(),
        className: v.string(),
        venueName: v.string(),
        venueAddress: v.string(),
        instructorName: v.string(),
        startTime: v.number(),
        bookingAmount: v.number(),
    }),
    handler: async (ctx, args) => {
        try {
            const result = await emailService.sendBookingConfirmationEmail({
                ctx,
                args: {
                    customerEmail: args.customerEmail,
                    customerName: args.customerName,
                    className: args.className,
                    venueName: args.venueName,
                    venueAddress: args.venueAddress,
                    instructorName: args.instructorName,
                    startTime: args.startTime,
                    bookingAmount: args.bookingAmount,
                }
            });

            console.log(`✅ Booking confirmation email queued successfully - EmailId: ${result.emailId}`);
            return { 
                success: true, 
                emailSent: true, 
                emailId: result.emailId,
                reason: "Email sent successfully" 
            };

        } catch (error) {
            console.error("Failed to send booking confirmation email:", error);
            return { 
                success: false, 
                emailSent: false, 
                reason: error instanceof Error ? error.message : "Unknown error" 
            };
        }
    }
});

/**
 * Send test email (for development/debugging)
 */
export const sendTestEmail = internalAction({
    args: v.object({
        to: v.string(),
        subject: v.string(),
        content: v.string(),
    }),
    handler: async (ctx, args) => {
        try {
            const result = await emailService.sendTestEmail({
                ctx,
                args: {
                    to: args.to,
                    subject: args.subject,
                    content: args.content,
                }
            });

            console.log(`✅ Test email queued successfully - EmailId: ${result.emailId}`);
            return { 
                success: true, 
                emailSent: true, 
                emailId: result.emailId,
                reason: "Test email sent successfully" 
            };

        } catch (error) {
            console.error("Failed to send test email:", error);
            return { 
                success: false, 
                emailSent: false, 
                reason: error instanceof Error ? error.message : "Unknown error" 
            };
        }
    }
});