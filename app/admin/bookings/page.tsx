import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import { SearchIcon, FileText, Filter, Calendar } from 'lucide-react'

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

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('business_id')
    .eq('id', user?.id)
    .single()

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

  // Filter by business_id only if admin has one set.
  // Also show bookings with NULL business_id (public bookings) by using
  // an OR filter when the admin has a business_id.
  if (profile?.business_id) {
    query = query.or(`business_id.eq.${profile.business_id},business_id.is.null`)
  }

  if (search) {
    query = query.or(`customer_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`)
  }

  if (statusFilter && statusFilter !== 'all') {
    query = query.eq('status', statusFilter)
  }

  const { data: bookings, error } = await query.order('created_at', { ascending: false })

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-50 text-amber-700 border-amber-200'
      case 'confirmed': return 'bg-emerald-50 text-emerald-700 border-emerald-200'
      case 'completed': return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'cancelled': return 'bg-red-50 text-red-700 border-red-200'
      default: return 'bg-slate-50 text-slate-700 border-slate-200'
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between animate-fade-in-up">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-200 animate-float">
            <FileText className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 heading">Booking Management</h2>
            <p className="text-sm text-slate-500">View and manage all customer bookings</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-2xl shadow-sm">
        <CardContent className="pt-6">
          <form method="GET" className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <SearchIcon className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
              <Input
                name="search"
                placeholder="Search by name, email, or phone..."
                defaultValue={search}
                className="pl-10 h-11 rounded-xl border-slate-200 bg-white/80 focus:border-blue-400 focus:ring-blue-400/20 transition-all"
              />
            </div>
            <div className="flex gap-3">
              <div className="relative">
                <Filter className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4 pointer-events-none" />
                <Select name="status" defaultValue={statusFilter || 'all'}>
                  <SelectTrigger className="w-full md:w-48 h-11 pl-10 rounded-xl border-slate-200 bg-white/80">
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
              </div>
              <Button type="submit" className="h-11 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-sm">
                Filter
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Bookings Table */}
      <Card className="bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="h-6 w-1 rounded-full bg-gradient-to-b from-blue-500 to-indigo-500" />
            <CardTitle className="text-base font-semibold text-slate-700">
              {bookings?.length || 0} Booking{bookings?.length === 1 ? '' : 's'}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {error && (
            <div className="mx-6 mt-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2">
              Error loading bookings. Please try again.
            </div>
          )}

          {bookings && bookings.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="p-4 rounded-full bg-slate-50 mb-4">
                <Calendar className="h-10 w-10 text-slate-300" />
              </div>
              <p className="text-slate-500 font-medium">No bookings found</p>
              <p className="text-xs text-slate-400 mt-1">Bookings will appear here once customers submit them</p>
            </div>
          )}

          {bookings && bookings.length > 0 && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-100 bg-slate-50/50">
                    <TableHead className="text-slate-600 font-semibold text-xs uppercase tracking-wider">Customer</TableHead>
                    <TableHead className="text-slate-600 font-semibold text-xs uppercase tracking-wider">Contact</TableHead>
                    <TableHead className="text-slate-600 font-semibold text-xs uppercase tracking-wider">Event Date</TableHead>
                    <TableHead className="text-slate-600 font-semibold text-xs uppercase tracking-wider">Type</TableHead>
                    <TableHead className="text-slate-600 font-semibold text-xs uppercase tracking-wider">Status</TableHead>
                    <TableHead className="text-slate-600 font-semibold text-xs uppercase tracking-wider">Total</TableHead>
                    <TableHead className="text-slate-600 font-semibold text-xs uppercase tracking-wider">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.map((booking, i) => (
                    <TableRow key={booking.id} className={`border-slate-100 hover:bg-blue-50/30 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                            {booking.customer_name.charAt(0)}
                          </div>
                          <span className="font-semibold text-slate-900">{booking.customer_name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="text-slate-700">{booking.email}</div>
                          <div className="text-xs text-slate-400">{booking.phone}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="text-slate-700">{format(new Date(booking.event_date), 'MMM d, yyyy')}</div>
                          <div className="text-xs text-slate-400">Return: {format(new Date(booking.return_date), 'MMM d')}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-600">
                          {booking.event_type}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`capitalize text-xs px-3 py-0.5 rounded-full border ${getStatusStyle(booking.status)}`}
                          variant="outline"
                        >
                          {booking.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold text-blue-600">
                        ${Number(booking.total_amount).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Link href={`/admin/bookings/${booking.id}`}>
                          <Button size="sm" variant="outline" className="rounded-lg border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-all">
                            View
                          </Button>
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
