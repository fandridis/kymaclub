import { createRootRoute, Outlet } from '@tanstack/react-router'
import { SciFiNotFound } from '@/components/sci-fi-not-found'

export const Route = createRootRoute({
    component: RootComponent,
    notFoundComponent: SciFiNotFound,
})

function RootComponent() {
    return (
        <div className="min-h-screen flex flex-col">
            <Outlet />
        </div>
    )
}