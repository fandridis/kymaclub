import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

export type SciFiColor = 'cyan' | 'green' | 'purple' | 'yellow' | 'orange' | 'pink';

interface SciFiCardProps {
    children: ReactNode;
    className?: string;
    color?: SciFiColor;
    hoverEffect?: boolean;
}

export const getSciFiColors = (color: SciFiColor) => {
    const colors = {
        cyan: {
            border: 'border-cyan-500',
            text: 'text-cyan-400',
            bg: 'bg-cyan-500/10',
            glow: 'shadow-[0_0_20px_rgba(6,182,212,0.3)]',
            hover: 'hover:border-cyan-400 hover:bg-cyan-500/20 hover:shadow-[0_0_30px_rgba(6,182,212,0.4)]',
            badge: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10',
            corner: 'text-cyan-500',
        },
        green: {
            border: 'border-green-500',
            text: 'text-green-400',
            bg: 'bg-green-500/10',
            glow: 'shadow-[0_0_20px_rgba(34,197,94,0.3)]',
            hover: 'hover:border-green-400 hover:bg-green-500/20 hover:shadow-[0_0_30px_rgba(34,197,94,0.4)]',
            badge: 'text-green-400 border-green-500/30 bg-green-500/10',
            corner: 'text-green-500',
        },
        purple: {
            border: 'border-purple-500',
            text: 'text-purple-400',
            bg: 'bg-purple-500/10',
            glow: 'shadow-[0_0_20px_rgba(168,85,247,0.3)]',
            hover: 'hover:border-purple-400 hover:bg-purple-500/20 hover:shadow-[0_0_30px_rgba(168,85,247,0.4)]',
            badge: 'text-purple-400 border-purple-500/30 bg-purple-500/10',
            corner: 'text-purple-500',
        },
        yellow: {
            border: 'border-yellow-500',
            text: 'text-yellow-400',
            bg: 'bg-yellow-500/10',
            glow: 'shadow-[0_0_20px_rgba(234,179,8,0.3)]',
            hover: 'hover:border-yellow-400 hover:bg-yellow-500/20 hover:shadow-[0_0_30px_rgba(234,179,8,0.4)]',
            badge: 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10',
            corner: 'text-yellow-500',
        },
        orange: {
            border: 'border-orange-500',
            text: 'text-orange-400',
            bg: 'bg-orange-500/10',
            glow: 'shadow-[0_0_20px_rgba(251,146,60,0.3)]',
            hover: 'hover:border-orange-400 hover:bg-orange-500/20 hover:shadow-[0_0_30px_rgba(251,146,60,0.4)]',
            badge: 'text-orange-400 border-orange-500/30 bg-orange-500/10',
            corner: 'text-orange-500',
        },
        pink: {
            border: 'border-pink-500',
            text: 'text-pink-400',
            bg: 'bg-pink-500/10',
            glow: 'shadow-[0_0_20px_rgba(236,72,153,0.3)]',
            hover: 'hover:border-pink-400 hover:bg-pink-500/20 hover:shadow-[0_0_30px_rgba(236,72,153,0.4)]',
            badge: 'text-pink-400 border-pink-500/30 bg-pink-500/10',
            corner: 'text-pink-500',
        },
    };
    return colors[color];
};

export function SciFiCard({ children, className, color = 'purple', hoverEffect = true }: SciFiCardProps) {
    const styles = getSciFiColors(color);

    return (
        <Card className={cn(
            "relative border-2 overflow-hidden transition-all duration-300 backdrop-blur-sm group",
            styles.bg,
            styles.border,
            styles.glow,
            hoverEffect && styles.hover,
            className
        )}>
            {/* Corner brackets */}
            <div className={cn("absolute top-2 left-2 text-xs font-bold transition-colors opacity-70 group-hover:opacity-100", styles.corner)}>{'┌─'}</div>
            <div className={cn("absolute top-2 right-2 text-xs font-bold transition-colors opacity-70 group-hover:opacity-100", styles.corner)}>{'─┐'}</div>
            <div className={cn("absolute bottom-2 left-2 text-xs font-bold transition-colors opacity-70 group-hover:opacity-100", styles.corner)}>{'└─'}</div>
            <div className={cn("absolute bottom-2 right-2 text-xs font-bold transition-colors opacity-70 group-hover:opacity-100", styles.corner)}>{'─┘'}</div>

            {/* Content */}
            <div className="relative z-10 h-full">
                {children}
            </div>

            {/* Hover glow effect overlay */}
            {hoverEffect && (
                <div className={cn(
                    "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none",
                    styles.bg.replace('/10', '/5')
                )} />
            )}
        </Card>
    );
}
