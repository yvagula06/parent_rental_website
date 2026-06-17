import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Package, Phone, Mail, MapPin } from 'lucide-react'
import BusinessBookingForm from './booking-form'

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function BusinessPage({ params }: PageProps) {
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
    <div className="min-h-screen bg-gray-50">
      {/* Business Header */}
      <div className="bg-gradient-to-b from-blue-600 to-blue-800 text-white">
        <div className="container mx-auto max-w-6xl px-4 py-12">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {business.logo_url && (
              <img
                src={business.logo_url}
                alt={business.name}
                className="w-20 h-20 rounded-lg object-cover bg-white"
              />
            )}
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold">{business.name}</h1>
              <p className="text-blue-100 mt-2">Browse our rental inventory and book online</p>
              <div className="flex flex-wrap gap-4 mt-4 text-sm text-blue-100">
                {business.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-4 w-4" /> {business.phone}
                  </span>
                )}
                {business.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="h-4 w-4" /> {business.email}
                  </span>
                )}
                {business.address && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" /> {business.address}
                  </span>
                )}
              </div>
            </div>
            <div className="shrink-0">
              <Link href={`/business/${slug}/book`}>
                <Button size="lg" className="bg-white text-blue-700 hover:bg-blue-50">
                  Book Now
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Items Grid */}
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <h2 className="text-2xl font-bold mb-6">Our Rental Inventory</h2>

        {!items || items.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No rental items available at this time.</p>
              <p className="text-gray-400 mt-2">Please check back later or contact us directly.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => (
              <Card key={item.id} className="hover:shadow-lg transition-shadow">
                {item.image_url && (
                  <div className="aspect-video overflow-hidden rounded-t-lg">
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{item.name}</CardTitle>
                      <CardDescription>{item.category}</CardDescription>
                    </div>
                    <span className="text-2xl font-bold text-blue-600 shrink-0">
                      ${Number(item.price).toFixed(2)}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {item.description || 'No description available'}
                  </p>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Available:</span>
                    <span className="font-semibold">{item.total_quantity} units</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 px-4 mt-auto">
        <div className="container mx-auto max-w-6xl text-center">
          <p>&copy; {new Date().getFullYear()} {business.name}. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}