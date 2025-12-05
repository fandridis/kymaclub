import type { Id } from "../convex/_generated/dataModel";
import type {
    PresenceUpdatePayload,
    NotificationDeliveryContext,
    NotificationDeliveryDecision,
    ActiveUserPresence,
    PresenceAppState,
    PresenceDeviceType
} from "../types/presence";
import { presenceValidations } from "../validations/presence";
import { throwIfError } from "../utils/core";

/**
 * Prepared presence update data ready for database operations
 * This excludes Convex system fields (_id, _creationTime) and audit fields
 */
export interface PreparedPresenceUpdate {
    userId: Id<"users">;
    isActive: boolean;
    activeThreadId: Id<"chatMessageThreads"> | null | undefined;
    appState: PresenceAppState;
    deviceId: string | undefined;
    deviceType: PresenceDeviceType | undefined;
    lastSeen: number;
}

/**
 * Presence Operations - Business Logic for Real-time User Presence Management
 * 
 * This module handles user presence tracking for smart notification delivery.
 * Tracks user activity state, active conversations, and app lifecycle to prevent
 * notification spam when users are actively engaged in conversations.
 * 
 * Key Features:
 * - Real-time presence tracking with activity state management
 * - Smart notification delivery based on user engagement context
 * - Multi-device support with device identification
 * - Thread-specific presence for conversation-aware notifications
 * - App state lifecycle management (active/background/inactive)
 * 
 * ADR-020: User Presence Tracking for Smart Notifications
 * Decision: Implement real-time presence tracking to prevent notification spam
 * Rationale: Users shouldn't receive push notifications when actively chatting
 * Date: 2024-12, Context: Chat notifications causing user experience issues
 * Alternative considered: Simple read receipts, rejected due to timing issues
 */

/**
 * Prepares and validates presence update payload for database operations
 * 
 * @description Validates presence update data ensuring proper format and business rules.
 * Handles optional fields like thread ID and device information while enforcing
 * required activity state and timing constraints.
 * 
 * @param userId - The user ID for presence update
 * @param payload - Raw presence update data from client
 * @returns Validated presence data ready for database update
 * 
 * @example
 * // User enters active conversation
 * const presenceData = preparePresenceUpdate("user123", {
 *   isActive: true,
 *   activeThreadId: "thread456",
 *   appState: "active",
 *   deviceId: "device789",
 *   deviceType: "mobile"
 * });
 * 
 * @example
 * // User leaves conversation but stays in app
 * const presenceData = preparePresenceUpdate("user123", {
 *   isActive: true,
 *   activeThreadId: null,
 *   appState: "active",
 *   deviceId: "device789",
 *   deviceType: "mobile"
 * });
 * 
 * @throws ConvexError When user ID validation fails
 * @throws ConvexError When payload validation fails (invalid app state, device type)
 * @business_rule isActive: Required boolean indicating current activity status
 * @business_rule appState: Required, must be 'active', 'background', or 'inactive'
 * @business_rule activeThreadId: Optional thread ID or null when not in conversation
 * @business_rule deviceId: Optional, max 255 characters for device identification
 * @business_rule deviceType: Optional, must be 'mobile', 'web', or 'desktop'
 * @data_integrity Timestamps are auto-generated to prevent client-side manipulation
 * @validation_layer Uses presence-specific validation functions
 */
export const preparePresenceUpdate = (userId: string, payload: PresenceUpdatePayload): PreparedPresenceUpdate => {
    // Validate user ID
    const validUserId = throwIfError(presenceValidations.validateUserId(userId), 'userId');

    // Validate full payload
    const validatedPayload = throwIfError(presenceValidations.validatePresenceUpdatePayload(payload), 'payload');

    return {
        userId: validUserId as Id<"users">,
        isActive: validatedPayload.isActive,
        activeThreadId: validatedPayload.activeThreadId as Id<"chatMessageThreads"> | null | undefined,
        appState: validatedPayload.appState,
        deviceId: validatedPayload.deviceId,
        deviceType: validatedPayload.deviceType,
        lastSeen: Date.now(),
    };
};

/**
 * Determines whether a push notification should be sent based on user presence
 * 
 * @description Implements smart notification logic to prevent spam when users are
 * actively engaged. Checks multiple presence indicators including active thread,
 * recent activity, and app state to make delivery decisions.
 * 
 * @param userPresence - Current user presence data or null if not tracked
 * @param context - Notification delivery context with recipient and message info
 * @returns Decision object with delivery recommendation and reasoning
 * 
 * @example
 * // User is actively in the same conversation
 * const decision = shouldDeliverNotification(
 *   { userId: "user123", isActive: true, activeThreadId: "thread456", lastSeen: Date.now() - 5000 },
 *   { recipientUserId: "user123", threadId: "thread456", messageTimestamp: Date.now() }
 * );
 * // Result: { shouldSend: false, reason: "User is actively in target conversation" }
 * 
 * @example
 * // User is active but in different conversation
 * const decision = shouldDeliverNotification(
 *   { userId: "user123", isActive: true, activeThreadId: "thread789", lastSeen: Date.now() - 10000 },
 *   { recipientUserId: "user123", threadId: "thread456", messageTimestamp: Date.now() }
 * );
 * // Result: { shouldSend: true, reason: "User active but in different conversation" }
 * 
 * @business_rule Same thread + active + recent = No notification (prevent spam)
 * @business_rule No presence data = Send notification (fail-safe approach)
 * @business_rule Inactive state = Send notification (user not engaged)
 * @business_rule Stale presence (>60s) = Send notification (assume disconnected)
 * @performance_note Uses 30-second threshold for "recent activity" detection
 * @fail_safe Always sends notifications when presence data is missing or stale
 */
