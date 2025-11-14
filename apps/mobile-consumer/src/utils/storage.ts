import { createMMKV, useMMKVBoolean, useMMKVNumber, useMMKVString, useMMKVObject } from 'react-native-mmkv';

// Simple UUID generator without external dependencies
const generateUUID = (): string => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

// Define storage schemas
interface AppStorageSchema {
    userLanguage: string;
    themeMode: 'light' | 'dark' | 'system';
    onboardingCompleted: boolean;
    notificationEnabled: boolean;
    lastSyncDate: number;
    userPreferences: {
        fontSize: number;
        colorScheme: string;
    };
}

interface SecureStorageSchema {
    userPin: string;
    biometricEnabled: boolean;
    lastAuthenticatedUserId: string;  // Persistent user ID for detecting user changes
}

/**
 * Create MMKV instances. Remember to add new ones to the clearAllStorage function.
 * 
 * SMART STORAGE ARCHITECTURE:
 * 
 * Storage Separation:
 * - appStorageMMKV: User preferences (language, theme, onboarding)
 * - secureStorageMMKV: Sensitive data + lastAuthenticatedUserId
 * - convexAuthMMKV: Authentication tokens
 * 
 * User Change Detection:
 * - lastAuthenticatedUserId NEVER auto-clears, only replaced on user change
 * - On app load, useStorageSync hook compares current user ID with lastAuthenticatedUserId
 * - If same user → preserve preferences ✅
 * - If different user → clear previous user's preferences
 * 
 * Clearing Strategy:
 * 
 * LOGOUT (useLogout hook):
 * - Clear: Auth tokens ONLY
 * - Preserve: User preferences, lastUserId
 * - Result: Same user keeps settings on re-login ✅
 * 
 * USER CHANGE (useStorageSync hook):
 * - Clear: User preferences (language, theme, onboarding)
 * - Preserve: Auth tokens (new user needs them!)
 * - Update: lastAuthenticatedUserId to new user
 * - Result: Different user gets clean slate ✅
 * 
 * Protected Scenarios:
 * ✅ User logout → re-login same user    → Keeps language/theme/onboarding ✅
 * ✅ Session expires → re-login          → Keeps preferences ✅
 * ✅ Different user logs in              → Clean preferences ✅
 * ✅ App restarts with same user         → No cleanup, ID matches ✅
 * ✅ App force-quit and reopened         → ID persists, works correctly ✅
 * 
 * Benefits:
 * ✅ Better UX - users don't lose settings on logout
 * ✅ Onboarding never shows again for same user
 * ✅ Language/theme preserved across sessions
 * ✅ Clean separation between auth state and user preferences
 * ✅ Security maintained - different users get clean slate
 */
export const appStorageMMKV = createMMKV({
    id: 'app-storage'
});

export const secureStorageMMKV = createMMKV({
    id: 'secure-storage',
    encryptionKey: 'djgefaojdisoiajdthejoiabesthfu'
});

export const convexAuthMMKV = createMMKV({
    id: 'convex-auth-storage',
    encryptionKey: 'eoijgefaeoifjisfthejodiaebestfr'
});

export const appStorage = {
    useLanguage: () => useMMKVString('userLanguage', appStorageMMKV),
    useThemeMode: () => useMMKVString('themeMode', appStorageMMKV),
    useOnboardingCompleted: () => useMMKVBoolean('onboardingCompleted', appStorageMMKV),
    useNotificationEnabled: () => useMMKVBoolean('notificationEnabled', appStorageMMKV),
    useLastSyncDate: () => useMMKVNumber('lastSyncDate', appStorageMMKV),
    useUserPreferences: () => useMMKVObject<AppStorageSchema['userPreferences']>('userPreferences', appStorageMMKV),
    getAppValue: <K extends keyof AppStorageSchema>(key: K): AppStorageSchema[K] | undefined => {
        const value = appStorageMMKV.getString(key);
        if (!value) return undefined;

        try {
            return JSON.parse(value);
        } catch {
            return value as any;
        }
    },
    setAppValue: <K extends keyof AppStorageSchema>(key: K, value: AppStorageSchema[K]): void => {
        if (typeof value === 'object') {
            appStorageMMKV.set(key, JSON.stringify(value));
        } else {
            appStorageMMKV.set(key, String(value));
        }
    },
};

export const secureStorage = {
    useUserPin: () => useMMKVString('userPin', secureStorageMMKV),
    useBiometricEnabled: () => useMMKVBoolean('biometricEnabled', secureStorageMMKV),

    // Last authenticated user ID - persists across app restarts for user change detection
    getLastUserId: () => secureStorageMMKV.getString('lastAuthenticatedUserId') || null,
    setLastUserId: (userId: string) => secureStorageMMKV.set('lastAuthenticatedUserId', userId),
    clearLastUserId: () => secureStorageMMKV.remove('lastAuthenticatedUserId'),

    getSecureValue: <K extends keyof SecureStorageSchema>(key: K): SecureStorageSchema[K] | undefined => {
        const value = secureStorageMMKV.getString(key);
        if (!value) return undefined;

        try {
            return JSON.parse(value);
        } catch {
            return value as any;
        }
    },
    setSecureValue: <K extends keyof SecureStorageSchema>(key: K, value: SecureStorageSchema[K]): void => {
        if (typeof value === 'object') {
            secureStorageMMKV.set(key, JSON.stringify(value));
        } else {
            secureStorageMMKV.set(key, String(value));
        }
    },
};

/**
 * ConvexAuthStorage - Async storage adapter for Convex Auth
 * 
 * IMPORTANT: Even though MMKV is synchronous, these methods MUST be async
 * to ensure Convex properly detects storage changes and updates authentication state.
 * 
 * Without async methods, Convex may not immediately reflect logout/login state changes,
 * requiring an app refresh to see the correct authentication state.
 */
export const convexAuthStorage = {
    getItem: async (key: string): Promise<string | null> => {
        const value = convexAuthMMKV.getString(key);
        return value ?? null;
    },
    setItem: async (key: string, value: string): Promise<void> => {
        convexAuthMMKV.set(key, value);
    },
    removeItem: async (key: string): Promise<void> => {
        convexAuthMMKV.remove(key);
    },
};

/**
 * Get or create a unique device identifier for rate limiting
 * This persists across app restarts and is used for additional security
 */
export const getDeviceId = (): string => {
    let deviceId = secureStorageMMKV.getString('deviceId');
    if (!deviceId) {
        deviceId = generateUUID();
        secureStorageMMKV.set('deviceId', deviceId);
    }
    return deviceId;
};


/**
 * Clear all storage - USE WITH CAUTION!
 * This is a nuclear option that clears EVERYTHING.
 * 
 * In most cases, you should use more targeted clearing:
 * - clearAuthTokens() for logout
 * - clearUserPreferences() for user changes
 */
export const clearAllStorage = () => {
    appStorageMMKV.clearAll();
    secureStorageMMKV.clearAll();
    convexAuthMMKV.clearAll();
};

/**
 * Clear only authentication tokens (for logout)
 * Preserves: user preferences, lastUserId
 */
export const clearAuthTokens = () => {
    convexAuthMMKV.clearAll();
};

/**
 * Clear user-specific preferences (for user changes)
 * Preserves: lastUserId (in secureStorage)
 */
export const clearUserPreferences = () => {
    appStorageMMKV.clearAll();
};