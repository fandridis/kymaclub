import { cn } from '@/lib/utils';
import { type LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface NexusMetricCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon?: LucideIcon;
    trend?: 'up' | 'down' | 'stable';
    trendValue?: string;
    color?: 'cyan' | 'purple' | 'blue' | 'green' | 'amber' | 'pink';
    className?: string;
    onClick?: () => void;
}

const colorStyles = {
    cyan: {
        border: 'border-cyan-500/30',
        glow: 'hover:shadow-[0_0_30px_rgba(6,182,212,0.15)]',
        icon: 'text-cyan-500',
        accent: 'from-cyan-500 to-blue-500',
        bg: 'bg-cyan-500/5',
    },
    purple: {
        border: 'border-purple-500/30',
        glow: 'hover:shadow-[0_0_30px_rgba(168,85,247,0.15)]',
        icon: 'text-purple-500',
        accent: 'from-purple-500 to-pink-500',
        bg: 'bg-purple-500/5',
    },
    blue: {
        border: 'border-blue-500/30',
        glow: 'hover:shadow-[0_0_30px_rgba(59,130,246,0.15)]',
        icon: 'text-blue-500',
        accent: 'from-blue-500 to-indigo-500',
        bg: 'bg-blue-500/5',
    },
    green: {
        border: 'border-green-500/30',
        glow: 'hover:shadow-[0_0_30px_rgba(34,197,94,0.15)]',
        icon: 'text-green-500',
        accent: 'from-green-500 to-emerald-500',
        bg: 'bg-green-500/5',
    },
    amber: {
        border: 'border-amber-500/30',
        glow: 'hover:shadow-[0_0_30px_rgba(245,158,11,0.15)]',
        icon: 'text-amber-500',
        accent: 'from-amber-500 to-orange-500',
        bg: 'bg-amber-500/5',
    },
    pink: {
        border: 'border-pink-500/30',
        glow: 'hover:shadow-[0_0_30px_rgba(236,72,153,0.15)]',
        icon: 'text-pink-500',
        accent: 'from-pink-500 to-rose-500',
        bg: 'bg-pink-500/5',
    },
};

export function NexusMetricCard({
    title,
    value,
    subtitle,
    icon: Icon,
    trend,
    trendValue,
    color = 'cyan',
    className,
    onClick,
}: NexusMetricCardProps) {
    const styles = colorStyles[color];
    const isClickable = !!onClick;

    const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
    const trendColor = trend === 'up' ? 'text-green-400' : trend === 'down' ? 'text-red-400' : 'text-slate-400';

    const Content = (
        <div
            className={cn(
                'relative bg-slate-800/50 rounded-lg border p-3 sm:p-4 overflow-hidden transition-all duration-300',
                styles.border,
                styles.glow,
                isClickable && 'cursor-pointer hover:bg-slate-800/70',
                className
            )}
        >
            {/* Background gradient glow */}
            <div className={cn(
                'absolute -bottom-6 -right-6 h-20 w-20 rounded-full opacity-20 blur-2xl bg-gradient-to-r',
                styles.accent
            )} />

            <div className="relative">
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-slate-400">{title}</span>
                    {Icon && <Icon className={cn('h-5 w-5', styles.icon)} />}
                </div>

                {/* Value */}
                <div className="text-xl sm:text-2xl font-bold text-slate-100 mb-1">{value}</div>

                {/* Subtitle / Trend */}
                <div className="flex items-center justify-between">
                    {subtitle && <span className="text-xs text-slate-500">{subtitle}</span>}
                    {trend && trendValue && (
                        <div className={cn('flex items-center gap-1', trendColor)}>
                            <TrendIcon className="h-3 w-3" />
                            <span className="text-xs font-medium">{trendValue}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    if (isClickable) {
        return <button onClick={onClick} className="w-full text-left">{Content}</button>;
    }

    return Content;
}

