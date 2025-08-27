import { describe, expect, test } from "vitest";
import { api } from "../convex/_generated/api";
import { internal } from "../convex/_generated/api";
import { initAuth, testT } from "./helpers";

describe('Uploads Integration Tests', () => {


    describe('Authentication', () => {
        test('generateUploadUrl requires auth', async () => {
            await expect(
                testT.mutation(api.mutations.uploads.generateUploadUrl)
            ).rejects.toThrow("User not found");
        });

        // Note: addVenueImage auth is tested implicitly in authenticated tests below
    });

    describe('Upload URL Generation', () => {
        test('returns a URL string when authenticated', async () => {
            const { userId } = await initAuth();

            const asUser = testT.withIdentity({ subject: userId });
            const result = await asUser.mutation(api.mutations.uploads.generateUploadUrl);

            expect(typeof result.url).toBe('string');
            expect(result.url).toMatch(/^https?:\/\//);
        });
    });

    describe('Venue Images', () => {
        test('add and remove venue image updates imageStorageIds', async () => {
            const { userId } = await initAuth();

            const asUser = testT.withIdentity({ subject: userId });
            const { createdVenueId: venueId } = await asUser.mutation(api.mutations.venues.createVenue, {
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

            // Create a proper storage ID
            const storageId = await asUser.action(internal.testFunctions.createTestStorageFile, {
                content: "test image content",
                contentType: "image/jpeg"
            });

            // Add image
            await asUser.mutation(api.mutations.uploads.addVenueImage, {
                venueId,
                storageId
            });

            // Check venue has the image
            const venueWithImage = await asUser.query(api.queries.venues.getVenueById, { venueId });
            expect(venueWithImage?.imageStorageIds).toContain(storageId);

            // Remove image
            await asUser.mutation(api.mutations.uploads.removeVenueImage, {
                venueId,
                storageId
            });

            // Check venue no longer has the image
            const venueWithoutImage = await asUser.query(api.queries.venues.getVenueById, { venueId });
            expect(venueWithoutImage?.imageStorageIds).not.toContain(storageId);
        });
    });

    describe('Template Images', () => {
        test('add and remove template image', async () => {
            const { userId } = await initAuth();

            const asUser = testT.withIdentity({ subject: userId });
            const { createdVenueId: venueId } = await asUser.mutation(api.mutations.venues.createVenue, {
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
            const { createdTemplateId: templateId } = await asUser.mutation(api.mutations.classTemplates.createClassTemplate, {
                template: {
                    name: "Test Class",
                    duration: 60,
                    venueId,
                    capacity: 20,
                    description: 'A test class',
                    instructor: 'Test Instructor',
                    price: 100, // 1 euro in cents
                    cancellationWindowHours: 24,
                }
            });

            // Create a proper storage ID
            const storageId = await asUser.action(internal.testFunctions.createTestStorageFile, {
                content: "test image content",
                contentType: "image/jpeg"
            });

            // Add image
            await asUser.mutation(api.mutations.uploads.addTemplateImage, {
                templateId,
                storageId
            });

            // Check template has the image
            const templateWithImage = await asUser.query(api.queries.classTemplates.getClassTemplateById, { templateId });
            expect(templateWithImage?.imageStorageIds).toContain(storageId);

            // Remove image
            await asUser.mutation(api.mutations.uploads.removeTemplateImage, {
                templateId,
                storageId
            });

            // Check template no longer has the image
            const templateWithoutImage = await asUser.query(api.queries.classTemplates.getClassTemplateById, { templateId });
            expect(templateWithoutImage?.imageStorageIds).not.toContain(storageId);
        });
    });
});