import { create } from 'zustand'
import type { Doc } from '@repo/api/convex/_generated/dataModel';

type User = Doc<'users'>;

interface AuthState {
    user: User | null | undefined
    pendingDeepLink: string | null
}

interface AuthActions {
    setUser: (user: User | null | undefined) => void
    logout: () => void
    setPendingDeepLink: (link: string | null) => void
}

export type AuthStore = AuthState & AuthActions

export const useAuthStore = create<AuthStore>((set) => ({
    // State
    user: undefined,
    pendingDeepLink: null,

    // Actions
    setUser: (user: User | null | undefined) => set({ user }),
    logout: () => set({ user: null, pendingDeepLink: null }),
    setPendingDeepLink: (link: string | null) => set({ pendingDeepLink: link }),
}))

export const getAuthState = () => useAuthStore.getState()
export const subscribeToAuth = (callback: (state: AuthStore) => void) =>
    useAuthStore.subscribe(callback)

export function useAuthenticatedUser(): User {
    const { user } = useAuthStore()

    if (!user) {
        throw new Error('useAuthenticatedUser: User must be authenticated')
    }

    return user
}

export function useAuth() {
    return useAuthStore()
}