import { useQuery } from 'convex/react';
import { api } from '@repo/api/convex/_generated/api';

export const useProfileImageModeration = () => {
    const moderationStatus = useQuery(
        api.queries.uploads.getUserProfileImageModerationStatus
    );

    const isPending = moderationStatus?.status === "pending";
    const isRejected =
        moderationStatus?.status === "auto_rejected" ||
        moderationStatus?.status === "manual_rejected";
    const isFlagged = moderationStatus?.status === "flagged";

    let statusMessage: string | null = null;

    if (isPending) {
        statusMessage = "Your profile image is being reviewed...";
    } else if (isRejected) {
        statusMessage = moderationStatus?.reason ||
            "Your profile image was not approved. Please upload an appropriate image.";
    } else if (isFlagged) {
        statusMessage = "Your profile image is under review by our team.";
    }

    return {
        moderationStatus,
        isPending,
        isRejected,
        isFlagged,
        statusMessage,
        isLoading: moderationStatus === undefined,
    };
};
