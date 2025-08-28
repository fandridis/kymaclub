import { query } from "../_generated/server";
import { v } from "convex/values";
import { classInstanceService } from "../../services/classInstanceService";
import { getAuthenticatedUserOrThrow } from "../utils";

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