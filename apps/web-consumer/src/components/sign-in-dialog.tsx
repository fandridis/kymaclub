import { useNavigate } from '@tanstack/react-router'
import { useAuthActions } from '@convex-dev/auth/react'
import { useState } from 'react'
import { SignInWithGitHub } from './sign-up-with-github'

interface SignInDialogProps {
    isOpen: boolean
    onClose: () => void
    redirectTo?: string
}

export function SignInDialog({ isOpen, onClose, redirectTo = '/' }: SignInDialogProps) {
    const navigate = useNavigate();
    const { signIn } = useAuthActions();
    const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);

        const formData = new FormData(e.target as HTMLFormElement);
        formData.set("flow", flow);

        try {
            await signIn("password", formData);
            onClose();
            navigate({ to: redirectTo });
        } catch (error: any) {
            setError(error.message);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Dialog */}
            <div className="relative bg-light dark:bg-dark border-2 border-slate-200 dark:border-slate-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-xl"
                    aria-label="Close dialog"
                >
                    ×
                </button>

                {/* Dialog content */}
                <div className="flex flex-col gap-6">
                    <div>
                        <h2 className="text-2xl font-semibold text-dark dark:text-light mb-2">
                            Sign In Required
                        </h2>
                        <p className="text-slate-600 dark:text-slate-400">
                            You need to sign in to access this page
                        </p>
                    </div>

                    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
                        <input
                            className="bg-light dark:bg-dark text-dark dark:text-light rounded-md p-3 border-2 border-slate-200 dark:border-slate-800 focus:border-blue-500 dark:focus:border-blue-400 outline-none transition-colors"
                            type="email"
                            name="email"
                            placeholder="Email"
                            required
                        />
                        <input
                            className="bg-light dark:bg-dark text-dark dark:text-light rounded-md p-3 border-2 border-slate-200 dark:border-slate-800 focus:border-blue-500 dark:focus:border-blue-400 outline-none transition-colors"
                            type="password"
                            name="password"
                            placeholder="Password"
                            required
                        />
                        <button
                            className="bg-dark dark:bg-light text-light dark:text-dark rounded-md p-3 font-medium hover:opacity-90 transition-opacity"
                            type="submit"
                        >
                            {flow === "signIn" ? "Sign in" : "Sign up"}
                        </button>

                        <div className="flex flex-row gap-2 justify-center text-sm">
                            <span className="text-slate-600 dark:text-slate-400">
                                {flow === "signIn"
                                    ? "Don't have an account?"
                                    : "Already have an account?"}
                            </span>
                            <button
                                type="button"
                                className="text-blue-600 dark:text-blue-400 underline hover:no-underline"
                                onClick={() => setFlow(flow === "signIn" ? "signUp" : "signIn")}
                            >
                                {flow === "signIn" ? "Sign up" : "Sign in"}
                            </button>
                        </div>

                        <SignInWithGitHub />

                        {error && (
                            <div className="bg-red-500/20 border-2 border-red-500/50 rounded-md p-3">
                                <p className="text-red-700 dark:text-red-300 text-sm">
                                    {error}
                                </p>
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </div>
    );
}
