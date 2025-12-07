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

/**
 * Get all bookings for a specific class instance
 * Used by business dashboard to display all bookings for a class
 */
export const getBookingsForClassInstance = query({
  args: {
    classInstanceId: v.id("classInstances"),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUserOrThrow(ctx);
    // For now, we'll use a simple query - in the future this could be moved to a service
    return await ctx.db
      .query("bookings")
      .withIndex("by_class_instance_status", (q) => q.eq("classInstanceId", args.classInstanceId))
      .collect();
  },
});

/***************************************************************
 * 🆕 OPTIMIZED BOOKING QUERIES WITH COMPOUND INDEXES
 * Eliminate expensive filter operations for better performance
 ***************************************************************/

/**
 * Get user bookings with status filtering - OPTIMIZED
 * Uses compound index to avoid expensive filter operations
 */
export const getUserBookingsOptimized = query({
  args: {
    userId: v.id("users"),
    status: v.optional(v.union(
      v.literal("pending"),
      v.literal("completed"),
      v.literal("cancelled_by_consumer"),
      v.literal("cancelled_by_business"),
      v.literal("cancelled_by_business_rebookable"),
      v.literal("no_show")
    )),
    includeDeleted: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query;

    if (args.status) {
      if (args.includeDeleted) {
        // Use status-specific index
        query = ctx.db
          .query("bookings")
          .withIndex("by_user_status_created", (q) =>
            q.eq("userId", args.userId).eq("status", args.status!)
          );
      } else {
        // 🔥 OPTIMIZED: Use compound index for user + status + deleted
        query = ctx.db
          .query("bookings")
          .withIndex("by_user_status_deleted", (q) =>
            q.eq("userId", args.userId)
              .eq("status", args.status!)
              .eq("deleted", false)
          );
      }
    } else {
      query = ctx.db
        .query("bookings")
        .withIndex("by_user_class", (q) => q.eq("userId", args.userId));

      if (!args.includeDeleted) {
        query = query.filter(q => q.neq(q.field("deleted"), true));
      }
    }

    return query
      .order("desc")
      .take(args.limit || 50);
  },
});

/**
 * Get business bookings with date range - OPTIMIZED
 * Uses compound index for efficient date range queries
 */
export const getBusinessBookingsOptimized = query({
  args: {
    businessId: v.id("businesses"),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    status: v.optional(v.union(
      v.literal("pending"),
      v.literal("completed"),
      v.literal("cancelled_by_consumer"),
      v.literal("cancelled_by_business"),
      v.literal("cancelled_by_business_rebookable"),
      v.literal("no_show")
    )),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query;

    if (args.startDate) {
      // 🔥 OPTIMIZED: Use compound index for business + date
      query = ctx.db
        .query("bookings")
        .withIndex("by_business_created", (q) =>
          q.eq("businessId", args.businessId)
            .gte("createdAt", args.startDate!)
        );
    } else {
      query = ctx.db
        .query("bookings")
        .withIndex("by_business_created", (q) => q.eq("businessId", args.businessId));
    }

    // Apply additional filters
    if (args.endDate) {
      query = query.filter(q => q.lte(q.field("createdAt"), args.endDate!));
    }

    if (args.status) {
      query = query.filter(q => q.eq(q.field("status"), args.status!));
    }

    // Exclude deleted bookings
    query = query.filter(q => q.neq(q.field("deleted"), true));

    return query
      .order("desc")
      .take(args.limit || 100);
  },
});

/**
 * Get active bookings for class instance - OPTIMIZED
 * Uses compound index to quickly find pending bookings
 */
export const getActiveBookingsForClass = query({
  args: {
    classInstanceId: v.id("classInstances"),
  },
  handler: async (ctx, args) => {
    // 🔥 OPTIMIZED: Use compound index for instance + status
    return await ctx.db
      .query("bookings")
      .withIndex("by_class_instance_status", (q) =>
        q.eq("classInstanceId", args.classInstanceId)
          .eq("status", "pending")
      )
      .collect();
  },
});

/***************************************************************
 * 🆕 ACTIVE BOOKINGS LIMITS - BL-001 BUSINESS RULE
 * Enforce maximum active bookings per user to prevent overbooking
 ***************************************************************/

/**
 * Get current user's active bookings count and limit
 * Returns both current count and maximum allowed for UX display
 * 
 * Business Rule BL-001: Maximum Active Bookings Limit
 * - Users can only have 5 active bookings simultaneously
 * - Active = pending status + future startTime + not deleted
 */
export const getActiveBookingsCount = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedUserOrThrow(ctx);
    return bookingService.getActiveBookingsCount({ ctx, user });
  },
});

/**
 * Get current user's active bookings with details
 * Returns detailed information for UX display (cancel booking suggestions, etc.)
 */
export const getActiveBookingsDetails = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedUserOrThrow(ctx);
    return bookingService.getActiveBookingsDetails({ ctx, user });
  },
});

/**
 * Get current user's booking statistics
 * Returns booking count for current month and all time
 */
export const getUserBookingStats = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedUserOrThrow(ctx);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    // Get all completed bookings for all time
    const allTimeBookings = await ctx.db
      .query("bookings")
      .withIndex("by_user_status_deleted", (q) =>
        q.eq("userId", user._id)
          .eq("status", "completed")
          .eq("deleted", false)
      )
      .collect();

    // Filter for this month
    const thisMonthBookings = allTimeBookings.filter(booking =>
      booking.createdAt >= startOfMonth
    );

    return {
      thisMonth: thisMonthBookings.length,
      allTime: allTimeBookings.length
    };
  },
});

