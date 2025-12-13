import { createFileRoute, Link, Outlet, useLocation } from '@tanstack/react-router';
import { useAuthActions } from '@convex-dev/auth/react';
import { useCurrentUser } from '@/hooks/use-current-user';
import {
    ParticleBackground,
    NexusSidebar,
    NexusHeader,
    NexusRightSidebar,
    NexusLoader,
} from '@/components/nexus';

export const Route = createFileRoute('/_app-layout')({
    component: RouteComponent,
})

function RouteComponent() {
    const { user, isLoading } = useCurrentUser();
    const { signOut } = useAuthActions();
    const location = useLocation();

    // Show loading state
    if (isLoading) {
        return (
            <div className="min-h-screen nexus-bg">
                <ParticleBackground />
                <NexusLoader fullScreen={true} />
            </div>
        );
    }

    // Unauthorized access screen
    if (user === null || user?.role !== "internal") {
        return (
            <div className="min-h-screen nexus-bg relative overflow-hidden">
                <ParticleBackground />
                <div className="relative z-10 flex items-center justify-center min-h-screen px-8">
                    <div className="text-center max-w-2xl">
                        {/* Terminal header */}
                        <div className="mb-8 font-mono">
                            <div className="text-cyan-400 text-sm mb-2 tracking-wider">
                                {'> ACCESS_DENIED.EXE'}
                            </div>
                            <div className="text-green-400 text-xs mb-4">
                                {'[SYSTEM] Security Protocol v2.0.1'}
                            </div>
                        </div>

                        {/* Error message */}
                        <h1 className="text-5xl md:text-7xl font-black mb-4 tracking-tighter">
                            <span className="text-red-500 drop-shadow-[0_0_30px_rgba(239,68,68,0.6)]">
                                UNAUTHORIZED
                            </span>
                        </h1>
                        <div className="text-cyan-400 text-lg font-mono mt-4 tracking-wider mb-8">
                            {'[ERROR_CODE: 0x4E4F5F414343455353]'}
                        </div>

                        {/* Terminal message */}
                        <div className="bg-slate-900/80 border border-slate-700/50 p-6 mb-8 font-mono text-left backdrop-blur-sm rounded-lg shadow-[0_0_30px_rgba(6,182,212,0.15)]">
                            <div className="space-y-2 text-green-400 text-sm">
                                <div className="flex items-start gap-2">
                                    <span className="text-cyan-400">{'>'}</span>
                                    <span className="animate-pulse">█</span>
                                    <span>User authentication failed</span>
                                </div>
                                <div className="flex items-start gap-2">
                                    <span className="text-cyan-400">{'>'}</span>
                                    <span className="animate-pulse">█</span>
                                    <span>Insufficient clearance level</span>
                                </div>
                                <div className="flex items-start gap-2">
                                    <span className="text-cyan-400">{'>'}</span>
                                    <span className="animate-pulse">█</span>
                                    <span>Access requires: INTERNAL_ROLE</span>
                                </div>
                                <div className="flex items-start gap-2">
                                    <span className="text-cyan-400">{'>'}</span>
                                    <span className="animate-pulse">█</span>
                                    <span className="text-red-400">Current clearance: {user ? 'USER' : 'NULL'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Action buttons */}
                        {user ? (
                            <button
                                onClick={async () => {
                                    await signOut();
                                    window.location.href = '/sign-in-tester';
                                }}
                                className="px-8 py-4 bg-red-500/10 border border-red-500/50 font-mono text-red-400 tracking-wider uppercase transition-all duration-300 hover:bg-red-500/20 hover:border-red-400 hover:shadow-[0_0_30px_rgba(239,68,68,0.3)] rounded-lg"
                            >
                                [ DESTROY SESSION ]
                            </button>
                        ) : (
                            <Link
                                to="/sign-in-tester"
                                search={(prev) => ({ ...prev, redirect: window.location.href })}
                                className="inline-block px-8 py-4 bg-cyan-500/10 border border-cyan-500/50 font-mono text-cyan-400 tracking-wider uppercase transition-all duration-300 hover:bg-cyan-500/20 hover:border-cyan-400 hover:shadow-[0_0_30px_rgba(6,182,212,0.3)] rounded-lg"
                            >
                                [ AUTHENTICATE ]
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    const handleLogout = async () => {
        await signOut();
        window.location.href = '/sign-in-tester';
    };

    // Check if we're on a detail page that should hide the right sidebar
    const isDetailPage = location.pathname.startsWith('/businesses/') || location.pathname.startsWith('/consumers/');

    return (
        <div className="min-h-screen nexus-bg relative overflow-hidden">
            {/* Background particle effect */}
            <ParticleBackground />

            {/* Main layout */}
            <div className="relative z-10 flex flex-col h-screen">
                {/* Header */}
                <NexusHeader
                    userName={user?.name}
                    userEmail={user?.email}
                />

                {/* Content area */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Left Sidebar */}
                    <aside className="hidden md:flex w-56 flex-shrink-0">
                        <NexusSidebar onLogout={handleLogout} />
                    </aside>

                    {/* Main Content */}
                    <main className="flex-1 overflow-y-auto nexus-scrollbar">
                        <Outlet />
                    </main>

                    {/* Right Sidebar - hide on detail pages */}
                    {!isDetailPage && (
                        <aside className="hidden lg:block w-80 flex-shrink-0 border-l border-slate-700/50 bg-slate-900/30 backdrop-blur-sm">
                            <NexusRightSidebar />
                        </aside>
                    )}
                </div>
            </div>
        </div>
    );
}
