import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { useBusinessDetail } from '@/hooks/use-business-detail';
import { NexusLoader, NexusMetricCard } from '@/components/nexus';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
  UserX,
  ArrowLeft,
  RefreshCw,
  Settings,
} from 'lucide-react';
import { format } from 'date-fns';
import { Doc, Id } from '@repo/api/convex/_generated/dataModel';
import { cn } from '@/lib/utils';
import { FeeRateEditor } from '@/components/business/FeeRateEditor';
import { FeeChangeHistory } from '@/components/business/FeeChangeHistory';
import { getBookingFinalPrice, getBookingEarnings } from '@repo/utils/bookings';

export const Route = createFileRoute('/_app-layout/businesses/$businessId')({
  component: BusinessDetailPage,
});

function BusinessDetailPage() {
  const { businessId } = Route.useParams();
  const { data, isLoading } = useBusinessDetail(businessId);
  const [activeTab, setActiveTab] = useState<'venues' | 'templates' | 'instances' | 'bookings' | 'earnings' | 'settings'>('venues');

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
            <Building2 className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <p className="text-red-400">Business not found</p>
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
              <Building2 className="mr-2 h-5 w-5 text-cyan-500" />
              {data.business.name || 'Business Details'}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-slate-800/50 text-cyan-400 border-cyan-500/50 text-xs">
                Business
              </Badge>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 md:p-6">
          {/* Business Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <div className="flex items-center gap-3 p-3 bg-slate-800/30 rounded-lg border border-slate-700/50">
              <Building2 className="w-5 h-5 text-cyan-400" />
              <div>
                <div className="text-xs text-slate-500">Business Name</div>
                <div className="text-slate-200">{data.business.name || 'N/A'}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-slate-800/30 rounded-lg border border-slate-700/50">
              <Mail className="w-5 h-5 text-cyan-400" />
              <div>
                <div className="text-xs text-slate-500">Email</div>
                <div className="text-slate-200 truncate">{data.business.email || 'N/A'}</div>
              </div>
            </div>
            {data.business.phone && (
              <div className="flex items-center gap-3 p-3 bg-slate-800/30 rounded-lg border border-slate-700/50">
                <Phone className="w-5 h-5 text-cyan-400" />
                <div>
                  <div className="text-xs text-slate-500">Phone</div>
                  <div className="text-slate-200">{data.business.phone}</div>
                </div>
              </div>
            )}
            {data.business.address && (
              <div className="flex items-center gap-3 p-3 bg-slate-800/30 rounded-lg border border-slate-700/50">
                <MapPin className="w-5 h-5 text-cyan-400" />
                <div>
                  <div className="text-xs text-slate-500">Address</div>
                  <div className="text-slate-200 truncate">
                    {data.business.address.street}, {data.business.address.city}
                  </div>
                </div>
              </div>
            )}
            {data.owner && (
              <>
                <div className="flex items-center gap-3 p-3 bg-slate-800/30 rounded-lg border border-slate-700/50">
                  <User className="w-5 h-5 text-cyan-400" />
                  <div>
                    <div className="text-xs text-slate-500">Owner</div>
                    <div className="text-slate-200">{data.owner.name || 'N/A'}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-800/30 rounded-lg border border-slate-700/50">
                  <User className="w-5 h-5 text-cyan-400" />
                  <div>
                    <div className="text-xs text-slate-500">Role</div>
                    <div className="text-slate-200 uppercase">{data.owner.businessRole || 'N/A'}</div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 md:gap-4">
            <NexusMetricCard
              title="Scheduled Classes"
              value={data.metrics.totalScheduledClasses}
              icon={Calendar}
              color="cyan"
            />
            <NexusMetricCard
              title="Completed (Month)"
              value={data.metrics.completedClassesThisMonth}
              icon={CheckCircle2}
              color="green"
            />
            <NexusMetricCard
              title="Cancelled (Month)"
              value={data.metrics.cancelledClassesThisMonth}
              icon={XCircle}
              color="amber"
            />
            <NexusMetricCard
              title="Bookings (Month)"
              value={data.metrics.completedBookingsThisMonth}
              icon={TrendingUp}
              color="pink"
            />
            <NexusMetricCard
              title="Earnings (Month)"
              value={`€${(data.metrics.earningsThisMonth / 100).toLocaleString()}`}
              icon={Euro}
              color="purple"
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
                value="venues"
                className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400 text-slate-400"
              >
                Venues
              </TabsTrigger>
              <TabsTrigger
                value="templates"
                className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400 text-slate-400"
              >
                Templates
              </TabsTrigger>
              <TabsTrigger
                value="instances"
                className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400 text-slate-400"
              >
                Classes
              </TabsTrigger>
              <TabsTrigger
                value="bookings"
                className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400 text-slate-400"
              >
                Bookings
              </TabsTrigger>
              <TabsTrigger
                value="earnings"
                className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400 text-slate-400"
              >
                Earnings
              </TabsTrigger>
              <TabsTrigger
                value="settings"
                className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400 text-slate-400"
              >
                Settings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="venues">
              <VenuesList venues={data.venues} />
            </TabsContent>
            <TabsContent value="templates">
              <ClassTemplatesList templates={data.classTemplates} />
            </TabsContent>
            <TabsContent value="instances">
              <ClassInstancesList instances={data.classInstances} templates={data.classTemplates} />
            </TabsContent>
            <TabsContent value="bookings">
              <BookingsList bookings={data.bookings} />
            </TabsContent>
            <TabsContent value="earnings">
              <EarningsList bookings={data.bookings} />
            </TabsContent>
            <TabsContent value="settings">
              <SettingsPanel
                businessId={data.business._id}
                businessName={data.business.name}
                currentFeeRate={data.business.feeStructure?.baseFeeRate}
                feeChangeHistory={data.feeChangeHistory}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

function VenuesList({ venues }: { venues?: Array<Doc<"venues">> }) {
  if (!venues || venues.length === 0) {
    return (
      <div className="text-center py-8">
        <MapPin className="h-12 w-12 text-slate-600 mx-auto mb-4" />
        <p className="text-slate-400">No venues found</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {venues.map((venue) => (
        <div key={venue._id} className="flex items-center gap-4 p-4 bg-slate-800/30 rounded-lg border border-slate-700/50">
          <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
            <MapPin className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-slate-200 font-medium">{venue.name}</span>
              <Badge variant="outline" className={cn("text-xs", venue.isActive ? 'text-green-400 border-green-500/30' : 'text-amber-400 border-amber-500/30')}>
                {venue.isActive ? 'ACTIVE' : 'INACTIVE'}
              </Badge>
            </div>
            <div className="text-sm text-slate-400">
              {venue.address.city}, {venue.address.street}
            </div>
          </div>
          <div className="text-xs text-slate-500 font-mono">{venue._id.slice(-8)}</div>
        </div>
      ))}
    </div>
  );
}

function ClassTemplatesList({ templates }: { templates?: Array<Doc<"classTemplates">> }) {
  if (!templates || templates.length === 0) {
    return (
      <div className="text-center py-8">
        <FileText className="h-12 w-12 text-slate-600 mx-auto mb-4" />
        <p className="text-slate-400">No templates found</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {templates.map((template) => (
        <div key={template._id} className="flex items-center gap-4 p-4 bg-slate-800/30 rounded-lg border border-slate-700/50">
          <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/30">
            <FileText className="w-4 h-4 text-purple-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-slate-200 font-medium">{template.name}</span>
              <Badge variant="outline" className={cn("text-xs", template.isActive ? 'text-green-400 border-green-500/30' : 'text-amber-400 border-amber-500/30')}>
                {template.isActive ? 'ACTIVE' : 'INACTIVE'}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-sm text-slate-400">
              <span>{template.duration} min</span>
              <span>Capacity: {template.capacity}</span>
              <span>€{(template.price / 100).toFixed(2)}</span>
            </div>
          </div>
          <div className="text-xs text-slate-500 font-mono">{template._id.slice(-8)}</div>
        </div>
      ))}
    </div>
  );
}

function ClassInstancesList({ instances, templates }: { instances?: Array<Doc<"classInstances">>; templates?: Array<Doc<"classTemplates">> }) {
  if (!instances || instances.length === 0) {
    return (
      <div className="text-center py-8">
        <BookOpen className="h-12 w-12 text-slate-600 mx-auto mb-4" />
        <p className="text-slate-400">No class instances found</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {instances.map((instance) => {
        const startDate = new Date(instance.startTime);
        const endDate = new Date(instance.endTime);
        const template = templates?.find(t => t._id === instance.templateId);
        const name = instance.name || instance.templateSnapshot.name || template?.name || 'Unnamed';
        const capacity = instance.capacity ?? template?.capacity ?? 0;
        const price = instance.price ?? template?.price ?? 0;

        const getStatusColor = (status: string) => {
          switch (status) {
            case "completed": return 'text-green-400 border-green-500/30';
            case "cancelled": return 'text-amber-400 border-amber-500/30';
            default: return 'text-cyan-400 border-cyan-500/30';
          }
        };

        return (
          <div key={instance._id} className="flex items-center gap-4 p-4 bg-slate-800/30 rounded-lg border border-slate-700/50">
            <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/30">
              <BookOpen className="w-4 h-4 text-purple-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-slate-200 font-medium truncate">{name}</span>
                <Badge variant="outline" className={cn("text-xs", getStatusColor(instance.status as string))}>
                  {(instance.status as string).toUpperCase()}
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-sm text-slate-400">
                <span>{format(startDate, 'MMM dd')} • {format(startDate, 'HH:mm')}-{format(endDate, 'HH:mm')}</span>
                <span>{instance.bookedCount}/{capacity}</span>
                <span>€{(price / 100).toFixed(2)}</span>
              </div>
            </div>
            <div className="text-xs text-slate-500 font-mono">{instance._id.slice(-8)}</div>
          </div>
        );
      })}
    </div>
  );
}

function BookingsList({ bookings }: { bookings?: Array<Doc<"bookings">> }) {
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

        const getStatusConfig = () => {
          switch (booking.status) {
            case "completed":
              return { icon: CheckCircle2, color: 'text-green-400', border: 'border-green-500/30', label: 'COMPLETED' };
            case "cancelled_by_consumer":
            case "cancelled_by_business":
            case "cancelled_by_business_rebookable":
              return { icon: XCircle, color: 'text-amber-400', border: 'border-amber-500/30', label: 'CANCELLED' };
            case "no_show":
              return { icon: UserX, color: 'text-red-400', border: 'border-red-500/30', label: 'NO SHOW' };
            default:
              return { icon: Calendar, color: 'text-cyan-400', border: 'border-cyan-500/30', label: 'PENDING' };
          }
        };

        const config = getStatusConfig();
        const StatusIcon = config.icon;

        return (
          <div key={booking._id} className="flex items-center gap-4 p-4 bg-slate-800/30 rounded-lg border border-slate-700/50">
            <div className={cn("p-2 rounded-lg bg-opacity-10", config.color.replace('text-', 'bg-').replace('-400', '-500/10'), "border", config.border)}>
              <StatusIcon className={cn("w-4 h-4", config.color)} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-slate-200 font-medium truncate">
                  {booking.classInstanceSnapshot?.name || 'Unnamed'}
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
                {booking.userSnapshot && (
                  <span>{booking.userSnapshot.name || booking.userSnapshot.email || 'Unknown'}</span>
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

function EarningsList({ bookings }: { bookings?: Array<Doc<"bookings">> }) {
  // Filter to only show bookings with revenue (completed, no_show, or cancelled with partial refund)
  const earningsBookings = bookings?.filter((booking) => {
    const hasRevenue = getBookingFinalPrice({
      finalPrice: booking.finalPrice,
      refundAmount: booking.refundAmount,
      platformFeeRate: booking.platformFeeRate ?? 0.2,
    }) > 0;
    return hasRevenue;
  }) ?? [];

  if (earningsBookings.length === 0) {
    return (
      <div className="text-center py-8">
        <Euro className="h-12 w-12 text-slate-600 mx-auto mb-4" />
        <p className="text-slate-400">No earnings found</p>
      </div>
    );
  }

  // Calculate totals
  const totalGross = earningsBookings.reduce((sum, b) => sum + getBookingFinalPrice({
    finalPrice: b.finalPrice,
    refundAmount: b.refundAmount,
    platformFeeRate: b.platformFeeRate ?? 0.2,
  }), 0);
  const totalNet = earningsBookings.reduce((sum, b) => sum + getBookingEarnings({
    finalPrice: b.finalPrice,
    refundAmount: b.refundAmount,
    platformFeeRate: b.platformFeeRate ?? 0.2,
  }), 0);

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
        <div className="text-center">
          <div className="text-xs text-slate-500 mb-1">Gross Revenue</div>
          <div className="text-lg font-semibold text-slate-200">€{(totalGross / 100).toFixed(2)}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-slate-500 mb-1">Platform Fees</div>
          <div className="text-lg font-semibold text-amber-400">€{((totalGross - totalNet) / 100).toFixed(2)}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-slate-500 mb-1">Net Earnings</div>
          <div className="text-lg font-semibold text-green-400">€{(totalNet / 100).toFixed(2)}</div>
        </div>
      </div>

      {/* Table header */}
      <div className="grid grid-cols-12 gap-2 px-4 py-2 text-xs text-slate-500 border-b border-slate-700/50">
        <div className="col-span-3">Class</div>
        <div className="col-span-2">Consumer</div>
        <div className="col-span-2">Date</div>
        <div className="col-span-1 text-right">Gross</div>
        <div className="col-span-1 text-right">Fee</div>
        <div className="col-span-2 text-right">Net</div>
        <div className="col-span-1 text-center">Status</div>
      </div>

      {/* Earnings rows */}
      <div className="space-y-2">
        {earningsBookings.map((booking) => {
          const bookingCalc = {
            finalPrice: booking.finalPrice,
            refundAmount: booking.refundAmount,
            platformFeeRate: booking.platformFeeRate ?? 0.2,
          };
          const gross = getBookingFinalPrice(bookingCalc) / 100;
          const net = getBookingEarnings(bookingCalc) / 100;
          const feePercent = (booking.platformFeeRate ?? 0.2) * 100;
          const classTime = booking.classInstanceSnapshot?.startTime
            ? new Date(booking.classInstanceSnapshot.startTime)
            : null;

          return (
            <div key={booking._id} className="grid grid-cols-12 gap-2 items-center p-3 bg-slate-800/30 rounded-lg border border-slate-700/50">
              <div className="col-span-3 truncate text-sm text-slate-200">
                {booking.classInstanceSnapshot?.name || 'Unknown Class'}
              </div>
              <div className="col-span-2 truncate text-sm text-slate-400">
                {booking.userSnapshot?.name || booking.userSnapshot?.email || 'Unknown'}
              </div>
              <div className="col-span-2 text-xs text-slate-500">
                {classTime ? format(classTime, 'MMM dd HH:mm') : 'N/A'}
              </div>
              <div className="col-span-1 text-right text-sm text-slate-300">
                €{gross.toFixed(2)}
              </div>
              <div className="col-span-1 text-right text-xs text-amber-400">
                {feePercent.toFixed(0)}%
              </div>
              <div className="col-span-2 text-right text-sm font-medium text-green-400">
                €{net.toFixed(2)}
              </div>
              <div className="col-span-1 text-center">
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs",
                    booking.status === 'completed' ? 'text-green-400 border-green-500/30' :
                      booking.status === 'no_show' ? 'text-red-400 border-red-500/30' :
                        'text-amber-400 border-amber-500/30'
                  )}
                >
                  {booking.status === 'completed' ? 'Done' :
                    booking.status === 'no_show' ? 'NS' :
                      'Part'}
                </Badge>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface FeeChangeLog {
  _id: string;
  actor: {
    userId: string;
    email?: string;
  };
  changes: {
    feeRate: {
      before: number;
      after: number;
    };
  };
  reason: string;
  createdAt: number;
}

interface SettingsPanelProps {
  businessId: Id<"businesses">;
  businessName: string;
  currentFeeRate: number | undefined;
  feeChangeHistory?: FeeChangeLog[];
}

function SettingsPanel({ businessId, businessName, currentFeeRate, feeChangeHistory }: SettingsPanelProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <FeeRateEditor
        businessId={businessId}
        currentFeeRate={currentFeeRate}
        businessName={businessName}
      />
      <FeeChangeHistory logs={feeChangeHistory ?? []} />
    </div>
  );
}
