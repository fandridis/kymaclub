import type { MutationCtx, QueryCtx } from "../convex/_generated/server";
import type { Doc, Id } from "../convex/_generated/dataModel";
import { ConvexError } from "convex/values";
import { ERROR_CODES } from "../utils/errorCodes";
import { coreRules } from "../rules/core";
import { classInstanceRules } from "../rules/classInstance";
import { classTemplateRules } from "../rules/classTemplate";
import { classInstanceOperations } from "../operations/classInstance";
import { timeUtils } from "../utils/timeGeneration";
import type { CreateClassInstanceArgs, CreateMultipleClassInstancesArgs, DeleteSimilarFutureInstancesArgs, DeleteSingleInstanceArgs, UpdateMultipleInstancesArgs, UpdateSingleInstanceArgs } from "../convex/mutations/classInstances";
import { bookingService } from "./bookingService";

/**
 * Update bookings when class time changes:
 * - Grant free cancellation privilege (48 hours)
 * - Update classInstanceSnapshot with new times
 */
const updateBookingsForTimeChange = async (
    ctx: MutationCtx,
    classInstanceId: Id<"classInstances">,
    newStartTime: number,
    newEndTime: number,
    userId: Id<"users">
): Promise<number> => {
    const now = Date.now();
    const FORTY_EIGHT_HOURS = 48 * 60 * 60 * 1000;

    // Get all pending bookings for this instance
    const bookings = await ctx.db
        .query("bookings")
        .withIndex("by_class_instance_status", (q) =>
            q.eq("classInstanceId", classInstanceId).eq("status", "pending")
        )
        .collect();

    // Update each booking with free cancellation AND new snapshot times
    for (const booking of bookings) {
        await ctx.db.patch(booking._id, {
            hasFreeCancel: true,
            freeCancelExpiresAt: now + FORTY_EIGHT_HOURS,
            freeCancelReason: "class time changed",
            // Update the snapshot with new times so consumers see correct schedule
            classInstanceSnapshot: {
                ...booking.classInstanceSnapshot,
                startTime: newStartTime,
                endTime: newEndTime,
            },
            updatedAt: now,
            updatedBy: userId,
        });
    }

    return bookings.length;
};

