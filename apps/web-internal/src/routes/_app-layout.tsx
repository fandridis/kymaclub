import { SciFiLoader } from '@/components/sci-fi-loader';
import { useCurrentUser } from '@/hooks/use-current-user';
import { createFileRoute, Link, Outlet, redirect } from '@tanstack/react-router';
import { useAuthActions } from '@convex-dev/auth/react';
import { AdminButton } from '@/components/admin-button';
import { SciFiBackground } from '@/components/ui/sci-fi-background';

export const Route = createFileRoute('/_app-layout')({
    component: RouteComponent,
})

function RouteComponent() {
    const { user, isLoading } = useCurrentUser();
    const { signOut } = useAuthActions();

    if (isLoading) {
        return (
            <SciFiBackground className="flex items-center justify-center">
                <SciFiLoader fullScreen={true} />
            </SciFiBackground>
        )
    }

    if (user === null || user?.role !== "internal") {
        return (
            <SciFiBackground className="flex items-center justify-center">

                <div className="relative z-10 text-center px-8 max-w-4xl">
                    {/* Terminal-style header */}
                    <div className="mb-8 font-mono">
                        <div className="text-cyan-400 text-sm mb-2 tracking-wider">
                            {'> ACCESS_DENIED.EXE'}
                        </div>
                        <div className="text-green-400 text-xs mb-4">
                            {'[SYSTEM] Security Protocol v2.0.1'}
                        </div>
                    </div>

                    {/* Main error message with glitch effect */}
                    <div className="relative mb-8">
                        <h1 className="text-6xl md:text-8xl font-black mb-4 tracking-tighter">
                            <span className="text-red-500 drop-shadow-[0_0_20px_rgba(239,68,68,0.8)] relative inline-block">
                                <span className="absolute inset-0 text-cyan-400 blur-sm opacity-75 animate-pulse" style={{ transform: 'translate(2px, 2px)' }}>
                                    UNAUTHORIZED
                                </span>
                                UNAUTHORIZED
                            </span>
                        </h1>
                        <div className="text-cyan-400 text-lg md:text-xl font-mono mt-4 tracking-wider">
                            {'[ERROR_CODE: 0x4E4F5F414343455353]'}
                        </div>
                    </div>

                    {/* Terminal-style message */}
                    <div className="bg-black/80 border-2 border-cyan-500/50 p-6 md:p-8 mb-8 font-mono text-left backdrop-blur-sm shadow-[0_0_30px_rgba(6,182,212,0.3)]">
                        <div className="space-y-2 text-green-400 text-sm md:text-base">
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
                            <div className="flex items-start gap-2 mt-4">
                                <span className="text-cyan-400">{'>'}</span>
                                <span className="animate-pulse">█</span>
                                <span className="text-yellow-400">System locked. Initiating security protocol...</span>
                            </div>
                        </div>
                    </div>

                    {/* Action button with sci-fi styling */}
                    {user ? (
                        <>
                            <button
                                onClick={async () => {
                                    await signOut();
                                    window.location.href = '/sign-in-tester';
                                }}
                                className="inline-block group relative"
                            >
                                <div className="relative px-8 py-4 bg-gradient-to-r from-red-500/20 to-orange-500/20 border-2 border-red-500 font-mono text-red-400 text-lg tracking-wider uppercase transition-all duration-300 hover:border-orange-400 hover:text-orange-400 hover:shadow-[0_0_30px_rgba(251,146,60,0.5)] hover:scale-105">
                                    <span className="relative z-10">[ DESTROY SESSION ]</span>
                                    <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                    <div className="absolute -inset-1 bg-red-500/20 blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                </div>
                            </button>
                            <div className="mt-8 text-red-400/50 text-xs font-mono">
                                {'> Press [DESTROY SESSION] to terminate current connection...'}
                            </div>
                        </>
                    ) : (
                        <>
                            <Link
                                to="/sign-in-tester"
                                search={{ redirect: window.location.href }}
                                className="inline-block group relative"
                            >
                                <div className="relative px-8 py-4 bg-gradient-to-r from-cyan-500/20 to-green-500/20 border-2 border-cyan-500 font-mono text-cyan-400 text-lg tracking-wider uppercase transition-all duration-300 hover:border-green-400 hover:text-green-400 hover:shadow-[0_0_30px_rgba(34,197,94,0.5)] hover:scale-105">
                                    <span className="relative z-10">[ AUTHENTICATE ]</span>
                                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-green-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                    <div className="absolute -inset-1 bg-cyan-500/20 blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                </div>
                            </Link>
                            <div className="mt-8 text-cyan-400/50 text-xs font-mono">
                                {'> Press [AUTHENTICATE] to continue...'}
                            </div>
                        </>
                    )}
                </div>

            </SciFiBackground>
        )
    }

    const handleLogout = async () => {
        await signOut();
        window.location.href = '/sign-in-tester';
    };

    return (
        <SciFiBackground>

            <div className="relative z-10">
                <header className="border-b border-cyan-500/30 bg-black/50 backdrop-blur-sm">
                    <div className="container mx-auto px-4 py-3 flex justify-end">
                        <AdminButton
                            variant="destructive"
                            size="sm"
                            onClick={handleLogout}
                        >
                            logout
                        </AdminButton>
                    </div>
                </header>
                <Outlet />
            </div>

        </SciFiBackground>
    )
}
