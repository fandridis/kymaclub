import { describe, it, expect } from 'vitest';
import { initAuth, testT } from "../integrationTests/helpers";
import { api, internal } from "../convex/_generated/api";

describe('Profile Image Moderation', () => {
    it('should hide unapproved images from queries', async () => {
        const { userId } = await initAuth();
        const asUser = testT.withIdentity({ subject: userId });

        // Create a test storage file
        const storageId = await asUser.action(internal.testFunctions.createTestStorageFile, {
            content: "test image content",
            contentType: "image/jpeg"
        });

        // Set user with rejected image
        await asUser.mutation(api.mutations.users.updateUserForModeration, {
            userId,
            updateData: {
                consumerProfileImageStorageId: storageId,
                profileImageModerationStatus: "auto_rejected",
                profileImageModerationReason: "Inappropriate content detected",
            }
        });

        // Query should return null for rejected image
        const imageUrl = await asUser.query(api.queries.uploads.getUserProfileImageUrl, { userId });
        expect(imageUrl).toBeNull();
    });

    it('should show approved images in queries', async () => {
        const { userId } = await initAuth();
        const asUser = testT.withIdentity({ subject: userId });

        // Create a test storage file
        const storageId = await asUser.action(internal.testFunctions.createTestStorageFile, {
            content: "test image content",
            contentType: "image/jpeg"
        });

        // Set user with approved image
        await asUser.mutation(api.mutations.users.updateUserForModeration, {
            userId,
            updateData: {
                consumerProfileImageStorageId: storageId,
                profileImageModerationStatus: "auto_approved",
            }
        });

        // Query should return URL for approved image
        const imageUrl = await asUser.query(api.queries.uploads.getUserProfileImageUrl, { userId });
        expect(imageUrl).toBeTruthy();
        expect(typeof imageUrl).toBe('string');
    });

    it('should return moderation status for authenticated user', async () => {
        const { userId } = await initAuth();
        const asUser = testT.withIdentity({ subject: userId });

        // Set user with moderation status
        await asUser.mutation(api.mutations.users.updateUserForModeration, {
            userId,
            updateData: {
                profileImageModerationStatus: "flagged",
                profileImageModerationReason: "Needs manual review",
                profileImageModeratedAt: Date.now(),
            }
        });

        // Query should return moderation status
        const status = await asUser.query(api.queries.uploads.getUserProfileImageModerationStatus, {});
        expect(status).toEqual({
            status: "flagged",
            reason: "Needs manual review",
            moderatedAt: expect.any(Number),
        });
    });

    it('should return null for user without moderation status', async () => {
        const { userId } = await initAuth();
        const asUser = testT.withIdentity({ subject: userId });

        // Query should return null
        const status = await asUser.query(api.queries.uploads.getUserProfileImageModerationStatus, {});
        expect(status).toBeNull();
    });
});