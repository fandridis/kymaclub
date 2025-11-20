type ColorTheme = 'cyan' | 'green' | 'yellow' | 'purple' | 'orange' | 'pink';

interface SciFiListLoaderProps {
    count?: number;
    cardHeight?: string;
    colorTheme?: ColorTheme;
}

const getColorClasses = (color: ColorTheme) => {
    const colors = {
        cyan: {
            border: 'border-cyan-500/30',
            bg: 'bg-cyan-500/10',
            bgGlow: 'bg-cyan-500/5',
            bgGlow2: 'bg-cyan-500/5',
            text: 'text-cyan-400/40',
            skeleton: 'bg-cyan-500/20 border-cyan-500/30',
            skeletonText: 'bg-cyan-500/15 border-cyan-500/20',
            scanLine: 'rgba(6,182,212,0.1)',
        },
        green: {
            border: 'border-green-500/30',
            bg: 'bg-green-500/10',
            bgGlow: 'bg-green-500/5',
            bgGlow2: 'bg-green-500/5',
            text: 'text-green-400/40',
            skeleton: 'bg-green-500/20 border-green-500/30',
            skeletonText: 'bg-green-500/15 border-green-500/20',
            scanLine: 'rgba(34,197,94,0.1)',
        },
        yellow: {
            border: 'border-yellow-500/30',
            bg: 'bg-yellow-500/10',
            bgGlow: 'bg-yellow-500/5',
            bgGlow2: 'bg-yellow-500/5',
            text: 'text-yellow-400/40',
            skeleton: 'bg-yellow-500/20 border-yellow-500/30',
            skeletonText: 'bg-yellow-500/15 border-yellow-500/20',
            scanLine: 'rgba(234,179,8,0.1)',
        },
        purple: {
            border: 'border-purple-500/30',
            bg: 'bg-purple-500/10',
            bgGlow: 'bg-purple-500/5',
            bgGlow2: 'bg-purple-500/5',
            text: 'text-purple-400/40',
            skeleton: 'bg-purple-500/20 border-purple-500/30',
            skeletonText: 'bg-purple-500/15 border-purple-500/20',
            scanLine: 'rgba(168,85,247,0.1)',
        },
        orange: {
            border: 'border-orange-500/30',
            bg: 'bg-orange-500/10',
            bgGlow: 'bg-orange-500/5',
            bgGlow2: 'bg-orange-500/5',
            text: 'text-orange-400/40',
            skeleton: 'bg-orange-500/20 border-orange-500/30',
            skeletonText: 'bg-orange-500/15 border-orange-500/20',
            scanLine: 'rgba(251,146,60,0.1)',
        },
        pink: {
            border: 'border-pink-500/30',
            bg: 'bg-pink-500/10',
            bgGlow: 'bg-pink-500/5',
            bgGlow2: 'bg-pink-500/5',
            text: 'text-pink-400/40',
            skeleton: 'bg-pink-500/20 border-pink-500/30',
            skeletonText: 'bg-pink-500/15 border-pink-500/20',
            scanLine: 'rgba(236,72,153,0.1)',
        },
    };
    return colors[color];
};

