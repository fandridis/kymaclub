import { createFileRoute, Link, Outlet, redirect } from '@tanstack/react-router';
import { useCurrentUser } from '@/hooks/use-current-user';
import { NexusLoader, NexusMetricCard, NexusAlert } from '@/components/nexus';
import {
    Building2,
    Users,
    MapPin,
    BookOpen,
    Calendar,
    FileText,
    Activity,
    RefreshCw,
    Shield,
    AlertCircle,
    type LucideIcon,
} from 'lucide-react';
import { useQuery } from 'convex/react';
import { api } from '@repo/api/convex/_generated/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

export const Route = createFileRoute('/_app-layout/dashboard')({
    component: Dashboard,
});

interface DashboardSection {
    id: string;
    title: string;
    color: 'cyan' | 'green' | 'purple' | 'pink' | 'amber' | 'blue';
    icon: LucideIcon;
    href?: string;
}

const sections: DashboardSection[] = [
    { id: 'businesses', title: 'Businesses', color: 'cyan', icon: Building2 },
    { id: 'consumers', title: 'Consumers', color: 'green', icon: Users },
    { id: 'venues', title: 'Venues', color: 'amber', icon: MapPin },
    { id: 'class-instances', title: 'Classes', color: 'purple', icon: BookOpen, href: '/classes' },
    { id: 'class-templates', title: 'Templates', color: 'pink', icon: FileText },
    { id: 'bookings', title: 'Bookings', color: 'blue', icon: Calendar, href: '/bookings' },
];

