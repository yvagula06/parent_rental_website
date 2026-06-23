import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { createClient } from '@/lib/supabase/server'
import { Plus, SearchIcon, Package, Filter, Grid3X3, List } from 'lucide-react'

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

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('business_id')
    .eq('id', user?.id)
    .single()

  let categoriesQuery = supabase.from('items').select('category')
  if (profile?.business_id) {
    categoriesQuery = categoriesQuery.eq('business_id', profile.business_id)
  }
  const { data: allItems } = await categoriesQuery

  const categories = allItems
    ? Array.from(new Set(allItems.map((item) => item.category))).sort()
    : []

  let query = supabase.from('items').select('*')

  if (profile?.business_id) {
    query = query.eq('business_id', profile.business_id)
  }

  if (search) {
    query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
  }

  if (category && category !== 'all') {
    query = query.eq('category', category)
  }

  const { data: items, error } = await query.order('category').order('name')

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in-up">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-md shadow-purple-200 animate-float">
            <Package className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 heading">Inventory Management</h2>
            <p className="text-sm text-slate-500">Manage your rental items</p>
          </div>
        </div>
        <Link href="/admin/inventory/new">
          <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md shadow-blue-200 rounded-xl transition-all hover:shadow-lg">
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card className="bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-2xl shadow-sm">
        <CardContent className="pt-6">
          <form method="GET" className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <SearchIcon className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
              <Input
                name="search"
                placeholder="Search items by name or description..."
                defaultValue={search}
                className="pl-10 h-11 rounded-xl border-slate-200 bg-white/80 focus:border-blue-400 focus:ring-blue-400/20 transition-all"
              />
            </div>
            <div className="flex gap-3">
              <div className="relative">
                <Filter className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4 pointer-events-none" />
                <Select name="category" defaultValue={category || 'all'}>
                  <SelectTrigger className="w-full md:w-48 h-11 pl-10 rounded-xl border-slate-200 bg-white/80">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="h-11 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-sm">
                Filter
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Items Table */}
      <Card className="bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-6 w-1 rounded-full bg-gradient-to-b from-blue-500 to-indigo-500" />
              <CardTitle className="text-base font-semibold text-slate-700">
                {items?.length || 0} Item{items?.length === 1 ? '' : 's'}
              </CardTitle>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <List className="h-4 w-4" />
              <Grid3X3 className="h-4 w-4 text-slate-600" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {error && (
            <div className="mx-6 mt-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2">
              Error loading items. Please try again.
            </div>
          )}

          {items && items.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="p-4 rounded-full bg-slate-50 mb-4">
                <Package className="h-10 w-10 text-slate-300" />
              </div>
              <p className="text-slate-500 font-medium">No items found</p>
              <p className="text-xs text-slate-400 mt-1">Try adjusting your search or filters</p>
              <Link href="/admin/inventory">
                <Button variant="outline" className="mt-4 rounded-xl">Clear Filters</Button>
              </Link>
            </div>
          )}

          {items && items.length > 0 && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-100 bg-slate-50/50">
                    <TableHead className="text-slate-600 font-semibold text-xs uppercase tracking-wider">Name</TableHead>
                    <TableHead className="text-slate-600 font-semibold text-xs uppercase tracking-wider">Category</TableHead>
                    <TableHead className="text-slate-600 font-semibold text-xs uppercase tracking-wider">Price</TableHead>
                    <TableHead className="text-slate-600 font-semibold text-xs uppercase tracking-wider">Qty</TableHead>
                    <TableHead className="text-slate-600 font-semibold text-xs uppercase tracking-wider">Status</TableHead>
                    <TableHead className="text-slate-600 font-semibold text-xs uppercase tracking-wider">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, i) => (
                    <TableRow key={item.id} className={`border-slate-100 hover:bg-blue-50/30 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                            {item.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900">{item.name}</div>
                            {item.description && (
                              <div className="text-xs text-slate-400 line-clamp-1 max-w-[200px]">
                                {item.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-600">
                          {item.category}
                        </span>
                      </TableCell>
                      <TableCell className="font-semibold text-blue-600">
                        ${Number(item.price).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-slate-700">
                        <span className="font-medium">{item.total_quantity}</span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className="rounded-full text-xs px-3 py-0.5"
                          variant={item.active ? 'default' : 'secondary'}
                        >
                          {item.active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Link href={`/admin/inventory/${item.id}`}>
                          <Button size="sm" variant="outline" className="rounded-lg border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-all">
                            Edit
                          </Button>
                        </Link>
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
