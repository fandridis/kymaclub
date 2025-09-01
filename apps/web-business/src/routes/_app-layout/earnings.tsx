import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Download, TrendingUp, Calendar, Users, DollarSign } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
// import { useQuery } from 'convex/react'
// import { api } from '@repo/api'
// import { useAuthStore } from '@/components/stores/auth'

export const Route = createFileRoute('/_app-layout/earnings')({
  component: EarningsPage,
})

function EarningsPage() {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })

  // const { user } = useAuthStore()
  // const businessId = user?.businessId

  // Mock data for demonstration - 100 bookings
  const generateMockBookings = () => {
    const classNames = [
      'Morning Yoga Flow', 'HIIT Bootcamp', 'Pilates Core', 'Spin Class', 'Vinyasa Yoga',
      'CrossFit WOD', 'Barre Fusion', 'Boxing Fundamentals', 'Zumba Dance', 'Hot Yoga',
      'Strength Training', 'Cardio Blast', 'Meditation Session', 'Aqua Fitness', 'TRX Training',
      'Kettlebell Circuit', 'Stretching & Recovery', 'Power Yoga', 'Dance Cardio', 'Core Fusion',
      'Bootcamp Challenge', 'Tai Chi', 'Reformer Pilates', 'Indoor Cycling', 'Functional Fitness'
    ]
    
    const firstNames = [
      'Sarah', 'Mike', 'Emma', 'Alex', 'Lisa', 'David', 'Rachel', 'Tom', 'Jessica', 'Ryan',
      'Amanda', 'Chris', 'Nicole', 'Brian', 'Ashley', 'Kevin', 'Lauren', 'Matt', 'Stephanie', 'Josh',
      'Michelle', 'Daniel', 'Jennifer', 'Andrew', 'Rebecca', 'Tyler', 'Samantha', 'Nathan', 'Amy', 'Jacob',
      'Megan', 'Brandon', 'Hannah', 'Justin', 'Taylor', 'Sean', 'Brittany', 'Aaron', 'Kimberly', 'Eric',
      'Danielle', 'Adam', 'Chelsea', 'Jordan', 'Heather', 'Luke', 'Kayla', 'Mason', 'Morgan', 'Caleb'
    ]
    
    const lastNames = [
      'Johnson', 'Chen', 'Davis', 'Rodriguez', 'Thompson', 'Kim', 'Green', 'Wilson', 'Brown', 'Miller',
      'Garcia', 'Martinez', 'Anderson', 'Taylor', 'Thomas', 'Moore', 'Jackson', 'Martin', 'Lee', 'White',
      'Harris', 'Clark', 'Lewis', 'Walker', 'Hall', 'Allen', 'Young', 'King', 'Wright', 'Lopez',
      'Hill', 'Scott', 'Green', 'Adams', 'Baker', 'Gonzalez', 'Nelson', 'Carter', 'Mitchell', 'Perez',
      'Roberts', 'Turner', 'Phillips', 'Campbell', 'Parker', 'Evans', 'Edwards', 'Collins', 'Stewart', 'Sanchez'
    ]

    const bookings = []
    
    for (let i = 1; i <= 100; i++) {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)]
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)]
      const className = classNames[Math.floor(Math.random() * classNames.length)]
      const price = Math.floor(Math.random() * (4000 - 2000) + 2000) // €20-€40 range
      
      // Spread bookings across the last 30 days
      const daysAgo = Math.floor(Math.random() * 30)
      const startTime = Date.now() - (daysAgo * 86400000)
      
      bookings.push({
        _id: i.toString(),
        status: 'completed',
        finalPrice: price,
        userSnapshot: {
          name: `${firstName} ${lastName}`,
          email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@email.com`
        },
        classInstanceSnapshot: {
          name: className,
          startTime: startTime
        }
      })
    }
    
    // Sort by most recent first
    return bookings.sort((a, b) => (b.classInstanceSnapshot?.startTime || 0) - (a.classInstanceSnapshot?.startTime || 0))
  }

  const mockBookings = generateMockBookings()

  const totalGrossEarnings = mockBookings.reduce((sum, booking) => sum + booking.finalPrice, 0)
  const systemCutRate = 0.20 // 20% system cut
  const totalNetEarnings = Math.round(totalGrossEarnings * (1 - systemCutRate)) // Amount business actually receives
  const totalSystemCut = totalGrossEarnings - totalNetEarnings
  const totalBookings = mockBookings.length

  const earningsData = {
    totalGrossEarnings,
    totalNetEarnings,
    totalSystemCut,
    totalBookings,
    bookings: mockBookings
  }

  const isLoading = false

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
        return [
          new Date(booking.classInstanceSnapshot?.startTime || 0).toLocaleDateString(),
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

  if (!earningsData) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-muted-foreground">No earnings data available</div>
      </div>
    )
  }

  const selectedMonthLabel = monthOptions.find(option => option.value === selectedMonth)?.label || selectedMonth

  return (
    <>
      <Header fixed>
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-semibold">Earnings</h1>
          </div>
          <Button onClick={handleExport} size="sm" variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Data
          </Button>
        </div>
      </Header>
      <Main>
        <div className="space-y-6">

          {/* Month Selector */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  Select Month
                </CardTitle>
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
            </CardHeader>
          </Card>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="bg-card border-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Gross Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-muted-foreground">
                  €{((earningsData.totalGrossEarnings || 0) / 100).toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">Total booking value</p>
              </CardContent>
            </Card>

            <Card className="bg-primary/5 border-primary/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-primary font-semibold">Your Earnings</CardTitle>
                <DollarSign className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  €{((earningsData.totalNetEarnings || 0) / 100).toFixed(2)}
                </div>
                <p className="text-xs text-primary/80 font-medium">
                  💰 Invoice this amount
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-card-foreground">System Cut</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-muted-foreground">
                  €{((earningsData.totalSystemCut || 0) / 100).toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">20% platform fee</p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-card-foreground">Total Bookings</CardTitle>
                <Users className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-foreground">{earningsData.totalBookings || 0}</div>
                <p className="text-xs text-muted-foreground">Classes completed</p>
              </CardContent>
            </Card>
          </div>

          {/* Bookings Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-card-foreground">
                Booking Details - {selectedMonthLabel}
              </CardTitle>
              <p className="text-sm text-muted-foreground">Detailed breakdown of all class bookings and earnings</p>
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
                        const netPrice = grossPrice * (1 - systemCutRate)
                        return (
                          <tr key={booking._id} className="border-b border-border hover:bg-muted/50 transition-colors">
                            <td className="py-3 px-4 text-sm text-muted-foreground">
                              {new Date(booking.classInstanceSnapshot?.startTime || 0).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
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
                                className={booking.status === 'completed' ? 'bg-primary/10 text-primary border-primary/20' : ''}
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
      </Main>
    </>
  )
}