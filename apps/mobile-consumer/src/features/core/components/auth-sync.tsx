import { useEffect, type ReactNode } from 'react'
import { useAuthStore } from '../../../stores/auth-store'
import { useConvexAuth, useQuery } from 'convex/react'
import { api } from '@repo/api/convex/_generated/api'

interface AuthSyncProps {
    children: ReactNode
}

export function AuthSync({ children }: AuthSyncProps) {
    const { isAuthenticated, isLoading } = useConvexAuth()
    const userQuery = useQuery(
        api.queries.core.getCurrentUserQuery,
        isAuthenticated ? {} : 'skip'
    )

    console.log('[auth-sync.tsx] isAuthenticated', isAuthenticated)
    console.log('[auth-sync.tsx] isLoading', isLoading)
    console.log('[auth-sync.tsx] userQuery', userQuery)
    // logg the time in hh:mm:ss
    console.log('[auth-sync.tsx] time', new Date().toLocaleTimeString())

    const currentUser = userQuery?.user

    const setUser = useAuthStore(state => state.setUser)

    useEffect(() => {
        if (isLoading) {
            return
        }
        if (!isAuthenticated) {
            setUser(null)
            return
        }
        if (userQuery === undefined) {
            return
        }
        setUser(currentUser || null)
    }, [currentUser, isAuthenticated, isLoading, setUser, userQuery])

    return <>{children}</>
}
