import { paginationOptsValidator } from "convex/server";
import { query } from "../_generated/server";
import { v } from "convex/values";
import { classTemplateService } from "../../services/classTemplateService";
import { getAuthenticatedUserOrThrow } from "../utils";

/***************************************************************
 * Get All Class Templates
 ***************************************************************/

export const getClassTemplates = query({
    args: {},
    handler: async (ctx) => {
        const user = await getAuthenticatedUserOrThrow(ctx);
        return await classTemplateService.getTemplates({ ctx, user });
    }
});

/***************************************************************
 * Get Class Templates Paginated
 ***************************************************************/

export const getClassTemplatesPaginatedArgs = v.object({
    paginationOpts: paginationOptsValidator
});

export const getClassTemplatesPaginated = query({
    args: getClassTemplatesPaginatedArgs,
    handler: async (ctx, args) => {
        const user = await getAuthenticatedUserOrThrow(ctx);
        return await classTemplateService.getTemplatesPaginated({ ctx, args, user });
    }
});

/***************************************************************
 * Get Class Template By ID
 ***************************************************************/

export const getClassTemplateByIdArgs = v.object({
    templateId: v.id("classTemplates"),
});

export const getClassTemplateById = query({
    args: getClassTemplateByIdArgs,
    handler: async (ctx, args) => {
        const user = await getAuthenticatedUserOrThrow(ctx);
        return await classTemplateService.getTemplateById({ ctx, args, user });
    }
});

/***************************************************************
 * Get Active Class Templates
 ***************************************************************/

export const getActiveClassTemplates = query({
    args: {},
    handler: async (ctx) => {
        const user = await getAuthenticatedUserOrThrow(ctx);
        return await classTemplateService.getActiveTemplates({ ctx, user });
    }
});

/***************************************************************
 * Get Class Templates By Tags
 ***************************************************************/

export const getClassTemplatesByTagsArgs = v.object({
    tags: v.array(v.string())
});

export const getClassTemplatesByTags = query({
    args: getClassTemplatesByTagsArgs,
    handler: async (ctx, args) => {
        const user = await getAuthenticatedUserOrThrow(ctx);
        return await classTemplateService.getTemplatesByTags({ ctx, args, user });
    }
});

/***************************************************************
 * Get Class Templates By Venue
 ***************************************************************/

export const getClassTemplatesByVenueArgs = v.object({
    venueId: v.id("venues")
});

export const getClassTemplatesByVenue = query({
    args: getClassTemplatesByVenueArgs,
    handler: async (ctx, args) => {
        const user = await getAuthenticatedUserOrThrow(ctx);
        return await classTemplateService.getTemplatesByVenue({ ctx, args, user });
    }
});

/***************************************************************
 * Get Template Usage Statistics
 ***************************************************************/

export const getTemplateUsageStatsArgs = v.object({
    templateId: v.id("classTemplates")
});

export const getTemplateUsageStats = query({
    args: getTemplateUsageStatsArgs,
    handler: async (ctx, args) => {
        const user = await getAuthenticatedUserOrThrow(ctx);
        return await classTemplateService.getTemplateUsageStats({ ctx, args, user });
    }
});

/***************************************************************
 * Get Class Template By ID (Consumer/Public Read)
 * This query allows any authenticated user to read template data
 * without requiring business ownership (for booking flow, etc.)
 ***************************************************************/

export const getClassTemplateByIdPublicArgs = v.object({
    templateId: v.id("classTemplates"),
});

export const getClassTemplateByIdPublic = query({
    args: getClassTemplateByIdPublicArgs,
    handler: async (ctx, args) => {
        // Any authenticated user can read template data
        await getAuthenticatedUserOrThrow(ctx);

        const template = await ctx.db.get(args.templateId);

        // Return null if template doesn't exist or is soft-deleted
        if (!template || template.deleted) {
            return null;
        }

        return template;
    }
});