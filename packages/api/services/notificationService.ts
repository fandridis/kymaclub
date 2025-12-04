import type { MutationCtx, QueryCtx } from "../convex/_generated/server";
import type { Doc, Id } from "../convex/_generated/dataModel";
import { ConvexError } from "convex/values";
import { ERROR_CODES } from "../utils/errorCodes";
import type { PaginationOptions, PaginationResult } from "convex/server";
import { components, internal } from "../convex/_generated/api";
import { format } from "date-fns";
import { PushNotifications } from "@convex-dev/expo-push-notifications";
import { createNotificationWithDeepLink } from "../utils/deep-linking";
import { UserSettingsNotifications, DEFAULT_USER_NOTIFICATION_PREFERENCES } from "../types/userSettings";
import { NotificationType } from "../types/notification";
import { getPushNotificationText } from "../utils/translations";
import { coreService } from "./coreService";

/***************************************************************
 * Notification Service - All notification-related operations
 ***************************************************************/

const pushNotifications = new PushNotifications(components.pushNotifications);

/**
 * Safe wrapper for sending push notifications.
 * Silently ignores "component not registered" errors that occur in test environments.
 */
async function safeSendPushNotification(
    ctx: MutationCtx,
    args: { userId: Id<"users">; notification: any }
): Promise<void> {
    try {
        await pushNotifications.sendPushNotification(ctx, args);
    } catch (error: any) {
        // Silently ignore "component not registered" errors (test environment)
        if (error?.message?.includes("not registered")) {
            return;
        }
        // Re-throw other errors
        throw error;
    }
}

