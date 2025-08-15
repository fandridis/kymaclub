import { query } from "../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { coreService } from "../../services/coreService";

/***************************************************************
 * Queries - Thin wrappers around handlers
 ***************************************************************/

/**
 * Get the current user and business for the authenticated user
 */
export const getCurrentUserQuery = query({
    args: {},
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);
        return coreService.getCurrentUserWithBusiness({ ctx, userId });
    },
}); 