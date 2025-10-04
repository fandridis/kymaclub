import { createFileRoute, redirect } from '@tanstack/react-router';
import { useAuthActions } from "@convex-dev/auth/react";
import { useState, useEffect } from "react";
import { Button } from "../components/ui/button";
import { CodeInput } from "../components/auth/code-input";
import { SignInWithEmailCode } from "../components/auth/sign-in-with-email-code";
import { toast } from "sonner";
import i18n, { AVAILABLE_LANGUAGES } from '@/lib/i18n';
import { Globe, Check } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { useTypedTranslation } from '@/lib/typed';
import { getAuthState } from '@/components/stores/auth';
import { useRedirectGuard } from '@/hooks/use-redirect-guard';

export const Route = createFileRoute('/sign-in-tester')({
    component: RouteComponent,
    validateSearch: (search: Record<string, unknown>) => {
        return {
            redirect: search.redirect as string | undefined,
        };
    },
    beforeLoad: ({ search }) => {
        const { user } = getAuthState();

        if (user?.hasBusinessOnboarded) {
            throw redirect({
                to: search.redirect || '/dashboard',
                replace: true,
            })
        }

        if (user) {
            throw redirect({
                to: '/onboarding',
                replace: true,
            })
        }
    }

})

function RouteComponent() {
    const { t } = useTypedTranslation();

    useRedirectGuard(({ user, search }) => {
        if (user && user.hasBusinessOnboarded) {
            return search.redirect || '/dashboard'
        }
        if (user && !user.hasBusinessOnboarded) {
            return '/onboarding'
        }
        return null
    })

    if (import.meta.env.PROD) {
        throw new Error('This route does not exist.');
    }

    return (
        <div className="flex-1 w-full lg:grid lg:grid-cols-2">
            <div className="hidden bg-muted lg:block">
                <div className="flex h-full flex-col justify-center items-center p-8 text-center">
                    <h1 className="text-4xl font-bold">Orcavo Business</h1>
                    <p className="text-lg mt-4">
                        {t('routes.signIn.description')}
                    </p>
                </div>
            </div>
            <div className="flex items-center justify-center py-12">
                <SignInTesterForm />
            </div>
            <div className="absolute top-3 lg:top-4 right-3 lg:right-4">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="p-2 hover:bg-muted rounded-md transition-colors">
                            <Globe className="w-5 lg:w-6 h-5 lg:h-6" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        {AVAILABLE_LANGUAGES.map((lang) => (
                            <DropdownMenuItem
                                key={lang}
                                onClick={() => i18n.changeLanguage(lang)}
                                className="flex items-center justify-between min-w-[120px]"
                            >
                                <span>{t(`common.languages.${lang}` as any)}</span>
                                {i18n.language === lang && (
                                    <Check className="w-4 h-4" />
                                )}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    )
}

export function SignInForm() {
    const { t } = useTypedTranslation();
    const { signIn } = useAuthActions();
    const [step, setStep] = useState<"signIn" | { email: string }>("signIn");
    const [submitting, setSubmitting] = useState(false);


    return (
        <div className="mx-auto grid w-[350px] gap-6">
            {step === "signIn" ? (
                <>
                    <div className="grid gap-2 text-center">
                        <h1 className="text-3xl font-bold">{t('routes.signIn.title')}</h1>
                        <p className="text-balance text-muted-foreground">
                            {t('routes.signIn.subtitle')}
                        </p>
                    </div>
                    <div className="grid gap-4">
                        <SignInWithEmailCode handleCodeSent={(email) => setStep({ email })} />
                    </div>
                    <p className="px-8 text-center text-sm text-muted-foreground">
                        {t('common.terms.agreementText')}{" "}
                        <a href="/terms" className="underline underline-offset-4 hover:text-primary">
                            {t('common.terms.termsOfService')}
                        </a>{" "}
                        {t('common.terms.and')}{" "}
                        <a href="/privacy" className="underline underline-offset-4 hover:text-primary">
                            {t('common.terms.privacyPolicy')}
                        </a>
                        .
                    </p>
                </>
            ) : (
                <>
                    <div className="grid gap-2 text-center">
                        <h1 className="text-3xl font-bold">{t('routes.signIn.checkEmailTitle')}</h1>
                        <p className="text-balance text-muted-foreground">
                            {t('routes.signIn.checkEmailDescription')} {step.email}
                        </p>
                    </div>

                    <form
                        className="grid gap-4"
                        onSubmit={(event) => {
                            event.preventDefault();
                            setSubmitting(true);
                            const formData = new FormData(event.currentTarget);
                            signIn("resend-otp", formData).then(() => {
                            }).catch(() => {
                                toast.error(t('routes.signIn.codeVerificationError'));
                                setSubmitting(false);
                            });
                        }}
                    >
                        <div className="grid gap-2">
                            <CodeInput />
                        </div>
                        <input name="email" value={step.email} type="hidden" />
                        <Button type="submit" className="w-full" disabled={submitting}>
                            {t('common.buttons.signIn')}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setStep("signIn")}
                        >
                            {t('common.buttons.backToSignIn')}
                        </Button>
                    </form>
                </>
            )}
        </div>
    );
}

export function SignInTesterForm() {
    const { signIn } = useAuthActions();
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<"signIn" | "signUp">("signIn");

    // Clear error when switching tabs
    useEffect(() => {
        setError(null);
    }, [activeTab]);

    return (
        <div className="mx-auto grid w-[350px] gap-6">
            <div className="grid gap-2 text-center">
                <h1 className="text-3xl font-bold">Test Authentication</h1>
                <p className="text-balance text-muted-foreground">
                    Email/password form for testing
                </p>
            </div>

            {/* Tabs */}
            <div className="flex rounded-lg border border-input bg-muted p-1">
                <button
                    type="button"
                    onClick={() => setActiveTab("signIn")}
                    className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${activeTab === "signIn"
                        ? "bg-background shadow-sm text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                        }`}
                >
                    Sign In
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab("signUp")}
                    className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${activeTab === "signUp"
                        ? "bg-background shadow-sm text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                        }`}
                >
                    Sign Up
                </button>
            </div>

            <form
                className="grid gap-4"
                onSubmit={(event) => {
                    event.preventDefault();
                    setSubmitting(true);
                    setError(null);
                    const formData = new FormData(event.currentTarget);
                    formData.set("flow", activeTab);
                    signIn("password", formData)
                        .then(() => {
                            // Success - user will be redirected by auth system
                        })
                        .catch((err) => {
                            console.error("Authentication error:", err);
                            setError(
                                activeTab === "signIn"
                                    ? "Invalid email or password"
                                    : "Failed to create account"
                            );
                            setSubmitting(false);
                        });
                }}
            >
                <div className="grid gap-2">
                    <label htmlFor="email" className="text-sm font-medium">
                        Email
                    </label>
                    <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="Enter your email"
                    />
                </div>
                <div className="grid gap-2">
                    <label htmlFor="password" className="text-sm font-medium">
                        Password
                    </label>
                    <input
                        id="password"
                        name="password"
                        type="password"
                        required
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="Enter your password"
                    />
                </div>
                {error && (
                    <div className="text-sm text-red-600 text-center">
                        {error}
                    </div>
                )}
                <Button type="submit" className="w-full" disabled={submitting}>
                    {submitting
                        ? (activeTab === "signIn" ? "Signing in..." : "Creating account...")
                        : (activeTab === "signIn" ? "Sign In" : "Sign Up")
                    }
                </Button>
            </form>
        </div>
    );
}