import { useEffect } from 'react';
import { useConvexAuth, useQuery } from 'convex/react';
import { api } from '@repo/api/convex/_generated/api';
import { clearAuthTokens, clearUserPreferences, secureStorage } from '../utils/storage';

/**
 * Hook to sync authentication state and handle storage cleanup
 * 
 * SMART STORAGE ARCHITECTURE:
 * - lastUserId: NEVER auto-clears, only replaced on user change
 * - Auth tokens: Clear when NOT authenticated (logout/session expired)
 * - User preferences: Clear only when USER CHANGES
 * - Secure data: Manual control only
 * 
 * User State Transitions:
 * 
 * 1. Same user (ID matches):
 *    - No cleanup ✅
 *    - User keeps preferences (language, theme, onboarding state) ✅
 * 
 * 2. User → null (logout/session expired):
 *    - Clear auth tokens ONLY
 *    - PRESERVE lastUserId (to recognize same user on re-login)
 *    - PRESERVE preferences (language, theme, onboarding) ✅
 * 
 * 3. User A → User B (different user):
 *    - Clear user preferences (User A's language, theme, etc.)
 *    - KEEP auth tokens (User B needs them!)
 *    - Update lastUserId to User B
 * 
 * 4. null → User (login):
 *    - Set lastUserId
 *    - No cleanup (user is logging in)
 * 
 * Benefits:
 * ✅ Same user keeps preferences after logout/re-login
 * ✅ Different users get clean slate
 * ✅ No unnecessary data loss
 * ✅ Better UX overall
 * 
 * Call this hook once at the app root (e.g., in App.tsx)
 */
export function useStorageSync() {
  const { isAuthenticated, isLoading: isAuthLoading } = useConvexAuth();
  const userQuery = useQuery(
    api.queries.core.getCurrentUserQuery,
    isAuthenticated ? {} : 'skip'
  );

  const isUserQueryLoading = userQuery === undefined;
  const currentUser = userQuery?.user;

  useEffect(() => {
    // Wait for auth to initialize
    if (isAuthLoading || isUserQueryLoading) {
      console.log('[useStorageSync] 🔄 Initializing...');
      return;
    }

    // Not authenticated - clear user state and auth tokens
    if (!isAuthenticated) {
      console.log('[useStorageSync] 🚫 Not authenticated, clearing auth tokens');
      clearAuthTokens();
      return;
    }

    // Handle storage cleanup based on user changes
    const currentUserId = currentUser?._id || null;
    const lastUserId = secureStorage.getLastUserId();

    console.log('[useStorageSync] 🔍 User check:', { currentUserId, lastUserId });

    // No current user → logout/session expired scenario
    if (!currentUserId) {
      console.log('[useStorageSync] 🔐 User logged out, clearing auth tokens only');
      clearAuthTokens(); // Clear auth tokens, but KEEP preferences and lastUserId
      return;
    }

    // Have a user - check if it changed
    if (lastUserId !== currentUserId) {
      console.log('[useStorageSync] 🔐 User changed:', { from: lastUserId, to: currentUserId });

      // Clear previous user's preferences only if there was a previous user
      if (lastUserId) {
        console.log('[useStorageSync]   → Clearing previous user preferences');
        clearUserPreferences(); // Clear app preferences, KEEP auth tokens and lastUserId
      } else {
        console.log('[useStorageSync]   → First login, no cleanup needed');
      }

      // Update to new user ID
      secureStorage.setLastUserId(currentUserId);
      console.log('[useStorageSync]   → New user ID saved:', currentUserId);
    }
  }, [currentUser, isAuthenticated, isAuthLoading, isUserQueryLoading]);
}

