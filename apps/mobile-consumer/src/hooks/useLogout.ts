import { useCallback } from 'react';
import { clearAuthTokens } from '../utils/storage';
import { useAuthActions } from '@convex-dev/auth/react';

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
 * → useStorageSync hook detects user change and clears preferences automatically
 * 
 * Performs the following actions:
 * 1. Signs out from Convex Auth (removes session)
 * 2. Clears auth tokens (logout)
 * 3. PRESERVES user preferences (language, theme, etc.)
 * 4. PRESERVES lastUserId (for user recognition)
 * 5. Executes optional callback after cleanup
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
    const { signOut } = useAuthActions();

    const logout = useCallback(async (onComplete?: () => void) => {
        try {
            console.log('Logging out user...');

            await signOut();

            // Clear auth tokens only (PRESERVE preferences and lastUserId)
            clearAuthTokens();

            console.log('Logout completed successfully');

            // Execute callback after successful logout
            if (onComplete) {
                onComplete();
            }
        } catch (error) {
            console.error('Error during logout:', error);
            // Still clear local state even if remote cleanup fails
            clearAuthTokens();

            // Still execute callback even on error since local state is cleared
            if (onComplete) {
                onComplete();
            }
        }
    }, []);

    return logout;
}

