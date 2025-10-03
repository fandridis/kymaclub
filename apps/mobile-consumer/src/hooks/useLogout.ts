import { useCallback } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@repo/api/convex/_generated/api';
import { clearAuthTokens } from '../utils/storage';
import { useAuthStore } from '../stores/auth-store';

/**
 * Hook for handling user logout with smart cleanup
 * 
 * SMART LOGOUT STRATEGY:
 * - Clears auth tokens ONLY (not preferences!)
 * - Preserves lastUserId (for same-user recognition on re-login)
 * - Preserves user preferences (language, theme, onboarding state)
 * 
 * Benefits:
 * ✅ User logs out and back in → keeps their settings!
 * ✅ Better UX - no need to reconfigure on every login
 * ✅ Onboarding never shows again for same user
 * ✅ Language/theme preserved across sessions
 * 
 * Different user logs in?
 * → AuthSync detects user change and clears preferences automatically
 * 
 * Performs the following actions:
 * 1. Removes all sessions from the database
 * 2. Clears auth tokens (logout)
 * 3. PRESERVES user preferences (language, theme, etc.)
 * 4. PRESERVES lastUserId (for user recognition)
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

            // Clear auth tokens only (PRESERVE preferences and lastUserId)
            clearAuthTokens();

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
            clearAuthTokens();

            clearAuthState();

            // Still execute callback even on error since local state is cleared
            if (onComplete) {
                onComplete();
            }
        }
    }, [removeAllSessions, clearAuthState]);

    return logout;
}

