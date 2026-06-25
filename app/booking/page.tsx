'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { format } from 'date-fns'
import { Calendar as CalendarIcon, Loader2, Minus, Plus, ShoppingCart, Package, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'

import { Button, buttonVariants } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import type { Item } from '@/lib/types/database.types'

interface ItemAvailability {
  item: Item
  available: number
  booked: number
}

const dateSchema = z.object({
  eventDate: z.date({ message: 'Event date is required' }),
  returnDate: z.date({ message: 'Return date is required' }),
}).refine((data) => data.returnDate >= data.eventDate, {
  message: 'Return date must be on or after event date',
  path: ['returnDate'],
})

const customerSchema = z.object({
  customerName: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().min(10, 'Please enter a valid phone number'),
  email: z.string().email('Please enter a valid email'),
  eventAddress: z.string().min(5, 'Address is required'),
  eventType: z.string().min(2, 'Event type is required'),
  notes: z.string().optional(),
})

type Step = 'dates' | 'items' | 'customer'

export default function BookingPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('dates')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [dates, setDates] = useState<{ eventDate: Date; returnDate: Date } | null>(null)
  const [selectedItems, setSelectedItems] = useState<{
    itemId: string
    itemName: string
    quantity: number
    price: number
  }[]>([])
  const [availability, setAvailability] = useState<ItemAvailability[]>([])
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false)
  const [itemQuantities, setItemQuantities] = useState<Record<string, number>>({})

  const dateForm = useForm<z.infer<typeof dateSchema>>({
    resolver: zodResolver(dateSchema),
    defaultValues: {
      eventDate: undefined,
      returnDate: undefined,
    },
  })

  const customerForm = useForm<z.infer<typeof customerSchema>>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      customerName: '',
      phone: '',
      email: '',
      eventAddress: '',
      eventType: '',
      notes: '',
    },
  })

  // Fetch availability when dates change and step is 'items'
  useEffect(() => {
    if (dates && step === 'items') {
      fetchAvailability()
    }
  }, [dates, step])

  const fetchAvailability = async () => {
    if (!dates) return

    setIsLoadingAvailability(true)
    try {
      const eventDate = format(dates.eventDate, 'yyyy-MM-dd')
      const returnDate = format(dates.returnDate, 'yyyy-MM-dd')

      const response = await fetch(
        `/api/availability?eventDate=${eventDate}&returnDate=${returnDate}`
      )

      if (!response.ok) {
        throw new Error('Failed to fetch availability')
      }

      const data = await response.json()
      setAvailability(data)

      // Initialize quantities for items that were previously selected
      const newQuantities: Record<string, number> = {}
      selectedItems.forEach((selectedItem) => {
        const itemAvail = data.find((a: ItemAvailability) => a.item.id === selectedItem.itemId)
        if (itemAvail && itemAvail.available >= selectedItem.quantity) {
          newQuantities[selectedItem.itemId] = selectedItem.quantity
        }
      })
      setItemQuantities(newQuantities)
    } catch (error) {
      console.error('Error fetching availability:', error)
      toast.error('Failed to load availability')
    } finally {
      setIsLoadingAvailability(false)
    }
  }

  const handleDatesSubmit = async (values: z.infer<typeof dateSchema>) => {
    setDates(values)
    setStep('items')
  }

  const handleQuantityChange = (itemId: string, delta: number) => {
    const itemAvail = availability.find((a) => a.item.id === itemId)
    if (!itemAvail) return

    const currentQty = itemQuantities[itemId] || 0
    const newQty = Math.max(0, Math.min(itemAvail.available, currentQty + delta))

    setItemQuantities((prev) => ({
      ...prev,
      [itemId]: newQty,
    }))
  }

  const handleItemsNext = () => {
    // Build selected items from quantities
    const selected = Object.entries(itemQuantities)
      .filter(([_, qty]) => qty > 0)
      .map(([itemId, quantity]) => {
        const itemAvail = availability.find((a) => a.item.id === itemId)
        if (!itemAvail) return null
        return {
          itemId,
          itemName: itemAvail.item.name,
          quantity,
          price: Number(itemAvail.item.price),
        }
      })
      .filter(Boolean) as typeof selectedItems

    if (selected.length === 0) {
      toast.error('Please select at least one item')
      return
    }

    setSelectedItems(selected)
    setStep('customer')
  }

  const calculateTotal = () => {
    return Object.entries(itemQuantities).reduce((total, [itemId, quantity]) => {
      const itemAvail = availability.find((a) => a.item.id === itemId)
      if (!itemAvail) return total
      return total + Number(itemAvail.item.price) * quantity
    }, 0)
  }

  const handleCustomerSubmit = async (values: z.infer<typeof customerSchema>) => {
    if (!dates) return

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer_name: values.customerName,
          phone: values.phone,
          email: values.email,
          event_address: values.eventAddress,
          event_type: values.eventType,
          event_date: format(dates.eventDate, 'yyyy-MM-dd'),
          return_date: format(dates.returnDate, 'yyyy-MM-dd'),
          notes: values.notes || '',
          items: selectedItems.map((item) => ({
            item_id: item.itemId,
            quantity: item.quantity,
            item_price: item.price,
          })),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create booking')
      }

      const data = await response.json()
      toast.success('Booking submitted successfully!')
      router.push(`/booking/confirmation?id=${data.id}`)
    } catch (error) {
      console.error('Booking error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to submit booking')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Top nav ────────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-10 backdrop-blur-md bg-white/90">
        <div className="container mx-auto max-w-4xl px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
              <Package className="h-3 w-3 text-white" />
            </div>
            <span className="font-semibold text-slate-900 heading text-sm">EventRental</span>
          </Link>
          <Link href="/catalog" className="text-xs text-slate-500 hover:text-violet-600 transition-colors">
            Browse catalog
          </Link>
        </div>
      </div>

      <div className="container mx-auto max-w-4xl px-4 py-10">
        {/* ── Page title ───────────────────────────────────── */}
        <div className="mb-8 animate-fade-in-up">
          <p className="text-violet-600 font-semibold text-xs uppercase tracking-widest mb-1">Create a booking</p>
          <h1 className="heading text-3xl font-bold text-slate-900">Reserve Your Rentals</h1>
        </div>

        {/* ── Step progress ────────────────────────────────── */}
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center gap-0">
            {([
              { key: 'dates', label: 'Select Dates', num: 1 },
              { key: 'items', label: 'Choose Items', num: 2 },
              { key: 'customer', label: 'Your Info', num: 3 },
            ] as const).map((s, index) => {
              const stepOrder = ['dates', 'items', 'customer'] as const
              const currentIdx = stepOrder.indexOf(step)
              const isActive = step === s.key
              const isDone = currentIdx > index
              return (
                <div key={s.key} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center gap-1.5">
                    <div className={cn(
                      'w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300',
                      isActive ? 'bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/30 scale-110' :
                      isDone ? 'bg-emerald-500 text-white' :
                      'bg-slate-200 text-slate-400'
                    )}>
                      {isDone ? '✓' : s.num}
                    </div>
                    <span className={cn('text-xs font-medium whitespace-nowrap', isActive ? 'text-violet-600' : isDone ? 'text-emerald-600' : 'text-slate-400')}>
                      {s.label}
                    </span>
                  </div>
                  {index < 2 && (
                    <div className={cn('h-0.5 flex-1 mx-2 mb-5 transition-all duration-300', isDone ? 'bg-emerald-400' : 'bg-slate-200')} />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Step 1: Dates ────────────────────────────────── */}
        {step === 'dates' && (
          <div className="animate-fade-in-up">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
              <div className="mb-6">
                <h2 className="heading text-xl font-bold text-slate-900">Select Event Dates</h2>
                <p className="text-slate-500 text-sm mt-1">Choose your event date and when you'll return the items</p>
              </div>
              <Form {...dateForm}>
                <form onSubmit={dateForm.handleSubmit(handleDatesSubmit)} className="space-y-6">
                  <FormField
                    control={dateForm.control}
                    name="eventDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel className="text-slate-700 font-medium">Event Date</FormLabel>
                        <Popover>
                          <PopoverTrigger className={cn(
                            buttonVariants({ variant: 'outline' }),
                            'w-full pl-3 text-left font-normal justify-start gap-2 h-11 rounded-xl border-slate-200 bg-white/80 hover:border-violet-400 hover:shadow-sm transition-all',
                            !field.value && 'text-muted-foreground'
                          )}>
                            <CalendarIcon className="h-4 w-4 shrink-0 text-violet-500" />
                            {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) =>
                                date < new Date(new Date().setHours(0, 0, 0, 0))
                              }
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={dateForm.control}
                    name="returnDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel className="text-slate-700 font-medium">Return Date</FormLabel>
                        <Popover>
                          <PopoverTrigger className={cn(
                            buttonVariants({ variant: 'outline' }),
                            'w-full pl-3 text-left font-normal justify-start gap-2 h-11 rounded-xl border-slate-200 bg-white/80 hover:border-violet-400 hover:shadow-sm transition-all',
                            !field.value && 'text-muted-foreground'
                          )}>
                            <CalendarIcon className="h-4 w-4 shrink-0 text-violet-500" />
                            {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) =>
                                date < (dateForm.getValues('eventDate') || new Date())
                              }
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full h-11 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white border-0 shadow-md font-semibold rounded-xl">
                    Continue to Items
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </form>
              </Form>
            </div>
          </div>
        )}

        {/* ── Step 2: Items ────────────────────────────────── */}
        {step === 'items' && dates && (
          <div className="space-y-5 animate-fade-in-up">
            {/* Date pill */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-50 border border-violet-100 text-sm text-violet-700">
              <CalendarIcon className="h-3.5 w-3.5" />
              {format(dates.eventDate, 'MMM d')} – {format(dates.returnDate, 'MMM d, yyyy')}
              <button onClick={() => setStep('dates')} className="ml-1 text-violet-400 hover:text-violet-600 transition-colors text-xs underline">Edit</button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
              <div className="mb-6">
                <h2 className="heading text-xl font-bold text-slate-900">Select Rental Items</h2>
                <p className="text-slate-500 text-sm mt-1">Choose what you need and set quantities</p>
              </div>

              {isLoadingAvailability ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                      <Skeleton className="h-4 w-32 mb-2" />
                      <Skeleton className="h-20 w-full rounded-xl" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-8">
                  {Object.entries(
                    availability.reduce((acc, itemAvail) => {
                      const category = itemAvail.item.category
                      if (!acc[category]) acc[category] = []
                      acc[category].push(itemAvail)
                      return acc
                    }, {} as Record<string, ItemAvailability[]>)
                  ).map(([category, items]) => (
                    <div key={category}>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-1.5 h-5 rounded-full bg-gradient-to-b from-violet-500 to-indigo-500" />
                        <h3 className="heading text-base font-bold text-slate-800">{category}</h3>
                      </div>
                      <div className="space-y-3">
                        {items.map((itemAvail) => {
                          const qty = itemQuantities[itemAvail.item.id] || 0
                          const subtotal = qty * Number(itemAvail.item.price)
                          return (
                            <div
                              key={itemAvail.item.id}
                              className={cn(
                                'rounded-xl p-4 border transition-all duration-200',
                                qty > 0
                                  ? 'border-violet-300 bg-violet-50 shadow-sm'
                                  : 'border-slate-200 bg-white hover:border-slate-300'
                              )}
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                                    <h4 className="font-semibold text-slate-900">{itemAvail.item.name}</h4>
                                    {itemAvail.available === 0 ? (
                                      <Badge variant="destructive" className="text-xs">Unavailable</Badge>
                                    ) : itemAvail.available < 5 ? (
                                      <Badge className="text-xs bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100">
                                        Only {itemAvail.available} left
                                      </Badge>
                                    ) : null}
                                  </div>
                                  {itemAvail.item.description && (
                                    <p className="text-sm text-slate-500 mb-2 line-clamp-1">{itemAvail.item.description}</p>
                                  )}
                                  <div className="flex items-center gap-3 text-sm">
                                    <span className="font-bold text-violet-600">${Number(itemAvail.item.price).toFixed(2)}</span>
                                    <span className="text-slate-400 text-xs">· {itemAvail.available} available</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  {itemAvail.available > 0 ? (
                                    <>
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        className="h-8 w-8 rounded-lg border-slate-200 hover:border-violet-400"
                                        onClick={() => handleQuantityChange(itemAvail.item.id, -1)}
                                        disabled={qty === 0}
                                      >
                                        <Minus className="h-3.5 w-3.5" />
                                      </Button>
                                      <div className="w-14 text-center">
                                        <div className={cn('text-lg font-bold transition-colors', qty > 0 ? 'text-violet-700' : 'text-slate-400')}>{qty}</div>
                                        {qty > 0 && <div className="text-xs text-slate-500">${subtotal.toFixed(2)}</div>}
                                      </div>
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        className="h-8 w-8 rounded-lg border-slate-200 hover:border-violet-400"
                                        onClick={() => handleQuantityChange(itemAvail.item.id, 1)}
                                        disabled={qty >= itemAvail.available}
                                      >
                                        <Plus className="h-3.5 w-3.5" />
                                      </Button>
                                    </>
                                  ) : (
                                    <span className="text-xs text-slate-400 px-3">Not available</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}

                  {/* Cart summary */}
                  {Object.keys(itemQuantities).some((id) => itemQuantities[id] > 0) && (
                    <div className="rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 p-5 text-white">
                      <div className="flex items-center justify-between mb-3">
                        <span className="flex items-center gap-2 font-semibold">
                          <ShoppingCart className="h-4 w-4" />
                          Selected Items
                        </span>
                        <button
                          type="button"
                          onClick={() => setItemQuantities({})}
                          className="text-white/60 hover:text-white text-xs transition-colors"
                        >
                          Clear all
                        </button>
                      </div>
                      <div className="space-y-1.5 mb-4">
                        {Object.entries(itemQuantities)
                          .filter(([_, qty]) => qty > 0)
                          .map(([itemId, qty]) => {
                            const itemAvail = availability.find((a) => a.item.id === itemId)
                            if (!itemAvail) return null
                            return (
                              <div key={itemId} className="flex justify-between text-sm">
                                <span className="text-white/80">{itemAvail.item.name} × {qty}</span>
                                <span className="font-medium">${(qty * Number(itemAvail.item.price)).toFixed(2)}</span>
                              </div>
                            )
                          })}
                      </div>
                      <div className="flex justify-between items-center pt-3 border-t border-white/20">
                        <span className="font-semibold">Total</span>
                        <span className="text-2xl font-bold">${calculateTotal().toFixed(2)}</span>
                      </div>
                    </div>
                  )}

                  {availability.length === 0 && (
                    <div className="text-center py-12 text-slate-500">
                      No items available for the selected dates.<br />
                      <button onClick={() => setStep('dates')} className="mt-3 text-violet-600 hover:underline text-sm font-medium">
                        Try different dates
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3 mt-8 pt-6 border-t border-slate-100">
                <Button
                  onClick={() => setStep('dates')}
                  variant="outline"
                  className="h-11 rounded-xl border-slate-200"
                >
                  Back
                </Button>
                <Button
                  onClick={handleItemsNext}
                  className="flex-1 h-11 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white border-0 shadow-md font-semibold rounded-xl"
                >
                  Continue to Your Info
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ── Step 3: Customer ─────────────────────────────── */}
        {step === 'customer' && dates && (
          <div className="space-y-5 animate-fade-in-up">
            {/* Booking summary */}
            <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-2xl p-6 text-white">
              <h3 className="heading font-bold text-base mb-4 text-white/80 uppercase tracking-wide text-xs">Booking Summary</h3>
              <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                <div>
                  <p className="text-white/50 text-xs mb-0.5">Event Date</p>
                  <p className="font-semibold">{format(dates.eventDate, 'MMM d, yyyy')}</p>
                </div>
                <div>
                  <p className="text-white/50 text-xs mb-0.5">Return Date</p>
                  <p className="font-semibold">{format(dates.returnDate, 'MMM d, yyyy')}</p>
                </div>
              </div>
              <div className="space-y-1.5 mb-4 text-sm">
                {selectedItems.map((item) => (
                  <div key={item.itemId} className="flex justify-between">
                    <span className="text-white/70">{item.itemName} × {item.quantity}</span>
                    <span className="font-medium">${(item.quantity * item.price).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-white/10">
                <span className="font-semibold">Total</span>
                <span className="text-2xl font-bold text-violet-300">
                  ${selectedItems.reduce((sum, item) => sum + item.quantity * item.price, 0).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Customer form */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
              <div className="mb-6">
                <h2 className="heading text-xl font-bold text-slate-900">Your Information</h2>
                <p className="text-slate-500 text-sm mt-1">We'll use this to confirm your booking</p>
              </div>
              <Form {...customerForm}>
                <form onSubmit={customerForm.handleSubmit(handleCustomerSubmit)} className="space-y-4">
                  <FormField
                    control={customerForm.control}
                    name="customerName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-700 font-medium">Full Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="John Doe"
                            className="h-11 rounded-xl border-slate-200 focus:border-violet-400"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid md:grid-cols-2 gap-4">
                    <FormField
                      control={customerForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-700 font-medium">Phone Number</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="(555) 123-4567"
                              className="h-11 rounded-xl border-slate-200 focus:border-violet-400"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={customerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-700 font-medium">Email</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="john@example.com"
                              className="h-11 rounded-xl border-slate-200 focus:border-violet-400"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={customerForm.control}
                    name="eventAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-700 font-medium">Event Address</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="123 Main St, City, State ZIP"
                            className="h-11 rounded-xl border-slate-200 focus:border-violet-400"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={customerForm.control}
                    name="eventType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-700 font-medium">Event Type</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Wedding, Birthday, Corporate Event..."
                            className="h-11 rounded-xl border-slate-200 focus:border-violet-400"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={customerForm.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-700 font-medium">Notes <span className="text-slate-400 font-normal">(Optional)</span></FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Any special requests or information we should know..."
                            className="rounded-xl border-slate-200 focus:border-violet-400 resize-none"
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-3 pt-2">
                    <Button
                      type="button"
                      onClick={() => setStep('items')}
                      variant="outline"
                      className="h-11 rounded-xl border-slate-200"
                    >
                      Back
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 h-11 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white border-0 shadow-md font-semibold rounded-xl"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>Submit Booking Request</>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
