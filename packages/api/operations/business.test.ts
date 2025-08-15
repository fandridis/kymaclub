import { describe, it, expect } from "vitest";
import { ConvexError } from "convex/values";
import { createTestUser } from '../convex/testResources';
import { createDefaultBusiness, prepareCreateBusiness } from "./business";
import type { CreateBusinessWithVenueArgs } from "../convex/mutations/core";

describe('Business Operations', () => {
    describe('prepareCreateBusiness', () => {
        it('should prepare valid business data', () => {
            const args: CreateBusinessWithVenueArgs = {
                business: {
                    name: 'Kyma Fitness',
                    email: 'contact@kymafitness.com',
                    phone: '+30 123 456 7890',
                    website: 'https://kymafitness.com',
                    description: 'Premium fitness studio',
                    address: {
                        street: '123 Main St',
                        city: 'Athens',
                        state: 'Greece',
                        zipCode: '10001',
                        country: 'Greece',
                    }
                },
                venue: {
                    name: 'Main Studio',
                    email: 'studio@kymafitness.com',
                    primaryCategory: 'yoga_studio',
                    address: {
                        street: '123 Main St',
                        city: 'Athens',
                        state: 'Greece',
                        zipCode: '10001',
                        country: 'Greece',
                    }
                }
            };

            const result = prepareCreateBusiness(args);
            
            expect(result.business.name).toBe('Kyma Fitness');
            expect(result.business.email).toBe('contact@kymafitness.com');
            expect(result.business.phone).toBe('+30 123 456 7890');
            expect(result.business.website).toBe('https://kymafitness.com');
            expect(result.business.description).toBe('Premium fitness studio');
            expect(result.venue.name).toBe('Main Studio');
        });

        it('should throw error for invalid email', () => {
            const args: CreateBusinessWithVenueArgs = {
                business: {
                    name: 'Kyma Fitness',
                    email: 'invalid-email',
                    address: {
                        street: '123 Main St',
                        city: 'Athens',
                        state: 'Greece',
                        zipCode: '10001',
                        country: 'Greece',
                    }
                },
                venue: {
                    name: 'Main Studio',
                    email: 'studio@kymafitness.com',
                    primaryCategory: 'yoga_studio',
                    address: {
                        street: '123 Main St',
                        city: 'Athens',
                        state: 'Greece',
                        zipCode: '10001',
                        country: 'Greece',
                    }
                }
            };

            expect(() => prepareCreateBusiness(args)).toThrow(ConvexError);
        });

        it('should throw error for empty business name', () => {
            const args: CreateBusinessWithVenueArgs = {
                business: {
                    name: '   ',
                    email: 'contact@kymafitness.com',
                    address: {
                        street: '123 Main St',
                        city: 'Athens',
                        state: 'Greece',
                        zipCode: '10001',
                        country: 'Greece',
                    }
                },
                venue: {
                    name: 'Main Studio',
                    email: 'studio@kymafitness.com',
                    primaryCategory: 'yoga_studio',
                    address: {
                        street: '123 Main St',
                        city: 'Athens',
                        state: 'Greece',
                        zipCode: '10001',
                        country: 'Greece',
                    }
                }
            };

            expect(() => prepareCreateBusiness(args)).toThrow(ConvexError);
        });
    });

    describe('createDefaultBusiness', () => {
        it('should create default business with correct defaults', () => {
            const userId = createTestUser()._id;
            const result = createDefaultBusiness(userId);
            
            expect(result.timezone).toBe('Europe/Athens');
            expect(result.currency).toBe('EUR');
            expect(result.feeStructure.payoutFrequency).toBe('monthly');
            expect(result.feeStructure.minimumPayout).toBe(50);
            expect(result.isActive).toBe(true);
            expect(result.onboardingCompleted).toBe(false);
            expect(result.createdBy).toBe(userId);
            expect(typeof result.createdAt).toBe('number');
        });
    });
});