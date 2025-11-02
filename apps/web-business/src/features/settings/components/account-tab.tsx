import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCurrentUser } from '@/components/stores/auth';
import { useMutation } from 'convex/react';
import { api } from '@repo/api/convex/_generated/api';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import i18n, { AVAILABLE_LANGUAGES } from '@/lib/i18n';
import { useTypedTranslation } from '@/lib/typed';

type BusinessForm = {
    name: string;
    phone?: string;
};

type ProfileForm = {
    name: string;
};

export function AccountTab() {
    const { user, business } = useCurrentUser();
    const { t } = useTypedTranslation();

    const [savingBusiness, setSavingBusiness] = useState(false);
    const [savingProfile, setSavingProfile] = useState(false);
    const [currentLanguage, setCurrentLanguage] = useState(i18n.language);

    useEffect(() => {
        const handleLanguageChange = (lng: string) => {
            setCurrentLanguage(lng);
        };

        i18n.on('languageChanged', handleLanguageChange);
        return () => {
            i18n.off('languageChanged', handleLanguageChange);
        };
    }, []);

    const formBusiness = useForm<BusinessForm>({
        resolver: zodResolver(z.object({
            name: z.string().min(1, t('routes.settings.account.nameRequired')),
            phone: z.string().optional(),
        })),
        defaultValues: {
            name: business.name ?? '',
            phone: business.phone ?? '',
        },
    });

    const formProfile = useForm<ProfileForm>({
        resolver: zodResolver(z.object({
            name: z.string().min(1, t('routes.settings.account.nameRequired')),
        })),
        defaultValues: {
            name: user.name ?? '',
        },
    });

    const updateBusinessDetails = useMutation(api.mutations.core.updateBusinessDetails);
    const updateCurrentUserProfile = useMutation(api.mutations.core.updateCurrentUserProfile);

    const onSubmitBusiness = async (values: BusinessForm) => {
        setSavingBusiness(true);
        try {
            await updateBusinessDetails({ name: values.name.trim(), phone: values.phone?.trim() || undefined });
            toast.success(t('routes.settings.account.businessDetailsUpdated'));
        } catch (e) {
            console.error(e);
            toast.error(t('routes.settings.account.failedToUpdateBusiness'));
        } finally {
            setSavingBusiness(false);
        }
    };

    const onSubmitProfile = async (values: ProfileForm) => {
        setSavingProfile(true);
        try {
            await updateCurrentUserProfile({ name: values.name.trim() });
            toast.success(t('routes.settings.account.profileUpdated'));
        } catch (e) {
            console.error(e);
            toast.error(t('routes.settings.account.failedToUpdateProfile'));
        } finally {
            setSavingProfile(false);
        }
    };

    return (
        <div className="max-w-2xl space-y-6">
            <div>
                <h3 className="text-lg font-semibold">{t('routes.settings.account.title')}</h3>
                <p className="text-sm text-muted-foreground">{t('routes.settings.account.manageProfile')}</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">{t('routes.settings.account.companyDetails')}</CardTitle>
                    <CardDescription>
                        {t('routes.settings.account.companyDescription')}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...formBusiness}>
                        <form onSubmit={formBusiness.handleSubmit(onSubmitBusiness)} className="space-y-4">
                            <FormField
                                control={formBusiness.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('routes.settings.account.businessName')}</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder={t('routes.settings.account.companyNamePlaceholder')} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={formBusiness.control}
                                name="phone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('routes.settings.account.phoneNumber')}</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder={t('routes.settings.account.phonePlaceholder')} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="pt-2">
                                <Button type="submit" disabled={savingBusiness}>
                                    {savingBusiness ? t('routes.settings.account.saving') : t('routes.settings.account.saveChanges')}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">{t('routes.settings.account.profile')}</CardTitle>
                    <CardDescription>{t('routes.settings.account.updatePersonalInfo')}</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...formProfile}>
                        <form onSubmit={formProfile.handleSubmit(onSubmitProfile)} className="space-y-4">
                            <FormField
                                control={formProfile.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('routes.settings.account.name')}</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder={t('routes.settings.account.yourNamePlaceholder')} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="pt-2">
                                <Button type="submit" disabled={savingProfile}>
                                    {savingProfile ? t('routes.settings.account.saving') : t('routes.settings.account.saveChanges')}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">{t('routes.settings.account.language')}</CardTitle>
                    <CardDescription>
                        {t('routes.settings.account.languageDescription')}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">
                                {t('routes.settings.account.selectLanguage')}
                            </label>
                            <Select
                                value={currentLanguage}
                                onValueChange={(value) => {
                                    i18n.changeLanguage(value);
                                    setCurrentLanguage(value);
                                }}
                            >
                                <SelectTrigger className="w-full sm:w-[300px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {AVAILABLE_LANGUAGES.map((lang) => (
                                        <SelectItem key={lang} value={lang}>
                                            {t(`common.languages.${lang}` as any)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
} 