import { SignInWithGitHub } from "./sign-in-with-github";

export function SignInWithOAuth({ redirectTo }: { redirectTo: string }) {
    return (
        <div className="flex flex-col min-[460px]:flex-row w-full gap-2 items-stretch">
            <SignInWithGitHub redirectTo={redirectTo} />
        </div>
    );
}