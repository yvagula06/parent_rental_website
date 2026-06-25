import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { CheckCircle, Calendar, Mail, Phone, MapPin, Package, ArrowRight, Clock } from 'lucide-react'
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
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <div className="text-center animate-fade-in-up">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
            <Package className="h-8 w-8 text-red-400" />
          </div>
          <h1 className="heading text-2xl font-bold text-white mb-2">Booking Not Found</h1>
          <p className="text-slate-400 mb-6">The booking ID is missing or invalid.</p>
          <Link href="/"><Button className="bg-gradient-to-r from-violet-600 to-indigo-600 border-0 text-white">Return Home</Button></Link>
        </div>
      </div>
    )
  }

  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/bookings?id=${bookingId}`, {
    cache: 'no-store',
  })

  if (!response.ok) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <div className="text-center animate-fade-in-up">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-4">
            <Package className="h-8 w-8 text-amber-400" />
          </div>
          <h1 className="heading text-2xl font-bold text-white mb-2">Error Loading Booking</h1>
          <p className="text-slate-400 mb-6">Unable to load booking details. Please contact us.</p>
          <Link href="/"><Button className="bg-gradient-to-r from-violet-600 to-indigo-600 border-0 text-white">Return Home</Button></Link>
        </div>
      </div>
    )
  }

  const booking = await response.json()

  return (
    <div className="min-h-screen bg-slate-950">
      {/* ── Hero confirmation ────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-emerald-950/40 to-slate-950 px-4 pt-16 pb-24">
        {/* Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />

        <div className="relative container mx-auto max-w-3xl text-center animate-fade-in-up">
          {/* Animated check */}
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 shadow-2xl shadow-emerald-500/30 mb-6 animate-scale-in">
            <CheckCircle className="h-12 w-12 text-white" strokeWidth={2.5} />
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-widest mb-4">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-soft" />
            Request Submitted
          </div>

          <h1 className="heading text-4xl sm:text-5xl font-bold text-white mb-4">
            You're all set!
          </h1>
          <p className="text-slate-400 text-lg max-w-md mx-auto leading-relaxed">
            We received your booking request and will be in touch within 24 hours.
          </p>

          <div className="inline-flex items-center gap-2 mt-5 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 text-sm font-mono">
            Ref: <span className="text-white font-semibold">{booking.id.substring(0, 8).toUpperCase()}</span>
          </div>
        </div>
      </div>

      {/* ── Details card ──────────────────────────────────── */}
      <div className="relative -mt-12 container mx-auto max-w-3xl px-4 pb-16 space-y-5 animate-fade-in-up" style={{animationDelay: '0.2s'}}>

        {/* Main booking details */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
          <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between">
            <h2 className="heading font-bold text-white">Booking Details</h2>
            <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold capitalize">
              {booking.status}
            </span>
          </div>
          <div className="p-6 grid sm:grid-cols-2 gap-5">
            <div className="flex gap-3">
              <div className="w-9 h-9 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0">
                <Calendar className="h-4 w-4 text-violet-400" />
              </div>
              <div>
                <p className="text-slate-500 text-xs mb-0.5">Event Date</p>
                <p className="text-white font-semibold">{format(new Date(booking.event_date + 'T00:00:00'), 'PPP')}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                <Calendar className="h-4 w-4 text-blue-400" />
              </div>
              <div>
                <p className="text-slate-500 text-xs mb-0.5">Return Date</p>
                <p className="text-white font-semibold">{format(new Date(booking.return_date + 'T00:00:00'), 'PPP')}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                <MapPin className="h-4 w-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-slate-500 text-xs mb-0.5">Event Address</p>
                <p className="text-white font-semibold">{booking.event_address}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center shrink-0">
                <Package className="h-4 w-4 text-indigo-400" />
              </div>
              <div>
                <p className="text-slate-500 text-xs mb-0.5">Event Type</p>
                <p className="text-white font-semibold">{booking.event_type}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact info */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6">
          <h3 className="heading font-bold text-white mb-4">Contact Information</h3>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center">
                <Mail className="h-3.5 w-3.5 text-slate-400" />
              </div>
              <span className="text-slate-300 text-sm">{booking.email}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center">
                <Phone className="h-3.5 w-3.5 text-slate-400" />
              </div>
              <span className="text-slate-300 text-sm">{booking.phone}</span>
            </div>
          </div>
        </div>

        {/* Rental items */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-800">
            <h3 className="heading font-bold text-white">Rental Items</h3>
          </div>
          <div className="p-6 space-y-3">
            {booking.booking_items?.map((item: any) => (
              <div key={item.id} className="flex justify-between items-center py-3 border-b border-slate-800 last:border-0 last:pb-0">
                <div>
                  <p className="font-semibold text-white">{item.items?.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{item.items?.category}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-white">{item.quantity} × ${Number(item.item_price).toFixed(2)}</p>
                  <p className="text-xs text-slate-500">${(item.quantity * item.item_price).toFixed(2)}</p>
                </div>
              </div>
            ))}
            <div className="flex justify-between items-center pt-4">
              <span className="font-bold text-white text-lg">Total</span>
              <span className="text-2xl font-bold text-violet-400">${Number(booking.total_amount).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* What's next */}
        <div className="bg-gradient-to-br from-violet-900/30 to-indigo-900/30 rounded-2xl border border-violet-500/20 p-6">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
              <Clock className="h-4 w-4 text-violet-400" />
            </div>
            <h3 className="heading font-bold text-white">What happens next?</h3>
          </div>
          <ul className="space-y-2.5">
            {[
              "We'll review your booking request within 24 hours",
              "You'll receive a confirmation email once approved",
              "Payment details will be included in the confirmation",
              "Questions? Call us at (555) 123-4567",
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-slate-300">
                <span className="w-5 h-5 rounded-full bg-violet-500/20 text-violet-400 text-xs flex items-center justify-center shrink-0 mt-0.5 font-bold">{i + 1}</span>
                {step}
              </li>
            ))}
          </ul>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Link href="/catalog" className="flex-1">
            <Button variant="outline" className="w-full border-slate-700 text-slate-300 hover:border-violet-500 hover:text-violet-400 bg-transparent">
              Browse More Items
            </Button>
          </Link>
          <Link href="/" className="flex-1">
            <Button className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white border-0 shadow-lg">
              Return Home
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

