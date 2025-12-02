import { cn } from '@/lib/utils';

interface NexusLoaderProps {
    className?: string;
    size?: 'sm' | 'md' | 'lg';
    fullScreen?: boolean;
}

export function NexusLoader({ className, size = 'md', fullScreen = false }: NexusLoaderProps) {
    const sizes = {
        sm: 'w-12 h-12',
        md: 'w-24 h-24',
        lg: 'w-32 h-32',
    };

    const Spinner = (
        <div className={cn('relative', sizes[size], className)}>
            {/* Outer ring - ping animation */}
            <div className="absolute inset-0 border-4 border-cyan-500/30 rounded-full animate-ping" />
            {/* First spinning ring */}
            <div className="absolute inset-2 border-4 border-t-cyan-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin" />
            {/* Second spinning ring (reverse) */}
            <div className="absolute inset-4 border-4 border-r-purple-500 border-t-transparent border-b-transparent border-l-transparent rounded-full animate-spin-slow" style={{ animationDirection: 'reverse' }} />
            {/* Third spinning ring */}
            <div className="absolute inset-6 border-4 border-b-blue-500 border-t-transparent border-r-transparent border-l-transparent rounded-full animate-spin-slower" />
            {/* Inner pulsing dot */}
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
            </div>
        </div>
    );

    if (fullScreen) {
        return (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center z-50">
                {Spinner}
                <div className="mt-6 text-cyan-400 font-mono text-sm tracking-wider animate-pulse">
                    SYSTEM INITIALIZING
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center py-12">
            {Spinner}
            <div className="mt-4 text-cyan-400/60 font-mono text-xs tracking-wider">
                Loading...
            </div>
        </div>
    );
}

