import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/health')({
    component: RouteComponent,
})

function RouteComponent() {
    return <div>It is alive! #2</div>
}
