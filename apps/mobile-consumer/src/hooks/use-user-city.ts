import { useQuery } from "convex/react";
import { api } from "@repo/api/convex/_generated/api";
import { getCityLabel } from "@repo/utils/constants";

/**
 * Hook to get the current user's active city
 * @returns { city: string | undefined, loading: boolean }
 */
export function useUserCity() {
    const userData = useQuery(api.queries.core.getCurrentUserQuery, {});
    
    return {
        city: userData?.user?.activeCitySlug,
        cityLabel: userData?.user?.activeCitySlug ? getCityLabel(userData.user?.activeCitySlug) : undefined,
        loading: userData === undefined,
    };
}

