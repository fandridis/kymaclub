import { createFileRoute, Link, Outlet, redirect, useLocation } from '@tanstack/react-router';
import { SciFiLoader } from '@/components/sci-fi-loader';
import { SciFiMetricCard } from '@/components/sci-fi-metric-card';
import { SciFiColor, getSciFiColors } from '@/components/sci-fi-card';
import { useCurrentUser } from '@/hooks/use-current-user';
import { Building2, Users, MapPin, BookOpen, Calendar, FileText, LucideIcon } from 'lucide-react';
import { useQuery } from 'convex/react';
import { api } from '@repo/api/convex/_generated/api';
import { cn } from '@/lib/utils';

export const Route = createFileRoute('/_app-layout/dashboard')({
    component: Dashboard,
});

interface DashboardSection {
    id: string;
    title: string;
    code: string;
    color: SciFiColor;
    icon: LucideIcon;
}

const sections: DashboardSection[] = [
    { id: 'businesses', title: 'BUSINESSES', code: '0x425553494E455353', color: 'cyan', icon: Building2 },
    { id: 'consumers', title: 'CONSUMERS', code: '0x434F4E53554D4552', color: 'green', icon: Users },
    { id: 'venues', title: 'VENUES', code: '0x56454E554553', color: 'yellow', icon: MapPin },
    { id: 'class-instances', title: 'CLASSES', code: '0x434C4153534553', color: 'purple', icon: BookOpen },
    { id: 'class-templates', title: 'TEMPLATES', code: '0x54454D504C41544553', color: 'orange', icon: FileText },
    { id: 'bookings', title: 'BOOKINGS', code: '0x424F4F4B494E4753', color: 'pink', icon: Calendar },
];

function Dashboard() {
    const { user, isLoading } = useCurrentUser();
    const location = useLocation();
    const metrics = useQuery(api.internal.queries.dashboardMetrics.getDashboardMetrics);

    // If we're on a child route, only render the outlet
    if (location.pathname !== '/dashboard') {
        return <Outlet />;
    }

    if (isLoading) {
        return <SciFiLoader fullScreen={false} />
    }

    if (!user) {
        return redirect({
            to: '/sign-in-tester',
            replace: true,
            search: {
                redirect: window.location.href
            }
        })
    }

    const userName = user.name || user.email || "Admin";



    return (
        <div className="container mx-auto px-4 py-8">
            {/* Header */}
            <div className="mb-8 font-mono">
                <div className="text-cyan-400 text-sm mb-2 tracking-wider">
                    {'> DASHBOARD.EXE'}
                </div>
                <div className="text-green-400 text-xs mb-4">
                    {'[SYSTEM] Admin Control Panel v2.0.1'}
                </div>
                <h1 className="text-4xl md:text-6xl font-black mb-2 tracking-tighter">
                    <span className="text-cyan-400 drop-shadow-[0_0_20px_rgba(6,182,212,0.8)]">
                        WELCOME, {userName.toUpperCase()}
                    </span>
                </h1>
                <div className="text-cyan-400/60 text-sm font-mono tracking-wider">
                    {'[STATUS: ONLINE] [CLEARANCE: INTERNAL] [TIMESTAMP: ' + new Date().toISOString() + ']'}
                </div>
            </div>

            {/* Dashboard Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
                {sections.map((section) => {
                    // Format numbers with commas
                    const formatNumber = (num: number | undefined) => {
                        if (num === undefined) return '...';
                        return num.toLocaleString();
                    };

                    // Get main and secondary metrics for specific sections
                    let mainMetricValue: string | number = '...';
                    let mainMetricLabel: string = 'LOADING...';
                    let secondaryMetricValue: number | undefined = undefined;
                    let secondaryMetricType: 'number' | 'percentage' | undefined = undefined;
                    let secondaryMetricLabel: string | undefined = undefined;

                    if (section.id === 'consumers' && metrics) {
                        mainMetricValue = formatNumber(metrics.consumers.activeCount);
                        mainMetricLabel = 'active consumers';
                        secondaryMetricValue = metrics.consumers.signupsLastMonth;
                        secondaryMetricType = 'number';
                        secondaryMetricLabel = 'SIGNUPS LAST MONTH';
                    } else if (section.id === 'bookings' && metrics) {
                        mainMetricValue = formatNumber(metrics.bookings.thisMonth);
                        mainMetricLabel = 'bookings this month';
                        secondaryMetricValue = metrics.bookings.changeFromLastMonth;
                        secondaryMetricType = 'percentage';
                        secondaryMetricLabel = 'VS LAST MONTH';
                    } else if (section.id === 'class-instances' && metrics) {
                        mainMetricValue = formatNumber(metrics.classes.currentlyScheduled);
                        mainMetricLabel = 'currently scheduled classes';
                        secondaryMetricValue = metrics.classes.completedLastMonth;
                        secondaryMetricType = 'number';
                        secondaryMetricLabel = 'COMPLETED LAST MONTH';
                    }

                    const colors = getSciFiColors(section.color);
                    const cardProps = {
                        mainMetric: mainMetricValue,
                        mainMetricLabel,
                        color: section.color,
                        icon: section.icon,
                        dataTitle: section.title,
                        renderFooter: () => (
                            <span className={cn("font-mono text-xs", colors.text)}>ONLINE</span>
                        ),
                        secondaryMetricValue,
                        secondaryMetricType,
                        secondaryMetricLabel,
                    };

                    if (section.id === 'class-instances') {
                        return (
                            <Link
                                key={section.id}
                                to="/dashboard/classes"
                                className="block h-full"
                            >
                                <SciFiMetricCard
                                    {...cardProps}
                                />
                            </Link>
                        );
                    }

                    return (
                        <SciFiMetricCard
                            key={section.id}
                            {...cardProps}
                        />
                    );
                })
                }
            </div>

            {/* Footer stats */}
            <div className="mt-12 bg-black/80 border-2 border-cyan-500/30 p-6 font-mono backdrop-blur-sm shadow-[0_0_20px_rgba(6,182,212,0.2)]">
                <div className="text-cyan-400 text-sm mb-4 tracking-wider">
                    {'> SYSTEM_STATUS.EXE'}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    <div className="space-y-2">
                        <div className="flex items-start gap-2 text-green-400">
                            <span className="text-cyan-400">{'>'}</span>
                            <span className="animate-pulse">█</span>
                            <span>Database: CONNECTED</span>
                        </div>
                        <div className="flex items-start gap-2 text-green-400">
                            <span className="text-cyan-400">{'>'}</span>
                            <span className="animate-pulse">█</span>
                            <span>API: OPERATIONAL</span>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-start gap-2 text-green-400">
                            <span className="text-cyan-400">{'>'}</span>
                            <span className="animate-pulse">█</span>
                            <span>Cache: SYNCED</span>
                        </div>
                        <div className="flex items-start gap-2 text-green-400">
                            <span className="text-cyan-400">{'>'}</span>
                            <span className="animate-pulse">█</span>
                            <span>Security: ACTIVE</span>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-start gap-2 text-yellow-400">
                            <span className="text-cyan-400">{'>'}</span>
                            <span className="animate-pulse">█</span>
                            <span>Uptime: 99.9%</span>
                        </div>
                        <div className="flex items-start gap-2 text-yellow-400">
                            <span className="text-cyan-400">{'>'}</span>
                            <span className="animate-pulse">█</span>
                            <span>Load: NORMAL</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Render child routes */}
            <Outlet />
        </div >
    );
}
