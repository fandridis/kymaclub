import { useQuery } from "convex-helpers/react/cache/hooks";
import { api } from "@repo/api/convex/_generated/api";
import { useMutation } from "convex/react";

export function useBusinessNotificationSettings() {
    const settings = useQuery(api.queries.notifications.getBusinessNotificationSettings);
    const updateSettings = useMutation(api.mutations.notifications.upsertBusinessNotificationSettings);

    return {
        settings,
        loading: settings === undefined,
        updateSettings,
    };
}
