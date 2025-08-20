import { useQuery, useMutation } from "convex/react";
import { api } from "@repo/api/convex/_generated/api";

export function useUserNotificationSettings() {
    const settings = useQuery(api.queries.notifications.getUserNotificationSettings);
    const updateSettings = useMutation(api.mutations.notifications.upsertUserNotificationSettings);

    return {
        settings,
        loading: settings === undefined,
        updateSettings,
    };
}