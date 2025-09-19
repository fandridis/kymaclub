import { query } from "../_generated/server";
import { settingsService } from "../../services/settingsService";
import { getAuthenticatedUserOrThrow } from "../utils";

/***************************************************************
 * Get User Settings
 ***************************************************************/
export const getUserSettings = query({
    args: {},
    handler: async (ctx) => {
        const user = await getAuthenticatedUserOrThrow(ctx);
        return await settingsService.getUserSettings({ ctx, user });
    }
});

/***************************************************************
 * Get Business Settings
 ***************************************************************/
export const getBusinessSettings = query({
    args: {},
    handler: async (ctx) => {
        const user = await getAuthenticatedUserOrThrow(ctx);
        return await settingsService.getBusinessSettings({ ctx, user });
    }
});
