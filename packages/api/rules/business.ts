import { ConvexError } from "convex/values";
import { ERROR_CODES } from "../utils/errorCodes";
import type { Doc } from "../convex/_generated/dataModel";

export const canOnlyCreateBusinessOnce = (user: Doc<"users">) => {
    if (!user) {
        throw new ConvexError({
            message: "User not authenticated",
            code: ERROR_CODES.UNAUTHORIZED
        });
    }

    if (user.businessId) {
        throw new ConvexError({
            message: "User already belongs to a business",
            code: ERROR_CODES.USER_ALREADY_ASSOCIATED_WITH_BUSINESS
        });
    }
};

export const canAcceptPayments = (business: Doc<"businesses">): boolean => {
    return business.stripeConnectedAccountStatus === "enabled";
};