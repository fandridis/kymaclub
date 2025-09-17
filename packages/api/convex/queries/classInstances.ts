import { query } from "../_generated/server";
import { ConvexError, v } from "convex/values";
import { classInstanceService } from "../../services/classInstanceService";
import { getAuthenticatedUserOrThrow } from "../utils";
import { pricingOperations } from "../../operations/pricing";
import { ERROR_CODES } from "../../utils/errorCodes";

/***************************************************************
 * Get Class Instance By ID
 ***************************************************************/

export const getClassInstanceByIdArgs = v.object({
    instanceId: v.id("classInstances"),
});

export const getClassInstanceById = query({
    args: getClassInstanceByIdArgs,
    handler: async (ctx, args) => {
        const user = await getAuthenticatedUserOrThrow(ctx);
        return await classInstanceService.getInstanceById({ ctx, args, user });
    }
});

/***************************************************************
 * Get Class Instance By ID (Consumer Access)
 *
 * Allows authenticated consumers to load class details without
 * requiring a business association. Ensures the instance exists
 * and is not deleted.
 ***************************************************************/

export const getConsumerClassInstanceByIdArgs = v.object({
    instanceId: v.id("classInstances"),
});

export const getConsumerClassInstanceById = query({
    args: getConsumerClassInstanceByIdArgs,
    handler: async (ctx, args) => {
        await getAuthenticatedUserOrThrow(ctx);

        const instance = await ctx.db.get(args.instanceId);

        if (!instance || instance.deleted) {
            throw new ConvexError({
                message: "Instance not found",
                field: "instanceId",
                code: ERROR_CODES.RESOURCE_NOT_FOUND,
            });
        }

        return instance;
    }
});

/***************************************************************
 * Get Class Instances for Date Range
 ***************************************************************/

export const getClassInstancesArgs = v.object({
    startDate: v.number(),
    endDate: v.number(),
});

export const getClassInstances = query({
    args: getClassInstancesArgs,
    handler: async (ctx, args) => {
        const user = await getAuthenticatedUserOrThrow(ctx);
        return await classInstanceService.getInstances({ ctx, args, user });
    }
});

/***************************************************************
 * Get Similar Class Instances
 ***************************************************************/

export const getSimilarClassInstancesArgs = v.object({
    instanceId: v.id("classInstances"),
});

export const getSimilarClassInstances = query({
    args: getSimilarClassInstancesArgs,
    handler: async (ctx, args) => {
        const user = await getAuthenticatedUserOrThrow(ctx);
        return await classInstanceService.getSimilarInstances({ ctx, args, user });
    }
});

/***************************************************************
 * Get Class Instances with Bookings
 ***************************************************************/

export const getClassInstancesWithBookingsArgs = v.object({
    startDate: v.number(),
    limit: v.optional(v.number()),
});

export const getClassInstancesWithBookings = query({
    args: getClassInstancesWithBookingsArgs,
    handler: async (ctx, args) => {
        const user = await getAuthenticatedUserOrThrow(ctx);
        return await classInstanceService.getClassInstancesWithBookings({ ctx, args, user });
    }
});

/***************************************************************
 * 🆕 OPTIMIZED CLASS INSTANCE QUERIES WITH COMPOUND INDEXES
 * Eliminate expensive filter operations for better performance
 ***************************************************************/

/**
 * Get business class instances with date range - OPTIMIZED
 * Uses compound index to avoid expensive filter operations
 */
