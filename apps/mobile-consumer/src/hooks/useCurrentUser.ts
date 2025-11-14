import { useConvexAuth, useQuery } from 'convex/react';
import { api } from '@repo/api/convex/_generated/api';
import type { Doc } from '@repo/api/convex/_generated/dataModel';

type User = Doc<'users'>;

/**
 * Hook to get the current authenticated user from Convex
 * 
 * Uses Convex Auth directly - no Zustand state needed.
 * Returns real-time user data via Convex subscriptions.
 * 
 * @returns Object with:
 *   - user: The current user or null/undefined if not authenticated
 *   - isLoading: Whether auth state is still loading
 * 
 * @example
 * ```tsx
 * const { user, isLoading } = useCurrentUser();
 * 
 * if (isLoading) return <Loading />;
 * if (!user) return <SignIn />;
 * 
 * return <Profile user={user} />;
 * ```
 */
export function useCurrentUser(): {
    user: User | null | undefined;
    isLoading: boolean;
} {
    const { isAuthenticated, isLoading: isAuthLoading } = useConvexAuth();
    const data = useQuery(
        api.queries.core.getCurrentUserQuery,
        isAuthenticated ? {} : 'skip'
    );

    // If auth is still loading, we're loading
    // If auth is done but not authenticated, we skip the query (not loading)
    // If auth is done and authenticated, check if query is still loading
    const isLoading = isAuthLoading || (isAuthenticated && data === undefined);
    const user = data?.user;

    return { user, isLoading };
}

