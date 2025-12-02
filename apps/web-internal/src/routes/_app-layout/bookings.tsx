import { createFileRoute } from '@tanstack/react-router';
import { useBookings, Booking } from '@/hooks/use-bookings';
import { NexusLoader, NexusMetricCard } from '@/components/nexus';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Calendar, User, MapPin, Euro, CheckCircle2, XCircle, UserX, Activity, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { useCallback, useState } from 'react';
import { useQuery } from "convex/react";
import { api } from "@repo/api/convex/_generated/api";
import { BookingsTrendChart } from '@/components/dashboard/BookingsTrendChart';
import { cn } from '@/lib/utils';

export const Route = createFileRoute('/_app-layout/bookings')({
    component: BookingsPage,
});

type BookingStatus = "latest" | "cancelled_by_consumer" | "cancelled_by_business" | "no_show";

function BookingsPage() {
    const [status, setStatus] = useState<BookingStatus>("latest");
    const { results: bookings, loadMore, status: queryStatus } = useBookings(10, status);
    const metrics = useQuery(api.internal.queries.bookings.getBookingsMetric);

    const bookingList = bookings || [];
    const hasMore = queryStatus === "CanLoadMore";
    const isLoading = queryStatus === "LoadingFirstPage";
    const isLoadingMore = queryStatus === "LoadingMore";

    const handleLoadMore = useCallback(() => {
        if (queryStatus === "CanLoadMore" && !isLoadingMore) {
            loadMore(30);
        }
    }, [queryStatus, isLoadingMore, loadMore]);

    // Format numbers with commas
    const formatNumber = (num: number | undefined) => {
        if (num === undefined) return '...';
        return num.toLocaleString();
    };

    return (
        <div className="p-3 sm:p-4 md:p-6">
            {/* Header Card */}
            <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm overflow-hidden">
                <CardHeader className="border-b border-slate-700/50 pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-slate-100 flex items-center">
                            <Calendar className="mr-2 h-5 w-5 text-blue-500" />
                            Bookings Management
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
                            title="Completed"
                            value={formatNumber(metrics?.completedBookings.value)}
                            icon={CheckCircle2}
                            color="green"
                            trend={metrics?.completedBookings.diff ? (metrics.completedBookings.diff >= 0 ? 'up' : 'down') : undefined}
                            trendValue={metrics?.completedBookings.diff ? `${metrics.completedBookings.diff >= 0 ? '+' : ''}${metrics.completedBookings.diff.toFixed(1)}%` : undefined}
                            subtitle="vs last month"
                        />
                        <NexusMetricCard
                            title="No-Show Rate"
                            value={`${metrics?.noShowPercentage.value.toFixed(1) ?? '0.0'}%`}
                            icon={UserX}
                            color="amber"
                            trend={metrics?.noShowPercentage.diff ? (metrics.noShowPercentage.diff <= 0 ? 'up' : 'down') : undefined}
                            trendValue={metrics?.noShowPercentage.diff ? `${metrics.noShowPercentage.diff >= 0 ? '+' : ''}${metrics.noShowPercentage.diff.toFixed(1)}%` : undefined}
                            subtitle="vs last month"
                        />
                        <NexusMetricCard
                            title="Total Records"
                            value={formatNumber(bookingList.length)}
                            icon={Calendar}
                            color="cyan"
                            subtitle="Loaded records"
                        />
                        <NexusMetricCard
                            title="Query Status"
                            value={queryStatus.replace(/([A-Z])/g, ' $1').trim()}
                            icon={Activity}
                            color="purple"
                            subtitle="Data sync"
                        />
                    </div>

                    {/* Chart */}
                    <div>
                        <BookingsTrendChart data={metrics?.trend ?? []} />
                    </div>
                </CardContent>
            </Card>

            {/* Status Tabs - Floating above list */}
            <div className="mt-6 mb-3">
                <Tabs value={status} onValueChange={(value) => setStatus(value as BookingStatus)}>
                    <TabsList className="bg-slate-900/90 border border-slate-700/50 p-1 backdrop-blur-sm shadow-lg">
                        <TabsTrigger
                            value="latest"
                            className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400 text-slate-400 hover:text-slate-200 text-xs sm:text-sm"
                        >
                            Latest
                        </TabsTrigger>
                        <TabsTrigger
                            value="cancelled_by_consumer"
                            className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400 text-slate-400 hover:text-slate-200 text-xs sm:text-sm"
                        >
                            <span className="hidden sm:inline">Cancelled by User</span>
                            <span className="sm:hidden">By User</span>
                        </TabsTrigger>
                        <TabsTrigger
                            value="cancelled_by_business"
                            className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400 text-slate-400 hover:text-slate-200 text-xs sm:text-sm"
                        >
                            <span className="hidden sm:inline">Cancelled by Business</span>
                            <span className="sm:hidden">By Business</span>
                        </TabsTrigger>
                        <TabsTrigger
                            value="no_show"
                            className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400 text-slate-400 hover:text-slate-200 text-xs sm:text-sm"
                        >
                            No Shows
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            {/* Bookings List */}
            {isLoading ? (
                <NexusLoader />
            ) : bookingList.length === 0 ? (
                <Card className="bg-slate-900/50 border-slate-700/50">
                    <CardContent className="p-8 text-center">
                        <Calendar className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                        <p className="text-slate-400">No bookings found</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-1.5 sm:space-y-2">
                    {bookingList.map((booking) => (
                        <BookingCard key={booking._id} booking={booking} />
                    ))}
                </div>
            )}

            {/* Load More Button */}
            {hasMore && (
                <div className="flex justify-center mt-6">
                    <Button
                        onClick={handleLoadMore}
                        disabled={queryStatus !== "CanLoadMore"}
                        className="bg-slate-800/50 border border-slate-700/50 hover:bg-slate-700/50 text-cyan-400"
                    >
                        {isLoadingMore ? 'Loading...' : 'Load More'}
                    </Button>
                </div>
            )}

            {!hasMore && bookingList.length > 0 && (
                <div className="text-center mt-6 text-slate-500 text-sm">
                    All bookings loaded
                </div>
            )}
        </div>
    );
}

