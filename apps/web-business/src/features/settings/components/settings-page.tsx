import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NotificationsTab } from './notifications-tab';
import { AccountTab } from './account-tab';
import { useQueryState } from 'nuqs';
import { VenuesTab } from './venues-tab';

export function SettingsPage() {
    const [tab, setTab] = useQueryState('tab', { defaultValue: 'venues' });

    return (
        <Tabs value={tab} onValueChange={setTab} className="w-full">
            <TabsList className="mb-6 grid w-fit grid-cols-3">
                <TabsTrigger value="venues">Venues</TabsTrigger>
                <TabsTrigger value="notifications">Notifications</TabsTrigger>
                <TabsTrigger value="account">Account</TabsTrigger>
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