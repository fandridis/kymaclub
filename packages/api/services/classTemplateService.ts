import type { MutationCtx, QueryCtx } from "../convex/_generated/server";
import type { Doc, Id } from "../convex/_generated/dataModel";
import { CreateClassTemplateArgs, DeleteClassTemplateArgs, UpdateClassTemplateArgs } from "../convex/mutations/classTemplates";
import { ConvexError } from "convex/values";
import { ERROR_CODES } from "../utils/errorCodes";
import { PaginationOptions } from "convex/server";
import { coreRules } from "../rules/core";
import { classTemplateOperations } from "../operations/classTemplate";
import { classTemplateRules } from "../rules/classTemplate";

// Service object with all class template operations
export const classTemplateService = {
    /**
     * Create a new class template
     */
    create: async ({ ctx, args, user }: { ctx: MutationCtx, args: CreateClassTemplateArgs, user: Doc<"users"> }): Promise<{ createdTemplateId: Id<"classTemplates"> }> => {
        coreRules.userMustBeAssociatedWithBusiness(user);

        const cleanTemplate = classTemplateOperations.prepareCreateTemplate(args);
        const defaults = classTemplateOperations.createDefaultTemplate(user.businessId!, user._id);

        // Validate venue exists and belongs to user's business
        let venue: Doc<'venues'> | null = null;
        if (cleanTemplate.venueId) {
            venue = await ctx.db.get(cleanTemplate.venueId);
            if (!venue) {
                throw new ConvexError({
                    message: "Venue not found",
                    field: "venueId",
                    code: ERROR_CODES.RESOURCE_NOT_FOUND
                });
            }
            if (venue.businessId !== user.businessId) {
                throw new ConvexError({
                    message: "Venue does not belong to your business",
                    field: "venueId",
                    code: ERROR_CODES.UNAUTHORIZED
                });
            }
        }

        // primaryCategory is now a class category (e.g., 'yoga'), not a venue category
        // Default to 'other' if not provided
        const primaryCategory = cleanTemplate.primaryCategory ?? 'other';

        const templateId = await ctx.db.insert("classTemplates", {
            ...defaults,
            ...cleanTemplate,
            primaryCategory,
        });

        return { createdTemplateId: templateId };
    },

    /**
     * Update an existing class template
     */
    update: async ({ ctx, args, user }: { ctx: MutationCtx, args: UpdateClassTemplateArgs, user: Doc<"users"> }): Promise<{ updatedTemplateId: Id<"classTemplates"> }> => {

        const existingTemplate = await ctx.db.get(args.templateId);
        classTemplateRules.userMustBeTemplateOwner(existingTemplate!, user);

        const cleanTemplate = classTemplateOperations.prepareUpdateTemplate(args.template);

        // Validate venue if being updated
        if (cleanTemplate.venueId) {
            const venue = await ctx.db.get(cleanTemplate.venueId);
            if (!venue) {
                throw new ConvexError({
                    message: "Venue not found",
                    field: "venueId",
                    code: ERROR_CODES.RESOURCE_NOT_FOUND
                });
            }
            if (venue.businessId !== user.businessId) {
                throw new ConvexError({
                    message: "Venue does not belong to your business",
                    field: "venueId",
                    code: ERROR_CODES.UNAUTHORIZED
                });
            }
        }

        await ctx.db.patch(args.templateId, {
            ...cleanTemplate,
            updatedAt: Date.now(),
            updatedBy: user._id,
        });


        return { updatedTemplateId: args.templateId };
    },

    /**
     * Soft delete a class template (mark as deleted)
     */
    delete: async ({ ctx, args, user }: { ctx: MutationCtx, args: DeleteClassTemplateArgs, user: Doc<"users"> }): Promise<{ deletedTemplateId: Id<"classTemplates"> }> => {
        const existingTemplate = await ctx.db.get(args.templateId);
        classTemplateRules.userMustBeTemplateOwner(existingTemplate!, user);

        // Check if template has active class instances
        const activeInstances = await ctx.db
            .query("classInstances")
            .withIndex("by_template", q => q.eq("templateId", args.templateId))
            .filter(q => q.and(
                q.neq(q.field("deleted"), true),
                q.eq(q.field("status"), "scheduled"),
                q.gte(q.field("startTime"), Date.now())
            ))
            .collect();

        if (activeInstances.length > 0) {
            throw new ConvexError({
                message: "Template has active class instances. Please delete the class instances first.",
                field: "templateId",
                code: ERROR_CODES.ACTION_NOT_ALLOWED
            });
        }


        // Soft delete the template
        await ctx.db.patch(args.templateId, {
            deleted: true,
            deletedAt: Date.now(),
            deletedBy: user._id,
        });

        return { deletedTemplateId: args.templateId };
    },

    /**
     * Permanently delete a class template from database
     */
    hardDelete: async ({ ctx, args, user }: { ctx: MutationCtx, args: DeleteClassTemplateArgs, user: Doc<"users"> }): Promise<{ success: boolean }> => {
        const existingTemplate = await ctx.db.get(args.templateId);
        classTemplateRules.userMustBeTemplateOwner(existingTemplate!, user);

        // Check if template has ANY class instances
        const allInstances = await ctx.db
            .query("classInstances")
            .withIndex("by_template", q => q.eq("templateId", args.templateId))
            .collect();

        if (allInstances.length > 0) {
            throw new ConvexError({
                message: "Template has class instances. Cannot permanently delete.",
                field: "templateId",
                code: ERROR_CODES.ACTION_NOT_ALLOWED
            });
        }

        // Permanently delete the template
        await ctx.db.delete(args.templateId);

        return { success: true };
    },

    /**
     * Get all class templates for the user's business
     */
    getTemplates: async ({ ctx, user }: { ctx: QueryCtx, user: Doc<"users"> }): Promise<Doc<"classTemplates">[]> => {
        coreRules.userMustBeAssociatedWithBusiness(user);

        const templates = await ctx.db
            .query("classTemplates")
            .withIndex("by_business", q => q.eq("businessId", user.businessId!))
            .filter(q => q.neq(q.field("deleted"), true))
            .collect();

        return templates;
    },

    //  args: { paginationOpts: PaginationOptions },
    getTemplatesPaginated: async ({ ctx, args, user }: {
        ctx: QueryCtx,
        args: { paginationOpts: PaginationOptions },
        user: Doc<"users">
    }): Promise<{ page: Doc<"classTemplates">[], isDone: boolean, continueCursor: string }> => {
        coreRules.userMustBeAssociatedWithBusiness(user);

        const result = await ctx.db
            .query("classTemplates")
            .withIndex("by_business", q => q.eq("businessId", user.businessId!))
            .filter(q => q.neq(q.field("deleted"), true))
            .paginate(args.paginationOpts);

        return result;
    },

    /**
     * Get class template by ID
     */
    getTemplateById: async ({ ctx, args, user }: { ctx: QueryCtx, args: { templateId: Id<"classTemplates"> }, user: Doc<"users"> }): Promise<Doc<"classTemplates"> | null> => {
        const template = await ctx.db.get(args.templateId);

        // Return null if template doesn't exist (hard deleted or never existed)
        if (!template) {
            return null;
        }

        classTemplateRules.userMustBeTemplateOwner(template, user);

        // Return null if template is soft-deleted
        if (template.deleted) {
            return null;
        }

        return template;
    },

    /**
     * Get active class templates (not deleted, isActive = true)
     */
    getActiveTemplates: async ({ ctx, user }: { ctx: QueryCtx, user: Doc<"users"> }): Promise<Doc<"classTemplates">[]> => {
        coreRules.userMustBeAssociatedWithBusiness(user);

        const templates = await ctx.db
            .query("classTemplates")
            .withIndex("by_business", q => q.eq("businessId", user.businessId!))
            .filter(q => q.and(
                q.neq(q.field("deleted"), true),
                q.eq(q.field("isActive"), true)
            ))
            .collect();

        return templates;
    },

    /**
     * Get class templates by tags
     */
    getTemplatesByTags: async ({ ctx, args, user }: {
        ctx: QueryCtx,
        args: { tags: string[] },
        user: Doc<"users">
    }): Promise<Doc<"classTemplates">[]> => {

        coreRules.userMustBeAssociatedWithBusiness(user);

        const allTemplates = await ctx.db
            .query("classTemplates")
            .withIndex("by_business", q => q.eq("businessId", user.businessId!))
            .filter(q => q.neq(q.field("deleted"), true))
            .collect();

        // Filter by tags (simple intersection check)
        const filteredTemplates = allTemplates.filter(template => {
            if (!template.tags || template.tags.length === 0) return false;
            return args.tags.some(tag => template.tags!.includes(tag));
        });

        return filteredTemplates;
    },

    /**
     * Get class templates by venue
     */
    getTemplatesByVenue: async ({ ctx, args, user }: {
        ctx: QueryCtx,
        args: { venueId: Id<"venues"> },
        user: Doc<"users">
    }): Promise<Doc<"classTemplates">[]> => {

        coreRules.userMustBeAssociatedWithBusiness(user);

        const templates = await ctx.db
            .query("classTemplates")
            .withIndex("by_venue", q => q.eq("venueId", args.venueId))
            .filter(q => q.and(
                q.neq(q.field("deleted"), true),
                q.eq(q.field("businessId"), user.businessId!)
            ))
            .collect();

        return templates;
    },

    /**
     * Get template usage statistics
     */
    getTemplateUsageStats: async ({
        ctx,
        args,
        user
    }: {
        ctx: QueryCtx,
        args: { templateId: Id<"classTemplates"> },
        user: Doc<"users">
    }): Promise<{
        totalInstances: number;
        activeInstances: number;
        completedInstances: number;
        cancelledInstances: number;
        avgBookedCount: number;
    }> => {

        coreRules.userMustBeAssociatedWithBusiness(user);

        // Verify template exists and belongs to user's business
        const template = await ctx.db.get(args.templateId);
        if (!template) {
            throw new ConvexError({
                message: "Template not found",
                field: "templateId",
                code: ERROR_CODES.RESOURCE_NOT_FOUND
            });
        }

        classTemplateRules.userMustBeTemplateOwner(template, user);

        // Get instances and calculate stats
        const instances = await ctx.db
            .query("classInstances")
            .withIndex("by_template", (q) => q.eq("templateId", args.templateId))
            .filter((q) => q.neq(q.field("deleted"), true))
            .collect();

        const totalInstances = instances.length;
        const activeInstances = instances.filter(i => i.status === "scheduled").length;
        const completedInstances = instances.filter(i => i.status === "completed").length;
        const cancelledInstances = instances.filter(i => i.status === "cancelled").length;

        const totalBookedCount = instances.reduce((sum, instance) => sum + (instance.bookedCount || 0), 0);
        const avgBookedCount = totalInstances > 0 ? totalBookedCount / totalInstances : 0;

        return {
            totalInstances,
            activeInstances,
            completedInstances,
            cancelledInstances,
            avgBookedCount: Math.round(avgBookedCount * 100) / 100,
        };
    }
};
