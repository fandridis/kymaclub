import { createMMKV } from 'react-native-mmkv';

// Rate limit configurations
export const REGISTRATION_LIMITS = {
    perMinute: 3,
    perHour: 5,
    perDay: 10,
} as const;

export const LOGIN_LIMITS = {
    perMinute: 5,
    perHour: 10,
    perDay: 20,
} as const;

// Time windows in milliseconds
const TIME_WINDOWS = {
    minute: 60 * 1000,
    hour: 60 * 60 * 1000,
    day: 24 * 60 * 60 * 1000,
} as const;

type TimeWindow = keyof typeof TIME_WINDOWS;
type ActionType = 'register' | 'login';

interface RateLimitEntry {
    count: number;
    resetTime: number;
}

interface RateLimitData {
    minute: RateLimitEntry;
    hour: RateLimitEntry;
    day: RateLimitEntry;
}

interface RateLimitResult {
    allowed: boolean;
    timeUntilReset?: number;
    blockingWindow?: TimeWindow;
}

// Create MMKV instance for rate limiting with encryption
const rateLimitStorage = createMMKV({
    id: 'rate-limiter',
    encryptionKey: 'rate-limiter-encryption-key-2024',
});

const STORAGE_KEY_PREFIX = 'rate_limit';

/**
 * Generate storage key for rate limit data
 */
const getStorageKey = (action: ActionType, identifier: string, deviceId: string): string => {
    // Normalize email to lowercase for consistency
    const normalizedEmail = identifier.toLowerCase().trim();
    return `${STORAGE_KEY_PREFIX}_${action}_${normalizedEmail}_${deviceId}`;
};

/**
 * Check if an action is allowed for the given identifier
 * @param action - 'register' or 'login'
 * @param identifier - email address
 * @param deviceId - device identifier for additional security
 * @returns RateLimitResult with allowed status and reset time
 */
export const checkRateLimit = (
    action: ActionType,
    identifier: string,
    deviceId: string
): RateLimitResult => {
    try {
        const limits = action === 'register' ? REGISTRATION_LIMITS : LOGIN_LIMITS;
        const key = getStorageKey(action, identifier, deviceId);
        const stored = rateLimitStorage.getString(key);

        const now = Date.now();
        let data: RateLimitData;

        if (stored) {
            data = JSON.parse(stored);

            // Reset expired windows
            Object.keys(TIME_WINDOWS).forEach((window) => {
                const windowKey = window as TimeWindow;
                if (now > data[windowKey].resetTime) {
                    data[windowKey] = {
                        count: 0,
                        resetTime: now + TIME_WINDOWS[windowKey],
                    };
                }
            });
        } else {
            // Initialize new entry with proper reset times
            data = {
                minute: { count: 0, resetTime: now + TIME_WINDOWS.minute },
                hour: { count: 0, resetTime: now + TIME_WINDOWS.hour },
                day: { count: 0, resetTime: now + TIME_WINDOWS.day },
            };
        }

        // Check all windows for violations and find the one that resets soonest
        const windowLimits = {
            minute: limits.perMinute,
            hour: limits.perHour,
            day: limits.perDay,
        };

        let blockingWindow: TimeWindow | undefined;
        let shortestResetTime = Infinity;

        for (const [window, limit] of Object.entries(windowLimits)) {
            const windowKey = window as TimeWindow;
            if (data[windowKey].count >= limit) {
                const resetTime = data[windowKey].resetTime - now;
                if (resetTime < shortestResetTime) {
                    shortestResetTime = resetTime;
                    blockingWindow = windowKey;
                }
            }
        }

        if (blockingWindow) {
            return {
                allowed: false,
                timeUntilReset: shortestResetTime,
                blockingWindow,
            };
        }

        // Increment all counters
        data.minute.count++;
        data.hour.count++;
        data.day.count++;

        // Save updated data
        rateLimitStorage.set(key, JSON.stringify(data));

        return { allowed: true };
    } catch (error) {
        console.error('Rate limit check failed:', error);
        // Fail open - allow request if storage fails
        return { allowed: true };
    }
};

/**
 * Get time until a specific window resets
 * @param action - 'register' or 'login'
 * @param identifier - email address
 * @param deviceId - device identifier
 * @param window - time window to check
 * @returns milliseconds until reset, or 0 if not found
 */
export const getTimeUntilReset = (
    action: ActionType,
    identifier: string,
    deviceId: string,
    window: TimeWindow
): number => {
    try {
        const key = getStorageKey(action, identifier, deviceId);
        const stored = rateLimitStorage.getString(key);

        if (!stored) return 0;

        const data: RateLimitData = JSON.parse(stored);
        const now = Date.now();

        // If window has expired, return 0
        if (now > data[window].resetTime) return 0;

        return Math.max(0, data[window].resetTime - now);
    } catch (error) {
        console.error('Get reset time failed:', error);
        return 0;
    }
};

/**
 * Clear rate limit data for an identifier (called on successful auth)
 * @param action - 'register' or 'login'
 * @param identifier - email address
 * @param deviceId - device identifier
 */
export const clearRateLimit = (
    action: ActionType,
    identifier: string,
    deviceId: string
): void => {
    try {
        const key = getStorageKey(action, identifier, deviceId);
        rateLimitStorage.remove(key);
    } catch (error) {
        console.error('Clear rate limit failed:', error);
    }
};

/**
 * Format milliseconds into human-readable time string
 * @param ms - milliseconds
 * @returns formatted time string
 */
export const formatTimeRemaining = (ms: number): string => {
    const totalMinutes = Math.ceil(ms / (60 * 1000));
    const totalHours = Math.ceil(ms / (60 * 60 * 1000));
    const totalDays = Math.ceil(ms / (24 * 60 * 60 * 1000));

    // For very short times, show seconds
    if (ms < 60 * 1000) {
        const seconds = Math.ceil(ms / 1000);
        return seconds === 1 ? '1 second' : `${seconds} seconds`;
    }

    // For times under 1 hour, show minutes
    if (ms < 60 * 60 * 1000) {
        return totalMinutes === 1 ? '1 minute' : `${totalMinutes} minutes`;
    }

    // For times under 1 day, show hours
    if (ms < 24 * 60 * 60 * 1000) {
        return totalHours === 1 ? '1 hour' : `${totalHours} hours`;
    }

    // For longer times, show days
    return totalDays === 1 ? '1 day' : `${totalDays} days`;
};
