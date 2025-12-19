import { useEffect, useState } from 'react';
import { AuthorizeBusinessDialog } from './AuthorizeBusinessDialog';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
    Shield,
    RefreshCw,
    Download,
    Terminal,
    Radio,
    Lock,
    Zap,
    CircleOff,
} from 'lucide-react';

function ActionButton({ icon: Icon, label }: { icon: React.ComponentType<{ className?: string }>; label: string }) {
    return (
        <Button
            variant="outline"
            className="h-auto py-3 px-3 border-slate-700 bg-slate-800/50 hover:bg-slate-700/50 flex flex-col items-center justify-center gap-1 w-full"
        >
            <Icon className="h-5 w-5 text-cyan-500" />
            <span className="text-xs">{label}</span>
        </Button>
    );
}

export function NexusRightSidebar() {
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    return (
        <div className="flex flex-col gap-4 p-4 h-full overflow-y-auto nexus-scrollbar">
            {/* System Time Card */}
            <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm overflow-hidden">
                <CardContent className="p-0">
                    <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 border-b border-slate-700/50">
                        <div className="text-center">
                            <div className="text-xs text-slate-500 mb-1 font-mono tracking-wider">SYSTEM TIME</div>
                            <div className="text-3xl font-mono text-cyan-400 mb-1">{formatTime(currentTime)}</div>
                            <div className="text-sm text-slate-400">{formatDate(currentTime)}</div>
                        </div>
                    </div>
                    <div className="p-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-slate-800/50 rounded-md p-3 border border-slate-700/50">
                                <div className="text-xs text-slate-500 mb-1">Environment</div>
                                <div className="text-sm font-mono text-slate-200">DEV</div>
                            </div>
                            <div className="bg-slate-800/50 rounded-md p-3 border border-slate-700/50">
                                <div className="text-xs text-slate-500 mb-1">Region</div>
                                <div className="text-sm font-mono text-slate-200">EU-WEST</div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
                <CardHeader className="pb-2">
                    <CardTitle className="text-slate-100 text-base">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-3">
                        <AuthorizeBusinessDialog
                            trigger={
                                <Button
                                    variant="outline"
                                    className="h-auto py-3 px-3 border-slate-700 bg-slate-800/50 hover:bg-slate-700/50 flex flex-col items-center justify-center gap-1 w-full"
                                >
                                    <Shield className="h-5 w-5 text-cyan-500" />
                                    <span className="text-xs">Authorize Business</span>
                                </Button>
                            }
                        />
                        <ActionButton icon={RefreshCw} label="Sync Data" />
                        <ActionButton icon={Download} label="Export" />
                        <ActionButton icon={Terminal} label="Console" />
                    </div>
                </CardContent>
            </Card>

            {/* Resource Allocation */}
            <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
                <CardHeader className="pb-2">
                    <CardTitle className="text-slate-100 text-base">Platform Stats</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-sm text-slate-400">API Response</span>
                                <span className="text-xs text-cyan-400">~45ms</span>
                            </div>
                            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                                    style={{ width: '15%' }}
                                />
                            </div>
                        </div>
                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-sm text-slate-400">Database Load</span>
                                <span className="text-xs text-purple-400">32%</span>
                            </div>
                            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                                    style={{ width: '32%' }}
                                />
                            </div>
                        </div>
                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-sm text-slate-400">Active Users</span>
                                <span className="text-xs text-green-400">Live</span>
                            </div>
                            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full animate-pulse"
                                    style={{ width: '68%' }}
                                />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* System Controls */}
            <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
                <CardHeader className="pb-2">
                    <CardTitle className="text-slate-100 text-base">System Status</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                                <Label className="text-sm text-slate-400">Convex Backend</Label>
                            </div>
                            <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30 text-xs">
                                Online
                            </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                                <Label className="text-sm text-slate-400">Auth Service</Label>
                            </div>
                            <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30 text-xs">
                                Active
                            </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                                <Label className="text-sm text-slate-400">File Storage</Label>
                            </div>
                            <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30 text-xs">
                                Ready
                            </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-cyan-500 animate-pulse" />
                                <Label className="text-sm text-slate-400">Cron Jobs</Label>
                            </div>
                            <Badge variant="outline" className="bg-cyan-500/10 text-cyan-400 border-cyan-500/30 text-xs">
                                Running
                            </Badge>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

