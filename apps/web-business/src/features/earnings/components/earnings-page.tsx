/**
 * TODO: We can improve this page by splitting the data fetching either per card or per section
 * and then create a loading state for each section. Currently, when we change months here, the whole
 * right-side content is re-rendered.
 */

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Download, TrendingUp, TrendingDown, Users, DollarSign } from 'lucide-react'
import { useEarnings } from '../hooks/use-earnings'

export default function EarningsPage() {
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const now = new Date()
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    })

    // Use the custom hook to get earnings data
    const { earningsData, isLoading, hasData } = useEarnings({
        month: selectedMonth
    })

    // System cut rate constant (20% as per business rules)
    const systemCutRate = 0.20

    // Generate month options for the dropdown (current month + 11 previous months)
    const monthOptions = Array.from({ length: 12 }, (_, i) => {
        const date = new Date()
        date.setMonth(date.getMonth() - i)
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const value = `${year}-${month}`
        const label = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
        return { value, label }
    })

    const handleExport = () => {
        if (!earningsData?.bookings) return

        const csvContent = [
            ['Date', 'Class Name', 'Consumer', 'Gross Price', 'System Cut (20%)', 'Your Earnings', 'Status'],
            ...earningsData.bookings.map((booking) => {
                const grossPrice = booking.finalPrice / 100
                const systemCut = grossPrice * systemCutRate
                const netPrice = grossPrice - systemCut
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
                    `€${grossPrice.toFixed(2)}`,
                    `€${systemCut.toFixed(2)}`,
                    `€${netPrice.toFixed(2)}`,
                    booking.status,
                ]
            }),
            // Add totals row
            ['', '', '',
                `€${(earningsData.totalGrossEarnings / 100).toFixed(2)}`,
                `€${(earningsData.totalSystemCut / 100).toFixed(2)}`,
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
                <div className="text-muted-foreground">Loading earnings data...</div>
            </div>
        )
    }

    if (!hasData || !earningsData) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-muted-foreground">No earnings data available for this month</div>
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

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-card border-border">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-card-foreground">Monthly Bookings</CardTitle>
                        <Users className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-foreground">{earningsData.totalBookings || 0}</div>
                        <div className="flex items-center justify-between mt-2">
                            <p className="text-xs text-muted-foreground">Classes completed</p>
                            {formatChangeIndicator(comparisonData.bookings.change, comparisonData.bookings.isPositive)}
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-card border-border">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-semibold text-primary">Monthly Earnings</CardTitle>
                        <DollarSign className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-primary">
                            €{((earningsData.totalNetEarnings || 0) / 100).toFixed(2)}
                        </div>
                        <div className="flex items-center justify-between mt-2">
                            <p className="text-xs text-primary/80 font-medium">
                                Your revenue this month
                            </p>
                            {formatChangeIndicator(comparisonData.earnings.change, comparisonData.earnings.isPositive)}
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-card border-border">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-card-foreground">Avg Booking Price</CardTitle>
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
                            <p className="text-xs text-muted-foreground">Average per booking</p>
                            {formatChangeIndicator(comparisonData.avgPrice.change, comparisonData.avgPrice.isPositive)}
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-card border-border">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-card-foreground">All-time Earnings</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-foreground">
                            €{((earningsData.allTimeNetEarnings || 0) / 100).toFixed(2)}
                        </div>
                        <div className="flex items-center justify-between mt-2">
                            <p className="text-xs text-muted-foreground">Total lifetime revenue</p>
                            {formatChangeIndicator(comparisonData.allTime.change, comparisonData.allTime.isPositive)}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Bookings Table */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-xl font-semibold text-card-foreground">
                                Booking Details - {selectedMonthLabel}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">Detailed breakdown of all class bookings and earnings. Records appear after the class has been completed.</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button onClick={handleExport} variant="outline">
                                <Download className="w-4 h-4 mr-2" />
                                Export Data
                            </Button>
                            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                                <SelectTrigger className="w-48">
                                    <SelectValue />
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
                                        <th className="text-left py-3 px-4 font-medium text-foreground">Date</th>
                                        <th className="text-left py-3 px-4 font-medium text-foreground">Class Name</th>
                                        <th className="text-left py-3 px-4 font-medium text-foreground">Consumer</th>
                                        <th className="text-right py-3 px-4 font-medium text-muted-foreground">Gross</th>
                                        <th className="text-right py-3 px-4 font-medium text-primary">Your Earnings</th>
                                        <th className="text-center py-3 px-4 font-medium text-foreground">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {earningsData.bookings.map((booking) => {
                                        const grossPrice = booking.finalPrice / 100
                                        const systemCutRate = 0.20 // 20% system cut - matches backend logic
                                        const netPrice = grossPrice * (1 - systemCutRate)
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
                                                    €{grossPrice.toFixed(2)}
                                                </td>
                                                <td className="py-3 px-4 text-sm font-semibold text-primary text-right">
                                                    €{netPrice.toFixed(2)}
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
                                        <td colSpan={3} className="py-4 px-4 text-sm font-semibold text-foreground">
                                            Total Monthly Earnings
                                        </td>
                                        <td className="py-4 px-4 text-sm font-medium text-muted-foreground text-right">
                                            €{((earningsData.totalGrossEarnings || 0) / 100).toFixed(2)}
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
                            <div className="text-muted-foreground">No bookings found for {selectedMonthLabel}</div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
