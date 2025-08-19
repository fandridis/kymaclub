import { paginationOptsValidator } from "convex/server";
import { query } from "../_generated/server";
import { v } from "convex/values";
import { venueService } from "../../services/venueService";
import { getAuthenticatedUserOrThrow } from "../utils";

/***************************************************************
 * Get one business's Venues
 ***************************************************************/
export const getVenues = query({
    args: {},
    handler: async (ctx) => {
        const user = await getAuthenticatedUserOrThrow(ctx);
        return await venueService.getVenues({ ctx, user });
    }
});

/***************************************************************
 * Get one business's Venues
 ***************************************************************/
export const getAllVenues = query({
    args: {},
    handler: async (ctx) => {
        const user = await getAuthenticatedUserOrThrow(ctx);
        return await venueService.getAllVenues({ ctx, user });
    }
});



/***************************************************************
 * Get Venues By City (Paginated)
 ***************************************************************/
export const getVenuesByCityPaginatedArgs = v.object({
    paginationOpts: paginationOptsValidator,
    city: v.string(),
    userLat: v.optional(v.number()),
    userLng: v.optional(v.number()),
});

export const getVenuesByCityPaginated = query({
    args: getVenuesByCityPaginatedArgs,
    handler: async (ctx, args) => {
        const user = await getAuthenticatedUserOrThrow(ctx);
        const serviceArgs = {
            paginationOpts: {
                numItems: args.paginationOpts.numItems,
                cursor: args.paginationOpts.cursor || undefined
            },
            city: args.city,
            userLat: args.userLat,
            userLng: args.userLng
        };
        return await venueService.getVenuesByCityPaginated({ ctx, args: serviceArgs, user });
    }
});

/***************************************************************
 * Get Venue By ID
 ***************************************************************/

export const getVenueByIdArgs = v.object({
    venueId: v.id("venues"),
});

export const getVenueById = query({
    args: getVenueByIdArgs,
    handler: async (ctx, args) => {
        const user = await getAuthenticatedUserOrThrow(ctx);
        return await venueService.getVenueById({ ctx, args, user });
    }
});

/***************************************************************
 * Get Upcoming Classes for Venue
 ***************************************************************/

export const getUpcomingClassesForVenueArgs = v.object({
    venueId: v.id("venues"),
    daysAhead: v.optional(v.number()),
});

export const getUpcomingClassesForVenue = query({
    args: getUpcomingClassesForVenueArgs,
    handler: async (ctx, args) => {
        return await venueService.getUpcomingClassesForVenue({ ctx, args });
    }
});