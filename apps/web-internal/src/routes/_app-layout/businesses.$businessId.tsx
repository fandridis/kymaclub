import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { useBusinessDetail } from '@/hooks/use-business-detail';
import { SciFiLoader } from '@/components/sci-fi-loader';
import { SciFiMetricCard } from '@/components/sci-fi-metric-card';
import { SciFiCard } from '@/components/sci-fi-card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import {
    Building2,
    User,
    Mail,
    Phone,
    MapPin,
    BookOpen,
    Calendar,
    Euro,
    TrendingUp,
    FileText,
    CheckCircle2,
    XCircle,
    UserX
} from 'lucide-react';
import { format } from 'date-fns';

export const Route = createFileRoute('/_app-layout/businesses/$businessId')({
    component: BusinessDetailPage,
});

function BusinessDetailPage() {
    const { businessId } = Route.useParams();
    const { data, isLoading } = useBusinessDetail(businessId);
    const [activeTab, setActiveTab] = useState<'venues' | 'templates' | 'instances' | 'bookings' | 'earnings'>('venues');

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
                            {'> Business not found'}
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
                <div className="text-cyan-400 text-sm mb-2 tracking-wider">
                    {'> BUSINESS_DETAIL.EXE'}
                </div>
                <div className="text-green-400 text-xs mb-3">
                    {'[SYSTEM] Business Management v1.0.0'}
                </div>
                <h1 className="text-3xl md:text-5xl font-black mb-2 tracking-tighter">
                    <span className="text-cyan-400 drop-shadow-[0_0_20px_rgba(6,182,212,0.8)]">
                        {data.business.name?.toUpperCase() || 'BUSINESS'}
                    </span>
                </h1>
                <div className="text-cyan-400/60 text-xs font-mono tracking-wider">
                    {`[ID: ${businessId.slice(-8)}] [EMAIL: ${data.business.email}]`}
                </div>
            </div>

            {/* Business Details */}
            <SciFiCard color="cyan" className="p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                        <Building2 className="w-5 h-5 text-cyan-400" />
                        <div>
                            <div className="text-cyan-400/60 text-xs font-mono">BUSINESS NAME</div>
                            <div className="text-cyan-200 font-mono">{data.business.name || 'N/A'}</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Mail className="w-5 h-5 text-cyan-400" />
                        <div>
                            <div className="text-cyan-400/60 text-xs font-mono">EMAIL</div>
                            <div className="text-cyan-200 font-mono">{data.business.email || 'N/A'}</div>
                        </div>
                    </div>
                    {data.business.phone && (
                        <div className="flex items-center gap-3">
                            <Phone className="w-5 h-5 text-cyan-400" />
                            <div>
                                <div className="text-cyan-400/60 text-xs font-mono">PHONE</div>
                                <div className="text-cyan-200 font-mono">{data.business.phone}</div>
                            </div>
                        </div>
                    )}
                    {data.business.address && (
                        <div className="flex items-center gap-3">
                            <MapPin className="w-5 h-5 text-cyan-400" />
                            <div>
                                <div className="text-cyan-400/60 text-xs font-mono">ADDRESS</div>
                                <div className="text-cyan-200 font-mono">
                                    {data.business.address.street}, {data.business.address.city}, {data.business.address.zipCode}
                                </div>
                            </div>
                        </div>
                    )}
                    {data.owner && (
                        <>
                            <div className="flex items-center gap-3">
                                <User className="w-5 h-5 text-cyan-400" />
                                <div>
                                    <div className="text-cyan-400/60 text-xs font-mono">OWNER</div>
                                    <div className="text-cyan-200 font-mono">{data.owner.name || 'N/A'}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <User className="w-5 h-5 text-cyan-400" />
                                <div>
                                    <div className="text-cyan-400/60 text-xs font-mono">ROLE</div>
                                    <div className="text-cyan-200 font-mono uppercase">{data.owner.businessRole || 'N/A'}</div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </SciFiCard>

            {/* Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                <SciFiMetricCard
                    mainMetric={data.metrics.totalScheduledClasses}
                    mainMetricLabel="Total Scheduled Classes"
                    color="cyan"
                    icon={Calendar}
                />
                <SciFiMetricCard
                    mainMetric={data.metrics.completedClassesThisMonth}
                    mainMetricLabel="Completed Classes This Month"
                    color="green"
                    icon={CheckCircle2}
                />
                <SciFiMetricCard
                    mainMetric={data.metrics.cancelledClassesThisMonth}
                    mainMetricLabel="Cancelled Classes This Month"
                    color="yellow"
                    icon={XCircle}
                />
                <SciFiMetricCard
                    mainMetric={data.metrics.completedBookingsThisMonth}
                    mainMetricLabel="Completed Bookings This Month"
                    color="pink"
                    icon={TrendingUp}
                />
                <SciFiMetricCard
                    mainMetric={`€${(data.metrics.earningsThisMonth / 100).toLocaleString()}`}
                    mainMetricLabel="Earnings This Month"
                    color="purple"
                    icon={Euro}
                />
            </div>

            {/* Record Tabs */}
            <div>
                <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)}>
                    <TabsList className="bg-cyan-500/20 border-2 border-cyan-500/50 font-mono p-1 mb-4">
                        <TabsTrigger
                            value="venues"
                            className="data-[state=active]:bg-cyan-500 data-[state=active]:text-white text-cyan-300 hover:text-cyan-100 hover:bg-cyan-500/30 transition-all"
                        >
                            {'>'} VENUES
                        </TabsTrigger>
                        <TabsTrigger
                            value="templates"
                            className="data-[state=active]:bg-cyan-500 data-[state=active]:text-white text-cyan-300 hover:text-cyan-100 hover:bg-cyan-500/30 transition-all"
                        >
                            {'>'} CLASS TEMPLATES
                        </TabsTrigger>
                        <TabsTrigger
                            value="instances"
                            className="data-[state=active]:bg-cyan-500 data-[state=active]:text-white text-cyan-300 hover:text-cyan-100 hover:bg-cyan-500/30 transition-all"
                        >
                            {'>'} CLASS INSTANCES
                        </TabsTrigger>
                        <TabsTrigger
                            value="bookings"
                            className="data-[state=active]:bg-cyan-500 data-[state=active]:text-white text-cyan-300 hover:text-cyan-100 hover:bg-cyan-500/30 transition-all"
                        >
                            {'>'} BOOKINGS
                        </TabsTrigger>
                        <TabsTrigger
                            value="earnings"
                            className="data-[state=active]:bg-cyan-500 data-[state=active]:text-white text-cyan-300 hover:text-cyan-100 hover:bg-cyan-500/30 transition-all"
                        >
                            {'>'} EARNINGS
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="venues">
                        <VenuesList venues={data.venues} />
                    </TabsContent>
                    <TabsContent value="templates">
                        <ClassTemplatesList templates={data.classTemplates} />
                    </TabsContent>
                    <TabsContent value="instances">
                        <ClassInstancesList instances={data.classInstances} />
                    </TabsContent>
                    <TabsContent value="bookings">
                        <BookingsList bookings={data.bookings} />
                    </TabsContent>
                    <TabsContent value="earnings">
                        <EarningsList earnings={data.earnings} />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}

