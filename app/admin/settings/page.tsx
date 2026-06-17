'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { ArrowLeft, Loader2, Save } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

const businessSchema = z.object({
  name: z.string().min(2, 'Business name must be at least 2 characters'),
  slug: z.string().min(2, 'Slug must be at least 2 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  email: z.string().email('Please enter a valid email'),
  phone: z.string().optional(),
  address: z.string().optional(),
  logo_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
})

type BusinessFormValues = z.infer<typeof businessSchema>

export default function BusinessSettingsPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [businessId, setBusinessId] = useState<string | null>(null)

  const form = useForm<BusinessFormValues>({
    resolver: zodResolver(businessSchema),
    defaultValues: {
      name: '',
      slug: '',
      email: '',
      phone: '',
      address: '',
      logo_url: '',
    },
  })

  useEffect(() => {
    fetchBusiness()
  }, [])

  const fetchBusiness = async () => {
    try {
      const response = await fetch('/api/business')
      if (!response.ok) {
        throw new Error('Failed to fetch business')
      }
      const data = await response.json()
      setBusinessId(data.id)
      form.reset({
        name: data.name || '',
        slug: data.slug || '',
        email: data.email || '',
        phone: data.phone || '',
        address: data.address || '',
        logo_url: data.logo_url || '',
      })
    } catch (error) {
      console.error('Error fetching business:', error)
      toast.error('Failed to load business settings')
    } finally {
      setIsLoading(false)
    }
  }

  const onSubmit = async (values: BusinessFormValues) => {
    if (!businessId) return
    setIsSaving(true)
    try {
      const response = await fetch(`/api/business?id=${businessId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update business settings')
      }

      toast.success('Business settings updated successfully')
      router.refresh()
    } catch (error) {
      console.error('Error updating business:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update business settings')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Business Settings</h2>
        <p className="text-gray-600 mt-1">Manage your business information and public profile</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Business Information</CardTitle>
          <CardDescription>
            This information appears on your public booking page and in email notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Premium Event Rentals" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL Slug *</FormLabel>
                      <FormControl>
                        <Input placeholder="premium-event-rentals" {...field} />
                      </FormControl>
                      <FormDescription>
                        Your public booking page URL: /business/{field.value || 'slug'}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address *</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="rentals@example.com" {...field} />
                      </FormControl>
                      <FormDescription>
                        Used for admin email notifications
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
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
              </div>

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="123 Main Street, Anytown, USA"
                        rows={2}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="logo_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Logo URL</FormLabel>
                    <FormControl>
                      <Input
                        type="url"
                        placeholder="https://example.com/logo.png"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      URL to your business logo image
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-4">
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}