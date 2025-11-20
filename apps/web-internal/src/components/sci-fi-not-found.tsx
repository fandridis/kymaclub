import { Link } from '@tanstack/react-router';

export const SciFiNotFound = () => {
    return (
        <div className="min-h-screen bg-black relative overflow-hidden flex items-center justify-center">
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

            {/* Main content */}
            <div className="relative z-10 text-center px-8 max-w-4xl">
                {/* Terminal-style header */}
                <div className="mb-8 font-mono">
                    <div className="text-cyan-400 text-sm mb-2 tracking-wider">
                        {'> ERROR_404.EXE'}
                    </div>
                    <div className="text-red-400 text-xs mb-4">
                        {'[SYSTEM] Resource Not Found v1.0.0'}
                    </div>
                </div>

                {/* Main error message with glitch effect */}
                <div className="relative mb-8">
                    <h1 className="text-6xl md:text-8xl font-black mb-4 tracking-tighter">
                        <span className="text-red-500 drop-shadow-[0_0_20px_rgba(239,68,68,0.8)] relative inline-block">
                            <span className="absolute inset-0 text-cyan-400 blur-sm opacity-75 animate-pulse" style={{ transform: 'translate(2px, 2px)' }}>
                                404
                            </span>
                            404
                        </span>
                    </h1>
                    <div className="text-cyan-400 text-lg md:text-xl font-mono mt-4 tracking-wider">
                        {'[ERROR_CODE: 0x504147454E4F54464F554E44]'}
                    </div>
                </div>

                {/* Terminal-style message */}
                <div className="bg-black/80 border-2 border-cyan-500/50 p-6 md:p-8 mb-8 font-mono text-left backdrop-blur-sm shadow-[0_0_30px_rgba(6,182,212,0.3)]">
                    <div className="space-y-2 text-green-400 text-sm md:text-base">
                        <div className="flex items-start gap-2">
                            <span className="text-cyan-400">{'>'}</span>
                            <span className="animate-pulse">█</span>
                            <span>Resource not found in system database</span>
                        </div>
                        <div className="flex items-start gap-2">
                            <span className="text-cyan-400">{'>'}</span>
                            <span className="animate-pulse">█</span>
                            <span>Requested path does not exist</span>
                        </div>
                        <div className="flex items-start gap-2">
                            <span className="text-cyan-400">{'>'}</span>
                            <span className="animate-pulse">█</span>
                            <span>Initiating redirect protocol...</span>
                        </div>
                        <div className="flex items-start gap-2 mt-4">
                            <span className="text-cyan-400">{'>'}</span>
                            <span className="animate-pulse">█</span>
                            <span className="text-yellow-400">System locked. Returning to dashboard...</span>
                        </div>
                    </div>
                </div>

                {/* Action button with sci-fi styling */}
                <Link
                    to="/dashboard"
                    className="inline-block group relative"
                >
                    <div className="relative px-8 py-4 bg-gradient-to-r from-cyan-500/20 to-green-500/20 border-2 border-cyan-500 font-mono text-cyan-400 text-lg tracking-wider uppercase transition-all duration-300 hover:border-green-400 hover:text-green-400 hover:shadow-[0_0_30px_rgba(34,197,94,0.5)] hover:scale-105">
                        <span className="relative z-10">[ RETURN TO DASHBOARD ]</span>
                        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-green-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <div className="absolute -inset-1 bg-cyan-500/20 blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                </Link>
                <div className="mt-8 text-cyan-400/50 text-xs font-mono">
                    {'> Press [RETURN TO DASHBOARD] to continue...'}
                </div>
            </div>

            {/* Floating particles */}
            <div className="absolute inset-0 pointer-events-none">
                {[...Array(8)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute w-1 h-1 bg-cyan-400 rounded-full"
                        style={{
                            left: `${15 + i * 12}%`,
                            top: `${20 + (i % 3) * 30}%`,
                            animation: `float${i % 6} ${2 + i * 0.3}s ease-in-out infinite`,
                            animationDelay: `${i * 0.2}s`,
                            boxShadow: '0 0 6px rgba(6,182,212,0.8)'
                        }}
                    />
                ))}
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

