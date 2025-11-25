import * as React from "react";
import { cn } from "@/lib/utils";
import { getSciFiColors, SciFiColor } from "./sci-fi-card";

interface SciFiButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'default' | 'outline' | 'ghost';
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    color?: SciFiColor;
    children: React.ReactNode;
    autoFormat?: boolean; // Whether to auto-format content with brackets and uppercase
}

const sizeStyles = {
    xs: {
        padding: 'px-3 py-1.5',
        text: 'text-xs',
    },
    sm: {
        padding: 'px-4 py-2',
        text: 'text-sm',
    },
    md: {
        padding: 'px-5 py-2.5',
        text: 'text-base',
    },
    lg: {
        padding: 'px-6 py-3',
        text: 'text-lg',
    },
    xl: {
        padding: 'px-8 py-4',
        text: 'text-xl',
    },
};

export function SciFiButton({
    variant = 'default',
    size = 'md',
    color = 'cyan',
    className,
    children,
    disabled,
    autoFormat = false,
    ...props
}: SciFiButtonProps) {
    const styles = getSciFiColors(color);
    const sizeStyle = sizeStyles[size];

    // Format content if autoFormat is enabled
    const formatContent = (content: React.ReactNode): React.ReactNode => {
        if (!autoFormat) return content;

        if (typeof content === 'string') {
            return `[ ${content.toUpperCase()} ]`;
        }
        // If it's not a string, convert to string first
        const contentStr = String(content).trim();
        return `[ ${contentStr.toUpperCase()} ]`;
    };

    const formattedContent = formatContent(children);

    const variantStyles = {
        default: {
            bg: styles.bg,
            border: styles.border,
            text: styles.text,
            hover: styles.hover,
            hoverBg: styles.bg.replace('/10', '/20'),
        },
        outline: {
            bg: 'bg-transparent',
            border: styles.border,
            text: styles.text,
            hover: `hover:${styles.bg} ${styles.hover}`,
            hoverBg: styles.bg,
        },
        ghost: {
            bg: 'bg-transparent',
            border: 'border-transparent',
            text: styles.text,
            hover: `hover:${styles.bg} hover:${styles.text}`,
            hoverBg: styles.bg,
        },
    };

    const variantStyle = variantStyles[variant];

    // Get hover glow color for box-shadow
    const getHoverGlowColor = () => {
        // Extract the color from the glow shadow style
        // Format: shadow-[0_0_20px_rgba(r,g,b,0.3)]
        const glowMatch = styles.glow.match(/rgba\((\d+),(\d+),(\d+),([\d.]+)\)/);
        if (glowMatch && glowMatch[1] && glowMatch[2] && glowMatch[3] && glowMatch[4]) {
            const [, r, g, b, a] = glowMatch;
            return `rgba(${r},${g},${b},${parseFloat(a) * 1.5})`; // Increase opacity for hover
        }
        // Fallback colors
        const colorMap: Record<SciFiColor, string> = {
            zinc: 'rgba(243,244,246,0.5)',
            cyan: 'rgba(6,182,212,0.5)',
            green: 'rgba(34,197,94,0.5)',
            purple: 'rgba(168,85,247,0.5)',
            yellow: 'rgba(234,179,8,0.5)',
            orange: 'rgba(251,146,60,0.5)',
            pink: 'rgba(236,72,153,0.5)',
        };
        return colorMap[color];
    };

    const hoverGlowColor = getHoverGlowColor();

    return (
        <button
            className={cn(
                "group relative inline-block font-mono tracking-wider transition-all duration-300",
                disabled && "opacity-50 cursor-not-allowed",
                className
            )}
            disabled={disabled}
            {...props}
        >
            <div
                className={cn(
                    "relative border-2 uppercase transition-all duration-300",
                    !disabled && "hover:scale-[1.02]",
                    sizeStyle.padding,
                    sizeStyle.text,
                    variantStyle.bg,
                    variantStyle.border,
                    variantStyle.text,
                    !disabled && variantStyle.hover
                )}
                style={!disabled ? {
                    '--glow-color': hoverGlowColor,
                    boxShadow: '0 0 0 0 transparent',
                    transition: 'all 0.3s ease, box-shadow 0.3s ease',
                } as React.CSSProperties & { '--glow-color': string } : undefined}
                onMouseEnter={(e) => {
                    if (!disabled) {
                        e.currentTarget.style.boxShadow = `0 0 20px var(--glow-color, ${hoverGlowColor})`;
                        const overlay = e.currentTarget.querySelector('[data-button-overlay]') as HTMLElement;
                        if (overlay) {
                            overlay.style.opacity = '1';
                        }
                    }
                }}
                onMouseLeave={(e) => {
                    if (!disabled) {
                        e.currentTarget.style.boxShadow = '0 0 0 0 transparent';
                        const overlay = e.currentTarget.querySelector('[data-button-overlay]') as HTMLElement;
                        if (overlay) {
                            overlay.style.opacity = '0';
                        }
                    }
                }}
            >
                <span className="relative z-10">{formattedContent}</span>
                {!disabled && (
                    <div
                        data-button-overlay
                        className={cn(
                            "absolute inset-0 opacity-0 transition-opacity duration-300",
                            variantStyle.hoverBg
                        )}
                        style={{ opacity: 0 }}
                    />
                )}
            </div>
        </button>
    );
}

