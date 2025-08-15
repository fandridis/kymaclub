import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, Mail, MessageSquare, Calendar } from 'lucide-react';

export function NotificationsTab() {
    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold">Notification Settings</h3>
                <p className="text-sm text-muted-foreground">
                    Configure how you want to receive notifications about your business.
                </p>
            </div>

            <div className="grid gap-4">
                <Card>
                    <CardHeader>
                        <div className="flex items-center space-x-3">
                            <Bell className="h-5 w-5 text-primary" />
                            <div>
                                <CardTitle className="text-base">Push Notifications</CardTitle>
                                <CardDescription>
                                    Get notified about new bookings, cancellations, and important updates.
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            Coming soon - Configure push notification preferences.
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex items-center space-x-3">
                            <Mail className="h-5 w-5 text-primary" />
                            <div>
                                <CardTitle className="text-base">Email Notifications</CardTitle>
                                <CardDescription>
                                    Receive email updates about your business activity.
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            Coming soon - Configure email notification preferences.
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex items-center space-x-3">
                            <MessageSquare className="h-5 w-5 text-primary" />
                            <div>
                                <CardTitle className="text-base">SMS Notifications</CardTitle>
                                <CardDescription>
                                    Get text messages for urgent updates and reminders.
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            Coming soon - Configure SMS notification preferences.
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex items-center space-x-3">
                            <Calendar className="h-5 w-5 text-primary" />
                            <div>
                                <CardTitle className="text-base">Calendar Reminders</CardTitle>
                                <CardDescription>
                                    Set up automatic reminders for classes and appointments.
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            Coming soon - Configure calendar reminder preferences.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}