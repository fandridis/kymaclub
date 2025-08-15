import { describe, expect, test } from "vitest";
import { api } from "../convex/_generated/api";
import { internal } from "../convex/_generated/api";
import { createTestUser, createTestBusiness, attachUserToBusiness, initAuth, testT, createTestVenue } from "./helpers";

describe('Class Templates Integration Tests', () => {

    describe('Authentication & Authorization', () => {
        test('should reject unauthenticated access to mutations', async () => {
            const { userId } = await initAuth();

            const { createdVenueId: venueId } = await testT.withIdentity({ subject: userId }).mutation(api.mutations.venues.createVenue, {
                venue: {
                    name: 'Test Studio',
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

            await expect(
                testT.mutation(api.mutations.classTemplates.createClassTemplate, {
                    template: {
                        name: "Yoga Class",
                        duration: 60,
                        venueId,
                        capacity: 20,
                        description: 'A relaxing yoga class',
                        instructor: 'Test Instructor',
                        baseCredits: 1,
                        cancellationWindowHours: 24,
                    }
                })
            ).rejects.toThrow("User not found");
        });

        test('should allow admin access to all operations', async () => {
            const { userId } = await initAuth();
            const asUser = testT.withIdentity({ subject: userId });
            const venueId = await createTestVenue(asUser);

            const { createdTemplateId } = await asUser.mutation(api.mutations.classTemplates.createClassTemplate, {
                template: {
                    name: "Yoga Class",
                    duration: 60,
                    venueId,
                    capacity: 20,
                    description: 'A relaxing yoga class',
                    instructor: 'Test Instructor',
                    baseCredits: 1,
                    cancellationWindowHours: 24,
                }
            });

            expect(createdTemplateId).toBeDefined();
            expect(typeof createdTemplateId).toBe('string');
        });

        test('should allow regular user access', async () => {
            const userId = await testT.mutation(internal.testFunctions.createTestUser, {
                user: {
                    name: "Regular User",
                    email: "regular@example.com",
                    role: "user",
                    hasBusinessOnboarded: true,
                }
            });
            const businessId = await createTestBusiness(userId);
            await attachUserToBusiness(userId, businessId);

            const asUser = testT.withIdentity({ subject: userId });
            const venueId = await createTestVenue(asUser);

            const { createdTemplateId } = await asUser.mutation(api.mutations.classTemplates.createClassTemplate, {
                template: {
                    name: "Pilates Class",
                    duration: 45,
                    venueId,
                    capacity: 15,
                    description: 'A core strengthening class',
                    instructor: 'Test Instructor',
                    baseCredits: 1,
                    cancellationWindowHours: 24,
                }
            });

            expect(createdTemplateId).toBeDefined();
            expect(typeof createdTemplateId).toBe('string');
        });
    });

    describe('Business Isolation', () => {
        test('should only return templates for the authenticated business', async () => {
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

            const asUser1 = testT.withIdentity({ subject: user1Id as string });
            const asUser2 = testT.withIdentity({ subject: user2Id as string });

            // User 1 creates template
            const venue1Id = await createTestVenue(asUser1, "Business 1 Studio");
            await asUser1.mutation(api.mutations.classTemplates.createClassTemplate, {
                template: {
                    name: "Business 1 Yoga",
                    duration: 60,
                    venueId: venue1Id,
                    capacity: 20,
                    description: 'Business 1 class',
                    instructor: 'Instructor 1',
                    baseCredits: 1,
                    cancellationWindowHours: 24,
                }
            });

            // User 2 creates template
            const venue2Id = await createTestVenue(asUser2, "Business 2 Studio");
            await asUser2.mutation(api.mutations.classTemplates.createClassTemplate, {
                template: {
                    name: "Business 2 Pilates",
                    duration: 45,
                    venueId: venue2Id,
                    capacity: 15,
                    description: 'Business 2 class',
                    instructor: 'Instructor 2',
                    baseCredits: 1,
                    cancellationWindowHours: 24,
                }
            });

            // Verify User 1 only sees their templates
            const templates1 = await asUser1.query(api.queries.classTemplates.getClassTemplates);
            expect(templates1).toHaveLength(1);
            expect(templates1[0].name).toBe("Business 1 Yoga");

            // Verify User 2 only sees their templates
            const templates2 = await asUser2.query(api.queries.classTemplates.getClassTemplates);
            expect(templates2).toHaveLength(1);
            expect(templates2[0].name).toBe("Business 2 Pilates");
        });

        test('should not allow updating template from different business', async () => {
            // Create two separate businesses
            const user1Id = await createTestUser();
            const business1Id = await createTestBusiness(user1Id);
            await attachUserToBusiness(user1Id, business1Id);

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

            const asUser1 = testT.withIdentity({ subject: user1Id as string });
            const asUser2 = testT.withIdentity({ subject: user2Id as string });

            // User 1 creates template
            const venueId = await createTestVenue(asUser1);
            const { createdTemplateId } = await asUser1.mutation(api.mutations.classTemplates.createClassTemplate, {
                template: {
                    name: "Business 1 Template",
                    duration: 60,
                    venueId,
                    capacity: 20,
                    description: 'A class template',
                    instructor: 'Test Instructor',
                    baseCredits: 1,
                    cancellationWindowHours: 24,
                }
            });

            // User 2 tries to update User 1's template
            await expect(
                asUser2.mutation(api.mutations.classTemplates.updateClassTemplate, {
                    templateId: createdTemplateId,
                    template: {
                        name: "Hijacked Template"
                    }
                })
            ).rejects.toThrow("You are not authorized to update this template");
        });
    });

    describe('Template Creation', () => {
        test('should create template with complete data and verify audit fields', async () => {
            const { userId, businessId } = await initAuth();

            const asUser = testT.withIdentity({ subject: userId });
            const venueId = await createTestVenue(asUser);

            const templateData = {
                name: "Advanced Yoga",
                duration: 75,
                venueId,
                capacity: 25,
                description: 'An advanced yoga practice',
                instructor: 'Master Yogi',
                baseCredits: 2,
                cancellationWindowHours: 48,
                tags: ['yoga', 'advanced', 'flexibility'],
            };

            const { createdTemplateId } = await asUser.mutation(api.mutations.classTemplates.createClassTemplate, {
                template: templateData
            });

            // Verify the template was created correctly
            const template = await asUser.query(api.queries.classTemplates.getClassTemplateById, {
                templateId: createdTemplateId
            });

            expect(template).toBeDefined();
            expect(template?.name).toBe(templateData.name);
            expect(template?.duration).toBe(templateData.duration);
            expect(template?.capacity).toBe(templateData.capacity);
            expect(template?.description).toBe(templateData.description);
            expect(template?.instructor).toBe(templateData.instructor);
            expect(template?.baseCredits).toBe(templateData.baseCredits);
            expect(template?.cancellationWindowHours).toBe(templateData.cancellationWindowHours);
            expect(template?.tags).toEqual(templateData.tags);
            expect(template?.isActive).toBe(true); // Should default to active
            expect(template?.businessId).toBe(businessId);
            expect(template?.venueId).toBe(venueId);

            // Verify audit fields
            expect(template?.createdAt).toBeDefined();
            expect(template?.createdBy).toBe(userId);
            expect(template?.deleted).toBeFalsy();
        });

        test('should create template with minimal required data', async () => {
            const { userId } = await initAuth();

            const asUser = testT.withIdentity({ subject: userId });
            const venueId = await createTestVenue(asUser);

            const { createdTemplateId } = await asUser.mutation(api.mutations.classTemplates.createClassTemplate, {
                template: {
                    name: "Basic Class",
                    duration: 60,
                    venueId,
                    capacity: 10,
                    description: 'A basic class',
                    instructor: 'Basic Instructor',
                    baseCredits: 1,
                    cancellationWindowHours: 24,
                }
            });

            const template = await asUser.query(api.queries.classTemplates.getClassTemplateById, {
                templateId: createdTemplateId
            });

            expect(template).toBeDefined();
            expect(template?.name).toBe("Basic Class");
            expect(template?.isActive).toBe(true); // Should default to active
        });
    });

    describe('Template Updates', () => {
        test('should update template successfully and verify audit fields', async () => {
            const { userId } = await initAuth();

            const asUser = testT.withIdentity({ subject: userId });
            const venueId = await createTestVenue(asUser);

            // Create template
            const { createdTemplateId } = await asUser.mutation(api.mutations.classTemplates.createClassTemplate, {
                template: {
                    name: "Original Template",
                    duration: 60,
                    venueId,
                    capacity: 20,
                    description: 'Original description',
                    instructor: 'Original Instructor',
                    baseCredits: 1,
                    cancellationWindowHours: 24,
                }
            });

            // Update template
            await asUser.mutation(api.mutations.classTemplates.updateClassTemplate, {
                templateId: createdTemplateId,
                template: {
                    name: "Updated Template",
                    capacity: 30,
                    description: "Updated description"
                }
            });

            // Verify the update
            const updatedTemplate = await asUser.query(api.queries.classTemplates.getClassTemplateById, {
                templateId: createdTemplateId
            });

            expect(updatedTemplate?.name).toBe("Updated Template");
            expect(updatedTemplate?.capacity).toBe(30);
            expect(updatedTemplate?.description).toBe("Updated description");
            expect(updatedTemplate?.duration).toBe(60); // Should remain unchanged
            expect(updatedTemplate?.updatedBy).toBe(userId);
            expect(updatedTemplate?.updatedAt).toBeGreaterThanOrEqual(updatedTemplate?.createdAt || 0);
        });
    });

    describe('Soft Delete Operations', () => {
        test('should soft delete template and verify audit fields', async () => {
            const { userId } = await initAuth();

            const asUser = testT.withIdentity({ subject: userId });
            const venueId = await createTestVenue(asUser);

            // Create template
            const { createdTemplateId } = await asUser.mutation(api.mutations.classTemplates.createClassTemplate, {
                template: {
                    name: "To Be Deleted",
                    duration: 60,
                    venueId,
                    capacity: 20,
                    description: 'A template to be deleted',
                    instructor: 'Test Instructor',
                    baseCredits: 1,
                    cancellationWindowHours: 24,
                }
            });

            // Soft delete template
            await asUser.mutation(api.mutations.classTemplates.deleteClassTemplate, {
                templateId: createdTemplateId
            });

            // Verify soft deletion (should return null from regular queries)
            const deletedTemplate = await asUser.query(api.queries.classTemplates.getClassTemplateById, {
                templateId: createdTemplateId
            });
            expect(deletedTemplate).toBeNull();
        });
    });

    describe('Query Operations', () => {
        test('should handle getById with valid and invalid IDs', async () => {
            const { userId } = await initAuth();

            const asUser = testT.withIdentity({ subject: userId });
            const venueId = await createTestVenue(asUser);

            // Create template
            const { createdTemplateId } = await asUser.mutation(api.mutations.classTemplates.createClassTemplate, {
                template: {
                    name: "Valid Template",
                    duration: 60,
                    venueId,
                    capacity: 20,
                    description: 'A valid template',
                    instructor: 'Test Instructor',
                    baseCredits: 1,
                    cancellationWindowHours: 24,
                }
            });

            // Query with valid ID
            const validTemplate = await asUser.query(api.queries.classTemplates.getClassTemplateById, {
                templateId: createdTemplateId
            });
            expect(validTemplate).toBeDefined();
            expect(validTemplate?.name).toBe("Valid Template");

        });
    });
});