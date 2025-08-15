// src/hooks/useRedirectIf.ts
import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from '@tanstack/react-router';
import { useAuthStore, type AuthStore } from '@/components/stores/auth';

type RedirectLogicParams = AuthStore & {
    location: ReturnType<typeof useLocation>;
    search: Record<string, string>;
    navigate: ReturnType<typeof useNavigate>;
};

/**
 * A hook that redirects the user based on live authentication state changes and current location.
 *
 * @param logic A function that receives the auth state, location, parsed search params, and navigate function. 
 *               Can either return a path to redirect to, or call navigate directly and return null/undefined.
 */
export function useRedirectGuard(
    logic: (params: RedirectLogicParams) => string | null | undefined
) {
    const authState = useAuthStore();
    const navigate = useNavigate();
    const location = useLocation();
    const hasRedirectedRef = useRef(false);

    // Parse search params manually from location.search
    const search = Object.fromEntries(new URLSearchParams(location.search));

    // Determine the redirect path on every render based on the current auth state and location
    const redirectTo = logic({
        ...authState,
        location,
        search,
        navigate
    });

    useEffect(() => {
        // Only navigate if a path is returned and we haven't already started a redirect.
        // The ref prevents multiple navigations during re-renders.
        if (redirectTo && !hasRedirectedRef.current) {
            hasRedirectedRef.current = true;
            navigate({ to: redirectTo, replace: true });
        }

        // Reset the ref if the redirect condition is no longer met,
        // allowing for a new redirect if the state changes again.
        if (!redirectTo) {
            hasRedirectedRef.current = false;
        }

    }, [redirectTo, navigate]);
}