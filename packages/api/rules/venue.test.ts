import { describe, it, expect } from "vitest";
import { ConvexError } from "convex/values";
import { venueRules } from "./venue";
import { createTestUser, createTestBusiness } from "../convex/testResources";
import { ERROR_CODES } from "../utils/errorCodes";
import type { Doc } from "../convex/_generated/dataModel";

describe('Venue Rules', () => {
    const mockUser = createTestUser();
    const mockBusinessId = createTestBusiness()._id;

    const createMockVenue = (overrides: Partial<Doc<"venues">> = {}): Doc<"venues"> => ({
        _id: "venue123" as any,
        _creationTime: Date.now(),
        businessId: mockBusinessId,
        name: "Test Venue",
        email: "venue@test.com",
        description: "Test Description",
        capacity: 50,
        equipment: ["mat", "blocks"],
        address: {
            street: "123 Test St",
            city: "Athens",
            zipCode: "12345",
            country: "Greece"
        },
        primaryCategory: "yoga_studio",
        socialMedia: {},
        amenities: {},
        services: {},
        isActive: true,
        imageStorageIds: [],
        createdAt: Date.now(),
        createdBy: mockUser._id,
        updatedAt: Date.now(),
        updatedBy: mockUser._id,
        ...overrides
    });

    describe('userMustBeVenueOwner', () => {
        it('should allow venue owner to access venue', () => {
            const venue = createMockVenue();
            const user = { ...mockUser, businessId: mockBusinessId };

            expect(() => venueRules.userMustBeVenueOwner(venue, user)).not.toThrow();
        });

        it('should throw error when user is not associated with business', () => {
            const venue = createMockVenue();
            const user = { ...mockUser, businessId: undefined };

            expect(() => venueRules.userMustBeVenueOwner(venue, user))
                .toThrow(ConvexError);
        });

        it('should throw error when user belongs to different business', () => {
            const venue = createMockVenue();
            const user = { ...mockUser, businessId: "different_business_id" as any };

            expect(() => venueRules.userMustBeVenueOwner(venue, user))
                .toThrow(new ConvexError({
                    message: "You are not authorized to update this venue",
                    field: "businessId",
                    code: ERROR_CODES.UNAUTHORIZED
                }));
        });
    });

    describe('lastVenueCannotBeDeleted', () => {
        it('should allow deletion when business has multiple venues', () => {
            const venue = createMockVenue();
            const venues = [venue, createMockVenue({ _id: "venue456" as any })];
            const user = { ...mockUser, businessId: mockBusinessId };

            expect(() => venueRules.lastVenueCannotBeDeleted(venue, venues, user))
                .not.toThrow();
        });

        it('should throw error when trying to delete last venue', () => {
            const venue = createMockVenue();
            const venues = [venue];
            const user = { ...mockUser, businessId: mockBusinessId };

            expect(() => venueRules.lastVenueCannotBeDeleted(venue, venues, user))
                .toThrow(new ConvexError({
                    message: "You cannot delete your last venue.",
                    field: "businessId",
                    code: ERROR_CODES.ACTION_NOT_ALLOWED
                }));
        });

        it('should throw error when venues array is empty', () => {
            const venue = createMockVenue();
            const venues: Doc<"venues">[] = [];
            const user = { ...mockUser, businessId: mockBusinessId };

            expect(() => venueRules.lastVenueCannotBeDeleted(venue, venues, user))
                .toThrow(new ConvexError({
                    message: "You cannot delete your last venue.",
                    field: "businessId",
                    code: ERROR_CODES.ACTION_NOT_ALLOWED
                }));
        });
    });

    describe('coordinatesNeedRecalculation', () => {
        const oldVenue = createMockVenue();

        it('should return false when address is not provided', () => {
            const newVenue = { name: "Updated Name" };

            const result = venueRules.coordinatesNeedRecalculation({
                oldVenue,
                newVenue
            });

            expect(result).toBe(false);
        });

        it('should return false when address fields are unchanged', () => {
            const newVenue = {
                address: {
                    street: "123 Test St",
                    city: "Athens",
                    zipCode: "12345",
                    country: "Greece"
                }
            };

            const result = venueRules.coordinatesNeedRecalculation({
                oldVenue,
                newVenue
            });

            expect(result).toBe(false);
        });

        it('should return true when street address changes', () => {
            const newVenue = {
                address: {
                    street: "456 New St",
                    city: "Athens",
                    zipCode: "12345",
                    country: "Greece"
                }
            };

            const result = venueRules.coordinatesNeedRecalculation({
                oldVenue,
                newVenue
            });

            expect(result).toBe(true);
        });

        it('should return true when city changes', () => {
            const newVenue = {
                address: {
                    street: "123 Test St",
                    city: "Thessaloniki",
                    zipCode: "12345",
                    country: "Greece"
                }
            };

            const result = venueRules.coordinatesNeedRecalculation({
                oldVenue,
                newVenue
            });

            expect(result).toBe(true);
        });

        it('should return true when zip code changes', () => {
            const newVenue = {
                address: {
                    street: "123 Test St",
                    city: "Athens",
                    zipCode: "54321",
                    country: "Greece"
                }
            };

            const result = venueRules.coordinatesNeedRecalculation({
                oldVenue,
                newVenue
            });

            expect(result).toBe(true);
        });

        it('should return true when country changes', () => {
            const newVenue = {
                address: {
                    street: "123 Test St",
                    city: "Athens",
                    zipCode: "12345",
                    country: "Cyprus"
                }
            };

            const result = venueRules.coordinatesNeedRecalculation({
                oldVenue,
                newVenue
            });

            expect(result).toBe(true);
        });

        it('should return true when state changes', () => {
            const oldVenueWithState = createMockVenue({
                address: {
                    street: "123 Test St",
                    city: "Athens",
                    state: "Attica",
                    zipCode: "12345",
                    country: "Greece"
                }
            });

            const newVenue = {
                address: {
                    street: "123 Test St",
                    city: "Athens",
                    state: "Central Macedonia",
                    zipCode: "12345",
                    country: "Greece"
                }
            };

            const result = venueRules.coordinatesNeedRecalculation({
                oldVenue: oldVenueWithState,
                newVenue
            });

            expect(result).toBe(true);
        });
    });
});