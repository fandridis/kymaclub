import { internalMutation } from "../_generated/server";
import { Infer, v } from "convex/values";
import { getAuthenticatedUserOrThrow } from "../utils";
import { notificationService } from "../../services/notificationService";
import { notificationsFields } from "../schema";
import { omit } from "convex-helpers";
import { mutationWithTriggers } from "../triggers";

/***************************************************************
 * Create Notification
 ***************************************************************/
export const createNotificationArgs = v.object({
    notification: v.object({
        ...omit(notificationsFields, [
            'createdAt', 'createdBy', 'updatedAt', 'updatedBy',
            'seen', 'seenAt', 'deliveryStatus', 'failureReason', 'retryCount',
            'sentToEmail', 'sentToWeb', 'sentToPush', 'deleted', 'deletedAt', 'deletedBy'
        ])
    })
});
export type CreateNotificationArgs = Infer<typeof createNotificationArgs>;

export const createNotification = mutationWithTriggers({
    args: createNotificationArgs,
    handler: async (ctx, args) => {
        const user = await getAuthenticatedUserOrThrow(ctx);
        return notificationService.createNotification({ ctx, args: args.notification, user });
    }
});

/***************************************************************
 * Mark Notification as Seen
 ***************************************************************/
export const markNotificationSeenArgs = v.object({
    notificationId: v.id("notifications")
});
export type MarkNotificationSeenArgs = Infer<typeof markNotificationSeenArgs>;

export const markNotificationSeen = mutationWithTriggers({
    args: markNotificationSeenArgs,
    handler: async (ctx, args) => {
        const user = await getAuthenticatedUserOrThrow(ctx);
        return notificationService.markNotificationSeen({ ctx, args, user });
    }
});

/***************************************************************
 * Update Notification Delivery Status
 ***************************************************************/
export const updateNotificationDeliveryStatusArgs = v.object({
    notificationId: v.id("notifications"),
    deliveryStatus: v.union(v.literal("pending"), v.literal("sent"), v.literal("failed")),
    failureReason: v.optional(v.string()),
    sentToEmail: v.optional(v.boolean()),
    sentToWeb: v.optional(v.boolean()),
    sentToPush: v.optional(v.boolean()),
});
export type UpdateNotificationDeliveryStatusArgs = Infer<typeof updateNotificationDeliveryStatusArgs>;

export const updateNotificationDeliveryStatus = mutationWithTriggers({
    args: updateNotificationDeliveryStatusArgs,
    handler: async (ctx, args) => {
        const user = await getAuthenticatedUserOrThrow(ctx);
        return notificationService.updateNotificationDeliveryStatus({ ctx, args, user });
    }
});

/***************************************************************
 * Handle New Class Booking Event
 ***************************************************************/
export const handleNewClassBookingEvent = internalMutation({
    args: v.object({
        payload: v.object({
            bookingId: v.id("bookings"),
            userId: v.id("users"),
            classInstanceId: v.id("classInstances"),
            businessId: v.id("businesses"),
            creditsPaid: v.number(),
        })
    }),
    handler: async (ctx, args) => {
        return await notificationService.handleNewClassBookingEvent({ ctx, payload: args.payload });
    }
});

/***************************************************************
 * Handle User Cancelled Booking Event
 ***************************************************************/
export const handleUserCancelledBookingEvent = internalMutation({
    args: v.object({
        payload: v.object({
            bookingId: v.id("bookings"),
            userId: v.id("users"),
            classInstanceId: v.id("classInstances"),
            businessId: v.id("businesses"),
            creditsPaid: v.number(),
        })
    }),
    handler: async (ctx, args) => {
        return await notificationService.handleUserCancelledBookingEvent({ ctx, payload: args.payload });
    }
});

/***************************************************************
 * Handle Business Cancelled Booking Event
 ***************************************************************/
