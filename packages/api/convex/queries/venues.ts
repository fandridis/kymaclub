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
 * Get all venues of the application
 ***************************************************************/
const locationFilterArgs = v.object({
    latitude: v.number(),
    longitude: v.number(),
    maxDistanceKm: v.number(),
});

export const getAllVenues = query({
    args: {
        locationFilter: v.optional(locationFilterArgs),
    },
    handler: async (ctx, args) => {
        const user = await getAuthenticatedUserOrThrow(ctx);
        return await venueService.getAllVenues({ ctx, args, user });
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
        const user = await getAuthenticatedUserOrThrow(ctx);
        return await venueService.getUpcomingClassesForVenue({ ctx, args, user });
    }
});
