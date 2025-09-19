import { query } from "../_generated/server";
import { getAuthenticatedUserOrThrow } from "../utils";
import { EXPLORE_CATEGORY_FILTERS } from "@repo/utils/exploreFilters";

export const getExploreFilters = query({
  args: {},
  handler: async (ctx) => {
    await getAuthenticatedUserOrThrow(ctx);

    return {
      categories: EXPLORE_CATEGORY_FILTERS.map(({ id, label, tag }) => ({
        id,
        label,
        tag,
      })),
    };
  },
});
