import { Infer, v } from "convex/values";
import { classInstanceService } from "../../services/classInstanceService";
import { getAuthenticatedUserAndBusinessOrThrow } from "../utils";
import { classInstancesFields } from "../schema";
import { omit } from "convex-helpers";
import { mutationWithTriggers } from "../triggers";
import { partial } from "convex-helpers/validators";

/***************************************************************
 * Create Class Instance
 ***************************************************************/

export const createClassInstanceArgs = v.object({
    templateId: v.id("classTemplates"),
    startTime: v.number(),
    disableBookings: v.optional(v.boolean()),
});
export type CreateClassInstanceArgs = Infer<typeof createClassInstanceArgs>;

export const createClassInstance = mutationWithTriggers({
    args: createClassInstanceArgs,
    handler: async (ctx, args) => {
        const { user } = await getAuthenticatedUserAndBusinessOrThrow(ctx);
        return classInstanceService.create({ ctx, args, user });
    }
});

/***************************************************************
 * Create Multiple Class Instances
 ***************************************************************/

export const createMultipleClassInstancesArgs = v.object({
    templateId: v.id("classTemplates"),
    startTime: v.number(),
    frequency: v.union(v.literal("daily"), v.literal("weekly")),
    weeks: v.number(),
    duration: v.number(),
    selectedDaysOfWeek: v.optional(v.array(v.number())),
    disableBookings: v.optional(v.boolean()),
});
export type CreateMultipleClassInstancesArgs = Infer<typeof createMultipleClassInstancesArgs>;

export const createMultipleClassInstances = mutationWithTriggers({
    args: createMultipleClassInstancesArgs,
    handler: async (ctx, args) => {
        const { user } = await getAuthenticatedUserAndBusinessOrThrow(ctx);
        return classInstanceService.createMultiple({ ctx, args, user });
    }
});

/***************************************************************
 * Update Single Instance
 ***************************************************************/

export const updateSingleInstanceArgs = v.object({
    instanceId: v.id("classInstances"),
    instance: v.object({
        ...partial(omit(classInstancesFields, [
            'businessId', 'templateId', 'venueId', 'bookedCount', 'status',
            'templateSnapshot', 'venueSnapshot', 'createdAt', 'createdBy',
            'updatedAt', 'updatedBy', 'deleted', 'deletedAt', 'deletedBy',
            'timePattern', 'dayOfWeek'
        ]))
    })
});
export type UpdateSingleInstanceArgs = Infer<typeof updateSingleInstanceArgs>;

export const updateSingleInstance = mutationWithTriggers({
    args: updateSingleInstanceArgs,
    handler: async (ctx, args) => {
        const { user } = await getAuthenticatedUserAndBusinessOrThrow(ctx);
        return classInstanceService.updateSingle({ ctx, args, user });
    }
});

/***************************************************************
 * Update Multiple Instances
 ***************************************************************/

export const updateMultipleInstancesArgs = v.object({
    instanceId: v.id("classInstances"),
    instance: v.object({
        ...partial(omit(classInstancesFields, [
            'businessId', 'templateId', 'venueId', 'bookedCount', 'status',
            'templateSnapshot', 'venueSnapshot', 'createdAt', 'createdBy',
            'updatedAt', 'updatedBy', 'deleted', 'deletedAt', 'deletedBy',
            'timePattern', 'dayOfWeek'
        ]))
    })
});
export type UpdateMultipleInstancesArgs = Infer<typeof updateMultipleInstancesArgs>;

export const updateMultipleInstances = mutationWithTriggers({
    args: updateMultipleInstancesArgs,
    handler: async (ctx, args) => {
        const { user } = await getAuthenticatedUserAndBusinessOrThrow(ctx);
        return classInstanceService.updateMultiple({ ctx, args, user });
    }
});

/***************************************************************
 * Delete Single Instance
 ***************************************************************/

export const deleteSingleInstanceArgs = v.object({
    instanceId: v.id("classInstances")
});
export type DeleteSingleInstanceArgs = Infer<typeof deleteSingleInstanceArgs>;

export const deleteSingleInstance = mutationWithTriggers({
    args: deleteSingleInstanceArgs,
    handler: async (ctx, args) => {
        const { user } = await getAuthenticatedUserAndBusinessOrThrow(ctx);
        return classInstanceService.deleteSingle({ ctx, args, user });
    }
});

/***************************************************************
 * Delete Similar Future Instances
 ***************************************************************/

export const deleteSimilarFutureInstancesArgs = v.object({
    instanceId: v.id("classInstances")
});
export type DeleteSimilarFutureInstancesArgs = Infer<typeof deleteSimilarFutureInstancesArgs>;

export const deleteSimilarFutureInstances = mutationWithTriggers({
    args: deleteSimilarFutureInstancesArgs,
    handler: async (ctx, args) => {
        const { user } = await getAuthenticatedUserAndBusinessOrThrow(ctx);
        return classInstanceService.deleteSimilarFuture({ ctx, args, user });
    }
});
