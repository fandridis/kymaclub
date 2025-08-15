import { ConvexError } from "convex/values";
import { ERROR_CODES } from "../utils/errorCodes";
import type { Doc } from "../convex/_generated/dataModel";

export const userMustBeAssociatedWithBusiness = (user: Doc<"users">) => {
    if (!user.businessId) {
        throw new ConvexError({
            message: "User must belong to a business to create venues",
            code: ERROR_CODES.USER_NOT_ASSOCIATED_WITH_BUSINESS
        });
    }
}

export const coreRules = {
    userMustBeAssociatedWithBusiness,
}