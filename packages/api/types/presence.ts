import { Infer, v } from "convex/values";
import { userPresenceFields } from "../convex/schema";

const userPresenceFieldObject = v.object(userPresenceFields);

export type UserPresence = Infer<typeof userPresenceFieldObject>;

// Presence status types
export type PresenceAppState = UserPresence['appState'];
export type PresenceDeviceType = UserPresence['deviceType'];

// Smart notification delivery context
export interface NotificationDeliveryContext {
  recipientUserId: string;
  threadId?: string;
  messageTimestamp: number;
}

// Presence update payload for client-side operations
export interface PresenceUpdatePayload {
  isActive: boolean;
  activeThreadId?: string | null;
  appState: PresenceAppState;
  deviceId?: string;
  deviceType?: PresenceDeviceType;
}

// Presence query results
export interface ActiveUserPresence {
  userId: string;
  isActive: boolean;
  activeThreadId?: string | null;
  lastSeen: number;
  appState: PresenceAppState;
}

// Smart delivery decision result
export interface NotificationDeliveryDecision {
  shouldSend: boolean;
  reason: string;
  presenceData?: ActiveUserPresence;
}