import { createFileRoute } from '@tanstack/react-router';
import { useBookings, Booking } from '@/hooks/use-bookings';
import { SciFiListLoader } from '@/components/sci-fi-list-loader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, User, MapPin, Euro, CheckCircle2, XCircle, UserX } from 'lucide-react';
import { format } from 'date-fns';
import { useCallback, useState } from 'react';
import { useQuery } from "convex/react";
import { api } from "@repo/api/convex/_generated/api";
import { SciFiMetricCard } from '@/components/sci-fi-metric-card';
import { BookingsTrendChart } from '@/components/dashboard/BookingsTrendChart';
import { SciFiCard } from "@/components/sci-fi-card";

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
        <div className="container mx-auto px-4 py-8">
            {/* Header */}
            <div className="mb-6 font-mono">
                <div className="text-pink-400 text-sm mb-2 tracking-wider">
                    {'> BOOKINGS.EXE'}
                </div>
                <div className="text-green-400 text-xs mb-3">
                    {'[SYSTEM] Bookings Management v1.0.0'}
                </div>
                <h1 className="text-3xl md:text-5xl font-black mb-2 tracking-tighter">
                    <span className="text-pink-400 drop-shadow-[0_0_20px_rgba(236,72,153,0.8)]">
                        BOOKINGS
                    </span>
                </h1>
                <div className="text-pink-400/60 text-xs font-mono tracking-wider">
                    {isLoading ? '[LOADING...]' : `[TOTAL: ${bookingList.length}] [STATUS: ${queryStatus}]`}
                </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <div className="space-y-6 flex flex-col">
                    <SciFiMetricCard
                        mainMetric={formatNumber(metrics?.completedBookings.value)}
                        mainMetricLabel="Completed Bookings"
                        secondaryMetricValue={metrics?.completedBookings.diff}
                        secondaryMetricType="percentage"
                        secondaryMetricLabel="VS LAST MONTH"
                        color='cyan'
                    />
                    <SciFiMetricCard
                        mainMetric={`${metrics?.noShowPercentage.value.toFixed(1) ?? '0.0'}%`}
                        mainMetricLabel="No-Show Percentage"
                        secondaryMetricValue={metrics?.noShowPercentage.diff}
                        secondaryMetricType="percentage"
                        secondaryMetricLabel="VS LAST MONTH"
                        color='yellow'
                    />
                </div>
                <div className="lg:col-span-2">
                    <BookingsTrendChart data={metrics?.trend ?? []} />
                </div>
            </div>

            {/* Status Tabs */}
            <div className="mb-6">
                <Tabs value={status} onValueChange={(value) => setStatus(value as BookingStatus)}>
                    <TabsList className="bg-pink-500/20 border-2 border-pink-500/50 font-mono p-1">
                        <TabsTrigger
                            value="latest"
                            className="data-[state=active]:bg-pink-500 data-[state=active]:text-white text-pink-300 hover:text-pink-100 hover:bg-pink-500/30 transition-all"
                        >
                            {'>'} LATEST
                        </TabsTrigger>
                        <TabsTrigger
                            value="cancelled_by_consumer"
                            className="data-[state=active]:bg-pink-500 data-[state=active]:text-white text-pink-300 hover:text-pink-100 hover:bg-pink-500/30 transition-all"
                        >
                            {'>'} CANCELLED BY USER
                        </TabsTrigger>
                        <TabsTrigger
                            value="cancelled_by_business"
                            className="data-[state=active]:bg-pink-500 data-[state=active]:text-white text-pink-300 hover:text-pink-100 hover:bg-pink-500/30 transition-all"
                        >
                            {'>'} CANCELLED BY BUSINESS
                        </TabsTrigger>
                        <TabsTrigger
                            value="no_show"
                            className="data-[state=active]:bg-pink-500 data-[state=active]:text-white text-pink-300 hover:text-pink-100 hover:bg-pink-500/30 transition-all"
                        >
                            {'>'} NO SHOWS
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            {/* Bookings List */}
            {
                isLoading ? (
                    <SciFiListLoader count={5} cardHeight="h-30" />
                ) : bookingList.length === 0 ? (
                    <Card className="border-pink-500/30 bg-pink-500/10">
                        <CardContent className="p-6 text-center">
                            <div className="text-pink-400 font-mono text-sm">
                                {'> No bookings found'}
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-2 mb-6">
                        {bookingList.map((booking) => (
                            <BookingCard key={booking._id} booking={booking} />
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
                            disabled={queryStatus !== "CanLoadMore"}
                            className="font-mono border-2 border-pink-500 bg-pink-500/10 text-pink-400 hover:bg-pink-500/20 hover:border-pink-400 text-sm py-2 px-4"
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
                !hasMore && bookingList.length > 0 && (
                    <div className="text-center mt-6 text-pink-400/60 text-xs font-mono">
                        {'> All bookings loaded'}
                    </div>
                )
            }
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

    const getStatusIcon = () => {
        switch (status) {
            case "completed":
                return <CheckCircle2 className="w-4 h-4 text-green-400" />;
            case "cancelled_by_consumer":
            case "cancelled_by_business":
            case "cancelled_by_business_rebookable":
                return <XCircle className="w-4 h-4 text-yellow-400" />;
            case "no_show":
                return <UserX className="w-4 h-4 text-red-400" />;
            default:
                return <Calendar className="w-4 h-4 text-cyan-400" />;
        }
    };

    const getStatusLabel = () => {
        switch (status) {
            case "completed":
                return "COMPLETED";
            case "cancelled_by_consumer":
                return "CANCELLED BY USER";
            case "cancelled_by_business":
                return "CANCELLED BY BUSINESS";
            case "cancelled_by_business_rebookable":
                return "CANCELLED BY BUSINESS (REBOOKABLE)";
            case "no_show":
                return "NO SHOW";
            default:
                return "PENDING";
        }
    };

    const getStatusColor = (status: BookingStatusType) => {
        switch (status) {
            case "completed":
                return "text-green-400";
            case "cancelled_by_consumer":
            case "cancelled_by_business":
            case "cancelled_by_business_rebookable":
                return "text-yellow-400";
            case "no_show":
                return "text-red-400";
            default:
                return "text-cyan-400";
        }
    };

    return (
        <SciFiCard color="pink" hoverEffect={true} className="overflow-hidden">
            <CardContent className="p-6 relative z-10">
                <div className="flex items-center gap-4">
                    {/* Icon */}
                    <div className="flex-shrink-0 p-2 rounded-lg bg-pink-500/20 border border-pink-500/50 shadow-[0_0_10px_rgba(236,72,153,0.2)]">
                        {getStatusIcon()}
                    </div>

                    {/* Main content - compact horizontal layout */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1.5">
                            <h3 className="text-pink-200 font-mono font-bold text-base truncate tracking-wide drop-shadow-[0_0_5px_rgba(236,72,153,0.5)]">
                                {booking.classInstanceSnapshot?.name || 'Unnamed Class'}
                            </h3>
                            <span className={`text-xs font-mono px-2 py-0.5 rounded border ${getStatusColor(status)} border-current/30`}>
                                {getStatusLabel()}
                            </span>
                        </div>
                        <div className="flex items-center gap-4 flex-wrap text-sm">
                            {startTime && (
                                <div className="flex items-center gap-1.5 text-pink-300 font-medium">
                                    <Calendar className="w-4 h-4 flex-shrink-0" />
                                    <span className="font-mono">
                                        {format(startTime, 'MMM dd')}
                                        {endTime && (
                                            <> • {format(startTime, 'HH:mm')}-{format(endTime, 'HH:mm')}</>
                                        )}
                                    </span>
                                </div>
                            )}

                            {booking.venueSnapshot?.name && (
                                <div className="flex items-center gap-1.5 text-pink-300 font-medium">
                                    <MapPin className="w-4 h-4 flex-shrink-0" />
                                    <span className="font-mono truncate max-w-[200px]">
                                        {booking.venueSnapshot.name}
                                    </span>
                                </div>
                            )}

                            {booking.userSnapshot && (
                                <div className="flex items-center gap-1.5 text-pink-300 font-medium">
                                    <User className="w-4 h-4 flex-shrink-0" />
                                    <span className="font-mono truncate max-w-[200px]">
                                        {booking.userSnapshot.name || booking.userSnapshot.email || 'Unknown User'}
                                    </span>
                                </div>
                            )}

                            {booking.finalPrice !== undefined && booking.finalPrice !== null && (
                                <div className="flex items-center gap-1.5 text-pink-300 font-medium">
                                    <Euro className="w-4 h-4 flex-shrink-0" />
                                    <span className="font-mono">
                                        €{(booking.finalPrice / 100).toFixed(2)}
                                    </span>
                                </div>
                            )}

                            <div className="flex items-center gap-1.5 text-pink-300/60 font-medium text-xs">
                                <span className="font-mono">
                                    Booked: {format(bookedAt, 'MMM dd, HH:mm')}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* ID - compact */}
                    <div className="flex-shrink-0 text-pink-400/60 text-xs font-mono hidden md:block border border-pink-500/30 px-2 py-1 rounded bg-pink-500/10">
                        {booking._id.slice(-8)}
                    </div>
                </div>
            </CardContent>
        </SciFiCard>
    );
}

