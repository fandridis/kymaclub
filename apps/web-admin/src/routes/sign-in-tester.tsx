import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router';
import { useAuthActions } from "@convex-dev/auth/react";
import { useState, useEffect } from "react";
import { SpinningCircles } from '@/components/spinning-circles';
import { useCurrentUser } from '@/hooks/use-current-user';

export const Route = createFileRoute('/sign-in-tester')({
    component: RouteComponent,
    validateSearch: (search: Record<string, unknown>) => {
        return {
            redirect: search.redirect as string | undefined,
        };
    },
})

function RouteComponent() {
    const { user, isLoading } = useCurrentUser();
    const navigate = useNavigate();


    console.log('user', user);

    useEffect(() => {
        console.log('user.role', user?.role);
        if (user) {
            navigate({
                to: '/dashboard',
                replace: true,
            })
        }

    }, [user?.role, navigate]);

    if (isLoading || user?.role === "internal") {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-black">
                <SpinningCircles />
            </div>
        )
    }

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

            <div className="relative z-10 w-full max-w-md px-8">
                <SignInTesterForm />
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

export function SignInTesterForm() {
    const { signIn } = useAuthActions();
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { user } = useCurrentUser();

    // Check if user is admin after successful login
    useEffect(() => {
        const checkAdminStatus = () => {
            if (user && user.role !== "internal") {
                setError("Access denied. Internal privileges required.");
                // Logout non-admin users
                setTimeout(() => {
                    window.location.href = '/sign-in-tester';
                }, 2000);
            }
        };

        // Check periodically after login
        const interval = setInterval(checkAdminStatus, 500);
        return () => clearInterval(interval);
    }, [user]);

    return (
        <div className="w-full space-y-8">
            {/* Terminal-style header */}
            <div className="text-center font-mono">
                <div className="text-cyan-400 text-sm mb-2 tracking-wider">
                    {'> AUTHENTICATION_PROTOCOL.EXE'}
                </div>
                <div className="text-green-400 text-xs mb-6">
                    {'[SYSTEM] Internal Access Portal v2.0.1'}
                </div>
                <h1 className="text-5xl md:text-6xl font-black mb-4 tracking-tighter">
                    <span className="text-cyan-400 drop-shadow-[0_0_20px_rgba(6,182,212,0.8)] relative inline-block">
                        <span className="absolute inset-0 text-green-400 blur-sm opacity-75 animate-pulse" style={{ transform: 'translate(2px, 2px)' }}>
                            ADMIN LOGIN
                        </span>
                        ADMIN LOGIN
                    </span>
                </h1>
            </div>

            {/* Terminal-style form container */}
            <div className="bg-black/80 border-2 border-cyan-500/50 p-6 md:p-8 font-mono backdrop-blur-sm shadow-[0_0_30px_rgba(6,182,212,0.3)]">
                <form
                    className="space-y-6"
                    onSubmit={(event) => {
                        event.preventDefault();
                        setSubmitting(true);
                        setError(null);
                        const formData = new FormData(event.currentTarget);
                        formData.set("flow", "signIn");
                        signIn("password", formData)
                            .then(() => {
                                // Check admin status after successful login
                                setTimeout(() => {
                                    if (user && user.role !== "internal") {
                                        setError("Access denied. Internal privileges required.");
                                        setSubmitting(false);
                                    }
                                    // If admin, redirect will happen automatically
                                }, 500);
                            })
                            .catch((err) => {
                                console.error("Authentication error:", err);
                                setError("Invalid email or password");
                                setSubmitting(false);
                            });
                    }}
                >
                    {/* Email field */}
                    <div className="space-y-2">
                        <label htmlFor="email" className="text-cyan-400 text-sm flex items-center gap-2">
                            <span>{'>'}</span>
                            <span>EMAIL_ADDRESS</span>
                        </label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            required
                            className="w-full bg-black/50 border-2 border-cyan-500/30 px-4 py-3 text-green-400 font-mono text-sm focus:outline-none focus:border-cyan-500 focus:shadow-[0_0_15px_rgba(6,182,212,0.5)] transition-all placeholder:text-cyan-400/30"
                            placeholder="user@domain.com"
                        />
                    </div>

                    {/* Password field */}
                    <div className="space-y-2">
                        <label htmlFor="password" className="text-cyan-400 text-sm flex items-center gap-2">
                            <span>{'>'}</span>
                            <span>PASSWORD</span>
                        </label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            required
                            className="w-full bg-black/50 border-2 border-cyan-500/30 px-4 py-3 text-green-400 font-mono text-sm focus:outline-none focus:border-cyan-500 focus:shadow-[0_0_15px_rgba(6,182,212,0.5)] transition-all placeholder:text-cyan-400/30"
                            placeholder="••••••••"
                        />
                    </div>

                    {/* Error message */}
                    {error && (
                        <div className="bg-red-500/20 border-2 border-red-500/50 p-4 text-red-400 text-sm font-mono">
                            <div className="flex items-start gap-2">
                                <span className="text-red-500">{'>'}</span>
                                <span className="animate-pulse">█</span>
                                <span>{error}</span>
                            </div>
                        </div>
                    )}

                    {/* Submit button */}
                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full group relative px-8 py-4 bg-gradient-to-r from-cyan-500/20 to-green-500/20 border-2 border-cyan-500 font-mono text-cyan-400 text-lg tracking-wider uppercase transition-all duration-300 hover:border-green-400 hover:text-green-400 hover:shadow-[0_0_30px_rgba(34,197,94,0.5)] hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                        <span className="relative z-10">
                            {submitting ? '[ AUTHENTICATING... ]' : '[ INITIATE LOGIN ]'}
                        </span>
                        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-green-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <div className="absolute -inset-1 bg-cyan-500/20 blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </button>
                </form>

                {/* Footer terminal text */}
                <div className="mt-6 text-cyan-400/50 text-xs font-mono text-center">
                    {'> Enter credentials to access internal systems...'}
                </div>
            </div>
        </div>
    );
}
