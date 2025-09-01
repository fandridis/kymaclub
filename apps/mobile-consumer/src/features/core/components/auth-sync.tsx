import { useEffect, type ReactNode } from 'react'
import { useAuthStore } from '../../../stores/auth-store'
import { useQuery } from 'convex/react'
import { api } from '@repo/api/convex/_generated/api'

interface AuthSyncProps {
    children: ReactNode
}

export function AuthSync({ children }: AuthSyncProps) {
    const userQuery = useQuery(api.queries.core.getCurrentUserQuery)
    const currentUser = userQuery?.user

    const setUser = useAuthStore(state => state.setUser)

    useEffect(() => {
        if (userQuery === undefined) {
            return
        }
        setUser(currentUser || null)
    }, [currentUser, setUser, userQuery])

    return <>{children}</>
}