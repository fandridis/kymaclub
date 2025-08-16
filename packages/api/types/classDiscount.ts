import { Infer, v } from "convex/values";
import { classDiscountRuleFields } from "../convex/schema";

const classDiscountRuleFieldObject = v.object(classDiscountRuleFields);

export type ClassDiscountRule = Infer<typeof classDiscountRuleFieldObject>;
export type ClassDiscountRuleConditionType = ClassDiscountRule['condition']['type'];
export type ClassDiscountRuleDiscountType = ClassDiscountRule['discount']['type']
