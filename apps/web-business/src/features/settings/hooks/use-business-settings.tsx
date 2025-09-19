import { useQuery } from "convex-helpers/react/cache/hooks";
import { api } from "@repo/api/convex/_generated/api";
import { useMutation } from "convex/react";

export function useBusinessSettings() {
    const settings = useQuery(api.queries.settings.getBusinessSettings);
    const updateSettings = useMutation(api.mutations.settings.upsertBusinessSettings);

    return {
        settings,
        loading: settings === undefined,
        updateSettings,
    };
}
