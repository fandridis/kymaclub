import { cn } from '@/lib/utils';
import { AlertCircle, CheckCircle2, Info, AlertTriangle, Download, type LucideIcon } from 'lucide-react';

interface NexusAlertProps {
    title: string;
    description?: string;
    time?: string;
    type?: 'info' | 'success' | 'warning' | 'error' | 'update';
}

const typeConfig: Record<string, { icon: LucideIcon; color: string; bg: string; border: string }> = {
    info: {
        icon: Info,
        color: 'text-blue-400',
        bg: 'bg-blue-500/10',
        border: 'border-blue-500/30',
    },
    success: {
        icon: CheckCircle2,
        color: 'text-green-400',
        bg: 'bg-green-500/10',
        border: 'border-green-500/30',
    },
    warning: {
        icon: AlertTriangle,
        color: 'text-amber-400',
        bg: 'bg-amber-500/10',
        border: 'border-amber-500/30',
    },
    error: {
        icon: AlertCircle,
        color: 'text-red-400',
        bg: 'bg-red-500/10',
        border: 'border-red-500/30',
    },
    update: {
        icon: Download,
        color: 'text-cyan-400',
        bg: 'bg-cyan-500/10',
        border: 'border-cyan-500/30',
    },
};

export function NexusAlert({ title, description, time, type = 'info' }: NexusAlertProps) {
    const config = typeConfig[type];
    const Icon = config.icon;

    return (
        <div className="flex items-start gap-3">
            <div className={cn('mt-0.5 p-1.5 rounded-full', config.bg, config.border, 'border')}>
                <Icon className={cn('h-3 w-3', config.color)} />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-200 truncate">{title}</span>
                    {time && <span className="text-xs text-slate-500 flex-shrink-0">{time}</span>}
                </div>
                {description && (
                    <p className="text-xs text-slate-400 mt-0.5">{description}</p>
                )}
            </div>
        </div>
    );
}

