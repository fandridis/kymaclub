import { getAuthState } from '@/components/stores/auth';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { Header } from '@/components/layout/header';
import { Main } from '@/components/layout/main';
import { SettingsPage } from '@/features/settings/components/settings-page';

export const Route = createFileRoute('/_app-layout/settings')({
    component: RouteComponent,
    beforeLoad: () => {
        const { user } = getAuthState();

        if (user === null) {
            throw redirect({
                to: '/sign-in',
                replace: true,
                search: {
                    redirect: '/settings'
                }
            });
        }
    }
});

function RouteComponent() {
    return (
        <>
            <Header fixed>Settings</Header>

            <Main>
                <SettingsPage />
            </Main>
        </>
    );
}

export default RouteComponent;