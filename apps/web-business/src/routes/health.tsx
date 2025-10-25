import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/health')({
    component: RouteComponent,
})

function RouteComponent() {
    return <div>It is alive! #7

    </div>
}
