import type { MutationCtx, QueryCtx } from "../convex/_generated/server";
import type { Doc, Id } from "../convex/_generated/dataModel";
import type { CreateVenueArgs, DeleteVenueArgs, UpdateVenueArgs } from "../convex/mutations/venues";
import { internal } from "../convex/_generated/api";
import { ConvexError } from "convex/values";
import { userMustBeAssociatedWithBusiness } from "../rules/core";
import { createDefaultVenue, prepareCreateVenue, prepareUpdateVenue } from "../operations/venue";
import { ERROR_CODES } from "../utils/errorCodes";
import { venueRules } from "../rules/venue";


// Service object with all venue operations
export const venueService = {
    /**
     * Create a new venue
     */
    create: async ({ ctx, args, user }: { ctx: MutationCtx, args: CreateVenueArgs, user: Doc<"users"> }): Promise<{ createdVenueId: Id<"venues"> }> => {
        userMustBeAssociatedWithBusiness(user);

        const cleanVenue = prepareCreateVenue(args);
        const defaults = createDefaultVenue(user.businessId!, user._id);

        const venueId = await ctx.db.insert("venues", {
            ...defaults,
            ...cleanVenue,
        });

        await ctx.scheduler.runAfter(0, internal.actions.venue.generateVenueCoordinates, {
            venueId,
            fullAddress: cleanVenue.address.street + ' ' + cleanVenue.address.city + ' ' + cleanVenue.address.state + ' ' + cleanVenue.address.zipCode + ' ' + cleanVenue.address.country,
        });

        return { createdVenueId: venueId };
    },

    /**
     * Update an existing venue
     */
    update: async ({ ctx, args, user }: { ctx: MutationCtx, args: UpdateVenueArgs, user: Doc<"users"> }): Promise<{ updatedVenueId: Id<"venues"> }> => {

        const existingVenue = await ctx.db.get(args.venueId);
        if (!existingVenue) {
            throw new ConvexError({
                message: "Venue not found",
                field: "venueId",
                code: ERROR_CODES.RESOURCE_NOT_FOUND
            });
        }

        venueRules.userMustBeVenueOwner(existingVenue, user);

        const cleanVenue = prepareUpdateVenue(args, existingVenue);

        await ctx.db.patch(args.venueId, {
            ...cleanVenue,
            updatedAt: Date.now(),
            updatedBy: user._id,
        });

        return {
            updatedVenueId: args.venueId
        };
    },

    /**
     * Soft delete a venue (mark as deleted)
     */
    delete: async ({ ctx, args, user }: { ctx: MutationCtx, args: DeleteVenueArgs, user: Doc<"users"> }): Promise<{ deletedVenueId: Id<"venues"> }> => {

        const existingVenue = await ctx.db.get(args.venueId);
        if (!existingVenue) {
            throw new ConvexError({
                message: "Venue not found",
                field: "venueId",
                code: ERROR_CODES.RESOURCE_NOT_FOUND
            });
        }

        const activeVenues = await ctx.db
            .query("venues")
            .withIndex("by_business", q => q.eq("businessId", existingVenue.businessId))
            .filter(q => q.neq(q.field("deleted"), true))
            .take(2);

        venueRules.lastVenueCannotBeDeleted(existingVenue, activeVenues, user);

        // Check if the venue is used in any class templates
        const classTemplates = await ctx.db.query("classTemplates").withIndex("by_venue_deleted", q => q.eq("venueId", args.venueId).eq("deleted", false)).collect();
        if (classTemplates.length > 0) {
            throw new ConvexError({
                message: "Venue is used in class templates. Please update the templates first.",
                field: "venueId",
                code: ERROR_CODES.ACTION_NOT_ALLOWED
            });
        }

        // Soft delete the venue
        await ctx.db.patch(args.venueId, {
            deleted: true,
            deletedAt: Date.now(),
            deletedBy: user._id,
        });

        return {
            deletedVenueId: args.venueId
        };
    },

    /**
     * Permanently delete a venue from database
     */
    hardDelete: async ({ ctx, args, user }: { ctx: MutationCtx, args: DeleteVenueArgs, user: Doc<"users"> }): Promise<{ success: boolean }> => {

        const existingVenue = await ctx.db.get(args.venueId);
        if (!existingVenue) {
            throw new ConvexError({
                message: "Venue not found",
                field: "venueId",
                code: ERROR_CODES.RESOURCE_NOT_FOUND
            });
        }

        venueRules.lastVenueCannotBeDeleted(existingVenue, [], user);

        // Check if the venue is used in any class templates
        const classTemplates = await ctx.db.query("classTemplates").withIndex("by_venue_deleted", q => q.eq("venueId", args.venueId).eq("deleted", false)).collect();
        if (classTemplates.length > 0) {
            throw new ConvexError({
                message: "Venue is used in class templates. Cannot permanently delete.",
                field: "venueId",
                code: ERROR_CODES.ACTION_NOT_ALLOWED
            });
        }

        // Check if the venue has any class instances
        const classInstances = await ctx.db.query("classInstances").withIndex("by_venue", q => q.eq("venueId", args.venueId)).collect();
        if (classInstances.length > 0) {
            throw new ConvexError({
                message: "Venue has class instances. Cannot permanently delete.",
                field: "venueId",
                code: ERROR_CODES.ACTION_NOT_ALLOWED
            });
        }

        // Permanently delete the venue
        await ctx.db.delete(args.venueId);

        return {
            success: true
        };
    },

    /**
     * Get all venues for the user's business
     */
    getVenues: async ({ ctx, user }: { ctx: QueryCtx, user: Doc<"users"> }): Promise<Doc<"venues">[]> => {

        userMustBeAssociatedWithBusiness(user);

        const venues = await ctx.db
            .query("venues")
            .withIndex("by_business", q => q.eq("businessId", user.businessId!))
            .filter(q => q.neq(q.field("deleted"), true))
            .collect();

        return venues;
    },

    /**
     * Get all venues for all businesses
     */
    getAllVenues: async ({ ctx }: { ctx: QueryCtx }): Promise<Doc<"venues">[]> => {
        const venues = await ctx.db
            .query("venues")
            .withIndex("by_deleted", q => q.eq("deleted", false))
            .collect();
        return venues;
    },

    /**
     * Get venue by ID
     */
    getVenueById: async ({ ctx, args, user }: { ctx: QueryCtx, args: { venueId: Id<"venues"> }, user: Doc<"users"> }): Promise<Doc<"venues">> => {

        const venue = await ctx.db.get(args.venueId);
        if (!venue) {
            throw new ConvexError({
                message: "Venue not found",
                field: "venueId",
                code: ERROR_CODES.RESOURCE_NOT_FOUND
            });
        }

        return venue;
    },

    /**
     * Get upcoming classes for a venue
     */
    getUpcomingClassesForVenue: async ({ ctx, args }: {
        ctx: QueryCtx,
        args: {
            venueId: Id<"venues">,
            daysAhead?: number
        }
    }): Promise<Doc<"classInstances">[]> => {

        // Verify venue exists
        const venue = await ctx.db.get(args.venueId);
        if (!venue) {
            throw new ConvexError({
                message: "Venue not found",
                field: "venueId",
                code: ERROR_CODES.RESOURCE_NOT_FOUND
            });
        }

        // Calculate date range
        const now = Date.now();
        const daysAhead = args.daysAhead ?? 14;
        const endDate = now + (daysAhead * 24 * 60 * 60 * 1000);

        // Get upcoming class instances
        const allInstances = await ctx.db
            .query("classInstances")
            .withIndex("by_venue", q => q.eq("venueId", args.venueId))
            .filter(q => q.and(
                q.gte(q.field("startTime"), now),
                q.lte(q.field("startTime"), endDate),
                q.neq(q.field("deleted"), true),
                q.eq(q.field("status"), "scheduled")
            ))
            .collect();

        // Sort chronologically and limit
        const sortedInstances = allInstances
            .sort((a, b) => a.startTime - b.startTime)
            .slice(0, 20);

        return sortedInstances;
    }
};