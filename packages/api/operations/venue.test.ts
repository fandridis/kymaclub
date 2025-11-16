import { describe, it, expect } from "vitest";
import { ConvexError } from "convex/values";
import { venueOperations } from "./venue";
import { createTestUser, createTestBusiness } from "../convex/testResources";
import type { Doc } from "../convex/_generated/dataModel";
import type { CreateVenueArgs, UpdateVenueArgs } from "../convex/mutations/venues";

describe('Venue Operations', () => {
    const mockBusinessId = createTestBusiness()._id;
    const mockUserId = createTestUser()._id;

    describe('prepareCreateVenue', () => {
        const validVenueArgs: CreateVenueArgs = {
            venue: {
                name: 'Kyma Yoga Studio',
                email: 'contact@kymayoga.com',
                phone: '+30 123 456 7890',
                website: 'https://kymayoga.com',
                description: 'Premium yoga studio in Athens',
                capacity: 25,
                equipment: ['yoga mats', 'blocks', 'straps'],
                amenities: ['changing room', 'showers'],
                services: ['hot yoga', 'meditation'],
                primaryCategory: 'yoga_studio',
                address: {
                    street: '123 Yoga Street',
                    city: 'Athens',
                    state: 'Attica',
                    zipCode: '10001',
                    country: 'Greece'
                },
                socialMedia: {
                    instagram: '@kymayoga',
                    facebook: 'kymayoga'
                }
            }
        };

        it('should prepare valid venue data', () => {
            const result = venueOperations.prepareCreateVenue(validVenueArgs);
            
            expect(result.name).toBe('Kyma Yoga Studio');
            expect(result.email).toBe('contact@kymayoga.com');
            expect(result.phone).toBe('+30 123 456 7890');
            expect(result.capacity).toBe(25);
            expect(result.address.street).toBe('123 Yoga Street');
            expect(result.address.city).toBe('Athens');
            expect(result.address.state).toBe('Attica');
            expect(result.equipment).toEqual(['yoga mats', 'blocks', 'straps']);
            expect(result.citySlug).toBe('athens');
        });

        it('should trim whitespace from name', () => {
            const args = {
                ...validVenueArgs,
                venue: {
                    ...validVenueArgs.venue,
                    name: '  Kyma Studio  '
                }
            };
            
            const result = venueOperations.prepareCreateVenue(args);
            expect(result.name).toBe('Kyma Studio');
        });

        it('should throw error for invalid email', () => {
            const args = {
                ...validVenueArgs,
                venue: {
                    ...validVenueArgs.venue,
                    email: 'invalid-email'
                }
            };
            
            expect(() => venueOperations.prepareCreateVenue(args))
                .toThrow(ConvexError);
        });

        it('should throw error for empty name', () => {
            const args = {
                ...validVenueArgs,
                venue: {
                    ...validVenueArgs.venue,
                    name: ''
                }
            };
            
            expect(() => venueOperations.prepareCreateVenue(args))
                .toThrow(ConvexError);
        });

        it('should throw error for invalid capacity', () => {
            const args = {
                ...validVenueArgs,
                venue: {
                    ...validVenueArgs.venue,
                    capacity: -5
                }
            };
            
            expect(() => venueOperations.prepareCreateVenue(args))
                .toThrow(ConvexError);
        });

        it('should handle missing optional fields', () => {
            const minimalArgs: CreateVenueArgs = {
                venue: {
                    name: 'Simple Studio',
                    email: 'simple@studio.com',
                    primaryCategory: 'fitness_center',
                    address: {
                        street: '123 Main St',
                        city: 'Athens',
                        zipCode: '10001',
                        country: 'Greece'
                    }
                }
            };
            
            const result = venueOperations.prepareCreateVenue(minimalArgs);
            
            expect(result.name).toBe('Simple Studio');
            expect(result.email).toBe('simple@studio.com');
            expect(result.description).toBeUndefined();
            expect(result.capacity).toBeUndefined();
            expect(result.equipment).toBeUndefined();
        });

        it('should handle address without state', () => {
            const args = {
                ...validVenueArgs,
                venue: {
                    ...validVenueArgs.venue,
                    address: {
                        street: '123 Main St',
                        city: 'Athens',
                        zipCode: '10001',
                        country: 'Greece'
                    }
                }
            };
            
            const result = venueOperations.prepareCreateVenue(args);
            
            expect(result.address.state).toBeUndefined();
            expect(result.address.street).toBe('123 Main St');
        });

        it('should validate equipment array', () => {
            const args = {
                ...validVenueArgs,
                venue: {
                    ...validVenueArgs.venue,
                    equipment: ['mats', '', 'blocks'] // Empty string should cause error
                }
            };
            
            expect(() => venueOperations.prepareCreateVenue(args))
                .toThrow(ConvexError);
        });
    });

    describe('createDefaultVenue', () => {
        it('should create default venue with correct properties', () => {
            const result = venueOperations.createDefaultVenue(mockBusinessId, mockUserId);
            
            expect(result.businessId).toBe(mockBusinessId);
            expect(result.isActive).toBe(true);
            expect(result.createdBy).toBe(mockUserId);
            expect(typeof result.createdAt).toBe('number');
            expect(result.createdAt).toBeGreaterThan(0);
        });

        it('should create venue with current timestamp', () => {
            const before = Date.now();
            const result = venueOperations.createDefaultVenue(mockBusinessId, mockUserId);
            const after = Date.now();
            
            expect(result.createdAt).toBeGreaterThanOrEqual(before);
            expect(result.createdAt).toBeLessThanOrEqual(after);
        });
    });

    describe('prepareUpdateVenue', () => {
        const existingVenue: Doc<"venues"> = {
            _id: 'venue123' as any,
            _creationTime: Date.now(),
            businessId: mockBusinessId,
            name: 'Original Studio',
            email: 'original@studio.com',
            description: 'Original description',
            capacity: 20,
            equipment: ['mats'],
            address: {
                street: '123 Old Street',
                city: 'Athens',
                area: 'Kallithea',
                zipCode: '10001',
                country: 'Greece'
            },
            citySlug: 'athens',
            coordinates: { latitude: 37.9838, longitude: 23.7275 },
            primaryCategory: 'yoga_studio' as any,
            socialMediaLinks: {},
            amenities: [],
            services: [],
            imageStorageIds: [],
            createdAt: Date.now(),
            createdBy: mockUserId,
            updatedAt: Date.now(),
            updatedBy: mockUserId
        };

        it('should update only provided fields', () => {
            const updates: UpdateVenueArgs = {
                venue: {
                    name: 'Updated Studio',
                    capacity: 30
                }
            };
            
            const result = venueOperations.prepareUpdateVenue(updates, existingVenue);
            
            expect(result.name).toBe('Updated Studio');
            expect(result.capacity).toBe(30);
            expect(result.description).toBeUndefined(); // Not included in update
        });

        it('should update address fields selectively', () => {
            const updates: UpdateVenueArgs = {
                venue: {
                    address: {
                        street: '456 New Street',
                        city: 'Athens',
                        area: 'Nea Smyrni'
                    }
                }
            };
            
            const result = venueOperations.prepareUpdateVenue(updates, existingVenue);
            
            expect(result.address.street).toBe('456 New Street');
            expect(result.address.city).toBe('Athens');
            expect(result.address.area).toBe('Nea Smyrni');
            expect(result.address.zipCode).toBe('10001'); // Preserved from existing
            expect(result.address.country).toBe('Greece'); // Preserved from existing
            expect(result.citySlug).toBe('athens');
        });

        it('should validate updated fields', () => {
            const updates: UpdateVenueArgs = {
                venue: {
                    name: '', // Invalid empty name
                    capacity: 25
                }
            };
            
            expect(() => venueOperations.prepareUpdateVenue(updates, existingVenue))
                .toThrow(ConvexError);
        });

        it('should validate updated address fields', () => {
            const updates: UpdateVenueArgs = {
                venue: {
                    address: {
                        street: '', // Invalid empty street
                        city: 'Athens'
                    }
                }
            };
            
            expect(() => venueOperations.prepareUpdateVenue(updates, existingVenue))
                .toThrow(ConvexError);
        });

        it('should handle coordinates update', () => {
            const updates: UpdateVenueArgs = {
                venue: {
                    address: {
                        latitude: 40.7128,
                        longitude: -74.0060
                    }
                }
            };
            
            const result = venueOperations.prepareUpdateVenue(updates, existingVenue);
            
            expect(result.address.latitude).toBe(40.7128);
            expect(result.address.longitude).toBe(-74.0060);
        });

        it('should reject invalid coordinates', () => {
            const updates: UpdateVenueArgs = {
                venue: {
                    address: {
                        latitude: 95, // Invalid latitude > 90
                        longitude: 23.7275
                    }
                }
            };
            
            expect(() => venueOperations.prepareUpdateVenue(updates, existingVenue))
                .toThrow(ConvexError);
        });

        it('should handle equipment update', () => {
            const updates: UpdateVenueArgs = {
                venue: {
                    equipment: ['mats', 'blocks', 'straps']
                }
            };
            
            const result = venueOperations.prepareUpdateVenue(updates, existingVenue);
            
            expect(result.equipment).toEqual(['mats', 'blocks', 'straps']);
        });

        it('should handle empty update', () => {
            const updates: UpdateVenueArgs = {
                venue: {}
            };
            
            const result = venueOperations.prepareUpdateVenue(updates, existingVenue);
            
            // Should preserve existing address
            expect(result.address.street).toBe('123 Old Street');
            expect(result.address.city).toBe('Athens');
            expect(result.name).toBeUndefined(); // Not in update
        });

        it('should handle optional fields update', () => {
            const updates: UpdateVenueArgs = {
                venue: {
                    amenities: ['wifi', 'parking'],
                    services: ['personal training'],
                    socialMedia: {
                        instagram: '@newstudio'
                    }
                }
            };
            
            const result = venueOperations.prepareUpdateVenue(updates, existingVenue);
            
            expect(result.amenities).toEqual(['wifi', 'parking']);
            expect(result.services).toEqual(['personal training']);
            expect(result.socialMedia).toEqual({ instagram: '@newstudio' });
        });
    });
});