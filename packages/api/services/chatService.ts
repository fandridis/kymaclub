import type { PaginationResult, PaginationOptions } from "convex/server";
import type { Doc, Id } from "../convex/_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../convex/_generated/server";
import { ERROR_CODES } from "../utils/errorCodes";
import { ConvexError } from "convex/values";
import { logger } from "../utils/logger";
import { presenceService } from "./presenceService";
import { generateConversationLink } from "../utils/deep-linking";
import { internal } from "../convex/_generated/api";

/***************************************************************
 * Chat Service - All messaging-related operations
 ***************************************************************/
export const chatService = {
    /***************************************************************
     * Get User Message Threads Handler
     * Returns paginated message threads for the authenticated user
     ***************************************************************/
    getUserMessageThreads: async ({
        ctx,
        args,
        user,
    }: {
        ctx: QueryCtx;
        args: {
            paginationOpts: PaginationOptions;
        };
        user: Doc<"users">;
    }): Promise<PaginationResult<Doc<"chatMessageThreads">>> => {
        // Get paginated message threads for current user, ordered by last message time
        const result = await ctx.db
            .query("chatMessageThreads")
            .withIndex("by_user_last_message", q => q.eq("userId", user._id))
            .filter(q => q.and(
                q.neq(q.field("deleted"), true),
                q.neq(q.field("status"), "blocked")
            ))
            .order("desc") // Most recent message first
            .paginate(args.paginationOpts);

        return result;
    },

    /***************************************************************
     * Get Thread Messages Handler
     * Returns paginated messages within a specific thread
     ***************************************************************/
    getThreadMessages: async ({
        ctx,
        args,
        user,
    }: {
        ctx: QueryCtx;
        args: {
            threadId: Id<"chatMessageThreads">;
            paginationOpts: PaginationOptions;
        };
        user: Doc<"users">;
    }): Promise<PaginationResult<Doc<"chatMessages">>> => {
        // Verify user has access to this thread
        const thread = await ctx.db.get(args.threadId);
        if (!thread) {
            throw new ConvexError({
                message: "Message thread not found",
                code: ERROR_CODES.CHAT_THREAD_NOT_FOUND,
            });
        }

        // Check if user is part of this thread
        if (thread.userId !== user._id) {
            // Also check if user has business role for venue-side access
            if (!user.businessId || thread.businessId !== user.businessId) {
                throw new ConvexError({
                    message: "You don't have access to this message thread",
                    code: ERROR_CODES.CHAT_THREAD_ACCESS_DENIED,
                });
            }
        }

        // Get paginated messages for thread, ordered by creation time (newest first for chat pagination)
        const result = await ctx.db
            .query("chatMessages")
            .withIndex("by_thread_created", q => q.eq("threadId", args.threadId))
            .filter(q => q.neq(q.field("deleted"), true))
            .order("desc") // Newest first for proper chat pagination
            .paginate(args.paginationOpts);

        return result;
    },

    /***************************************************************
     * Get Thread By User And Venue Handler
     * Finds existing thread between user and venue
     ***************************************************************/
    getThreadByUserAndVenue: async ({
        ctx,
        args,
        user,
    }: {
        ctx: QueryCtx;
        args: {
            venueId: Id<"venues">;
        };
        user: Doc<"users">;
    }): Promise<Doc<"chatMessageThreads"> | null> => {
        // Find existing thread between user and venue
        const existingThread = await ctx.db
            .query("chatMessageThreads")
            .withIndex("by_user_venue", q =>
                q.eq("userId", user._id).eq("venueId", args.venueId)
            )
            .filter(q => q.neq(q.field("deleted"), true))
            .first();

        return existingThread;
    },

    /***************************************************************
     * Get Unread Message Count Handler
     * Returns total unread messages for current user
     ***************************************************************/
    getUnreadMessageCount: async ({
        ctx,
        args,
        user,
    }: {
        ctx: QueryCtx;
        args: {};
        user: Doc<"users">;
    }): Promise<number> => {
        // Sum up unread counts from all active threads
        const threads = await ctx.db
            .query("chatMessageThreads")
            .withIndex("by_user", q => q.eq("userId", user._id))
            .filter(q => q.and(
                q.neq(q.field("deleted"), true),
                q.eq(q.field("status"), "active")
            ))
            .collect();

        const totalUnread = threads.reduce((sum, thread) => sum + (thread.unreadCountConsumer || 0), 0);
        return totalUnread;
    },

    /***************************************************************
     * Get Thread By ID Handler
     * Returns specific thread details
     ***************************************************************/
    getThreadById: async ({
        ctx,
        args,
        user,
    }: {
        ctx: QueryCtx;
        args: {
            threadId: Id<"chatMessageThreads">;
        };
        user: Doc<"users">;
    }): Promise<Doc<"chatMessageThreads"> | null> => {
        const thread = await ctx.db.get(args.threadId);
        if (!thread) return null;

        // Check access permissions
        if (thread.userId !== user._id) {
            // Also check if user has business role for venue-side access
            if (!user.businessId || thread.businessId !== user.businessId) {
                throw new ConvexError({
                    message: "You don't have access to this message thread",
                    code: ERROR_CODES.CHAT_THREAD_ACCESS_DENIED,
                });
            }
        }

        return thread;
    },

    /***************************************************************
     * Send Message Handler
     * Creates or updates thread and sends a message
     ***************************************************************/
    sendMessage: async ({
        ctx,
        args,
        user,
    }: {
        ctx: MutationCtx;
        args: {
            venueId: Id<"venues">;
            content: string;
            messageType?: "text" | "booking_reference";
            relatedBookingId?: Id<"bookings">;
            relatedClassInstanceId?: Id<"classInstances">;
        };
        user: Doc<"users">;
    }): Promise<{ threadId: Id<"chatMessageThreads">; messageId: Id<"chatMessages"> }> => {
        const { venueId, content, messageType = "text", relatedBookingId, relatedClassInstanceId } = args;
        const now = Date.now();

        // Validate content
        if (!content.trim()) {
            throw new ConvexError({
                message: "Message content cannot be empty",
                code: ERROR_CODES.CHAT_EMPTY_MESSAGE,
            });
        }

        if (content.length > 500) {
            throw new ConvexError({
                message: "Message content cannot exceed 500 characters",
                code: ERROR_CODES.CHAT_MESSAGE_TOO_LONG,
            });
        }

        // Get venue details
        const venue = await ctx.db.get(venueId);
        if (!venue || venue.deleted) {
            throw new ConvexError({
                message: "Venue not found",
                code: ERROR_CODES.VENUE_NOT_FOUND,
            });
        }

        // Find or create thread - this mutation is for consumers only
        // Venue staff should use the sendReply mutation instead
        let thread = await ctx.db
            .query("chatMessageThreads")
            .withIndex("by_user_venue", q =>
                q.eq("userId", user._id).eq("venueId", venueId)
            )
            .filter(q => q.neq(q.field("deleted"), true))
            .first();

        if (!thread) {
            // Create new thread
            const threadId = await ctx.db.insert("chatMessageThreads", {
                businessId: venue.businessId,
                venueId: venueId,
                userId: user._id,
                status: "active",
                userSnapshot: {
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                },
                venueSnapshot: {
                    name: venue.name,
                },
                lastMessageAt: now,
                lastMessagePreview: content.substring(0, 100),
                lastMessageSender: "consumer",
                unreadCountConsumer: 0,
                unreadCountVenue: 1, // Venue has 1 unread message
                messageCount: 1,
                createdAt: now,
                createdBy: user._id,
            });

            thread = await ctx.db.get(threadId);
            if (!thread) {
                throw new ConvexError({
                    message: "Failed to create message thread",
                    code: ERROR_CODES.CHAT_THREAD_CREATION_FAILED,
                });
            }
        }

        // Create message
        const messageId = await ctx.db.insert("chatMessages", {
            threadId: thread._id,
            businessId: venue.businessId,
            venueId: venueId,
            content: content.trim(),
            messageType,
            senderType: "consumer",
            senderId: user._id,
            senderSnapshot: {
                name: user.name,
                email: user.email,
            },
            readByConsumer: true,
            readByVenue: false,
            readByConsumerAt: now,
            relatedBookingId,
            relatedClassInstanceId,
            createdAt: now,
            createdBy: user._id,
        });

        // Update thread with new message info
        await ctx.db.patch(thread._id, {
            lastMessageAt: now,
            lastMessagePreview: content.substring(0, 100),
            lastMessageSender: "consumer",
            unreadCountVenue: (thread.unreadCountVenue || 0) + 1,
            messageCount: (thread.messageCount || 0) + 1,
            updatedAt: now,
            updatedBy: user._id,
        });

        logger.info(`Message sent from user ${user._id} to venue ${venueId}`, {
            threadId: thread._id,
            messageId,
            messageType,
        });

        // ADR-020: Smart Notification Delivery for Chat Messages
        // Check if we should send push notification based on recipient presence
        try {
            // For consumer messages, notify venue staff (business owner)
            // In the future, this could be expanded to notify specific venue staff members
            const business = await ctx.db.get(venue.businessId);
            if (business) {
                // Find business owner/admin to notify
                const businessUsers = await ctx.db
                    .query("users")
                    .filter(q => q.eq(q.field("businessId"), venue.businessId))
                    .collect();

                const businessOwner = businessUsers.find(u => u.businessRole === "owner") || businessUsers[0];

                if (businessOwner) {
                    const deliveryDecision = await presenceService.shouldDeliverNotification({
                        ctx,
                        context: {
                            recipientUserId: businessOwner._id,
                            threadId: thread._id,
                            messageTimestamp: now,
                        },
                    });

                    if (deliveryDecision.shouldSend) {
                        // Send push notification via internal mutation
                        await ctx.runMutation(internal.mutations.pushNotifications.sendPushNotification, {
                            to: businessOwner._id,
                            notification: {
                                title: `New message from ${user.name || 'Customer'}`,
                                body: content.substring(0, 100) + (content.length > 100 ? '...' : ''),
                                data: {
                                    type: 'chat_message',
                                    threadId: thread._id,
                                    venueName: venue.name,
                                    venueId: venue._id,
                                    deepLink: generateConversationLink(thread._id, { venueName: venue.name }),
                                },
                                sound: 'default',
                                priority: 'high' as const,
                                channelId: 'chat_messages',
                            },
                        });
                        

                        logger.debug("Push notification sent for chat message", {
                            recipientId: businessOwner._id,
                            threadId: thread._id,
                            reason: deliveryDecision.reason,
                        });
                    } else {
                        logger.debug("Push notification skipped for chat message", {
                            recipientId: businessOwner._id,
                            threadId: thread._id,
                            reason: deliveryDecision.reason,
                        });
                    }
                }
            }
        } catch (error) {
            // Don't fail the message sending if notification fails
            logger.error("Failed to send push notification for chat message", {
                error: error instanceof Error ? error.message : String(error),
                threadId: thread._id,
                messageId,
            });
        }

        return { threadId: thread._id, messageId };
    },

    /***************************************************************
     * Mark Messages As Read Handler
     * Updates read status for messages and decreases unread counts
     ***************************************************************/
    markMessagesAsRead: async ({
        ctx,
        args,
        user,
    }: {
        ctx: MutationCtx;
        args: {
            threadId: Id<"chatMessageThreads">;
            messageIds?: Id<"chatMessages">[];
        };
        user: Doc<"users">;
    }): Promise<{ updatedCount: number }> => {
        const { threadId, messageIds } = args;
        const now = Date.now();

        // Verify thread access
        const thread = await ctx.db.get(threadId);
        if (!thread) {
            throw new ConvexError({
                message: "Message thread not found",
                code: ERROR_CODES.CHAT_THREAD_NOT_FOUND,
            });
        }

        // Check access permissions
        const isConsumer = thread.userId === user._id;
        const isVenueStaff = user.businessId && thread.businessId === user.businessId;

        if (!isConsumer && !isVenueStaff) {
            throw new ConvexError({
                message: "You don't have access to this message thread",
                code: ERROR_CODES.CHAT_THREAD_ACCESS_DENIED,
            });
        }

        // Determine which messages to mark as read
        let messagesToUpdate: Doc<"chatMessages">[];

        if (messageIds && messageIds.length > 0) {
            // Mark specific messages as read
            messagesToUpdate = [];
            for (const messageId of messageIds) {
                const message = await ctx.db.get(messageId);
                if (message && message.threadId === threadId) {
                    messagesToUpdate.push(message);
                }
            }
        } else {
            // Mark all unread messages in thread as read
            messagesToUpdate = await ctx.db
                .query("chatMessages")
                .withIndex("by_thread", q => q.eq("threadId", threadId))
                .filter(q => q.and(
                    q.neq(q.field("deleted"), true),
                    isConsumer ?
                        q.eq(q.field("readByConsumer"), false) :
                        q.eq(q.field("readByVenue"), false)
                ))
                .collect();
        }

        // Update messages
        let updatedCount = 0;
        for (const message of messagesToUpdate) {
            if (isConsumer && !message.readByConsumer) {
                await ctx.db.patch(message._id, {
                    readByConsumer: true,
                    readByConsumerAt: now,
                });
                updatedCount++;
            } else if (isVenueStaff && !message.readByVenue) {
                await ctx.db.patch(message._id, {
                    readByVenue: true,
                    readByVenueAt: now,
                });
                updatedCount++;
            }
        }

        // Update thread unread counts
        if (updatedCount > 0) {
            if (isConsumer) {
                await ctx.db.patch(threadId, {
                    unreadCountConsumer: Math.max(0, (thread.unreadCountConsumer || 0) - updatedCount),
                    updatedAt: now,
                    updatedBy: user._id,
                });
            } else {
                await ctx.db.patch(threadId, {
                    unreadCountVenue: Math.max(0, (thread.unreadCountVenue || 0) - updatedCount),
                    updatedAt: now,
                    updatedBy: user._id,
                });
            }
        }

        logger.info(`Marked ${updatedCount} messages as read`, {
            threadId,
            userId: user._id,
            isConsumer,
        });

        return { updatedCount };
    },

    /***************************************************************
     * Create System Message Handler
     * Creates automated system messages for bookings, cancellations, etc.
     ***************************************************************/
    createSystemMessage: async ({
        ctx,
        args,
    }: {
        ctx: MutationCtx;
        args: {
            threadId?: Id<"chatMessageThreads">;
            venueId: Id<"venues">;
            userId: Id<"users">;
            content: string;
            messageType: "system" | "cancellation_card";
            systemContext?: {
                type: "booking_confirmed" | "booking_cancelled" | "class_cancelled" | "payment_processed" | "thread_created";
                metadata?: any;
            };
            cancellationData?: {
                className: string;
                instructorName: string;
                originalDateTime: number;
                cancellationReason?: string;
                canRebook: boolean;
            };
        };
    }): Promise<{ threadId: Id<"chatMessageThreads">; messageId: Id<"chatMessages"> }> => {
        const { threadId, venueId, userId, content, messageType, systemContext, cancellationData } = args;
        const now = Date.now();

        // Get or create thread
        let thread: Doc<"chatMessageThreads">;

        if (threadId) {
            const existingThread = await ctx.db.get(threadId);
            if (!existingThread) {
                throw new ConvexError({
                    message: "Message thread not found",
                    code: ERROR_CODES.CHAT_THREAD_NOT_FOUND,
                });
            }
            thread = existingThread;
        } else {
            // Find existing thread or create new one
            const existingThread = await ctx.db
                .query("chatMessageThreads")
                .withIndex("by_user_venue", q =>
                    q.eq("userId", userId).eq("venueId", venueId)
                )
                .filter(q => q.neq(q.field("deleted"), true))
                .first();

            if (existingThread) {
                thread = existingThread;
            } else {
                // Create new thread for system message
                const user = await ctx.db.get(userId);
                const venue = await ctx.db.get(venueId);

                if (!user || !venue) {
                    throw new ConvexError({
                        message: "User or venue not found",
                        code: ERROR_CODES.CHAT_INVALID_PARTICIPANTS,
                    });
                }

                const newThreadId = await ctx.db.insert("chatMessageThreads", {
                    businessId: venue.businessId,
                    venueId: venueId,
                    userId: userId,
                    status: "active",
                    userSnapshot: {
                        name: user.name,
                        email: user.email,
                        phone: user.phone,
                    },
                    venueSnapshot: {
                        name: venue.name,
                    },
                    lastMessageAt: now,
                    lastMessagePreview: content.substring(0, 100),
                    lastMessageSender: "venue", // System messages appear as from venue
                    unreadCountConsumer: 1, // Consumer has 1 unread system message
                    unreadCountVenue: 0,
                    messageCount: 1,
                    createdAt: now,
                    createdBy: userId, // System creates on behalf of user interaction
                });

                const newThread = await ctx.db.get(newThreadId);
                if (!newThread) {
                    throw new ConvexError({
                        message: "Failed to create message thread",
                        code: ERROR_CODES.CHAT_THREAD_CREATION_FAILED,
                    });
                }
                thread = newThread;
            }
        }

        // Create system message
        const messageId = await ctx.db.insert("chatMessages", {
            threadId: thread._id,
            businessId: thread.businessId,
            venueId: venueId,
            content,
            messageType,
            senderType: "system",
            senderId: undefined, // System messages have no sender
            readByConsumer: false,
            readByVenue: true, // System messages are auto-read by venue
            readByVenueAt: now,
            systemContext,
            cancellationData,
            createdAt: now,
            createdBy: userId, // Track who triggered the system message
        });

        // Update thread with new message info
        await ctx.db.patch(thread._id, {
            lastMessageAt: now,
            lastMessagePreview: content.substring(0, 100),
            lastMessageSender: "venue", // System messages appear as from venue
            unreadCountConsumer: (thread.unreadCountConsumer || 0) + 1,
            messageCount: (thread.messageCount || 0) + 1,
            updatedAt: now,
            updatedBy: userId,
        });

        logger.info(`System message created`, {
            threadId: thread._id,
            messageId,
            messageType,
            systemContext: systemContext?.type,
        });

        return { threadId: thread._id, messageId };
    },

    /***************************************************************
     * Archive Thread Handler
     * Moves thread to archived status
     ***************************************************************/
    archiveThread: async ({
        ctx,
        args,
        user,
    }: {
        ctx: MutationCtx;
        args: {
            threadId: Id<"chatMessageThreads">;
        };
        user: Doc<"users">;
    }): Promise<{ success: boolean }> => {
        const { threadId } = args;
        const now = Date.now();

        // Verify thread access
        const thread = await ctx.db.get(threadId);
        if (!thread) {
            throw new ConvexError({
                message: "Message thread not found",
                code: ERROR_CODES.CHAT_THREAD_NOT_FOUND,
            });
        }

        // Check permissions
        const canArchive = thread.userId === user._id ||
            (user.businessId && thread.businessId === user.businessId);

        if (!canArchive) {
            throw new ConvexError({
                message: "You don't have permission to archive this thread",
                code: ERROR_CODES.CHAT_THREAD_ACCESS_DENIED,
            });
        }

        // Update thread status
        await ctx.db.patch(threadId, {
            status: "archived",
            updatedAt: now,
            updatedBy: user._id,
        });

        logger.info(`Thread archived`, {
            threadId,
            userId: user._id,
        });

        return { success: true };
    },

    /***************************************************************
     * Get Or Create Thread Handler
     * Returns existing thread or creates new one between user and venue
     ***************************************************************/
    getOrCreateThread: async ({
        ctx,
        args,
        user,
    }: {
        ctx: MutationCtx;
        args: {
            venueId: Id<"venues">;
        };
        user: Doc<"users">;
    }): Promise<{ threadId: Id<"chatMessageThreads">; isNew: boolean }> => {
        const { venueId } = args;
        const now = Date.now();

        // Check if thread already exists
        const existingThread = await ctx.db
            .query("chatMessageThreads")
            .withIndex("by_user_venue", q =>
                q.eq("userId", user._id).eq("venueId", venueId)
            )
            .filter(q => q.neq(q.field("deleted"), true))
            .first();

        if (existingThread) {
            return { threadId: existingThread._id, isNew: false };
        }

        // Get venue details
        const venue = await ctx.db.get(venueId);
        if (!venue || venue.deleted) {
            throw new ConvexError({
                message: "Venue not found",
                code: ERROR_CODES.VENUE_NOT_FOUND,
            });
        }

        // Create new thread
        const threadId = await ctx.db.insert("chatMessageThreads", {
            businessId: venue.businessId,
            venueId: venueId,
            userId: user._id,
            status: "active",
            userSnapshot: {
                name: user.name,
                email: user.email,
                phone: user.phone,
            },
            venueSnapshot: {
                name: venue.name,
            },
            lastMessageAt: now,
            lastMessagePreview: undefined,
            lastMessageSender: "consumer",
            unreadCountConsumer: 0,
            unreadCountVenue: 0,
            messageCount: 0,
            createdAt: now,
            createdBy: user._id,
        });

        logger.info(`New message thread created`, {
            threadId,
            userId: user._id,
            venueId,
        });

        return { threadId, isNew: true };
    },

    /***************************************************************
     * Get Business Message Threads Handler
     * Returns paginated message threads for the authenticated business user
     ***************************************************************/
    getBusinessMessageThreads: async ({
        ctx,
        args,
        user,
    }: {
        ctx: QueryCtx;
        args: {
            paginationOpts: PaginationOptions;
        };
        user: Doc<"users">;
    }): Promise<PaginationResult<Doc<"chatMessageThreads">>> => {
        // Verify user is part of a business
        if (!user.businessId) {
            throw new ConvexError({
                message: "User is not associated with a business",
                code: ERROR_CODES.CHAT_BUSINESS_ACCESS_REQUIRED,
            });
        }

        // Get paginated message threads for current business, ordered by last message time
        const result = await ctx.db
            .query("chatMessageThreads")
            .withIndex("by_business_last_message", q => q.eq("businessId", user.businessId!))
            .filter(q => q.and(
                q.neq(q.field("deleted"), true),
                q.neq(q.field("status"), "blocked")
            ))
            .order("desc") // Most recent message first
            .paginate(args.paginationOpts);

        return result;
    },

    /***************************************************************
     * Get Business Unread Message Count Handler
     * Returns total unread messages for all venues in the business
     ***************************************************************/
    getBusinessUnreadMessageCount: async ({
        ctx,
        args,
        user,
    }: {
        ctx: QueryCtx;
        args: {};
        user: Doc<"users">;
    }): Promise<number> => {
        // Verify user is part of a business
        if (!user.businessId) {
            throw new ConvexError({
                message: "User is not associated with a business",
                code: ERROR_CODES.CHAT_BUSINESS_ACCESS_REQUIRED,
            });
        }

        // Get all active threads for this business
        const threads = await ctx.db
            .query("chatMessageThreads")
            .withIndex("by_business", q => q.eq("businessId", user.businessId!))
            .filter(q => q.and(
                q.neq(q.field("deleted"), true),
                q.neq(q.field("status"), "blocked")
            ))
            .collect();

        // Sum up unread counts for venue side
        let totalUnread = 0;
        for (const thread of threads) {
            totalUnread += thread.unreadCountVenue || 0;
        }

        return totalUnread;
    },

    /***************************************************************
     * Send Reply Handler (for venue staff)
     * Allows venue staff to reply to existing customer threads
     ***************************************************************/
    sendReply: async ({
        ctx,
        args,
        user,
    }: {
        ctx: MutationCtx;
        args: {
            threadId: Id<"chatMessageThreads">;
            content: string;
            messageType?: "text" | "system" | "cancellation_card";
            relatedBookingId?: Id<"bookings">;
            relatedClassInstanceId?: Id<"classInstances">;
        };
        user: Doc<"users">;
    }): Promise<{ threadId: Id<"chatMessageThreads">; messageId: Id<"chatMessages"> }> => {
        const { threadId, content, messageType = "text", relatedBookingId, relatedClassInstanceId } = args;
        const now = Date.now();

        // Validate content
        if (!content.trim()) {
            throw new ConvexError({
                message: "Message content cannot be empty",
                code: ERROR_CODES.CHAT_EMPTY_MESSAGE,
            });
        }

        if (content.length > 500) {
            throw new ConvexError({
                message: "Message content cannot exceed 500 characters",
                code: ERROR_CODES.CHAT_MESSAGE_TOO_LONG,
            });
        }

        // Get thread
        const thread = await ctx.db.get(threadId);
        if (!thread) {
            throw new ConvexError({
                message: "Message thread not found",
                code: ERROR_CODES.CHAT_THREAD_NOT_FOUND,
            });
        }

        // Verify user has access (must be business staff for the thread's business)
        if (!user.businessId || user.businessId !== thread.businessId) {
            throw new ConvexError({
                message: "You don't have permission to reply to this thread",
                code: ERROR_CODES.CHAT_THREAD_ACCESS_DENIED,
            });
        }

        // Create message
        const messageId = await ctx.db.insert("chatMessages", {
            threadId: thread._id,
            businessId: thread.businessId,
            venueId: thread.venueId,
            content: content.trim(),
            messageType,
            senderType: "venue",
            senderId: user._id,
            senderSnapshot: {
                name: user.name,
                email: user.email,
            },
            readByConsumer: false,
            readByVenue: true,
            readByVenueAt: now,
            relatedBookingId,
            relatedClassInstanceId,
            createdAt: now,
            createdBy: user._id,
        });

        // Update thread with new message info
        await ctx.db.patch(thread._id, {
            lastMessageAt: now,
            lastMessagePreview: content.substring(0, 100),
            lastMessageSender: "venue",
            unreadCountConsumer: (thread.unreadCountConsumer || 0) + 1,
            messageCount: (thread.messageCount || 0) + 1,
            updatedAt: now,
            updatedBy: user._id,
        });

        logger.info(`Message sent from venue staff ${user._id} to thread ${threadId}`, {
            threadId: thread._id,
            messageId,
            messageType,
        });

        // ADR-020: Smart Notification Delivery for Chat Messages (Venue Staff Replies)
        // Check if we should send push notification to the consumer
        try {
            const deliveryDecision = await presenceService.shouldDeliverNotification({
                ctx,
                context: {
                    recipientUserId: thread.userId, // Consumer who started the thread
                    threadId: thread._id,
                    messageTimestamp: now,
                },
            });

            if (deliveryDecision.shouldSend) {
                // Send push notification via internal mutation
                await ctx.runMutation(internal.mutations.pushNotifications.sendPushNotification, {
                    to: thread.userId,
                    notification: {
                        title: `New message from ${thread.venueSnapshot.name}`,
                        body: content.substring(0, 100) + (content.length > 100 ? '...' : ''),
                        data: {
                            type: 'chat_message',
                            threadId: thread._id,
                            venueName: thread.venueSnapshot.name,
                            venueId: thread.venueId,
                            deepLink: generateConversationLink(thread._id, { venueName: thread.venueSnapshot.name }),
                        },
                        sound: 'default',
                        priority: 'high' as const,
                        channelId: 'chat_messages',
                    },
                });
                

                logger.debug("Push notification sent for venue reply", {
                    recipientId: thread.userId,
                    threadId: thread._id,
                    reason: deliveryDecision.reason,
                });
            } else {
                logger.debug("Push notification skipped for venue reply", {
                    recipientId: thread.userId,
                    threadId: thread._id,
                    reason: deliveryDecision.reason,
                });
            }
        } catch (error) {
            // Don't fail the message sending if notification fails
            logger.error("Failed to send push notification for venue reply", {
                error: error instanceof Error ? error.message : String(error),
                threadId: thread._id,
                messageId,
            });
        }

        return { threadId: thread._id, messageId };
    },

    /***************************************************************
     * Delete Thread Handler
     * Hard delete thread and all related messages
     ***************************************************************/
    deleteThread: async ({
        ctx,
        args,
        user,
    }: {
        ctx: MutationCtx;
        args: {
            threadId: Id<"chatMessageThreads">;
        };
        user: Doc<"users">;
    }): Promise<{ success: boolean }> => {
        const { threadId } = args;
        const now = Date.now();

        // Verify thread exists and user has access
        const thread = await ctx.db.get(threadId);
        if (!thread) {
            throw new ConvexError({
                message: "Message thread not found",
                code: ERROR_CODES.CHAT_THREAD_NOT_FOUND,
            });
        }

        // Check access permissions - only consumer who owns the thread can delete it
        const isConsumer = thread.userId === user._id;
        const isVenueStaff = user.businessId && thread.businessId === user.businessId;

        if (!isConsumer && !isVenueStaff) {
            throw new ConvexError({
                message: "You don't have permission to delete this thread",
                code: ERROR_CODES.CHAT_THREAD_ACCESS_DENIED,
            });
        }

        // Delete all messages in the thread
        const messages = await ctx.db
            .query("chatMessages")
            .withIndex("by_thread", q => q.eq("threadId", threadId))
            .collect();

        for (const message of messages) {
            await ctx.db.delete(message._id);
        }

        // Delete the thread itself
        await ctx.db.delete(threadId);

        logger.info(`Thread deleted by user ${user._id}`, {
            threadId,
            messagesDeleted: messages.length,
            deletedBy: isConsumer ? 'consumer' : 'venue_staff',
        });

        return { success: true };
    },
};
