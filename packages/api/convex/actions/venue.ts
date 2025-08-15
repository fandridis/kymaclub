"use node";

import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";


export const generateVenueCoordinates = internalAction({
    args: { venueId: v.id("venues"), fullAddress: v.string() },
    handler: async (ctx, args) => {
        const { lat, lng } = await geocodeAddress(args.fullAddress);

        await ctx.runMutation(internal.mutations.venues.updateVenueCoordinates, {
            venueId: args.venueId,
            lat: lat,
            lng: lng
        });
    },
});

const geocodeAddress = async (fullAddress: string) => {
    const encoded = encodeURIComponent(fullAddress);
    const res = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encoded}&key=${process.env.GOOGLE_LOCATION_API_KEY}`
    );
    const data = await res.json();

    if (!data.results.length) {
        throw new Error("No results found");
    }

    const { lat, lng } = data.results[0].geometry.location;
    return { lat, lng };
};
