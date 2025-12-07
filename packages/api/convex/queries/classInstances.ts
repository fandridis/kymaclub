import { query } from "../_generated/server";
import { ConvexError, v } from "convex/values";
import { classInstanceService } from "../../services/classInstanceService";
import { getAuthenticatedUserOrThrow } from "../utils";
import { pricingOperations } from "../../operations/pricing";
import { ERROR_CODES } from "../../utils/errorCodes";
import { rateLimiter } from "../utils/rateLimiter";
import { filterTestClassInstances, isClassInstanceVisible, isUserTester } from "../../utils/testDataFilter";
import { normalizeCityInput } from "@repo/utils/constants";
import type { Id } from "../_generated/dataModel";

/***************************************************************
 * Shared Validators
 ***************************************************************/

/**
 * Validator for HappeningClassInstance response shape
 * Used by getHappeningTodayClassInstances and getHappeningTomorrowClassInstances
 */
const happeningClassInstanceValidator = v.object({
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
});

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
    returns: v.array(happeningClassInstanceValidator),
    handler: async (ctx, args) => {
        const user = await getAuthenticatedUserOrThrow(ctx);
        return classInstanceService.getHappeningClassInstances({
            ctx,
            args: {
                startDate: args.startDate,
                endDate: args.endDate,
                cityFilter: args.cityFilter || '',
                limit: args.limit,
            },
            user,
        });
    }
});

/***************************************************************
 * Get Happening Tomorrow Class Instances
 * 
 * Returns class instances happening tomorrow (00:00 to 23:59),
 * ordered by start time (earliest first). Only includes classes
 * that can be booked based on booking windows. Returns minimal
 * data needed for NewsClassCard rendering.
 * 
 * Uses the same service method as getHappeningTodayClassInstances
 * with different date parameters.
 ***************************************************************/

export const getHappeningTomorrowClassInstancesArgs = v.object({
    startDate: v.number(), // Start of tomorrow (00:00:00)
    endDate: v.number(),   // End of tomorrow (23:59:59)
    limit: v.optional(v.number()),
    cityFilter: v.optional(v.string()),
});

