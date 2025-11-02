import { getAuthState } from '@/components/stores/auth';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { Header } from '@/components/layout/header';
import { Main } from '@/components/layout/main';
import { SettingsPage } from '@/features/settings/components/settings-page';
import { useTypedTranslation } from '@/lib/typed';

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
    const { t } = useTypedTranslation();
    return (
        <>
            <Header fixed title={t('routes.settings.title')} />

            <Main>
                <SettingsPage />
            </Main>
        </>
    );
}