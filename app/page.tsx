import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/server'
import { Calendar, Package, Phone, Mail } from 'lucide-react'

export default async function Home() {
  const supabase = await createClient()

  // Fetch featured items
  const { data: featuredItems } = await supabase
    .from('items')
    .select('*')
    .eq('active', true)
    .order('name')
    .limit(6)

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-blue-50 to-white py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-6">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900">
              Premium Event Rentals
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need for your special event. Quality rentals,
              reliable service, and competitive pricing.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link href="/catalog">
                <Button size="lg">
                  Browse Catalog
                </Button>
              </Link>
              <Link href="/booking">
                <Button variant="outline" size="lg">
                  Create Booking
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose Us</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <Calendar className="h-10 w-10 text-blue-600 mb-2" />
                <CardTitle>Easy Booking</CardTitle>
                <CardDescription>
                  Simple online booking process with real-time availability
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <Package className="h-10 w-10 text-blue-600 mb-2" />
                <CardTitle>Quality Equipment</CardTitle>
                <CardDescription>
                  Well-maintained inventory perfect for any event
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <Phone className="h-10 w-10 text-blue-600 mb-2" />
                <CardTitle>Dedicated Support</CardTitle>
                <CardDescription>
                  Family-owned business committed to your satisfaction
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Featured Items Section */}
      {featuredItems && featuredItems.length > 0 && (
        <section className="py-16 px-4 bg-gray-50">
          <div className="container mx-auto max-w-6xl">
            <h2 className="text-3xl font-bold text-center mb-12">Popular Rentals</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredItems.map((item) => (
                <Card key={item.id}>
                  <CardHeader>
                    <CardTitle>{item.name}</CardTitle>
                    <CardDescription>{item.category}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4">{item.description}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-2xl font-bold text-blue-600">
                        ${item.price}
                      </span>
                      <span className="text-sm text-gray-500">
                        {item.total_quantity} available
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="text-center mt-8">
              <Link href="/catalog">
                <Button variant="outline" size="lg">
                  View Full Catalog
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Contact Section */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold mb-6">Get in Touch</h2>
          <p className="text-gray-600 mb-8">
            Have questions? We're here to help make your event perfect.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <div className="flex items-center justify-center gap-2">
              <Phone className="h-5 w-5 text-blue-600" />
              <span className="text-gray-700">(555) 123-4567</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Mail className="h-5 w-5 text-blue-600" />
              <span className="text-gray-700">rentals@example.com</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 px-4 mt-auto">
        <div className="container mx-auto max-w-6xl text-center">
          <p>&copy; {new Date().getFullYear()} Premium Event Rentals. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
