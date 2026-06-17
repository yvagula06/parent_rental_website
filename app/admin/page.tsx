import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/server'
import { FileText, CheckCircle, Clock, Package } from 'lucide-react'
import { format } from 'date-fns'

export default async function AdminDashboard() {
  const supabase = await createClient()

  // Get current user's business
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('business_id')
    .eq('id', user?.id)
    .single()

  const businessId = profile?.business_id

  // Build base queries scoped to business
  let bookingsQuery = supabase.from('bookings').select('status, created_at, business_id')
  let itemsCountQuery = supabase.from('items').select('*', { count: 'exact', head: true }).eq('active', true)
  let recentQuery = supabase
    .from('bookings')
    .select(`id, customer_name, event_date, status, total_amount, created_at`)
  let upcomingQuery = supabase
    .from('bookings')
    .select('event_date')
    .gte('event_date', new Date().toISOString().split('T')[0])
    .in('status', ['pending', 'confirmed'])

  if (businessId) {
    bookingsQuery = bookingsQuery.eq('business_id', businessId)
    itemsCountQuery = itemsCountQuery.eq('business_id', businessId)
    recentQuery = recentQuery.eq('business_id', businessId)
    upcomingQuery = upcomingQuery.eq('business_id', businessId)
  }

  // Get bookings stats
  const { data: allBookings } = await bookingsQuery

  const pendingCount = allBookings?.filter(b => b.status === 'pending').length || 0
  const confirmedCount = allBookings?.filter(b => b.status === 'confirmed').length || 0

  // Get total items count
  const { count: itemsCount } = await itemsCountQuery

  // Get recent bookings
  const { data: recentBookings } = await recentQuery
    .order('created_at', { ascending: false })
    .limit(5)

  // Get upcoming events
  const { data: upcomingEvents } = await upcomingQuery

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Dashboard Overview</h2>
        <p className="text-gray-600 mt-1">Welcome back! Here's what's happening.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Pending Bookings
            </CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{pendingCount}</div>
            <p className="text-xs text-gray-500 mt-1">Awaiting review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Confirmed Bookings
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{confirmedCount}</div>
            <p className="text-xs text-gray-500 mt-1">Active reservations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Upcoming Events
            </CardTitle>
            <FileText className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{upcomingEvents?.length || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Scheduled</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Inventory
            </CardTitle>
            <Package className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{itemsCount || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Active items</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Bookings */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Bookings</CardTitle>
            <Link href="/admin/bookings">
              <Button variant="outline" size="sm">View All</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {!recentBookings || recentBookings.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No bookings yet</p>
          ) : (
            <div className="space-y-4">
              {recentBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <h3 className="font-semibold">{booking.customer_name}</h3>
                    <p className="text-sm text-gray-600">
                      Event: {format(new Date(booking.event_date), 'PPP')}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-semibold text-blue-600">
                        ${booking.total_amount.toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(booking.created_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <Badge
                      variant={
                        booking.status === 'pending'
                          ? 'secondary'
                          : booking.status === 'confirmed'
                          ? 'default'
                          : booking.status === 'completed'
                          ? 'outline'
                          : 'destructive'
                      }
                    >
                      {booking.status}
                    </Badge>
                    <Link href={`/admin/bookings/${booking.id}`}>
                      <Button variant="ghost" size="sm">View</Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <Link href="/admin/inventory/new">
              <Button className="h-auto py-6 w-full flex-col gap-2">
                <Package className="h-6 w-6" />
                <span>Add New Item</span>
              </Button>
            </Link>
            <Link href="/admin/bookings?status=pending">
              <Button variant="outline" className="h-auto py-6 w-full flex-col gap-2">
                <Clock className="h-6 w-6" />
                <span>Review Pending</span>
              </Button>
            </Link>
            <Link href="/admin/calendar">
              <Button variant="outline" className="h-auto py-6 w-full flex-col gap-2">
                <FileText className="h-6 w-6" />
                <span>View Calendar</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
