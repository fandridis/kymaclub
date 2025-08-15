import { useEffect, type ReactNode } from 'react'
import { useAuthStore } from '../components/stores/auth'
import { useQuery } from 'convex-helpers/react/cache/hooks';
import { api } from '@repo/api/convex/_generated/api';

interface AuthSyncProps {
    children: ReactNode
}

export function AuthSync({ children }: AuthSyncProps) {
    const data = useQuery(api.queries.core.getCurrentUserQuery);
    const currentUser = data?.user;
    const business = data?.business;

    const setUser = useAuthStore(state => state.setUser);
    const setBusiness = useAuthStore(state => state.setBusiness);

    useEffect(() => {
        if (currentUser === undefined || business === undefined) {
            return;
        }
        setUser(currentUser)
        setBusiness(business)
    }, [currentUser, setUser, business, setBusiness])

    return <>{children}</>
}           