import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service-client'
import { validateBookingAvailability } from '@/lib/services/availability'
import {
  sendCustomerBookingRequest,
  sendAdminNewBookingNotification,
} from '@/lib/services/email'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      customer_name,
      phone,
      email,
      event_address,
      event_type,
      event_date,
      return_date,
      notes,
      business_id,
      items,
    } = body

    // Validate required fields
    if (!customer_name || !phone || !email || !event_address || !event_type || !event_date || !return_date || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate availability (skip check if no business_id since public booking already verified client-side)
    if (business_id) {
      const availabilityCheck = await validateBookingAvailability(
        items,
        event_date,
        return_date,
        { businessId: business_id }
      )

      if (!availabilityCheck.valid) {
        return NextResponse.json(
          { error: 'Items not available', details: availabilityCheck.errors },
          { status: 400 }
        )
      }
    }

    const supabase = await createClient()
    const serviceSupabase = createServiceClient()

    // Create booking (use service client to bypass RLS for public submissions)
    const total_amount = items.reduce(
      (sum: number, item: any) => sum + Number(item.item_price) * Number(item.quantity),
      0
    )

    const { data: booking, error: bookingError } = await serviceSupabase
      .from('bookings')
      .insert({
        customer_name,
        phone,
        email,
        event_address,
        event_type,
        event_date,
        return_date,
        notes,
        business_id: business_id || undefined,
        status: 'pending',
        total_amount,
      })
      .select()
      .single()

    if (bookingError || !booking) {
      console.error('Booking creation error:', bookingError)
      return NextResponse.json(
        { error: 'Failed to create booking' },
        { status: 500 }
      )
    }

    // Create booking items (use service client to bypass RLS)
    const bookingItems = items.map((item: any) => ({
      booking_id: booking.id,
      item_id: item.item_id,
      quantity: item.quantity,
      item_price: item.item_price,
    }))

    const { error: itemsError } = await serviceSupabase
      .from('booking_items')
      .insert(bookingItems)

    if (itemsError) {
      // Rollback: delete the booking if items insertion fails
      await serviceSupabase.from('bookings').delete().eq('id', booking.id)
      console.error('Booking items creation error:', itemsError)
      return NextResponse.json(
        { error: 'Failed to create booking items' },
        { status: 500 }
      )
    }

    // Send email notifications (non-blocking) - wrap in try-catch to never block the response
    try {
      if (business_id) {
        const { data: business } = await supabase
          .from('businesses')
          .select('name, email, phone, address, logo_url')
          .eq('id', business_id)
          .single()

        if (business) {
          const { data: bookingWithItems } = await supabase
            .from('bookings')
            .select(`
              *, booking_items (id, quantity, item_price, items (id, name, category))
            `)
            .eq('id', booking.id)
            .single()

          if (bookingWithItems) {
            const notificationData = {
              business: {
                name: business.name,
                email: business.email || '',
                phone: business.phone || '',
                address: business.address || '',
              },
              booking: bookingWithItems,
              items: (bookingWithItems as any).booking_items?.map((bi: any) => ({
                quantity: bi.quantity,
                item_price: bi.item_price,
                item: { name: bi.items?.name || 'Unknown' },
              })) || [],
            }

            // Fire and forget - don't block the response
            Promise.allSettled([
              sendCustomerBookingRequest(notificationData),
              sendAdminNewBookingNotification(notificationData),
            ]).catch((err) => console.error('Email sending error:', err))
          }
        }
      }
    } catch (emailErr) {
      console.error('Email notification error (non-blocking):', emailErr)
    }

    return NextResponse.json({ id: booking.id, booking }, { status: 201 })
  } catch (error) {
    console.error('Booking API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    const supabase = await createClient()

    if (id) {
      // Get specific booking with items
      const { data: booking, error } = await supabase
        .from('bookings')
        .select(`
          *,
          booking_items (
            id,
            quantity,
            item_price,
            items (
              id,
              name,
              category,
              description
            )
          )
        `)
        .eq('id', id)
        .single()

      if (error || !booking) {
        return NextResponse.json(
          { error: 'Booking not found' },
          { status: 404 }
        )
      }

      return NextResponse.json(booking)
    }

    // Get all bookings (admin only)
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, business_id')
      .eq('id', user.id)
      .single()

    if (!profile || !['owner', 'admin', 'staff'].includes(profile.role)) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    let bookingsQuery = supabase
      .from('bookings')
      .select(`
        *,
        booking_items (
          id,
          quantity,
          item_price,
          items (
            id,
            name,
            category
          )
        )
      `)
      .order('created_at', { ascending: false })

    if (profile.business_id) {
      bookingsQuery = bookingsQuery.eq('business_id', profile.business_id)
    }

    const { data: bookings, error } = await bookingsQuery

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch bookings' },
        { status: 500 }
      )
    }

    return NextResponse.json(bookings)
  } catch (error) {
    console.error('Bookings GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
