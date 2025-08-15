import { v, Infer } from "convex/values";
import { mutationWithTriggers } from "../triggers";
import { coreService } from "../../services/coreService";
import { businessesFields, venuesFields } from "../schema";
import { omit } from "convex-helpers";
import { getAuthenticatedUserOrThrow } from "../utils";

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
