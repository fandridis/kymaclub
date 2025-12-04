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

/***************************************************************
 * Update User Language Preference
 * Used for localizing push notifications and emails
 ***************************************************************/
export const updateUserLanguageArgs = v.object({
    language: v.string(),
});
export type UpdateUserLanguageArgs = Infer<typeof updateUserLanguageArgs>;

export const updateUserLanguage = mutationWithTriggers({
    args: updateUserLanguageArgs,
    returns: v.object({ success: v.boolean() }),
    handler: async (ctx, args) => {
        const user = await getAuthenticatedUserOrThrow(ctx);
        return coreService.updateUserLanguage({ ctx, args, user });
    }
});

/***************************************************************
 * Store Pending Auth Language
 * Temporarily stores language preference before OTP email is sent.
 * This allows the OTP email to be sent in the user's preferred language.
 * Records expire after 12 hours and are cleaned up by cron.
 ***************************************************************/
const PENDING_AUTH_LANGUAGE_EXPIRY_MS = 12 * 60 * 60 * 1000; // 12 hours

export const storePendingAuthLanguageArgs = v.object({
    email: v.string(),
    language: v.string(), // 'en' or 'el'
});
export type StorePendingAuthLanguageArgs = Infer<typeof storePendingAuthLanguageArgs>;

export const storePendingAuthLanguage = mutation({
    args: storePendingAuthLanguageArgs,
    returns: v.object({ success: v.boolean() }),
    handler: async (ctx, args) => {
        // No auth required - this is called before user is authenticated
        const normalizedEmail = args.email.toLowerCase().trim();
        const expiresAt = Date.now() + PENDING_AUTH_LANGUAGE_EXPIRY_MS;

        // Check if record already exists for this email
        const existing = await ctx.db
            .query("pendingAuthLanguages")
            .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
            .first();

        if (existing) {
            // Update existing record
            await ctx.db.patch(existing._id, {
                language: args.language,
                expiresAt,
            });
        } else {
            // Create new record
            await ctx.db.insert("pendingAuthLanguages", {
                email: normalizedEmail,
                language: args.language,
                expiresAt,
            });
        }

        return { success: true };
    }
});

/***************************************************************
 * Delete Pending Auth Language (Internal)
 * Called by OTP providers after reading the language preference
 ***************************************************************/
export const deletePendingAuthLanguage = internalMutation({
    args: { email: v.string() },
    returns: v.null(),
    handler: async (ctx, args) => {
        const normalizedEmail = args.email.toLowerCase().trim();
        
        const pending = await ctx.db
            .query("pendingAuthLanguages")
            .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
            .first();

        if (pending) {
            await ctx.db.delete(pending._id);
        }

        return null;
    }
});

/***************************************************************
 * Cleanup Expired Pending Auth Languages (Internal)
 * Called by cron job to remove expired records
 ***************************************************************/
export const cleanupExpiredPendingAuthLanguages = internalMutation({
    args: {},
    returns: v.object({ deletedCount: v.number() }),
    handler: async (ctx) => {
        const now = Date.now();
        
        // Find all expired records
        const expired = await ctx.db
            .query("pendingAuthLanguages")
            .withIndex("by_expiresAt")
            .filter((q) => q.lt(q.field("expiresAt"), now))
            .collect();

        // Delete them
        for (const record of expired) {
            await ctx.db.delete(record._id);
        }

        return { deletedCount: expired.length };
    }
});