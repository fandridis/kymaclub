import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError } from "convex/values";
import { ERROR_CODES } from "../utils/errorCodes";
import { Id } from "./_generated/dataModel";
import { MutationCtx, QueryCtx } from "./_generated/server";

/** 
 * This is not a query, it's a helper function that can be used in both queries and mutations or actions
 * We can later extract everything to separate files.
*/
export async function getCurrentUser(ctx: QueryCtx) {
    const userId = await getAuthUserId(ctx);
    return userId ? await ctx.db.get(userId) : null;
}

export async function getAuthenticatedUserOrThrow(ctx: MutationCtx | QueryCtx) {
    const user = await getCurrentUser(ctx);
    if (!user) {
        throw new ConvexError({
            message: "User not found",
            code: ERROR_CODES.USER_NOT_FOUND
        });
    }
    return user;
}

export async function getBusinessOrThrow(ctx: MutationCtx | QueryCtx, businessId: Id<"businesses"> | undefined) {
    if (!businessId) {
        throw new ConvexError({
            message: "User does not belong to a business",
            code: ERROR_CODES.USER_NOT_ASSOCIATED_WITH_BUSINESS
        });
    }

    const business = await ctx.db.get(businessId);
    if (!business) {
        throw new ConvexError({
            message: "Business not found",
            code: ERROR_CODES.BUSINESS_NOT_FOUND
        });
    }
    return business;
}

export async function getAuthenticatedUserAndBusinessOrThrow(ctx: MutationCtx | QueryCtx) {
    const user = await getAuthenticatedUserOrThrow(ctx);
    const business = await getBusinessOrThrow(ctx, user.businessId);
    return { user, business };
}

/**
 * Require that the user has internal or admin role
 * Throws an error if the user is not authenticated or doesn't have the required role
 */
export async function requireInternalUserOrThrow(ctx: MutationCtx | QueryCtx) {
    const user = await getAuthenticatedUserOrThrow(ctx);
    if (user.role !== "internal" && user.role !== "admin") {
        throw new ConvexError({
            message: "This action requires internal or admin access",
            code: ERROR_CODES.UNAUTHORIZED,
        });
    }
    return user;
}