// Service object with all class instance operations
export const classInstanceService = {
    /**
     * Create a new class instance from a template
     */
    create: async ({ ctx, args, user }: { ctx: MutationCtx, args: CreateClassInstanceArgs, user: Doc<"users"> }): Promise<{ createdInstanceId: Id<"classInstances"> }> => {
        coreRules.userMustBeAssociatedWithBusiness(user);
        const business = await ctx.db.get(user.businessId!);
        if (!business) {
            throw new ConvexError({
                message: "Business not found",
                code: ERROR_CODES.BUSINESS_NOT_FOUND
            });
        }

        const template = await ctx.db.get(args.templateId);
        if (!template) {
            throw new ConvexError({
                message: "Class template not found",
                field: "templateId",
                code: ERROR_CODES.RESOURCE_NOT_FOUND
            });
        }

        const venue = await ctx.db.get(template.venueId);
        if (!venue) {
            throw new ConvexError({
                message: "Venue not found",
                field: "venueId",
                code: ERROR_CODES.RESOURCE_NOT_FOUND
            });
        }

        classTemplateRules.userMustBeTemplateOwner(template, user);
        classInstanceRules.instanceMustHaveActiveTemplate(template);

        const instanceToCreate = classInstanceOperations.createInstanceFromTemplate(
            template,
            venue,
            business,
            user,
            args.startTime,
            args.disableBookings
        );

        const createdInstanceId = await ctx.db.insert("classInstances", instanceToCreate);
        return { createdInstanceId };
    },

    /**
     * Create multiple class instances from a template following a frequency pattern
     */
    createMultiple: async ({ ctx, args, user }: { ctx: MutationCtx, args: CreateMultipleClassInstancesArgs, user: Doc<"users"> }): Promise<{ createdInstanceIds: Array<Id<"classInstances">>; totalCreated: number }> => {
        coreRules.userMustBeAssociatedWithBusiness(user);
        const business = await ctx.db.get(user.businessId!);
        if (!business) {
            throw new ConvexError({
                message: "Business not found",
                code: ERROR_CODES.BUSINESS_NOT_FOUND
            });
        }

        const cleanArgs = classInstanceOperations.prepareCreateMultipleInstances(args);

        const template = await ctx.db.get(args.templateId);
        if (!template) {
            throw new ConvexError({
                message: "Class template not found",
                field: "templateId",
                code: ERROR_CODES.RESOURCE_NOT_FOUND
            });
        }

        classTemplateRules.userMustBeTemplateOwner(template, user);
        classInstanceRules.instanceMustHaveActiveTemplate(template);

        if (!template.venueId) {
            throw new ConvexError({
                message: "Template must have a venue assigned",
                field: "templateId",
                code: ERROR_CODES.VALIDATION_ERROR
            });
        }

        const venue = await ctx.db.get(template.venueId);
        if (!venue) {
            throw new ConvexError({
                message: "Venue not found",
                field: "venueId",
                code: ERROR_CODES.RESOURCE_NOT_FOUND
            });
        }

        const instanceTimes = timeUtils.generateInstanceTimes(
            cleanArgs.startTime,
            cleanArgs.duration,
            cleanArgs.frequency,
            cleanArgs.weeks,
            cleanArgs.selectedDaysOfWeek
        );

        const createdInstanceIds: Array<Id<"classInstances">> = [];
        for (const { startTime } of instanceTimes) {
            const instanceToCreate = classInstanceOperations.createInstanceFromTemplate(
                template,
                venue,
                business,
                user,
                startTime,
                args.disableBookings
            );
            const classInstanceId = await ctx.db.insert("classInstances", instanceToCreate);
            createdInstanceIds.push(classInstanceId);
        }

        return { createdInstanceIds, totalCreated: createdInstanceIds.length };
    },

    /**
     * Update a single class instance
     */
    updateSingle: async ({ ctx, args, user }: { ctx: MutationCtx, args: UpdateSingleInstanceArgs, user: Doc<"users"> }): Promise<{ updatedInstanceId: Id<"classInstances">; bookingsAffected: number }> => {
        const existingInstance = await ctx.db.get(args.instanceId);
        if (!existingInstance) {
            throw new ConvexError({
                message: "Class instance not found",
                field: "_id",
                code: ERROR_CODES.RESOURCE_NOT_FOUND
            });
        }

        if (existingInstance.businessId !== user.businessId) {
            throw new ConvexError({
                message: "You are not authorized to update this instance",
                field: "businessId",
                code: ERROR_CODES.UNAUTHORIZED
            });
        }

        classInstanceRules.userMustBeInstanceOwner(existingInstance, user);

        const cleanArgs = classInstanceOperations.prepareUpdateInstance(args.instance);

        // Calculate final times (use new if provided, otherwise keep existing)
        const finalStartTime = cleanArgs.startTime ?? existingInstance.startTime;
        const finalEndTime = cleanArgs.endTime ?? existingInstance.endTime;

        // Check if time fields ACTUALLY changed (not just provided)
        const isTimeChanged =
            (cleanArgs.startTime !== undefined && cleanArgs.startTime !== existingInstance.startTime) ||
            (cleanArgs.endTime !== undefined && cleanArgs.endTime !== existingInstance.endTime);

        // When time fields are updated, regenerate timePattern and dayOfWeek for calendar display
        // This ensures consistency between startTime/endTime and their derived display fields
        const timeFieldsUpdate = isTimeChanged
            ? timeUtils.generateTimePatternData(finalStartTime, finalEndTime)
            : {};

        await ctx.db.patch(args.instanceId, {
            ...cleanArgs,
            ...timeFieldsUpdate,
            updatedAt: Date.now(),
            updatedBy: user._id,
        });

        // Update bookings if time changed (grants free cancel + updates snapshot times)
        let bookingsAffected = 0;
        if (isTimeChanged) {
            bookingsAffected = await updateBookingsForTimeChange(
                ctx,
                args.instanceId,
                finalStartTime,
                finalEndTime,
                user._id
            );
        }

        return { updatedInstanceId: args.instanceId, bookingsAffected };
    },

    /**
     * Update a set of similar future class instances
     */
    updateMultiple: async ({ ctx, args, user }: { ctx: MutationCtx, args: UpdateMultipleInstancesArgs, user: Doc<"users"> }): Promise<{ updatedInstanceIds: Array<Id<"classInstances">>; totalUpdated: number; bookingsAffected: number }> => {
        const originalInstance = await ctx.db.get(args.instanceId);
        if (!originalInstance) {
            throw new ConvexError({
                message: "Class instance not found",
                field: "_id",
                code: ERROR_CODES.RESOURCE_NOT_FOUND
            });
        }

        if (originalInstance.businessId !== user.businessId) {
            throw new ConvexError({
                message: "You are not authorized to update this instance",
                field: "businessId",
                code: ERROR_CODES.UNAUTHORIZED
            });
        }

        classInstanceRules.userMustBeInstanceOwner(originalInstance, user);

        const cleanArgs = classInstanceOperations.prepareUpdateInstance(args.instance);
        const matchingInstances = await classInstanceService.findSimilarFutureInstances(
            ctx,
            originalInstance,
            user.businessId!
        );

        const updatedInstanceIds: Array<Id<"classInstances">> = [];
        const timestamp = Date.now();
        let totalBookingsAffected = 0;

        for (const instance of matchingInstances) {
            const { newStartTime, newEndTime } = timeUtils.calculateNewInstanceTimes(
                instance,
                cleanArgs.startTime,
                cleanArgs.endTime
            );

            // Check if this instance's time ACTUALLY changed
            const instanceTimeChanged =
                newStartTime !== instance.startTime ||
                newEndTime !== instance.endTime;

            const timeFieldsUpdate = instanceTimeChanged
                ? timeUtils.generateTimePatternData(newStartTime, newEndTime)
                : {};

            await ctx.db.patch(instance._id, {
                ...cleanArgs,
                startTime: newStartTime,
                endTime: newEndTime,
                ...timeFieldsUpdate,
                updatedAt: timestamp,
                updatedBy: user._id,
            });

            updatedInstanceIds.push(instance._id);

            // Update bookings only if this instance's time actually changed
            if (instanceTimeChanged) {
                const bookingsAffected = await updateBookingsForTimeChange(
                    ctx,
                    instance._id,
                    newStartTime,
                    newEndTime,
                    user._id
                );
                totalBookingsAffected += bookingsAffected;
            }
        }

        return {
            updatedInstanceIds,
            totalUpdated: updatedInstanceIds.length,
            bookingsAffected: totalBookingsAffected
        };
    },

    /**
     * Soft delete a single class instance
     */
    deleteSingle: async ({ ctx, args, user }: { ctx: MutationCtx, args: DeleteSingleInstanceArgs, user: Doc<"users"> }): Promise<{ deletedInstanceId: Id<"classInstances"> }> => {
        const existingInstance = await ctx.db.get(args.instanceId);
        if (!existingInstance) {
            throw new ConvexError({
                message: "Class instance not found",
                field: "_id",
                code: ERROR_CODES.RESOURCE_NOT_FOUND
            });
        }

        if (existingInstance.businessId !== user.businessId) {
            throw new ConvexError({
                message: "You are not authorized to delete this instance",
                field: "businessId",
                code: ERROR_CODES.UNAUTHORIZED
            });
        }

        classInstanceRules.userMustBeInstanceOwner(existingInstance, user);

        // Find all bookings for this instance
        const bookings = await bookingService.getBookingsByClassInstanceId({
            ctx,
            args: {
                classInstanceId: args.instanceId
            }
        });

        if (bookings.length > 0) {
            throw new ConvexError({
                message: "You cannot delete a class instance that has bookings. Please cancel the bookings first.",
                field: "instanceId",
                code: ERROR_CODES.ACTION_NOT_ALLOWED
            });
        }

        await ctx.db.patch(args.instanceId, {
            deleted: true,
            deletedAt: Date.now(),
            deletedBy: user._id,
        });

        return { deletedInstanceId: args.instanceId };
    },

    /**
     * Soft delete similar future class instances
     */
    deleteSimilarFuture: async ({ ctx, args, user }: { ctx: MutationCtx, args: DeleteSimilarFutureInstancesArgs, user: Doc<"users"> }): Promise<{ deletedInstanceIds: Array<Id<"classInstances">>; totalDeleted: number }> => {
        const existingInstance = await ctx.db.get(args.instanceId);
        if (!existingInstance) {
            throw new ConvexError({
                message: "Class instance not found",
                field: "_id",
                code: ERROR_CODES.RESOURCE_NOT_FOUND
            });
        }

        if (existingInstance.businessId !== user.businessId) {
            throw new ConvexError({
                message: "You are not authorized to delete this instance",
                field: "businessId",
                code: ERROR_CODES.UNAUTHORIZED
            });
        }

        classInstanceRules.userMustBeInstanceOwner(existingInstance, user);

        const matchingInstances = await classInstanceService.findSimilarFutureInstances(
            ctx,
            existingInstance,
            user.businessId!
        );

        const deletedInstanceIds: Array<Id<"classInstances">> = [];
        const timestamp = Date.now();

        // Find all bookings for all matchingInstances with a promise.all
        const bookings = await Promise.all(matchingInstances.map(async (instance) => {
            return bookingService.getBookingsByClassInstanceId({
                ctx,
                args: { classInstanceId: instance._id }
            });
        }));

        // If any instance has bookings, throw an error
        if (bookings.some(booking => booking.length > 0)) {
            throw new ConvexError({
                message: "You cannot delete a class instance that has bookings. Please cancel the bookings first.",
                field: "instanceId",
                code: ERROR_CODES.ACTION_NOT_ALLOWED
            });
        }

        for (const futureInstance of matchingInstances) {
            await ctx.db.patch(futureInstance._id, {
                deleted: true,
                deletedAt: timestamp,
                deletedBy: user._id,
            });
            deletedInstanceIds.push(futureInstance._id);
        }

        return { deletedInstanceIds, totalDeleted: deletedInstanceIds.length };
    },

    /**
     * Get class instances for a date range
     */
    getInstances: async ({ ctx, args, user }: { ctx: QueryCtx, args: { startDate: number, endDate: number }, user: Doc<"users"> }): Promise<Doc<"classInstances">[]> => {
        coreRules.userMustBeAssociatedWithBusiness(user);

        const instances = await ctx.db
            .query("classInstances")
            .withIndex("by_business_start_time", q =>
                q.eq("businessId", user.businessId!)
                    .gte("startTime", args.startDate)
                    .lte("startTime", args.endDate)
            )
            .filter(q => q.neq(q.field("deleted"), true))
            .collect();

        return instances;
    },

    /**
     * Get similar (future) class instances for an instance
     */
    getSimilarInstances: async ({ ctx, args, user }: { ctx: QueryCtx, args: { instanceId: Id<"classInstances"> }, user: Doc<"users"> }): Promise<Doc<"classInstances">[]> => {
        const originalInstance = await ctx.db.get(args.instanceId);
        if (!originalInstance) {
            throw new ConvexError({
                message: "Instance not found",
                field: "instanceId",
                code: ERROR_CODES.RESOURCE_NOT_FOUND
            });
        }

        if (originalInstance.businessId !== user.businessId) {
            throw new ConvexError({
                message: "User is not authorized to access this instance",
                field: "businessId",
                code: ERROR_CODES.UNAUTHORIZED
            });
        }

        if (originalInstance.deleted) {
            throw new ConvexError({
                message: "Instance not found",
                field: "instanceId",
                code: ERROR_CODES.RESOURCE_NOT_FOUND
            });
        }

        const matching = await classInstanceService.findSimilarFutureInstances(ctx, originalInstance, user.businessId!);
        return matching.filter(instance => instance._id !== args.instanceId);
    },

    /**
     * Find similar future instances (internal helper)
     */
    findSimilarFutureInstances: async (
        ctx: MutationCtx | QueryCtx,
        instance: Doc<"classInstances">,
        businessId: Id<"businesses">
    ): Promise<Doc<"classInstances">[]> => {
        const originalName = instance.name;
        const originalTimePattern = instance.timePattern;
        const originalDayOfWeek = instance.dayOfWeek;

        const matchingInstances = await ctx.db
            .query("classInstances")
            .withIndex("by_business_name_timepattern_dayofweek", (q) =>
                q.eq("businessId", businessId)
                    .eq("name", originalName)
                    .eq("timePattern", originalTimePattern)
                    .eq("dayOfWeek", originalDayOfWeek)
            )
            .filter((q) => q.and(
                q.gte(q.field("startTime"), instance.startTime),
                q.neq(q.field("deleted"), true)
            ))
            .collect();

        return matchingInstances;
    },

    /**
     * Get class instance by ID
     */
    getInstanceById: async ({ ctx, args, user }: { ctx: QueryCtx, args: { instanceId: Id<"classInstances"> }, user: Doc<"users"> }): Promise<Doc<"classInstances">> => {
        const instance = await ctx.db.get(args.instanceId);
        if (!instance || instance.deleted) {
            throw new ConvexError({
                message: "Instance not found",
                field: "instanceId",
                code: ERROR_CODES.RESOURCE_NOT_FOUND
            });
        }

        if (instance.businessId !== user.businessId) {
            throw new ConvexError({
                message: "User is not authorized to access this instance",
                field: "businessId",
                code: ERROR_CODES.UNAUTHORIZED
            });
        }

        return instance;
    },

    /**
     * Get class instances with their bookings for business dashboard
     * Returns all class instances from startDate onwards with their associated bookings
     */
    getClassInstancesWithBookings: async ({
        ctx,
        args,
        user
    }: {
        ctx: QueryCtx,
        args: { startDate: number, limit?: number },
        user: Doc<"users">
    }): Promise<Array<{ classInstance: Doc<"classInstances">; bookings: Doc<"bookings">[] }>> => {
        coreRules.userMustBeAssociatedWithBusiness(user);

        const limit = args.limit ?? 500;
        const businessId = user.businessId!; // TypeScript guard - we know it's not undefined after the rule check

        // Get class instances from startDate onwards, sorted by start time
        const classInstances = await ctx.db
            .query("classInstances")
            .withIndex("by_business_start_time", q =>
                q.eq("businessId", businessId)
                    .gte("startTime", args.startDate)
            )
            .filter(q => q.neq(q.field("deleted"), true))
            .order("asc") // Sort by startTime ascending
            .take(limit);

        if (classInstances.length === 0) {
            return [];
        }

        // Get all instance IDs for batch booking query
        const classInstanceIds = classInstances.map(instance => instance._id);

        // Get all active bookings for these class instances
        const allBookings: Doc<"bookings">[] = [];

        for (const classInstanceId of classInstanceIds) {
            const bookings = await ctx.db
                .query("bookings")
                .withIndex("by_class_instance", q => q.eq("classInstanceId", classInstanceId))
                .filter(q => q.and(
                    q.neq(q.field("deleted"), true),
                    q.eq(q.field("businessId"), businessId),
                ))
                .collect();

            allBookings.push(...bookings);
        }

        // Build the result array with enriched bookings
        const result: Array<{ classInstance: Doc<"classInstances">; bookings: Doc<"bookings">[] }> = [];

        for (const classInstance of classInstances) {
            // Find bookings for this class instance
            const instanceBookings = allBookings.filter(
                booking => booking.classInstanceId === classInstance._id
            );

            // Enrich bookings with related data
            // const enrichedBookings: BookingWithDetails[] = [];

            // for (const booking of instanceBookings) {
            //     const enrichedBooking: BookingWithDetails = {
            //         ...booking,
            //         classInstance: classInstance
            //     };

            //     // Get class template
            //     if (classInstance.templateId) {
            //         enrichedBooking.classTemplate = await ctx.db.get(classInstance.templateId) || undefined;
            //     }

            //     // Get venue
            //     if (classInstance.venueId) {
            //         enrichedBooking.venue = await ctx.db.get(classInstance.venueId) || undefined;
            //     }

            //     enrichedBookings.push(enrichedBooking);
            // }

            result.push({
                classInstance,
                bookings: instanceBookings
            });
        }

        return result;
    },

    /**
     * Get class instances with their bookings for a specific day
     * Returns class instances within a day range with their associated bookings
     */
    getClassInstancesWithBookingsForDay: async ({
        ctx,
        args,
        user
    }: {
        ctx: QueryCtx,
        args: { dayStart: number, dayEnd: number },
        user: Doc<"users">
    }): Promise<Array<{ classInstance: Doc<"classInstances">; bookings: Doc<"bookings">[] }>> => {
        coreRules.userMustBeAssociatedWithBusiness(user);

        const businessId = user.businessId!; // TypeScript guard - we know it's not undefined after the rule check

        // Get class instances for the specific day
        const classInstances = await ctx.db
            .query("classInstances")
            .withIndex("by_business_start_time", q =>
                q.eq("businessId", businessId)
                    .gte("startTime", args.dayStart)
            )
            .filter(q => q.and(
                q.lte(q.field("startTime"), args.dayEnd),
                q.neq(q.field("deleted"), true)
            ))
            .order("asc") // Sort by startTime ascending
            .collect();

        if (classInstances.length === 0) {
            return [];
        }

        // Get all instance IDs for batch booking query
        const classInstanceIds = classInstances.map(instance => instance._id);

        // Get all active bookings for these class instances
        const allBookings: Doc<"bookings">[] = [];

        for (const classInstanceId of classInstanceIds) {
            const bookings = await ctx.db
                .query("bookings")
                .withIndex("by_class_instance", q => q.eq("classInstanceId", classInstanceId))
                .filter(q => q.and(
                    q.neq(q.field("deleted"), true),
                    q.eq(q.field("businessId"), businessId),
                ))
                .collect();

            allBookings.push(...bookings);
        }

        // Build the result array with enriched bookings
        const result: Array<{ classInstance: Doc<"classInstances">; bookings: Doc<"bookings">[] }> = [];

        for (const classInstance of classInstances) {
            // Find bookings for this class instance
            const instanceBookings = allBookings.filter(
                booking => booking.classInstanceId === classInstance._id
            );

            result.push({
                classInstance,
                bookings: instanceBookings
            });
        }

        return result;
    },
};