import { useEffect, type ReactNode } from 'react'
import { useAuthStore } from '../../../stores/auth-store'
import { useConvexAuth, useQuery } from 'convex/react'
import { api } from '@repo/api/convex/_generated/api'
import { clearAuthTokens, clearUserPreferences, secureStorage } from '../../../utils/storage'

interface AuthSyncProps {
    children: ReactNode
}

/**
 * AuthSync - Monitors authentication state and syncs with Convex backend
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
 */
export function AuthSync({ children }: AuthSyncProps) {
    const { isAuthenticated, isLoading } = useConvexAuth()
    const userQuery = useQuery(
        api.queries.core.getCurrentUserQuery,
        isAuthenticated ? {} : 'skip'
    )

    const isAuthLoading = isLoading;
    const isUserQueryLoading = userQuery === undefined;

    console.log('[auth-sync.tsx] isAuthenticated', isAuthenticated)
    console.log('[auth-sync.tsx] isLoading', isLoading)
    console.log('[auth-sync.tsx] userQuery', !!userQuery)
    console.log('[auth-sync.tsx] isAuthLoading', isAuthLoading)
    console.log('[auth-sync.tsx] isUserQueryLoading', isUserQueryLoading)
    console.log('[auth-sync.tsx] time', new Date().toLocaleTimeString())

    const currentUser = userQuery?.user;
    const setUser = useAuthStore(state => state.setUser);

    // Combined auth sync effect - update Zustand store AND handle storage cleanup
    useEffect(() => {
        // Wait for auth to initialize
        if (isAuthLoading || isUserQueryLoading) {
            console.log('[auth-sync.tsx] 🔄 AuthSync initializing...')
            return;
        }

        // Not authenticated - clear user state and auth tokens
        if (!isAuthenticated) {
            console.log('[auth-sync.tsx] 🚫 Not authenticated, clearing auth tokens')
            setUser(null)
            clearAuthTokens()
            return;
        }

        // Update Zustand store with current user
        setUser(currentUser || null)

        // Handle storage cleanup based on user changes
        const currentUserId = currentUser?._id || null
        const lastUserId = secureStorage.getLastUserId()

        console.log('[auth-sync.tsx] 🔍 User check:', { currentUserId, lastUserId })

        // No current user → logout/session expired scenario
        if (!currentUserId) {
            console.log('[auth-sync.tsx] 🔐 User logged out, clearing auth tokens only')
            clearAuthTokens() // Clear auth tokens, but KEEP preferences and lastUserId
            return
        }

        // Have a user - check if it changed
        if (lastUserId !== currentUserId) {
            console.log('[auth-sync.tsx] 🔐 User changed:', { from: lastUserId, to: currentUserId })

            // Clear previous user's preferences only if there was a previous user
            if (lastUserId) {
                console.log('[auth-sync.tsx]   → Clearing previous user preferences')
                clearUserPreferences() // Clear app preferences, KEEP auth tokens and lastUserId
            } else {
                console.log('[auth-sync.tsx]   → First login, no cleanup needed')
            }

            // Update to new user ID
            secureStorage.setLastUserId(currentUserId)
            console.log('[auth-sync.tsx]   → New user ID saved:', currentUserId)
        }
    }, [currentUser, isAuthenticated, isAuthLoading, isUserQueryLoading, setUser])

    return <>{children}</>
}
