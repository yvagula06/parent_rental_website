import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, Calendar, Mail, Phone } from 'lucide-react'
import { format } from 'date-fns'

interface PageProps {
  searchParams: Promise<{
    id?: string
  }>
}

export default async function ConfirmationPage({ searchParams }: PageProps) {
  const params = await searchParams
  const bookingId = params.id

  if (!bookingId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Booking Not Found</CardTitle>
            <CardDescription>
              The booking ID is missing or invalid.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/">
              <Button>Return Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Fetch booking details
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/bookings?id=${bookingId}`, {
    cache: 'no-store',
  })

  if (!response.ok) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Error Loading Booking</CardTitle>
            <CardDescription>
              Unable to load booking details. Please contact us for assistance.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/">
              <Button>Return Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const booking = await response.json()

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="container mx-auto max-w-3xl">
        <div className="text-center mb-8">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Booking Request Submitted!
          </h1>
          <p className="text-gray-600">
            Thank you for your booking request. We'll review it and contact you shortly.
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Booking Details</CardTitle>
            <CardDescription>Reference ID: {booking.id.substring(0, 8)}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <p className="font-semibold capitalize">{booking.status}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Amount</p>
                <p className="font-semibold text-blue-600">
                  ${booking.total_amount.toFixed(2)}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Event Date</p>
                <p className="font-semibold">
                  {format(new Date(booking.event_date), 'PPP')}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Return Date</p>
                <p className="font-semibold">
                  {format(new Date(booking.return_date), 'PPP')}
                </p>
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-500">Event Type</p>
              <p className="font-semibold">{booking.event_type}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Event Address</p>
              <p className="font-semibold">{booking.event_address}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-gray-400" />
              <span>{booking.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-gray-400" />
              <span>{booking.phone}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Rental Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {booking.booking_items.map((item: any) => (
                <div key={item.id} className="flex justify-between items-center pb-3 border-b last:border-0">
                  <div>
                    <p className="font-semibold">{item.items.name}</p>
                    <p className="text-sm text-gray-500">{item.items.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      {item.quantity} × ${item.item_price.toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-500">
                      ${(item.quantity * item.item_price).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
              <div className="flex justify-between items-center pt-3 font-bold text-lg">
                <span>Total</span>
                <span className="text-blue-600">${booking.total_amount.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
          <h3 className="font-semibold text-blue-900 mb-2">What happens next?</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>• We'll review your booking request within 24 hours</li>
            <li>• You'll receive an email confirmation once approved</li>
            <li>• Payment details will be included in the confirmation email</li>
            <li>• If you have questions, contact us at (555) 123-4567</li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/catalog">
            <Button variant="outline">Browse More Items</Button>
          </Link>
          <Link href="/">
            <Button>Return Home</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