export const handleBusinessCancelledBookingEvent = internalMutation({
    args: v.object({
        payload: v.object({
            bookingId: v.id("bookings"),
            userId: v.id("users"),
            classInstanceId: v.id("classInstances"),
            businessId: v.id("businesses"),
            creditsPaid: v.number(),
        })
    }),
    handler: async (ctx, args) => {
        return await notificationService.handleBusinessCancelledBookingEvent({ ctx, payload: args.payload });
    }
});

/***************************************************************
 * Handle Rebookable Booking Event
 ***************************************************************/
export const handleRebookableBookingEvent = internalMutation({
    args: v.object({
        payload: v.object({
            bookingId: v.id("bookings"),
            userId: v.id("users"),
            classInstanceId: v.id("classInstances"),
            businessId: v.id("businesses"),
            creditsPaid: v.number(),
        })
    }),
    handler: async (ctx, args) => {
        return await notificationService.handleBookingBecameRebookableEvent({ ctx, payload: args.payload });
    }
});

/***************************************************************
 * Handle Subscription Credits Received Event
 ***************************************************************/
export const handleSubscriptionCreditsReceivedEvent = internalMutation({
    args: v.object({
        payload: v.object({
            subscriptionEventId: v.id("subscriptionEvents"),
            subscriptionId: v.id("subscriptions"),
            userId: v.id("users"),
            creditsAllocated: v.number(),
            eventType: v.string(),
            planName: v.string(),
        })
    }),
    handler: async (ctx, args) => {
        return await notificationService.handleSubscriptionCreditsReceivedEvent({ ctx, payload: args.payload });
    }
});

/***************************************************************
 * Handle Welcome Bonus Event
 ***************************************************************/
export const handleWelcomeBonusEvent = internalMutation({
    args: v.object({
        payload: v.object({
            userId: v.id("users"),
            welcomeCredits: v.number(),
        }),
    }),
    handler: async (ctx, args) => {
        return await notificationService.handleWelcomeBonusEvent({ ctx, payload: args.payload });
    },
});

/***************************************************************
 * Handle Review Approved Event
 ***************************************************************/
export const handleReviewApprovedEvent = internalMutation({
    args: v.object({
        payload: v.object({
            reviewId: v.id("venueReviews"),
            businessId: v.id("businesses"),
        })
    }),
    handler: async (ctx, args) => {
        return await notificationService.handleReviewApprovedEvent({ ctx, payload: args.payload });
    }
});

/***************************************************************
 * Handle Booking Awaiting Approval Event
 * Notifies business when a booking request needs approval
 ***************************************************************/
export const handleBookingAwaitingApprovalEvent = internalMutation({
    args: v.object({
        payload: v.object({
            bookingId: v.id("bookings"),
            userId: v.id("users"),
            classInstanceId: v.id("classInstances"),
            businessId: v.id("businesses"),
            creditsPaid: v.number(),
        })
    }),
    handler: async (ctx, args) => {
        return await notificationService.handleBookingAwaitingApprovalEvent({ ctx, payload: args.payload });
    }
});

/***************************************************************
 * Handle Booking Approved Event
 * Notifies consumer when their booking request is approved
 ***************************************************************/
export const handleBookingApprovedEvent = internalMutation({
    args: v.object({
        payload: v.object({
            bookingId: v.id("bookings"),
            userId: v.id("users"),
            classInstanceId: v.id("classInstances"),
            businessId: v.id("businesses"),
            creditsPaid: v.number(),
        })
    }),
    handler: async (ctx, args) => {
        return await notificationService.handleBookingApprovedEvent({ ctx, payload: args.payload });
    }
});

/***************************************************************
 * Handle Booking Rejected Event
 * Notifies consumer when their booking request is rejected
 ***************************************************************/
export const handleBookingRejectedEvent = internalMutation({
    args: v.object({
        payload: v.object({
            bookingId: v.id("bookings"),
            userId: v.id("users"),
            classInstanceId: v.id("classInstances"),
            businessId: v.id("businesses"),
            creditsPaid: v.number(),
            reason: v.optional(v.string()),
        })
    }),
    handler: async (ctx, args) => {
        return await notificationService.handleBookingRejectedEvent({ ctx, payload: args.payload });
    }
});
