import { usePaginatedQuery } from "convex/react";
import { api } from "@repo/api/convex/_generated/api";

type SortBy = "latest" | "most_expensive" | "capacity";

export const useClassInstances = (initialNumItems: number = 10, sortBy: SortBy = "latest") => {
    return usePaginatedQuery(
        api.internal.queries.classInstances.getAllClassInstances,
        { sortBy },
        { initialNumItems }
    );
};

export type ClassInstance = NonNullable<
    Awaited<ReturnType<typeof useClassInstances>>['results']
>[number];

