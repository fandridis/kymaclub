import type { MutationCtx } from "../convex/_generated/server";
import type { Id, Doc } from "../convex/_generated/dataModel";
import { generateDiscountRuleId, validateDiscountRule } from "../utils/discount";
import type {
  AddDiscountRuleArgs,
  RemoveDiscountRuleArgs,
  AddManualDiscountArgs,
  RemoveManualDiscountArgs,
} from "../convex/mutations/discounts";

/**
 * Discount service for managing discount rules and manual discounts
 */
export const discountService = {
  /**
   * Add a discount rule to a class template
   */
  addDiscountRule: async ({
    ctx,
    args,
    user,
  }: {
    ctx: MutationCtx;
    args: AddDiscountRuleArgs;
    user: Doc<"users">;
  }): Promise<{ success: boolean; ruleId: string }> => {
    const template = await ctx.db.get(args.templateId);
    if (!template) {
      throw new Error("Template not found");
    }

    // Create the discount rule
    const rule = {
      id: generateDiscountRuleId(args.condition.type),
      name: args.name,
      condition: args.condition,
      discount: args.discount,
      isActive: true,
      createdAt: Date.now(),
      createdBy: user._id,
    };

    // Validate the discount rule
    const errors = validateDiscountRule(rule);
    if (errors.length > 0) {
      throw new Error(`Invalid discount rule: ${errors.join(", ")}`);
    }

    // Add rule to template
    const existingRules = template.discountRules || [];
    const updatedRules = [...existingRules, rule];

    await ctx.db.patch(args.templateId, {
      discountRules: updatedRules,
      updatedAt: Date.now(),
      updatedBy: user._id,
    });

    return { success: true, ruleId: rule.id };
  },

  /**
   * Remove a discount rule from a class template
   */
  removeDiscountRule: async ({
    ctx,
    args,
    user,
  }: {
    ctx: MutationCtx;
    args: RemoveDiscountRuleArgs;
    user: Doc<"users">;
  }): Promise<{ success: boolean }> => {
    const template = await ctx.db.get(args.templateId);
    if (!template) {
      throw new Error("Template not found");
    }

    const existingRules = template.discountRules || [];
    const updatedRules = existingRules.filter((rule) => rule.id !== args.ruleId);

    if (updatedRules.length === existingRules.length) {
      throw new Error("Discount rule not found");
    }

    await ctx.db.patch(args.templateId, {
      discountRules: updatedRules,
      updatedAt: Date.now(),
      updatedBy: user._id,
    });

    return { success: true };
  },

  /**
   * Add a manual discount to a class instance
   */
  addManualDiscount: async ({
    ctx,
    args,
    user,
  }: {
    ctx: MutationCtx;
    args: AddManualDiscountArgs;
    user: Doc<"users">;
  }): Promise<{ success: boolean }> => {
    const instance = await ctx.db.get(args.classInstanceId);
    if (!instance) {
      throw new Error("Class instance not found");
    }

    const manualDiscount = {
      type: args.type,
      value: args.value,
      reason: args.reason,
      appliedBy: user._id,
      appliedAt: Date.now(),
      isActive: true,
    };

    await ctx.db.patch(args.classInstanceId, {
      manualDiscount,
      updatedAt: Date.now(),
      updatedBy: user._id,
    });

    return { success: true };
  },

  /**
   * Remove a manual discount from a class instance
   */
  removeManualDiscount: async ({
    ctx,
    args,
    user,
  }: {
    ctx: MutationCtx;
    args: RemoveManualDiscountArgs;
    user: Doc<"users">;
  }): Promise<{ success: boolean }> => {
    const instance = await ctx.db.get(args.classInstanceId);
    if (!instance) {
      throw new Error("Class instance not found");
    }

    await ctx.db.patch(args.classInstanceId, {
      manualDiscount: undefined,
      updatedAt: Date.now(),
      updatedBy: user._id,
    });

    return { success: true };
  },
};

/**
 * Helper functions for creating common discount rules
 */
export function createEarlyBirdRule(hoursBeforeClass: number, discountPercent: number) {
  return {
    id: generateDiscountRuleId("early_bird"),
    name: `Early Bird ${discountPercent * 100}% Off`,
    condition: {
      type: "hours_before_min" as const,
      hours: hoursBeforeClass,
    },
    discount: {
      type: "percentage" as const,
      value: discountPercent, // e.g., 0.20 for 20%
    },
    isActive: true,
    createdAt: Date.now(),
  };
}

export function createLastMinuteRule(hoursBeforeClass: number, discountPercent: number) {
  return {
    id: generateDiscountRuleId("last_minute"),
    name: `Last Minute ${discountPercent * 100}% Off`,
    condition: {
      type: "hours_before_max" as const,
      hours: hoursBeforeClass,
    },
    discount: {
      type: "percentage" as const,
      value: discountPercent, // e.g., 0.30 for 30%
    },
    isActive: true,
    createdAt: Date.now(),
  };
}

export function createFixedPriceRule(name: string, fixedPrice: number) {
  return {
    id: generateDiscountRuleId("fixed_price"),
    name,
    condition: {
      type: "always" as const,
    },
    discount: {
      type: "fixed_price" as const,
      value: fixedPrice, // e.g., 5 credits
    },
    isActive: true,
    createdAt: Date.now(),
  };
}