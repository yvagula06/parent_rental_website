import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateBookingAvailability } from '@/lib/services/availability'
import {
  sendCustomerBookingConfirmed,
  sendCustomerBookingCancelled,
  sendCustomerBookingCompleted,
} from '@/lib/services/email'

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const body = await request.json()
    const { status, admin_notes } = body

    const supabase = await createClient()

    // Verify admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, business_id')
      .eq('id', user.id)
      .single()

    if (!profile || !['owner', 'admin', 'staff'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // If changing to confirmed, recheck availability
    if (status === 'confirmed') {
      // Get current booking with items
      const { data: currentBooking } = await supabase
        .from('bookings')
        .select('*, booking_items (item_id, quantity, item_price)')
        .eq('id', params.id)
        .single()

      if (currentBooking) {
        const items = (currentBooking as any).booking_items?.map((bi: any) => ({
          item_id: bi.item_id,
          quantity: bi.quantity,
        })) || []

        const availabilityCheck = await validateBookingAvailability(
          items,
          currentBooking.event_date,
          currentBooking.return_date,
          { excludeBookingId: params.id, statuses: ['confirmed'], businessId: profile.business_id || undefined }
        )

        if (!availabilityCheck.valid) {
          return NextResponse.json(
            { error: 'Cannot confirm booking - inventory no longer available', details: availabilityCheck.errors },
            { status: 409 }
          )
        }
      }
    }

    // Update booking
    const { data: booking, error } = await supabase
      .from('bookings')
      .update({
        status,
        admin_notes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single()

    if (error || !booking) {
      console.error('Booking update error:', error)
      return NextResponse.json(
        { error: 'Failed to update booking' },
        { status: 500 }
      )
    }

    // Send email notifications for status changes (non-blocking)
    if (status && status !== booking.status) {
      const { data: bookingWithItems } = await supabase
        .from('bookings')
        .select(`
          *, booking_items (id, quantity, item_price, items (id, name, category))
        `)
        .eq('id', params.id)
        .single()

      let business = null
      if (booking.business_id) {
        const { data: biz } = await supabase
          .from('businesses')
          .select('name, email, phone, address')
          .eq('id', booking.business_id)
          .single()
        business = biz
      }

      if (bookingWithItems && business) {
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

        if (status === 'confirmed') {
          Promise.allSettled([sendCustomerBookingConfirmed(notificationData)])
            .catch((err) => console.error('Email error:', err))
        } else if (status === 'cancelled') {
          Promise.allSettled([sendCustomerBookingCancelled(notificationData)])
            .catch((err) => console.error('Email error:', err))
        } else if (status === 'completed') {
          Promise.allSettled([sendCustomerBookingCompleted(notificationData)])
            .catch((err) => console.error('Email error:', err))
        }
      }
    }

    return NextResponse.json(booking)
  } catch (error) {
    console.error('Booking PATCH error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const supabase = await createClient()

    // Verify admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Delete booking (booking_items will cascade delete)
    const { error } = await supabase
      .from('bookings')
      .delete()
      .eq('id', params.id)

    if (error) {
      console.error('Booking delete error:', error)
      return NextResponse.json(
        { error: 'Failed to delete booking' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Booking DELETE error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
