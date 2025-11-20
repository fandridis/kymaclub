import React from 'react';

interface SciFiBackgroundProps {
    children?: React.ReactNode;
    className?: string;
}

export const SciFiBackground = ({ children, className = '' }: SciFiBackgroundProps) => {
    return (
        <div className={`min-h-screen bg-black relative overflow-hidden ${className}`}>
            {/* Animated grid background */}
            <div className="absolute inset-0 opacity-10 pointer-events-none">
                <div className="absolute inset-0" style={{
                    backgroundImage: `
                        linear-gradient(cyan 1px, transparent 1px),
                        linear-gradient(90deg, cyan 1px, transparent 1px)
                    `,
                    backgroundSize: '50px 50px',
                    animation: 'gridMove 20s linear infinite'
                }} />
            </div>

            {/* Glitch overlay effect */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-cyan-500/3 animate-pulse" style={{
                    clipPath: 'polygon(0 0, 100% 0, 100% 35%, 0 35%)',
                    animation: 'glitch1 3s infinite'
                }} />
                <div className="absolute inset-0 bg-green-500/3 animate-pulse" style={{
                    clipPath: 'polygon(0 65%, 100% 65%, 100% 100%, 0 100%)',
                    animation: 'glitch2 3s infinite 0.2s'
                }} />
            </div>

            {/* Content */}
            <div className="relative z-10 h-full">
                {children}
            </div>

            {/* Keyframe animations */}
            <style>{`
                @keyframes gridMove {
                    0% { transform: translate(0, 0); }
                    100% { transform: translate(50px, 50px); }
                }
                @keyframes glitch1 {
                    0%, 100% { transform: translate(0); opacity: 0.3; }
                    20% { transform: translate(-1px, 1px); opacity: 0.4; }
                    40% { transform: translate(-1px, -1px); opacity: 0.3; }
                    60% { transform: translate(1px, 1px); opacity: 0.4; }
                    80% { transform: translate(1px, -1px); opacity: 0.3; }
                }
                @keyframes glitch2 {
                    0%, 100% { transform: translate(0); opacity: 0.3; }
                    20% { transform: translate(1px, -1px); opacity: 0.4; }
                    40% { transform: translate(1px, 1px); opacity: 0.3; }
                    60% { transform: translate(-1px, -1px); opacity: 0.4; }
                    80% { transform: translate(-1px, 1px); opacity: 0.3; }
                }
            `}</style>
        </div>
    );
};
