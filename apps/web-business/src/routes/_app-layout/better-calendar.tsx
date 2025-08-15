import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app-layout/better-calendar')({
    component: RouteComponent,
})

function RouteComponent() {
    return <div>Better Calendar</div>
}