export const notificationService = {
    /**
     * Create a new notification
     */
    createNotification: async ({
        ctx,
        args,
        user
    }: {
        ctx: MutationCtx;
        args: {
            businessId: Id<"businesses">;
            recipientType: "business" | "consumer";
            recipientUserId?: Id<"users">;
            type: NotificationType;
            title: string;
            message: string;
            relatedBookingId?: Id<"bookings">;
            relatedClassInstanceId?: Id<"classInstances">;
            metadata?: {
                className?: string;
                userEmail?: string;
                userName?: string;
                businessName?: string;
                venueName?: string;
                amount?: number;
            };
        };
        user: Doc<"users">;
    }): Promise<{ createdNotificationId: Id<"notifications"> }> => {
        const now = Date.now();

        // Validate business exists
        const business = await ctx.db.get(args.businessId);
        if (!business) {
            throw new ConvexError({
                message: "Business not found",
                field: "businessId",
                code: ERROR_CODES.BUSINESS_NOT_FOUND
            });
        }

        // Validate recipient user exists if provided
        if (args.recipientUserId) {
            const recipient = await ctx.db.get(args.recipientUserId);
            if (!recipient) {
                throw new ConvexError({
                    message: "Recipient user not found",
                    field: "recipientUserId",
                    code: ERROR_CODES.USER_NOT_FOUND
                });
            }
        }

        // Create notification
        const notificationId = await ctx.db.insert("notifications", {
            businessId: args.businessId,
            recipientType: args.recipientType,
            recipientUserId: args.recipientUserId,
            type: args.type,
            title: args.title,
            message: args.message,
            relatedBookingId: args.relatedBookingId,
            relatedClassInstanceId: args.relatedClassInstanceId,
            seen: false,
            deliveryStatus: "pending",
            retryCount: 0,
            sentToEmail: false,
            sentToWeb: false,
            sentToPush: false,
            metadata: args.metadata,
            createdAt: now,
            createdBy: user._id,
        });

        return { createdNotificationId: notificationId };
    },

    /**
     * Get notifications for a user (paginated)
     */
    getUserNotifications: async ({
        ctx,
        args,
        user,
    }: {
        ctx: QueryCtx;
        args: {
            paginationOpts: PaginationOptions;
            recipientType?: "business" | "consumer";
            unreadOnly?: boolean;
        };
        user: Doc<"users">;
    }): Promise<PaginationResult<Doc<"notifications">>> => {
        const { recipientType, unreadOnly = false } = args;

        let query = ctx.db
            .query("notifications")
            .withIndex("by_recipient_user", q => q.eq("recipientUserId", user._id));

        // Apply filters
        if (recipientType || unreadOnly) {
            query = query.filter(q => {
                let conditions = [q.neq(q.field("deleted"), true)];

                if (recipientType) {
                    conditions.push(q.eq(q.field("recipientType"), recipientType));
                }

                if (unreadOnly) {
                    conditions.push(q.eq(q.field("seen"), false));
                }

                return q.and(...conditions);
            });
        } else {
            query = query.filter(q => q.neq(q.field("deleted"), true));
        }

        const result = await query
            .order("desc") // Most recent first
            .paginate(args.paginationOpts);

        return result;
    },

    /**
     * Get business notifications (paginated)
     */
    getBusinessNotifications: async ({
        ctx,
        args,
        user,
    }: {
        ctx: QueryCtx;
        args: {
            paginationOpts: PaginationOptions;
            unreadOnly?: boolean;
        };
        user: Doc<"users">;
    }): Promise<PaginationResult<Doc<"notifications">>> => {
        // Validate user has business association
        if (!user.businessId) {
            throw new ConvexError({
                message: "User not associated with any business",
                field: "businessId",
                code: ERROR_CODES.USER_NOT_ASSOCIATED_WITH_BUSINESS
            });
        }

        const { unreadOnly = false } = args;

        // Get all business notification types
        const businessTypes = ["booking_created", "booking_cancelled_by_consumer", "booking_cancelled_by_business", "booking_awaiting_approval", "payment_received", "review_received"];

        const allNotifications: Doc<"notifications">[] = [];

        // Query each business notification type
        for (const notificationType of businessTypes) {
            const typeQuery = ctx.db
                .query("notifications")
                .withIndex("by_business_type", q =>
                    q.eq("businessId", user.businessId!)
                        .eq("type", notificationType as any)
                )
                .filter(q => {
                    let conditions = [
                        q.neq(q.field("deleted"), true),
                        q.eq(q.field("recipientType"), "business")
                    ];

                    if (unreadOnly) {
                        conditions.push(q.eq(q.field("seen"), false));
                    }

                    return q.and(...conditions);
                });

            const typeResults = await typeQuery.collect();
            allNotifications.push(...typeResults);
        }

        // Sort by creation time (most recent first)
        allNotifications.sort((a, b) => b.createdAt - a.createdAt);

        // Manual pagination
        const { numItems, cursor } = args.paginationOpts;
        const startIndex = cursor ? parseInt(cursor) : 0;
        const endIndex = startIndex + numItems;

        const page = allNotifications.slice(startIndex, endIndex);
        const isDone = endIndex >= allNotifications.length;
        const continueCursor = isDone ? "" : endIndex.toString();

        return {
            page,
            isDone,
            continueCursor,
        };
    },

    /**
     * Mark notification as seen
     */
    markNotificationSeen: async ({
        ctx,
        args,
        user,
    }: {
        ctx: MutationCtx;
        args: {
            notificationId: Id<"notifications">;
        };
        user: Doc<"users">;
    }): Promise<{ success: boolean }> => {
        const now = Date.now();

        const notification = await ctx.db.get(args.notificationId);
        if (!notification) {
            throw new ConvexError({
                message: "Notification not found",
                field: "notificationId",
                code: ERROR_CODES.RESOURCE_NOT_FOUND
            });
        }

        // Validate user can access this notification
        if (notification.recipientUserId !== user._id &&
            notification.businessId !== user.businessId) {
            throw new ConvexError({
                message: "You don't have permission to access this notification",
                field: "notificationId",
                code: ERROR_CODES.UNAUTHORIZED
            });
        }

        // Update notification
        await ctx.db.patch(args.notificationId, {
            seen: true,
            seenAt: now,
            updatedAt: now,
            updatedBy: user._id,
        });

        return { success: true };
    },

    /**
     * Update notification delivery status
     */
    updateNotificationDeliveryStatus: async ({
        ctx,
        args,
        user,
    }: {
        ctx: MutationCtx;
        args: {
            notificationId: Id<"notifications">;
            deliveryStatus: "pending" | "sent" | "failed";
            failureReason?: string;
            sentToEmail?: boolean;
            sentToWeb?: boolean;
            sentToPush?: boolean;
        };
        user: Doc<"users">;
    }): Promise<{ success: boolean }> => {
        const now = Date.now();

        const notification = await ctx.db.get(args.notificationId);
        if (!notification) {
            throw new ConvexError({
                message: "Notification not found",
                field: "notificationId",
                code: ERROR_CODES.RESOURCE_NOT_FOUND
            });
        }

        // Increment retry count if failed
        const retryCount = args.deliveryStatus === "failed"
            ? (notification.retryCount || 0) + 1
            : notification.retryCount;

        // Update notification
        await ctx.db.patch(args.notificationId, {
            deliveryStatus: args.deliveryStatus,
            failureReason: args.failureReason,
            retryCount,
            sentToEmail: args.sentToEmail ?? notification.sentToEmail,
            sentToWeb: args.sentToWeb ?? notification.sentToWeb,
            sentToPush: args.sentToPush ?? notification.sentToPush,
            updatedAt: now,
            updatedBy: user._id,
        });

        return { success: true };
    },

    /**
     * Get or create user notification settings
     */
    getUserNotificationSettings: async ({
        ctx,
        user,
    }: {
        ctx: QueryCtx;
        user: Doc<"users">;
    }): Promise<Doc<"userSettings"> | null> => {
        const settings = await coreService.getUserSettings({ ctx, userId: user._id });

        if (settings?.notifications) {
            settings.notifications.preferences = {
                ...DEFAULT_USER_NOTIFICATION_PREFERENCES,
                ...settings.notifications.preferences,
            };
        }

        return settings;
    },

    /**
     * Create or update user notification settings
     */
    upsertUserNotificationSettings: async ({
        ctx,
        args,
        user,
    }: {
        ctx: MutationCtx;
        args: {
            globalOptOut: boolean;
            notificationPreferences: UserSettingsNotifications['preferences'];
        };
        user: Doc<"users">;
    }): Promise<{ settingsId: Id<"userSettings"> }> => {
        const now = Date.now();

        // Check if settings exist
        const existingSettings = await coreService.getUserSettings({ ctx, userId: user._id });

        if (existingSettings) {
            // Update existing settings
            await ctx.db.patch(existingSettings._id, {
                notifications: {
                    globalOptOut: args.globalOptOut,
                    preferences: args.notificationPreferences,
                },
                updatedAt: now,
                updatedBy: user._id,
            });

            return { settingsId: existingSettings._id };
        } else {
            // Create new settings
            const settingsId = await ctx.db.insert("userSettings", {
                userId: user._id,
                notifications: {
                    globalOptOut: args.globalOptOut,
                    preferences: args.notificationPreferences,
                },
                createdAt: now,
                createdBy: user._id,
            });

            return { settingsId };
        }
    },

    /**
     * Get or create business notification settings
     */
    getBusinessNotificationSettings: async ({
        ctx,
        user,
    }: {
        ctx: QueryCtx;
        user: Doc<"users">;
    }): Promise<Doc<"businessSettings"> | null> => {
        if (!user.businessId) {
            throw new ConvexError({
                message: "User not associated with any business",
                field: "businessId",
                code: ERROR_CODES.USER_NOT_ASSOCIATED_WITH_BUSINESS
            });
        }

        const settings = await ctx.db
            .query("businessSettings")
            .withIndex("by_business", q => q.eq("businessId", user.businessId!))
            .filter(q => q.neq(q.field("deleted"), true))
            .first();

        return settings;
    },

    /**
     * Create or update business notification settings
     */
    upsertBusinessNotificationSettings: async ({
        ctx,
        args,
        user,
    }: {
        ctx: MutationCtx;
        args: {
            notificationPreferences: {
                booking_created: { email: boolean; web: boolean; };
                booking_cancelled_by_consumer: { email: boolean; web: boolean; };
                booking_cancelled_by_business: { email: boolean; web: boolean; };
                payment_received: { email: boolean; web: boolean; };
                review_received?: { email: boolean; web: boolean; };
            };
        };
        user: Doc<"users">;
    }): Promise<{ settingsId: Id<"businessSettings"> }> => {
        if (!user.businessId) {
            throw new ConvexError({
                message: "User not associated with any business",
                field: "businessId",
                code: ERROR_CODES.USER_NOT_ASSOCIATED_WITH_BUSINESS
            });
        }

        const now = Date.now();

        // Check if settings exist
        const existingSettings = await ctx.db
            .query("businessSettings")
            .withIndex("by_business", q => q.eq("businessId", user.businessId!))
            .filter(q => q.neq(q.field("deleted"), true))
            .first();

        if (existingSettings) {
            // Update existing settings
            await ctx.db.patch(existingSettings._id, {
                notifications: {
                    preferences: args.notificationPreferences,
                },
                updatedAt: now,
                updatedBy: user._id,
            });

            return { settingsId: existingSettings._id };
        } else {
            // Create new settings
            const settingsId = await ctx.db.insert("businessSettings", {
                businessId: user.businessId!,
                notifications: {
                    preferences: args.notificationPreferences,
                },
                createdAt: now,
                createdBy: user._id,
            });

            return { settingsId };
        }
    },

    /**
     * Handle new class booking event
     */
    handleNewClassBookingEvent: async ({
        ctx,
        payload,
    }: {
        ctx: MutationCtx;
        payload: {
            bookingId: Id<"bookings">;
            userId: Id<"users">;
            classInstanceId: Id<"classInstances">;
            businessId: Id<"businesses">;
            creditsPaid: number;
        };
    }): Promise<{ createdNotificationId: Id<"notifications"> | null }> => {
        const { bookingId, userId, classInstanceId, businessId, creditsPaid } = payload;

        // Fetch the booking, user classInstance and business with Promise.all
        const booking = await ctx.db.get(bookingId);
        const [user, classInstance, business] = await Promise.all([
            ctx.db.get(userId),
            ctx.db.get(classInstanceId),
            ctx.db.get(businessId),
        ]);

        if (!user || !classInstance || !business || !booking) {
            throw new ConvexError({
                message: "User, class instance, or business not found",
                field: "userId",
                code: ERROR_CODES.RESOURCE_NOT_FOUND
            });
        }

        // Get business notification preferences
        const businessNotificationSettings = await ctx.db
            .query("businessSettings")
            .withIndex("by_business", q => q.eq("businessId", businessId))
            .filter(q => q.neq(q.field("deleted"), true))
            .first();

        // Only send notification if business has opted in for this type
        let notificationId: Id<"notifications"> | undefined;

        if (businessNotificationSettings?.notifications?.preferences?.booking_created?.web) {
            // Send web notification to business
            notificationId = await ctx.db.insert("notifications", {
                businessId,
                recipientType: "business",
                recipientUserId: userId,
                type: "booking_created",
                title: "New booking",
                message: `New booking for ${classInstance?.name || classInstance.templateSnapshot.name} at ${classInstance.venueSnapshot.name}`,
                relatedBookingId: bookingId,
                relatedClassInstanceId: classInstanceId,
                seen: false,
                deliveryStatus: "pending",
                retryCount: 0,
                sentToEmail: false,
                sentToWeb: false,
                sentToPush: false,
                metadata: {
                    className: classInstance?.name || classInstance.templateSnapshot.name,
                    userName: user.name,
                    userEmail: user.email,
                    amount: creditsPaid,
                },
                createdAt: Date.now(),
                createdBy: userId,
            });
        } else {
        }

        // Send email notification to business
        if (businessNotificationSettings?.notifications?.preferences?.booking_created?.email && process.env.NODE_ENV === "production") {
            try {
                await ctx.scheduler.runAfter(0, internal.actions.email.sendBookingNotificationEmail, {
                    businessEmail: business.email,
                    businessName: business.name,
                    customerName: user.name || user.email || "Customer",
                    customerEmail: user.email,
                    className: classInstance.name || classInstance.templateSnapshot.name || "",
                    venueName: classInstance.venueSnapshot?.name || "",
                    classTime: format(classInstance.startTime, "MMM d, yyyy h:mm a"),
                    bookingAmount: booking.finalPrice,
                    notificationType: 'booking_created',
                });
            } catch (error) {
                console.error('Error sending email notification:', error);
            }
        } else {
        }


        if (!notificationId) {
            return { createdNotificationId: null };
        }

        return { createdNotificationId: notificationId };
    },

    /**
     * Handle user cancelled booking event
     */
    handleUserCancelledBookingEvent: async ({
        ctx,
        payload,
    }: {
        ctx: MutationCtx;
        payload: {
            bookingId: Id<"bookings">;
            userId: Id<"users">;
            classInstanceId: Id<"classInstances">;
            businessId: Id<"businesses">;
            creditsPaid: number;
        };
    }): Promise<{ createdNotificationId: Id<"notifications"> | null }> => {
        const { bookingId, userId, classInstanceId, businessId, creditsPaid } = payload;

        // Fetch the booking, user classInstance and business with Promise.all
        const booking = await ctx.db.get(bookingId);
        const [user, classInstance, business] = await Promise.all([
            ctx.db.get(userId),
            ctx.db.get(classInstanceId),
            ctx.db.get(businessId),
        ]);

        if (!user || !classInstance || !business || !booking) {
            throw new ConvexError({
                message: "User, class instance, or business not found",
                field: "userId",
                code: ERROR_CODES.RESOURCE_NOT_FOUND
            });
        }

        // Get business notification preferences
        const businessNotificationSettings = await ctx.db
            .query("businessSettings")
            .withIndex("by_business", q => q.eq("businessId", businessId))
            .filter(q => q.neq(q.field("deleted"), true))
            .first();

        // Only send notification if business has opted in for this type
        let notificationId: Id<"notifications"> | undefined;

        if (businessNotificationSettings?.notifications?.preferences?.booking_cancelled_by_consumer?.web) {
            // Send web notification to business
            notificationId = await ctx.db.insert("notifications", {
                businessId,
                recipientType: "business",
                recipientUserId: userId,
                type: "booking_cancelled_by_consumer",
                title: "Booking Cancelled",
                message: `Booking for ${classInstance?.name || classInstance.templateSnapshot.name} at ${classInstance.venueSnapshot.name} has been cancelled`,
                relatedBookingId: bookingId,
                relatedClassInstanceId: classInstanceId,
                seen: false,
                deliveryStatus: "pending",
                retryCount: 0,
                sentToEmail: false,
                sentToWeb: false,
                sentToPush: false,
                metadata: {
                    className: classInstance?.name || classInstance.templateSnapshot.name,
                    userName: user.name,
                    userEmail: user.email,
                    amount: creditsPaid,
                },
                createdAt: Date.now(),
                createdBy: userId,
            });
        } else {
        }

        // Send email notification to business
        if (businessNotificationSettings?.notifications?.preferences?.booking_cancelled_by_consumer?.email && process.env.NODE_ENV === "production") {
            try {
                await ctx.scheduler.runAfter(0, internal.actions.email.sendBookingNotificationEmail, {
                    businessEmail: business.email,
                    businessName: business.name,
                    customerName: user.name || user.email || "Customer",
                    customerEmail: user.email,
                    className: classInstance.name || classInstance.templateSnapshot.name || "",
                    venueName: classInstance.venueSnapshot?.name || "",
                    classTime: format(classInstance.startTime, "MMM d, yyyy h:mm a"),
                    bookingAmount: booking.finalPrice,
                    notificationType: 'booking_cancelled_by_consumer',
                });
            } catch (error) {
                console.error('Error sending email notification:', error);
            }
        } else {
        }

        if (!notificationId) {
            return { createdNotificationId: null };
        }

        return { createdNotificationId: notificationId };
    },

    /**
     * Handle business cancelled booking event
     */
    handleBusinessCancelledBookingEvent: async ({
        ctx,
        payload,
    }: {
        ctx: MutationCtx;
        payload: {
            bookingId: Id<"bookings">;
            userId: Id<"users">;
            classInstanceId: Id<"classInstances">;
            businessId: Id<"businesses">;
            creditsPaid: number;
        };
    }): Promise<{ success: boolean }> => {
        const { bookingId, userId, classInstanceId, businessId, creditsPaid } = payload;

        // Fetch the booking, user classInstance and business with Promise.all
        const booking = await ctx.db.get(bookingId);
        const [user, classInstance, business] = await Promise.all([
            ctx.db.get(userId),
            ctx.db.get(classInstanceId),
            ctx.db.get(businessId),
        ]);

        if (!user || !classInstance || !business || !booking) {
            throw new ConvexError({
                message: "User, class instance, or business not found",
                field: "userId",
                code: ERROR_CODES.RESOURCE_NOT_FOUND
            });
        }

        // get the user notification settings
        const userNotificationSettings = await coreService.getUserSettings({ ctx, userId });

        if (userNotificationSettings?.notifications) {
            userNotificationSettings.notifications.preferences = {
                ...DEFAULT_USER_NOTIFICATION_PREFERENCES,
                ...userNotificationSettings.notifications.preferences,
            };
        }

        if (userNotificationSettings?.notifications?.preferences?.booking_cancelled_by_business?.web) {

            // Send web notification to business
            await ctx.db.insert("notifications", {
                businessId,
                recipientType: "business",
                recipientUserId: userId,
                type: "booking_cancelled_by_business",
                title: "Booking cancelled",
                message: `Booking for ${classInstance?.name || classInstance.templateSnapshot.name} at ${classInstance.venueSnapshot.name} has been cancelled`,
                relatedBookingId: bookingId,
                relatedClassInstanceId: classInstanceId,
                seen: false,
                deliveryStatus: "pending",
                retryCount: 0,
                sentToEmail: false,
                sentToWeb: false,
                sentToPush: false,
                metadata: {
                    className: classInstance?.name || classInstance.templateSnapshot.name,
                    userName: user.name,
                    userEmail: user.email,
                    amount: creditsPaid,
                },
                createdAt: Date.now(),
                createdBy: userId,
            });
        } else {

        }

        // Send email notification to user
        if (userNotificationSettings?.notifications?.preferences?.booking_cancelled_by_business?.email && process.env.NODE_ENV === "production") {

            await ctx.scheduler.runAfter(0, internal.actions.email.sendBookingNotificationEmail, {
                businessEmail: business.email,
                businessName: business.name,
                customerName: user.name || user.email || "Customer",
                customerEmail: user.email,
                className: classInstance.name || classInstance.templateSnapshot.name || "",
                venueName: classInstance.venueSnapshot?.name || "",
                classTime: format(classInstance.startTime, "MMM d, yyyy h:mm a"),
                bookingAmount: booking.finalPrice,
                notificationType: 'booking_cancelled_by_business',
            });
        } else {

        }

        if (userNotificationSettings?.notifications?.preferences?.booking_cancelled_by_business?.push) {
            const notificationContent = createNotificationWithDeepLink(
                'booking_cancelled_by_business',
                'Booking cancelled',
                `Your booking for ${classInstance.name} - ${classInstance.venueSnapshot?.name} at ${format(classInstance.startTime, 'MMM d, yyyy h:mm a')} has been cancelled by the venue.`,
                {
                    classInstanceId: classInstanceId,
                    bookingId: bookingId,
                    additionalData: {
                        businessId: businessId,
                        businessName: business.name,
                        className: classInstance.name || classInstance.templateSnapshot.name,
                        venueName: classInstance.venueSnapshot?.name,
                        classTime: format(classInstance.startTime, 'MMM d, yyyy h:mm a'),
                    }
                }
            );

            await safeSendPushNotification(ctx, {
                userId: userId,
                notification: notificationContent,
            });
        } else {
        }

        return { success: true };
    },

    /**
     * Handle booking became rebookable event
     */
    handleBookingBecameRebookableEvent: async ({
        ctx,
        payload,
    }: {
        ctx: MutationCtx;
        payload: {
            bookingId: Id<"bookings">;
            userId: Id<"users">;
            classInstanceId: Id<"classInstances">;
            businessId: Id<"businesses">;
            creditsPaid: number;
        };
    }): Promise<{ success: boolean }> => {
        const { bookingId, userId, classInstanceId, businessId, creditsPaid } = payload;

        // Fetch the booking, user classInstance and business with Promise.all
        const booking = await ctx.db.get(bookingId);
        const [user, classInstance, business] = await Promise.all([
            ctx.db.get(userId),
            ctx.db.get(classInstanceId),
            ctx.db.get(businessId),
        ]);

        if (!user || !classInstance || !business || !booking) {
            throw new ConvexError({
                message: "User, class instance, or business not found",
                field: "userId",
                code: ERROR_CODES.RESOURCE_NOT_FOUND
            });
        }

        // Get user notification settings
        const userNotificationSettings = await coreService.getUserSettings({ ctx, userId });

        // Send web notification to user if they have opted in
        if (userNotificationSettings?.notifications?.preferences?.class_rebookable?.web) {
            await ctx.db.insert("notifications", {
                businessId,
                recipientType: "consumer",
                recipientUserId: userId,
                type: "class_rebookable",
                title: "Booking Available Again",
                message: `Your cancelled booking for ${classInstance?.name || classInstance.templateSnapshot.name} at ${classInstance.venueSnapshot.name} is now available to rebook.`,
                relatedBookingId: bookingId,
                relatedClassInstanceId: classInstanceId,
                seen: false,
                deliveryStatus: "pending",
                retryCount: 0,
                sentToEmail: false,
                sentToWeb: false,
                sentToPush: false,
                metadata: {
                    className: classInstance?.name || classInstance.templateSnapshot.name,
                    userName: user.name,
                    userEmail: user.email,
                    amount: creditsPaid,
                },
                createdAt: Date.now(),
                createdBy: userId,
            });
        } else {
        }

        // Send email notification to user if they have opted in
        if (userNotificationSettings?.notifications?.preferences?.class_rebookable?.email && process.env.NODE_ENV === "production") {
            try {
                await ctx.scheduler.runAfter(0, internal.actions.email.sendBookingConfirmationEmail, {
                    customerEmail: user.email || "",
                    customerName: user.name || user.email || "Customer",
                    className: classInstance.name || classInstance.templateSnapshot.name || "",
                    venueName: classInstance.venueSnapshot.name || "",
                    venueAddress: `${classInstance.venueSnapshot.address?.street || ""}, ${classInstance.venueSnapshot.address?.city || ""}, ${classInstance.venueSnapshot.address?.zipCode || ""}`.trim().replace(/^,\s*|,\s*$/g, ''),
                    instructorName: classInstance.templateSnapshot.instructor || "",
                    startTime: classInstance.startTime,
                    bookingAmount: booking.finalPrice,
                });
            } catch (error) {
                console.error('Error sending rebookable email notification:', error);
            }
        } else {
        }

        // Send push notification to user if they have opted in
        if (userNotificationSettings?.notifications?.preferences?.class_rebookable?.push) {
            const notificationContent = createNotificationWithDeepLink(
                'class_rebookable',
                'Booking Available Again',
                `Your cancelled booking for ${classInstance.name} - ${classInstance.venueSnapshot?.name} at ${format(classInstance.startTime, 'MMM d, yyyy h:mm a')} is now available to rebook.`,
                {
                    classInstanceId: classInstanceId,
                    bookingId: bookingId,
                    additionalData: {
                        businessId: businessId,
                        businessName: business.name,
                        className: classInstance.name || classInstance.templateSnapshot.name,
                        venueName: classInstance.venueSnapshot?.name,
                        classTime: format(classInstance.startTime, 'MMM d, yyyy h:mm a'),
                        rebookable: true,
                    }
                }
            );

            await safeSendPushNotification(ctx, {
                userId: userId,
                notification: notificationContent,
            });
        } else {
        }

        return { success: true };
    },

    /**
     * Handle subscription credits received event
     */
    handleSubscriptionCreditsReceivedEvent: async ({
        ctx,
        payload,
    }: {
        ctx: MutationCtx;
        payload: {
            subscriptionEventId: Id<"subscriptionEvents">;
            subscriptionId: Id<"subscriptions">;
            userId: Id<"users">;
            creditsAllocated: number;
            eventType: string;
            planName: string;
        };
    }): Promise<{ success: boolean }> => {
        const { subscriptionEventId, subscriptionId, userId, creditsAllocated, eventType, planName } = payload;



        // Fetch user and subscription
        const [user, subscription] = await Promise.all([
            ctx.db.get(userId),
            ctx.db.get(subscriptionId),
        ]);

        if (!user || !subscription) {
            throw new ConvexError({
                message: "User or subscription not found",
                field: "userId",
                code: ERROR_CODES.RESOURCE_NOT_FOUND
            });
        }

        // Get user notification settings
        const userNotificationSettings = await coreService.getUserSettings({ ctx, userId });

        // Determine if this is an initial subscription or renewal
        const isRenewal = eventType === "invoice.payment_succeeded" || eventType === "invoice.paid";
        const title = isRenewal ? "Monthly credits renewed!" : "Welcome credits received!";
        const message = `You've received ${creditsAllocated} credits from your ${planName} subscription.`;

        // We don't need businessId for consumer notifications, but the schema requires it
        // Let's use a dummy business ID or make it optional in the schema - for now we'll skip it
        // Since this is a consumer notification about their credits, we can use businessId as the platform

        // Send web notification if user has opted in (or use defaults if no settings exist)
        const shouldSendWeb = userNotificationSettings?.notifications?.preferences?.credits_received_subscription?.web ?? true;

        if (shouldSendWeb) {

            // Note: For consumer credit notifications, we don't have a specific business context
            // We'll create a dummy businessId or handle this differently
            // For now, let's skip the web notification or find a way to handle consumer-only notifications
        }

        // Send email notification if user has opted in
        const shouldSendEmail = userNotificationSettings?.notifications?.preferences?.credits_received_subscription?.email ?? true;

        if (shouldSendEmail && process.env.NODE_ENV === "production" && user.email) {

            try {
                await ctx.scheduler.runAfter(0, internal.actions.email.sendCreditsReceivedEmail, {
                    customerEmail: user.email,
                    customerName: user.name || user.email || "Valued Customer",
                    creditsReceived: creditsAllocated,
                    planName: planName,
                    isRenewal: isRenewal,
                    totalCredits: (user.credits || 0) + creditsAllocated,
                });
            } catch (error) {
                console.error('Error sending credits received email notification:', error);
            }
        } else {

        }

        // Send push notification if user has opted in
        const shouldSendPush = userNotificationSettings?.notifications?.preferences?.credits_received_subscription?.push ?? true;

        if (shouldSendPush) {

            const notificationContent = createNotificationWithDeepLink(
                'credits_received_subscription',
                title,
                message,
                {
                    additionalData: {
                        creditsReceived: creditsAllocated,
                        planName: planName,
                        isRenewal: isRenewal,
                        subscriptionId: subscriptionId,
                    }
                }
            );

            await safeSendPushNotification(ctx, {
                userId: userId,
                notification: notificationContent,
            });
        } else {

        }

        return { success: true };
    },

    /**
     * Handle credits gifted by admin event
     */
    handleCreditsGiftedEvent: async ({
        ctx,
        payload,
    }: {
        ctx: MutationCtx;
        payload: {
            userId: Id<"users">;
            creditsGifted: number;
            transactionId: Id<"creditTransactions">;
            newBalance: number;
            adminUserId: Id<"users">;
            giftMessage?: string;
        };
    }): Promise<{ success: boolean }> => {
        const { userId, creditsGifted, transactionId, newBalance, adminUserId } = payload;

        // Fetch user
        const user = await ctx.db.get(userId);

        if (!user) {
            throw new ConvexError({
                message: "User not found",
                field: "userId",
                code: ERROR_CODES.RESOURCE_NOT_FOUND
            });
        }

        // Get user notification settings (includes language preference)
        const userNotificationSettings = await coreService.getUserSettings({ ctx, userId });

        // Get user's language preference for localized notifications
        const userLanguage = userNotificationSettings?.language;

        // Get localized push notification text
        const { title, body: message } = getPushNotificationText(
            userLanguage,
            'credits_arrived',
            { credits: creditsGifted }
        );

        // Send web notification if user has opted in (or use defaults if no settings exist)
        const shouldSendWeb = userNotificationSettings?.notifications?.preferences?.credits_received_admin_gift?.web ?? true;

        if (shouldSendWeb) {
            // Note: For consumer credit notifications, we don't have a specific business context
            // For now, let's skip the web notification or find a way to handle consumer-only notifications
        }

        // Send email notification if user has opted in
        const shouldSendEmail = userNotificationSettings?.notifications?.preferences?.credits_received_admin_gift?.email ?? true;

        if (shouldSendEmail && process.env.NODE_ENV === "production" && user.email) {
            try {
                await ctx.scheduler.runAfter(0, internal.actions.email.sendCreditsGiftEmail, {
                    customerEmail: user.email,
                    customerName: user.name || user.email || "Valued Customer",
                    creditsGifted: creditsGifted,
                    totalCredits: newBalance,
                    giftMessage: payload.giftMessage,
                    language: userLanguage, // Pass language for localized email
                });
            } catch (error) {
                console.error('Error sending credits gifted email notification:', error);
            }
        }

        // Send push notification if user has opted in
        const shouldSendPush = userNotificationSettings?.notifications?.preferences?.credits_received_admin_gift?.push ?? true;

        if (shouldSendPush) {
            const notificationContent = createNotificationWithDeepLink(
                'credits_received_admin_gift',
                title,   // Localized title
                message, // Localized message
                {
                    additionalData: {
                        creditsReceived: creditsGifted,
                        transactionId: transactionId,
                        newBalance: newBalance,
                        adminUserId: adminUserId,
                    }
                }
            );

            await safeSendPushNotification(ctx, {
                userId: userId,
                notification: notificationContent,
            });
        }

        return { success: true };
    },

    /**
     * Handle welcome bonus event (new user sign up)
     */
    handleWelcomeBonusEvent: async ({
        ctx,
        payload,
    }: {
        ctx: MutationCtx;
        payload: {
            userId: Id<"users">;
            welcomeCredits: number;
        };
    }): Promise<{ success: boolean }> => {
        const { userId, welcomeCredits } = payload;

        // Fetch user
        const user = await ctx.db.get(userId);

        if (!user) {
            throw new ConvexError({
                message: "User not found",
                field: "userId",
                code: ERROR_CODES.RESOURCE_NOT_FOUND
            });
        }

        // Get user notification settings (may not exist for new users)
        const userNotificationSettings = await coreService.getUserSettings({ ctx, userId });

        const title = "Welcome to KymaClub!";
        const message = `You've received ${welcomeCredits} welcome bonus credits!`;

        // Send email notification (default to true for new users)
        const shouldSendEmail = userNotificationSettings?.notifications?.preferences?.welcome_bonus?.email ?? true;

        if (shouldSendEmail && process.env.NODE_ENV === "production" && user.email) {
            try {
                await ctx.scheduler.runAfter(0, internal.actions.email.sendWelcomeEmail, {
                    customerEmail: user.email,
                    customerName: user.name || user.email || "Valued Customer",
                    welcomeCredits: welcomeCredits,
                });
            } catch (error) {
                console.error('Error sending welcome email notification:', error);
            }
        }

        // Send push notification (default to true for new users)
        const shouldSendPush = userNotificationSettings?.notifications?.preferences?.welcome_bonus?.push ?? true;

        if (shouldSendPush) {
            const notificationContent = createNotificationWithDeepLink(
                'welcome_bonus',
                title,
                message,
                {
                    additionalData: {
                        welcomeCredits: welcomeCredits,
                    }
                }
            );

            await safeSendPushNotification(ctx, {
                userId: userId,
                notification: notificationContent,
            });
        }

        return { success: true };
    },

    /**
     * Handle review approved event (auto or manual)
     */
    handleReviewApprovedEvent: async ({
        ctx,
        payload,
    }: {
        ctx: MutationCtx;
        payload: {
            reviewId: Id<"venueReviews">;
            businessId: Id<"businesses">;
        };
    }): Promise<{ createdNotificationId: Id<"notifications"> | null }> => {
        const { reviewId, businessId } = payload;

        const [review, business] = await Promise.all([
            ctx.db.get(reviewId),
            ctx.db.get(businessId),
        ]);

        if (!review || !business) {
            throw new ConvexError({
                message: "Review or business not found",
                field: "reviewId",
                code: ERROR_CODES.RESOURCE_NOT_FOUND,
            });
        }

        // Guard: only proceed if approved + visible + not deleted
        const isApproved = (review.moderationStatus === 'auto_approved' || review.moderationStatus === 'manual_approved') && review.isVisible && !review.deleted;
        if (!isApproved) {
            return { createdNotificationId: null };
        }

        // Preferences
        const businessNotificationSettings = await ctx.db
            .query("businessSettings")
            .withIndex("by_business", q => q.eq("businessId", businessId))
            .filter(q => q.neq(q.field("deleted"), true))
            .first();

        const pref = businessNotificationSettings?.notifications?.preferences?.review_received;

        let createdNotificationId: Id<"notifications"> | null = null;

        if (pref?.web) {
            const message = `New review for ${review.venueSnapshot?.name || 'your venue'}: ${review.rating}/5${review.userSnapshot?.name ? ' by ' + review.userSnapshot.name : ''}`;
            createdNotificationId = await ctx.db.insert("notifications", {
                businessId,
                recipientType: "business",
                // For consistency with other business notifications, associate to the consumer user
                recipientUserId: review.userId,
                type: "review_received",
                title: "New user review!",
                message,
                relatedBookingId: undefined,
                relatedClassInstanceId: undefined,
                seen: false,
                deliveryStatus: "pending",
                retryCount: 0,
                sentToEmail: false,
                sentToWeb: false,
                sentToPush: false,
                metadata: {
                    userName: review.userSnapshot?.name,
                },
                createdAt: Date.now(),
                createdBy: review.userId,
            });
        }

        if (pref?.email && process.env.NODE_ENV === "production") {
            try {
                await ctx.scheduler.runAfter(0, internal.actions.email.sendReviewNotificationEmail, {
                    businessEmail: business.email,
                    businessName: business.name,
                    venueName: review.venueSnapshot?.name || "Venue",
                    reviewerName: review.userSnapshot?.name || undefined,
                    rating: review.rating,
                    comment: review.comment || undefined,
                });
            } catch (error) {
                console.error('Error sending review email notification:', error);
            }
        }

        return { createdNotificationId };
    },

    /**
     * Handle booking awaiting approval event
     * Notifies business that a new booking request needs approval
     */
    handleBookingAwaitingApprovalEvent: async ({
        ctx,
        payload,
    }: {
        ctx: MutationCtx;
        payload: {
            bookingId: Id<"bookings">;
            userId: Id<"users">;
            classInstanceId: Id<"classInstances">;
            businessId: Id<"businesses">;
            creditsPaid: number;
        };
    }): Promise<{ createdNotificationId: Id<"notifications"> | null }> => {
        const { bookingId, userId, classInstanceId, businessId, creditsPaid } = payload;

        // Fetch the booking, user, classInstance and business
        const booking = await ctx.db.get(bookingId);
        const [user, classInstance, business] = await Promise.all([
            ctx.db.get(userId),
            ctx.db.get(classInstanceId),
            ctx.db.get(businessId),
        ]);

        if (!user || !classInstance || !business || !booking) {
            throw new ConvexError({
                message: "User, class instance, or business not found",
                field: "userId",
                code: ERROR_CODES.RESOURCE_NOT_FOUND
            });
        }

        // Get business notification preferences
        const businessNotificationSettings = await ctx.db
            .query("businessSettings")
            .withIndex("by_business", q => q.eq("businessId", businessId))
            .filter(q => q.neq(q.field("deleted"), true))
            .first();

        let notificationId: Id<"notifications"> | undefined;

        // Always notify business about approval requests (web notification)
        // This is a special notification type that may not have explicit preferences yet
        // For now, use booking_created preferences as a fallback
        if (businessNotificationSettings?.notifications?.preferences?.booking_created?.web !== false) {
            notificationId = await ctx.db.insert("notifications", {
                businessId,
                recipientType: "business",
                recipientUserId: userId,
                type: "booking_awaiting_approval",
                title: "New booking request",
                message: `${user.name || user.email} has requested to book ${classInstance?.name || classInstance.templateSnapshot.name}. Approval required.`,
                relatedBookingId: bookingId,
                relatedClassInstanceId: classInstanceId,
                seen: false,
                deliveryStatus: "pending",
                retryCount: 0,
                sentToEmail: false,
                sentToWeb: false,
                sentToPush: false,
                metadata: {
                    className: classInstance?.name || classInstance.templateSnapshot.name,
                    userName: user.name,
                    userEmail: user.email,
                    amount: creditsPaid,
                },
                createdAt: Date.now(),
                createdBy: userId,
            });
        }

        // Send email notification to business
        if (businessNotificationSettings?.notifications?.preferences?.booking_created?.email && process.env.NODE_ENV === "production") {
            try {
                await ctx.scheduler.runAfter(0, internal.actions.email.sendBookingNotificationEmail, {
                    businessEmail: business.email,
                    businessName: business.name,
                    customerName: user.name || user.email || "Customer",
                    customerEmail: user.email,
                    className: classInstance.name || classInstance.templateSnapshot.name || "",
                    venueName: classInstance.venueSnapshot?.name || "",
                    classTime: format(classInstance.startTime, "MMM d, yyyy h:mm a"),
                    bookingAmount: booking.finalPrice,
                    notificationType: 'booking_awaiting_approval',
                });
            } catch (error) {
                console.error('Error sending email notification:', error);
            }
        }

        return { createdNotificationId: notificationId || null };
    },

    /**
     * Handle booking approved event
     * Notifies consumer that their booking request was approved
     */
    handleBookingApprovedEvent: async ({
        ctx,
        payload,
    }: {
        ctx: MutationCtx;
        payload: {
            bookingId: Id<"bookings">;
            userId: Id<"users">;
            classInstanceId: Id<"classInstances">;
            businessId: Id<"businesses">;
            creditsPaid: number;
        };
    }): Promise<{ success: boolean }> => {
        const { bookingId, userId, classInstanceId, businessId, creditsPaid } = payload;

        // Fetch the booking, user, classInstance and business
        const booking = await ctx.db.get(bookingId);
        const [user, classInstance, business] = await Promise.all([
            ctx.db.get(userId),
            ctx.db.get(classInstanceId),
            ctx.db.get(businessId),
        ]);

        if (!user || !classInstance || !business || !booking) {
            throw new ConvexError({
                message: "User, class instance, or business not found",
                field: "userId",
                code: ERROR_CODES.RESOURCE_NOT_FOUND
            });
        }

        // Get user notification settings
        const userNotificationSettings = await coreService.getUserSettings({ ctx, userId });

        if (userNotificationSettings?.notifications) {
            userNotificationSettings.notifications.preferences = {
                ...DEFAULT_USER_NOTIFICATION_PREFERENCES,
                ...userNotificationSettings.notifications.preferences,
            };
        }

        // Default to true if no preferences set (booking approval is important)
        const shouldSendWeb = userNotificationSettings?.notifications?.preferences?.booking_confirmation?.web !== false;
        const shouldSendPush = userNotificationSettings?.notifications?.preferences?.booking_confirmation?.push !== false;
        const shouldSendEmail = userNotificationSettings?.notifications?.preferences?.booking_confirmation?.email !== false;

        // Send web notification to user
        if (shouldSendWeb) {
            await ctx.db.insert("notifications", {
                businessId,
                recipientType: "consumer",
                recipientUserId: userId,
                type: "booking_approved",
                title: "Booking approved!",
                message: `Your booking for ${classInstance?.name || classInstance.templateSnapshot.name} at ${classInstance.venueSnapshot.name} has been approved.`,
                relatedBookingId: bookingId,
                relatedClassInstanceId: classInstanceId,
                seen: false,
                deliveryStatus: "pending",
                retryCount: 0,
                sentToEmail: false,
                sentToWeb: false,
                sentToPush: false,
                metadata: {
                    className: classInstance?.name || classInstance.templateSnapshot.name,
                    userName: user.name,
                    userEmail: user.email,
                    amount: creditsPaid,
                },
                createdAt: Date.now(),
                createdBy: userId,
            });
        }

        // Send push notification to user
        if (shouldSendPush) {
            const notificationContent = createNotificationWithDeepLink(
                'booking_approved',
                'Booking approved!',
                `Your booking for ${classInstance.name || classInstance.templateSnapshot.name} at ${classInstance.venueSnapshot?.name} has been approved.`,
                {
                    classInstanceId: classInstanceId,
                    bookingId: bookingId,
                    additionalData: {
                        businessId: businessId,
                        businessName: business.name,
                        className: classInstance.name || classInstance.templateSnapshot.name,
                        venueName: classInstance.venueSnapshot?.name,
                        classTime: format(classInstance.startTime, 'MMM d, yyyy h:mm a'),
                    }
                }
            );

            await safeSendPushNotification(ctx, {
                userId: userId,
                notification: notificationContent,
            });
        }

        // Send email notification to user
        if (shouldSendEmail && process.env.NODE_ENV === "production") {
            try {
                await ctx.scheduler.runAfter(0, internal.actions.email.sendBookingNotificationEmail, {
                    businessEmail: business.email,
                    businessName: business.name,
                    customerName: user.name || user.email || "Customer",
                    customerEmail: user.email,
                    className: classInstance.name || classInstance.templateSnapshot.name || "",
                    venueName: classInstance.venueSnapshot?.name || "",
                    classTime: format(classInstance.startTime, "MMM d, yyyy h:mm a"),
                    bookingAmount: booking.finalPrice,
                    notificationType: 'booking_approved',
                });
            } catch (error) {
                console.error('Error sending email notification:', error);
            }
        }

        return { success: true };
    },

    /**
     * Handle booking rejected event
     * Notifies consumer that their booking request was rejected
     */
    handleBookingRejectedEvent: async ({
        ctx,
        payload,
    }: {
        ctx: MutationCtx;
        payload: {
            bookingId: Id<"bookings">;
            userId: Id<"users">;
            classInstanceId: Id<"classInstances">;
            businessId: Id<"businesses">;
            creditsPaid: number;
            reason?: string;
        };
    }): Promise<{ success: boolean }> => {
        const { bookingId, userId, classInstanceId, businessId, creditsPaid, reason } = payload;

        // Fetch the booking, user, classInstance and business
        const booking = await ctx.db.get(bookingId);
        const [user, classInstance, business] = await Promise.all([
            ctx.db.get(userId),
            ctx.db.get(classInstanceId),
            ctx.db.get(businessId),
        ]);

        if (!user || !classInstance || !business || !booking) {
            throw new ConvexError({
                message: "User, class instance, or business not found",
                field: "userId",
                code: ERROR_CODES.RESOURCE_NOT_FOUND
            });
        }

        // Get user notification settings
        const userNotificationSettings = await coreService.getUserSettings({ ctx, userId });

        if (userNotificationSettings?.notifications) {
            userNotificationSettings.notifications.preferences = {
                ...DEFAULT_USER_NOTIFICATION_PREFERENCES,
                ...userNotificationSettings.notifications.preferences,
            };
        }

        // Default to true if no preferences set (booking rejection is important)
        const shouldSendWeb = userNotificationSettings?.notifications?.preferences?.booking_cancelled_by_business?.web !== false;
        const shouldSendPush = userNotificationSettings?.notifications?.preferences?.booking_cancelled_by_business?.push !== false;
        const shouldSendEmail = userNotificationSettings?.notifications?.preferences?.booking_cancelled_by_business?.email !== false;

        const reasonMessage = reason ? ` Reason: ${reason}` : '';

        // Send web notification to user
        if (shouldSendWeb) {
            await ctx.db.insert("notifications", {
                businessId,
                recipientType: "consumer",
                recipientUserId: userId,
                type: "booking_rejected",
                title: "Booking request declined",
                message: `Your booking request for ${classInstance?.name || classInstance.templateSnapshot.name} at ${classInstance.venueSnapshot.name} was declined.${reasonMessage} Your credits have been refunded.`,
                relatedBookingId: bookingId,
                relatedClassInstanceId: classInstanceId,
                seen: false,
                deliveryStatus: "pending",
                retryCount: 0,
                sentToEmail: false,
                sentToWeb: false,
                sentToPush: false,
                metadata: {
                    className: classInstance?.name || classInstance.templateSnapshot.name,
                    userName: user.name,
                    userEmail: user.email,
                    amount: creditsPaid,
                },
                createdAt: Date.now(),
                createdBy: userId,
            });
        }

        // Send push notification to user
        if (shouldSendPush) {
            const notificationContent = createNotificationWithDeepLink(
                'booking_rejected',
                'Booking request declined',
                `Your booking request for ${classInstance.name || classInstance.templateSnapshot.name} was declined.${reasonMessage} Your credits have been refunded.`,
                {
                    classInstanceId: classInstanceId,
                    bookingId: bookingId,
                    additionalData: {
                        businessId: businessId,
                        businessName: business.name,
                        className: classInstance.name || classInstance.templateSnapshot.name,
                        venueName: classInstance.venueSnapshot?.name,
                        classTime: format(classInstance.startTime, 'MMM d, yyyy h:mm a'),
                        reason: reason,
                    }
                }
            );

            await safeSendPushNotification(ctx, {
                userId: userId,
                notification: notificationContent,
            });
        }

        // Send email notification to user
        if (shouldSendEmail && process.env.NODE_ENV === "production") {
            try {
                await ctx.scheduler.runAfter(0, internal.actions.email.sendBookingNotificationEmail, {
                    businessEmail: business.email,
                    businessName: business.name,
                    customerName: user.name || user.email || "Customer",
                    customerEmail: user.email,
                    className: classInstance.name || classInstance.templateSnapshot.name || "",
                    venueName: classInstance.venueSnapshot?.name || "",
                    classTime: format(classInstance.startTime, "MMM d, yyyy h:mm a"),
                    bookingAmount: booking.finalPrice,
                    notificationType: 'booking_rejected',
                });
            } catch (error) {
                console.error('Error sending email notification:', error);
            }
        }

        return { success: true };
    },
};