// Record List Components
function VenuesList({ venues }: {
    venues?: Array<{
        _id: string;
        name: string;
        address: {
            city: string;
            street: string;
        };
        isActive: boolean;
    }>
}) {
    if (!venues || venues.length === 0) {
        return (
            <Card className="border-cyan-500/30 bg-cyan-500/10">
                <CardContent className="p-6 text-center">
                    <div className="text-cyan-400 font-mono text-sm">
                        {'> No venues found'}
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-2">
            {venues.map((venue) => (
                <SciFiCard key={venue._id} color="cyan" hoverEffect={true} className="overflow-hidden">
                    <CardContent className="p-6 relative z-10">
                        <div className="flex items-center gap-4">
                            <div className="flex-shrink-0 p-2 rounded-lg bg-cyan-500/20 border border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.2)]">
                                <MapPin className="w-5 h-5 text-cyan-300" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-1.5">
                                    <h3 className="text-cyan-200 font-mono font-bold text-base truncate tracking-wide drop-shadow-[0_0_5px_rgba(6,182,212,0.5)]">
                                        {venue.name}
                                    </h3>
                                    <span className={`text-xs font-mono px-2 py-0.5 rounded border ${venue.isActive ? 'text-green-400 border-green-500/30' : 'text-yellow-400 border-yellow-500/30'}`}>
                                        {venue.isActive ? 'ACTIVE' : 'INACTIVE'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-4 flex-wrap text-sm">
                                    <div className="flex items-center gap-1.5 text-cyan-300 font-medium">
                                        <MapPin className="w-4 h-4 flex-shrink-0" />
                                        <span className="font-mono">
                                            {venue.address.city}, {venue.address.street}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex-shrink-0 text-cyan-400/60 text-xs font-mono hidden md:block border border-cyan-500/30 px-2 py-1 rounded bg-cyan-500/10">
                                {venue._id.slice(-8)}
                            </div>
                        </div>
                    </CardContent>
                </SciFiCard>
            ))}
        </div>
    );
}

function ClassTemplatesList({ templates }: {
    templates?: Array<{
        _id: string;
        name: string;
        duration: number;
        capacity: number;
        price: number;
        isActive: boolean;
    }>
}) {
    if (!templates || templates.length === 0) {
        return (
            <Card className="border-cyan-500/30 bg-cyan-500/10">
                <CardContent className="p-6 text-center">
                    <div className="text-cyan-400 font-mono text-sm">
                        {'> No class templates found'}
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-2">
            {templates.map((template) => (
                <SciFiCard key={template._id} color="cyan" hoverEffect={true} className="overflow-hidden">
                    <CardContent className="p-6 relative z-10">
                        <div className="flex items-center gap-4">
                            <div className="flex-shrink-0 p-2 rounded-lg bg-cyan-500/20 border border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.2)]">
                                <FileText className="w-5 h-5 text-cyan-300" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-1.5">
                                    <h3 className="text-cyan-200 font-mono font-bold text-base truncate tracking-wide drop-shadow-[0_0_5px_rgba(6,182,212,0.5)]">
                                        {template.name}
                                    </h3>
                                    <span className={`text-xs font-mono px-2 py-0.5 rounded border ${template.isActive ? 'text-green-400 border-green-500/30' : 'text-yellow-400 border-yellow-500/30'}`}>
                                        {template.isActive ? 'ACTIVE' : 'INACTIVE'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-4 flex-wrap text-sm">
                                    <div className="flex items-center gap-1.5 text-cyan-300 font-medium">
                                        <Calendar className="w-4 h-4 flex-shrink-0" />
                                        <span className="font-mono">
                                            {template.duration} min
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-cyan-300 font-medium">
                                        <User className="w-4 h-4 flex-shrink-0" />
                                        <span className="font-mono">
                                            Capacity: {template.capacity}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-cyan-300 font-medium">
                                        <Euro className="w-4 h-4 flex-shrink-0" />
                                        <span className="font-mono">
                                            €{(template.price / 100).toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex-shrink-0 text-cyan-400/60 text-xs font-mono hidden md:block border border-cyan-500/30 px-2 py-1 rounded bg-cyan-500/10">
                                {template._id.slice(-8)}
                            </div>
                        </div>
                    </CardContent>
                </SciFiCard>
            ))}
        </div>
    );
}

function ClassInstancesList({ instances }: {
    instances?: Array<{
        _id: string;
        name: string;
        startTime: number;
        endTime: number;
        status: "scheduled" | "cancelled" | "completed";
        bookedCount: number;
        capacity: number;
        price: number;
    }>
}) {
    if (!instances || instances.length === 0) {
        return (
            <Card className="border-cyan-500/30 bg-cyan-500/10">
                <CardContent className="p-6 text-center">
                    <div className="text-cyan-400 font-mono text-sm">
                        {'> No class instances found'}
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-2">
            {instances.map((instance) => {
                const startDate = new Date(instance.startTime);
                const endDate = new Date(instance.endTime);
                const getStatusColor = (status: string) => {
                    switch (status) {
                        case "completed": return "text-green-400 border-green-500/30";
                        case "cancelled": return "text-yellow-400 border-yellow-500/30";
                        default: return "text-cyan-400 border-cyan-500/30";
                    }
                };

                return (
                    <SciFiCard key={instance._id} color="cyan" hoverEffect={true} className="overflow-hidden">
                        <CardContent className="p-6 relative z-10">
                            <div className="flex items-center gap-4">
                                <div className="flex-shrink-0 p-2 rounded-lg bg-cyan-500/20 border border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.2)]">
                                    <BookOpen className="w-5 h-5 text-cyan-300" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mb-1.5">
                                        <h3 className="text-cyan-200 font-mono font-bold text-base truncate tracking-wide drop-shadow-[0_0_5px_rgba(6,182,212,0.5)]">
                                            {instance.name}
                                        </h3>
                                        <span className={`text-xs font-mono px-2 py-0.5 rounded border ${getStatusColor(instance.status)}`}>
                                            {instance.status.toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4 flex-wrap text-sm">
                                        <div className="flex items-center gap-1.5 text-cyan-300 font-medium">
                                            <Calendar className="w-4 h-4 flex-shrink-0" />
                                            <span className="font-mono">
                                                {format(startDate, 'MMM dd')} • {format(startDate, 'HH:mm')}-{format(endDate, 'HH:mm')}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-cyan-300 font-medium">
                                            <User className="w-4 h-4 flex-shrink-0" />
                                            <span className="font-mono">
                                                {instance.bookedCount}/{instance.capacity}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-cyan-300 font-medium">
                                            <Euro className="w-4 h-4 flex-shrink-0" />
                                            <span className="font-mono">
                                                €{(instance.price / 100).toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex-shrink-0 text-cyan-400/60 text-xs font-mono hidden md:block border border-cyan-500/30 px-2 py-1 rounded bg-cyan-500/10">
                                    {instance._id.slice(-8)}
                                </div>
                            </div>
                        </CardContent>
                    </SciFiCard>
                );
            })}
        </div>
    );
}

function BookingsList({ bookings }: {
    bookings?: Array<{
        _id: string;
        status: "pending" | "completed" | "cancelled_by_consumer" | "cancelled_by_business" | "no_show";
        bookedAt: number;
        finalPrice: number;
        classInstanceSnapshot?: {
            name: string;
            startTime: number;
            endTime?: number;
        };
        venueSnapshot?: {
            name: string;
        };
        userSnapshot?: {
            name?: string;
            email?: string;
        };
    }>
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
                            return <XCircle className="w-4 h-4 text-yellow-400" />;
                        case "no_show":
                            return <UserX className="w-4 h-4 text-red-400" />;
                        default:
                            return <Calendar className="w-4 h-4 text-cyan-400" />;
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
                            return "text-yellow-400";
                        case "no_show":
                            return "text-red-400";
                        default:
                            return "text-cyan-400";
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
                                        {booking.userSnapshot && (
                                            <div className="flex items-center gap-1.5 text-cyan-300 font-medium">
                                                <User className="w-4 h-4 flex-shrink-0" />
                                                <span className="font-mono truncate max-w-[200px]">
                                                    {booking.userSnapshot.name || booking.userSnapshot.email || 'Unknown User'}
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

function EarningsList({ earnings }: {
    earnings?: Array<{
        _id: string;
        amount: number; // in cents
        createdAt: number;
        description: string;
        bookingId?: string;
    }>
}) {
    if (!earnings || earnings.length === 0) {
        return (
            <Card className="border-cyan-500/30 bg-cyan-500/10">
                <CardContent className="p-6 text-center">
                    <div className="text-cyan-400 font-mono text-sm">
                        {'> No earnings found'}
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-2">
            {earnings.map((earning) => {
                const createdAt = new Date(earning.createdAt);
                return (
                    <SciFiCard key={earning._id} color="cyan" hoverEffect={true} className="overflow-hidden">
                        <CardContent className="p-6 relative z-10">
                            <div className="flex items-center gap-4">
                                <div className="flex-shrink-0 p-2 rounded-lg bg-cyan-500/20 border border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.2)]">
                                    <Euro className="w-5 h-5 text-cyan-300" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mb-1.5">
                                        <h3 className="text-cyan-200 font-mono font-bold text-base truncate tracking-wide drop-shadow-[0_0_5px_rgba(6,182,212,0.5)]">
                                            {earning.description}
                                        </h3>
                                        <span className="text-xs font-mono px-2 py-0.5 rounded border text-green-400 border-green-500/30">
                                            €{(earning.amount / 100).toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4 flex-wrap text-sm">
                                        <div className="flex items-center gap-1.5 text-cyan-300 font-medium">
                                            <Calendar className="w-4 h-4 flex-shrink-0" />
                                            <span className="font-mono">
                                                {format(createdAt, 'MMM dd, yyyy HH:mm')}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex-shrink-0 text-cyan-400/60 text-xs font-mono hidden md:block border border-cyan-500/30 px-2 py-1 rounded bg-cyan-500/10">
                                    {earning._id.slice(-8)}
                                </div>
                            </div>
                        </CardContent>
                    </SciFiCard>
                );
            })}
        </div>
    );
}

