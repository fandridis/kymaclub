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
        notificationType: v.union(v.literal("booking_created"), v.literal("booking_cancelled_by_consumer"), v.literal("booking_cancelled_by_business")),
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

            return {
                success: true,
                emailSent: true,
                emailId: result.emailId,
                reason: "Email sent successfully"
            };

        } catch (error) {
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

/**
 * Send credits gifted email to customer (admin gift)
 */
export const sendCreditsGiftedEmail = internalAction({
    args: v.object({
        customerEmail: v.string(),
        customerName: v.string(),
        creditsGifted: v.number(),
        totalCredits: v.number(),
        giftMessage: v.optional(v.string()),
    }),
    handler: async (ctx, args) => {
        try {
            const result = await emailService.sendCreditsGiftedEmail({
                ctx,
                args: {
                    customerEmail: args.customerEmail,
                    customerName: args.customerName,
                    creditsGifted: args.creditsGifted,
                    totalCredits: args.totalCredits,
                    giftMessage: args.giftMessage,
                }
            });

            return {
                success: true,
                emailSent: true,
                emailId: result.emailId,
                reason: "Credits gifted email sent successfully"
            };

        } catch (error) {
            console.error("Failed to send credits gifted email:", error);
            return {
                success: false,
                emailSent: false,
                reason: error instanceof Error ? error.message : "Unknown error"
            };
        }
    }
});

/**
 * Send welcome email to new consumer
 */
export const sendWelcomeEmail = internalAction({
    args: v.object({
        customerEmail: v.string(),
        customerName: v.string(),
        welcomeCredits: v.number(),
    }),
    handler: async (ctx, args) => {
        try {
            const result = await emailService.sendWelcomeEmail({
                ctx,
                args: {
                    customerEmail: args.customerEmail,
                    customerName: args.customerName,
                    welcomeCredits: args.welcomeCredits,
                }
            });

            return {
                success: true,
                emailSent: true,
                emailId: result.emailId,
                reason: "Welcome email sent successfully"
            };

        } catch (error) {
            console.error("Failed to send welcome email:", error);
            return {
                success: false,
                emailSent: false,
                reason: error instanceof Error ? error.message : "Unknown error"
            };
        }
    }
});

/**
 * Send credits received email to customer
 */
export const sendCreditsReceivedEmail = internalAction({
    args: v.object({
        customerEmail: v.string(),
        customerName: v.string(),
        creditsReceived: v.number(),
        planName: v.string(),
        isRenewal: v.boolean(),
        totalCredits: v.number(),
    }),
    handler: async (ctx, args) => {
        try {
            const result = await emailService.sendCreditsReceivedEmail({
                ctx,
                args: {
                    customerEmail: args.customerEmail,
                    customerName: args.customerName,
                    creditsReceived: args.creditsReceived,
                    planName: args.planName,
                    isRenewal: args.isRenewal,
                    totalCredits: args.totalCredits,
                }
            });

            return {
                success: true,
                emailSent: true,
                emailId: result.emailId,
                reason: "Email sent successfully"
            };

        } catch (error) {
            console.error("Failed to send credits received email:", error);
            return {
                success: false,
                emailSent: false,
                reason: error instanceof Error ? error.message : "Unknown error"
            };
        }
    }
});

/**
 * Send review notification email to business
 */
export const sendReviewNotificationEmail = internalAction({
    args: v.object({
        businessEmail: v.string(),
        businessName: v.string(),
        venueName: v.string(),
        reviewerName: v.optional(v.string()),
        rating: v.number(),
        comment: v.optional(v.string()),
    }),
    handler: async (ctx, args) => {
        try {
            const result = await emailService.sendReviewNotificationEmail({
                ctx,
                args: {
                    businessEmail: args.businessEmail,
                    businessName: args.businessName,
                    venueName: args.venueName,
                    reviewerName: args.reviewerName,
                    rating: args.rating,
                    comment: args.comment,
                }
            });

            return {
                success: true,
                emailSent: true,
                emailId: result.emailId,
                reason: "Email sent successfully",
            };
        } catch (error) {
            return {
                success: false,
                emailSent: false,
                reason: error instanceof Error ? error.message : "Unknown error",
            };
        }
    }
});

/**
 * Send class cancellation email to customer
 */
export const sendClassCancellationEmail = internalAction({
    args: v.object({
        customerEmail: v.string(),
        customerName: v.string(),
        className: v.string(),
        venueName: v.string(),
        startTime: v.number(),
        refundAmount: v.number(),
    }),
    handler: async (ctx, args) => {
        try {
            const result = await emailService.sendClassCancellationEmail({
                ctx,
                args: {
                    customerEmail: args.customerEmail,
                    customerName: args.customerName,
                    className: args.className,
                    venueName: args.venueName,
                    startTime: args.startTime,
                    refundAmount: args.refundAmount,
                }
            });

            return {
                success: true,
                emailSent: true,
                emailId: result.emailId,
                reason: "Class cancellation email sent successfully",
            };
        } catch (error) {
            console.error("Failed to send class cancellation email:", error);
            return {
                success: false,
                emailSent: false,
                reason: error instanceof Error ? error.message : "Unknown error",
            };
        }
    }
});
