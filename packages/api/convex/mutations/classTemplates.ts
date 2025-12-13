import { Infer, v } from "convex/values";
import { classTemplateService } from "../../services/classTemplateService";
import { getAuthenticatedUserAndBusinessOrThrow } from "../utils";
import { classTemplatesFields } from "../schema";
import { omit } from "convex-helpers";
import { partial } from "convex-helpers/validators";
import { mutationWithTriggers } from "../triggers";

/***************************************************************
 * Create Class Template
 ***************************************************************/

export const createClassTemplateArgs = v.object({
    template: v.object({
        ...omit(classTemplatesFields, ['businessId', 'createdAt', 'createdBy', 'isActive']),
        // Make cancellationWindowHours optional with default of 12 hours
        cancellationWindowHours: v.optional(v.number()),
    })
});
export type CreateClassTemplateArgs = Infer<typeof createClassTemplateArgs>;

export const createClassTemplate = mutationWithTriggers({
    args: createClassTemplateArgs,
    returns: v.object({
        createdTemplateId: v.id("classTemplates"),
    }),
    handler: async (ctx, args) => {
        const { user, business } = await getAuthenticatedUserAndBusinessOrThrow(ctx);
        return classTemplateService.create({ ctx, args, user });
    }
});

/***************************************************************
 * Update Class Template
 ***************************************************************/

export const updateClassTemplateArgs = v.object({
    templateId: v.id("classTemplates"),
    template: v.object({
        ...partial(classTemplatesFields)
    })
});
export type UpdateClassTemplateArgs = Infer<typeof updateClassTemplateArgs>;

export const updateClassTemplate = mutationWithTriggers({
    args: updateClassTemplateArgs,
    returns: v.object({
        updatedTemplateId: v.id("classTemplates"),
    }),
    handler: async (ctx, args) => {
        const { user, business } = await getAuthenticatedUserAndBusinessOrThrow(ctx);
        return classTemplateService.update({ ctx, args, user });
    }
});

/***************************************************************
 * Delete Class Template (Soft Delete)
 ***************************************************************/

export const deleteClassTemplateArgs = v.object({
    templateId: v.id("classTemplates")
});
export type DeleteClassTemplateArgs = Infer<typeof deleteClassTemplateArgs>;

export const deleteClassTemplate = mutationWithTriggers({
    args: deleteClassTemplateArgs,
    returns: v.object({
        deletedTemplateId: v.id("classTemplates"),
    }),
    handler: async (ctx, args) => {
        const { user, business } = await getAuthenticatedUserAndBusinessOrThrow(ctx);
        return classTemplateService.delete({ ctx, args, user });
    }
});

/***************************************************************
 * Hard Delete Class Template
 ***************************************************************/

export const hardDeleteClassTemplate = mutationWithTriggers({
    args: deleteClassTemplateArgs,
    returns: v.object({
        success: v.boolean(),
    }),
    handler: async (ctx, args) => {
        const { user, business } = await getAuthenticatedUserAndBusinessOrThrow(ctx);
        return classTemplateService.hardDelete({ ctx, args, user });
    }
});