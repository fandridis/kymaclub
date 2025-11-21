import { createFileRoute, Link, Outlet, redirect, useLocation } from '@tanstack/react-router';
import { SciFiLoader } from '@/components/sci-fi-loader';
import { SciFiCard, SciFiColor, getSciFiColors } from '@/components/sci-fi-card';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useAuthActions } from '@convex-dev/auth/react';
import { Building2, Users, MapPin, BookOpen, Calendar, Zap, LucideIcon } from 'lucide-react';

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
    { id: 'bookings', title: 'BOOKINGS', code: '0x424F4F4B494E4753', color: 'orange', icon: Calendar },
    { id: 'actions', title: 'ACTIONS', code: '0x414354494F4E53', color: 'pink', icon: Zap },
];

function Dashboard() {
    const { user, isLoading } = useCurrentUser();
    const location = useLocation();

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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sections.map((section) => {
                    const colors = getSciFiColors(section.color);
                    const CardContent = (
                        <div className="flex flex-col h-full justify-between p-2">
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    {/* Icon Opacity is likely intended to be 100%, so we leave it alone */}
                                    <section.icon className={`${colors.text} w-8 h-8`} />

                                    {/* Target text: Base opacity 30, changes to 50 on group hover */}
                                    <div className={`${colors.text} opacity-30 group-hover:opacity-70 text-[10px] font-mono`}>
                                        {'[ID: ' + section.id.toUpperCase() + ']'}
                                    </div>
                                </div>
                                <div className={`${colors.text} text-xl md:text-2xl font-black mb-2 tracking-wider`}>
                                    {section.title}
                                </div>

                                {/* Target text: Base opacity 30, changes to 50 on group hover */}
                                <div className={`${colors.text} opacity-30 group-hover:opacity-70 text-xs tracking-wider mb-4`}>
                                    {section.code}
                                </div>
                                <div className="flex items-center gap-2 text-xs">
                                    {/* Target text: Base opacity 30, changes to 50 on group hover */}
                                    <span className={`${colors.text} opacity-30 group-hover:opacity-70`}>{'>'}</span>

                                    <span className={`${colors.text} animate-pulse`}>█</span>

                                    {/* Target text: Base opacity 30, changes to 50 on group hover */}
                                    <span className={`${colors.text} opacity-30 group-hover:opacity-70`}>Access module...</span>
                                </div>
                            </div>
                        </div>
                    );

                    if (section.id === 'class-instances') {
                        return (
                            <Link
                                key={section.id}
                                to="/dashboard/classes"
                                className="block h-full"
                            >
                                <SciFiCard color={section.color} className="h-full p-8 group" hoverEffect={true}>
                                    {CardContent}
                                </SciFiCard>
                            </Link>
                        );
                    }

                    return (
                        <button
                            key={section.id}
                            className="block w-full h-full text-left"
                        >
                            <SciFiCard color={section.color} className="h-full p-8 group" hoverEffect={true}>
                                {CardContent}
                            </SciFiCard>
                        </button>
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
