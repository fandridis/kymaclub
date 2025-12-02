import { createFileRoute } from '@tanstack/react-router';
import { useClassInstances, ClassInstance } from '@/hooks/use-class-instances';
import { NexusLoader, NexusMetricCard } from '@/components/nexus';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Calendar, MapPin, Users, Euro, Activity, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { useCallback, useState } from 'react';
import { useQuery } from "convex/react";
import { api } from "@repo/api/convex/_generated/api";
import { ClassesTrendChart } from '@/components/dashboard/ClassesTrendChart';
import { cn } from '@/lib/utils';

export const Route = createFileRoute('/_app-layout/classes')({
    component: ClassesPage,
});

type SortBy = "latest" | "most_expensive" | "capacity";

function ClassesPage() {
    const [sortBy, setSortBy] = useState<SortBy>("latest");
    const { results: classInstances, loadMore, status } = useClassInstances(10, sortBy);
    const metrics = useQuery(api.internal.queries.classInstances.getClassInstancesMetric);

    const instances = classInstances || [];
    const hasMore = status === "CanLoadMore";
    const isLoading = status === "LoadingFirstPage";
    const isLoadingMore = status === "LoadingMore";

    const handleLoadMore = useCallback(() => {
        if (status === "CanLoadMore" && !isLoadingMore) {
            loadMore(30);
        }
    }, [status, isLoadingMore, loadMore]);

    return (
        <div className="p-3 sm:p-4 md:p-6">
            {/* Header Card */}
            <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm overflow-hidden">
                <CardHeader className="border-b border-slate-700/50 pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-slate-100 flex items-center">
                            <BookOpen className="mr-2 h-5 w-5 text-purple-500" />
                            Class Instances
                        </CardTitle>
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-slate-800/50 text-cyan-400 border-cyan-500/50 text-xs">
                                <div className="h-1.5 w-1.5 rounded-full bg-cyan-500 mr-1 animate-pulse" />
                                LIVE
                            </Badge>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
                                <RefreshCw className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 md:p-6">
                    {/* Metrics Row */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-6">
                        <NexusMetricCard
                            title="Scheduled"
                            value={metrics?.scheduledClasses.value ?? 0}
                            icon={Calendar}
                            color="purple"
                            trend={metrics?.scheduledClasses.diff ? (metrics.scheduledClasses.diff >= 0 ? 'up' : 'down') : undefined}
                            trendValue={metrics?.scheduledClasses.diff ? `${metrics.scheduledClasses.diff >= 0 ? '+' : ''}${metrics.scheduledClasses.diff.toFixed(1)}%` : undefined}
                            subtitle="vs last month"
                        />
                        <NexusMetricCard
                            title="Avg Cost"
                            value={`€${((metrics?.averageClassCost.value ?? 0) / 100).toFixed(2)}`}
                            icon={Euro}
                            color="amber"
                            subtitle="last 100 classes"
                        />
                        <NexusMetricCard
                            title="Total Loaded"
                            value={instances.length}
                            icon={BookOpen}
                            color="cyan"
                            subtitle="Records shown"
                        />
                        <NexusMetricCard
                            title="Query Status"
                            value={status.replace(/([A-Z])/g, ' $1').trim()}
                            icon={Activity}
                            color="green"
                            subtitle="Data sync"
                        />
                    </div>

                    {/* Chart */}
                    <div>
                        <ClassesTrendChart data={metrics?.trend ?? []} />
                    </div>
                </CardContent>
            </Card>

            {/* Sort Tabs - Floating above list */}
            <div className="mt-6 mb-3">
                <Tabs value={sortBy} onValueChange={(value) => setSortBy(value as SortBy)}>
                    <TabsList className="bg-slate-900/90 border border-slate-700/50 p-1 backdrop-blur-sm shadow-lg">
                        <TabsTrigger
                            value="latest"
                            className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400 text-slate-400 hover:text-slate-200 text-xs sm:text-sm"
                        >
                            Latest
                        </TabsTrigger>
                        <TabsTrigger
                            value="most_expensive"
                            className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400 text-slate-400 hover:text-slate-200 text-xs sm:text-sm"
                        >
                            <span className="hidden sm:inline">Most Expensive</span>
                            <span className="sm:hidden">Expensive</span>
                        </TabsTrigger>
                        <TabsTrigger
                            value="capacity"
                            className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400 text-slate-400 hover:text-slate-200 text-xs sm:text-sm"
                        >
                            <span className="hidden sm:inline">By Capacity</span>
                            <span className="sm:hidden">Capacity</span>
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            {/* Classes List */}
            {isLoading ? (
                <NexusLoader />
            ) : instances.length === 0 ? (
                <Card className="bg-slate-900/50 border-slate-700/50">
                    <CardContent className="p-8 text-center">
                        <BookOpen className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                        <p className="text-slate-400">No class instances found</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-1.5 sm:space-y-2">
                    {instances.map((instance) => (
                        <ClassInstanceCard key={instance._id} instance={instance} />
                    ))}
                </div>
            )}

            {/* Load More Button */}
            {hasMore && (
                <div className="flex justify-center mt-6">
                    <Button
                        onClick={handleLoadMore}
                        disabled={status !== "CanLoadMore"}
                        className="bg-slate-800/50 border border-slate-700/50 hover:bg-slate-700/50 text-cyan-400"
                    >
                        {isLoadingMore ? 'Loading...' : 'Load More'}
                    </Button>
                </div>
            )}

            {!hasMore && instances.length > 0 && (
                <div className="text-center mt-6 text-slate-500 text-sm">
                    All class instances loaded
                </div>
            )}
        </div>
    );
}

interface ClassInstanceCardProps {
    instance: ClassInstance;
}

function ClassInstanceCard({ instance }: ClassInstanceCardProps) {
    const startDate = new Date(instance.startTime);
    const endDate = new Date(instance.endTime);
    const capacity = instance.capacity ?? 0;
    const availableSpots = capacity - instance.bookedCount;

    return (
        <Card className="bg-slate-900/50 border-slate-700/50 hover:bg-slate-800/50 transition-colors">
            <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-4">
                    {/* Icon */}
                    <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/30">
                        <BookOpen className="w-4 h-4 text-purple-400" />
                    </div>

                    {/* Main content */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                            <h3 className="text-slate-200 font-medium truncate">
                                {instance.name || instance.templateSnapshot?.name || 'Unnamed Class'}
                            </h3>
                        </div>
                        <div className="flex items-center gap-4 flex-wrap text-sm">
                            <div className="flex items-center gap-1.5 text-slate-400">
                                <Calendar className="w-3.5 h-3.5" />
                                <span>
                                    {format(startDate, 'MMM dd')} • {format(startDate, 'HH:mm')}-{format(endDate, 'HH:mm')}
                                </span>
                            </div>
                            {instance.venueSnapshot && (
                                <div className="flex items-center gap-1.5 text-slate-400">
                                    <MapPin className="w-3.5 h-3.5" />
                                    <span className="truncate max-w-[150px]">
                                        {instance.venueSnapshot.name}
                                        {instance.venueSnapshot.address?.city && (
                                            <> • {instance.venueSnapshot.address.city}</>
                                        )}
                                    </span>
                                </div>
                            )}
                            <div className="flex items-center gap-1.5 text-slate-400">
                                <Users className="w-3.5 h-3.5" />
                                <span>
                                    {instance.bookedCount}/{capacity}
                                    {availableSpots > 0 && (
                                        <span className="text-green-400 ml-1">({availableSpots})</span>
                                    )}
                                </span>
                            </div>
                            {instance.price !== undefined && instance.price !== null && (
                                <div className="flex items-center gap-1.5 text-slate-400">
                                    <Euro className="w-3.5 h-3.5" />
                                    <span>€{(instance.price / 100).toFixed(2)}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ID */}
                    <div className="hidden md:block text-xs text-slate-500 font-mono bg-slate-800/50 px-2 py-1 rounded border border-slate-700/50">
                        {instance._id.slice(-8)}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
