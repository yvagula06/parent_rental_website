import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createClient } from '@/lib/supabase/server'
import { SearchIcon } from 'lucide-react'

interface PageProps {
  searchParams: Promise<{
    search?: string
    category?: string
  }>
}

export default async function CatalogPage({ searchParams }: PageProps) {
  const supabase = await createClient()
  const params = await searchParams
  const search = params.search
  const category = params.category

  // Get all unique categories
  const { data: allItems } = await supabase
    .from('items')
    .select('category')
    .eq('active', true)

  const categories = allItems
    ? Array.from(new Set(allItems.map((item) => item.category))).sort()
    : []

  // Build query
  let query = supabase
    .from('items')
    .select('*')
    .eq('active', true)

  // Apply filters
  if (search) {
    query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
  }

  if (category && category !== 'all') {
    query = query.eq('category', category)
  }

  const { data: items, error } = await query.order('category').order('name')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto max-w-6xl px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold">Rental Catalog</h1>
              <p className="text-gray-600 mt-1">Browse our complete inventory</p>
            </div>
            <Link href="/booking">
              <Button>Create Booking</Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b">
        <div className="container mx-auto max-w-6xl px-4 py-4">
          <form method="GET" className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                name="search"
                placeholder="Search items..."
                defaultValue={search}
                className="pl-10"
              />
            </div>
            <Select name="category" defaultValue={category || 'all'}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="submit">Filter</Button>
          </form>
        </div>
      </div>

      {/* Items Grid */}
      <div className="container mx-auto max-w-6xl px-4 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            Error loading items. Please try again.
          </div>
        )}

        {items && items.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">No items found matching your criteria.</p>
            <Link href="/catalog">
              <Button variant="outline" className="mt-4">Clear Filters</Button>
            </Link>
          </div>
        )}

        {items && items.length > 0 && (
          <div>
            <p className="text-gray-600 mb-6">
              Showing {items.length} {items.length === 1 ? 'item' : 'items'}
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map((item) => (
                <Card key={item.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{item.name}</CardTitle>
                        <CardDescription>{item.category}</CardDescription>
                      </div>
                      <span className="text-2xl font-bold text-blue-600">
                        ${item.price.toFixed(2)}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4">
                      {item.description || 'No description available'}
                    </p>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">Total Available:</span>
                      <span className="font-semibold">{item.total_quantity}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
