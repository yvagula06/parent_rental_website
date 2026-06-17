import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import { SearchIcon } from 'lucide-react'

interface PageProps {
  searchParams: Promise<{
    search?: string
    status?: string
  }>
}

export default async function AdminBookingsPage({ searchParams }: PageProps) {
  const supabase = await createClient()
  const params = await searchParams
  const search = params.search
  const statusFilter = params.status

  // Get current user's business
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('business_id')
    .eq('id', user?.id)
    .single()

  // Build query
  let query = supabase
    .from('bookings')
    .select(`
      id,
      customer_name,
      phone,
      email,
      event_date,
      return_date,
      event_type,
      status,
      total_amount,
      created_at
    `)

  // Scope to business
  if (profile?.business_id) {
    query = query.eq('business_id', profile.business_id)
  }

  // Apply filters
  if (search) {
    query = query.or(`customer_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`)
  }

  if (statusFilter && statusFilter !== 'all') {
    query = query.eq('status', statusFilter)
  }

  const { data: bookings, error } = await query.order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Bookings Management</h2>
          <p className="text-gray-600 mt-1">View and manage all customer bookings</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <form method="GET" className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                name="search"
                placeholder="Search by name, email, or phone..."
                defaultValue={search}
                className="pl-10"
              />
            </div>
            <Select name="status" defaultValue={statusFilter || 'all'}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit">Filter</Button>
          </form>
        </CardContent>
      </Card>

      {/* Bookings Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {bookings?.length || 0} Booking{bookings?.length === 1 ? '' : 's'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              Error loading bookings. Please try again.
            </div>
          )}

          {bookings && bookings.length === 0 && (
            <p className="text-gray-500 text-center py-8">No bookings found</p>
          )}

          {bookings && bookings.length > 0 && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Event Date</TableHead>
                    <TableHead>Event Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell className="font-medium">{booking.customer_name}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{booking.email}</div>
                          <div className="text-gray-500">{booking.phone}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{format(new Date(booking.event_date), 'MMM d, yyyy')}</div>
                          <div className="text-gray-500">
                            Return: {format(new Date(booking.return_date), 'MMM d')}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{booking.event_type}</TableCell>
                      <TableCell>
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
                      </TableCell>
                      <TableCell className="font-semibold text-blue-600">
                        ${booking.total_amount.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Link href={`/admin/bookings/${booking.id}`}>
                        <Button size="sm" variant="outline">View</Button>
                      </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
