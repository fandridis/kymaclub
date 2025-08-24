import { useMutation } from "convex/react";
import { useQuery } from "convex-helpers/react/cache";
import { api } from "@repo/api/convex/_generated/api";

export function useUserNotificationSettings() {
    const settings = useQuery(api.queries.notifications.getUserNotificationSettings);
    const updateSettings = useMutation(api.mutations.notifications.upsertUserNotificationSettings);

    console.log('🔥🔥🔥 SETTINGS at hook: ', settings);

    return {
        settings,
        loading: settings === undefined,
        updateSettings,
    };
}