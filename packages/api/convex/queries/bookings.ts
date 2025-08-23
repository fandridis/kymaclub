import { query } from "../_generated/server";
import { v } from "convex/values";
import { getAuthenticatedUserOrThrow } from "../utils";
import { bookingService } from "../../services/bookingService";
import { paginationOptsValidator } from "convex/server";
import { classInstanceService } from "../../services/classInstanceService";

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
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUserOrThrow(ctx);
    return bookingService.getCurrentUserBookings({ ctx, args, user });
  },
});

/**
 * Get current user's booking history for a specific class instance
 */
export const getUserBookingHistory = query({
  args: {
    classInstanceId: v.id("classInstances"),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUserOrThrow(ctx);
    return bookingService.getUserBookingHistoryForClassInstance({ ctx, args, user });
  },
});

/**
 * Get class instances with their bookings for the current business
 * Used by business dashboard to display bookings grouped by class instance
 */
export const getClassInstancesWithBookings = query({
  args: {
    startDate: v.number(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUserOrThrow(ctx);
    return classInstanceService.getClassInstancesWithBookings({ ctx, args, user });
  },
});

