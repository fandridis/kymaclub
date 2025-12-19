/**
 * TODO: We can improve this page by splitting the data fetching either per card or per section
 * and then create a loading state for each section. Currently, when we change months here, the whole
 * right-side content is re-rendered.
 */

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { api } from '@repo/api/convex/_generated/api';
import { Badge } from '@/components/ui/badge'
import { Download, TrendingUp, TrendingDown, Users, DollarSign } from 'lucide-react'
import { useEarnings } from '../hooks/use-earnings'
import { useTypedTranslation } from '@/lib/typed'
import { getBookingFinalPrice, getBookingEarnings } from '@repo/utils/bookings'
import { StripeConnectCard } from './stripe-connect-card'

export default function EarningsPage() {
    const { t } = useTypedTranslation();
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const now = new Date()
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    })

    // Use the custom hook to get earnings data
    const { earningsData, isLoading, hasData } = useEarnings({
        month: selectedMonth
    })

    // Generate month options for the dropdown (current month + 11 previous months)
    const monthOptions = Array.from({ length: 12 }, (_, i) => {
        const now = new Date()
        // Set to first day of the month to avoid month boundary issues
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const value = `${year}-${month}`
        const label = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
        return { value, label }
    })

    const handleExport = () => {
        if (!earningsData?.bookings) return

        const csvContent = [
            [t('routes.earnings.tableDate'), t('routes.earnings.tableClassName'), t('routes.earnings.tableConsumer'), t('routes.earnings.tablePrice'), t('routes.earnings.tablePlatformFee'), t('routes.earnings.tableEarnings'), t('routes.earnings.tableStatus')],
            ...earningsData.bookings.map((booking) => {
                // Calculate actual price paid (finalPrice - refundAmount)
                const pricePaid = getBookingFinalPrice(booking) / 100;

                // Get platform fee rate (default to 20% for legacy bookings)
                const platformFeeRate = booking.platformFeeRate ?? 0.20;
                const platformFeePercent = platformFeeRate * 100;

                // Calculate earnings using utility function
                const earnings = getBookingEarnings(booking) / 100;

                const dateTime = new Date(booking.classInstanceSnapshot?.startTime || 0)
                const formattedDate = `${dateTime.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                })} ${dateTime.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                })}`
                return [
                    formattedDate,
                    booking.classInstanceSnapshot?.name || '',
                    booking.userSnapshot?.name || booking.userSnapshot?.email || '',
                    `€${pricePaid.toFixed(2)}`,
                    `${platformFeePercent.toFixed(0)}%`,
                    `€${earnings.toFixed(2)}`,
                    booking.status,
                ]
            }),
            // Add totals row
            ['', '', '',
                `€${(earningsData.totalGrossEarnings / 100).toFixed(2)}`,
                '—',
                `€${(earningsData.totalNetEarnings / 100).toFixed(2)}`,
                'TOTAL'
            ]
        ]
            .map((row) => row.join(','))
            .join('\n')

        const blob = new Blob([csvContent], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `earnings-${selectedMonth}.csv`
        a.click()
        window.URL.revokeObjectURL(url)
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-muted-foreground">{t('common.loading')}</div>
            </div>
        )
    }

    if (!hasData || !earningsData) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-muted-foreground">{t('routes.earnings.noEarnings')}</div>
            </div>
        )
    }

    const selectedMonthLabel = monthOptions.find(option => option.value === selectedMonth)?.label || selectedMonth

    // Get real comparison data from backend (replaces mock data)
    const comparisonData = earningsData?.comparison || {
        bookings: { change: 0, isPositive: true },
        earnings: { change: 0, isPositive: true },
        avgPrice: { change: 0, isPositive: true },
        allTime: { change: 0, isPositive: true }
    }

    const formatChangeIndicator = (change: number, isPositive: boolean) => {
        const Icon = isPositive ? TrendingUp : TrendingDown
        const colorClass = isPositive ? 'text-green-700' : 'text-red-700'
        const bgClass = isPositive ? 'bg-green-50' : 'bg-red-50'

        return (
            <div className={`flex items-center gap-1 px-2 py-1 rounded-md ${bgClass}`}>
                <Icon className={`w-3 h-3 ${colorClass}`} />
                <span className={`text-xs font-medium ${colorClass}`}>
                    {isPositive ? '+' : ''}{change.toFixed(1)}%
                </span>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <StripeConnectCard />

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-card border-border">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-card-foreground">{t('routes.earnings.monthlyBookings')}</CardTitle>
                        <Users className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-foreground">{earningsData.totalBookings || 0}</div>
                        <div className="flex items-center justify-between mt-2">
                            <p className="text-xs text-muted-foreground">{t('routes.earnings.classesCompleted')}</p>
                            {formatChangeIndicator(comparisonData.bookings.change, comparisonData.bookings.isPositive)}
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-card border-border">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-semibold text-primary">{t('routes.earnings.monthlyEarnings')}</CardTitle>
                        <DollarSign className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-primary">
                            €{((earningsData.totalNetEarnings || 0) / 100).toFixed(2)}
                        </div>
                        <div className="flex items-center justify-between mt-2">
                            <p className="text-xs text-primary/80 font-medium">
                                {t('routes.earnings.yourRevenueThisMonth')}
                            </p>
                            {formatChangeIndicator(comparisonData.earnings.change, comparisonData.earnings.isPositive)}
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-card border-border">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-card-foreground">{t('routes.earnings.avgBookingPrice')}</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-foreground">
                            €{earningsData.totalBookings > 0
                                ? (((earningsData.totalNetEarnings || 0) / earningsData.totalBookings) / 100).toFixed(2)
                                : '0.00'
                            }
                        </div>
                        <div className="flex items-center justify-between mt-2">
                            <p className="text-xs text-muted-foreground">{t('routes.earnings.averagePerBooking')}</p>
                            {formatChangeIndicator(comparisonData.avgPrice.change, comparisonData.avgPrice.isPositive)}
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-card border-border">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-card-foreground">{t('routes.earnings.allTimeEarnings')}</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-foreground">
                            €{((earningsData.allTimeNetEarnings || 0) / 100).toFixed(2)}
                        </div>
                        <div className="flex items-center justify-between mt-2">
                            <p className="text-xs text-muted-foreground">{t('routes.earnings.totalLifetimeRevenue')}</p>
                            {formatChangeIndicator(comparisonData.allTime.change, comparisonData.allTime.isPositive)}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Bookings Table */}
            <Card>
                <CardHeader>
                    <div className="flex flex-col gap-4">
                        <div>
                            <CardTitle className="text-xl font-semibold text-card-foreground">
                                {t('routes.earnings.bookingDetails')} - {selectedMonthLabel}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">{t('routes.earnings.bookingDetailsDescription')}</p>
                        </div>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                            <Button onClick={handleExport} variant="outline" className="w-full sm:w-auto">
                                <Download className="w-4 h-4 mr-2" />
                                {t('routes.earnings.exportData')}
                            </Button>
                            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                                <SelectTrigger className="w-full sm:w-48">
                                    <SelectValue placeholder={t('routes.earnings.selectMonth')} />
                                </SelectTrigger>
                                <SelectContent>
                                    {monthOptions.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {earningsData.bookings && earningsData.bookings.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-border">
                                        <th className="text-left py-3 px-4 font-medium text-foreground">{t('routes.earnings.tableDate')}</th>
                                        <th className="text-left py-3 px-4 font-medium text-foreground">{t('routes.earnings.tableClassName')}</th>
                                        <th className="text-left py-3 px-4 font-medium text-foreground">{t('routes.earnings.tableConsumer')}</th>
                                        <th className="text-right py-3 px-4 font-medium text-muted-foreground">{t('routes.earnings.tablePrice')}</th>
                                        <th className="text-right py-3 px-4 font-medium text-muted-foreground">{t('routes.earnings.tablePlatformFee')}</th>
                                        <th className="text-right py-3 px-4 font-medium text-primary">{t('routes.earnings.tableEarnings')}</th>
                                        <th className="text-center py-3 px-4 font-medium text-foreground">{t('routes.earnings.tableStatus')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {earningsData.bookings.map((booking) => {
                                        // Calculate actual price paid (finalPrice - refundAmount)
                                        const pricePaid = getBookingFinalPrice(booking) / 100;

                                        // Get platform fee rate (default to 20% for legacy bookings)
                                        const platformFeeRate = booking.platformFeeRate ?? 0.20;
                                        const platformFeePercent = platformFeeRate * 100;

                                        // Calculate earnings using utility function
                                        const earnings = getBookingEarnings(booking) / 100;

                                        return (
                                            <tr key={booking._id} className="border-b border-border hover:bg-muted/50 transition-colors">
                                                <td className="py-3 px-4 text-sm text-muted-foreground">
                                                    {new Date(booking.classInstanceSnapshot?.startTime || 0).toLocaleDateString('en-US', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                    })}{' '}
                                                    {new Date(booking.classInstanceSnapshot?.startTime || 0).toLocaleTimeString('en-US', {
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                        hour12: false,
                                                    })}
                                                </td>
                                                <td className="py-3 px-4 text-sm font-medium text-foreground">
                                                    {booking.classInstanceSnapshot?.name || 'Unknown Class'}
                                                </td>
                                                <td className="py-3 px-4 text-sm text-foreground">
                                                    {booking.userSnapshot?.name || booking.userSnapshot?.email || 'Unknown User'}
                                                </td>
                                                <td className="py-3 px-4 text-sm text-muted-foreground text-right">
                                                    €{pricePaid.toFixed(2)}
                                                </td>
                                                <td className="py-3 px-4 text-sm text-muted-foreground text-right">
                                                    {platformFeePercent.toFixed(0)}%
                                                </td>
                                                <td className="py-3 px-4 text-sm font-semibold text-primary text-right">
                                                    €{earnings.toFixed(2)}
                                                </td>
                                                <td className="py-3 px-4 text-center">
                                                    <Badge
                                                        variant={booking.status === 'completed' ? 'default' : 'secondary'}
                                                        className={booking.status === 'completed' ? 'bg-green-100 text-green-950 border-green-200' : ''}
                                                    >
                                                        {booking.status}
                                                    </Badge>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                                <tfoot>
                                    <tr className="border-t-2 border-primary bg-primary/5">
                                        <td colSpan={5} className="py-4 px-4 text-sm font-semibold text-foreground">
                                            {t('routes.earnings.totalMonthlyEarnings')}
                                        </td>
                                        <td className="py-4 px-4 text-lg font-bold text-primary text-right">
                                            €{((earningsData.totalNetEarnings || 0) / 100).toFixed(2)}
                                        </td>
                                        <td className="py-4 px-4"></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <div className="text-muted-foreground">{t('routes.earnings.noBookingsFound')} {selectedMonthLabel}</div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
