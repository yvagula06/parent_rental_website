'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { format } from 'date-fns'
import { Calendar as CalendarIcon, Loader2, Minus, Plus, ShoppingCart } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import type { Item } from '@/lib/types/database.types'

interface ItemAvailability {
  item: Item
  available: number
  booked: number
}

interface BusinessBookingFormProps {
  businessId: string
  businessName: string
  businessEmail: string
  businessPhone: string
  items: Item[]
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

export default function BusinessBookingForm({
  businessId,
  businessName,
  businessEmail,
  businessPhone,
  items,
}: BusinessBookingFormProps) {
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
  })

  const customerForm = useForm<z.infer<typeof customerSchema>>({
    resolver: zodResolver(customerSchema),
  })

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
        `/api/availability?eventDate=${eventDate}&returnDate=${returnDate}&businessId=${businessId}`
      )
      if (!response.ok) throw new Error('Failed to fetch availability')
      const data = await response.json()

      // Only show items that belong to this business
      const filteredItems = data.filter((a: ItemAvailability) =>
        items.some((i) => i.id === a.item.id)
      )
      setAvailability(filteredItems)

      const newQuantities: Record<string, number> = {}
      selectedItems.forEach((selectedItem) => {
        const itemAvail = filteredItems.find((a: ItemAvailability) => a.item.id === selectedItem.itemId)
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

  const handleDatesSubmit = (values: z.infer<typeof dateSchema>) => {
    setDates(values)
    setStep('items')
  }

  const handleQuantityChange = (itemId: string, delta: number) => {
    const itemAvail = availability.find((a) => a.item.id === itemId)
    if (!itemAvail) return
    const currentQty = itemQuantities[itemId] || 0
    const newQty = Math.max(0, Math.min(itemAvail.available, currentQty + delta))
    setItemQuantities((prev) => ({ ...prev, [itemId]: newQty }))
  }

  const handleItemsNext = () => {
    const selected = Object.entries(itemQuantities)
      .filter(([_, qty]) => qty > 0)
      .map(([itemId, quantity]) => {
        const itemAvail = availability.find((a) => a.item.id === itemId)
        if (!itemAvail) return null
        return { itemId, itemName: itemAvail.item.name, quantity, price: Number(itemAvail.item.price) }
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: values.customerName,
          phone: values.phone,
          email: values.email,
          event_address: values.eventAddress,
          event_type: values.eventType,
          event_date: format(dates.eventDate, 'yyyy-MM-dd'),
          return_date: format(dates.returnDate, 'yyyy-MM-dd'),
          notes: values.notes || '',
          business_id: businessId,
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
    <div>
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
                    : ['items', 'customer'].includes(step) && index < (['dates', 'items', 'customer'] as const).indexOf(step)
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
                    ['items', 'customer'].includes(step) && index < (['dates', 'items', 'customer'] as const).indexOf(step)
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

      {/* Step 1: Date Selection */}
      {step === 'dates' && (
        <Card>
          <CardHeader>
            <CardTitle>Select Event Dates</CardTitle>
            <CardDescription>
              Choose when you need the rentals and when you'll return them
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...dateForm}>
              <form onSubmit={dateForm.handleSubmit(handleDatesSubmit)} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <FormField
                    control={dateForm.control}
                    name="eventDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Event Date</FormLabel>
                        <Popover>
                          <PopoverTrigger>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  'w-full pl-3 text-left font-normal',
                                  !field.value && 'text-muted-foreground'
                                )}
                              >
                                {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) => date < new Date() || date < new Date('1900-01-01')}
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
                          <PopoverTrigger>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  'w-full pl-3 text-left font-normal',
                                  !field.value && 'text-muted-foreground'
                                )}
                              >
                                {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) => date < new Date() || date < new Date('1900-01-01')}
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <Button type="submit" className="w-full">
                  Next: Choose Items
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Item Selection */}
      {step === 'items' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Choose Items</CardTitle>
                <CardDescription>
                  Select the items and quantities you need
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStep('dates')}
              >
                Change Dates
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingAvailability ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : (
              <div className="space-y-4">
                {availability.length === 0 && (
                  <p className="text-center text-gray-500 py-8">
                    No items available for the selected dates.
                  </p>
                )}
                {availability.map((itemAvail) => {
                  const quantity = itemQuantities[itemAvail.item.id] || 0
                  return (
                    <div
                      key={itemAvail.item.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{itemAvail.item.name}</h3>
                          {itemAvail.available === 0 && (
                            <Badge variant="destructive" className="text-xs">
                              Unavailable
                            </Badge>
                          )}
                          {itemAvail.available > 0 && itemAvail.available <= 5 && (
                            <Badge variant="secondary" className="text-xs">
                              Only {itemAvail.available} left
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{itemAvail.item.category}</p>
                        <p className="text-sm text-gray-500">
                          ${Number(itemAvail.item.price).toFixed(2)} each · {itemAvail.available} available
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        {itemAvail.available > 0 && (
                          <>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleQuantityChange(itemAvail.item.id, -1)}
                              disabled={quantity === 0}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-8 text-center font-semibold">{quantity}</span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleQuantityChange(itemAvail.item.id, 1)}
                              disabled={quantity >= itemAvail.available}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  )
                })}

                {availability.some((a) => (itemQuantities[a.item.id] || 0) > 0) && (
                  <>
                    <Separator />
                    <div className="flex items-center justify-between py-2">
                      <span className="font-semibold text-lg">Estimated Total</span>
                      <span className="text-2xl font-bold text-blue-600">
                        ${calculateTotal().toFixed(2)}
                      </span>
                    </div>
                  </>
                )}

                <Button
                  onClick={handleItemsNext}
                  className="w-full"
                  disabled={!Object.values(itemQuantities).some((q) => q > 0)}
                >
                  Next: Your Information
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 3: Customer Information */}
      {step === 'customer' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Your Information</CardTitle>
                <CardDescription>
                  Please provide your contact details and event information
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => setStep('items')}>
                Change Items
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Order Summary */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold mb-2">Order Summary</h3>
              <div className="space-y-2">
                {selectedItems.map((item) => (
                  <div key={item.itemId} className="flex justify-between text-sm">
                    <span>
                      {item.itemName} × {item.quantity}
                    </span>
                    <span>${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Estimated Total</span>
                  <span className="text-blue-600">
                    ${calculateTotal().toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <Form {...customerForm}>
              <form onSubmit={customerForm.handleSubmit(handleCustomerSubmit)} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <FormField
                    control={customerForm.control}
                    name="customerName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={customerForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number *</FormLabel>
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
                        <FormLabel>Email Address *</FormLabel>
                        <FormControl>
                          <Input placeholder="john@example.com" type="email" {...field} />
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
                        <FormLabel>Event Type *</FormLabel>
                        <FormControl>
                          <Input placeholder="Wedding, Party, Corporate..." {...field} />
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
                      <FormLabel>Event Address *</FormLabel>
                      <FormControl>
                        <Input placeholder="123 Main Street, Anytown, USA" {...field} />
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
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Any special requests or additional information..."
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Submit Booking Request
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}