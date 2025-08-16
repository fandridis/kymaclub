import { Infer, v } from "convex/values";
import { systemSettingsFields } from "../convex/schema";

const systemSettingFieldObject = v.object(systemSettingsFields);

export type SystemSetting = Infer<typeof systemSettingFieldObject>;