import { Doc } from "../convex/_generated/dataModel";

export type UserSettings = Doc<"userSettings">;
export type UserSettingsNotifications = NonNullable<UserSettings['notifications']>;