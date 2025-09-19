import { useMutation } from "convex/react";
import { useQuery } from "convex-helpers/react/cache";
import { api } from "@repo/api/convex/_generated/api";

export function useUserSettings() {
    const settings = useQuery(api.queries.settings.getUserSettings);
    const updateSettings = useMutation(api.mutations.settings.upsertUserSettings);

    return {
        settings,
        loading: settings === undefined,
        updateSettings,
    };
}