interface BookingCardProps {
    booking: Booking;
}

function BookingCard({ booking }: BookingCardProps) {
    const startTime = booking.classInstanceSnapshot?.startTime
        ? new Date(booking.classInstanceSnapshot.startTime)
        : null;
    const endTime = booking.classInstanceSnapshot?.endTime
        ? new Date(booking.classInstanceSnapshot.endTime)
        : null;
    const bookedAt = new Date(booking.bookedAt);

    type BookingStatusType = "pending" | "completed" | "cancelled_by_consumer" | "cancelled_by_business" | "cancelled_by_business_rebookable" | "no_show";
    const status: BookingStatusType = booking.status as BookingStatusType;

    const getStatusConfig = () => {
        switch (status) {
            case "completed":
                return { icon: CheckCircle2, color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30', label: 'COMPLETED' };
            case "cancelled_by_consumer":
            case "cancelled_by_business":
            case "cancelled_by_business_rebookable":
                return { icon: XCircle, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', label: status === 'cancelled_by_consumer' ? 'CANCELLED BY USER' : 'CANCELLED BY BUSINESS' };
            case "no_show":
                return { icon: UserX, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', label: 'NO SHOW' };
            default:
                return { icon: Calendar, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', label: 'PENDING' };
        }
    };

    const config = getStatusConfig();
    const StatusIcon = config.icon;

    return (
        <Card className="bg-slate-900/50 border-slate-700/50 hover:bg-slate-800/50 transition-colors">
            <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-4">
                    {/* Icon */}
                    <div className={cn("p-2 rounded-lg", config.bg, config.border, "border")}>
                        <StatusIcon className={cn("w-4 h-4", config.color)} />
                    </div>

                    {/* Main content */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                            <h3 className="text-slate-200 font-medium truncate">
                                {booking.classInstanceSnapshot?.name || 'Unnamed Class'}
                            </h3>
                            <Badge variant="outline" className={cn("text-xs", config.color, config.border)}>
                                {config.label}
                            </Badge>
                        </div>
                        <div className="flex items-center gap-4 flex-wrap text-sm">
                            {startTime && (
                                <div className="flex items-center gap-1.5 text-slate-400">
                                    <Calendar className="w-3.5 h-3.5" />
                                    <span>
                                        {format(startTime, 'MMM dd')}
                                        {endTime && (
                                            <> • {format(startTime, 'HH:mm')}-{format(endTime, 'HH:mm')}</>
                                        )}
                                    </span>
                                </div>
                            )}
                            {booking.venueSnapshot?.name && (
                                <div className="flex items-center gap-1.5 text-slate-400">
                                    <MapPin className="w-3.5 h-3.5" />
                                    <span className="truncate max-w-[150px]">{booking.venueSnapshot.name}</span>
                                </div>
                            )}
                            {booking.userSnapshot && (
                                <div className="flex items-center gap-1.5 text-slate-400">
                                    <User className="w-3.5 h-3.5" />
                                    <span className="truncate max-w-[150px]">
                                        {booking.userSnapshot.name || booking.userSnapshot.email || 'Unknown'}
                                    </span>
                                </div>
                            )}
                            {booking.finalPrice !== undefined && booking.finalPrice !== null && (
                                <div className="flex items-center gap-1.5 text-slate-400">
                                    <Euro className="w-3.5 h-3.5" />
                                    <span>€{(booking.finalPrice / 100).toFixed(2)}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ID */}
                    <div className="hidden md:block text-xs text-slate-500 font-mono bg-slate-800/50 px-2 py-1 rounded border border-slate-700/50">
                        {booking._id.slice(-8)}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
