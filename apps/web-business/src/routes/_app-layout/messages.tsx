import { createFileRoute } from '@tanstack/react-router'
import { MessagesPage } from '@/features/messages/components/messages-page'

// Custom component that renders without Main wrapper to avoid padding
function MessagesRoute() {
    return (
        <div className="h-full flex-1 flex flex-col">
            <MessagesPage />
        </div>
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