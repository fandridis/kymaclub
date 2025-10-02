import { useCallback } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@repo/api/convex/_generated/api';
import { appStorageMMKV, secureStorage, secureStorageMMKV } from '../utils/storage';
import { useAuthStore } from '../stores/auth-store';

/**
 * Hook for handling user logout with complete cleanup
 * 
 * Performs the following actions:
 * 1. Removes all sessions from the database
 * 2. Clears authentication flag from secure storage
 * 3. Clears all app storage (preferences, cache, etc.)
 * 4. Clears all secure storage (sensitive data)
 * 5. Updates auth state to null
 * 6. Executes optional callback after cleanup
 * 
 * @returns logout function that accepts an optional callback
 * 
 * @example
 * ```tsx
 * const logout = useLogout();
 * 
 * // With callback for navigation
 * const handleLogout = () => {
 *   logout(() => {
 *     navigation.dispatch(
 *       CommonActions.reset({
 *         index: 0,
 *         routes: [{ name: "Landing" }],
 *       })
 *     );
 *   });
 * };
 * 
 * // Without callback
 * const handleLogout = async () => {
 *   await logout();
 *   // Do something after logout
 * };
 * ```
 */
export function useLogout() {
    const removeAllSessions = useMutation(api.mutations.core.removeAllSessions);
    const { logout: clearAuthState } = useAuthStore();

    const logout = useCallback(async (onComplete?: () => void) => {
        try {
            console.log('Logging out user...');

            // Remove all sessions from the database
            await removeAllSessions({});

            // Clear authentication flag
            secureStorage.removeIsAuthenticated();

            // Clear all local storage
            appStorageMMKV.clearAll();
            secureStorageMMKV.clearAll();

            // Update auth state
            clearAuthState();

            console.log('Logout completed successfully');

            // Execute callback after successful logout
            if (onComplete) {
                onComplete();
            }
        } catch (error) {
            console.error('Error during logout:', error);
            // Still clear local state even if remote cleanup fails
            secureStorage.removeIsAuthenticated();
            appStorageMMKV.clearAll();
            secureStorageMMKV.clearAll();
            clearAuthState();

            // Still execute callback even on error since local state is cleared
            if (onComplete) {
                onComplete();
            }
        }
    }, [removeAllSessions, clearAuthState]);

    return logout;
}

