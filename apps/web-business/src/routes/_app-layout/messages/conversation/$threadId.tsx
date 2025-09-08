import { createFileRoute } from '@tanstack/react-router'
import { ConversationPage } from '@/features/messages/components/conversation-page'

export const Route = createFileRoute('/_app-layout/messages/conversation/$threadId')({
    component: ConversationPage,
    validateSearch: (search: Record<string, unknown>) => ({
        userName: search.userName as string | undefined,
        venueName: search.venueName as string | undefined,
    }),
})