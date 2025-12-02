import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { useMutation } from 'convex/react';
import { useConsumerDetail } from '@/hooks/use-consumer-detail';
import { NexusLoader, NexusMetricCard } from '@/components/nexus';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
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
    UserX,
    Gift,
    ArrowLeft,
    RefreshCw,
} from 'lucide-react';
import { format } from 'date-fns';
import { Booking, BookingStatus } from '@repo/api/types/booking';
import { CreditTransaction, CreditTransactionType, CreditTransactionStatus } from '@repo/api/types/credit';
import { api } from '@repo/api/convex/_generated/api';
import { Id } from '@repo/api/convex/_generated/dataModel';
import { cn } from '@/lib/utils';

export const Route = createFileRoute('/_app-layout/consumers/$userId')({
    component: ConsumerDetailPage,
});

function ConsumerDetailPage() {
    const { userId } = Route.useParams();
    const { data, isLoading } = useConsumerDetail(userId);
    const [activeTab, setActiveTab] = useState<'bookings' | 'transactions'>('bookings');
    const [giftDialogOpen, setGiftDialogOpen] = useState(false);
    const [giftAmount, setGiftAmount] = useState('');
    const [giftDescription, setGiftDescription] = useState('');
    const [isGifting, setIsGifting] = useState(false);
    const giftCredits = useMutation(api.internal.mutations.credits.giftCredits);

    if (isLoading) {
        return (
            <div className="p-3 sm:p-4 md:p-6">
                <NexusLoader />
            </div>
        );
    }

    if (!data) {
        return (
            <div className="p-3 sm:p-4 md:p-6">
                <Card className="bg-slate-900/50 border-red-500/30">
                    <CardContent className="p-8 text-center">
                        <UserX className="h-12 w-12 text-red-400 mx-auto mb-4" />
                        <p className="text-red-400">Consumer not found</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="p-3 sm:p-4 md:p-6">
            {/* Back Button */}
            <Link to="/dashboard" className="inline-flex items-center gap-2 text-slate-400 hover:text-cyan-400 mb-4 transition-colors">
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Dashboard</span>
            </Link>

            {/* Header Card */}
            <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm overflow-hidden mb-6">
                <CardHeader className="border-b border-slate-700/50 pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-slate-100 flex items-center">
                            <User className="mr-2 h-5 w-5 text-green-500" />
                            Consumer Details
                        </CardTitle>
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-slate-800/50 text-green-400 border-green-500/50 text-xs">
                                Consumer
                            </Badge>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
                                <RefreshCw className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 md:p-6">
                    {/* User Info Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <div className="flex items-center gap-3 p-3 bg-slate-800/30 rounded-lg border border-slate-700/50">
                            <User className="w-5 h-5 text-cyan-400" />
                            <div>
                                <div className="text-xs text-slate-500">Name</div>
                                <div className="text-slate-200">{data.user.name || 'N/A'}</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-slate-800/30 rounded-lg border border-slate-700/50">
                            <Mail className="w-5 h-5 text-cyan-400" />
                            <div>
                                <div className="text-xs text-slate-500">Email</div>
                                <div className="text-slate-200 truncate">{data.user.email || 'N/A'}</div>
                            </div>
                        </div>
                        {data.user.phone && (
                            <div className="flex items-center gap-3 p-3 bg-slate-800/30 rounded-lg border border-slate-700/50">
                                <Phone className="w-5 h-5 text-cyan-400" />
                                <div>
                                    <div className="text-xs text-slate-500">Phone</div>
                                    <div className="text-slate-200">{data.user.phone}</div>
                                </div>
                            </div>
                        )}
                        <div className="flex items-center gap-3 p-3 bg-slate-800/30 rounded-lg border border-slate-700/50">
                            <CreditCard className="w-5 h-5 text-cyan-400" />
                            <div>
                                <div className="text-xs text-slate-500">Credits</div>
                                <div className="text-slate-200">{data.user.credits ?? 0}</div>
                            </div>
                        </div>
                    </div>

                    {/* Gift Credits Button */}
                    <div className="flex justify-end mb-6">
                        <Dialog open={giftDialogOpen} onOpenChange={setGiftDialogOpen}>
                            <DialogTrigger asChild>
                                <Button className="bg-green-500/10 border border-green-500/50 text-green-400 hover:bg-green-500/20">
                                    <Gift className="w-4 h-4 mr-2" />
                                    Gift Credits
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-slate-900 border-slate-700">
                                <DialogHeader>
                                    <DialogTitle className="text-green-400">Gift Credits</DialogTitle>
                                    <DialogDescription className="text-slate-400">
                                        Add credits to this user's account
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <label className="text-sm text-slate-400">Amount (1-100)</label>
                                        <Input
                                            type="number"
                                            min="1"
                                            max="100"
                                            value={giftAmount}
                                            onChange={(e) => setGiftAmount(e.target.value)}
                                            placeholder="Enter credit amount"
                                            className="bg-slate-800 border-slate-700"
                                            disabled={isGifting}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm text-slate-400">Description (optional)</label>
                                        <Input
                                            type="text"
                                            value={giftDescription}
                                            onChange={(e) => setGiftDescription(e.target.value)}
                                            placeholder="Reason for gifting"
                                            className="bg-slate-800 border-slate-700"
                                            disabled={isGifting}
                                        />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setGiftDialogOpen(false);
                                            setGiftAmount('');
                                            setGiftDescription('');
                                        }}
                                        disabled={isGifting}
                                        className="border-slate-700"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={async () => {
                                            const amount = parseFloat(giftAmount);
                                            if (!amount || amount < 1 || amount > 100) {
                                                alert('Please enter a valid amount between 1 and 100');
                                                return;
                                            }
                                            setIsGifting(true);
                                            try {
                                                await giftCredits({
                                                    userId: userId as Id<"users">,
                                                    amount,
                                                    description: giftDescription || undefined,
                                                });
                                                setGiftDialogOpen(false);
                                                setGiftAmount('');
                                                setGiftDescription('');
                                            } catch (error) {
                                                console.error('Failed to gift credits:', error);
                                                alert(`Failed to gift credits: ${error instanceof Error ? error.message : 'Unknown error'}`);
                                            } finally {
                                                setIsGifting(false);
                                            }
                                        }}
                                        disabled={isGifting || !giftAmount || parseFloat(giftAmount) < 1 || parseFloat(giftAmount) > 100}
                                        className="bg-green-500/20 text-green-400 hover:bg-green-500/30"
                                    >
                                        {isGifting ? 'Gifting...' : 'Gift Credits'}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>

                    {/* Metrics */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
                        <NexusMetricCard
                            title="Bookings This Month"
                            value={data.metrics.bookingsThisMonth}
                            icon={Calendar}
                            color="green"
                        />
                        <NexusMetricCard
                            title="Cancelled"
                            value={data.metrics.cancelledBookings}
                            icon={XCircle}
                            color="amber"
                        />
                        <NexusMetricCard
                            title="No-Shows"
                            value={data.metrics.noShows}
                            icon={UserX}
                            color="pink"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Record Tabs */}
            <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
                <CardContent className="p-3 sm:p-4 md:p-6">
                    <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)}>
                        <TabsList className="bg-slate-800/50 border border-slate-700/50 p-1 mb-6">
                            <TabsTrigger
                                value="bookings"
                                className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400 text-slate-400"
                            >
                                Bookings
                            </TabsTrigger>
                            <TabsTrigger
                                value="transactions"
                                className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400 text-slate-400"
                            >
                                Transactions
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="bookings">
                            <BookingsList bookings={data.bookings} />
                        </TabsContent>
                        <TabsContent value="transactions">
                            <TransactionsList transactions={data.transactions} />
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}