export const shouldDeliverNotification = (
    userPresence: ActiveUserPresence | null,
    context: NotificationDeliveryContext
): NotificationDeliveryDecision => {
    // Fail-safe: Always send if no presence data available
    if (!userPresence) {
        return {
            shouldSend: true,
            reason: "No presence data available - fail-safe delivery",
        };
    }

    const currentTime = context.messageTimestamp;
    const timeSinceLastSeen = currentTime - userPresence.lastSeen;
    const RECENT_ACTIVITY_THRESHOLD = 30000; // 30 seconds
    const STALE_PRESENCE_THRESHOLD = 60000; // 60 seconds

    // Check if presence data is stale (user might be disconnected)
    if (timeSinceLastSeen > STALE_PRESENCE_THRESHOLD) {
        return {
            shouldSend: true,
            reason: "Presence data is stale - user likely disconnected",
            presenceData: userPresence,
        };
    }

    // User is not active in any app state
    if (!userPresence.isActive || userPresence.appState === 'inactive') {
        return {
            shouldSend: true,
            reason: "User is not active or app is inactive",
            presenceData: userPresence,
        };
    }

    // User is active and in the same conversation as the incoming message
    if (context.threadId &&
        userPresence.activeThreadId === context.threadId &&
        timeSinceLastSeen <= RECENT_ACTIVITY_THRESHOLD) {
        return {
            shouldSend: false,
            reason: "User is actively in target conversation",
            presenceData: userPresence,
        };
    }

    // User is active but not in target conversation or not recently active
    return {
        shouldSend: true,
        reason: userPresence.activeThreadId
            ? "User active but in different conversation"
            : "User active but not in any specific conversation",
        presenceData: userPresence,
    };
};

/**
 * Calculates cleanup threshold for removing stale presence records
 * 
 * @description Determines timestamp threshold for identifying stale presence records
 * that should be cleaned up. Uses configurable thresholds based on app state.
 * 
 * @param currentTime - Current timestamp for calculation base
 * @returns Timestamp threshold - records older than this should be cleaned
 * 
 * @example
 * // Get cleanup threshold for current time
 * const threshold = calculatePresenceCleanupThreshold(Date.now());
 * // Records with lastSeen < threshold should be removed
 * 
 * @business_rule Inactive users: 24 hours retention for offline status
 * @business_rule Active users: 1 hour retention for connection issues
 * @performance_note Cleanup should run periodically to prevent table bloat
 */
export const calculatePresenceCleanupThreshold = (currentTime: number = Date.now()): number => {
    const CLEANUP_THRESHOLD_HOURS = 1; // 1 hour for active presence
    return currentTime - (CLEANUP_THRESHOLD_HOURS * 60 * 60 * 1000);
};

/**
 * Validates notification delivery context for business rule compliance
 * 
 * @description Ensures notification context contains valid recipient and timing
 * information required for smart delivery decisions.
 * 
 * @param context - Raw notification delivery context
 * @returns Validated context object
 * 
 * @throws ConvexError When recipient user ID is invalid
 * @throws ConvexError When message timestamp is invalid or in future
 * @business_rule Recipient user ID must be valid non-empty string
 * @business_rule Message timestamp must be valid past or current time
 * @business_rule Thread ID is optional but must be valid if provided
 */
export const validateNotificationContext = (context: NotificationDeliveryContext): NotificationDeliveryContext => {
    const validRecipientId = throwIfError(presenceValidations.validateUserId(context.recipientUserId), 'recipientUserId');
    const validTimestamp = throwIfError(presenceValidations.validateLastSeen(context.messageTimestamp), 'messageTimestamp');

    let validThreadId: string | undefined = undefined;
    if (context.threadId) {
        const threadResult = presenceValidations.validateThreadId(context.threadId);
        validThreadId = throwIfError(threadResult, 'threadId') || undefined;
    }

    return {
        recipientUserId: validRecipientId,
        messageTimestamp: validTimestamp,
        threadId: validThreadId,
    };
};

// Export all operations for use in services layer
export const presenceOperations = {
    preparePresenceUpdate,
    shouldDeliverNotification,
    calculatePresenceCleanupThreshold,
    validateNotificationContext,
};