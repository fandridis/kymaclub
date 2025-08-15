import type { MutationCtx, QueryCtx } from "../convex/_generated/server";
import type { Doc, Id } from "../convex/_generated/dataModel";
import { ConvexError } from "convex/values";
import { ERROR_CODES } from "../utils/errorCodes";
import { coreRules } from "../rules/core";
import { classInstanceRules } from "../rules/classInstance";
import { classTemplateRules } from "../rules/classTemplate";
import { classInstanceOperations } from "../operations/classInstance";
import { timeUtils } from "../utils/timeGeneration";
import { CreateClassInstanceArgs, CreateMultipleClassInstancesArgs, DeleteSimilarFutureInstancesArgs, DeleteSingleInstanceArgs, UpdateMultipleInstancesArgs, UpdateSingleInstanceArgs } from "../convex/mutations/classInstances";

// Service object with all class instance operations
export const classInstanceService = {
    /**
     * Create a new class instance from a template
     */
    create: async ({ ctx, args, user }: { ctx: MutationCtx, args: CreateClassInstanceArgs, user: Doc<"users"> }): Promise<{ createdInstanceId: Id<"classInstances"> }> => {
        console.log("🗓️  --- SERVICE: classInstanceService.create ---");

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
            args.startTime
        );

        const createdInstanceId = await ctx.db.insert("classInstances", instanceToCreate);
        return { createdInstanceId };
    },

    /**
     * Create multiple class instances from a template following a frequency pattern
     */
    createMultiple: async ({ ctx, args, user }: { ctx: MutationCtx, args: CreateMultipleClassInstancesArgs, user: Doc<"users"> }): Promise<{ createdInstanceIds: Array<Id<"classInstances">>; totalCreated: number }> => {
        console.log("🗓️  --- SERVICE: classInstanceService.createMultiple ---");

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
                startTime
            );
            const classInstanceId = await ctx.db.insert("classInstances", instanceToCreate);
            createdInstanceIds.push(classInstanceId);
        }

        return { createdInstanceIds, totalCreated: createdInstanceIds.length };
    },

    /**
     * Update a single class instance
     */
    updateSingle: async ({ ctx, args, user }: { ctx: MutationCtx, args: UpdateSingleInstanceArgs, user: Doc<"users"> }): Promise<{ updatedInstanceId: Id<"classInstances"> }> => {
        console.log("🗓️  --- SERVICE: classInstanceService.updateSingle ---");

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

        const timeFieldsUpdate = (cleanArgs.startTime || cleanArgs.endTime)
            ? timeUtils.generateTimePatternData( // TODO: check if this is correct
                cleanArgs.startTime ?? existingInstance.startTime,
                cleanArgs.endTime ?? existingInstance.endTime
            )
            : {};

        await ctx.db.patch(args.instanceId, {
            ...cleanArgs,
            ...timeFieldsUpdate,
            updatedAt: Date.now(),
            updatedBy: user._id,
        });

        return { updatedInstanceId: args.instanceId };
    },

    /**
     * Update a set of similar future class instances
     */
    updateMultiple: async ({ ctx, args, user }: { ctx: MutationCtx, args: UpdateMultipleInstancesArgs, user: Doc<"users"> }): Promise<{ updatedInstanceIds: Array<Id<"classInstances">>; totalUpdated: number }> => {
        console.log("🗓️  --- SERVICE: classInstanceService.updateMultiple ---");

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

        for (const instance of matchingInstances) {
            const { newStartTime, newEndTime } = timeUtils.calculateNewInstanceTimes(
                instance,
                cleanArgs.startTime,
                cleanArgs.endTime
            );

            const timeFieldsUpdate = (cleanArgs.startTime || cleanArgs.endTime)
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
        }

        return { updatedInstanceIds, totalUpdated: updatedInstanceIds.length };
    },

    /**
     * Soft delete a single class instance
     */
    deleteSingle: async ({ ctx, args, user }: { ctx: MutationCtx, args: DeleteSingleInstanceArgs, user: Doc<"users"> }): Promise<{ deletedInstanceId: Id<"classInstances"> }> => {
        console.log("🗓️  --- SERVICE: classInstanceService.deleteSingle ---");

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
        console.log("🗓️  --- SERVICE: classInstanceService.deleteSimilarFuture ---");

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
        console.log("🗓️  --- SERVICE: classInstanceService.getInstances ---");

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
        console.log("🗓️  --- SERVICE: classInstanceService.getSimilarInstances ---");

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
        console.log("🗓️  --- SERVICE: classInstanceService.getInstanceById ---");

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
};