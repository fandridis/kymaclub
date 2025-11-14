import { createFileRoute, redirect } from '@tanstack/react-router';
import { getAuthState, useAuth } from '@/components/stores/auth';
import { Header } from '@/components/layout/header';
import { Main } from '@/components/layout/main';
import { SpinningCircles } from '@/components/spinning-circles';
import DashboardPage from '@/features/dashboard/components/dashboard-page';
import { useTypedTranslation } from '@/lib/typed';

export const Route = createFileRoute('/_app-layout/dashboard')({
    component: Dashboard,
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
});

function Dashboard() {
    const { user, business } = useAuth();
    const { t } = useTypedTranslation();


    /**
     * Most of the times we can use useCurrentUser where the user is always defined.
     * But in routes where we have a logout action, we use useAuth() to handle the
     * brief time where the user does not exist, until we get redirected.
     */
    if (!user || !business) {
        return (
            <div className="h-screen w-screen flex items-center justify-center">
                <SpinningCircles />
            </div>
        );
    }

    return (
        <>
            <Header fixed title={t('routes.dashboard.title')} />
            <Main>
                <DashboardPage />
            </Main>
        </>
    );
}