import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Bell, UserX, CalendarX, CreditCard, Star } from 'lucide-react';
import { useBusinessSettings } from '../hooks/use-business-settings';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

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

const notificationTypes = [
    {
        key: 'booking_created' as const,
        icon: Bell,
        title: 'New Booking',
        description: 'When a customer books a class',
    },
    {
        key: 'booking_cancelled_by_consumer' as const,
        icon: UserX,
        title: 'Customer Cancellation',
        description: 'When a customer cancels their booking',
    },
    {
        key: 'booking_cancelled_by_business' as const,
        icon: CalendarX,
        title: 'Business Cancellation',
        description: 'When you cancel a class',
    },
    {
        key: 'payment_received' as const,
        icon: CreditCard,
        title: 'Payment Received',
        description: 'When a payment is received',
    },
    {
        key: 'review_received' as const,
        icon: Star,
        title: 'New Review',
        description: 'When a user review is approved',
    },
];

export function NotificationsTab() {
    const { settings, loading, updateSettings } = useBusinessSettings();
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
            toast.success('Notification preferences saved successfully');
        } catch (error) {
            console.error('Failed to save notification preferences:', error);
            toast.error('Failed to save notification preferences');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div>
                    <h3 className="text-lg font-semibold">Notification Settings</h3>
                    <p className="text-sm text-muted-foreground">
                        Loading notification preferences...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold">Notification Settings</h3>
                <p className="text-sm text-muted-foreground">
                    Configure how you want to receive notifications about your business.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Business Notifications</CardTitle>
                    <CardDescription>
                        Choose how you want to receive notifications for each event type.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {/* Header row */}
                        <div className="flex justify-between items-center pb-2 border-b">
                            <div className="font-medium text-sm">Event Type</div>
                            <div className="font-medium text-sm">Channel</div>
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
                                                <SelectItem value="none">None</SelectItem>
                                                <SelectItem value="email">Email only</SelectItem>
                                                <SelectItem value="web">Web only</SelectItem>
                                                <SelectItem value="both">Web & Email</SelectItem>
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
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </Button>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
