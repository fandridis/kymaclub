import { Header } from '@/components/layout/header'
import { TournamentManagementPage } from '@/features/tournaments/components/tournament-management-page'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app-layout/tournaments/$widgetId')({
    component: RouteComponent,
})

function RouteComponent() {
    const { widgetId } = Route.useParams();

    return (
        <>
            <Header fixed hideNotifications>
                <span className="sr-only">Tournament Management</span>
            </Header>
            {/* Full-width container for mobile-first tournament UI */}
            <main className="flex-1 peer-[.header-fixed]/header:mt-16">
                <TournamentManagementPage widgetId={widgetId} />
            </main>
        </>
    );
}
