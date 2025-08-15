import { useAuthActions } from "@convex-dev/auth/react";
import { Button } from "@/components/ui/button";
import { GitHubIcon } from "./github-icon";
import { useState } from "react";

// TODO: Use the right base url dynamically, not just localhost.

export function SignInWithGitHub({ redirectTo }: { redirectTo: string }) {
    const { signIn } = useAuthActions();
    const [isLoading, setIsLoading] = useState(false);

    const handleSignIn = async () => {
        try {
            setIsLoading(true);
            await signIn("github", { redirectTo: `http://localhost:5173${redirectTo}` });
        } catch (error) {
            console.error("Sign in failed:", error);
            setIsLoading(false);
        }
    };

    return (
        <Button
            className="flex-1"
            variant="outline"
            type="button"
            onClick={handleSignIn}
            disabled={isLoading}
        >
            {isLoading ? (
                <>
                    <div className="size-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
                    Signing in...
                </>
            ) : (
                <>
                    <GitHubIcon className="size-4" />
                    GitHub
                </>
            )}
        </Button>
    );
}