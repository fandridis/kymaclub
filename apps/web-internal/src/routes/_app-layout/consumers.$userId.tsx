import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { useConsumerDetail } from '@/hooks/use-consumer-detail';
import { SciFiLoader } from '@/components/sci-fi-loader';
import { SciFiMetricCard } from '@/components/sci-fi-metric-card';
import { SciFiCard } from '@/components/sci-fi-card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import {
    User,
    Mail,
    Phone,
    MapPin,
    Calendar,
    Euro,
    CreditCard,
    CheckCircle2,
    XCircle,
    UserX
} from 'lucide-react';
import { format } from 'date-fns';
import { Booking, BookingStatus } from '@repo/api/types/booking';
import { CreditTransaction, CreditTransactionType, CreditTransactionStatus } from '@repo/api/types/credit';

export const Route = createFileRoute('/_app-layout/consumers/$userId')({
    component: ConsumerDetailPage,
});

function ConsumerDetailPage() {
    const { userId } = Route.useParams();
    const { data, isLoading } = useConsumerDetail(userId);
    const [activeTab, setActiveTab] = useState<'bookings' | 'transactions'>('bookings');

    if (isLoading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <SciFiLoader fullScreen={false} />
            </div>
        );
    }

    if (!data) {
        return (
            <div className="container mx-auto px-4 py-8">
                <Card className="border-red-500/30 bg-red-500/10">
                    <CardContent className="p-6 text-center">
                        <div className="text-red-400 font-mono text-sm">
                            {'> Consumer not found'}
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Header */}
            <div className="mb-6 font-mono">
                <div className="text-green-400 text-sm mb-2 tracking-wider">
                    {'> CONSUMER_DETAIL.EXE'}
                </div>
                <div className="text-green-400 text-xs mb-3">
                    {'[SYSTEM] Consumer Management v1.0.0'}
                </div>
                <h1 className="text-3xl md:text-5xl font-black mb-2 tracking-tighter">
                    <span className="text-green-400 drop-shadow-[0_0_20px_rgba(34,197,94,0.8)]">
                        {data.user.name?.toUpperCase() || 'CONSUMER'}
                    </span>
                </h1>
                <div className="text-green-400/60 text-xs font-mono tracking-wider">
                    {`[ID: ${userId.slice(-8)}] [EMAIL: ${data.user.email}]`}
                </div>
            </div>

            {/* User Details */}
            <SciFiCard color="cyan" className="p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                        <User className="w-5 h-5 text-cyan-400" />
                        <div>
                            <div className="text-cyan-400/60 text-xs font-mono">NAME</div>
                            <div className="text-cyan-200 font-mono">{data.user.name || 'N/A'}</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Mail className="w-5 h-5 text-cyan-400" />
                        <div>
                            <div className="text-cyan-400/60 text-xs font-mono">EMAIL</div>
                            <div className="text-cyan-200 font-mono">{data.user.email || 'N/A'}</div>
                        </div>
                    </div>
                    {data.user.phone && (
                        <div className="flex items-center gap-3">
                            <Phone className="w-5 h-5 text-cyan-400" />
                            <div>
                                <div className="text-cyan-400/60 text-xs font-mono">PHONE</div>
                                <div className="text-cyan-200 font-mono">{data.user.phone}</div>
                            </div>
                        </div>
                    )}
                    {data.user.credits !== undefined && (
                        <div className="flex items-center gap-3">
                            <CreditCard className="w-5 h-5 text-cyan-400" />
                            <div>
                                <div className="text-cyan-400/60 text-xs font-mono">CURRENT CREDITS</div>
                                <div className="text-cyan-200 font-mono">{data.user.credits}</div>
                            </div>
                        </div>
                    )}
                </div>
            </SciFiCard>

            {/* Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <SciFiMetricCard
                    mainMetric={data.metrics.bookingsThisMonth}
                    mainMetricLabel="Bookings This Month"
                    color="green"
                    icon={Calendar}
                />
                <SciFiMetricCard
                    mainMetric={data.metrics.cancelledBookings}
                    mainMetricLabel="Cancelled Bookings"
                    color="yellow"
                    icon={XCircle}
                />
                <SciFiMetricCard
                    mainMetric={data.metrics.noShows}
                    mainMetricLabel="No-Shows"
                    color="pink"
                    icon={UserX}
                />
            </div>

            {/* Record Tabs */}
            <div>
                <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)}>
                    <TabsList className="bg-cyan-500/20 border-2 border-cyan-500/50 font-mono p-1 mb-4">
                        <TabsTrigger
                            value="bookings"
                            className="data-[state=active]:bg-cyan-500 data-[state=active]:text-white text-cyan-300 hover:text-cyan-100 hover:bg-cyan-500/30 transition-all"
                        >
                            {'>'} BOOKINGS
                        </TabsTrigger>
                        <TabsTrigger
                            value="transactions"
                            className="data-[state=active]:bg-cyan-500 data-[state=active]:text-white text-cyan-300 hover:text-cyan-100 hover:bg-cyan-500/30 transition-all"
                        >
                            {'>'} TRANSACTIONS
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="bookings">
                        <BookingsList bookings={data.bookings} />
                    </TabsContent>
                    <TabsContent value="transactions">
                        <TransactionsList transactions={data.transactions} />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}

