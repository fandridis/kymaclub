import { Infer, v } from "convex/values";
import { classInstanceService } from "../../services/classInstanceService";
import { getAuthenticatedUserAndBusinessOrThrow } from "../utils";
import { classInstancesFields } from "../schema";
import { omit } from "convex-helpers";
import { mutationWithTriggers } from "../triggers";
import { partial } from "convex-helpers/validators";
import { classTemplateService } from "../../services/classTemplateService";
import { Id } from "../_generated/dataModel";

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
    returns: v.object({
        createdInstanceId: v.id("classInstances"),
    }),
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
    frequency: v.union(v.literal("daily"), v.literal("weekly"), v.literal("biweekly")),
    weeks: v.number(),
    duration: v.number(),
    selectedDaysOfWeek: v.optional(v.array(v.number())),
    disableBookings: v.optional(v.boolean()),
});
export type CreateMultipleClassInstancesArgs = Infer<typeof createMultipleClassInstancesArgs>;

export const createMultipleClassInstances = mutationWithTriggers({
    args: createMultipleClassInstancesArgs,
    returns: v.object({
        createdInstanceIds: v.array(v.id("classInstances")),
        totalCreated: v.number(),
    }),
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
    returns: v.object({
        updatedInstanceId: v.id("classInstances"),
        bookingsAffected: v.number(),
    }),
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
    returns: v.object({
        updatedInstanceIds: v.array(v.id("classInstances")),
        totalUpdated: v.number(),
        bookingsAffected: v.number(),
    }),
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
    returns: v.object({
        deletedInstanceId: v.id("classInstances"),
    }),
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
    returns: v.object({
        deletedInstanceIds: v.array(v.id("classInstances")),
        totalDeleted: v.number(),
    }),
    handler: async (ctx, args) => {
        const { user } = await getAuthenticatedUserAndBusinessOrThrow(ctx);
        return classInstanceService.deleteSimilarFuture({ ctx, args, user });
    }
});

/***************************************************************
 * Create Class (Composite: Template + Instance)
 ***************************************************************/

export const createClassArgs = v.object({
    venueId: v.id("venues"),
    name: v.string(),
    description: v.optional(v.string()),
    shortDescription: v.optional(v.string()),
    instructor: v.optional(v.string()),
    duration: v.number(),
    capacity: v.number(),
    price: v.number(),
    startTime: v.number(),
    timezone: v.string(),
    recurring: v.optional(v.object({
        frequency: v.union(v.literal("daily"), v.literal("weekly"), v.literal("biweekly")),
        occurrences: v.number(),
    })),
});

export const createClass = mutationWithTriggers({
    args: createClassArgs,
    returns: v.object({
        templateId: v.id("classTemplates"),
        createdInstanceIds: v.array(v.id("classInstances")),
    }),
    handler: async (ctx, args) => {
        const { user } = await getAuthenticatedUserAndBusinessOrThrow(ctx);
        const { venueId, name, description, shortDescription, instructor, price, capacity, duration, startTime, recurring } = args;

        // 1. Create Template
        const { createdTemplateId } = await classTemplateService.create({
            ctx,
            user,
            args: {
                template: {
                    venueId,
                    name,
                    description,
                    shortDescription,
                    instructor: instructor ?? user.name ?? "Instructor",
                    duration,
                    capacity,
                    price,
                    primaryCategory: "workshop", // Default category
                    tags: [],
                    imageStorageIds: [],
                    disableBookings: false,
                }
            }
        });

        const templateId = createdTemplateId;
        let createdInstanceIds: Id<"classInstances">[] = [];

        // 2. Create Instance(s)
        if (recurring) {
            // Need to convert occurrences to weeks for timeUtils logic?
            // Existing createMultiple expects 'weeks'.
            // If biweekly and 4 occurrences -> 8 weeks?
            // If weekly and 4 occurrences -> 4 weeks.
            // timeUtils uses 'weeks' as duration bound.
            // Daily? Occurrences -> days?
            // createMultiple expects 'weeks'.
            // If daily, it runs for X weeks.
            // But dialog inputs 'occurrences'.
            // If I input 12 occurrences of daily -> 12 days -> ~2 weeks.
            // This mismatch suggests I should probably refactor createMultiple or timeUtils to take occurrences directly?
            // But timeUtils is used elsewhere.
            // For now, I'll approximate or calculate weeks needed to cover occurrences.
            // For daily: weeks = occurrences / 7 ?

            // Actually, let's keep it simple for now. 
            // If the user inputs "weeks" in createMultiple, that's duration.
            // The dialog inputs "occurrences".
            // I'll calculate weeks required to cover these occurrences.
            // Note: timeGeneration loops until < endDate (addWeeks(startDate, weeks)).

            const weeks = recurring.frequency === 'biweekly'
                ? recurring.occurrences * 2
                : recurring.frequency === 'weekly'
                    ? recurring.occurrences
                    : Math.ceil(recurring.occurrences / 7);

            const result = await classInstanceService.createMultiple({
                ctx,
                user,
                args: {
                    templateId,
                    startTime,
                    frequency: recurring.frequency === 'biweekly' ? 'biweekly' : recurring.frequency === 'daily' ? 'daily' : 'weekly',
                    weeks: weeks,
                    duration,
                    // If daily, selectedDaysOfWeek might be needed? 
                    // Dialog doesn't select days for daily/weekly/biweekly. It assumes pattern starts on startDate.
                    // timeUtils: if weekly, it just adds weeks.
                    // if daily, it checks selectedDaysOfWeek.
                    // If selectedDaysOfWeek is empty, daily loop does nothing!
                    // I need to provide selectedDaysOfWeek for daily?
                    // Or update timeUtils to default to "every day" if empty?
                    // timeUtils: selectedDaysOfWeek = [].
                    // if (selectedDaysOfWeek.includes(dayOfWeek))...
                    // So daily requires selectedDaysOfWeek.
                    // But weekly loop does NOT use selectedDaysOfWeek.
                    // What about daily? Dialog doesn't have day picker for daily.
                    // It implies every day?
                    selectedDaysOfWeek: recurring.frequency === 'daily' ? [0, 1, 2, 3, 4, 5, 6] : undefined,
                }
            });
            createdInstanceIds = result.createdInstanceIds;

        } else {
            // Single instance
            const result = await classInstanceService.create({
                ctx,
                user,
                args: {
                    templateId,
                    startTime,
                }
            });
            createdInstanceIds = [result.createdInstanceId];
        }

        return {
            templateId,
            createdInstanceIds
        };
    }
});