export const SciFiListLoader = ({ count = 5, cardHeight = "h-24", colorTheme = 'purple' }: SciFiListLoaderProps) => {
    const colors = getColorClasses(colorTheme);
    return (
        <div className="space-y-3">
            {[...Array(count)].map((_, index) => (
                <div
                    key={index}
                    className={`relative ${cardHeight} border-2 ${colors.border} ${colors.bg} rounded-lg overflow-hidden`}
                >
                    {/* Animated grid background */}
                    <div className="absolute inset-0 opacity-5">
                        <div
                            className="absolute inset-0"
                            style={{
                                backgroundImage: `
                                    linear-gradient(cyan 1px, transparent 1px),
                                    linear-gradient(90deg, cyan 1px, transparent 1px)
                                `,
                                backgroundSize: '30px 30px',
                                animation: 'gridMove 20s linear infinite'
                            }}
                        />
                    </div>

                    {/* Glitch overlay effect */}
                    <div className="absolute inset-0 pointer-events-none">
                        <div
                            className={`absolute inset-0 ${colors.bgGlow} animate-pulse`}
                            style={{
                                clipPath: 'polygon(0 0, 100% 0, 100% 50%, 0 50%)',
                                animation: 'glitch1 1.5s infinite',
                                animationDelay: `${index * 0.1}s`
                            }}
                        />
                        <div
                            className={`absolute inset-0 ${colors.bgGlow2} animate-pulse`}
                            style={{
                                clipPath: 'polygon(0 50%, 100% 50%, 100% 100%, 0 100%)',
                                animation: 'glitch2 1.5s infinite 0.2s',
                                animationDelay: `${index * 0.1}s`
                            }}
                        />
                    </div>

                    {/* Content skeleton */}
                    <div className="relative z-10 h-full flex items-center px-4 gap-4">
                        {/* Icon placeholder */}
                        <div className={`w-8 h-8 ${colors.skeleton} rounded border animate-pulse`} />

                        {/* Text placeholders */}
                        <div className="flex-1 space-y-2">
                            <div className={`h-4 ${colors.skeleton} rounded border animate-pulse`} style={{ width: `${60 + (index % 3) * 10}%` }} />
                            <div className={`h-3 ${colors.skeletonText} rounded border animate-pulse`} style={{ width: `${40 + (index % 2) * 15}%`, animationDelay: '0.2s' }} />
                        </div>

                        {/* Right side placeholder */}
                        <div className={`w-16 h-6 ${colors.skeleton} rounded border animate-pulse`} style={{ animationDelay: '0.4s' }} />
                    </div>

                    {/* Terminal-style corner brackets */}
                    <div className={`absolute top-1 left-1 ${colors.text} text-xs font-mono`}>┌</div>
                    <div className={`absolute top-1 right-1 ${colors.text} text-xs font-mono`}>┐</div>
                    <div className={`absolute bottom-1 left-1 ${colors.text} text-xs font-mono`}>└</div>
                    <div className={`absolute bottom-1 right-1 ${colors.text} text-xs font-mono`}>┘</div>

                    {/* Scanning line effect */}
                    <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                            background: `linear-gradient(to bottom, transparent 0%, ${colors.scanLine} 50%, transparent 100%)`,
                            height: '2px',
                            animation: `scanLine${index} 2s linear infinite`,
                            animationDelay: `${index * 0.3}s`
                        }}
                    />
                </div>
            ))}

            {/* Keyframe animations */}
            <style>{`
                @keyframes gridMove {
                    0% { transform: translate(0, 0); }
                    100% { transform: translate(30px, 30px); }
                }
                @keyframes glitch1 {
                    0%, 100% { transform: translate(0); opacity: 0.3; }
                    20% { transform: translate(-1px, 1px); opacity: 0.5; }
                    40% { transform: translate(-1px, -1px); opacity: 0.4; }
                    60% { transform: translate(1px, 1px); opacity: 0.5; }
                    80% { transform: translate(1px, -1px); opacity: 0.4; }
                }
                @keyframes glitch2 {
                    0%, 100% { transform: translate(0); opacity: 0.3; }
                    20% { transform: translate(1px, -1px); opacity: 0.5; }
                    40% { transform: translate(1px, 1px); opacity: 0.4; }
                    60% { transform: translate(-1px, -1px); opacity: 0.5; }
                    80% { transform: translate(-1px, 1px); opacity: 0.4; }
                }
                ${[...Array(count)].map((_, i) => `
                    @keyframes scanLine${i} {
                        0% { transform: translateY(-100%); opacity: 0; }
                        50% { opacity: 1; }
                        100% { transform: translateY(200%); opacity: 0; }
                    }
                `).join('')}
            `}</style>
        </div>
    );
};

