import * as React from "react";
import { cn } from "@/lib/utils";

interface AdminButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'default' | 'destructive';
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    children: React.ReactNode;
}

const variantStyles = {
    primary: {
        border: 'border-cyan-500',
        text: 'text-cyan-400',
        bg: 'bg-gradient-to-r from-cyan-500/20 to-green-500/20',
        hover: 'hover:border-green-400 hover:text-green-400 hover:shadow-[0_0_30px_rgba(34,197,94,0.5)]',
        hoverBg: 'from-cyan-500/10 to-green-500/10',
        glow: 'bg-cyan-500/20',
    },
    default: {
        border: 'border-gray-500',
        text: 'text-gray-300',
        bg: 'bg-gradient-to-r from-gray-500/10 to-gray-400/10',
        hover: 'hover:border-gray-400 hover:text-gray-200 hover:shadow-[0_0_20px_rgba(156,163,175,0.3)]',
        hoverBg: 'from-gray-500/5 to-gray-400/5',
        glow: 'bg-gray-500/10',
    },
    destructive: {
        border: 'border-red-500',
        text: 'text-red-400',
        bg: 'bg-gradient-to-r from-red-500/20 to-orange-500/20',
        hover: 'hover:border-orange-400 hover:text-orange-400 hover:shadow-[0_0_30px_rgba(251,146,60,0.5)]',
        hoverBg: 'from-red-500/10 to-orange-500/10',
        glow: 'bg-red-500/20',
    },
};

const sizeStyles = {
    xs: {
        padding: 'px-4 py-2',
        text: 'text-xs',
    },
    sm: {
        padding: 'px-5 py-2.5',
        text: 'text-sm',
    },
    md: {
        padding: 'px-6 py-3',
        text: 'text-base',
    },
    lg: {
        padding: 'px-7 py-3.5',
        text: 'text-lg',
    },
    xl: {
        padding: 'px-8 py-4',
        text: 'text-lg',
    },
};

export function AdminButton({
    variant = 'default',
    size = 'md',
    className,
    children,
    disabled,
    ...props
}: AdminButtonProps) {
    const styles = variantStyles[variant];
    const sizeStyle = sizeStyles[size];

    // Automatically wrap content in brackets and uppercase it
    const formatContent = (content: React.ReactNode): string => {
        if (typeof content === 'string') {
            return `[ ${content.toUpperCase()} ]`;
        }
        // If it's not a string, convert to string first
        const contentStr = String(content).trim();
        return `[ ${contentStr.toUpperCase()} ]`;
    };

    const formattedContent = formatContent(children);

    return (
        <button
            className={cn(
                "group relative inline-block",
                disabled && "opacity-50 cursor-not-allowed",
                className
            )}
            disabled={disabled}
            {...props}
        >
            <div className={cn(
                "relative border-2 font-mono tracking-wider uppercase transition-all duration-300",
                !disabled && "hover:scale-[1.02]",
                sizeStyle.padding,
                sizeStyle.text,
                styles.bg,
                styles.border,
                styles.text,
                !disabled && styles.hover
            )}>
                <span className="relative z-10">{formattedContent}</span>
                {!disabled && (
                    <>
                        <div className={cn(
                            "absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-300",
                            styles.hoverBg
                        )} />
                        <div className={cn(
                            "absolute -inset-1 blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300",
                            styles.glow
                        )} />
                    </>
                )}
            </div>
        </button>
    );
}

