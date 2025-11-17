import { describe, expect, test } from "vitest";
import { api } from "../convex/_generated/api";
import { initAuth, testT } from "./helpers";

describe('Class Instances Integration Tests', () => {

    describe('Authentication & Authorization', () => {
        test('should reject unauthenticated access to queries', async () => {
            const startDate = Date.now();
            const endDate = startDate + 7 * 24 * 60 * 60 * 1000;

            await expect(
                testT.query(api.queries.classInstances.getClassInstances, { startDate, endDate })
            ).rejects.toThrow("User not found");
        });

        test('should allow authenticated access', async () => {
            const { userId } = await initAuth();

            const asUser = testT.withIdentity({ subject: userId });
            const startDate = Date.now();
            const endDate = startDate + 7 * 24 * 60 * 60 * 1000;

            const instances = await asUser.query(api.queries.classInstances.getClassInstances, {
                startDate,
                endDate
            });

            expect(Array.isArray(instances)).toBe(true);
        });
    });

    describe('Instance Creation & Management', () => {
        test('should create class instance successfully', async () => {
            const { userId } = await initAuth();

            const asUser = testT.withIdentity({ subject: userId });
            const { createdVenueId: venueId } = await asUser.mutation(api.mutations.venues.createVenue, {
                venue: {
                    name: 'Test Studio',
                    email: 'venue@example.com',
                    address: {
                        street: '123 Main St',
                        city: 'athens',
                        state: 'CA',
                        zipCode: '12345',
                        country: 'USA'
                    },
                    primaryCategory: 'wellness_center'
                }
            });
            const { createdTemplateId: templateId } = await asUser.mutation(api.mutations.classTemplates.createClassTemplate, {
                template: {
                    name: 'Yoga Class',
                    duration: 60,
                    venueId,
                    capacity: 20,
                    description: 'A relaxing yoga class',
                    instructor: 'Test Instructor',
                    price: 100, // 1 euro in cents
                    cancellationWindowHours: 24,
                }
            });

            const result = await asUser.mutation(api.mutations.classInstances.createClassInstance, {
                templateId: templateId,
                startTime: Date.now() + 86400000 // Tomorrow
            });

            expect(result.createdInstanceId).toBeDefined();
            expect(typeof result.createdInstanceId).toBe('string');
        });

        test('should update class instance', async () => {
            const { userId } = await initAuth();

            const asUser = testT.withIdentity({ subject: userId });
            const { createdVenueId: venueId } = await asUser.mutation(api.mutations.venues.createVenue, {
                venue: {
                    name: 'Test Studio',
                    email: 'venue@example.com',
                    address: {
                        street: '123 Main St',
                        city: 'athens',
                        state: 'CA',
                        zipCode: '12345',
                        country: 'USA'
                    },
                    primaryCategory: 'wellness_center'
                }
            });
            const { createdTemplateId: templateId } = await asUser.mutation(api.mutations.classTemplates.createClassTemplate, {
                template: {
                    name: 'Yoga Class',
                    duration: 60,
                    venueId,
                    capacity: 20,
                    description: 'A relaxing yoga class',
                    instructor: 'Test Instructor',
                    price: 100, // 1 euro in cents
                    cancellationWindowHours: 24,
                }
            });

            const result = await asUser.mutation(api.mutations.classInstances.createClassInstance, {
                templateId: templateId,
                startTime: Date.now() + 86400000
            });

            // Update the instance
            await asUser.mutation(api.mutations.classInstances.updateSingleInstance, {
                instanceId: result.createdInstanceId,
                instance: {
                    capacity: 15
                }
            });

            // Verify the update
            const instance = await asUser.query(api.queries.classInstances.getClassInstanceById, {
                instanceId: result.createdInstanceId
            });

            expect(instance?.capacity).toBe(15);
        });

        test('should delete class instance', async () => {
            const { userId } = await initAuth();

            const asUser = testT.withIdentity({ subject: userId });
            const { createdVenueId: venueId } = await asUser.mutation(api.mutations.venues.createVenue, {
                venue: {
                    name: 'Test Studio',
                    email: 'venue@example.com',
                    address: {
                        street: '123 Main St',
                        city: 'athens',
                        state: 'CA',
                        zipCode: '12345',
                        country: 'USA'
                    },
                    primaryCategory: 'wellness_center'
                }
            });
            const { createdTemplateId: templateId } = await asUser.mutation(api.mutations.classTemplates.createClassTemplate, {
                template: {
                    name: 'Yoga Class',
                    duration: 60,
                    venueId,
                    capacity: 20,
                    description: 'A relaxing yoga class',
                    instructor: 'Test Instructor',
                    price: 100, // 1 euro in cents
                    cancellationWindowHours: 24,
                }
            });

            const result = await asUser.mutation(api.mutations.classInstances.createClassInstance, {
                templateId: templateId,
                startTime: Date.now() + 86400000
            });

            // Delete the instance
            await asUser.mutation(api.mutations.classInstances.deleteSingleInstance, {
                instanceId: result.createdInstanceId
            });

            // Verify deletion (should throw an error or not be found in active instances)
            await expect(
                asUser.query(api.queries.classInstances.getClassInstanceById, {
                    instanceId: result.createdInstanceId
                })
            ).rejects.toThrow("Instance not found");
        });
    });

    describe('Query Operations', () => {
        test('should return empty array when no instances exist', async () => {
            const { userId } = await initAuth();

            const asUser = testT.withIdentity({ subject: userId });
            const startDate = Date.now();
            const endDate = startDate + 7 * 24 * 60 * 60 * 1000;

            const instances = await asUser.query(api.queries.classInstances.getClassInstances, {
                startDate,
                endDate
            });

            expect(instances).toEqual([]);
        });

        test('should filter instances by date range', async () => {
            const { userId } = await initAuth();

            const asUser = testT.withIdentity({ subject: userId });
            const { createdVenueId: venueId } = await asUser.mutation(api.mutations.venues.createVenue, {
                venue: {
                    name: 'Test Studio',
                    email: 'venue@example.com',
                    address: {
                        street: '123 Main St',
                        city: 'athens',
                        state: 'CA',
                        zipCode: '12345',
                        country: 'USA'
                    },
                    primaryCategory: 'wellness_center'
                }
            });
            const { createdTemplateId: templateId } = await asUser.mutation(api.mutations.classTemplates.createClassTemplate, {
                template: {
                    name: 'Yoga Class',
                    duration: 60,
                    venueId,
                    capacity: 20,
                    description: 'A relaxing yoga class',
                    instructor: 'Test Instructor',
                    price: 100, // 1 euro in cents
                    cancellationWindowHours: 24,
                }
            });

            const now = Date.now();
            const oneDayLater = now + 86400000;
            const threeDaysLater = now + 3 * 86400000;

            // Create instances at different times
            await asUser.mutation(api.mutations.classInstances.createClassInstance, {
                templateId: templateId,
                startTime: oneDayLater
            });

            await asUser.mutation(api.mutations.classInstances.createClassInstance, {
                templateId: templateId,
                startTime: threeDaysLater
            });

            // Query for instances in a 2-day window
            const instances = await asUser.query(api.queries.classInstances.getClassInstances, {
                startDate: now,
                endDate: now + 2 * 86400000
            });

            expect(instances).toHaveLength(1);
        });
    });
});