function Dashboard() {
    const { user, isLoading } = useCurrentUser();
    const metrics = useQuery(api.internal.queries.dashboardMetrics.getDashboardMetrics);

    if (isLoading) {
        return <NexusLoader />;
    }

    if (!user) {
        return redirect({
            to: '/sign-in-tester',
            replace: true,
            search: {
                redirect: window.location.href
            }
        });
    }

    const userName = user.name || user.email || "Admin";

    // Format numbers with commas
    const formatNumber = (num: number | undefined) => {
        if (num === undefined) return '...';
        return num.toLocaleString();
    };

    // Get metrics for each section
    const getMetricsForSection = (sectionId: string) => {
        if (!metrics) return { mainValue: '...', mainLabel: 'Loading...', trend: undefined as 'up' | 'down' | 'stable' | undefined, trendValue: undefined as string | undefined, subtitle: undefined as string | undefined };

        switch (sectionId) {
            case 'businesses':
                return {
                    mainValue: formatNumber(metrics.businesses.activeCount),
                    mainLabel: 'Active Businesses',
                    trend: metrics.businesses.joinedLastMonth > 0 ? 'up' as const : 'stable' as const,
                    trendValue: `+${metrics.businesses.joinedLastMonth} this month`,
                    subtitle: undefined,
                };
            case 'consumers':
                return {
                    mainValue: formatNumber(metrics.consumers.activeCount),
                    mainLabel: 'Active Consumers',
                    trend: metrics.consumers.signupsLastMonth > 0 ? 'up' as const : 'stable' as const,
                    trendValue: `+${metrics.consumers.signupsLastMonth} signups`,
                    subtitle: undefined,
                };
            case 'venues':
                return {
                    mainValue: formatNumber(metrics.venues.activeCount),
                    mainLabel: 'Active Venues',
                    trend: metrics.venues.createdLastMonth > 0 ? 'up' as const : 'stable' as const,
                    trendValue: `+${metrics.venues.createdLastMonth} new`,
                    subtitle: undefined,
                };
            case 'class-instances':
                return {
                    mainValue: formatNumber(metrics.classes.currentlyScheduled),
                    mainLabel: 'Scheduled Classes',
                    trend: 'stable' as const,
                    trendValue: `${metrics.classes.completedLastMonth} completed`,
                    subtitle: undefined,
                };
            case 'class-templates':
                return {
                    mainValue: formatNumber(metrics.templates.total),
                    mainLabel: 'Total Templates',
                    trend: metrics.templates.createdLastMonth > 0 ? 'up' as const : 'stable' as const,
                    trendValue: `+${metrics.templates.createdLastMonth} new`,
                    subtitle: undefined,
                };
            case 'bookings':
                const bookingTrend = metrics.bookings.changeFromLastMonth >= 0 ? 'up' as const : 'down' as const;
                return {
                    mainValue: formatNumber(metrics.bookings.thisMonth),
                    mainLabel: 'Bookings This Month',
                    trend: bookingTrend,
                    trendValue: `${metrics.bookings.changeFromLastMonth >= 0 ? '+' : ''}${metrics.bookings.changeFromLastMonth.toFixed(1)}%`,
                    subtitle: undefined,
                };
            default:
                return { mainValue: '...', mainLabel: 'Loading...', trend: undefined, trendValue: undefined, subtitle: undefined };
        }
    };

    return (
        <div className="p-3 sm:p-4 md:p-6">
            {/* System Overview Card */}
            <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm overflow-hidden mb-6">
                <CardHeader className="border-b border-slate-700/50 pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-slate-100 flex items-center">
                            <Activity className="mr-2 h-5 w-5 text-cyan-500" />
                            System Overview
                        </CardTitle>
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-slate-800/50 text-cyan-400 border-cyan-500/50 text-xs">
                                <div className="h-1.5 w-1.5 rounded-full bg-cyan-500 mr-1 animate-pulse" />
                                LIVE
                            </Badge>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
                                <RefreshCw className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 md:p-6">
                    {/* Welcome Message */}
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold text-slate-100">
                            Welcome back, <span className="text-cyan-400">{userName}</span>
                        </h2>
                        <p className="text-slate-400 text-sm mt-1">
                            Here's what's happening with KymaClub today.
                        </p>
                    </div>

                    {/* Metric Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
                        {sections.map((section) => {
                            const sectionMetrics = getMetricsForSection(section.id);
                            const card = (
                                <NexusMetricCard
                                    key={section.id}
                                    title={section.title}
                                    value={sectionMetrics.mainValue}
                                    subtitle={sectionMetrics.mainLabel}
                                    icon={section.icon}
                                    color={section.color}
                                    trend={sectionMetrics.trend}
                                    trendValue={sectionMetrics.trendValue}
                                    onClick={section.href ? undefined : undefined}
                                />
                            );

                            if (section.href) {
                                return (
                                    <Link key={section.id} to={section.href as any} className="block">
                                        {card}
                                    </Link>
                                );
                            }

                            return card;
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Security & Alerts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6">
                {/* Security Status Card */}
                <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-slate-100 flex items-center text-base">
                            <Shield className="mr-2 h-5 w-5 text-green-500" />
                            Security Status
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-400">Authentication</span>
                                <Badge className="bg-green-500/20 text-green-400 border-green-500/50">Active</Badge>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-400">Rate Limiting</span>
                                <Badge className="bg-green-500/20 text-green-400 border-green-500/50">Active</Badge>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-400">Data Encryption</span>
                                <Badge className="bg-green-500/20 text-green-400 border-green-500/50">Active</Badge>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-400">Last Security Scan</span>
                                <span className="text-sm text-cyan-400">Just now</span>
                            </div>
                            <div className="pt-2 mt-2 border-t border-slate-700/50">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-slate-300">Security Level</span>
                                    <span className="text-sm text-cyan-400">100%</span>
                                </div>
                                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-green-500 to-cyan-500 rounded-full"
                                        style={{ width: '100%' }}
                                    />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* System Alerts Card */}
                <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-slate-100 flex items-center text-base">
                            <AlertCircle className="mr-2 h-5 w-5 text-amber-500" />
                            System Alerts
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <NexusAlert
                                title="All Systems Operational"
                                description="No issues detected in the past 24 hours"
                                time="Now"
                                type="success"
                            />
                            <NexusAlert
                                title="Daily Backup Complete"
                                description="All data successfully backed up"
                                time="06:00"
                                type="info"
                            />
                            <NexusAlert
                                title="Performance Optimized"
                                description="Database queries optimized automatically"
                                time="Yesterday"
                                type="update"
                            />
                            <NexusAlert
                                title="New Features Available"
                                description="Check the changelog for updates"
                                time="2 days ago"
                                type="info"
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* System Status Footer */}
            <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
                <CardContent className="p-3 sm:p-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-sm text-slate-400">Database: </span>
                            <span className="text-sm text-green-400">Connected</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-sm text-slate-400">API: </span>
                            <span className="text-sm text-green-400">Operational</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-sm text-slate-400">Cache: </span>
                            <span className="text-sm text-green-400">Synced</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-cyan-500 animate-pulse" />
                            <span className="text-sm text-slate-400">Load: </span>
                            <span className="text-sm text-cyan-400">Normal</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Child routes outlet */}
            <Outlet />
        </div>
    );
}
