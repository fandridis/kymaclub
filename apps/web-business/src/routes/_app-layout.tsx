import { AppLayout } from '@/components/layout/app-layout'
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { useRedirectGuard } from '@/hooks/use-redirect-guard'
import { getAuthState } from '@/components/stores/auth'

export const Route = createFileRoute('/_app-layout')({
    component: RouteComponent,
    beforeLoad: async ({ location }) => {
        const { user } = getAuthState();

        if (user === null) {
            throw redirect({
                to: '/sign-in',
                replace: true,
                search: {
                    redirect: location.href
                }
            })
        }
    }
})

function RouteComponent() {
    const { user } = getAuthState();

    useRedirectGuard(({ user }) => {
        if (user === null) {
            return '/sign-in';
        }
        return null;
    })

    if (user === null) {
        return null;
    }

    return (
        <AppLayout>
            <Outlet />
        </AppLayout>
    )
}