function BookingsList({ bookings }: { bookings?: Array<Booking> }) {
    if (!bookings || bookings.length === 0) {
        return (
            <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">No bookings found</p>
            </div>
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

                const getStatusConfig = () => {
                    switch (booking.status) {
                        case "completed":
                            return { icon: CheckCircle2, color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30', label: 'COMPLETED' };
                        case "cancelled_by_consumer":
                        case "cancelled_by_business":
                        case "cancelled_by_business_rebookable":
                            return { icon: XCircle, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', label: 'CANCELLED' };
                        case "no_show":
                            return { icon: UserX, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', label: 'NO SHOW' };
                        default:
                            return { icon: Calendar, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', label: 'PENDING' };
                    }
                };

                const config = getStatusConfig();
                const StatusIcon = config.icon;

                return (
                    <div key={booking._id} className="flex items-center gap-4 p-4 bg-slate-800/30 rounded-lg border border-slate-700/50">
                        <div className={cn("p-2 rounded-lg", config.bg, config.border, "border")}>
                            <StatusIcon className={cn("w-4 h-4", config.color)} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-slate-200 font-medium truncate">
                                    {booking.classInstanceSnapshot?.name || 'Unnamed Class'}
                                </span>
                                <Badge variant="outline" className={cn("text-xs", config.color, config.border)}>
                                    {config.label}
                                </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-slate-400">
                                {startTime && (
                                    <span>
                                        {format(startTime, 'MMM dd')}
                                        {endTime && ` • ${format(startTime, 'HH:mm')}-${format(endTime, 'HH:mm')}`}
                                    </span>
                                )}
                                <span>€{(booking.finalPrice / 100).toFixed(2)}</span>
                            </div>
                        </div>
                        <div className="text-xs text-slate-500 font-mono">{booking._id.slice(-8)}</div>
                    </div>
                );
            })}
        </div>
    );
}

type EnrichedCreditTransaction = CreditTransaction & {
    giftGiver?: {
        _id: Id<"users">;
        name?: string;
        email?: string;
    };
};

function TransactionsList({ transactions }: { transactions?: Array<EnrichedCreditTransaction> }) {
    if (!transactions || transactions.length === 0) {
        return (
            <div className="text-center py-8">
                <CreditCard className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">No transactions found</p>
            </div>
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
                            return 'text-green-400';
                        case "spend":
                            return 'text-amber-400';
                        case "refund":
                            return 'text-cyan-400';
                        default:
                            return 'text-slate-400';
                    }
                };

                return (
                    <div key={transaction._id} className="flex items-center gap-4 p-4 bg-slate-800/30 rounded-lg border border-slate-700/50">
                        <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
                            <CreditCard className="w-4 h-4 text-cyan-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-slate-200 font-medium truncate">
                                    {transaction.description}
                                </span>
                                <Badge variant="outline" className={cn("text-xs", getTypeColor())}>
                                    {transaction.type?.toUpperCase()}
                                </Badge>
                                <Badge variant="outline" className={cn("text-xs", isPositive ? 'text-green-400 border-green-500/30' : 'text-amber-400 border-amber-500/30')}>
                                    {isPositive ? '+' : ''}{transaction.amount} credits
                                </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-slate-400">
                                <span>{format(createdAt, 'MMM dd, yyyy HH:mm')}</span>
                                {transaction.type === "gift" && transaction.giftGiver && (
                                    <span>
                                        Gifted by: {transaction.giftGiver.name || transaction.giftGiver.email || 'Unknown'}
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="text-xs text-slate-500 font-mono">{transaction._id.slice(-8)}</div>
                    </div>
                );
            })}
        </div>
    );
}


