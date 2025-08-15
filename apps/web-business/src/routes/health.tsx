import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/health')({
    component: RouteComponent,
})

function RouteComponent() {
    return <div>Hello "/health"!</div>
}
