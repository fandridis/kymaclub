import { createFileRoute } from '@tanstack/react-router'
import { MessagesPage } from '@/features/messages/components/messages-page'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'

// Custom component that renders without Main wrapper to avoid padding
function MessagesRoute() {
    return (
        <>
            <Header fixed title="Messages" />
            <Main className="p-0">
                <div className="h-full flex-1 flex flex-col">
                    <MessagesPage />
                </div>
            </Main>
        </>
    )
}

export const Route = createFileRoute('/_app-layout/messages')({
    component: MessagesRoute,
    validateSearch: (search: Record<string, unknown>) => ({
        threadId: search.threadId as string | undefined,
        userName: search.userName as string | undefined,
        venueName: search.venueName as string | undefined,
    }),
})