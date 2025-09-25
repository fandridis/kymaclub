
import type { Doc, Id } from "../convex/_generated/dataModel";
import type { QueryCtx } from "../convex/_generated/server";
import type { CreateClassTemplateArgs, UpdateClassTemplateArgs } from "../convex/mutations/classTemplates";
import { classValidations } from "../validations/class";
import { throwIfError } from "../utils/core";

/***************************************************************
 * Template Data Preparation Operations
 ***************************************************************/

const prepareCreateTemplate = (args: CreateClassTemplateArgs): CreateClassTemplateArgs['template'] => {
    const t = args.template;

    // Validate name to check for reserved names
    const cleanName = throwIfError(classValidations.validateName(t.name), 'name');

    const cleanTemplate: CreateClassTemplateArgs['template'] = {
        // Spread the original to keep values that are not being validated
        ...t,
        // Mandatory fields
        name: cleanName,
        instructor: throwIfError(classValidations.validateInstructor(t.instructor), 'instructor'),
        duration: throwIfError(classValidations.validateDuration(t.duration), 'duration'),
        capacity: throwIfError(classValidations.validateCapacity(t.capacity), 'capacity'),
        price: throwIfError(classValidations.validatePrice(t.price), 'price'),

        // Optional fields
        ...(t.description !== undefined && { description: throwIfError(classValidations.validateDescription(t.description), 'description') }),
        ...(t.tags !== undefined && { tags: throwIfError(classValidations.validateTags(t.tags), 'tags') }),
        ...(t.bookingWindow !== undefined && { bookingWindow: throwIfError(classValidations.validateBookingWindow(t.bookingWindow), 'bookingWindow') }),
        ...(t.cancellationWindowHours !== undefined && { cancellationWindowHours: throwIfError(classValidations.validateCancellationWindowHours(t.cancellationWindowHours), 'cancellationWindowHours') }),
        ...(t.waitlistCapacity !== undefined && { waitlistCapacity: throwIfError(classValidations.validateWaitlistCapacity(t.waitlistCapacity!), 'waitlistCapacity') }),
        ...(t.discountRules !== undefined && { discountRules: throwIfError(classValidations.validateDiscountRules(t.discountRules), 'discountRules') }),
        ...(t.primaryCategory !== undefined && { primaryCategory: throwIfError(classValidations.validatePrimaryCategory(t.primaryCategory), 'primaryCategory') }),
    };

    return cleanTemplate;
};

const prepareUpdateTemplate = (
    template: UpdateClassTemplateArgs['template']
): Partial<Omit<UpdateClassTemplateArgs['template'], '_id'>> => {
    const t = template;

    // Validate name if provided to check for reserved names
    let cleanName: string | undefined;
    if (t.name !== undefined) {
        cleanName = throwIfError(classValidations.validateName(t.name), 'name');

    }

    const cleanTemplate: Partial<UpdateClassTemplateArgs['template']> = {
        ...t,

        // Override with validated fields
        ...(t.name !== undefined && { name: cleanName! }),
        ...(t.instructor !== undefined && { instructor: throwIfError(classValidations.validateInstructor(t.instructor), 'instructor') }),
        ...(t.description !== undefined && { description: throwIfError(classValidations.validateDescription(t.description), 'description') }),
        ...(t.tags !== undefined && { tags: throwIfError(classValidations.validateTags(t.tags), 'tags') }),
        ...(t.duration !== undefined && { duration: throwIfError(classValidations.validateDuration(t.duration), 'duration') }),
        ...(t.capacity !== undefined && { capacity: throwIfError(classValidations.validateCapacity(t.capacity), 'capacity') }),
        ...(t.price !== undefined && { price: throwIfError(classValidations.validatePrice(t.price), 'price') }),
        ...(t.bookingWindow !== undefined && { bookingWindow: throwIfError(classValidations.validateBookingWindow(t.bookingWindow), 'bookingWindow') }),
        ...(t.cancellationWindowHours !== undefined && { cancellationWindowHours: throwIfError(classValidations.validateCancellationWindowHours(t.cancellationWindowHours), 'cancellationWindowHours') }),
        ...(t.waitlistCapacity !== undefined && { waitlistCapacity: throwIfError(classValidations.validateWaitlistCapacity(t.waitlistCapacity), 'waitlistCapacity') }),
        ...(t.discountRules !== undefined && { discountRules: throwIfError(classValidations.validateDiscountRules(t.discountRules), 'discountRules') }),
        ...(t.primaryCategory !== undefined && { primaryCategory: throwIfError(classValidations.validatePrimaryCategory(t.primaryCategory), 'primaryCategory') }),
    };

    return cleanTemplate;
};

// export const prepareInstanceUpdates = (
//     instances: Doc<"classInstances">[],
//     updatedTemplate: UpdateClassTemplateArgs['template']
// ): Array<{ instanceId: Id<"classInstances">; changes: Partial<Doc<"classInstances">> }> => {

//     return instanceOperations.prepareInstanceUpdatesFromTemplateChanges(instances, updatedTemplate);
// };


/***************************************************************
 * Template Query Operations
 ***************************************************************/

const createDefaultTemplate = (
    businessId: Id<"businesses">,
    userId: Id<"users">
) => {
    return {
        businessId,
        isActive: true,
        allowWaitlist: false,
        deleted: false,
        createdBy: userId,
        createdAt: Date.now(),
    };
};


const validateTemplateForInstanceCreation = (
    template: Doc<"classTemplates">
): {
    isValid: boolean;
    missingFields: string[];
} => {
    const missingFields: string[] = [];

    if (!template.name?.trim()) missingFields.push("name");
    if (!template.instructor?.trim()) missingFields.push("instructor");
    if (!template.duration || template.duration <= 0) missingFields.push("duration");
    if (!template.capacity || template.capacity <= 0) missingFields.push("capacity");
    if (template.price === undefined || template.price < 0) missingFields.push("price");

    const primaryCategory = template.primaryCategory;
    if (!primaryCategory || !String(primaryCategory).trim()) {
        missingFields.push("primaryCategory");
    }

    return {
        isValid: missingFields.length === 0,
        missingFields,
    };
};

export const classTemplateOperations = {
    prepareCreateTemplate,
    prepareUpdateTemplate,
    createDefaultTemplate,
    validateTemplateForInstanceCreation,
};
