import { Infer, v } from "convex/values";
import { discountRuleFields } from "../convex/schema";

const discountRuleFieldObject = v.object(discountRuleFields);

export type DiscountRule = Infer<typeof discountRuleFieldObject>;
export type DiscountRuleConditionType = DiscountRule['condition']['type'];
export type DiscountRuleDiscountType = DiscountRule['discount']['type']
