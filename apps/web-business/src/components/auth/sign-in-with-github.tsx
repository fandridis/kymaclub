import { useAuthActions } from "@convex-dev/auth/react";
import { Button } from "@/components/ui/button";
import { GitHubIcon } from "./github-icon";

export function SignInWithGitHub({ redirectTo }: { redirectTo: string }) {
    const { signIn } = useAuthActions();

    return (
        <Button
            className="flex-1"
            variant="outline"
            type="button"
            onClick={() => signIn("github", { redirectTo: `http://localhost:5174${redirectTo}` })}
        >
            <GitHubIcon className="size-4" />
            GitHub
        </Button>
    );
}