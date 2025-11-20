import { SpinningCircles } from '@/components/spinning-circles';
import { useCurrentUser } from '@/hooks/use-current-user';
import { createFileRoute, Link, Outlet, redirect } from '@tanstack/react-router';
import { useAuthActions } from '@convex-dev/auth/react';
import { Button } from '@/components/ui/button';

export const Route = createFileRoute('/_app-layout')({
    component: RouteComponent,
})

function RouteComponent() {
    const { user, isLoading } = useCurrentUser();
    const { signOut } = useAuthActions();

    if (isLoading) {
        return (
            <div className="h-screen w-screen flex items-center justify-center">
                <SpinningCircles />
            </div>
        )
    }

    if (user === null || user?.role !== "internal") {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-black relative overflow-hidden">
                {/* Animated grid background */}
                <div className="absolute inset-0 opacity-20">
                    <div className="absolute inset-0" style={{
                        backgroundImage: `
                            linear-gradient(cyan 1px, transparent 1px),
                            linear-gradient(90deg, cyan 1px, transparent 1px)
                        `,
                        backgroundSize: '50px 50px',
                        animation: 'gridMove 20s linear infinite'
                    }} />
                </div>

                {/* Glitch overlay effect */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute inset-0 bg-cyan-500/5 animate-pulse" style={{
                        clipPath: 'polygon(0 0, 100% 0, 100% 35%, 0 35%)',
                        animation: 'glitch1 1.5s infinite'
                    }} />
                    <div className="absolute inset-0 bg-green-500/5 animate-pulse" style={{
                        clipPath: 'polygon(0 65%, 100% 65%, 100% 100%, 0 100%)',
                        animation: 'glitch2 1.5s infinite 0.2s'
                    }} />
                </div>

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

                {/* Add keyframe animations */}
                <style>{`
                    @keyframes gridMove {
                        0% { transform: translate(0, 0); }
                        100% { transform: translate(50px, 50px); }
                    }
                    @keyframes glitch1 {
                        0%, 100% { transform: translate(0); }
                        20% { transform: translate(-2px, 2px); }
                        40% { transform: translate(-2px, -2px); }
                        60% { transform: translate(2px, 2px); }
                        80% { transform: translate(2px, -2px); }
                    }
                    @keyframes glitch2 {
                        0%, 100% { transform: translate(0); }
                        20% { transform: translate(2px, -2px); }
                        40% { transform: translate(2px, 2px); }
                        60% { transform: translate(-2px, -2px); }
                        80% { transform: translate(-2px, 2px); }
                    }
                `}</style>
            </div>
        )
    }

    const handleLogout = async () => {
        await signOut();
        window.location.href = '/sign-in-tester';
    };

    return (
        <div className="min-h-screen">
            <header className="border-b bg-background">
                <div className="container mx-auto px-4 py-3 flex justify-end">
                    <Button
                        variant="outline"
                        onClick={handleLogout}
                    >
                        Logout
                    </Button>
                </div>
            </header>
            <Outlet />
        </div>
    )
}
