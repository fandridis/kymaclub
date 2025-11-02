import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Bell, UserX, CalendarX, CreditCard, Star } from 'lucide-react';
import { useBusinessSettings } from '../hooks/use-business-settings';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import type { NotificationType } from '@repo/api/types/notification';
import { useTypedTranslation } from '@/lib/typed';

type NotificationPreferences = {
    booking_created: { email: boolean; web: boolean; };
    booking_cancelled_by_consumer: { email: boolean; web: boolean; };
    booking_cancelled_by_business: { email: boolean; web: boolean; };
    payment_received: { email: boolean; web: boolean; };
    review_received?: { email: boolean; web: boolean; };
};

const defaultPreferences: NotificationPreferences = {
    booking_created: { email: true, web: true },
    booking_cancelled_by_consumer: { email: true, web: true },
    booking_cancelled_by_business: { email: true, web: true },
    payment_received: { email: true, web: true },
    review_received: { email: true, web: true },
};

type NotificationMode = 'none' | 'email' | 'web' | 'both';

const getNotificationMode = (setting: { email: boolean; web: boolean }): NotificationMode => {
    if (!setting.email && !setting.web) return 'none';
    if (setting.email && !setting.web) return 'email';
    if (!setting.email && setting.web) return 'web';
    return 'both';
};

const applyNotificationMode = (mode: NotificationMode): { email: boolean; web: boolean } => {
    switch (mode) {
        case 'none': return { email: false, web: false };
        case 'email': return { email: true, web: false };
        case 'web': return { email: false, web: true };
        case 'both': return { email: true, web: true };
    }
};

const getNotificationTypes = (t: (key: string) => string) => [
    {
        key: 'booking_created' as const,
        icon: Bell,
        title: t('routes.settings.notifications.newBooking'),
        description: t('routes.settings.notifications.whenCustomerBooks'),
    },
    {
        key: 'booking_cancelled_by_consumer' as const,
        icon: UserX,
        title: t('routes.settings.notifications.customerCancellation'),
        description: t('routes.settings.notifications.whenCustomerCancels'),
    },
    {
        key: 'booking_cancelled_by_business' as const,
        icon: CalendarX,
        title: t('routes.settings.notifications.businessCancellation'),
        description: t('routes.settings.notifications.whenYouCancel'),
    },
    {
        key: 'payment_received' as const,
        icon: CreditCard,
        title: t('routes.settings.notifications.paymentReceived'),
        description: t('routes.settings.notifications.whenPaymentReceived'),
    },
    {
        key: 'review_received' as const,
        icon: Star,
        title: t('routes.settings.notifications.newReview'),
        description: t('routes.settings.notifications.whenReviewApproved'),
    },
];

export function NotificationsTab() {
    const { t } = useTypedTranslation();
    const { settings, loading, updateSettings } = useBusinessSettings();
    const notificationTypes = getNotificationTypes(t);
    const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);
    const [hasChanges, setHasChanges] = useState(false);
    const [saving, setSaving] = useState(false);

    // Update local state when settings are loaded
    useEffect(() => {
        if (settings?.notifications?.preferences) {
            // Merge with defaults to ensure newly added keys exist
            setPreferences({
                ...defaultPreferences,
                ...settings.notifications.preferences,
            });
            setHasChanges(false);
        }
    }, [settings]);

    const handleModeChange = (type: keyof NotificationPreferences, mode: NotificationMode) => {
        setPreferences(prev => ({
            ...prev,
            [type]: applyNotificationMode(mode)
        }));
        setHasChanges(true);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateSettings({
                notifications: {
                    preferences
                }
            });
            setHasChanges(false);
            toast.success(t('routes.settings.notifications.preferencesSavedSuccess'));
        } catch (error) {
            console.error('Failed to save notification preferences:', error);
            toast.error(t('routes.settings.notifications.failedToSavePreferences'));
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div>
                    <h3 className="text-lg font-semibold">{t('routes.settings.notifications.notificationSettings')}</h3>
                    <p className="text-sm text-muted-foreground">
                        {t('routes.settings.notifications.loadingPreferences')}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-3xl space-y-6">
            <div>
                <h3 className="text-lg font-semibold">{t('routes.settings.notifications.notificationSettings')}</h3>
                <p className="text-sm text-muted-foreground">
                    {t('routes.settings.notifications.configureNotifications')}
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">{t('routes.settings.notifications.businessNotifications')}</CardTitle>
                    <CardDescription>
                        {t('routes.settings.notifications.chooseChannels')}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {/* Header row */}
                        <div className="flex justify-between items-center pb-2 border-b">
                            <div className="font-medium text-sm">{t('routes.settings.notifications.eventType')}</div>
                            <div className="font-medium text-sm">{t('routes.settings.notifications.channel')}</div>
                        </div>

                        {/* Notification rows */}
                        {notificationTypes.map((notificationType) => {
                            const Icon = notificationType.icon;
                            const currentPrefs = preferences[notificationType.key] ?? { email: true, web: true };
                            const currentMode = getNotificationMode(currentPrefs);

                            return (
                                <div key={notificationType.key} className="flex justify-between items-center gap-4">
                                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                                        <Icon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                                        <div className="min-w-0">
                                            <div className="font-medium">{notificationType.title}</div>
                                            <div className="text-sm text-muted-foreground">
                                                {notificationType.description}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex-shrink-0">
                                        <Select
                                            value={currentMode}
                                            onValueChange={(value: NotificationMode) =>
                                                handleModeChange(notificationType.key, value)
                                            }
                                        >
                                            <SelectTrigger className="w-[160px]">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">{t('routes.settings.notifications.none')}</SelectItem>
                                                <SelectItem value="email">{t('routes.settings.notifications.emailOnly')}</SelectItem>
                                                <SelectItem value="web">{t('routes.settings.notifications.webOnly')}</SelectItem>
                                                <SelectItem value="both">{t('routes.settings.notifications.webAndEmail')}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            );
                        })}

                        {/* Save button */}
                        {hasChanges && (
                            <div className="pt-4 border-t">
                                <Button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="w-full sm:w-auto"
                                >
                                    {saving ? t('routes.settings.notifications.saving') : t('routes.settings.notifications.saveChanges')}
                                </Button>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
