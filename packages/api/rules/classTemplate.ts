import { ConvexError } from "convex/values";
import { ERROR_CODES } from "../utils/errorCodes";
import type { Doc } from "../convex/_generated/dataModel";

// Authorization rules
const userMustBeTemplateOwner = (template: Doc<"classTemplates">, user: Doc<"users">) => {
    if (template.businessId !== user.businessId) {
        throw new ConvexError({
            message: "You are not authorized to update this template",
            field: "businessId",
            code: ERROR_CODES.UNAUTHORIZED
        });
    }
};

export const classTemplateRules = {
    userMustBeTemplateOwner,
};
