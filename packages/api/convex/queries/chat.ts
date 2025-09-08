import { query } from "../_generated/server";
import { v } from "convex/values";
import { getAuthenticatedUserOrThrow } from "../utils";
import { chatService } from "../../services/chatService";
import { paginationOptsValidator } from "convex/server";

/**
 * Get current user's message threads
 * Returns all conversations between the user and various venues
 */
export const getUserMessageThreads = query({
  args: {
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUserOrThrow(ctx);
    return chatService.getUserMessageThreads({ ctx, args, user });
  },
});

/**
 * Get messages for a specific thread
 * Returns paginated messages within a conversation
 */
export const getThreadMessages = query({
  args: {
    threadId: v.id("chatMessageThreads"),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUserOrThrow(ctx);
    return chatService.getThreadMessages({ ctx, args, user });
  },
});

/**
 * Get a specific message thread by user and venue
 * Used to find or create a conversation between user and venue
 */
export const getThreadByUserAndVenue = query({
  args: {
    venueId: v.id("venues"),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUserOrThrow(ctx);
    return chatService.getThreadByUserAndVenue({ ctx, args, user });
  },
});

/**
 * Get unread message count for current user
 * Returns total count of unread messages across all threads
 */
export const getUnreadMessageCount = query({
  args: {},
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUserOrThrow(ctx);
    return chatService.getUnreadMessageCount({ ctx, args, user });
  },
});

/**
 * Get thread details by ID
 * Returns full thread information with metadata
 */
export const getThreadById = query({
  args: {
    threadId: v.id("chatMessageThreads"),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUserOrThrow(ctx);
    return chatService.getThreadById({ ctx, args, user });
  },
});

/**
 * Get message threads for a business
 * Returns all conversations between customers and the business's venues
 */
export const getBusinessMessageThreads = query({
  args: {
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUserOrThrow(ctx);
    return chatService.getBusinessMessageThreads({ ctx, args, user });
  },
});

/**
 * Get unread message count for a business
 * Returns total count of unread messages across all business venues
 */
export const getBusinessUnreadMessageCount = query({
  args: {},
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUserOrThrow(ctx);
    return chatService.getBusinessUnreadMessageCount({ ctx, args, user });
  },
});