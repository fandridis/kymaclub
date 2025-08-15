import { v, Infer } from "convex/values";
import { mutation } from "../_generated/server";
import { discountService } from "../../services/discountService";
import { getAuthenticatedUserOrThrow } from "../utils";

/***************************************************************
 * Add Discount Rule to Template
 ***************************************************************/
export const addDiscountRuleArgs = v.object({
  templateId: v.id("classTemplates"),
  name: v.string(),
  condition: v.object({
    type: v.union(
      v.literal("hours_before_min"),
      v.literal("hours_before_max"),
      v.literal("always")
    ),
    hours: v.optional(v.number()),
  }),
  discount: v.object({
    type: v.union(
      v.literal("fixed_amount"),
      v.literal("percentage"),
      v.literal("fixed_price")
    ),
    value: v.number(),
  }),
});
export type AddDiscountRuleArgs = Infer<typeof addDiscountRuleArgs>;

export const addDiscountRule = mutation({
  args: addDiscountRuleArgs,
  returns: v.object({ success: v.boolean(), ruleId: v.string() }),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUserOrThrow(ctx);
    return discountService.addDiscountRule({ ctx, args, user });
  },
});

/***************************************************************
 * Remove Discount Rule from Template
 ***************************************************************/
export const removeDiscountRuleArgs = v.object({
  templateId: v.id("classTemplates"),
  ruleId: v.string(),
});
export type RemoveDiscountRuleArgs = Infer<typeof removeDiscountRuleArgs>;

export const removeDiscountRule = mutation({
  args: removeDiscountRuleArgs,
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUserOrThrow(ctx);
    return discountService.removeDiscountRule({ ctx, args, user });
  },
});

/***************************************************************
 * Add Manual Discount to Class Instance
 ***************************************************************/
export const addManualDiscountArgs = v.object({
  classInstanceId: v.id("classInstances"),
  type: v.union(
    v.literal("fixed_amount"),
    v.literal("percentage"),
    v.literal("fixed_price")
  ),
  value: v.number(),
  reason: v.optional(v.string()),
});
export type AddManualDiscountArgs = Infer<typeof addManualDiscountArgs>;

export const addManualDiscount = mutation({
  args: addManualDiscountArgs,
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUserOrThrow(ctx);
    return discountService.addManualDiscount({ ctx, args, user });
  },
});

/***************************************************************
 * Remove Manual Discount from Class Instance
 ***************************************************************/
export const removeManualDiscountArgs = v.object({
  classInstanceId: v.id("classInstances"),
});
export type RemoveManualDiscountArgs = Infer<typeof removeManualDiscountArgs>;

export const removeManualDiscount = mutation({
  args: removeManualDiscountArgs,
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUserOrThrow(ctx);
    return discountService.removeManualDiscount({ ctx, args, user });
  },
});