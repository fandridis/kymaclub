import { Bell, Hexagon, Moon, Search, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { CommandMenu } from '@/components/command-menu';

interface NexusHeaderProps {
    userName?: string;
    userEmail?: string;
}

export function NexusHeader({ userName, userEmail }: NexusHeaderProps) {
    const initials = userName
        ? userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
        : userEmail
            ? userEmail[0].toUpperCase()
            : 'KC';

    return (
        <header className="flex items-center justify-between py-4 px-6 border-b border-slate-700/50 bg-slate-900/30 backdrop-blur-sm">
            {/* Logo */}
            <div className="flex items-center gap-2">
                <Hexagon className="h-8 w-8 text-cyan-500" />
                <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                    KYMACLUB
                </span>
                <span className="text-xs text-slate-500 font-mono ml-2">INTERNAL</span>
            </div>

            {/* Search and Actions */}
            <div className="flex items-center gap-4">
                {/* Command Menu */}
                <CommandMenu />

                {/* Notifications */}
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="relative text-slate-400 hover:text-slate-100"
                            >
                                <Bell className="h-5 w-5" />
                                <span className="absolute -top-1 -right-1 h-2 w-2 bg-cyan-500 rounded-full animate-pulse" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Notifications</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>

                {/* User Avatar */}
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Avatar className="h-9 w-9 border-2 border-slate-700 cursor-pointer hover:border-cyan-500/50 transition-colors">
                                <AvatarImage src="" alt={userName || 'User'} />
                                <AvatarFallback className="bg-slate-800 text-cyan-400 text-sm font-mono">
                                    {initials}
                                </AvatarFallback>
                            </Avatar>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{userName || userEmail || 'Admin'}</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
        </header>
    );
}

