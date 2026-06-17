import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { createClient } from '@/lib/supabase/server'
import { Plus, SearchIcon } from 'lucide-react'

interface PageProps {
  searchParams: Promise<{
    search?: string
    category?: string
  }>
}

export default async function AdminInventoryPage({ searchParams }: PageProps) {
  const supabase = await createClient()
  const params = await searchParams
  const search = params.search
  const category = params.category

  // Get current user's business
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('business_id')
    .eq('id', user?.id)
    .single()

  // Get all categories scoped to business
  let categoriesQuery = supabase.from('items').select('category')
  if (profile?.business_id) {
    categoriesQuery = categoriesQuery.eq('business_id', profile.business_id)
  }
  const { data: allItems } = await categoriesQuery

  const categories = allItems
    ? Array.from(new Set(allItems.map((item) => item.category))).sort()
    : []

  // Build query
  let query = supabase
    .from('items')
    .select('*')

  // Scope to business
  if (profile?.business_id) {
    query = query.eq('business_id', profile.business_id)
  }

  // Apply filters
  if (search) {
    query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
  }

  if (category && category !== 'all') {
    query = query.eq('category', category)
  }

  const { data: items, error } = await query.order('category').order('name')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Inventory Management</h2>
          <p className="text-gray-600 mt-1">Manage your rental items</p>
        </div>
        <Link href="/admin/inventory/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
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
        </CardContent>
      </Card>

      {/* Items Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {items?.length || 0} Item{items?.length === 1 ? '' : 's'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              Error loading items. Please try again.
            </div>
          )}

          {items && items.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No items found</p>
              <Link href="/admin/inventory">
                <Button variant="outline" className="mt-4">Clear Filters</Button>
              </Link>
            </div>
          )}

          {items && items.length > 0 && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Total Quantity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{item.name}</div>
                          {item.description && (
                            <div className="text-sm text-gray-500 line-clamp-1">
                              {item.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{item.category}</TableCell>
                      <TableCell className="font-semibold">
                        ${item.price.toFixed(2)}
                      </TableCell>
                      <TableCell>{item.total_quantity}</TableCell>
                      <TableCell>
                        <Badge variant={item.active ? 'default' : 'secondary'}>
                          {item.active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Link href={`/admin/inventory/${item.id}`}>
                            <Button size="sm" variant="outline">Edit</Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
