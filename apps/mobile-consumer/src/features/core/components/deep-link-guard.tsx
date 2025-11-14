import { useEffect, useState, createContext, useContext, type ReactNode } from 'react'
import { useCurrentUser } from '../../../hooks/useCurrentUser'
import * as Linking from 'expo-linking'

interface PendingDeepLinkContextValue {
    pendingDeepLink: string | null;
    setPendingDeepLink: (link: string | null) => void;
}

const PendingDeepLinkContext = createContext<PendingDeepLinkContextValue | undefined>(undefined);

interface DeepLinkGuardProps {
    children: ReactNode
}

// Helper to check if a URL is a payment result URL (should not be stored as pending)
function isPaymentResultUrl(url: string | null): boolean {
    if (!url) return false
    return url.includes('/payment/success') || url.includes('/payment/cancel')
}

/**
 * DeepLinkGuard - Handles deep link management and provides context
 * 
 * Combines:
 * - State management for pending deep links (Context Provider)
 * - Logic for storing/processing deep links when user is not authenticated
 * 
 * Stores deep links that arrive when user is not authenticated,
 * so they can be processed after authentication.
 */
export function DeepLinkGuard({ children }: DeepLinkGuardProps) {
    const [pendingDeepLink, setPendingDeepLink] = useState<string | null>(null);
    const { user } = useCurrentUser()
    const url = Linking.useURL()

    // Handle incoming deep links
    useEffect(() => {
        if (url && !user) {
            // Don't store payment result URLs as pending - they should only be processed once
            if (isPaymentResultUrl(url)) {
                // Payment URLs require authentication, so just ignore them if user is not logged in
                // They will be handled by the NavigationContainer linking config when user is authenticated
                return
            }
            // User not authenticated, store the deep link for later
            setPendingDeepLink(url)
        }
    }, [url, user, setPendingDeepLink])

    // Handle initial deep link when app starts
    useEffect(() => {
        const checkInitialURL = async () => {
            const initialURL = await Linking.getInitialURL()
            // Don't store payment result URLs as pending - they're one-time use
            if (initialURL && !user && !isPaymentResultUrl(initialURL)) {
                setPendingDeepLink(initialURL)
            }
        }

        checkInitialURL()
    }, [user, setPendingDeepLink])

    // Handle pending deep link after authentication
    useEffect(() => {
        if (user && pendingDeepLink) {
            // Double-check: don't process payment URLs that somehow got stored
            if (isPaymentResultUrl(pendingDeepLink)) {
                // Clear it immediately - payment URLs should only be processed via direct navigation
                setPendingDeepLink(null)
                return
            }

            console.log('There is user and pending deep link', pendingDeepLink)
            // Use Linking to handle the deep link (the navigation system will handle it)
            setTimeout(() => {
                Linking.openURL(pendingDeepLink);
                setPendingDeepLink(null);
            }, 500); // Small delay to ensure navigation is ready
        }
    }, [user, pendingDeepLink, setPendingDeepLink])

    return (
        <PendingDeepLinkContext.Provider value={{ pendingDeepLink, setPendingDeepLink }}>
            {children}
        </PendingDeepLinkContext.Provider>
    )
}

/**
 * Hook to access pending deep link state
 */
export function usePendingDeepLink() {
    const context = useContext(PendingDeepLinkContext);
    if (context === undefined) {
        throw new Error('usePendingDeepLink must be used within DeepLinkGuard');
    }
    return context;
}
