/**
 * Email notification service using Resend
 * 
 * To use this service:
 * 1. Sign up at https://resend.com
 * 2. Add your API key to .env.local: RESEND_API_KEY=re_...
 * 3. Add a verified domain or use the test sandbox
 * 4. Set the FROM_EMAIL env var (defaults to onbording@resend.dev for testing)
 */

import type { Business, Booking, BookingItem, Item } from '@/lib/types/database.types'

// Email configuration
const RESEND_API_KEY = process.env.RESEND_API_KEY || ''
const FROM_EMAIL = process.env.FROM_EMAIL || 'onboarding@resend.dev'
const FROM_NAME = process.env.FROM_NAME || 'Rental Booking System'

interface EmailPayload {
  from: string
  to: string | string[]
  subject: string
  html: string
}

interface BookingNotificationData {
  business: Pick<Business, 'name' | 'email' | 'phone' | 'address'>
  booking: Booking
  items: (Pick<BookingItem, 'quantity' | 'item_price'> & { item: Pick<Item, 'name'> })[]
}

/**
 * Send an email using the Resend API
 */
async function sendEmail(payload: EmailPayload): Promise<{ success: boolean; error?: string }> {
  if (!RESEND_API_KEY) {
    console.warn('[Email Service] RESEND_API_KEY not configured. Skipping email send.')
    console.warn('[Email Service] Would have sent:', payload.subject)
    return { success: false, error: 'RESEND_API_KEY not configured' }
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('[Email Service] Resend API error:', errorData)
      return { success: false, error: errorData.message || 'Failed to send email' }
    }

    return { success: true }
  } catch (error) {
    console.error('[Email Service] Error sending email:', error)
    return { success: false, error: 'Failed to send email' }
  }
}

/**
 * Format a currency amount
 */