function BookingsList({ bookings }: {
    bookings?: Array<Booking>
}) {
    if (!bookings || bookings.length === 0) {
        return (
            <Card className="border-cyan-500/30 bg-cyan-500/10">
                <CardContent className="p-6 text-center">
                    <div className="text-cyan-400 font-mono text-sm">
                        {'> No bookings found'}
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-2">
            {bookings.map((booking) => {
                const startTime = booking.classInstanceSnapshot?.startTime
                    ? new Date(booking.classInstanceSnapshot.startTime)
                    : null;
                const endTime = booking.classInstanceSnapshot?.endTime
                    ? new Date(booking.classInstanceSnapshot.endTime)
                    : null;
                const bookedAt = new Date(booking.bookedAt);

                const getStatusIcon = () => {
                    switch (booking.status) {
                        case "completed":
                            return <CheckCircle2 className="w-4 h-4 text-green-400" />;
                        case "cancelled_by_consumer":
                        case "cancelled_by_business":
                        case "cancelled_by_business_rebookable":
                            return <XCircle className="w-4 h-4 text-yellow-400" />;
                        case "no_show":
                            return <UserX className="w-4 h-4 text-red-400" />;
                        default:
                            return <Calendar className="w-4 h-4 text-green-400" />;
                    }
                };

                const getStatusLabel = () => {
                    switch (booking.status) {
                        case "completed":
                            return "COMPLETED";
                        case "cancelled_by_consumer":
                            return "CANCELLED BY USER";
                        case "cancelled_by_business":
                            return "CANCELLED BY BUSINESS";
                        case "cancelled_by_business_rebookable":
                            return "CANCELLED (REBOOKABLE)";
                        case "no_show":
                            return "NO SHOW";
                        default:
                            return "PENDING";
                    }
                };

                const getStatusColor = () => {
                    switch (booking.status) {
                        case "completed":
                            return "text-green-400";
                        case "cancelled_by_consumer":
                        case "cancelled_by_business":
                        case "cancelled_by_business_rebookable":
                            return "text-yellow-400";
                        case "no_show":
                            return "text-red-400";
                        default:
                            return "text-green-400";
                    }
                };

                return (
                    <SciFiCard key={booking._id} color="cyan" hoverEffect={true} className="overflow-hidden">
                        <CardContent className="p-6 relative z-10">
                            <div className="flex items-center gap-4">
                                <div className="flex-shrink-0 p-2 rounded-lg bg-cyan-500/20 border border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.2)]">
                                    {getStatusIcon()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mb-1.5">
                                        <h3 className="text-cyan-200 font-mono font-bold text-base truncate tracking-wide drop-shadow-[0_0_5px_rgba(6,182,212,0.5)]">
                                            {booking.classInstanceSnapshot?.name || 'Unnamed Class'}
                                        </h3>
                                        <span className={`text-xs font-mono px-2 py-0.5 rounded border ${getStatusColor()} border-current/30`}>
                                            {getStatusLabel()}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4 flex-wrap text-sm">
                                        {startTime && (
                                            <div className="flex items-center gap-1.5 text-cyan-300 font-medium">
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
                                            <div className="flex items-center gap-1.5 text-cyan-300 font-medium">
                                                <MapPin className="w-4 h-4 flex-shrink-0" />
                                                <span className="font-mono truncate max-w-[200px]">
                                                    {booking.venueSnapshot.name}
                                                </span>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-1.5 text-cyan-300 font-medium">
                                            <Euro className="w-4 h-4 flex-shrink-0" />
                                            <span className="font-mono">
                                                €{(booking.finalPrice / 100).toFixed(2)}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-cyan-300/60 font-medium text-xs">
                                            <span className="font-mono">
                                                Booked: {format(bookedAt, 'MMM dd, HH:mm')}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex-shrink-0 text-cyan-400/60 text-xs font-mono hidden md:block border border-cyan-500/30 px-2 py-1 rounded bg-cyan-500/10">
                                    {booking._id.slice(-8)}
                                </div>
                            </div>
                        </CardContent>
                    </SciFiCard>
                );
            })}
        </div>
    );
}

function TransactionsList({ transactions }: {
    transactions?: Array<CreditTransaction>
}) {
    if (!transactions || transactions.length === 0) {
        return (
            <Card className="border-cyan-500/30 bg-cyan-500/10">
                <CardContent className="p-6 text-center">
                    <div className="text-cyan-400 font-mono text-sm">
                        {'> No transactions found'}
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-2">
            {transactions.map((transaction) => {
                const createdAt = new Date(transaction.createdAt);
                const isPositive = transaction.amount > 0;
                const getTypeColor = () => {
                    switch (transaction.type) {
                        case "purchase":
                        case "gift":
                            return "text-green-400";
                        case "spend":
                            return "text-yellow-400";
                        case "refund":
                            return "text-cyan-400";
                        default:
                            return "text-green-400";
                    }
                };

                const getStatusColor = () => {
                    switch (transaction.status) {
                        case "completed":
                            return "text-green-400 border-green-500/30";
                        case "pending":
                            return "text-yellow-400 border-yellow-500/30";
                        case "failed":
                        case "canceled":
                            return "text-red-400 border-red-500/30";
                        case "refunded":
                            return "text-cyan-400 border-cyan-500/30";
                        default:
                            return "text-green-400 border-green-500/30"; // Default to completed/green if undefined
                    }
                };

                return (
                    <SciFiCard key={transaction._id} color="cyan" hoverEffect={true} className="overflow-hidden">
                        <CardContent className="p-6 relative z-10">
                            <div className="flex items-center gap-4">
                                <div className="flex-shrink-0 p-2 rounded-lg bg-cyan-500/20 border border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.2)]">
                                    <CreditCard className="w-5 h-5 text-cyan-300" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mb-1.5">
                                        <h3 className="text-cyan-200 font-mono font-bold text-base truncate tracking-wide drop-shadow-[0_0_5px_rgba(6,182,212,0.5)]">
                                            {transaction.description}
                                        </h3>
                                        <span className={`text-xs font-mono px-2 py-0.5 rounded border ${getTypeColor()} border-current/30`}>
                                            {transaction.type?.toUpperCase()}
                                        </span>
                                        <span className={`text-xs font-mono px-2 py-0.5 rounded border ${isPositive ? 'text-green-400 border-green-500/30' : 'text-yellow-400 border-yellow-500/30'}`}>
                                            {isPositive ? '+' : ''}{transaction.amount / 100} credits
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4 flex-wrap text-sm">
                                        <div className="flex items-center gap-1.5 text-cyan-300 font-medium">
                                            <Calendar className="w-4 h-4 flex-shrink-0" />
                                            <span className="font-mono">
                                                {format(createdAt, 'MMM dd, yyyy HH:mm')}
                                            </span>
                                        </div>
                                        <span className={`text-xs font-mono px-2 py-0.5 rounded border ${getStatusColor()}`}>
                                            {(transaction.status || 'COMPLETED').toUpperCase()}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex-shrink-0 text-cyan-400/60 text-xs font-mono hidden md:block border border-cyan-500/30 px-2 py-1 rounded bg-cyan-500/10">
                                    {transaction._id.slice(-8)}
                                </div>
                            </div>
                        </CardContent>
                    </SciFiCard>
                );
            })}
        </div>
    );
}

