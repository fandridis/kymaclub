import { useState, useEffect } from 'react';

interface SciFiLoaderProps {
    fullScreen?: boolean;
    lines?: string[];
}

const DEFAULT_LINES = [
    'INITIALIZING_SYSTEM...',
    'LOADING_MODULES',
    'CONNECTING_TO_DATABASE',
    'SYNCING_DATA_STREAMS',
    'ESTABLISHING_CONNECTION'
];

export const SciFiLoader = ({ fullScreen = false, lines = DEFAULT_LINES }: SciFiLoaderProps = {}) => {
    const [activeIndex, setActiveIndex] = useState(0); // Active line within visible set (0, 1, or 2)
    const [visibleStartIndex, setVisibleStartIndex] = useState(0); // Starting index of visible lines
    const VISIBLE_LINES = 3;

    useEffect(() => {
        // Calculate the absolute active line index
        const absoluteActiveIndex = visibleStartIndex + activeIndex;

        // If we've reached the last line, stop
        if (absoluteActiveIndex >= lines.length - 1) return;

        const timings = [
            1500,   // First visible line: 1 second
            2000,   // Second visible line: 1.5 seconds
            1500,   // Third visible line: 1.5 seconds, then scroll
        ];

        const timing = timings[activeIndex] || 1500;

        const timer = setTimeout(() => {
            if (activeIndex < VISIBLE_LINES - 1) {
                // Move to next visible line (0 -> 1 -> 2)
                setActiveIndex(activeIndex + 1);
            } else {
                // We're at the last visible line (index 2)
                // Check if we can scroll to show more lines
                const nextStartIndex = visibleStartIndex + 1;
                if (nextStartIndex + VISIBLE_LINES <= lines.length) {
                    // Scroll up: move visible window forward
                    // The new bottom line will become active
                    setVisibleStartIndex(nextStartIndex);
                    // activeIndex stays at 2 (the bottom position)
                }
                // If we've reached the end, stay there (no more updates)
            }
        }, timing);

        return () => clearTimeout(timer);
    }, [activeIndex, visibleStartIndex, lines.length]);

    const visibleLines = lines.slice(visibleStartIndex, visibleStartIndex + VISIBLE_LINES);

    return (
        <div className={`relative w-full ${fullScreen ? 'h-screen' : 'min-h-96'} flex items-center justify-center ${fullScreen ? 'bg-black' : 'bg-transparent'} overflow-hidden`}>
            {/* Animated grid background */}
            <div className="absolute inset-0 opacity-10">
                <div
                    className="absolute inset-0"
                    style={{
                        backgroundImage: `
                            linear-gradient(cyan 1px, transparent 1px),
                            linear-gradient(90deg, cyan 1px, transparent 1px)
                        `,
                        backgroundSize: '50px 50px',
                        animation: 'gridMove 20s linear infinite'
                    }}
                />
            </div>

            {/* Holographic scan lines */}
            <div className="absolute inset-0 pointer-events-none">
                <div
                    className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent"
                    style={{
                        height: '2px',
                        animation: 'scanLine 2s linear infinite'
                    }}
                />
            </div>

            {/* Main loader container */}
            <div className="relative z-10 flex flex-col items-center gap-8">
                {/* Holographic display frame */}
                <div className="relative">
                    {/* Outer glow */}
                    <div className="absolute -inset-4 bg-cyan-500/20 blur-2xl rounded-lg animate-pulse" />

                    {/* Main frame */}
                    <div className="relative border-2 border-cyan-500/50 bg-black/80 backdrop-blur-sm rounded-lg p-8 shadow-[0_0_40px_rgba(6,182,212,0.5)]">
                        {/* Corner brackets */}
                        <div className="absolute top-2 left-2 text-cyan-400 text-xs font-mono">┌─</div>
                        <div className="absolute top-2 right-2 text-cyan-400 text-xs font-mono">─┐</div>
                        <div className="absolute bottom-2 left-2 text-cyan-400 text-xs font-mono">└─</div>
                        <div className="absolute bottom-2 right-2 text-cyan-400 text-xs font-mono">─┘</div>

                        {/* Terminal text */}
                        <div className="font-mono text-cyan-400 space-y-2 min-w-[300px] relative" style={{ height: '72px', overflow: 'hidden' }}>
                            {visibleLines.map((line, index) => {
                                const isActive = index === activeIndex;
                                // Opacity: active line is full, previous lines fade, future lines are dim
                                const opacity = isActive ? 1 : (index < activeIndex ? 0.6 : 0.4);
                                const textColor = isActive ? 'text-cyan-300' : (index < activeIndex ? 'text-cyan-400/60' : 'text-cyan-400/40');

                                // Check if this is a newly scrolled-in line (bottom line after scroll)
                                const isNewLine = index === 2 && visibleStartIndex > 0;

                                return (
                                    <div
                                        key={`${visibleStartIndex}-${index}`}
                                        className="flex items-center gap-2 transition-all duration-500 ease-in-out absolute w-full"
                                        style={{
                                            opacity,
                                            top: `${index * 24}px`,
                                            animation: isNewLine ? 'scrollUp 0.5s ease-in-out' : 'none',
                                        }}
                                    >
                                        <span className={isActive ? 'text-green-400' : 'text-cyan-400/60'}>
                                            {'>'}
                                        </span>
                                        <span className={isActive ? 'animate-pulse' : ''}>█</span>
                                        <span className={textColor}>{line}</span>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Progress bar */}
                        <div className="mt-6 relative">
                            <div className="h-1 bg-cyan-500/20 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-cyan-500 via-green-400 to-cyan-500 rounded-full"
                                    style={{
                                        width: '100%',
                                        animation: 'progressBar 2s ease-in-out infinite',
                                        boxShadow: '0 0 10px rgba(6,182,212,0.8)'
                                    }}
                                />
                            </div>
                            <div className="absolute inset-0 bg-cyan-500/10 animate-pulse" />
                        </div>
                    </div>
                </div>

                {/* Hex code display */}
                <div className="font-mono text-cyan-400/40 text-xs tracking-widest">
                    {'[0x4C4F4144494E47]'}
                </div>

                {/* Floating particles */}
                <div className="absolute inset-0 pointer-events-none">
                    {[...Array(6)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute w-1 h-1 bg-cyan-400 rounded-full"
                            style={{
                                left: `${20 + i * 15}%`,
                                top: `${30 + (i % 2) * 40}%`,
                                animation: `float${i} ${2 + i * 0.3}s ease-in-out infinite`,
                                animationDelay: `${i * 0.2}s`,
                                boxShadow: '0 0 6px rgba(6,182,212,0.8)'
                            }}
                        />
                    ))}
                </div>
            </div>

            {/* Keyframe animations */}
            <style>{`
                @keyframes gridMove {
                    0% { transform: translate(0, 0); }
                    100% { transform: translate(50px, 50px); }
                }
                @keyframes scanLine {
                    0% { transform: translateY(-100%); }
                    100% { transform: translateY(100vh); }
                }
                @keyframes scrollUp {
                    0% { transform: translateY(4px); opacity: 0; }
                    100% { transform: translateY(0); opacity: 1; }
                }
                @keyframes progressBar {
                    0%, 100% { transform: translateX(-100%); }
                    50% { transform: translateX(100%); }
                }
                @keyframes float0 {
                    0%, 100% { transform: translateY(0) translateX(0); opacity: 0.3; }
                    50% { transform: translateY(-20px) translateX(10px); opacity: 1; }
                }
                @keyframes float1 {
                    0%, 100% { transform: translateY(0) translateX(0); opacity: 0.3; }
                    50% { transform: translateY(-15px) translateX(-8px); opacity: 1; }
                }
                @keyframes float2 {
                    0%, 100% { transform: translateY(0) translateX(0); opacity: 0.3; }
                    50% { transform: translateY(-25px) translateX(12px); opacity: 1; }
                }
                @keyframes float3 {
                    0%, 100% { transform: translateY(0) translateX(0); opacity: 0.3; }
                    50% { transform: translateY(-18px) translateX(-10px); opacity: 1; }
                }
                @keyframes float4 {
                    0%, 100% { transform: translateY(0) translateX(0); opacity: 0.3; }
                    50% { transform: translateY(-22px) translateX(8px); opacity: 1; }
                }
                @keyframes float5 {
                    0%, 100% { transform: translateY(0) translateX(0); opacity: 0.3; }
                    50% { transform: translateY(-16px) translateX(-12px); opacity: 1; }
                }
            `}</style>
        </div>
    );
};