function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`
}

/**
 * Format a date nicely
 */
function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } catch {
    return dateStr
  }
}

/**
 * Build the HTML email template for booking notifications
 */
function buildBookingEmailTemplate(
  data: BookingNotificationData,
  templateType: 'customer-request' | 'customer-confirmed' | 'customer-cancelled' | 'customer-completed' | 'admin-notification'
): string {
  const { business, booking, items } = data
  const itemsHtml = items
    .map(
      (i) =>
        `<tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${i.item.name}</td>
          <td style="padding: 8px 0; border-bottom: 1px solid #eee; text-align: center;">${i.quantity}</td>
          <td style="padding: 8px 0; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(Number(i.item_price))}</td>
          <td style="padding: 8px 0; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(Number(i.item_price) * i.quantity)}</td>
        </tr>`
    )
    .join('')

  const titleMap: Record<string, string> = {
    'customer-request': 'Booking Request Received',
    'customer-confirmed': 'Booking Confirmed!',
    'customer-cancelled': 'Booking Cancelled',
    'customer-completed': 'Booking Completed',
    'admin-notification': 'New Booking Request',
  }

  const greetingMap: Record<string, string> = {
    'customer-request': `Dear ${booking.customer_name},`,
    'customer-confirmed': `Dear ${booking.customer_name},`,
    'customer-cancelled': `Dear ${booking.customer_name},`,
    'customer-completed': `Dear ${booking.customer_name},`,
    'admin-notification': `Hi ${business.name} Team,`,
  }

  const bodyMap: Record<string, string> = {
    'customer-request':
      `Thank you for your booking request! We have received it and will review it shortly. Here's a summary of your request:`,
    'customer-confirmed':
      `Great news! Your booking has been confirmed. Here are the details:`,
    'customer-cancelled':
      `Your booking has been cancelled. If you have any questions, please contact us.`,
    'customer-completed':
      `Your rental period has ended. Thank you for choosing ${business.name}! We hope everything went well.`,
    'admin-notification':
      `A new booking request has been submitted by ${booking.customer_name}. Please review it in the admin dashboard.`,
  }

  const title = titleMap[templateType]
  const greeting = greetingMap[templateType]
  const body = bodyMap[templateType]

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, Helvetica, sans-serif; margin: 0; padding: 0; background-color: #f9f9f9; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #2563eb; color: white; padding: 24px; text-align: center; border-radius: 8px 8px 0 0; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { background-color: white; padding: 24px; border-radius: 0 0 8px 8px; }
    .section { margin-bottom: 24px; }
    .section h2 { font-size: 16px; color: #374151; border-bottom: 2px solid #2563eb; padding-bottom: 8px; margin-bottom: 12px; }
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; padding: 8px 0; border-bottom: 2px solid #e5e7eb; color: #6b7280; font-size: 12px; text-transform: uppercase; }
    .total-row { font-weight: bold; font-size: 16px; }
    .footer { margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af; }
    .business-info { margin-top: 16px; padding: 12px; background-color: #f3f4f6; border-radius: 6px; font-size: 13px; color: #6b7280; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${title}</h1>
    </div>
    <div class="content">
      <p>${greeting}</p>
      <p>${body}</p>

      <div class="section">
        <h2>Event Details</h2>
        <table>
          <tr><td style="padding: 4px 0; color: #6b7280;">Event Type</td><td style="padding: 4px 0;">${booking.event_type}</td></tr>
          <tr><td style="padding: 4px 0; color: #6b7280;">Event Date</td><td style="padding: 4px 0;">${formatDate(booking.event_date)}</td></tr>
          <tr><td style="padding: 4px 0; color: #6b7280;">Return Date</td><td style="padding: 4px 0;">${formatDate(booking.return_date)}</td></tr>
          <tr><td style="padding: 4px 0; color: #6b7280;">Event Address</td><td style="padding: 4px 0;">${booking.event_address}</td></tr>
        </table>
      </div>

      <div class="section">
        <h2>Rental Items</h2>
        <table>
          <thead>
            <tr><th>Item</th><th style="text-align: center;">Qty</th><th style="text-align: right;">Price</th><th style="text-align: right;">Total</th></tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="3" style="padding: 12px 0 0 0; text-align: right; font-weight: bold;">Estimated Total:</td>
              <td style="padding: 12px 0 0 0; text-align: right; font-weight: bold; font-size: 16px; color: #2563eb;">
                ${formatCurrency(Number(booking.estimated_total || booking.total_amount))}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      ${booking.notes ? `<div class="section"><h2>Notes</h2><p style="color: #6b7280;">${booking.notes}</p></div>` : ''}

      <div class="business-info">
        <strong>${business.name}</strong><br>
        ${business.phone ? `Phone: ${business.phone}<br>` : ''}
        ${business.email ? `Email: ${business.email}<br>` : ''}
        ${business.address ? business.address : ''}
      </div>

      <div class="footer">
        <p>This email was sent from ${business.name}. If you have any questions, please contact us.</p>
      </div>
    </div>
  </div>
</body>
</html>`
}

/**
 * Send a booking request confirmation to the customer
 */
export async function sendCustomerBookingRequest(
  data: BookingNotificationData
): Promise<{ success: boolean; error?: string }> {
  return sendEmail({
    from: `${FROM_NAME} <${FROM_EMAIL}>`,
    to: data.booking.email,
    subject: `Booking Request Received - ${data.business.name}`,
    html: buildBookingEmailTemplate(data, 'customer-request'),
  })
}

/**
 * Send a booking confirmed notification to the customer
 */
export async function sendCustomerBookingConfirmed(
  data: BookingNotificationData
): Promise<{ success: boolean; error?: string }> {
  return sendEmail({
    from: `${FROM_NAME} <${FROM_EMAIL}>`,
    to: data.booking.email,
    subject: `Booking Confirmed! - ${data.business.name}`,
    html: buildBookingEmailTemplate(data, 'customer-confirmed'),
  })
}

/**
 * Send a booking cancelled notification to the customer
 */
export async function sendCustomerBookingCancelled(
  data: BookingNotificationData
): Promise<{ success: boolean; error?: string }> {
  return sendEmail({
    from: `${FROM_NAME} <${FROM_EMAIL}>`,
    to: data.booking.email,
    subject: `Booking Cancelled - ${data.business.name}`,
    html: buildBookingEmailTemplate(data, 'customer-cancelled'),
  })
}

/**
 * Send a booking completed notification to the customer
 */
export async function sendCustomerBookingCompleted(
  data: BookingNotificationData
): Promise<{ success: boolean; error?: string }> {
  return sendEmail({
    from: `${FROM_NAME} <${FROM_EMAIL}>`,
    to: data.booking.email,
    subject: `Booking Completed - ${data.business.name}`,
    html: buildBookingEmailTemplate(data, 'customer-completed'),
  })
}

/**
 * Send a new booking notification to the business admin
 */
export async function sendAdminNewBookingNotification(
  data: BookingNotificationData
): Promise<{ success: boolean; error?: string }> {
  const adminEmail = data.business.email
  if (!adminEmail) {
    console.warn('[Email Service] No business email configured for admin notification.')
    return { success: false, error: 'No business email configured' }
  }

  return sendEmail({
    from: `${FROM_NAME} <${FROM_EMAIL}>`,
    to: adminEmail,
    subject: `New Booking Request from ${data.booking.customer_name}`,
    html: buildBookingEmailTemplate(data, 'admin-notification'),
  })
}