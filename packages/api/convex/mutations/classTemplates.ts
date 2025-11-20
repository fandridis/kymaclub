import { mutation } from "../_generated/server";
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
    handler: async (ctx, args) => {
        const { user, business } = await getAuthenticatedUserAndBusinessOrThrow(ctx);
        return classTemplateService.hardDelete({ ctx, args, user });
    }
});