import type { Doc, Id } from "../convex/_generated/dataModel";
import { coreValidations } from "../validations/core";
import { venueValidations } from "../validations/venue";
import { CreateVenueArgs, UpdateVenueArgs } from "../convex/mutations/venues";
import { throwIfError } from "../utils/core";

export const prepareCreateVenue = (args: CreateVenueArgs): CreateVenueArgs['venue'] => {
    const v = args.venue;

    const cleanVenue: CreateVenueArgs['venue'] = {
        // Spread the original to keep values that are not being validated
        ...v,
        // Mandatory fields
        name: throwIfError(venueValidations.validateName(v.name), 'name'),
        email: throwIfError(coreValidations.validateEmail(v.email), 'email'), // Email is now required and validated
        address: {
            street: throwIfError(coreValidations.validateStreet(v.address.street), 'address.street'),
            city: throwIfError(coreValidations.validateCity(v.address.city), 'address.city'),
            zipCode: throwIfError(coreValidations.validateZipCode(v.address.zipCode), 'address.zipCode'),
            country: throwIfError(coreValidations.validateCountry(v.address.country), 'address.country'),
            ...(v.address.state !== undefined && { state: throwIfError(coreValidations.validateState(v.address.state), 'address.state') }),
        },

        // Optional fields
        ...(v.description !== undefined && { description: throwIfError(venueValidations.validateDescription(v.description), 'description') }),
        ...(v.capacity !== undefined && { capacity: throwIfError(venueValidations.validateCapacity(v.capacity), 'capacity') }),
        ...(v.equipment !== undefined && { equipment: throwIfError(venueValidations.validateEquipment(v.equipment), 'equipment') }),
        ...(v.amenities !== undefined && { amenities: v.amenities }),
        ...(v.services !== undefined && { services: v.services }),
        ...(v.imageStorageIds !== undefined && { imageStorageIds: v.imageStorageIds }),
        ...(v.phone !== undefined && { phone: v.phone }),
        ...(v.website !== undefined && { website: v.website }),
        ...(v.socialMedia !== undefined && { socialMedia: v.socialMedia }),
    };

    return cleanVenue;
};

export const createDefaultVenue = (
    businessId: Id<"businesses">,
    userId: Id<"users">
) => {
    return {
        businessId,
        isActive: true,
        createdAt: Date.now(),
        createdBy: userId,
    };
};

export const prepareUpdateVenue = (updates: UpdateVenueArgs, existingVenue: Doc<"venues">): UpdateVenueArgs['venue'] => {
    const v = updates.venue;

    const cleanVenue: UpdateVenueArgs['venue'] = {
        // Spread the original to keep values that are not being validated
        ...v,
        // Mandatory fields
        address: {
            ...existingVenue.address,
            ...(v.address?.street !== undefined && { street: throwIfError(coreValidations.validateStreet(v.address.street), 'address.street') }),
            ...(v.address?.city !== undefined && { city: throwIfError(coreValidations.validateCity(v.address.city), 'address.city') }),
            ...(v.address?.zipCode !== undefined && { zipCode: throwIfError(coreValidations.validateZipCode(v.address.zipCode), 'address.zipCode') }),
            ...(v.address?.country !== undefined && { country: throwIfError(coreValidations.validateCountry(v.address.country), 'address.country') }),
            // State is optional
            ...(v.address?.state !== undefined && { state: throwIfError(coreValidations.validateState(v.address.state), 'address.state') }),
            ...(v.address?.latitude !== undefined && { latitude: throwIfError(venueValidations.validateLatitude(v.address.latitude), 'address.latitude') }),
            ...(v.address?.longitude !== undefined && { longitude: throwIfError(venueValidations.validateLongitude(v.address.longitude), 'address.longitude') }),
        },

        // Optional fields
        ...(v.name !== undefined && { name: throwIfError(venueValidations.validateName(v.name), 'name') }),
        ...(v.description !== undefined && { description: throwIfError(venueValidations.validateDescription(v.description), 'description') }),
        ...(v.capacity !== undefined && { capacity: throwIfError(venueValidations.validateCapacity(v.capacity), 'capacity') }),
        ...(v.equipment !== undefined && { equipment: throwIfError(venueValidations.validateEquipment(v.equipment), 'equipment') }),
        ...(v.amenities !== undefined && { amenities: v.amenities }),
        ...(v.services !== undefined && { services: v.services }),
        ...(v.imageStorageIds !== undefined && { imageStorageIds: v.imageStorageIds }),
        ...(v.phone !== undefined && { phone: v.phone }),
        ...(v.website !== undefined && { website: v.website }),
        ...(v.email !== undefined && { email: v.email }),
        ...(v.socialMedia !== undefined && { socialMedia: v.socialMedia }),
    };

    return cleanVenue;
};

export const venueOperations = {
    prepareCreateVenue,
    createDefaultVenue,
    prepareUpdateVenue,
};