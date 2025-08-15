// storage.ts
import { MMKV, useMMKVBoolean, useMMKVNumber, useMMKVString, useMMKVObject } from 'react-native-mmkv';

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
}

// Create MMKV instances
export const appStorageMMKV = new MMKV({
    id: 'app-storage'
});

export const secureStorageMMKV = new MMKV({
    id: 'secure-storage',
    encryptionKey: 'djgefaojdisoiajdthejoiabesthfu'
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
 * Only for convex auth
 */
const convexAuthMMKV = new MMKV({
    id: 'convex-auth-storage',
    encryptionKey: 'eoijgefaeoifjisfthejodiaebestfr'
});

export const convexAuthStorage = {
    getItem: (key: string) => convexAuthMMKV.getString(key),
    setItem: (key: string, value: string) => convexAuthMMKV.set(key, value),
    removeItem: (key: string) => convexAuthMMKV.delete(key),
};