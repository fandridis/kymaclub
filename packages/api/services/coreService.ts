import type { MutationCtx, QueryCtx } from "../convex/_generated/server";
import type { Doc, Id } from "../convex/_generated/dataModel";
import { internal } from "../convex/_generated/api";
import { canOnlyCreateBusinessOnce } from "../rules/business";
import { prepareCreateBusiness, createDefaultBusiness } from "../operations/business";
import { CreateBusinessWithVenueArgs, UpdateBusinessDetailsArgs, UpdateBusinessSocialArgs, UpdateCurrentUserProfileArgs, CompleteConsumerOnboardingArgs } from "../convex/mutations/core";
import { coreValidations } from "../validations/core";

export const coreService = {
    /**
     * Create a new business and an initial venue for the authenticated user (onboarding)
     */
    createBusinessWithVenue: async ({ ctx, args, user }: { ctx: MutationCtx, args: CreateBusinessWithVenueArgs, user: Doc<"users"> }): Promise<{ createdBusinessId: Id<"businesses">; createdVenueId: Id<"venues"> }> => {
        canOnlyCreateBusinessOnce(user);

        // Prepare business and venue data
        const cleanArgs = prepareCreateBusiness(args);
        const businessDefaults = createDefaultBusiness(user._id);

        const businessId = await ctx.db.insert("businesses", {
            ...businessDefaults,
            ...cleanArgs.business,
        });

        // Update user ownership
        await ctx.db.patch(user._id, {
            businessId,
            businessRole: "owner",
            hasBusinessOnboarded: true,
        });

        // Create initial venue (uses cleaned venue data)
        const venueId = await ctx.db.insert("venues", {
            businessId,
            name: cleanArgs.venue.name,
            description: cleanArgs.venue.description,
            capacity: cleanArgs.venue.capacity,
            email: cleanArgs.venue.email,
            phone: cleanArgs.business.phone,
            website: cleanArgs.business.website,
            equipment: cleanArgs.venue.equipment,
            amenities: cleanArgs.venue.amenities,
            services: cleanArgs.venue.services,
            address: cleanArgs.venue.address,
            primaryCategory: cleanArgs.venue.primaryCategory,
            citySlug: cleanArgs.venue.citySlug,
            isActive: true,
            deleted: false,
            createdAt: Date.now(),
            createdBy: user._id,
        });

        // Schedule coordinate generation
        await ctx.scheduler.runAfter(0, internal.actions.venue.generateVenueCoordinates, {
            venueId,
            fullAddress:
                cleanArgs.venue.address.street + " " +
                cleanArgs.venue.address.city + " " +
                (cleanArgs.venue.address.state || "") + " " +
                cleanArgs.venue.address.zipCode + " " +
                cleanArgs.venue.address.country,
        });

        // Seed default business notification settings (email+web enabled)
        await ctx.db.insert('businessSettings', {
            businessId,
            notifications: {
                preferences: {
                    booking_created: { email: true, web: true },
                    booking_cancelled_by_consumer: { email: true, web: true },
                    booking_cancelled_by_business: { email: true, web: true },
                    payment_received: { email: true, web: true },
                    review_received: { email: true, web: true },
                },
            },
            createdAt: Date.now(),
            createdBy: user._id,
            updatedAt: Date.now(),
            updatedBy: user._id,
        });

        return { createdBusinessId: businessId, createdVenueId: venueId };
    },

    /**
     * Update business social links / website
     */
    updateBusinessSocial: async ({ ctx, args, user }: { ctx: MutationCtx, args: UpdateBusinessSocialArgs, user: Doc<"users"> }): Promise<{ updatedBusinessId: Id<'businesses'> }> => {
        if (!user.businessId) {
            throw new Error("User does not belong to a business");
        }
        await ctx.db.patch(user.businessId, {
            ...(args.website !== undefined ? { website: args.website } : {}),
            ...(args.socialMedia !== undefined ? { socialMedia: args.socialMedia } : {}),
            updatedAt: Date.now(),
            updatedBy: user._id,
        });
        return { updatedBusinessId: user.businessId };
    },

    /**
     * Update business core details (name, phone)
     */
    updateBusinessDetails: async ({ ctx, args, user }: { ctx: MutationCtx, args: UpdateBusinessDetailsArgs, user: Doc<"users"> }): Promise<{ updatedBusinessId: Id<'businesses'> }> => {
        if (!user.businessId) {
            throw new Error("User does not belong to a business");
        }
        await ctx.db.patch(user.businessId, {
            ...(args.name !== undefined ? { name: args.name } : {}),
            ...(args.phone !== undefined ? { phone: args.phone } : {}),
            updatedAt: Date.now(),
            updatedBy: user._id,
        });
        return { updatedBusinessId: user.businessId };
    },

    /**
     * Update current user profile (name)
     */
    updateCurrentUserProfile: async ({ ctx, args, user }: { ctx: MutationCtx, args: UpdateCurrentUserProfileArgs, user: Doc<"users"> }): Promise<{ updatedUserId: Id<'users'> }> => {
        await ctx.db.patch(user._id, {
            ...(args.name !== undefined ? {
                name: args.name,
            } : {}),
        });
        return { updatedUserId: user._id };
    },

    // Specific onboarding method completeConsumerOnboarding
    completeConsumerOnboarding: async ({ ctx, args, user }: { ctx: MutationCtx, args: CompleteConsumerOnboardingArgs, user: Doc<"users"> }): Promise<{ updatedUserId: Id<'users'> }> => {
        // Validate city
        const cityValidation = coreValidations.validateCitySelection(args.city);
        if (!cityValidation.success) {
            throw new Error(cityValidation.error);
        }

        await ctx.db.patch(user._id, {
            ...(args.name !== undefined ? { name: args.name } : {}),
            activeCitySlug: cityValidation.value,
            hasConsumerOnboarded: true,
        });
        return { updatedUserId: user._id };
    },

    /**
     * Get current user and their business (if any)
     */
    getCurrentUserWithBusiness: async ({ ctx, userId }: { ctx: QueryCtx, userId: Id<'users'> | null }): Promise<{ user: Doc<'users'> | null, business: Doc<'businesses'> | null }> => {
        if (!userId) return { user: null, business: null };
        const user = await ctx.db.get(userId);
        if (!user) return { user: null, business: null };
        const business = user.businessId ? await ctx.db.get(user.businessId) : null;
        return { user, business };
    },
};
