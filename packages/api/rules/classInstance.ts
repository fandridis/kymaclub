import { ConvexError } from "convex/values";
import { ERROR_CODES } from "../utils/errorCodes";
import type { Doc } from "../convex/_generated/dataModel";
import { hasFieldChanged } from "../utils/core";

export const userMustBeInstanceOwner = (instance: Doc<"classInstances">, user: Doc<"users">) => {
    if (instance.businessId !== user.businessId) {
        throw new ConvexError({
            message: "You are not authorized to update this instance",
            field: "businessId",
            code: ERROR_CODES.UNAUTHORIZED
        });
    }
};

export const instanceMustHaveActiveTemplate = (template: Doc<"classTemplates">) => {
    if (!template.isActive) {
        throw new ConvexError({
            message: "Cannot create instances from inactive template",
            code: ERROR_CODES.ACTION_NOT_ALLOWED
        });
    }
};


/***************************************************************
 * Business Logic Rules
 ***************************************************************/


export const instanceCanBeUpdated = (instance: Doc<"classInstances">): boolean => {
    return instance.status === "scheduled" && !instance.deleted;
};


export const templateChangesRequireInstanceUpdate = ({
    existingTemplate,
    updatedTemplate,
}: {
    existingTemplate: Doc<"classTemplates">;
    updatedTemplate: Partial<Doc<"classTemplates">>;
}): boolean => {
    return (
        hasFieldChanged(existingTemplate.deleted, updatedTemplate.deleted) ||
        hasFieldChanged(existingTemplate.name, updatedTemplate.name) ||
        hasFieldChanged(existingTemplate.description, updatedTemplate.description) ||
        hasFieldChanged(existingTemplate.instructor, updatedTemplate.instructor) ||
        hasFieldChanged(existingTemplate.imageStorageIds, updatedTemplate.imageStorageIds)
        // Add more template fields that should trigger instance updates
    );
};

export const venueChangesRequireInstanceUpdate = ({
    existingVenue,
    updatedVenue,
}: {
    existingVenue: Doc<"venues">;
    updatedVenue: Partial<Doc<"venues">>;
}): boolean => {
    return (
        hasFieldChanged(existingVenue.deleted, updatedVenue.deleted) ||
        hasFieldChanged(existingVenue.name, updatedVenue.name) ||
        hasFieldChanged(existingVenue.address?.street, updatedVenue.address?.street) ||
        hasFieldChanged(existingVenue.address?.city, updatedVenue.address?.city) ||
        hasFieldChanged(existingVenue.address?.zipCode, updatedVenue.address?.zipCode) ||
        hasFieldChanged(existingVenue.address?.country, updatedVenue.address?.country) ||
        hasFieldChanged(existingVenue.address?.state, updatedVenue.address?.state) ||
        hasFieldChanged(existingVenue.imageStorageIds, updatedVenue.imageStorageIds)
        // Add more venue fields that should trigger instance updates
    );
};

export const classInstanceRules = {
    userMustBeInstanceOwner,
    instanceMustHaveActiveTemplate,
    instanceCanBeUpdated,
    templateChangesRequireInstanceUpdate,
    venueChangesRequireInstanceUpdate,
};