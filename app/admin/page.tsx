import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/server'
import { 
  FileText, 
  CheckCircle, 
  Clock, 
  Package, 
  TrendingUp, 
  Users, 
  CalendarRange,
  ArrowRight,
  Plus,
  AlertCircle
} from 'lucide-react'
import { format } from 'date-fns'

export default async function AdminDashboard() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('business_id')
    .eq('id', user?.id)
    .single()

  const businessId = profile?.business_id

  let bookingsQuery = supabase.from('bookings').select('status, total_amount, business_id')
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

  const { data: allBookings } = await bookingsQuery

  const pendingCount = allBookings?.filter(b => b.status === 'pending').length || 0
  const confirmedCount = allBookings?.filter(b => b.status === 'confirmed').length || 0
  const totalRevenue = allBookings?.reduce((sum, b) => sum + Number(b.total_amount || 0), 0) || 0
  const cancelledCount = allBookings?.filter(b => b.status === 'cancelled').length || 0

  const { count: itemsCount } = await itemsCountQuery

  const { data: recentBookings } = await recentQuery
    .order('created_at', { ascending: false })
    .limit(5)

  const { data: upcomingEvents } = await upcomingQuery

  const stats = [
    {
      title: 'Pending Bookings',
      value: pendingCount,
      description: 'Awaiting review',
      icon: Clock,
      gradient: 'from-amber-500 to-orange-500',
      shadow: 'shadow-amber-200',
      bg: 'bg-amber-50',
      text: 'text-amber-600',
    },
    {
      title: 'Confirmed',
      value: confirmedCount,
      description: 'Active reservations',
      icon: CheckCircle,
      gradient: 'from-emerald-500 to-green-500',
      shadow: 'shadow-emerald-200',
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
    },
    {
      title: 'Upcoming Events',
      value: upcomingEvents?.length || 0,
      description: 'Scheduled',
      icon: CalendarRange,
      gradient: 'from-blue-500 to-indigo-500',
      shadow: 'shadow-blue-200',
      bg: 'bg-blue-50',
      text: 'text-blue-600',
    },
    {
      title: 'Total Inventory',
      value: itemsCount || 0,
      description: 'Active items',
      icon: Package,
      gradient: 'from-purple-500 to-violet-500',
      shadow: 'shadow-purple-200',
      bg: 'bg-purple-50',
      text: 'text-purple-600',
    },
  ]

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in-up">
        <div>
          <h2 className="text-2xl lg:text-3xl font-bold text-slate-900 heading">Dashboard Overview</h2>
          <p className="text-slate-500 mt-1">Welcome back! Here&apos;s your business summary.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 shadow-sm animate-fade-in">
            <TrendingUp className="h-4 w-4 text-emerald-500" />
            <span className="text-sm font-medium text-slate-700">${totalRevenue.toFixed(0)}</span>
            <span className="text-xs text-slate-400">total revenue</span>
          </div>
          <Link href="/admin/inventory/new">
            <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md shadow-blue-200 rounded-xl transition-all hover:shadow-lg hover:shadow-blue-200 hover:scale-[1.02] active:scale-[0.98]">
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 stagger-children">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.title} className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl blur-xl" />
              <Card className="relative bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group-hover:-translate-y-0.5">
                <div className={`absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 rounded-full ${stat.bg} opacity-50`} />
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-semibold text-slate-500">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-2.5 rounded-xl ${stat.bg} group-hover:scale-110 transition-transform duration-200`}>
                    <Icon className={`h-4.5 w-4.5 ${stat.text}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-slate-900">{stat.value}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className={`h-1.5 w-1.5 rounded-full bg-gradient-to-r ${stat.gradient} animate-pulse-soft`} />
                    <p className="text-xs text-slate-400">{stat.description}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )
        })}
      </div>

      {/* Revenue & Actions row */}
      <div className="sm:hidden flex items-center gap-2 px-4 py-3 rounded-xl bg-white border border-slate-200 shadow-sm">
        <TrendingUp className="h-4 w-4 text-emerald-500" />
        <span className="text-sm font-medium text-slate-700">${totalRevenue.toFixed(2)}</span>
        <span className="text-xs text-slate-400">total revenue</span>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
        {/* Recent Bookings */}
        <Card className="lg:col-span-2 bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-50">
                  <FileText className="h-4.5 w-4.5 text-blue-600" />
                </div>
                <CardTitle className="text-lg font-bold text-slate-900 heading">Recent Bookings</CardTitle>
              </div>
              <Link href="/admin/bookings">
                <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all">
                  View All
                  <ArrowRight className="h-3.5 w-3.5 ml-1 group-hover:translate-x-0.5 transition-transform" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {!recentBookings || recentBookings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center animate-fade-in">
                <div className="p-4 rounded-full bg-slate-50 mb-4">
                  <AlertCircle className="h-8 w-8 text-slate-300" />
                </div>
                <p className="text-slate-500 font-medium">No bookings yet</p>
                <p className="text-xs text-slate-400 mt-1">When customers book, they&apos;ll appear here</p>
              </div>
            ) : (
              <div className="space-y-3 stagger-children">
                {recentBookings.map((booking) => (
                  <Link
                    key={booking.id}
                    href={`/admin/bookings/${booking.id}`}
                    className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/50 transition-all duration-200 hover:shadow-sm group hover:-translate-y-0.5"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-sm">
                        {booking.customer_name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 text-sm truncate">{booking.customer_name}</p>
                        <p className="text-xs text-slate-500">
                          {format(new Date(booking.event_date), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right hidden sm:block">
                        <p className="font-semibold text-blue-600 text-sm">
                          ${Number(booking.total_amount).toFixed(2)}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {format(new Date(booking.created_at), 'MMM d')}
                        </p>
                      </div>
                      <Badge
                        className="capitalize text-xs px-2.5 py-0.5 rounded-full transition-all"
                        variant={
                          booking.status === 'pending' ? 'secondary'
                          : booking.status === 'confirmed' ? 'default'
                          : booking.status === 'completed' ? 'outline'
                          : 'destructive'
                        }
                      >
                        {booking.status}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions & Stats sidebar */}
        <div className="space-y-6 stagger-children">
          {/* Quick Actions */}
          <Card className="bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-indigo-50">
                  <TrendingUp className="h-4.5 w-4.5 text-indigo-600" />
                </div>
                <CardTitle className="text-lg font-bold text-slate-900 heading">Quick Actions</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/admin/inventory/new">
                <Button className="w-full justify-start gap-3 h-auto py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-sm transition-all duration-200 hover:shadow-md hover:scale-[1.01] active:scale-[0.99]">
                  <Plus className="h-4.5 w-4.5" />
                  <span className="font-medium">Add New Item</span>
                </Button>
              </Link>
              <Link href="/admin/bookings?status=pending">
                <Button variant="outline" className="w-full justify-start gap-3 h-auto py-3.5 px-4 rounded-xl border-slate-200 hover:border-amber-200 hover:bg-amber-50/50 transition-all duration-200 hover:shadow-sm">
                  <Clock className="h-4.5 w-4.5 text-amber-600" />
                  <span className="font-medium">Review Pending ({pendingCount})</span>
                </Button>
              </Link>
              <Link href="/admin/calendar">
                <Button variant="outline" className="w-full justify-start gap-3 h-auto py-3.5 px-4 rounded-xl border-slate-200 hover:border-blue-200 hover:bg-blue-50/50 transition-all duration-200 hover:shadow-sm">
                  <CalendarRange className="h-4.5 w-4.5 text-blue-600" />
                  <span className="font-medium">View Calendar</span>
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Summary Card */}
          <Card className="bg-gradient-to-br from-blue-600 to-indigo-700 border-0 rounded-2xl shadow-lg shadow-blue-200 hover:shadow-xl hover:shadow-blue-200 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-white/70 text-xs font-medium uppercase tracking-wider">At a Glance</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                  <p className="text-2xl font-bold text-white">{allBookings?.length || 0}</p>
                  <p className="text-xs text-white/70">Total Bookings</p>
                </div>
                <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                  <p className="text-2xl font-bold text-white">{cancelledCount}</p>
                  <p className="text-xs text-white/70">Cancelled</p>
                </div>
                <div className="animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                  <p className="text-2xl font-bold text-white">${totalRevenue.toFixed(0)}</p>
                  <p className="text-xs text-white/70">Revenue</p>
                </div>
                <div className="animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                  <p className="text-2xl font-bold text-white">{itemsCount || 0}</p>
                  <p className="text-xs text-white/70">Items</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
