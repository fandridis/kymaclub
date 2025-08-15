import { createRootRoute, Outlet, Link } from '@tanstack/react-router'
import { Toaster } from "@/components/ui/sonner"

// Create the root route with context
export const Route = createRootRoute({
    component: RootComponent,
})

function RootComponent() {
    return (
        <>
            <div className="flex-1 flex flex-col">
                {/* <nav style={{ padding: '1rem', borderBottom: '1px solid #ccc', display: 'flex', gap: '1rem' }}>
                    <Link to="/">Home</Link>
                    <Link to="/about">About</Link>
                    <Link to="/dashboard">Dashboard</Link>
                </nav> */}
                <Outlet />

            </div>
            <Toaster />
        </>
    )
}