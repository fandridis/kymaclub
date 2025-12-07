import { paginationOptsValidator } from "convex/server";
import { query } from "../_generated/server";
import { v } from "convex/values";
import { classTemplateService } from "../../services/classTemplateService";
import { getAuthenticatedUserOrThrow } from "../utils";
import { filterTestClassInstances } from "../../utils/testDataFilter";
import type { Id } from "../_generated/dataModel";

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

/***************************************************************
 * Get Venue Class Offerings (Consumer/Public Read)
 * 
 * Fetches unique class offerings for a venue by querying upcoming
 * class instances and extracting unique templates. This approach
 * ensures we only show classes that are actually scheduled.
 * 
 * Performance: Uses efficient by_venue_deleted_start_time index
 ***************************************************************/

const venueClassOfferingValidator = v.object({
    templateId: v.id("classTemplates"),
    name: v.string(),
    shortDescription: v.optional(v.string()),
    price: v.number(),
    duration: v.number(),
    imageStorageIds: v.optional(v.array(v.id("_storage"))),
    primaryCategory: v.optional(v.string()),
});

export const getVenueClassOfferingsArgs = v.object({
    venueId: v.id("venues"),
    limit: v.optional(v.number()),
});

export const getVenueClassOfferings = query({
    args: getVenueClassOfferingsArgs,
    returns: v.array(venueClassOfferingValidator),
    handler: async (ctx, args) => {
        const user = await getAuthenticatedUserOrThrow(ctx);

        const now = Date.now();
        const limit = args.limit ?? 10;

        // Query upcoming instances for venue - efficient index query
        // Fetch enough instances to find unique templates
        const instances = await ctx.db
            .query("classInstances")
            .withIndex("by_venue_deleted_start_time", (q) =>
                q.eq("venueId", args.venueId)
                    .eq("deleted", undefined)
                    .gte("startTime", now)
            )
            .filter(q => q.eq(q.field("status"), "scheduled"))
            .take(100);

        // Filter test instances based on user tester status
        const filteredInstances = filterTestClassInstances(instances, user);

        // Extract unique templates - use templateSnapshot data to avoid N+1 queries
        const seenTemplates = new Set<string>();
        const offerings: Array<{
            templateId: Id<"classTemplates">;
            name: string;
            shortDescription?: string;
            price: number;
            duration: number;
            imageStorageIds?: Id<"_storage">[];
            primaryCategory?: string;
        }> = [];

        for (const instance of filteredInstances) {
            if (seenTemplates.has(instance.templateId)) continue;
            seenTemplates.add(instance.templateId);

            // Skip deleted templates (via snapshot marker)
            if (instance.templateSnapshot.deleted) continue;

            // Use instance.price and templateSnapshot data - no additional DB query needed
            const duration = instance.templateSnapshot.duration ?? 0;
            const price = instance.price ?? 0;
            offerings.push({
                templateId: instance.templateId,
                name: instance.templateSnapshot.name,
                shortDescription: instance.templateSnapshot.shortDescription,
                price,
                duration,
                imageStorageIds: instance.templateSnapshot.imageStorageIds,
                primaryCategory: instance.templateSnapshot.primaryCategory,
            });

            if (offerings.length >= limit) break;
        }

        return offerings;
    }
});