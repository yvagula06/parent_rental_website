'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { format } from 'date-fns'
import { Calendar as CalendarIcon, Loader2, Minus, Plus, ShoppingCart } from 'lucide-react'
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
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="container mx-auto max-w-4xl">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {(['dates', 'items', 'customer'] as const).map((s, index) => (
              <div key={s} className="flex-1 flex items-center">
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center font-semibold',
                    step === s
                      ? 'bg-blue-600 text-white'
                      : (step === 'items' || step === 'customer') && index < (['dates', 'items', 'customer'] as const).indexOf(step)
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-300 text-gray-600'
                  )}
                >
                  {index + 1}
                </div>
                {index < 2 && (
                  <div
                    className={cn(
                      'h-1 flex-1 mx-2',
                      (step === 'items' || step === 'customer') && index < (['dates', 'items', 'customer'] as const).indexOf(step)
                        ? 'bg-green-500'
                        : 'bg-gray-300'
                    )}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-sm">
            <span>Select Dates</span>
            <span>Choose Items</span>
            <span>Your Info</span>
          </div>
        </div>

        {/* Step 1: Dates */}
        {step === 'dates' && (
          <Card>
            <CardHeader>
              <CardTitle>Select Event Dates</CardTitle>
              <CardDescription>
                Choose your event date and when you'll return the items
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...dateForm}>
                <form onSubmit={dateForm.handleSubmit(handleDatesSubmit)} className="space-y-6">
                  <FormField
                    control={dateForm.control}
                    name="eventDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Event Date</FormLabel>
                        <Popover>
                          <PopoverTrigger className={cn(
                            buttonVariants({ variant: 'outline' }),
                            'w-full pl-3 text-left font-normal justify-start gap-2 h-11 rounded-xl border-slate-200 bg-white/80 hover:border-blue-300 transition-all',
                            !field.value && 'text-muted-foreground'
                          )}>
                            <CalendarIcon className="h-4 w-4 shrink-0" />
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
                        <FormLabel>Return Date</FormLabel>
                        <Popover>
                          <PopoverTrigger className={cn(
                            buttonVariants({ variant: 'outline' }),
                            'w-full pl-3 text-left font-normal justify-start gap-2 h-11 rounded-xl border-slate-200 bg-white/80 hover:border-blue-300 transition-all',
                            !field.value && 'text-muted-foreground'
                          )}>
                            <CalendarIcon className="h-4 w-4 shrink-0" />
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

                  <Button type="submit" className="w-full">
                    Next: Select Items
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Items */}
        {step === 'items' && dates && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Select Rental Items</CardTitle>
                <CardDescription>
                  Event: {format(dates.eventDate, 'PPP')} - {format(dates.returnDate, 'PPP')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingAvailability ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-20 w-full" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Group items by category */}
                    {Object.entries(
                      availability.reduce((acc, itemAvail) => {
                        const category = itemAvail.item.category
                        if (!acc[category]) acc[category] = []
                        acc[category].push(itemAvail)
                        return acc
                      }, {} as Record<string, ItemAvailability[]>)
                    ).map(([category, items]) => (
                      <div key={category}>
                        <h3 className="text-lg font-semibold mb-3 text-gray-900">
                          {category}
                        </h3>
                        <div className="space-y-3">
                          {items.map((itemAvail) => {
                            const qty = itemQuantities[itemAvail.item.id] || 0
                            const subtotal = qty * Number(itemAvail.item.price)

                            return (
                              <div
                                key={itemAvail.item.id}
                                className={cn(
                                  'border rounded-lg p-4 transition-all',
                                  qty > 0
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-gray-200 bg-white hover:border-gray-300'
                                )}
                              >
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <h4 className="font-semibold text-gray-900">
                                        {itemAvail.item.name}
                                      </h4>
                                      {itemAvail.available === 0 ? (
                                        <Badge variant="destructive">Unavailable</Badge>
                                      ) : itemAvail.available < 5 ? (
                                        <Badge variant="secondary">
                                          Only {itemAvail.available} left
                                        </Badge>
                                      ) : null}
                                    </div>
                                    {itemAvail.item.description && (
                                      <p className="text-sm text-gray-600 mb-2">
                                        {itemAvail.item.description}
                                      </p>
                                    )}
                                    <div className="flex items-center gap-4 text-sm">
                                      <span className="font-semibold text-blue-600">
                                        ${Number(itemAvail.item.price).toFixed(2)} each
                                      </span>
                                      <span className="text-gray-500">
                                        {itemAvail.available} available
                                      </span>
                                      {itemAvail.booked > 0 && (
                                        <span className="text-gray-400">
                                          ({itemAvail.booked} booked)
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    {itemAvail.available > 0 ? (
                                      <>
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="icon"
                                          onClick={() => handleQuantityChange(itemAvail.item.id, -1)}
                                          disabled={qty === 0}
                                        >
                                          <Minus className="h-4 w-4" />
                                        </Button>
                                        <div className="w-16 text-center">
                                          <div className="text-lg font-semibold">{qty}</div>
                                          {qty > 0 && (
                                            <div className="text-xs text-gray-500">
                                              ${subtotal.toFixed(2)}
                                            </div>
                                          )}
                                        </div>
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="icon"
                                          onClick={() => handleQuantityChange(itemAvail.item.id, 1)}
                                          disabled={qty >= itemAvail.available}
                                        >
                                          <Plus className="h-4 w-4" />
                                        </Button>
                                      </>
                                    ) : (
                                      <div className="text-sm text-gray-500 px-4">
                                        Not available
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    ))}

                    {/* Summary */}
                    {Object.keys(itemQuantities).some((id) => itemQuantities[id] > 0) && (
                      <>
                        <Separator />
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="flex items-center gap-2 text-sm font-medium text-gray-700">
                              <ShoppingCart className="h-4 w-4" />
                              Selected Items
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setItemQuantities({})}
                            >
                              Clear All
                            </Button>
                          </div>
                          <div className="space-y-1 mb-3">
                            {Object.entries(itemQuantities)
                              .filter(([_, qty]) => qty > 0)
                              .map(([itemId, qty]) => {
                                const itemAvail = availability.find((a) => a.item.id === itemId)
                                if (!itemAvail) return null
                                const subtotal = qty * Number(itemAvail.item.price)
                                return (
                                  <div
                                    key={itemId}
                                    className="flex justify-between text-sm"
                                  >
                                    <span className="text-gray-700">
                                      {itemAvail.item.name} × {qty}
                                    </span>
                                    <span className="font-medium">
                                      ${subtotal.toFixed(2)}
                                    </span>
                                  </div>
                                )
                              })}
                          </div>
                          <Separator className="my-2" />
                          <div className="flex justify-between items-center">
                            <span className="text-lg font-semibold text-gray-900">
                              Total
                            </span>
                            <span className="text-2xl font-bold text-blue-600">
                              ${calculateTotal().toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </>
                    )}

                    {availability.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        No items available for the selected dates.
                        <br />
                        Please try different dates.
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-4 mt-6">
                  <Button onClick={() => setStep('dates')} variant="outline">
                    Back
                  </Button>
                  <Button onClick={handleItemsNext} className="flex-1">
                    Next: Your Information
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 3: Customer Info */}
        {step === 'customer' && dates && (
          <div className="space-y-4">
            {/* Selected Items Summary */}
            <Card className="border-blue-200 bg-blue-50/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Booking Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm">
                  <span className="text-gray-600">Event Date:</span>{' '}
                  <span className="font-medium">{format(dates.eventDate, 'PPP')}</span>
                </div>
                <div className="text-sm">
                  <span className="text-gray-600">Return Date:</span>{' '}
                  <span className="font-medium">{format(dates.returnDate, 'PPP')}</span>
                </div>
                <Separator />
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2">Items:</div>
                  <div className="space-y-1">
                    {selectedItems.map((item) => (
                      <div key={item.itemId} className="flex justify-between text-sm">
                        <span className="text-gray-700">
                          {item.itemName} × {item.quantity}
                        </span>
                        <span className="font-medium">
                          ${(item.quantity * item.price).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <Separator />
                <div className="flex justify-between items-center pt-1">
                  <span className="font-semibold text-gray-900">Total Amount</span>
                  <span className="text-xl font-bold text-blue-600">
                    ${selectedItems
                      .reduce((sum, item) => sum + item.quantity * item.price, 0)
                      .toFixed(2)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Customer Information Form */}
            <Card>
              <CardHeader>
                <CardTitle>Your Information</CardTitle>
                <CardDescription>
                  We'll use this to confirm your booking
                </CardDescription>
              </CardHeader>
              <CardContent>
              <Form {...customerForm}>
                <form onSubmit={customerForm.handleSubmit(handleCustomerSubmit)} className="space-y-4">
                  <FormField
                    control={customerForm.control}
                    name="customerName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} />
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
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input placeholder="(555) 123-4567" {...field} />
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
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="john@example.com" {...field} />
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
                        <FormLabel>Event Address</FormLabel>
                        <FormControl>
                          <Input placeholder="123 Main St, City, State ZIP" {...field} />
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
                        <FormLabel>Event Type</FormLabel>
                        <FormControl>
                          <Input placeholder="Wedding, Birthday, Corporate Event, etc." {...field} />
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
                        <FormLabel>Additional Notes (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Any special requests or information we should know..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-4">
                    <Button type="button" onClick={() => setStep('items')} variant="outline">
                      Back
                    </Button>
                    <Button type="submit" disabled={isSubmitting} className="flex-1">
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        'Submit Booking Request'
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
          </div>
        )}
      </div>
    </div>
  )
}