export const getBusinessClassInstancesOptimized = query({
    args: v.object({
        businessId: v.id("businesses"),
        startDate: v.number(),
        endDate: v.number(),
        includeDeleted: v.optional(v.boolean()),
        status: v.optional(v.union(
            v.literal("scheduled"),
            v.literal("cancelled"),
            v.literal("completed")
        )),
    }),
    handler: async (ctx, args) => {
        let query;

        if (args.status && !args.includeDeleted) {
            // 🔥 OPTIMIZED: Use compound index for business + status + start time
            query = ctx.db
                .query("classInstances")
                .withIndex("by_business_status_start_time", (q) =>
                    q.eq("businessId", args.businessId)
                        .eq("status", args.status!)
                        .gte("startTime", args.startDate)
                );
        } else if (!args.includeDeleted) {
            // 🔥 OPTIMIZED: Use compound index for business + deleted + start time
            query = ctx.db
                .query("classInstances")
                .withIndex("by_business_deleted_start_time", (q) =>
                    q.eq("businessId", args.businessId)
                        .eq("deleted", false)
                        .gte("startTime", args.startDate)
                );
        } else {
            // Use basic business + start time index
            query = ctx.db
                .query("classInstances")
                .withIndex("by_business_start_time", (q) =>
                    q.eq("businessId", args.businessId)
                        .gte("startTime", args.startDate)
                );

            if (args.status) {
                query = query.filter(q => q.eq(q.field("status"), args.status));
            }
        }

        // Apply end date filter (can't be in compound index)
        query = query.filter(q => q.lte(q.field("startTime"), args.endDate));

        return query.collect();
    }
});

/**
 * Get venue class instances - OPTIMIZED
 * Uses compound index for venue + deleted filtering
 */
export const getVenueClassInstancesOptimized = query({
    args: v.object({
        venueId: v.id("venues"),
        startDate: v.number(),
        endDate: v.number(),
        includeDeleted: v.optional(v.boolean()),
    }),
    handler: async (ctx, args) => {
        let query;

        if (!args.includeDeleted) {
            // 🔥 OPTIMIZED: Use compound index for venue + deleted + start time
            query = ctx.db
                .query("classInstances")
                .withIndex("by_venue_deleted_start_time", (q) =>
                    q.eq("venueId", args.venueId)
                        .eq("deleted", false)
                        .gte("startTime", args.startDate)
                );
        } else {
            query = ctx.db
                .query("classInstances")
                .withIndex("by_venue", (q) => q.eq("venueId", args.venueId))
                .filter(q => q.gte(q.field("startTime"), args.startDate));
        }

        // Apply end date filter
        query = query.filter(q => q.lte(q.field("startTime"), args.endDate));

        return query.collect();
    }
});

/**
 * Get template instances - OPTIMIZED  
 * Uses compound index for template + deleted filtering
 */
export const getTemplateInstancesOptimized = query({
    args: v.object({
        templateId: v.id("classTemplates"),
        includeDeleted: v.optional(v.boolean()),
        limit: v.optional(v.number()),
    }),
    handler: async (ctx, args) => {
        let query;

        if (!args.includeDeleted) {
            // 🔥 OPTIMIZED: Use compound index for template + deleted
            query = ctx.db
                .query("classInstances")
                .withIndex("by_template_deleted", (q) =>
                    q.eq("templateId", args.templateId)
                        .eq("deleted", false)
                );
        } else {
            query = ctx.db
                .query("classInstances")
                .withIndex("by_template", (q) => q.eq("templateId", args.templateId));
        }

        return query
            .order("desc")
            .take(args.limit || 100);
    }
});

/***************************************************************
 * Get Last Minute Discounted Class Instances
 * 
 * Returns class instances starting within the next 8 hours that have
 * actual discounts applied based on the pricing system rules.
 * 
 * Only returns classes with low capacity discounts (5%) since early bird
 * discounts require >48 hours advance booking.
 ***************************************************************/

export const getLastMinuteDiscountedClassInstancesArgs = v.object({
    startDate: v.number(), // Current time
    endDate: v.number(),   // 8 hours from now
    limit: v.optional(v.number()),
});

