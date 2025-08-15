//import { usePaginatedQuery } from "convex/react";
import { usePaginatedQuery, useQuery } from "convex-helpers/react/cache";
import { api } from "@repo/api/convex/_generated/api";

export const usePaginatedClassTemplates = (initialNumItems: number = 20) => {
    return usePaginatedQuery(
        api.queries.classTemplates.getClassTemplatesPaginated,
        {},
        { initialNumItems }
    );
};

export const useActiveClassTemplates = () => {
    const classTemplates = useQuery(api.queries.classTemplates.getActiveClassTemplates);

    return {
        classTemplates: classTemplates ?? [],
        loading: classTemplates === undefined,
    };
};

export type ClassTemplate = Awaited<ReturnType<typeof useActiveClassTemplates>>['classTemplates'][number];