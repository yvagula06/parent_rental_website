import { createClient } from '@/lib/supabase/server'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import CalendarClient from './calendar-client'

export default async function CalendarPage() {
  const supabase = await createClient()

  // Get current user's business
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('business_id')
    .eq('id', user?.id)
    .single()

  // Get current month's date range
  const today = new Date()
  const monthStart = startOfMonth(today)
  const monthEnd = endOfMonth(today)

  // Fetch bookings for current month with items
  let query = supabase
    .from('bookings')
    .select(`
      id,
      customer_name,
      email,
      phone,
      event_address,
      event_date,
      return_date,
      event_type,
      status,
      total_amount,
      booking_items (
        item_id,
        quantity,
        item_price,
        items (
          id,
          name,
          category
        )
      )
    `)
    .gte('event_date', format(monthStart, 'yyyy-MM-dd'))
    .lte('event_date', format(monthEnd, 'yyyy-MM-dd'))
    .order('event_date')

  if (profile?.business_id) {
    query = query.eq('business_id', profile.business_id)
  }

  const { data: bookings } = await query

  return (
    <CalendarClient 
      bookings={(bookings as any[]) || []} 
      currentMonth={today}
    />
  )
}
