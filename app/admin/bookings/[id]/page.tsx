'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { ArrowLeft, Loader2, Mail, Phone, MapPin, Calendar, Package } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface BookingWithItems {
  id: string
  customer_name: string
  phone: string
  email: string
  event_address: string
  event_type: string
  event_date: string
  return_date: string
  notes: string | null
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  admin_notes: string | null
  total_amount: number
  created_at: string
  updated_at: string
  booking_items: {
    id: string
    quantity: number
    item_price: number
    items: {
      id: string
      name: string
      category: string
      description: string | null
    }
  }[]
}

export default function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [booking, setBooking] = useState<BookingWithItems | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [status, setStatus] = useState<string>('')
  const [adminNotes, setAdminNotes] = useState<string>('')
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    fetchBooking()
  }, [id])

  const fetchBooking = async () => {
    try {
      const response = await fetch(`/api/bookings?id=${id}`)
      if (!response.ok) {
        throw new Error('Failed to fetch booking')
      }
      const data = await response.json()
      setBooking(data)
      setStatus(data.status)
      setAdminNotes(data.admin_notes || '')
    } catch (error) {
      console.error('Error fetching booking:', error)
      toast.error('Failed to load booking details')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!booking) return

    setIsSaving(true)
    try {
      const response = await fetch(`/api/bookings/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
          admin_notes: adminNotes,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update booking')
      }

      toast.success('Booking updated successfully')
      fetchBooking()
    } catch (error) {
      console.error('Error updating booking:', error)
      toast.error('Failed to update booking')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!booking) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/bookings/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete booking')
      }

      toast.success('Booking deleted successfully')
      router.push('/admin/bookings')
    } catch (error) {
      console.error('Error deleting booking:', error)
      toast.error('Failed to delete booking')
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'secondary'
      case 'confirmed':
        return 'default'
      case 'completed':
        return 'outline'
      case 'cancelled':
        return 'destructive'
      default:
        return 'secondary'
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Link href="/admin/bookings">
            <Button variant="ghost">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Bookings
            </Button>
          </Link>
        </div>
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-gray-500">Booking not found</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/bookings">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h2 className="text-3xl font-bold">Booking Details</h2>
            <p className="text-sm text-gray-600 mt-1">ID: {booking.id}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={getStatusColor(booking.status)} className="text-sm">
            {booking.status}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Customer Information */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-gray-600 mb-1">Name</div>
              <div className="font-medium">{booking.customer_name}</div>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-gray-400" />
              <a href={`mailto:${booking.email}`} className="text-blue-600 hover:underline">
                {booking.email}
              </a>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-gray-400" />
              <a href={`tel:${booking.phone}`} className="text-blue-600 hover:underline">
                {booking.phone}
              </a>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-gray-400 mt-1" />
              <div>
                <div className="text-sm text-gray-600">Event Address</div>
                <div className="font-medium">{booking.event_address}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Event Details */}
        <Card>
          <CardHeader>
            <CardTitle>Event Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-gray-600 mb-1">Event Type</div>
              <div className="font-medium">{booking.event_type}</div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <div>
                <div className="text-sm text-gray-600">Event Date</div>
                <div className="font-medium">
                  {format(new Date(booking.event_date), 'MMMM d, yyyy')}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <div>
                <div className="text-sm text-gray-600">Return Date</div>
                <div className="font-medium">
                  {format(new Date(booking.return_date), 'MMMM d, yyyy')}
                </div>
              </div>
            </div>
            {booking.notes && (
              <div>
                <div className="text-sm text-gray-600 mb-1">Customer Notes</div>
                <div className="text-sm bg-gray-50 p-3 rounded-md">{booking.notes}</div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Booking Items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Rental Items
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {booking.booking_items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex-1">
                  <div className="font-medium">{item.items.name}</div>
                  <div className="text-sm text-gray-600">{item.items.category}</div>
                  {item.items.description && (
                    <div className="text-xs text-gray-500 mt-1">{item.items.description}</div>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">
                    Quantity: <span className="font-medium">{item.quantity}</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    @ ${Number(item.item_price).toFixed(2)} each
                  </div>
                  <div className="font-semibold text-blue-600 mt-1">
                    ${(item.quantity * Number(item.item_price)).toFixed(2)}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Separator className="my-4" />
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold">Total Amount</span>
            <span className="text-2xl font-bold text-blue-600">
              ${Number(booking.total_amount).toFixed(2)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Admin Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Admin Actions</CardTitle>
          <CardDescription>Update booking status and add internal notes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="status">Booking Status</Label>
            <Select value={status} onValueChange={(value) => value && setStatus(value)}>
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="adminNotes">Admin Notes (Internal)</Label>
            <Textarea
              id="adminNotes"
              placeholder="Add notes visible only to admins..."
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              rows={4}
            />
          </div>

          <div className="flex gap-3">
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
            <Button
              variant="destructive"
              onClick={() => setShowDeleteDialog(true)}
            >
              Delete Booking
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Timestamps */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <span className="font-medium">Created:</span>{' '}
              {format(new Date(booking.created_at), 'PPp')}
            </div>
            <div>
              <span className="font-medium">Last Updated:</span>{' '}
              {format(new Date(booking.updated_at), 'PPp')}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Booking</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this booking? This action cannot be undone.
              All associated booking items will also be deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Booking'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
