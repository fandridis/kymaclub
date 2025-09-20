import { Infer, v } from "convex/values";
import { businessSettingsFields } from "../convex/schema";

const businessSettingsFieldObject = v.object(businessSettingsFields);

export type BusinessSettings = Infer<typeof businessSettingsFieldObject>;