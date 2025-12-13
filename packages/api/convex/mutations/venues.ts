import { internalMutation } from "../_generated/server";
import { Infer, v } from "convex/values";
import { getAuthenticatedUserAndBusinessOrThrow } from "../utils";
import { venueService } from "../../services/venueService";
import { venuesFields } from "../schema";
import { omit } from "convex-helpers";
import { partial } from "convex-helpers/validators";
import { mutationWithTriggers } from "../triggers";

/***************************************************************
 * Create Venue
 ***************************************************************/
export const createVenueArgs = v.object({
    venue: v.object({
        ...omit(venuesFields, ['businessId', 'createdAt', 'createdBy', 'isActive'])
    })
});
export type CreateVenueArgs = Infer<typeof createVenueArgs>;

export const createVenue = mutationWithTriggers({
    args: createVenueArgs,
    returns: v.object({
        createdVenueId: v.id("venues"),
    }),
    handler: async (ctx, args) => {
        const { user } = await getAuthenticatedUserAndBusinessOrThrow(ctx);
        return venueService.create({ ctx, args, user });
    }
});


/***************************************************************
 * Update Venue
 ***************************************************************/
export const updateVenueArgs = v.object({
    venueId: v.id("venues"),
    venue: v.object({
        ...partial(venuesFields)
    })
});
export type UpdateVenueArgs = Infer<typeof updateVenueArgs>;

export const updateVenue = mutationWithTriggers({
    args: updateVenueArgs,
    returns: v.object({
        updatedVenueId: v.id("venues"),
    }),
    handler: async (ctx, args) => {
        const { user } = await getAuthenticatedUserAndBusinessOrThrow(ctx);
        return venueService.update({ ctx, args, user });
    }
});


/***************************************************************
 * Delete Venue
 ***************************************************************/
export const deleteVenueArgs = v.object({
    venueId: v.id("venues")
});
export type DeleteVenueArgs = Infer<typeof deleteVenueArgs>;

export const deleteVenue = mutationWithTriggers({
    args: deleteVenueArgs,
    returns: v.object({
        deletedVenueId: v.id("venues"),
    }),
    handler: async (ctx, args) => {
        const { user } = await getAuthenticatedUserAndBusinessOrThrow(ctx);
        return venueService.delete({ ctx, args, user });
    }
});


/***************************************************************
 * Internal Mutations
 ***************************************************************/
export const updateVenueCoordinatesArgs = v.object({
    venueId: v.id("venues"),
    lat: v.number(),
    lng: v.number()
});
export type UpdateVenueCoordinatesArgs = Infer<typeof updateVenueCoordinatesArgs>;

export const updateVenueCoordinates = internalMutation({
    args: updateVenueCoordinatesArgs,
    returns: v.null(),
    handler: async (ctx, args) => {

        const existingVenue = await ctx.db.get(args.venueId);

        if (!existingVenue) {
            throw new Error("Venue not found");
        }

        const updateArgs = {
            venueId: args.venueId,
            venue: {
                ...existingVenue,
                address: {
                    ...existingVenue.address,
                    latitude: args.lat,
                    longitude: args.lng,
                },
            },
        };

        await ctx.db.patch(args.venueId, updateArgs.venue);
    }
});