export const getHappeningTomorrowClassInstances = query({
    args: getHappeningTomorrowClassInstancesArgs,
    returns: v.array(happeningClassInstanceValidator),
    handler: async (ctx, args) => {
        const user = await getAuthenticatedUserOrThrow(ctx);
        return classInstanceService.getHappeningClassInstances({
            ctx,
            args: {
                startDate: args.startDate,
                endDate: args.endDate,
                cityFilter: args.cityFilter || '',
                limit: args.limit,
            },
            user,
        });
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
                templateId: instance.templateId, // Include templateId for filtering by class type
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
                questionnaire: instance.questionnaire,
                // Minimal snapshots - only essential fields
                templateSnapshot: {
                    name: instance.templateSnapshot.name,
                    instructor: instance.templateSnapshot.instructor,
                    imageStorageIds: instance.templateSnapshot.imageStorageIds,
                    discountRules: instance.templateSnapshot.discountRules,
                    questionnaire: instance.templateSnapshot.questionnaire,
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
            templateId: instance.templateId, // Include templateId for filtering by class type
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
            questionnaire: instance.questionnaire,
            templateSnapshot: {
                name: instance.templateSnapshot.name,
                instructor: instance.templateSnapshot.instructor,
                imageStorageIds: instance.templateSnapshot.imageStorageIds,
                discountRules: instance.templateSnapshot.discountRules,
                questionnaire: instance.templateSnapshot.questionnaire,
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

/***************************************************************
 * Get Venue Class Instances Grouped By Template
 * 
 * Fetches class instances for a specific date range and groups them
 * by template. Used for venue schedule screens where classes are
 * displayed with their available time slots.
 * 
 * Performance: Uses efficient by_venue_deleted_start_time index
 ***************************************************************/

const groupedClassInstanceValidator = v.object({
    templateId: v.id("classTemplates"),
    name: v.string(),
    shortDescription: v.optional(v.string()),
    price: v.number(),
    duration: v.number(),
    imageStorageIds: v.optional(v.array(v.id("_storage"))),
    instances: v.array(v.object({
        _id: v.id("classInstances"),
        startTime: v.number(),
        endTime: v.number(),
        spotsAvailable: v.number(),
        hasSpots: v.boolean(),
        isBookedByUser: v.boolean(),
    })),
});

export const getVenueClassInstancesGroupedByTemplateArgs = v.object({
    venueId: v.id("venues"),
    startDate: v.number(),
    endDate: v.number(),
});

export const getVenueClassInstancesGroupedByTemplate = query({
    args: getVenueClassInstancesGroupedByTemplateArgs,
    returns: v.array(groupedClassInstanceValidator),
    handler: async (ctx, args) => {
        const user = await getAuthenticatedUserOrThrow(ctx);

        // Query instances for date range using efficient index
        const instances = await ctx.db
            .query("classInstances")
            .withIndex("by_venue_deleted_start_time", (q) =>
                q.eq("venueId", args.venueId)
                    .eq("deleted", undefined)
                    .gte("startTime", args.startDate)
            )
            .filter(q => q.and(
                q.lte(q.field("startTime"), args.endDate),
                q.eq(q.field("status"), "scheduled")
            ))
            .collect();

        // Filter test instances based on user tester status
        const filteredInstances = filterTestClassInstances(instances, user);

        // Get user's active bookings for these instances
        const instanceIds = filteredInstances.map(i => i._id);
        const userBookings = instanceIds.length > 0 ? await ctx.db
            .query("bookings")
            .withIndex("by_user", q => q.eq("userId", user._id))
            .filter(q =>
                q.and(
                    q.neq(q.field("deleted"), true),
                    q.neq(q.field("status"), "cancelled_by_consumer"),
                    q.neq(q.field("status"), "cancelled_by_business"),
                    q.or(...instanceIds.map(id => q.eq(q.field("classInstanceId"), id)))
                )
            )
            .collect() : [];

        // Create a set of booked instance IDs for efficient lookup
        const bookedInstanceIds = new Set(userBookings.map(b => b.classInstanceId));

        // Group instances by templateId
        const groupedMap = new Map<string, {
            templateId: string;
            snapshot: typeof filteredInstances[0]["templateSnapshot"];
            instances: typeof filteredInstances;
        }>();

        for (const instance of filteredInstances) {
            const key = instance.templateId;
            if (!groupedMap.has(key)) {
                groupedMap.set(key, {
                    templateId: key,
                    snapshot: instance.templateSnapshot,
                    instances: [],
                });
            }
            groupedMap.get(key)!.instances.push(instance);
        }

        // Transform to return format - use templateSnapshot data to avoid N+1 queries
        const results = Array.from(groupedMap.entries()).map(([templateId, data]) => {
            // Use the first instance to get price (all instances from same template have same price)
            const firstInstance = data.instances[0];
            return {
                templateId: templateId as Id<"classTemplates">,
                name: data.snapshot.name,
                shortDescription: data.snapshot.shortDescription,
                price: firstInstance?.price ?? 0,
                duration: data.snapshot.duration ?? 0,
                imageStorageIds: data.snapshot.imageStorageIds,
                instances: data.instances
                    .sort((a, b) => a.startTime - b.startTime)
                    .map(i => ({
                        _id: i._id,
                        startTime: i.startTime,
                        endTime: i.endTime,
                        spotsAvailable: Math.max(0, (i.capacity ?? 0) - (i.bookedCount ?? 0)),
                        hasSpots: (i.capacity ?? 0) > (i.bookedCount ?? 0),
                        isBookedByUser: bookedInstanceIds.has(i._id),
                    })),
            };
        });

        return results;
    }
});

/***************************************************************
 * Get Upcoming Class Instances By Template
 * 
 * Returns upcoming class instances from the same template,
 * useful for showing "same class" options on class details.
 * Uses the by_template_deleted_status_start_time compound index
 * for efficient lookups without expensive filter operations.
 ***************************************************************/

export const getUpcomingClassInstancesByTemplateArgs = v.object({
    templateId: v.id("classTemplates"),
    excludeInstanceId: v.id("classInstances"),
    startDate: v.number(), // Current time
    limit: v.optional(v.number()), // Default 10
});

export const getUpcomingClassInstancesByTemplate = query({
    args: getUpcomingClassInstancesByTemplateArgs,
    returns: v.array(v.object({
        _id: v.id("classInstances"),
        startTime: v.number(),
        endTime: v.number(),
        spotsAvailable: v.number(),
        isBookedByUser: v.boolean(),
    })),
    handler: async (ctx, args) => {
        const user = await getAuthenticatedUserOrThrow(ctx);
        const limit = args.limit ?? 10;

        // Use compound index for efficient lookup without filter operations
        // Index: by_template_deleted_status_start_time [templateId, deleted, status, startTime]
        const instances = await ctx.db
            .query("classInstances")
            .withIndex("by_template_deleted_status_start_time", (q) =>
                q.eq("templateId", args.templateId)
                    .eq("deleted", undefined)
                    .eq("status", "scheduled")
                    .gte("startTime", args.startDate)
            )
            .filter(q => q.neq(q.field("_id"), args.excludeInstanceId))
            .order("asc")
            .take(limit + 1); // Take one extra to account for potential exclusion

        // Filter test instances based on user tester status
        const filteredInstances = filterTestClassInstances(instances, user);
        const limitedInstances = filteredInstances.slice(0, limit);

        // Get user's active bookings for these instances (efficient batch lookup)
        const instanceIds = limitedInstances.map(i => i._id);
        const userBookings = instanceIds.length > 0 ? await ctx.db
            .query("bookings")
            .withIndex("by_user", q => q.eq("userId", user._id))
            .filter(q =>
                q.and(
                    q.neq(q.field("deleted"), true),
                    q.or(
                        q.eq(q.field("status"), "pending"),
                        q.eq(q.field("status"), "completed"),
                        q.eq(q.field("status"), "awaiting_approval")
                    )
                )
            )
            .collect() : [];

        // Create set of booked instance IDs for efficient lookup
        const bookedInstanceIds = new Set(
            userBookings
                .filter(b => instanceIds.includes(b.classInstanceId))
                .map(b => b.classInstanceId)
        );

        // Return minimal data needed for the cards
        return limitedInstances.map(instance => ({
            _id: instance._id,
            startTime: instance.startTime,
            endTime: instance.endTime,
            spotsAvailable: Math.max(0, (instance.capacity ?? 0) - (instance.bookedCount ?? 0)),
            isBookedByUser: bookedInstanceIds.has(instance._id),
        }));
    }
});
