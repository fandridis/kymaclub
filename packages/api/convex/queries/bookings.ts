import { query } from "../_generated/server";
import { v } from "convex/values";
import { getAuthenticatedUserOrThrow } from "../utils";
import { bookingService } from "../../services/bookingService";
import { paginationOptsValidator } from "convex/server";

/**
 * Get current user's booking for a specific class instance
 * Used to check if user has already booked a class
 */
export const getUserBookings = query({
  args: {
    classInstanceId: v.id("classInstances"),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUserOrThrow(ctx);
    return bookingService.getUserBookingForClassInstance({ ctx, args, user });
  },
});

/**
 * Get specific booking by ID (must belong to current user)
 */
export const getBookingDetails = query({
  args: {
    bookingId: v.id("bookings"),
  },
  returns: v.any(), // BookingWithDetails
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUserOrThrow(ctx);
    return bookingService.getBookingById({ ctx, args, user });
  },
});

/**
 * Get current user's upcoming bookings
 */
export const getCurrentUserUpcomingBookings = query({
  args: {
    daysAhead: v.optional(v.number()),
  },
  returns: v.array(v.any()), // BookingWithDetails array
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUserOrThrow(ctx);
    return bookingService.getCurrentUserUpcomingBookings({ ctx, args, user });
  },
});

/**
 * Get current user's bookings with pagination
 */
export const getCurrentUserBookings = query({
  args: {
    paginationOpts: paginationOptsValidator,
    includeHistory: v.optional(v.boolean()),
  },
  returns: v.object({
    page: v.array(v.any()), // BookingWithDetails array
    isDone: v.boolean(),
    continueCursor: v.string(),
  }),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUserOrThrow(ctx);
    return bookingService.getCurrentUserBookings({ ctx, args, user });
  },
});

/**
 * Get current user's booking history
 */
export const getCurrentUserBookingHistory = query({
  args: {
    paginationOpts: paginationOptsValidator,
    daysBack: v.optional(v.number()),
  },
  returns: v.object({
    page: v.array(v.any()), // BookingWithDetails array
    isDone: v.boolean(),
    continueCursor: v.string(),
  }),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUserOrThrow(ctx);
    return bookingService.getCurrentUserBookingHistory({ ctx, args, user });
  },
});