# Multi-Tenant Rental Inventory and Booking SaaS

## Goal

Build a full-stack SaaS web application for rental businesses. The first customer is a family-owned rental company, but the system should support multiple rental businesses in the future.

Each business should have its own inventory, bookings, customers, settings, and admin users.

---

## Tech Stack

Use:

* Next.js 15 App Router
* TypeScript
* Tailwind CSS
* shadcn/ui
* Supabase
* PostgreSQL
* Supabase Auth
* Vercel
* Resend for email notifications

---

## Core SaaS Requirement

The app must be multi-tenant.

Every major database table should include:

* business_id

Each logged-in admin should only access data belonging to their business.

Customers booking from one business should never see inventory from another business.

---

## Main Entities

### businesses

Fields:

* id
* name
* slug
* email
* phone
* address
* logo_url
* created_at

The slug should be used in customer-facing URLs.

Example:

/business/cleveland-party-rentals

---

### profiles

Fields:

* id
* business_id
* email
* full_name
* role
* created_at

Roles:

* owner
* admin
* staff

---

### items

Fields:

* id
* business_id
* name
* category
* description
* image_url
* price
* total_quantity
* active
* created_at

---

### bookings

Fields:

* id
* business_id
* customer_name
* phone
* email
* event_address
* event_type
* event_date
* return_date
* notes
* admin_notes
* status
* estimated_total
* created_at

Statuses:

* pending
* confirmed
* completed
* cancelled

---

### booking_items

Fields:

* id
* booking_id
* item_id
* quantity
* item_price

---

## Customer Website

Each business should have a public booking page.

Example:

/business/[slug]

Customer can:

1. View rental items
2. Select event date
3. Select return date
4. Choose item quantities
5. Enter contact information
6. Submit booking request

Required customer fields:

* Full name
* Phone number
* Email address
* Event address
* Event type
* Notes

After submission:

* Booking status should be pending
* Customer receives confirmation email
* Business owner/admin receives notification email

---

## Inventory Availability Logic

Inventory must be date-aware and business-specific.

Availability formula:

Total inventory quantity minus quantity already reserved in confirmed bookings that overlap the selected date range.

Only confirmed bookings should reduce availability.

Pending bookings should not reserve inventory unless later changed to confirmed.

The system must prevent confirming a booking if inventory is no longer available.

---

## Admin Dashboard

Admin route:

/dashboard

Admins should only see their business data.

Dashboard pages:

1. Overview
2. Bookings
3. Booking Details
4. Inventory
5. Calendar
6. Business Settings

---

## Dashboard Overview

Show cards for:

* Pending bookings
* Confirmed bookings
* Upcoming events
* Total inventory items

Also show recent bookings.

---

## Booking Management

Display bookings in a table.

Columns:

* Customer name
* Phone
* Event date
* Return date
* Status
* Estimated total
* Actions

Actions:

* View details
* Edit booking
* Change status
* Delete booking

When status changes:

* Update booking
* Recheck inventory if changing to confirmed
* Send customer email notification

---

## Booking Details

Display:

Customer info:

* Name
* Phone
* Email
* Address

Event info:

* Event date
* Return date
* Event type
* Notes

Rental items:

* Item name
* Quantity
* Price
* Line total

Admin controls:

* Status dropdown
* Admin notes
* Save changes

---

## Inventory Management

Admins can:

* Add item
* Edit item
* Delete item
* Mark item active/inactive

Item fields:

* Name
* Category
* Description
* Image
* Price
* Total quantity

---

## Calendar View

Create a monthly calendar.

Each date should show bookings for that business.

Clicking a date should show:

* Customer name
* Items booked
* Status
* Phone number
* Event address

---

## Business Settings

Allow owner/admin to edit:

* Business name
* Logo
* Phone
* Email
* Address
* Public booking page slug

---

## Email Notifications

Use Resend.

Emails needed:

1. Customer booking request received
2. Admin new booking notification
3. Customer booking confirmed
4. Customer booking cancelled
5. Customer booking completed, optional

Email should include:

* Business name
* Customer name
* Event date
* Return date
* Items requested
* Estimated total
* Business contact info

---

## Security Requirements

Use Supabase Row Level Security.

Rules:

* Public users can read active items for a specific business.
* Public users can create booking requests.
* Admin users can only access their own business data.
* Admin users cannot access other businesses.
* Only authenticated users can access dashboard.
* Only owner/admin can edit business settings.

---

## UI Requirements

Use shadcn/ui.

The design should be:

* Clean
* Simple
* Mobile responsive
* Easy for older/non-technical users
* Not overly complex

Include:

* Loading states
* Empty states
* Toast notifications
* Form validation
* Error handling

---

## Build Order

Build in this order:

1. Supabase schema
2. Authentication
3. Business/profile setup
4. Public business booking page
5. Inventory availability service
6. Booking submission
7. Email notifications
8. Admin dashboard
9. Booking management
10. Inventory management
11. Calendar view
12. Business settings
13. Final polish

---

## Deliverables

Generate complete production-ready code for:

* Database migrations
* Supabase RLS policies
* TypeScript types
* Server actions
* API routes
* Frontend pages
* Admin dashboard
* Public booking flow
* Email notification service
* Inventory availability logic
* Deployment instructions