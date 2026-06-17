'use client'

import { useState } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday, parseISO } from 'date-fns'
import Link from 'next/link'
import { Calendar as CalendarIcon, Package, X } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

interface BookingWithItems {
  id: string
  customer_name: string
  email: string
  phone: string
  event_address: string
  event_date: string
  return_date: string
  event_type: string
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  total_amount: number
  booking_items: {
    item_id: string
    quantity: number
    item_price: number
    items: {
      id: string
      name: string
      category: string
    }
  }[]
}

interface InventorySummary {
  itemName: string
  category: string
  totalQuantity: number
}

export default function CalendarClient({
  bookings,
  currentMonth,
}: {
  bookings: BookingWithItems[]
  currentMonth: Date
}) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [showDialog, setShowDialog] = useState(false)

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // Group bookings by date
  const bookingsByDate = bookings.reduce((acc, booking) => {
    const dateKey = format(parseISO(booking.event_date), 'yyyy-MM-dd')
    if (!acc[dateKey]) {
      acc[dateKey] = []
    }
    acc[dateKey].push(booking)
    return acc
  }, {} as Record<string, BookingWithItems[]>)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'confirmed':
        return 'bg-green-100 text-green-800'
      case 'completed':
        return 'bg-gray-100 text-gray-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'default'
      case 'pending':
        return 'secondary'
      case 'completed':
        return 'outline'
      case 'cancelled':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  const handleDateClick = (dateKey: string) => {
    setSelectedDate(dateKey)
    setShowDialog(true)
  }

  const getInventorySummary = (dateBookings: BookingWithItems[]): InventorySummary[] => {
    const inventoryMap = new Map<string, InventorySummary>()

    dateBookings.forEach((booking) => {
      booking.booking_items.forEach((item) => {
        const key = item.item_id
        if (inventoryMap.has(key)) {
          const existing = inventoryMap.get(key)!
          existing.totalQuantity += item.quantity
        } else {
          inventoryMap.set(key, {
            itemName: item.items.name,
            category: item.items.category,
            totalQuantity: item.quantity,
          })
        }
      })
    })

    return Array.from(inventoryMap.values()).sort((a, b) =>
      a.category.localeCompare(b.category) || a.itemName.localeCompare(b.itemName)
    )
  }

  const selectedDateBookings = selectedDate ? bookingsByDate[selectedDate] || [] : []
  const inventorySummary = selectedDate ? getInventorySummary(selectedDateBookings) : []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold">Event Calendar</h2>
        <p className="text-gray-600 mt-1">
          View all bookings for {format(currentMonth, 'MMMM yyyy')}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Bookings</CardDescription>
            <CardTitle className="text-3xl">{bookings.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Pending</CardDescription>
            <CardTitle className="text-3xl">
              {bookings.filter((b) => b.status === 'pending').length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Confirmed</CardDescription>
            <CardTitle className="text-3xl">
              {bookings.filter((b) => b.status === 'confirmed').length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Revenue</CardDescription>
            <CardTitle className="text-3xl">
              ${bookings.reduce((sum, b) => sum + Number(b.total_amount), 0).toFixed(0)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Calendar Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            {format(currentMonth, 'MMMM yyyy')}
          </CardTitle>
          <CardDescription>Click on any date to view all bookings and reserved inventory</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Calendar Header */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-center text-sm font-semibold text-gray-600 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-2">
            {/* Empty cells for days before month starts */}
            {Array.from({ length: monthStart.getDay() }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[120px]" />
            ))}

            {/* Calendar days */}
            {days.map((day) => {
              const dateKey = format(day, 'yyyy-MM-dd')
              const dayBookings = bookingsByDate[dateKey] || []
              const hasBookings = dayBookings.length > 0

              return (
                <div
                  key={dateKey}
                  onClick={() => hasBookings && handleDateClick(dateKey)}
                  className={`min-h-[120px] border rounded-lg p-2 transition-all ${
                    isToday(day)
                      ? 'bg-blue-50 border-blue-300'
                      : 'bg-white border-gray-200'
                  } ${hasBookings ? 'cursor-pointer hover:shadow-md hover:border-blue-400' : ''}`}
                >
                  <div
                    className={`text-sm font-semibold mb-2 ${
                      isToday(day) ? 'text-blue-600' : 'text-gray-700'
                    }`}
                  >
                    {format(day, 'd')}
                  </div>

                  <div className="space-y-1">
                    {dayBookings.slice(0, 3).map((booking) => (
                      <div
                        key={booking.id}
                        className={`text-xs p-1.5 rounded ${getStatusColor(booking.status)}`}
                      >
                        <div className="font-medium truncate">{booking.customer_name}</div>
                        <div className="text-xs opacity-75">
                          ${Number(booking.total_amount).toFixed(0)}
                        </div>
                      </div>
                    ))}
                    {dayBookings.length > 3 && (
                      <div className="text-xs text-gray-600 text-center py-1">
                        +{dayBookings.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Events List */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Events</CardTitle>
          <CardDescription>All bookings for this month</CardDescription>
        </CardHeader>
        <CardContent>
          {bookings.length > 0 ? (
            <div className="space-y-3">
              {bookings.map((booking) => (
                <Link key={booking.id} href={`/admin/bookings/${booking.id}`} className="block">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                    <div className="flex-1">
                      <div className="font-medium">{booking.customer_name}</div>
                      <div className="text-sm text-gray-600">
                        {format(parseISO(booking.event_date), 'MMM d, yyyy')} -{' '}
                        {format(parseISO(booking.return_date), 'MMM d, yyyy')}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="font-semibold text-blue-600">
                          ${Number(booking.total_amount).toFixed(2)}
                        </div>
                      </div>
                      <Badge variant={getStatusBadgeVariant(booking.status) as any}>
                        {booking.status}
                      </Badge>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-center py-8 text-gray-500">No bookings this month</p>
          )}
        </CardContent>
      </Card>

      {/* Date Details Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>
                {selectedDate && format(parseISO(selectedDate), 'EEEE, MMMM d, yyyy')}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDialog(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Bookings for this date */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Bookings ({selectedDateBookings.length})
              </h3>
              {selectedDateBookings.length > 0 ? (
                <div className="space-y-3">
                  {selectedDateBookings.map((booking) => (
                    <Card key={booking.id}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-base">{booking.customer_name}</CardTitle>
                            <CardDescription className="mt-1">
                              <div>{booking.email}</div>
                              <div>{booking.phone}</div>
                              <div className="mt-1">
                                Event Type: <span className="font-medium">{booking.event_type}</span>
                              </div>
                            </CardDescription>
                          </div>
                          <Badge variant={getStatusBadgeVariant(booking.status) as any}>
                            {booking.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Return Date:</span>
                            <span className="font-medium">
                              {format(parseISO(booking.return_date), 'MMM d, yyyy')}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Total Amount:</span>
                            <span className="font-semibold text-blue-600">
                              ${Number(booking.total_amount).toFixed(2)}
                            </span>
                          </div>
                          <div className="pt-2">
                            <Link href={`/admin/bookings/${booking.id}`}>
                              <Button variant="outline" size="sm" className="w-full">
                                View Details
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-center py-4 text-gray-500">No bookings for this date</p>
              )}
            </div>

            <Separator />

            {/* Inventory Reserved */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Package className="h-5 w-5" />
                Inventory Reserved ({inventorySummary.length} items)
              </h3>
              {inventorySummary.length > 0 ? (
                <div className="space-y-2">
                  {inventorySummary.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <div className="font-medium">{item.itemName}</div>
                        <div className="text-sm text-gray-600">{item.category}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold text-blue-600">
                          {item.totalQuantity}
                        </div>
                        <div className="text-xs text-gray-600">units</div>
                      </div>
                    </div>
                  ))}
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="text-sm text-blue-800">
                      <strong>Total items reserved:</strong>{' '}
                      {inventorySummary.reduce((sum, item) => sum + item.totalQuantity, 0)} units
                      across {inventorySummary.length} different items
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-center py-4 text-gray-500">No inventory reserved</p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
