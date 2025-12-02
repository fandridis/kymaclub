import { Link, useLocation } from '@tanstack/react-router';
import { cn } from '@/lib/utils';
import {
    LayoutDashboard,
    Calendar,
    BookOpen,
    Building2,
    Users,
    MapPin,
    FileText,
    Settings,
    LogOut,
    type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface NavItemProps {
    icon: LucideIcon;
    label: string;
    href: string;
    active?: boolean;
}

function NavItem({ icon: Icon, label, href, active }: NavItemProps) {
    return (
        <Link to={href as any}>
            <Button
                variant="ghost"
                className={cn(
                    "w-full justify-start gap-3 font-medium transition-all duration-200",
                    active
                        ? "bg-slate-800/70 text-cyan-400 hover:bg-slate-800/80 hover:text-cyan-300"
                        : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/40"
                )}
            >
                <Icon className="h-4 w-4" />
                {label}
            </Button>
        </Link>
    );
}

interface StatusItemProps {
    label: string;
    value: number;
    color: 'cyan' | 'green' | 'blue' | 'purple' | 'amber';
}

function StatusItem({ label, value, color }: StatusItemProps) {
    const colorClasses = {
        cyan: 'from-cyan-500 to-blue-500',
        green: 'from-green-500 to-emerald-500',
        blue: 'from-blue-500 to-indigo-500',
        purple: 'from-purple-500 to-pink-500',
        amber: 'from-amber-500 to-orange-500',
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-slate-400">{label}</span>
                <span className="text-xs text-slate-400">{value}%</span>
            </div>
            <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                    className={cn("h-full rounded-full bg-gradient-to-r", colorClasses[color])}
                    style={{ width: `${value}%` }}
                />
            </div>
        </div>
    );
}

interface NexusSidebarProps {
    onLogout: () => void;
}

export function NexusSidebar({ onLogout }: NexusSidebarProps) {
    const location = useLocation();
    const pathname = location.pathname;

    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
        { icon: Calendar, label: 'Bookings', href: '/bookings' },
        { icon: BookOpen, label: 'Classes', href: '/classes' },
    ];

    // Determine if current route matches
    const isActive = (href: string) => {
        if (href === '/dashboard') {
            return pathname === '/dashboard' || pathname === '/';
        }
        return pathname.startsWith(href);
    };

    return (
        <div className="flex flex-col h-full bg-slate-900/50 border-r border-slate-700/50 backdrop-blur-sm">
            <div className="p-4 flex-1">
                <nav className="space-y-1">
                    {navItems.map((item) => (
                        <NavItem
                            key={item.href}
                            icon={item.icon}
                            label={item.label}
                            href={item.href}
                            active={isActive(item.href)}
                        />
                    ))}
                </nav>

                {/* System Status Section */}
                <div className="mt-8 pt-6 border-t border-slate-700/50">
                    <div className="text-xs text-slate-500 mb-3 font-mono tracking-wider">SYSTEM STATUS</div>
                    <div className="space-y-3">
                        <StatusItem label="API Health" value={99} color="green" />
                        <StatusItem label="Database" value={95} color="cyan" />
                        <StatusItem label="Cache" value={87} color="blue" />
                    </div>
                </div>
            </div>

            {/* Logout Button */}
            <div className="p-4 border-t border-slate-700/50">
                <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                    onClick={onLogout}
                >
                    <LogOut className="h-4 w-4" />
                    Logout
                </Button>
            </div>
        </div>
    );
}

