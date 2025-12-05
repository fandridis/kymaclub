import type { ValidationResult } from '../types/core';
import type { PresenceAppState, PresenceDeviceType, PresenceUpdatePayload } from '../types/presence';

export const validateUserId = (userId: string): ValidationResult<string> => {
    const trimmed = userId.trim();
    if (!trimmed) {
        return { success: false, error: "User ID is required", field: "userId" };
    }
    return { success: true, value: trimmed };
};

export const validateThreadId = (threadId: string | null | undefined): ValidationResult<string | null> => {
    if (threadId === null || threadId === undefined) {
        return { success: true, value: null };
    }

    const trimmed = threadId.trim();
    if (!trimmed) {
        return { success: true, value: null };
    }

    return { success: true, value: trimmed };
};

export const validateAppState = (appState: string): ValidationResult<PresenceAppState> => {
    const validStates: PresenceAppState[] = ['active', 'background', 'inactive'];

    if (!validStates.includes(appState as PresenceAppState)) {
        return {
            success: false,
            error: `App state must be one of: ${validStates.join(', ')}`,
            field: "appState"
        };
    }

    return { success: true, value: appState as PresenceAppState };
};

export const validateDeviceType = (deviceType: string | undefined): ValidationResult<PresenceDeviceType | undefined> => {
    if (!deviceType) {
        return { success: true, value: undefined };
    }

    const validTypes: PresenceDeviceType[] = ['mobile', 'web', 'desktop'];

    if (!validTypes.includes(deviceType as PresenceDeviceType)) {
        return {
            success: false,
            error: `Device type must be one of: ${validTypes.join(', ')}`,
            field: "deviceType"
        };
    }

    return { success: true, value: deviceType as PresenceDeviceType };
};

export const validateDeviceId = (deviceId: string | undefined): ValidationResult<string | undefined> => {
    if (!deviceId) {
        return { success: true, value: undefined };
    }

    const trimmed = deviceId.trim();
    if (!trimmed) {
        return { success: true, value: undefined };
    }

    if (trimmed.length > 255) {
        return {
            success: false,
            error: "Device ID cannot exceed 255 characters",
            field: "deviceId"
        };
    }

    return { success: true, value: trimmed };
};

export const validateIsActive = (isActive: unknown): ValidationResult<boolean> => {
    if (typeof isActive !== 'boolean') {
        return {
            success: false,
            error: "isActive must be a boolean",
            field: "isActive"
        };
    }

    return { success: true, value: isActive };
};

export const validateLastSeen = (lastSeen: unknown): ValidationResult<number> => {
    if (typeof lastSeen !== 'number' || !Number.isInteger(lastSeen) || lastSeen < 0) {
        return {
            success: false,
            error: "Last seen must be a positive integer timestamp",
            field: "lastSeen"
        };
    }

    // Validate timestamp is not in the future (with 1 minute tolerance)
    const now = Date.now();
    const tolerance = 60000; // 1 minute
    if (lastSeen > now + tolerance) {
        return {
            success: false,
            error: "Last seen timestamp cannot be in the future",
            field: "lastSeen"
        };
    }

    return { success: true, value: lastSeen };
};

export const validatePresenceUpdatePayload = (payload: unknown): ValidationResult<PresenceUpdatePayload> => {
    if (!payload || typeof payload !== 'object') {
        return { success: false, error: "Presence update payload is required" };
    }

    const p = payload as any;

    // Validate required fields
    const isActiveResult = validateIsActive(p.isActive);
    if (!isActiveResult.success) {
        return {
            success: false,
            error: isActiveResult.error,
            field: isActiveResult.field
        };
    }

    const appStateResult = validateAppState(p.appState);
    if (!appStateResult.success) {
        return {
            success: false,
            error: appStateResult.error,
            field: appStateResult.field
        };
    }

    // Validate optional fields
    const threadIdResult = validateThreadId(p.activeThreadId);
    if (!threadIdResult.success) {
        return {
            success: false,
            error: threadIdResult.error,
            field: threadIdResult.field
        };
    }

    const deviceIdResult = validateDeviceId(p.deviceId);
    if (!deviceIdResult.success) {
        return {
            success: false,
            error: deviceIdResult.error,
            field: deviceIdResult.field
        };
    }

    const deviceTypeResult = validateDeviceType(p.deviceType);
    if (!deviceTypeResult.success) {
        return {
            success: false,
            error: deviceTypeResult.error,
            field: deviceTypeResult.field
        };
    }

    return {
        success: true,
        value: {
            isActive: isActiveResult.value ?? false,
            appState: appStateResult.value!,
            activeThreadId: threadIdResult.value,
            deviceId: deviceIdResult.value,
            deviceType: deviceTypeResult.value,
        }
    };
};

export const presenceValidations = {
    validateUserId,
    validateThreadId,
    validateAppState,
    validateDeviceType,
    validateDeviceId,
    validateIsActive,
    validateLastSeen,
    validatePresenceUpdatePayload,
};