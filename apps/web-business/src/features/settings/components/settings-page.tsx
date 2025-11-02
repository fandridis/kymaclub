import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NotificationsTab } from './notifications-tab';
import { AccountTab } from './account-tab';
import { useQueryState } from 'nuqs';
import { VenuesTab } from './venues-tab';
import { useTypedTranslation } from '@/lib/typed';

export function SettingsPage() {
    const { t } = useTypedTranslation();
    const [tab, setTab] = useQueryState('tab', { defaultValue: 'venues' });

    return (
        <Tabs value={tab} onValueChange={setTab} className="w-full pb-12">
            <TabsList className="mb-6 grid w-fit grid-cols-3">
                <TabsTrigger value="venues">{t('routes.settings.venues')}</TabsTrigger>
                <TabsTrigger value="notifications">{t('routes.settings.notifications.title')}</TabsTrigger>
                <TabsTrigger value="account">{t('routes.settings.account.title')}</TabsTrigger>
            </TabsList>
            <TabsContent value="venues">
                <VenuesTab />
            </TabsContent>
            <TabsContent value="notifications">
                <NotificationsTab />
            </TabsContent>
            <TabsContent value="account">
                <AccountTab />
            </TabsContent>
        </Tabs>
    );
}