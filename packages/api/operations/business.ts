import type { Id } from "../convex/_generated/dataModel";
import { CreateBusinessWithVenueArgs } from "../convex/mutations/core";

import { throwIfError } from "../utils/core";
import { coreValidations } from "../validations/core";
import { venueValidations } from "../validations/venue";

export const prepareCreateBusiness = (args: CreateBusinessWithVenueArgs): CreateBusinessWithVenueArgs => {
    const cleanBusiness: CreateBusinessWithVenueArgs = {
        business: {
            name: throwIfError(coreValidations.validateBusinessName(args.business.name), 'name'),
            email: throwIfError(coreValidations.validateEmail(args.business.email), 'email'),
            address: {
                street: throwIfError(coreValidations.validateStreet(args.business.address.street), 'street'),
                city: throwIfError(coreValidations.validateCity(args.business.address.city), 'city'),
                state: throwIfError(coreValidations.validateState(args.business.address.state), 'state'),
                zipCode: throwIfError(coreValidations.validateZipCode(args.business.address.zipCode), 'zipCode'),
                country: throwIfError(coreValidations.validateCountry(args.business.address.country), 'country'),
            }
        },
        venue: {
            name: throwIfError(venueValidations.validateName(args.venue.name), 'name'),
            email: throwIfError(coreValidations.validateEmail(args.venue.email), 'email'),
            address: {
                street: throwIfError(coreValidations.validateStreet(args.venue.address.street), 'street'),
                city: throwIfError(coreValidations.validateCity(args.venue.address.city), 'city'),
                state: throwIfError(coreValidations.validateState(args.venue.address.state), 'state'),
                zipCode: throwIfError(coreValidations.validateZipCode(args.venue.address.zipCode), 'zipCode'),
                country: throwIfError(coreValidations.validateCountry(args.venue.address.country), 'country'),
            },
            primaryCategory: args.venue.primaryCategory,
        }
    };

    if (args.business.phone !== undefined) {
        cleanBusiness.business.phone = throwIfError(coreValidations.validatePhone(args.business.phone), 'phone');
    }

    if (args.business.website !== undefined) {
        cleanBusiness.business.website = throwIfError(coreValidations.validateWebsite(args.business.website), 'website');
    }

    if (args.business.description !== undefined) {
        cleanBusiness.business.description = throwIfError(coreValidations.validateDescription(args.business.description), 'description');
    }

    return cleanBusiness;
};

export const createDefaultBusiness = (userId: Id<"users">) => {
    return {
        timezone: "Europe/Athens",
        currency: "EUR",
        feeStructure: {
            payoutFrequency: "monthly" as const,
            minimumPayout: 50,
            payoutMethod: undefined,
        },
        isActive: true,
        onboardingCompleted: false,
        createdAt: Date.now(),
        createdBy: userId,
    };
};