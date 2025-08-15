import { ConvexError } from "convex/values";
import type { Doc, Id } from "../convex/_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../convex/_generated/server";
import { format, getDay } from "date-fns";
import { throwIfError, updateIfExists } from '../utils/core';
import { ERROR_CODES } from '../utils/errorCodes';
import { classValidations } from "../validations/class";
import { CreateMultipleClassInstancesArgs, UpdateSingleInstanceArgs } from "../convex/mutations/classInstances";

/***************************************************************
 * Instance Data Preparation
 ***************************************************************/
export const prepareCreateMultipleInstances = (args: CreateMultipleClassInstancesArgs): CreateMultipleClassInstancesArgs => {
    const i = args;

    return {
        // Spread the original to keep values that are not being validated
        ...i,
        // Mandatory fields
        startTime: throwIfError(classValidations.validateStartTime(i.startTime), 'startTime'),
        frequency: throwIfError(classValidations.validateFrequency(i.frequency), 'frequency'),
        weeks: throwIfError(classValidations.validateCount(i.weeks), 'weeks'),

        // Optional fields
        ...(i.selectedDaysOfWeek !== undefined && {
            selectedDaysOfWeek: throwIfError(classValidations.validateSelectedDaysOfWeek(i.selectedDaysOfWeek), 'selectedDaysOfWeek')
        }),
    };
};

export const prepareUpdateInstance = (args: UpdateSingleInstanceArgs['instance']): Partial<UpdateSingleInstanceArgs['instance']> => {
    const i = args;

    // Business rule validation
    if (i.endTime !== undefined && i.startTime === undefined) {
        throw new ConvexError({
            message: "Cannot update end time without start time",
            field: "endTime",
            code: ERROR_CODES.VALIDATION_ERROR
        });
    }

    return {
        ...i,

        // Time fields with special business logic
        ...(i.startTime !== undefined && i.endTime !== undefined && {
            startTime: throwIfError(classValidations.validateStartTime(i.startTime), 'startTime'),
            endTime: throwIfError(classValidations.validateEndTime(i.endTime, i.startTime), 'endTime'),
        }),
        ...(i.startTime !== undefined && i.endTime === undefined && {
            startTime: throwIfError(classValidations.validateStartTime(i.startTime), 'startTime'),
        }),

        // Optional fields
        ...(i.name !== undefined && { name: throwIfError(classValidations.validateName(i.name), 'name') }),
        ...(i.instructor !== undefined && { instructor: throwIfError(classValidations.validateInstructor(i.instructor), 'instructor') }),
        ...(i.description !== undefined && { description: throwIfError(classValidations.validateDescription(i.description), 'description') }),
        ...(i.tags !== undefined && { tags: throwIfError(classValidations.validateTags(i.tags), 'tags') }),
        ...(i.capacity !== undefined && { capacity: throwIfError(classValidations.validateCapacity(i.capacity), 'capacity') }),
        ...(i.baseCredits !== undefined && { baseCredits: throwIfError(classValidations.validateBaseCredits(i.baseCredits), 'baseCredits') }),
        ...(i.bookingWindow !== undefined && { bookingWindow: throwIfError(classValidations.validateBookingWindow(i.bookingWindow), 'bookingWindow') }),
        ...(i.cancellationWindowHours !== undefined && { cancellationWindowHours: throwIfError(classValidations.validateCancellationWindowHours(i.cancellationWindowHours), 'cancellationWindowHours') }),
        ...(i.color !== undefined && { color: i.color }),
    };
};

export const prepareInstanceUpdatesFromTemplateChanges = (
    instances: Doc<"classInstances">[],
    templateChanges: Partial<Doc<"classTemplates">>
): Array<{ instanceId: Id<"classInstances">; changes: Partial<Doc<"classInstances">> }> => {
    // Update the instance.name if the template.name has changed
    return instances.map(instance => ({
        instanceId: instance._id,
        changes: {
            ...updateIfExists({
                name: templateChanges.name,
                description: templateChanges.description,
                instructor: templateChanges.instructor,
            }),
            templateSnapshot: {
                ...instance.templateSnapshot,
                ...updateIfExists({
                    name: templateChanges.name,
                    description: templateChanges.description,
                    instructor: templateChanges.instructor,
                    imageStorageIds: templateChanges.imageStorageIds,
                    deleted: templateChanges.deleted,
                }),
            },
        }
    }));
};

export const prepareInstanceUpdatesFromVenueChanges = (
    instances: Doc<"classInstances">[],
    venueChanges: Partial<Doc<"venues">>
): Array<{ instanceId: Id<"classInstances">; changes: Partial<Doc<"classInstances">> }> => {
    return instances.map(instance => ({
        instanceId: instance._id,
        changes: {
            venueSnapshot: {
                ...instance.venueSnapshot,
                ...updateIfExists({
                    name: venueChanges.name,
                    address: venueChanges.address && {
                        ...instance.venueSnapshot.address,
                        ...venueChanges.address,
                    },
                    imageStorageIds: venueChanges.imageStorageIds,
                    deleted: venueChanges.deleted,
                }),
            },
        }
    }));
};

/***************************************************************
 * Instance Creation Operations
 ***************************************************************/

export const createInstanceFromTemplate = (
    template: Doc<"classTemplates">,
    venue: Doc<"venues">,
    business: Doc<"businesses">,
    user: Doc<"users">,
    startTime: number
) => {
    // Validate startTime
    const validatedStartTime = throwIfError(classValidations.validateStartTime(startTime), 'startTime');

    // Calculate endTime from template duration
    const endTime = validatedStartTime + (template.duration * 60 * 1000);

    const now = Date.now();

    return {
        businessId: business._id,
        templateId: template._id,
        venueId: template.venueId!,
        timezone: business.timezone,
        startTime: validatedStartTime,
        endTime,
        status: 'scheduled' as const,

        timePattern: `${format(validatedStartTime, 'HH:mm')}-${format(endTime, 'HH:mm')}`,
        dayOfWeek: getDay(validatedStartTime),

        name: template.name,
        description: template.description,
        instructor: template.instructor,
        capacity: template.capacity,
        baseCredits: template.baseCredits,
        bookingWindow: template.bookingWindow,
        // We don't add this by default, it's can be added to manually override the template value
        // cancellationWindowHours: template.cancellationWindowHours,
        tags: template.tags,
        color: template.color,

        // Booking tracking
        bookedCount: 0,
        waitlistCount: 0,

        // Template snapshot
        templateSnapshot: {
            name: template.name,
            description: template.description,
            instructor: template.instructor,
            imageStorageIds: template.imageStorageIds,
        },

        // Venue snapshot
        venueSnapshot: {
            name: venue.name,
            address: {
                street: venue.address.street,
                city: venue.address.city,
                zipCode: venue.address.zipCode,
                country: venue.address.country,
                state: venue.address.state,
            },
            imageStorageIds: venue.imageStorageIds,
        },

        // Audit fields
        createdAt: now,
        createdBy: user._id,
    };
};




export const classInstanceOperations = {
    prepareCreateMultipleInstances,
    prepareUpdateInstance,
    prepareInstanceUpdatesFromTemplateChanges,
    prepareInstanceUpdatesFromVenueChanges,
    createInstanceFromTemplate,
};