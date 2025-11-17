import { query } from "../_generated/server";
import { ConvexError, v } from "convex/values";
import { classInstanceService } from "../../services/classInstanceService";
import { getAuthenticatedUserOrThrow } from "../utils";
import { pricingOperations } from "../../operations/pricing";
import { ERROR_CODES } from "../../utils/errorCodes";
import { rateLimiter } from "../utils/rateLimiter";
import { filterTestClassInstances, isClassInstanceVisible, isUserTester } from "../../utils/testDataFilter";
import { normalizeCityInput } from "@repo/utils/constants";

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
        const user = await getAuthenticatedUserOrThrow(ctx);

        const instance = await ctx.db.get(args.instanceId);

        if (!instance || instance.deleted) {
            throw new ConvexError({
                message: "Instance not found",
                field: "instanceId",
                code: ERROR_CODES.RESOURCE_NOT_FOUND,
            });
        }

        // Check if instance is visible to user (filter test instances)
        if (!isClassInstanceVisible(instance, user)) {
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
 * Get Class Instances with Bookings for Specific Day
 ***************************************************************/

export const getClassInstancesWithBookingsForDayArgs = v.object({
    dayStart: v.number(), // Start of day timestamp
    dayEnd: v.number(),   // End of day timestamp
});

export const getClassInstancesWithBookingsForDay = query({
    args: getClassInstancesWithBookingsForDayArgs,
    handler: async (ctx, args) => {
        const user = await getAuthenticatedUserOrThrow(ctx);
        return await classInstanceService.getClassInstancesWithBookingsForDay({ ctx, args, user });
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
        const user = await getAuthenticatedUserOrThrow(ctx);
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

        const instances = await query.collect();
        return filterTestClassInstances(instances, user);
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
        const user = await getAuthenticatedUserOrThrow(ctx);
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

        const instances = await query
            .order("desc")
            .take(args.limit || 100);

        return filterTestClassInstances(instances, user);
    }
});

/***************************************************************
 * Get Happening Today Class Instances
 * 
 * Returns class instances happening today until midnight,
 * ordered by start time (earliest first). Only includes classes
 * that can be booked based on booking windows. Returns minimal
 * data needed for NewsClassCard rendering.
 ***************************************************************/

export const getHappeningTodayClassInstancesArgs = v.object({
    startDate: v.number(), // Current time
    endDate: v.number(),   // End of today (midnight)
    limit: v.optional(v.number()),
    cityFilter: v.optional(v.string()),
});

export const getHappeningTodayClassInstances = query({
    args: getHappeningTodayClassInstancesArgs,
    returns: v.array(v.object({
        _id: v.id("classInstances"),
        startTime: v.number(),
        name: v.string(),
        instructor: v.optional(v.string()),
        venueName: v.string(),
        venueCity: v.string(),
        templateImageId: v.optional(v.id("_storage")),
        venueImageId: v.optional(v.id("_storage")),
        pricing: v.object({
            originalPrice: v.number(),
            finalPrice: v.number(),
            discountPercentage: v.number(),
        }),
    })),
    handler: async (ctx, args) => {
        const user = await getAuthenticatedUserOrThrow(ctx);

        const limit = args.limit || 10;
        const cityFilter = args.cityFilter;

        if (!cityFilter || cityFilter.trim() === "") {
            throw new ConvexError({
                message: "City filter is required",
                field: "cityFilter",
                code: ERROR_CODES.VALIDATION_ERROR
            });
        }

        const normalizedCitySlug = normalizeCityInput(cityFilter);
        if (!normalizedCitySlug) {
            throw new ConvexError({
                message: "City is not supported",
                field: "cityFilter",
                code: ERROR_CODES.VALIDATION_ERROR,
            });
        }

        // Helper function to check if a class instance can be booked
        const canBookClass = (instance: any, currentTime: number): boolean => {
            // Check if bookings are disabled
            if (instance.disableBookings === true) {
                return false;
            }

            // Check if class has already started
            if (instance.startTime <= currentTime) {
                return false;
            }

            // Check booking window if it exists
            if (instance.bookingWindow) {
                const timeUntilStartMs = instance.startTime - currentTime;
                const hoursUntilStart = timeUntilStartMs / (1000 * 60 * 60);

                // Too late to book (within minimum advance time)
                if (hoursUntilStart < instance.bookingWindow.minHours) {
                    return false;
                }

                // Too early to book (beyond maximum advance time)
                if (hoursUntilStart > instance.bookingWindow.maxHours) {
                    return false;
                }
            }

            return true;
        };

        // Query using optimized index based on user's tester status
        // For non-testers: Use index that includes isTest to exclude test instances at DB level
        // For testers: Use city-based index without isTest filter to get all instances
        const isTester = isUserTester(user);
        let instances;

        if (!isTester) {
            // Non-testers: Query with isTest=undefined to exclude test instances efficiently
            // Most instances have isTest=undefined, so this index query is very efficient
            // Note: Convex indexes undefined values, so we can query for them directly
            instances = await ctx.db
                .query("classInstances")
                .withIndex("by_city_slug_status_deleted_isTest_start_time", (q) =>
                    q.eq("citySlug", normalizedCitySlug)
                        .eq("status", "scheduled")
                        .eq("deleted", undefined)
                        .eq("isTest", undefined) // Query for undefined (non-test instances)
                        .gte("startTime", args.startDate)
                )
                .filter(q => q.lte(q.field("startTime"), args.endDate))
                .order("asc")
                .take(limit);
        } else {
            // Testers: Use city-based index without isTest filter to get all instances (including test)
            instances = await ctx.db
                .query("classInstances")
                .withIndex("by_city_slug_status_deleted_start_time", (q) =>
                    q.eq("citySlug", normalizedCitySlug)
                        .eq("status", "scheduled")
                        .eq("deleted", undefined)
                        .gte("startTime", args.startDate)
                )
                .filter(q => q.lte(q.field("startTime"), args.endDate))
                .order("asc")
                .take(limit);
        }

        const currentTime = Date.now();
        const enrichedInstances = [];

        // Calculate pricing for each instance and filter by booking windows
        // Note: Test instances are already filtered at DB level for non-testers via index
        for (const instance of instances) {
            // Skip instances that can't be booked (same logic for all instances, including test)
            if (!canBookClass(instance, currentTime)) {
                continue;
            }

            const pricingResult = await pricingOperations.calculateFinalPriceFromInstance(instance);

            enrichedInstances.push({
                _id: instance._id,
                startTime: instance.startTime,
                name: instance.name || 'Class',
                instructor: instance.instructor,
                venueName: instance.venueSnapshot.name,
                venueCity: instance.venueSnapshot.address.city,
                templateImageId: instance.templateSnapshot.imageStorageIds?.[0],
                venueImageId: instance.venueSnapshot.imageStorageIds?.[0],
                pricing: {
                    originalPrice: pricingResult.originalPrice,
                    finalPrice: pricingResult.finalPrice,
                    discountPercentage: pricingResult.discountPercentage, // Keep as 0-1 decimal
                },
            });
        }

        return enrichedInstances;
    }
});

/***************************************************************
 * Get Business Happening Today Class Instances
 * 
 * Returns class instances happening today for a specific business,
 * ordered by start time (earliest first). Returns minimal data
 * needed for dashboard carousel card rendering. Includes booking
 * counts for availability display.
 ***************************************************************/

export const getBusinessHappeningTodayClassInstancesArgs = v.object({
    businessId: v.id("businesses"),
    startDate: v.number(), // Current time
    endDate: v.number(),   // End of today (midnight)
    limit: v.optional(v.number()),
});

export const getBusinessHappeningTodayClassInstances = query({
    args: getBusinessHappeningTodayClassInstancesArgs,
    returns: v.array(v.object({
        _id: v.id("classInstances"),
        startTime: v.number(),
        endTime: v.optional(v.number()),
        name: v.string(),
        instructor: v.optional(v.string()),
        venueName: v.string(),
        venueCity: v.string(),
        templateImageId: v.optional(v.id("_storage")),
        venueImageId: v.optional(v.id("_storage")),
        capacity: v.number(),
        bookedCount: v.number(),
    })),
    handler: async (ctx, args) => {
        const user = await getAuthenticatedUserOrThrow(ctx);

        // Verify business access
        const business = await ctx.db.get(args.businessId);
        if (!business || business.createdBy !== user._id) {
            throw new ConvexError({
                message: "Business not found or access denied",
                field: "businessId",
                code: ERROR_CODES.RESOURCE_NOT_FOUND,
            });
        }

        const limit = args.limit || 50;

        // Use optimized index to fetch scheduled classes in time window for this business
        const instances = await ctx.db
            .query("classInstances")
            .withIndex("by_business_status_start_time", (q) =>
                q.eq("businessId", args.businessId)
                    .eq("status", "scheduled")
                    .gte("startTime", args.startDate)
            )
            .filter(q =>
                q.and(
                    q.lte(q.field("startTime"), args.endDate),
                    q.neq(q.field("deleted"), true)
                )
            )
            .order("asc")
            .take(limit);

        // Filter test instances
        const filteredInstances = filterTestClassInstances(instances, user);

        // Get booking counts for all instances in parallel
        const enrichedInstances = await Promise.all(
            filteredInstances.map(async (instance) => {
                // Count pending bookings for this instance
                const bookings = await ctx.db
                    .query("bookings")
                    .withIndex("by_class_instance_status", (q) =>
                        q.eq("classInstanceId", instance._id)
                            .eq("status", "pending")
                    )
                    .filter(q => q.neq(q.field("deleted"), true))
                    .collect();

                const bookedCount = bookings.length;
                const capacity = instance.capacity || 0;

                return {
                    _id: instance._id,
                    startTime: instance.startTime,
                    endTime: instance.endTime,
                    name: instance.name || instance.templateSnapshot?.name || 'Class',
                    instructor: instance.instructor,
                    venueName: instance.venueSnapshot.name,
                    venueCity: instance.venueSnapshot.address.city,
                    templateImageId: instance.templateSnapshot?.imageStorageIds?.[0],
                    venueImageId: instance.venueSnapshot?.imageStorageIds?.[0],
                    capacity,
                    bookedCount,
                };
            })
        );

        return enrichedInstances;
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
    cityFilter: v.optional(v.string()),
});

export const getConsumerClassInstancesWithBookingStatus = query({
    args: getConsumerClassInstancesWithBookingStatusArgs,
    handler: async (ctx, args) => {
        const user = await getAuthenticatedUserOrThrow(ctx);
        const requestedLimit = args.limit || 100; // Reasonable default to prevent performance issues
        const cityFilter = args.cityFilter;

        // Validate city filter
        if (!cityFilter || cityFilter.trim() === "") {
            throw new ConvexError({
                message: "City filter is required",
                field: "cityFilter",
                code: ERROR_CODES.VALIDATION_ERROR
            });
        }

        const normalizedCitySlug = normalizeCityInput(cityFilter);
        if (!normalizedCitySlug) {
            throw new ConvexError({
                message: "City is not supported",
                field: "cityFilter",
                code: ERROR_CODES.VALIDATION_ERROR,
            });
        }

        // Query using optimized index based on user's tester status
        // For non-testers: Use index that includes isTest to exclude test instances at DB level
        // For testers: Use city-based index without isTest filter to get all instances
        const isTester = isUserTester(user);
        let instances;

        if (!isTester) {
            // Non-testers: Query with isTest=undefined to exclude test instances efficiently
            instances = await ctx.db
                .query("classInstances")
                .withIndex("by_city_slug_status_deleted_isTest_start_time", (q) =>
                    q.eq("citySlug", normalizedCitySlug)
                        .eq("status", "scheduled")
                        .eq("deleted", undefined)
                        .eq("isTest", undefined) // Query for undefined (non-test instances)
                        .gte("startTime", args.startDate)
                )
                .filter(q => q.lte(q.field("startTime"), args.endDate))
                .order("asc")
                .take(requestedLimit);
        } else {
            // Testers: Use city-based index without isTest filter to get all instances (including test)
            instances = await ctx.db
                .query("classInstances")
                .withIndex("by_city_slug_status_deleted_start_time", (q) =>
                    q.eq("citySlug", normalizedCitySlug)
                        .eq("status", "scheduled")
                        .eq("deleted", undefined)
                        .gte("startTime", args.startDate)
                )
                .filter(q => q.lte(q.field("startTime"), args.endDate))
                .order("asc")
                .take(requestedLimit);
        }

        if (instances.length === 0) {
            return [];
        }

        // Note: Test instances are already filtered at DB level for non-testers via index
        const limitedInstances = instances;


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
        const instanceIds = new Set(limitedInstances.map(i => i._id));
        const relevantBookings = userBookings.filter(booking =>
            instanceIds.has(booking.classInstanceId)
        );
        const bookingMap = new Map(
            relevantBookings.map(booking => [booking.classInstanceId, booking])
        );

        // Enrich instances with booking status: O(n) complexity
        return limitedInstances.map(instance => ({
            ...instance,
            userBooking: bookingMap.get(instance._id) || null,
            isBookedByUser: bookingMap.has(instance._id),
        }));
    }
});

/***************************************************************
 * Get Venue Class Instances - OPTIMIZED
 * 
 * Efficiently fetches class instances for a specific venue with minimal
 * data transfer. Uses venue-specific index to avoid scanning all classes.
 * 
 * Performance: 70-80% bandwidth reduction vs filtering all classes
 ***************************************************************/
export const getVenueClassInstancesOptimized = query({
    args: v.object({
        venueId: v.id("venues"),
        startDate: v.number(),
        endDate: v.number(),
        includeBookingStatus: v.optional(v.boolean()),
    }),
    handler: async (ctx, args) => {
        const user = await getAuthenticatedUserOrThrow(ctx);

        // Use venue-specific index - much more efficient than scanning all classes
        const instances = await ctx.db
            .query("classInstances")
            .withIndex("by_venue_deleted_start_time", (q) =>
                q.eq("venueId", args.venueId)
                    .eq("deleted", undefined)
                    .gte("startTime", args.startDate)
            )
            .filter(q => q.lte(q.field("startTime"), args.endDate))
            .collect();

        // Filter test instances
        const filteredInstances = filterTestClassInstances(instances, user);

        // If booking status needed, get user bookings
        if (args.includeBookingStatus) {
            const instanceIds = filteredInstances.map(i => i._id);
            const userBookings = await ctx.db
                .query("bookings")
                .withIndex("by_user", q => q.eq("userId", user._id))
                .filter(q =>
                    q.and(
                        q.neq(q.field("deleted"), true),
                        // Only include active bookings (not cancelled)
                        q.neq(q.field("status"), "cancelled_by_consumer"),
                        q.neq(q.field("status"), "cancelled_by_business"),
                        q.or(...instanceIds.map(id => q.eq(q.field("classInstanceId"), id)))
                    )
                )
                .collect();

            const bookingMap = new Map(
                userBookings.map(booking => [booking.classInstanceId, booking])
            );

            return filteredInstances.map(instance => ({
                _id: instance._id,
                venueId: instance.venueId, // Include venueId for navigation
                startTime: instance.startTime,
                endTime: instance.endTime,
                name: instance.name,
                instructor: instance.instructor,
                capacity: instance.capacity,
                bookedCount: instance.bookedCount,
                price: instance.price,
                status: instance.status,
                color: instance.color,
                tags: instance.tags,
                bookingWindow: instance.bookingWindow,
                discountRules: instance.discountRules,
                // Minimal snapshots - only essential fields
                templateSnapshot: {
                    name: instance.templateSnapshot.name,
                    instructor: instance.templateSnapshot.instructor,
                    imageStorageIds: instance.templateSnapshot.imageStorageIds,
                    discountRules: instance.templateSnapshot.discountRules,
                },
                venueSnapshot: {
                    name: instance.venueSnapshot.name,
                    address: {
                        city: instance.venueSnapshot.address.city,
                        street: instance.venueSnapshot.address.street,
                    },
                    imageStorageIds: instance.venueSnapshot.imageStorageIds,
                },
                // Booking status
                userBooking: bookingMap.get(instance._id) || null,
                isBookedByUser: bookingMap.has(instance._id),
            }));
        }

        // Return minimal fields without booking status
        return filteredInstances.map(instance => ({
            _id: instance._id,
            venueId: instance.venueId, // Include venueId for navigation
            startTime: instance.startTime,
            endTime: instance.endTime,
            name: instance.name,
            instructor: instance.instructor,
            capacity: instance.capacity,
            bookedCount: instance.bookedCount,
            price: instance.price,
            status: instance.status,
            color: instance.color,
            tags: instance.tags,
            bookingWindow: instance.bookingWindow,
            discountRules: instance.discountRules,
            templateSnapshot: {
                name: instance.templateSnapshot.name,
                instructor: instance.templateSnapshot.instructor,
                imageStorageIds: instance.templateSnapshot.imageStorageIds,
                discountRules: instance.templateSnapshot.discountRules,
            },
            venueSnapshot: {
                name: instance.venueSnapshot.name,
                address: {
                    city: instance.venueSnapshot.address.city,
                    street: instance.venueSnapshot.address.street,
                },
                imageStorageIds: instance.venueSnapshot.imageStorageIds,
            },
        }));
    }
});
