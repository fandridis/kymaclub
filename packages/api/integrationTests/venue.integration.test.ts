import { describe, expect, test } from "vitest";
import { api } from "../convex/_generated/api";
import { internal } from "../convex/_generated/api";
import { attachUserToBusiness, createTestBusiness, createTestUser, initAuth, testT } from "./helpers";

describe('Venues Integration Tests', () => {

    describe('Authentication & Authorization', () => {
        test('should reject unauthenticated venue creation', async () => {
            await expect(
                testT.mutation(api.mutations.venues.createVenue, {
                    venue: {
                        name: "Test Venue",
                        email: 'venue@example.com',
                        address: {
                            street: '123 Main St',
                            city: 'Anytown',
                            state: 'CA',
                            zipCode: '12345',
                            country: 'USA'
                        },
                        primaryCategory: 'wellness_center'
                    }
                })
            ).rejects.toThrow("User not found");
        });

        test('should allow authenticated venue operations', async () => {
            const { userId, businessId } = await initAuth();

            const asUser = testT.withIdentity({ subject: userId });
            const { createdVenueId } = await asUser.mutation(api.mutations.venues.createVenue, {
                venue: {
                    name: "Test Venue",
                    email: 'venue@example.com',
                    address: {
                        street: '123 Main St',
                        city: 'Anytown',
                        state: 'CA',
                        zipCode: '12345',
                        country: 'USA'
                    },
                    primaryCategory: 'wellness_center'
                }
            });

            expect(createdVenueId).toBeDefined();
            expect(typeof createdVenueId).toBe('string');
        });
    });

    describe('Venue CRUD Operations', () => {
        test('should create venue with correct data', async () => {
            const { userId, businessId } = await initAuth();

            const asUser = testT.withIdentity({ subject: userId });
            const venueData = {
                name: "Kyma Yoga Studio",
                email: 'kyma@example.com',
                description: 'A peaceful yoga studio',
                capacity: 30,
                equipment: ['mats', 'blocks'],
                address: {
                    street: '123 Yoga Street',
                    city: 'Athens',
                    state: 'Attica',
                    zipCode: '10001',
                    country: 'Greece'
                },
                primaryCategory: 'yoga_studio' as const,
                phone: '+30 123 456 7890',
                website: 'https://kyma.yoga'
            };

            const { createdVenueId } = await asUser.mutation(api.mutations.venues.createVenue, {
                venue: venueData
            });

            // Verify the venue was created correctly
            const venue = await asUser.query(api.queries.venues.getVenueById, { venueId: createdVenueId });

            expect(venue).toBeDefined();
            expect(venue?.name).toBe(venueData.name);
            expect(venue?.email).toBe(venueData.email);
            expect(venue?.capacity).toBe(venueData.capacity);
            expect(venue?.primaryCategory).toBe(venueData.primaryCategory);
            expect(venue?.businessId).toBe(businessId);
        });

        test('should update venue successfully', async () => {
            const { userId, businessId } = await initAuth();

            const asUser = testT.withIdentity({ subject: userId });
            // Create venue
            const { createdVenueId } = await asUser.mutation(api.mutations.venues.createVenue, {
                venue: {
                    name: "Original Name",
                    email: 'original@example.com',
                    address: {
                        street: '123 Main St',
                        city: 'Anytown',
                        state: 'CA',
                        zipCode: '12345',
                        country: 'USA'
                    },
                    primaryCategory: 'wellness_center'
                }
            });

            // Update venue
            await asUser.mutation(api.mutations.venues.updateVenue, {
                venueId: createdVenueId,
                venue: {
                    name: "Updated Name",
                    capacity: 25,
                    description: "Updated description"
                }
            });

            // Verify the update
            const updatedVenue = await asUser.query(api.queries.venues.getVenueById, { venueId: createdVenueId });

            expect(updatedVenue?.name).toBe("Updated Name");
            expect(updatedVenue?.capacity).toBe(25);
            expect(updatedVenue?.description).toBe("Updated description");
            expect(updatedVenue?.email).toBe('original@example.com'); // Should remain unchanged
        });

        test('should delete venue successfully', async () => {
            const { userId, businessId } = await initAuth();

            const asUser = testT.withIdentity({ subject: userId });
            // Create first venue
            const { createdVenueId: venue1Id } = await asUser.mutation(api.mutations.venues.createVenue, {
                venue: {
                    name: "Venue 1",
                    email: 'venue1@example.com',
                    address: {
                        street: '123 Main St',
                        city: 'Anytown',
                        state: 'CA',
                        zipCode: '12345',
                        country: 'USA'
                    },
                    primaryCategory: 'wellness_center'
                }
            });

            // Create second venue (needed because you can't delete the last venue)
            const { createdVenueId: venue2Id } = await asUser.mutation(api.mutations.venues.createVenue, {
                venue: {
                    name: "Venue 2",
                    email: 'venue2@example.com',
                    address: {
                        street: '456 Second St',
                        city: 'Anytown',
                        state: 'CA',
                        zipCode: '12345',
                        country: 'USA'
                    },
                    primaryCategory: 'fitness_center'
                }
            });

            // Delete the first venue
            await asUser.mutation(api.mutations.venues.deleteVenue, {
                venueId: venue1Id
            });

            // Verify deletion (soft delete - should return deleted entity)
            const deletedVenue = await asUser.query(api.queries.venues.getVenueById, { venueId: venue1Id });
            expect(deletedVenue?.deleted).toBe(true);

            // Verify second venue still exists
            const remainingVenue = await asUser.query(api.queries.venues.getVenueById, { venueId: venue2Id });
            expect(remainingVenue).toBeDefined();
        });
    });

    describe('Business Isolation', () => {
        test('should only return venues for authenticated business', async () => {
            // Create first user and business
            const user1Id = await createTestUser();
            const business1Id = await createTestBusiness(user1Id);
            await attachUserToBusiness(user1Id, business1Id);

            // Create second user and business
            const user2Id = await testT.mutation(internal.testFunctions.createTestUser, {
                user: {
                    name: "User 2",
                    email: "user2@example.com",
                    role: "admin",
                    hasBusinessOnboarded: true,
                }
            });
            const business2Id = await createTestBusiness(user2Id);
            await attachUserToBusiness(user2Id, business2Id);

            // User 1 creates a venue
            const asUser1 = testT.withIdentity({ subject: user1Id as string });
            await asUser1.mutation(api.mutations.venues.createVenue, {
                venue: {
                    name: "Business 1 Venue",
                    email: 'venue1@example.com',
                    address: {
                        street: '123 Main St',
                        city: 'Anytown',
                        state: 'CA',
                        zipCode: '12345',
                        country: 'USA'
                    },
                    primaryCategory: 'wellness_center'
                }
            });

            // User 2 creates a venue
            const asUser2 = testT.withIdentity({ subject: user2Id as string });
            await asUser2.mutation(api.mutations.venues.createVenue, {
                venue: {
                    name: "Business 2 Venue",
                    email: 'venue2@example.com',
                    address: {
                        street: '456 Second St',
                        city: 'Anytown',
                        state: 'CA',
                        zipCode: '12345',
                        country: 'USA'
                    },
                    primaryCategory: 'fitness_center'
                }
            });

            // Verify User 1 only sees their venue
            const venues1 = await asUser1.query(api.queries.venues.getVenues);
            expect(venues1).toHaveLength(1);
            expect(venues1[0].name).toBe("Business 1 Venue");

            // Verify User 2 only sees their venue
            const venues2 = await asUser2.query(api.queries.venues.getVenues);
            expect(venues2).toHaveLength(1);
            expect(venues2[0].name).toBe("Business 2 Venue");
        });
    });
});