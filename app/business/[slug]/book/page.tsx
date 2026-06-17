import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import BusinessBookingForm from '../booking-form'

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function BusinessBookPage({ params }: PageProps) {
  const { slug } = await params
  const supabase = await createClient()

  // Fetch business by slug
  const { data: business, error } = await supabase
    .from('businesses')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error || !business) {
    notFound()
  }

  // Fetch active items for this business
  const { data: items } = await supabase
    .from('items')
    .select('*')
    .eq('business_id', business.id)
    .eq('active', true)
    .order('category')
    .order('name')

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="container mx-auto max-w-4xl">
        <Link href={`/business/${slug}`}>
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to {business.name}
          </Button>
        </Link>

        <div className="mb-6">
          <h1 className="text-3xl font-bold">Book Rentals - {business.name}</h1>
          <p className="text-gray-600 mt-1">
            Select your event dates, choose items, and submit your booking request.
          </p>
        </div>

        <BusinessBookingForm
          businessId={business.id}
          businessName={business.name}
          businessEmail={business.email || ''}
          businessPhone={business.phone || ''}
          items={items || []}
        />
      </div>
    </div>
  )
}