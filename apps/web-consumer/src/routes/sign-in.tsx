import { createFileRoute, useNavigate, useRouter } from '@tanstack/react-router';
import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import { Button } from "../components/ui/button";
import { CodeInput } from "../components/auth/code-input";
import { SignInWithEmailCode } from "../components/auth/sign-in-with-email-code";
import { SignInWithOAuth } from "../components/auth/sign-in-with-oauth";
import { toast } from "sonner";
import { useTypedTranslation } from '@/lib/typed';
import i18n, { AVAILABLE_LANGUAGES } from '@/lib/i18n';
import { Globe, Check } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";

export const Route = createFileRoute('/sign-in')({
    component: RouteComponent,
    validateSearch: (search: Record<string, unknown>) => {
        return {
            redirect: search.redirect as string | undefined,
        };
    },
})

function RouteComponent() {
    const { t } = useTypedTranslation();
    return (
        <div className="flex-1 w-full lg:grid lg:grid-cols-2">
            <div className="hidden bg-muted lg:block">
                <div className="flex h-full flex-col justify-center items-center p-8 text-center">
                    <h1 className="text-4xl font-bold">Orcavo Consumer</h1>
                    <p className="text-lg mt-4">
                        {t('routes.signIn.description')}
                    </p>
                </div>
            </div>
            <div className="flex items-center justify-center py-12">
                <SignInForm />
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
    const navigate = useNavigate();
    const router = useRouter();
    const search = Route.useSearch();
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
                        <SignInWithOAuth redirectTo={search.redirect || '/'} />
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-background px-2 text-muted-foreground">
                                    {t('routes.signIn.orContinueWith')}
                                </span>
                            </div>
                        </div>
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
                                router.invalidate();
                                navigate({ to: search.redirect || '/', replace: true });
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