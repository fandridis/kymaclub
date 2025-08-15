import { ConvexError } from "convex/values";
import { ERROR_CODES } from "../utils/errorCodes";
import type { Doc } from "../convex/_generated/dataModel";
import { coreRules } from "./core";


const userMustBeVenueOwner = (venue: Doc<"venues">, user: Doc<"users">) => {
    coreRules.userMustBeAssociatedWithBusiness(user);

    if (venue.businessId !== user.businessId) {
        throw new ConvexError({
            message: "You are not authorized to update this venue",
            field: "businessId",
            code: ERROR_CODES.UNAUTHORIZED
        });
    }
}

const lastVenueCannotBeDeleted = (venue: Doc<"venues">, venues: Doc<"venues">[], user: Doc<"users">) => {
    userMustBeVenueOwner(venue, user);

    if (venues.length <= 1) {
        throw new ConvexError({
            message: "You cannot delete your last venue.",
            field: "businessId",
            code: ERROR_CODES.ACTION_NOT_ALLOWED
        });
    }
}

const coordinatesNeedRecalculation = ({ oldVenue, newVenue }: { oldVenue: Doc<"venues">, newVenue: Partial<Doc<"venues">> }) => {
    if (!newVenue.address) {
        return false;
    }
    return oldVenue.address.street !== newVenue.address.street ||
        oldVenue.address.city !== newVenue.address.city ||
        oldVenue.address.state !== newVenue.address.state ||
        oldVenue.address.zipCode !== newVenue.address.zipCode ||
        oldVenue.address.country !== newVenue.address.country;
};

export const venueRules = {
    userMustBeVenueOwner,
    lastVenueCannotBeDeleted,
    coordinatesNeedRecalculation,
};
