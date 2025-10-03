import { useEffect, type ReactNode } from 'react'
import { useAuth } from '../../../stores/auth-store'
import * as Linking from 'expo-linking'

interface DeepLinkGuardProps {
    children: ReactNode
}

export function DeepLinkGuard({ children }: DeepLinkGuardProps) {
    const { user, pendingDeepLink, setPendingDeepLink } = useAuth()
    const url = Linking.useURL()


    // Handle incoming deep links
    useEffect(() => {
        if (url && !user) {
            // User not authenticated, store the deep link for later
            setPendingDeepLink(url)
        }
    }, [url, user, setPendingDeepLink])

    // Handle initial deep link when app starts
    useEffect(() => {
        const checkInitialURL = async () => {
            const initialURL = await Linking.getInitialURL()
            if (initialURL && !user) {
                setPendingDeepLink(initialURL)
            }
        }

        checkInitialURL()
    }, [user, setPendingDeepLink])

    // Handle pending deep link after authentication
    useEffect(() => {
        if (user && pendingDeepLink) {
            console.log('There is user and pending deep link', pendingDeepLink)
            // Use Linking to handle the deep link (the navigation system will handle it)
            setTimeout(() => {
                Linking.openURL(pendingDeepLink);
                setPendingDeepLink(null);
            }, 500); // Small delay to ensure navigation is ready
        }
    }, [user, pendingDeepLink, setPendingDeepLink])

    return <>{children}</>
}
