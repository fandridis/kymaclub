import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import { AdminButton } from "@/components/admin-button";

export function PasswordReset({ onCancel }: { onCancel: () => void }) {
    const { signIn } = useAuthActions();
    const [step, setStep] = useState<"forgot" | { email: string }>("forgot");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    return step === "forgot" ? (
        <div className="space-y-8">
            <div className="text-center font-mono">
                <h2 className="text-3xl font-bold text-cyan-400 mb-2">RESET PASSWORD</h2>
                <p className="text-cyan-400/70 text-sm">Enter your email to receive a reset code</p>
            </div>

            <form
                className="space-y-6"
                onSubmit={(event) => {
                    event.preventDefault();
                    setSubmitting(true);
                    setError(null);
                    const formData = new FormData(event.currentTarget);
                    const email = formData.get("email") as string;

                    // Add flow parameter
                    formData.set("flow", "reset");

                    signIn("password", formData)
                        .then(() => {
                            setStep({ email });
                            setSubmitting(false);
                        })
                        .catch((err) => {
                            console.error("Reset error:", err);
                            setError("Failed to send reset code. Please check your email.");
                            setSubmitting(false);
                        });
                }}
            >
                <div className="space-y-2">
                    <label htmlFor="email" className="text-cyan-400 text-sm flex items-center gap-2">
                        <span>{'>'}</span>
                        <span>EMAIL_ADDRESS</span>
                    </label>
                    <input
                        name="email"
                        type="email"
                        required
                        className="w-full bg-black/50 border-2 border-cyan-500/30 px-4 py-3 text-green-400 font-mono text-sm focus:outline-none focus:border-cyan-500 focus:shadow-[0_0_15px_rgba(6,182,212,0.5)] transition-all placeholder:text-cyan-400/30"
                        placeholder="user@domain.com"
                    />
                </div>

                {error && (
                    <div className="bg-red-500/20 border-2 border-red-500/50 p-4 text-red-400 text-sm font-mono">
                        <div className="flex items-start gap-2">
                            <span className="text-red-500">{'>'}</span>
                            <span className="animate-pulse">█</span>
                            <span>{error}</span>
                        </div>
                    </div>
                )}

                <div className="space-y-4">
                    <AdminButton
                        type="submit"
                        variant="primary"
                        size="xl"
                        disabled={submitting}
                        className="w-full"
                    >
                        {submitting ? 'sending code...' : 'send reset code'}
                    </AdminButton>

                    <button
                        type="button"
                        onClick={onCancel}
                        className="w-full text-cyan-400/50 hover:text-cyan-400 text-sm font-mono transition-colors"
                    >
                        {'< BACK_TO_LOGIN'}
                    </button>
                </div>
            </form>
        </div>
    ) : (
        <div className="space-y-8">
            <div className="text-center font-mono">
                <h2 className="text-3xl font-bold text-cyan-400 mb-2">VERIFY CODE</h2>
                <p className="text-cyan-400/70 text-sm">Enter the code sent to {step.email}</p>
            </div>

            <form
                className="space-y-6"
                onSubmit={(event) => {
                    event.preventDefault();
                    setSubmitting(true);
                    setError(null);
                    const formData = new FormData(event.currentTarget);

                    // Add hidden fields required for reset-verification
                    formData.set("flow", "reset-verification");
                    formData.set("email", step.email);

                    signIn("password", formData)
                        .then(() => {
                            // Success - will redirect or update user state
                            // We can let the parent component handle the redirect via user state change
                        })
                        .catch((err) => {
                            console.error("Verification error:", err);
                            setError("Invalid code or password. Please try again.");
                            setSubmitting(false);
                        });
                }}
            >
                <div className="space-y-2">
                    <label htmlFor="code" className="text-cyan-400 text-sm flex items-center gap-2">
                        <span>{'>'}</span>
                        <span>VERIFICATION_CODE</span>
                    </label>
                    <input
                        name="code"
                        type="text"
                        required
                        className="w-full bg-black/50 border-2 border-cyan-500/30 px-4 py-3 text-green-400 font-mono text-sm focus:outline-none focus:border-cyan-500 focus:shadow-[0_0_15px_rgba(6,182,212,0.5)] transition-all placeholder:text-cyan-400/30"
                        placeholder="123456"
                    />
                </div>

                <div className="space-y-2">
                    <label htmlFor="newPassword" className="text-cyan-400 text-sm flex items-center gap-2">
                        <span>{'>'}</span>
                        <span>NEW_PASSWORD</span>
                    </label>
                    <input
                        name="newPassword"
                        type="password"
                        required
                        className="w-full bg-black/50 border-2 border-cyan-500/30 px-4 py-3 text-green-400 font-mono text-sm focus:outline-none focus:border-cyan-500 focus:shadow-[0_0_15px_rgba(6,182,212,0.5)] transition-all placeholder:text-cyan-400/30"
                        placeholder="••••••••"
                    />
                </div>

                {error && (
                    <div className="bg-red-500/20 border-2 border-red-500/50 p-4 text-red-400 text-sm font-mono">
                        <div className="flex items-start gap-2">
                            <span className="text-red-500">{'>'}</span>
                            <span className="animate-pulse">█</span>
                            <span>{error}</span>
                        </div>
                    </div>
                )}

                <div className="space-y-4">
                    <AdminButton
                        type="submit"
                        variant="primary"
                        size="xl"
                        disabled={submitting}
                        className="w-full"
                    >
                        {submitting ? 'verifying...' : 'reset password'}
                    </AdminButton>

                    <button
                        type="button"
                        onClick={() => setStep("forgot")}
                        className="w-full text-cyan-400/50 hover:text-cyan-400 text-sm font-mono transition-colors"
                    >
                        {'< CANCEL'}
                    </button>
                </div>
            </form>
        </div>
    );
}
