import { mutation } from "../_generated/server";
import { Infer, v } from "convex/values";
import { getAuthenticatedUserOrThrow } from "../utils";
import { chatService } from "../../services/chatService";
import { mutationWithTriggers } from "../triggers";

// Mutation args validation
export const sendMessageArgs = v.object({
  venueId: v.id("venues"),
  content: v.string(),
  messageType: v.optional(v.union(
    v.literal("text"),
    v.literal("booking_reference")
  )),
  relatedBookingId: v.optional(v.id("bookings")),
  relatedClassInstanceId: v.optional(v.id("classInstances")),
});
export type SendMessageArgs = Infer<typeof sendMessageArgs>;

export const markMessagesAsReadArgs = v.object({
  threadId: v.id("chatMessageThreads"),
  messageIds: v.optional(v.array(v.id("chatMessages"))), // If not provided, marks all as read
});
export type MarkMessagesAsReadArgs = Infer<typeof markMessagesAsReadArgs>;

export const createSystemMessageArgs = v.object({
  threadId: v.optional(v.id("chatMessageThreads")), // If not provided, will create thread
  venueId: v.id("venues"),
  userId: v.id("users"),
  content: v.string(),
  messageType: v.union(
    v.literal("system"),
    v.literal("cancellation_card")
  ),
  systemContext: v.optional(v.object({
    type: v.union(
      v.literal("booking_confirmed"),
      v.literal("booking_cancelled"),
      v.literal("class_cancelled"),
      v.literal("payment_processed"),
      v.literal("thread_created")
    ),
    metadata: v.optional(v.any()),
  })),
  cancellationData: v.optional(v.object({
    className: v.string(),
    instructorName: v.string(),
    originalDateTime: v.number(),
    cancellationReason: v.optional(v.string()),
    canRebook: v.boolean(),
  })),
});
export type CreateSystemMessageArgs = Infer<typeof createSystemMessageArgs>;

export const archiveThreadArgs = v.object({
  threadId: v.id("chatMessageThreads"),
});
export type ArchiveThreadArgs = Infer<typeof archiveThreadArgs>;

/**
 * Send a message to a venue
 * Creates thread if it doesn't exist, then sends the message
 */
export const sendMessage = mutationWithTriggers({
  args: sendMessageArgs,
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUserOrThrow(ctx);
    
    // Delegate to service layer
    const result = await chatService.sendMessage({ ctx, args, user });
    return result;
  },
});

/**
 * Mark messages as read by the current user
 * Updates read status and decreases unread counts
 */
export const markMessagesAsRead = mutation({
  args: markMessagesAsReadArgs,
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUserOrThrow(ctx);
    
    const result = await chatService.markMessagesAsRead({ ctx, args, user });
    return result;
  },
});

/**
 * Create a system message (used internally for booking updates, etc.)
 * This is typically called by other services, not directly by users
 */
export const createSystemMessage = mutationWithTriggers({
  args: createSystemMessageArgs,
  handler: async (ctx, args) => {
    // Note: This doesn't require authentication as it's called internally
    // The service will validate the caller has appropriate permissions
    
    const result = await chatService.createSystemMessage({ ctx, args });
    return result;
  },
});

/**
 * Archive a message thread
 * Moves thread to archived status but keeps messages
 */
export const archiveThread = mutation({
  args: archiveThreadArgs,
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUserOrThrow(ctx);
    
    const result = await chatService.archiveThread({ ctx, args, user });
    return result;
  },
});

/**
 * Get or create a message thread between user and venue
 * Returns existing thread or creates a new one
 */
export const getOrCreateThread = mutation({
  args: v.object({
    venueId: v.id("venues"),
  }),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUserOrThrow(ctx);
    
    const result = await chatService.getOrCreateThread({ ctx, args, user });
    return result;
  },
});

/**
 * Send a reply to an existing thread (for venue staff)
 * Venue staff use this to reply to customer messages
 */
const sendReplyArgs = v.object({
  threadId: v.id("chatMessageThreads"),
  content: v.string(),
  messageType: v.optional(v.union(
    v.literal("text"),
    v.literal("system"),
    v.literal("cancellation_card")
  )),
  relatedBookingId: v.optional(v.id("bookings")),
  relatedClassInstanceId: v.optional(v.id("classInstances")),
});

export const sendReply = mutationWithTriggers({
  args: sendReplyArgs,
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUserOrThrow(ctx);
    const result = await chatService.sendReply({ ctx, args, user });
    return result;
  },
});

/**
 * Delete a message thread and all its messages
 * This is a hard delete that removes the thread completely
 */
export const deleteThread = mutation({
  args: v.object({
    threadId: v.id("chatMessageThreads"),
  }),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUserOrThrow(ctx);
    
    const result = await chatService.deleteThread({ ctx, args, user });
    return result;
  },
});