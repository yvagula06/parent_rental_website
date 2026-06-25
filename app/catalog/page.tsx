import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createClient } from '@/lib/supabase/server'
import { SearchIcon, Package, ArrowRight, Filter } from 'lucide-react'
import type { Item } from '@/lib/types/database.types'

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

  const { data: allItems } = await supabase
    .from('items')
    .select('category')
    .eq('active', true)

  const categories = allItems
    ? Array.from(new Set(allItems.map((item) => item.category))).sort()
    : []

  let query = supabase
    .from('items')
    .select('*')
    .eq('active', true)

  if (search) {
    query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
  }

  if (category && category !== 'all') {
    query = query.eq('category', category)
  }

  const { data: items, error } = await query.order('category').order('name')

  const groupedItems: Record<string, Item[]> = (items ?? []).reduce((acc, item) => {
    const cat = item.category
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(item)
    return acc
  }, {} as Record<string, Item[]>)

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── Header ──────────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-10 backdrop-blur-md bg-white/90">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
                <Package className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="font-semibold text-slate-900 heading text-sm">EventRental</span>
            </Link>
            <Link href="/booking">
              <Button size="sm" className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white border-0 shadow-md">
                Book Now
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* ── Hero Banner ─────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-violet-950 px-4 py-14">
        <div className="container mx-auto max-w-6xl animate-fade-in-up">
          <p className="text-violet-300 font-semibold text-sm uppercase tracking-widest mb-3">Browse inventory</p>
          <h1 className="heading text-4xl sm:text-5xl font-bold text-white mb-3">Rental Catalog</h1>
          <p className="text-white/50 text-lg max-w-xl">
            Everything you need for your perfect event, all in one place.
          </p>
        </div>
      </div>

      {/* ── Filters ─────────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-100 shadow-sm">
        <div className="container mx-auto max-w-6xl px-4 py-4">
          <form method="GET" className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4 pointer-events-none" />
              <Input
                name="search"
                placeholder="Search items..."
                defaultValue={search}
                className="pl-10 h-11 bg-slate-50 border-slate-200 focus:border-violet-400 focus:ring-violet-400/20 rounded-xl"
              />
            </div>
            <div className="flex gap-3">
              <Select name="category" defaultValue={category || 'all'}>
                <SelectTrigger className="w-full md:w-52 h-11 bg-slate-50 border-slate-200 rounded-xl">
                  <Filter className="h-4 w-4 text-slate-400 mr-1.5" />
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="submit" className="h-11 px-6 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white border-0 rounded-xl shadow-md">
                Search
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* ── Grid ────────────────────────────────────────────── */}
      <div className="container mx-auto max-w-6xl px-4 py-10">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
            Error loading items. Please try again.
          </div>
        )}

        {items && items.length === 0 && (
          <div className="text-center py-20 animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <SearchIcon className="h-8 w-8 text-slate-300" />
            </div>
            <p className="text-slate-600 text-lg font-medium mb-2">No items found</p>
            <p className="text-slate-400 text-sm mb-6">Try adjusting your search or filters.</p>
            <Link href="/catalog">
              <Button variant="outline" className="border-slate-300 hover:border-violet-400 hover:text-violet-600">Clear Filters</Button>
            </Link>
          </div>
        )}

        {items && items.length > 0 && (
          <div className="animate-fade-in">
            <p className="text-slate-500 text-sm mb-6">
              {items.length} {items.length === 1 ? 'item' : 'items'} found
              {(search || (category && category !== 'all')) && (
                <Link href="/catalog" className="ml-3 text-violet-600 hover:underline font-medium">Clear filters</Link>
              )}
            </p>

            {/* Group by category */}
            {Object.entries(groupedItems).map(([cat, catItems]) => (
              <div key={cat} className="mb-10">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-2 h-6 rounded-full bg-gradient-to-b from-violet-500 to-indigo-500" />
                  <h2 className="heading text-xl font-bold text-slate-900">{cat}</h2>
                  <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-violet-50 text-violet-600 border border-violet-100">
                    {catItems.length}
                  </span>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 stagger-children">
                  {catItems.map((item) => (
                    <div key={item.id} className="group hover-lift bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl overflow-hidden transition-all duration-300">
                      <div className="h-1 w-full bg-gradient-to-r from-violet-500 via-indigo-500 to-blue-500" />
                      <div className="p-5">
                        <div className="flex justify-between items-start mb-3">
                          <h3 className="heading font-bold text-slate-900 leading-snug pr-2">{item.name}</h3>
                          <div className="text-right shrink-0">
                            <span className="text-xl font-bold text-violet-600">${item.price.toFixed(2)}</span>
                            <p className="text-xs text-slate-400">/ day</p>
                          </div>
                        </div>

                        {item.description && (
                          <p className="text-sm text-slate-500 leading-relaxed mb-4 line-clamp-2">
                            {item.description}
                          </p>
                        )}

                        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                          <div className="flex items-center gap-1.5 text-xs text-slate-400">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-soft" />
                            {item.total_quantity} available
                          </div>
                          <Link href="/booking">
                            <Button size="sm" variant="ghost" className="group/btn text-violet-600 hover:bg-violet-50 font-medium text-xs -mr-2 h-8">
                              Book
                              <ArrowRight className="ml-1 h-3 w-3 transition-transform group-hover/btn:translate-x-0.5" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
