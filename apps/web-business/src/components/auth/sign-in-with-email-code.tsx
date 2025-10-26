import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "@repo/api/convex/_generated/api";
import { useState } from "react";
import { toast } from "sonner"
import { useConvex } from "convex/react";
import { AlertCircle, ExternalLink, Mail } from "lucide-react";

export function SignInWithEmailCode({
    handleCodeSent,
    provider,
    children,
}: {
    handleCodeSent: (email: string) => void;
    provider?: string;
    children?: React.ReactNode;
}) {
    const { signIn } = useAuthActions();
    const convex = useConvex();
    const [submitting, setSubmitting] = useState(false);
    const [emailInput, setEmailInput] = useState("");
    const [authError, setAuthError] = useState(false);

    return (
        <form
            className="flex flex-col"
            onSubmit={async (event) => {
                event.preventDefault();
                setSubmitting(true);
                const formData = new FormData(event.currentTarget);
                const email = formData.get("email") as string;

                // Reset auth error state
                setAuthError(false);

                // Check authorization before attempting sign-in
                try {
                    const authorized = await convex.query(api.queries.core.isEmailAuthorizedForBusiness, { email });

                    if (!authorized) {
                        setAuthError(true);
                        setSubmitting(false);
                        return;
                    }
                } catch (error) {
                    // If check fails, still allow sign-in attempt (backend will catch it)
                    console.error("Authorization check failed:", error);
                }

                signIn(provider ?? "resend-otp", formData)
                    .then(() => handleCodeSent(email))
                    .catch((error) => {
                        console.error("Sign-in error:", error);

                        // Check for nested ConvexError structure
                        const errorMessage = error?.message || error?.error?.message || "";
                        const errorCode = error?.code || error?.error?.code || "";

                        // Check if this is our authorization error
                        const isAuthError =
                            errorCode === "ACCOUNT_NOT_AUTHORIZED" ||
                            errorMessage.includes("invitation only") ||
                            errorMessage.includes("ACCOUNT_NOT_AUTHORIZED");

                        if (isAuthError) {
                            setAuthError(true);
                        } else {
                            toast.error("Could not send code");
                        }
                        setSubmitting(false);
                    });
            }}
        >
            <label htmlFor="email">Email</label>
            <Input
                name="email"
                id="email"
                type="email"
                className="mb-4"
                autoComplete="email"
                data-testid="email-input"
                value={emailInput}
                onChange={(e) => {
                    setEmailInput(e.target.value);
                    setAuthError(false); // Clear error when user types
                }}
            />

            {/* Authorization error alert */}
            {authError && (
                <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Account Not Authorized</AlertTitle>
                    <AlertDescription>
                        <p className="text-sm">
                            Business accounts are created through in-person onboarding.{" "}
                            <a
                                href="https://www.kymaclub.com/partners"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-medium underline inline-flex items-center gap-1 hover:gap-2 transition-all"
                            >
                                Learn about becoming a partner
                                <ExternalLink className="h-3 w-3" />
                            </a>
                            {" "}or contact{" "}
                            <a
                                href="mailto:hello@orcavo.com"
                                className="font-medium underline inline-flex items-center gap-1 hover:gap-2 transition-all"
                            >
                                hello@orcavo.com
                                <Mail className="h-3 w-3" />
                            </a>
                            {" "}if you need help.
                        </p>
                    </AlertDescription>
                </Alert>
            )}

            {children}
            <Button
                type="submit"
                disabled={submitting}
                data-testid="send-otp-button"
            >
                Send code
            </Button>
        </form>
    );
}