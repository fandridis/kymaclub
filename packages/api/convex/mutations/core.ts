import { v, Infer } from "convex/values";
import { mutationWithTriggers } from "../triggers";
import { internalMutation, mutation } from "../_generated/server";
import { coreService } from "../../services/coreService";
import { businessesFields, venuesFields } from "../schema";
import { getAuthenticatedUserOrThrow } from "../utils";
import { omit } from "convex-helpers";
import { ConvexError } from "convex/values";
import { ERROR_CODES } from "../../utils/errorCodes";
import { coreValidations } from "../../validations/core";

/***************************************************************
 * Create Business with Venue
 ***************************************************************/
export const createBusinessWithVenueArgs = v.object({
    business: v.object({
        ...omit(businessesFields, [
            "createdAt",
            "createdBy",
            "isActive",
            "address",
            "timezone",
            "currency",
            "feeStructure",
            "onboardingCompleted",
        ]),
        address: v.object({
            street: v.string(),
            city: v.string(),
            zipCode: v.string(),
            state: v.optional(v.string()),
            country: v.string(),
        }),
    }),
    venue: v.object({
        ...omit(venuesFields, ["businessId", "createdAt", "createdBy", "isActive"]),
    }),
    classTypes: v.optional(v.array(v.object({
        name: v.string(),
        category: v.optional(v.string()),
        color: v.optional(v.string()),
    }))),
});
export type CreateBusinessWithVenueArgs = Infer<typeof createBusinessWithVenueArgs>;

export const createBusinessWithVenue = mutationWithTriggers({
    args: createBusinessWithVenueArgs,
    handler: async (ctx, args) => {
        const user = await getAuthenticatedUserOrThrow(ctx);
        return coreService.createBusinessWithVenue({ ctx, args, user });
    }
});

/***************************************************************
 * Update Business Social
 ***************************************************************/
export const updateBusinessSocialArgs = v.object({
    website: v.optional(v.string()),
    socialMedia: v.optional(v.object({
        facebook: v.optional(v.string()),
        instagram: v.optional(v.string()),
        twitter: v.optional(v.string()),
        youtube: v.optional(v.string()),
        linkedin: v.optional(v.string()),
    }))
});
export type UpdateBusinessSocialArgs = Infer<typeof updateBusinessSocialArgs>;

export const updateBusinessSocial = mutationWithTriggers({
    args: updateBusinessSocialArgs,
    handler: async (ctx, args) => {
        const user = await getAuthenticatedUserOrThrow(ctx);
        return coreService.updateBusinessSocial({ ctx, args, user });
    }
});

/***************************************************************
 * Update Business Details
 ***************************************************************/
export const updateBusinessDetailsArgs = v.object({
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
});
export type UpdateBusinessDetailsArgs = Infer<typeof updateBusinessDetailsArgs>;

export const updateBusinessDetails = mutationWithTriggers({
    args: updateBusinessDetailsArgs,
    handler: async (ctx, args) => {
        const user = await getAuthenticatedUserOrThrow(ctx);
        return coreService.updateBusinessDetails({ ctx, args, user });
    }
});

/***************************************************************
 * Update Current User Profile
 ***************************************************************/
export const updateCurrentUserProfileArgs = v.object({
    name: v.optional(v.string()),
});
export type UpdateCurrentUserProfileArgs = Infer<typeof updateCurrentUserProfileArgs>;

export const updateCurrentUserProfile = mutationWithTriggers({
    args: updateCurrentUserProfileArgs,
    handler: async (ctx, args) => {
        const user = await getAuthenticatedUserOrThrow(ctx);
        return coreService.updateCurrentUserProfile({ ctx, args, user });
    }
});

/***************************************************************
 * Complete Consumer Onboarding
 ***************************************************************/
export const completeConsumerOnboardingArgs = v.object({
    name: v.optional(v.string()),
    city: v.string(),
});
export type CompleteConsumerOnboardingArgs = Infer<typeof completeConsumerOnboardingArgs>;

export const completeConsumerOnboarding = mutationWithTriggers({
    args: completeConsumerOnboardingArgs,
    handler: async (ctx, args) => {
        const user = await getAuthenticatedUserOrThrow(ctx);
        return coreService.completeConsumerOnboarding({ ctx, args, user });
    }
});

/***************************************************************
 * Check User Exists By Email
 ***************************************************************/
