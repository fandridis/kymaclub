// src/stores/authStore.ts
import { create } from 'zustand'
import type { Doc, Id } from '@repo/api/convex/_generated/dataModel';

// What is returned from the getCurrentUserQuery for user (with guaranteed businessId)
type User = Doc<'users'> & { businessId?: Id<'businesses'> };

// What is returned from the getCurrentUserQuery for business  
type Business = Doc<'businesses'>;

// Type-safe hook for different contexts - User always exists
export type AuthenticatedUser = NonNullable<User>

// Type-safe hook for different contexts - User and business always exists
export type UserWithBusiness = {
    user: AuthenticatedUser;
    business: Business;
    businessId: Id<'businesses'>;
    businessRole: 'owner' | 'admin' | 'user';
}

interface AuthState {
    user: User | null | undefined
    business: Business | null | undefined
}

interface AuthActions {
    setUser: (user: User | null | undefined) => void
    setBusiness: (business: Business | null | undefined) => void
    logout: () => void
}

export type AuthStore = AuthState & AuthActions

export const useAuthStore = create<AuthStore>((set) => ({
    // State
    user: undefined,
    business: undefined,
    // Actions
    setUser: (user: User | null | undefined) => set({
        user: user
    }),
    setBusiness: (business: Business | null | undefined) => set({
        business: business
    }),
    logout: () => set({
        user: null,
        business: null
    })
}))

// Export methods to access store outside React
export const getAuthState = () => useAuthStore.getState()
export const subscribeToAuth = (callback: (state: AuthStore) => void) =>
    useAuthStore.subscribe(callback)


/**
 * Hook for routes that require an authenticated user (but may not have business)
 * Use this in routes like onboarding where user exists but business might not
 */
export function useAuthenticatedUser(): AuthenticatedUser {
    const { user } = useAuthStore()

    if (!user) {
        throw new Error('useAuthenticatedUser: User must be authenticated')
    }

    return user
}

/**
 * Hook for routes that require a user with business context
 * Use this in most business routes (dashboard, profile, etc.)
 */
export function useCurrentUser(): UserWithBusiness {
    const { user, business } = useAuthStore()

    if (!user) {
        throw new Error('useCurrentUser: User must be authenticated')
    }

    if (!business) {
        throw new Error('useCurrentUser: User must have business context')
    }

    // Get business role from user object
    const businessRole = user.businessRole || 'user';
    const businessId = user.businessId || business._id;

    return {
        user,
        business,
        businessId,
        businessRole
    }
}

/**
 * Original hook - use when you need to handle all states (loading, authenticated, not authenticated)
 * Use this in components like AuthSync or root components that handle routing
 */
export function useAuth() {
    return useAuthStore()
}
