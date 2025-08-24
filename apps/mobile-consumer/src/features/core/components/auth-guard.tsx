import { useEffect, type ReactNode } from 'react'
import { useAuth } from '../../../stores/auth-store'
import * as Linking from 'expo-linking'

interface AuthGuardProps {
    children: ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
    const { user, pendingDeepLink, setPendingDeepLink } = useAuth()
    const url = Linking.useURL()

    console.log('[AuthGuard] renders: ', url)

    // Handle incoming deep links
    useEffect(() => {
        if (url && !user) {
            // User not authenticated, store the deep link for later
            console.log('[AuthGuard] Storing pending deep link:', url)
            setPendingDeepLink(url)
        }
    }, [url, user, setPendingDeepLink])

    // Handle initial deep link when app starts
    useEffect(() => {
        const checkInitialURL = async () => {
            const initialURL = await Linking.getInitialURL()
            if (initialURL && !user) {
                console.log('[AuthGuard] Storing initial deep link:', initialURL)
                setPendingDeepLink(initialURL)
            }
        }

        checkInitialURL()
    }, [user, setPendingDeepLink])

    // Handle pending deep link after authentication
    useEffect(() => {
        if (user && pendingDeepLink) {
            console.log('[AuthGuard] User authenticated, navigating to pending deep link:', pendingDeepLink)

            // Use Linking to handle the deep link (the navigation system will handle it)
            setTimeout(() => {
                Linking.openURL(pendingDeepLink);
                setPendingDeepLink(null);
                console.log('[AuthGuard] Opened pending deep link via Linking');
            }, 500); // Small delay to ensure navigation is ready
        }
    }, [user, pendingDeepLink, setPendingDeepLink])

    return <>{children}</>
}