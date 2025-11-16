import type { Id } from "../convex/_generated/dataModel";
import { CreateBusinessWithVenueArgs } from "../convex/mutations/core";

import { throwIfError } from "../utils/core";
import { coreValidations } from "../validations/core";
import { prepareCreateVenue } from "./venue";

export const prepareCreateBusiness = (args: CreateBusinessWithVenueArgs): CreateBusinessWithVenueArgs => {
    const preparedVenue = prepareCreateVenue({ venue: args.venue });

    const cleanBusiness: CreateBusinessWithVenueArgs = {
        business: {
            name: throwIfError(coreValidations.validateBusinessName(args.business.name), 'name'),
            description: throwIfError(coreValidations.validateDescription(args.business.description ?? ''), 'description'),
            email: throwIfError(coreValidations.validateEmail(args.business.email), 'email'),
            address: {
                street: throwIfError(coreValidations.validateStreet(args.business.address.street), 'street'),
                city: throwIfError(coreValidations.validateCity(args.business.address.city), 'city'),
                state: throwIfError(coreValidations.validateState(args.business.address.state), 'state'),
                zipCode: throwIfError(coreValidations.validateZipCode(args.business.address.zipCode), 'zipCode'),
                country: throwIfError(coreValidations.validateCountry(args.business.address.country), 'country'),
            }
        },
        venue: preparedVenue,
    };

    if (args.business.phone !== undefined) {
        cleanBusiness.business.phone = throwIfError(coreValidations.validatePhone(args.business.phone), 'phone');
    }

    if (args.business.website !== undefined) {
        cleanBusiness.business.website = throwIfError(coreValidations.validateWebsite(args.business.website), 'website');
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