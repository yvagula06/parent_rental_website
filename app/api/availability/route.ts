import { NextResponse } from 'next/server'
import { calculateAvailability } from '@/lib/services/availability'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const eventDate = searchParams.get('eventDate')
    const returnDate = searchParams.get('returnDate')
    const businessId = searchParams.get('businessId')

    if (!eventDate || !returnDate) {
      return NextResponse.json(
        { error: 'Missing required parameters: eventDate and returnDate' },
        { status: 400 }
      )
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(eventDate) || !dateRegex.test(returnDate)) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      )
    }

    // Validate return date is after event date
    if (new Date(returnDate) < new Date(eventDate)) {
      return NextResponse.json(
        { error: 'Return date must be on or after event date' },
        { status: 400 }
      )
    }

    const options: any = {}
    if (businessId) {
      options.businessId = businessId
    }

    const availability = await calculateAvailability(eventDate, returnDate, options)

    return NextResponse.json(availability)
  } catch (error) {
    console.error('Availability API error:', error)
    return NextResponse.json(
      { error: 'Failed to calculate availability' },
      { status: 500 }
    )
  }
}
