import { createFileRoute } from '@tanstack/react-router';
import { useClassInstances, ClassInstance } from '@/hooks/use-class-instances';
import { SciFiListLoader } from '@/components/sci-fi-list-loader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Calendar, MapPin, Users, Euro } from 'lucide-react';
import { format } from 'date-fns';
import { useCallback, useState } from 'react';
import { useQuery } from "convex/react";
import { api } from "@repo/api/convex/_generated/api";
import { SciFiMetricCard } from '@/components/sci-fi-metric-card';
import { ClassesTrendChart } from '@/components/dashboard/ClassesTrendChart';
import { SciFiCard } from "@/components/sci-fi-card";

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

    console.log(metrics);

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Header */}
            <div className="mb-6 font-mono">
                <div className="text-purple-400 text-sm mb-2 tracking-wider">
                    {'> CLASSES.EXE'}
                </div>
                <div className="text-green-400 text-xs mb-3">
                    {'[SYSTEM] Class Instances Management v1.0.0'}
                </div>
                <h1 className="text-3xl md:text-5xl font-black mb-2 tracking-tighter">
                    <span className="text-purple-400 drop-shadow-[0_0_20px_rgba(168,85,247,0.8)]">
                        CLASS INSTANCES
                    </span>
                </h1>
                <div className="text-purple-400/60 text-xs font-mono tracking-wider">
                    {isLoading ? '[LOADING...]' : `[TOTAL: ${instances.length}] [STATUS: ${status}]`}
                </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <div className="space-y-6 flex flex-col">
                    <SciFiMetricCard
                        mainMetric={metrics?.scheduledClasses.value ?? 0}
                        mainMetricLabel="Scheduled Classes"
                        secondaryMetricValue={metrics?.scheduledClasses.diff}
                        secondaryMetricType="percentage"
                        secondaryMetricLabel="VS LAST MONTH"
                        color='pink'
                    />
                    <SciFiMetricCard
                        mainMetric={`€${((metrics?.averageClassCost.value ?? 0) / 100).toFixed(2)}`}
                        mainMetricLabel="Average Class Cost"
                        secondaryMetricLabel="LAST 100 CLASSES"
                        color='yellow'
                    />
                </div>
                <div className="lg:col-span-2">
                    <ClassesTrendChart data={metrics?.trend ?? []} />
                </div>
            </div>


            {/* Sort Tabs */}
            <div className="mb-6">
                <Tabs value={sortBy} onValueChange={(value) => setSortBy(value as SortBy)}>
                    <TabsList className="bg-cyan-500/20 border-2 border-cyan-500/50 font-mono p-1">
                        <TabsTrigger
                            value="latest"
                            className="data-[state=active]:bg-cyan-500 data-[state=active]:text-white text-cyan-300 hover:text-cyan-100 hover:bg-cyan-500/30 transition-all"
                        >
                            {'>'} LATEST
                        </TabsTrigger>
                        <TabsTrigger
                            value="most_expensive"
                            className="data-[state=active]:bg-cyan-500 data-[state=active]:text-white text-cyan-300 hover:text-cyan-100 hover:bg-cyan-500/30 transition-all"
                        >
                            {'>'} MOST EXPENSIVE
                        </TabsTrigger>
                        <TabsTrigger
                            value="capacity"
                            className="data-[state=active]:bg-cyan-500 data-[state=active]:text-white text-cyan-300 hover:text-cyan-100 hover:bg-cyan-500/30 transition-all"
                        >
                            {'>'} BY CAPACITY
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            {/* Classes List */}
            {
                isLoading ? (
                    <SciFiListLoader count={5} cardHeight="h-30" colorTheme="cyan" />
                ) : instances.length === 0 ? (
                    <Card className="border-cyan-500/30 bg-cyan-500/10">
                        <CardContent className="p-6 text-center">
                            <div className="text-cyan-400 font-mono text-sm">
                                {'> No class instances found'}
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-2 mb-6">
                        {instances.map((instance) => (
                            <ClassInstanceCard key={instance._id} instance={instance} />
                        ))}
                    </div>
                )
            }

            {/* Load More Button */}
            {
                hasMore && (
                    <div className="flex justify-center mt-6">
                        <Button
                            onClick={handleLoadMore}
                            disabled={status !== "CanLoadMore"}
                            className="font-mono border-2 border-cyan-500 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 hover:border-cyan-400 text-sm py-2 px-4"
                        >
                            {isLoadingMore ? (
                                <>
                                    <span className="animate-pulse">█</span>
                                    <span className="ml-2">Loading...</span>
                                </>
                            ) : (
                                <>
                                    {'>'} LOAD MORE
                                </>
                            )}
                        </Button>
                    </div>
                )
            }

            {
                !hasMore && instances.length > 0 && (
                    <div className="text-center mt-6 text-cyan-400/60 text-xs font-mono">
                        {'> All class instances loaded'}
                    </div>
                )
            }
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
        <SciFiCard color="cyan" hoverEffect={true} className="overflow-hidden">
            <CardContent className="p-6 relative z-10">
                <div className="flex items-center gap-4">
                    {/* Icon */}
                    <div className="flex-shrink-0 p-2 rounded-lg bg-cyan-500/20 border border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.2)]">
                        <BookOpen className="w-5 h-5 text-cyan-300" />
                    </div>

                    {/* Main content - compact horizontal layout */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1.5">
                            <h3 className="text-cyan-200 font-mono font-bold text-base truncate tracking-wide drop-shadow-[0_0_5px_rgba(6,182,212,0.5)]">
                                {instance.name || instance.templateSnapshot?.name || 'Unnamed Class'}
                            </h3>
                        </div>
                        <div className="flex items-center gap-4 flex-wrap text-sm">
                            <div className="flex items-center gap-1.5 text-cyan-300 font-medium">
                                <Calendar className="w-4 h-4 flex-shrink-0" />
                                <span className="font-mono">
                                    {format(startDate, 'MMM dd')} • {format(startDate, 'HH:mm')}-{format(endDate, 'HH:mm')}
                                </span>
                            </div>

                            {instance.venueSnapshot && (
                                <div className="flex items-center gap-1.5 text-cyan-300 font-medium">
                                    <MapPin className="w-4 h-4 flex-shrink-0" />
                                    <span className="font-mono truncate max-w-[200px]">
                                        {instance.venueSnapshot.name}
                                        {instance.venueSnapshot.address?.city && (
                                            <> • {instance.venueSnapshot.address.city}</>
                                        )}
                                    </span>
                                </div>
                            )}

                            <div className="flex items-center gap-1.5 text-cyan-300 font-medium">
                                <Users className="w-4 h-4 flex-shrink-0" />
                                <span className="font-mono">
                                    {instance.bookedCount}/{capacity}
                                    {availableSpots > 0 && (
                                        <span className="text-green-400 ml-1 font-bold drop-shadow-[0_0_5px_rgba(74,222,128,0.5)]">
                                            ({availableSpots})
                                        </span>
                                    )}
                                </span>
                            </div>

                            {instance.price !== undefined && instance.price !== null && (
                                <div className="flex items-center gap-1.5 text-cyan-300 font-medium">
                                    <Euro className="w-4 h-4 flex-shrink-0" />
                                    <span className="font-mono">
                                        €{(instance.price / 100).toFixed(2)}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ID - compact */}
                    <div className="flex-shrink-0 text-cyan-400/60 text-xs font-mono hidden md:block border border-cyan-500/30 px-2 py-1 rounded bg-cyan-500/10">
                        {instance._id.slice(-8)}
                    </div>
                </div>
            </CardContent>
        </SciFiCard>
    );
}