export const checkUserExistsByEmailArgs = v.object({
    email: v.string(),
});
export type CheckUserExistsByEmailArgs = Infer<typeof checkUserExistsByEmailArgs>;

export const checkUserExistsByEmail = mutationWithTriggers({
    args: checkUserExistsByEmailArgs,
    handler: async (ctx, args) => {
        const user = await ctx.db
            .query("users")
            .withIndex("email", (q) => q.eq("email", args.email))
            .first();
        return !!user && !user.deleted;
    }
});

/***************************************************************
 * Update User Stripe Customer ID
 ***************************************************************/
export const updateStripeCustomerIdArgs = v.object({
    userId: v.id("users"),
    stripeCustomerId: v.string(),
});
export type UpdateStripeCustomerIdArgs = Infer<typeof updateStripeCustomerIdArgs>;

export const updateStripeCustomerId = internalMutation({
    args: updateStripeCustomerIdArgs,
    handler: async (ctx, args) => {
        // This is an internal mutation called by webhooks, so no auth check needed
        // Just verify the user exists
        const user = await ctx.db.get(args.userId);
        if (!user) {
            throw new Error("User not found");
        }

        await ctx.db.patch(args.userId, {
            stripeCustomerId: args.stripeCustomerId,
            // updatedAt: Date.now(),
        });

        return { success: true };
    }
});

/***************************************************************
 * Remove all sessions for current user
 ***************************************************************/
export const removeAllSessions = mutation({
    args: {},
    handler: async (ctx) => {
        const user = await getAuthenticatedUserOrThrow(ctx);
        // remove all records from authSessions table with column userId equal to user._id
        // first find them and then delete
        const sessions = await ctx.db.query("authSessions").withIndex("userId", q => q.eq("userId", user._id)).collect();

        for (const session of sessions) {
            await ctx.db.delete(session._id);
        }
        return { success: true };
    }
});

/***************************************************************
 * Update User City
 ***************************************************************/
export const updateUserCityArgs = v.object({
    city: v.string(),
});
export type UpdateUserCityArgs = Infer<typeof updateUserCityArgs>;

export const updateUserCity = mutationWithTriggers({
    args: updateUserCityArgs,
    handler: async (ctx, args) => {
        const user = await getAuthenticatedUserOrThrow(ctx);

        // Validate city
        const validationResult = coreValidations.validateCitySelection(args.city);
        if (!validationResult.success) {
            throw new ConvexError({
                message: validationResult.error,
                field: "city",
                code: ERROR_CODES.VALIDATION_ERROR,
            });
        }

        // Update user's active city slug
        await ctx.db.patch(user._id, {
            activeCitySlug: validationResult.value,
        });

        return { success: true, city: validationResult.value };
    }
});

/***************************************************************
 * Authorize Business Email (Internal Users Only)
 ***************************************************************/
export const authorizeBusinessEmailArgs = v.object({
    email: v.string(),
    expiresAt: v.optional(v.number()), // Optional expiration timestamp
    notes: v.optional(v.string()), // Optional notes about authorization
});
export type AuthorizeBusinessEmailArgs = Infer<typeof authorizeBusinessEmailArgs>;

export const authorizeBusinessEmail = mutation({
    args: authorizeBusinessEmailArgs,
    handler: async (ctx, args) => {
        const user = await getAuthenticatedUserOrThrow(ctx);

        // Only internal users can authorize emails
        if (user.role !== "internal") {
            throw new ConvexError({
                message: "Only internal users can authorize business emails",
                code: ERROR_CODES.UNAUTHORIZED,
            });
        }

        // Check if already authorized
        const existing = await ctx.db
            .query("authorizedBusinessEmails")
            .withIndex("by_email", (q) => q.eq("email", args.email))
            .filter((q) => q.neq(q.field("deleted"), true))
            .first();

        if (existing) {
            throw new ConvexError({
                message: "Email is already authorized",
                code: ERROR_CODES.VALIDATION_ERROR,
            });
        }

        // Create authorization record
        const authorizedId = await ctx.db.insert("authorizedBusinessEmails", {
            email: args.email,
            authorizedBy: user._id,
            expiresAt: args.expiresAt,
            notes: args.notes,
            createdAt: Date.now(),
            createdBy: user._id,
        });

        return { authorizedId, message: `Email ${args.email} authorized for business account creation` };
    }
});