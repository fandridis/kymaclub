import { createFileRoute, Link, Outlet, redirect, useLocation } from '@tanstack/react-router';
import { SciFiLoader } from '@/components/sci-fi-loader';
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
    color: 'cyan' | 'green' | 'yellow' | 'purple' | 'orange' | 'pink';
    icon: LucideIcon;
}

const sections: DashboardSection[] = [
    { id: 'businesses', title: 'BUSINESSES', code: '0x425553494E455353', color: 'cyan', icon: Building2 },
    { id: 'consumers', title: 'CONSUMERS', code: '0x434F4E53554D4552', color: 'green', icon: Users },
    { id: 'venues', title: 'VENUES', code: '0x56454E554553', color: 'yellow', icon: MapPin },
    { id: 'classes', title: 'CLASSES', code: '0x434C4153534553', color: 'purple', icon: BookOpen },
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

    const getColorClasses = (color: DashboardSection['color']) => {
        const colors = {
            cyan: {
                border: 'border-cyan-500',
                text: 'text-cyan-400',
                bg: 'bg-cyan-500/10',
                hover: 'hover:border-cyan-400 hover:bg-cyan-500/20',
                glow: 'shadow-[0_0_20px_rgba(6,182,212,0.3)]',
                hoverGlow: 'hover:shadow-[0_0_30px_rgba(6,182,212,0.5)]',
            },
            green: {
                border: 'border-green-500',
                text: 'text-green-400',
                bg: 'bg-green-500/10',
                hover: 'hover:border-green-400 hover:bg-green-500/20',
                glow: 'shadow-[0_0_20px_rgba(34,197,94,0.3)]',
                hoverGlow: 'hover:shadow-[0_0_30px_rgba(34,197,94,0.5)]',
            },
            yellow: {
                border: 'border-yellow-500',
                text: 'text-yellow-400',
                bg: 'bg-yellow-500/10',
                hover: 'hover:border-yellow-400 hover:bg-yellow-500/20',
                glow: 'shadow-[0_0_20px_rgba(234,179,8,0.3)]',
                hoverGlow: 'hover:shadow-[0_0_30px_rgba(234,179,8,0.5)]',
            },
            purple: {
                border: 'border-purple-500',
                text: 'text-purple-400',
                bg: 'bg-purple-500/10',
                hover: 'hover:border-purple-400 hover:bg-purple-500/20',
                glow: 'shadow-[0_0_20px_rgba(168,85,247,0.3)]',
                hoverGlow: 'hover:shadow-[0_0_30px_rgba(168,85,247,0.5)]',
            },
            orange: {
                border: 'border-orange-500',
                text: 'text-orange-400',
                bg: 'bg-orange-500/10',
                hover: 'hover:border-orange-400 hover:bg-orange-500/20',
                glow: 'shadow-[0_0_20px_rgba(251,146,60,0.3)]',
                hoverGlow: 'hover:shadow-[0_0_30px_rgba(251,146,60,0.5)]',
            },
            pink: {
                border: 'border-pink-500',
                text: 'text-pink-400',
                bg: 'bg-pink-500/10',
                hover: 'hover:border-pink-400 hover:bg-pink-500/20',
                glow: 'shadow-[0_0_20px_rgba(236,72,153,0.3)]',
                hoverGlow: 'hover:shadow-[0_0_30px_rgba(236,72,153,0.5)]',
            },
        };
        return colors[color];
    };

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
                    const colors = getColorClasses(section.color);
                    const className = `group relative ${colors.bg} ${colors.border} border-2 p-6 font-mono transition-all duration-300 ${colors.hover} ${colors.glow} ${colors.hoverGlow} backdrop-blur-sm`;

                    if (section.id === 'classes') {
                        return (
                            <Link
                                key={section.id}
                                to="/dashboard/classes"
                                className={className}
                            >
                                {/* Corner brackets */}
                                <div className={`absolute top-2 left-2 ${colors.text} text-xs`}>
                                    {'┌─'}
                                </div>
                                <div className={`absolute top-2 right-2 ${colors.text} text-xs`}>
                                    {'─┐'}
                                </div>
                                <div className={`absolute bottom-2 left-2 ${colors.text} text-xs`}>
                                    {'└─'}
                                </div>
                                <div className={`absolute bottom-2 right-2 ${colors.text} text-xs`}>
                                    {'─┘'}
                                </div>

                                {/* Content */}
                                <div className="relative z-10">
                                    <div className="mb-4">
                                        <section.icon className={`w-12 h-12 ${colors.text}`} strokeWidth={1.5} />
                                    </div>
                                    <div className={`${colors.text} text-xl md:text-2xl font-black mb-2 tracking-wider`}>
                                        {section.title}
                                    </div>
                                    <div className={`${colors.text}/60 text-xs tracking-wider mb-4`}>
                                        {section.code}
                                    </div>
                                    <div className="flex items-center gap-2 text-xs">
                                        <span className={`${colors.text}/40`}>{'>'}</span>
                                        <span className={`${colors.text} animate-pulse`}>█</span>
                                        <span className={`${colors.text}/60`}>Access module...</span>
                                    </div>
                                </div>

                                {/* Hover effect overlay */}
                                <div className={`absolute inset-0 ${colors.bg} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                                <div className={`absolute -inset-1 ${colors.bg.replace('/10', '/20')} blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                            </Link>
                        );
                    }

                    return (
                        <button
                            key={section.id}
                            className={className}
                        >
                            {/* Corner brackets */}
                            <div className={`absolute top-2 left-2 ${colors.text} text-xs`}>
                                {'┌─'}
                            </div>
                            <div className={`absolute top-2 right-2 ${colors.text} text-xs`}>
                                {'─┐'}
                            </div>
                            <div className={`absolute bottom-2 left-2 ${colors.text} text-xs`}>
                                {'└─'}
                            </div>
                            <div className={`absolute bottom-2 right-2 ${colors.text} text-xs`}>
                                {'─┘'}
                            </div>

                            {/* Content */}
                            <div className="relative z-10">
                                <div className="mb-4">
                                    <section.icon className={`w-12 h-12 ${colors.text}`} strokeWidth={1.5} />
                                </div>
                                <div className={`${colors.text} text-xl md:text-2xl font-black mb-2 tracking-wider`}>
                                    {section.title}
                                </div>
                                <div className={`${colors.text}/60 text-xs tracking-wider mb-4`}>
                                    {section.code}
                                </div>
                                <div className="flex items-center gap-2 text-xs">
                                    <span className={`${colors.text}/40`}>{'>'}</span>
                                    <span className={`${colors.text} animate-pulse`}>█</span>
                                    <span className={`${colors.text}/60`}>Access module...</span>
                                </div>
                            </div>

                            {/* Hover effect overlay */}
                            <div className={`absolute inset-0 ${colors.bg} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                            <div className={`absolute -inset-1 ${colors.bg.replace('/10', '/20')} blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                        </button>
                    );
                })}
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
        </div>
    );
}