export const getLastMinuteDiscountedClassInstances = query({
    args: getLastMinuteDiscountedClassInstancesArgs,
    handler: async (ctx, args) => {
        const user = await getAuthenticatedUserOrThrow(ctx);

        // Get all scheduled class instances in the 8-hour window
        const instances = await ctx.db
            .query("classInstances")
            .withIndex("by_start_time", (q) =>
                q.gte("startTime", args.startDate)
            )
            .filter(q =>
                q.and(
                    q.lte(q.field("startTime"), args.endDate),
                    q.eq(q.field("status"), "scheduled"),
                    q.neq(q.field("deleted"), true)
                )
            )
            .collect();

        // Get templates for pricing calculations
        const templateIds = [...new Set(instances.map(i => i.templateId))];
        const templateMap = new Map();

        for (const id of templateIds) {
            const template = await ctx.db.get(id);
            if (template) {
                templateMap.set(id, template);
            }
        }

        // Calculate pricing and filter for discounted classes
        const discountedInstances = [];

        for (const instance of instances) {
            const template = templateMap.get(instance.templateId);
            if (!template) continue;

            // Calculate pricing with discounts
            const pricingResult = await pricingOperations.calculateFinalPrice(instance, template);

            // Only include classes with actual discounts (discount > 0)
            if (pricingResult.discountPercentage > 0) {
                discountedInstances.push({
                    ...instance,
                    pricing: pricingResult,
                    discountPercentage: Math.round(pricingResult.discountPercentage * 100), // Convert to percentage (5, 10)
                });
            }
        }

        // Sort by start time and limit results
        return discountedInstances
            .sort((a, b) => a.startTime - b.startTime)
            .slice(0, args.limit || 10);
    }
});

/***************************************************************
 * Get Consumer Class Instances with Booking Status
 * 
 * Optimized query for mobile consumer app that returns class instances
 * enriched with user's booking status. Performs efficient batch lookup
 * to avoid N+1 query problems.
 * 
 * Performance: 2 DB queries regardless of number of class instances
 ***************************************************************/

export const getConsumerClassInstancesWithBookingStatusArgs = v.object({
    startDate: v.number(),
    endDate: v.number(),
    limit: v.optional(v.number()),
});

export const getConsumerClassInstancesWithBookingStatus = query({
    args: getConsumerClassInstancesWithBookingStatusArgs,
    handler: async (ctx, args) => {
        const user = await getAuthenticatedUserOrThrow(ctx);
        const limit = args.limit || 100; // Reasonable default to prevent performance issues

        // Get class instances for date range (all businesses - consumers see everything)
        const instances = await ctx.db
            .query("classInstances")
            .withIndex("by_start_time", (q) =>
                q.gte("startTime", args.startDate)
            )
            .filter(q =>
                q.and(
                    q.lte(q.field("startTime"), args.endDate),
                    q.eq(q.field("status"), "scheduled"),
                    q.neq(q.field("deleted"), true)
                )
            )
            .order("asc") // Sort by start time
            .take(limit);

        if (instances.length === 0) {
            return [];
        }


        // Get user's active bookings (efficient - typically small dataset per user)
        const userBookings = await ctx.db
            .query("bookings")
            .withIndex("by_user", q => q.eq("userId", user._id))
            .filter(q =>
                q.and(
                    q.neq(q.field("deleted"), true),
                    // Only include active bookings (not cancelled)
                    q.neq(q.field("status"), "cancelled_by_consumer"),
                    q.neq(q.field("status"), "cancelled_by_business")
                )
            )
            .collect();

        // Create efficient lookup: O(n) complexity
        const instanceIds = new Set(instances.map(i => i._id));
        const relevantBookings = userBookings.filter(booking =>
            instanceIds.has(booking.classInstanceId)
        );
        const bookingMap = new Map(
            relevantBookings.map(booking => [booking.classInstanceId, booking])
        );

        // Enrich instances with booking status: O(n) complexity
        return instances.map(instance => ({
            ...instance,
            userBooking: bookingMap.get(instance._id) || null,
            isBookedByUser: bookingMap.has(instance._id),
        }));
    }
});
