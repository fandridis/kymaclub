import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useAuthActions } from "@convex-dev/auth/react";
import { useState, useEffect } from "react";
import { NexusLoader, ParticleBackground } from '@/components/nexus';
import { useCurrentUser } from '@/hooks/use-current-user';
import { Button } from '@/components/ui/button';
import { Hexagon } from 'lucide-react';
import { PasswordReset } from '@/components/auth/password-reset';

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

    useEffect(() => {
        if (user) {
            navigate({
                to: '/dashboard',
                replace: true,
            })
        }
    }, [user?.role, navigate]);

    if (isLoading || user?.role === "internal") {
        return (
            <div className="min-h-screen nexus-bg relative">
                <ParticleBackground />
                <NexusLoader fullScreen={true} />
            </div>
        )
    }

    return (
        <div className="min-h-screen nexus-bg relative overflow-hidden flex items-center justify-center">
            <ParticleBackground />
            <div className="relative z-10 w-full max-w-md px-6">
                <SignInTesterForm />
            </div>
        </div>
    )
}

export function SignInTesterForm() {
    const { signIn } = useAuthActions();
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [mode, setMode] = useState<"signIn" | "reset">("signIn");
    const { user } = useCurrentUser();

    // Check if user is admin after successful login
    useEffect(() => {
        const checkAdminStatus = () => {
            if (user && user.role !== "internal") {
                setError("Access denied. Internal privileges required.");
                setTimeout(() => {
                    window.location.href = '/sign-in-tester';
                }, 2000);
            }
        };

        const interval = setInterval(checkAdminStatus, 500);
        return () => clearInterval(interval);
    }, [user]);

    if (mode === "reset") {
        return <PasswordReset onCancel={() => setMode("signIn")} />;
    }

    return (
        <div className="w-full space-y-6">
            {/* Header */}
            <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-4">
                    <Hexagon className="h-10 w-10 text-cyan-500" />
                    <span className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                        KYMACLUB
                    </span>
                </div>
                <h1 className="text-3xl font-bold text-slate-100 mb-2">Internal Access</h1>
                <p className="text-slate-400 text-sm">Sign in to the admin dashboard</p>
            </div>

            {/* Form container */}
            <div className="bg-slate-900/80 border border-slate-700/50 p-6 rounded-lg backdrop-blur-sm shadow-[0_0_30px_rgba(6,182,212,0.1)]">
                <form
                    className="space-y-5"
                    onSubmit={(event) => {
                        event.preventDefault();
                        setSubmitting(true);
                        setError(null);
                        const formData = new FormData(event.currentTarget);
                        formData.set("flow", "signIn");
                        signIn("password", formData)
                            .then(() => {
                                setTimeout(() => {
                                    if (user && user.role !== "internal") {
                                        setError("Access denied. Internal privileges required.");
                                        setSubmitting(false);
                                    }
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
                        <label htmlFor="email" className="text-sm text-slate-400">
                            Email address
                        </label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            required
                            className="w-full bg-slate-800/50 border border-slate-700/50 rounded-md px-4 py-3 text-slate-200 text-sm focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all placeholder:text-slate-500"
                            placeholder="admin@example.com"
                        />
                    </div>

                    {/* Password field */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <label htmlFor="password" className="text-sm text-slate-400">
                                Password
                            </label>
                            <button
                                type="button"
                                onClick={() => setMode("reset")}
                                className="text-cyan-400/70 hover:text-cyan-400 text-xs transition-colors"
                            >
                                Forgot password?
                            </button>
                        </div>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            required
                            className="w-full bg-slate-800/50 border border-slate-700/50 rounded-md px-4 py-3 text-slate-200 text-sm focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all placeholder:text-slate-500"
                            placeholder="••••••••"
                        />
                    </div>

                    {/* Error message */}
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/30 rounded-md p-3 text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Submit button */}
                    <Button
                        type="submit"
                        disabled={submitting}
                        className="w-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/50 hover:bg-cyan-500/30 h-12 text-sm font-medium"
                    >
                        {submitting ? 'Authenticating...' : 'Sign in'}
                    </Button>
                </form>

                {/* Footer */}
                <div className="mt-6 text-center">
                    <p className="text-slate-500 text-xs">
                        This portal is for internal use only
                    </p>
                </div>
            </div>
        </div>
    );
}
