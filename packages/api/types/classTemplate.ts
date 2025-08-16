import { Infer, v } from "convex/values";
import { classTemplatesFields } from "../convex/schema";

const classTemplateFieldObject = v.object(classTemplatesFields);

export type ClassTemplate = Infer<typeof classTemplateFieldObject>;
