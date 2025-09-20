import { Infer, v } from "convex/values";
import { userSettingsFields } from "../convex/schema";

const userSettingsFieldObject = v.object(userSettingsFields);

export type UserSettings = Infer<typeof userSettingsFieldObject>;
export type UserSettingsNotifications = NonNullable<UserSettings['notifications']>;