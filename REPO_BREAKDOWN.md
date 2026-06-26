# Repository Breakdown

Complete structural overview of the Rental Inventory & Booking Management System.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16.2.7 (App Router, Turbopack) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS v4 + tw-animate-css + shadcn/tailwind.css |
| **UI Components** | shadcn/ui (Base UI primitives) |
| **Fonts** | Inter (body) + Outfit (headings) via `next/font/google` |
| **Database** | PostgreSQL via Supabase |
| **Auth** | Supabase Auth (email/password, role-based) |
| **Forms** | React Hook Form + Zod validation |
| **Calendar** | react-day-picker |
| **Icons** | lucide-react |
| **Toasts** | Sonner |
| **Charts** | Recharts |
| **Email** | Resend (optional) |
| **Hosting** | Vercel |
| **Package Manager** | npm |

---

## Root Files

```
├── .env.local                  # Local environment variables (Supabase keys, app URL)
├── .env.local.example          # Template for .env.local
├── .env.local.vercel           # Vercel-specific env template
├── .env.example                # General env template
├── .gitignore
├── components.json             # shadcn/ui configuration
├── eslint.config.mjs           # ESLint flat config
├── middleware.ts                # Next.js middleware — delegates to Supabase session refresh
├── next.config.ts              # Next.js configuration
├── next-env.d.ts               # TypeScript declarations for Next.js
├── package.json                # Dependencies and scripts
├── package-lock.json
├── postcss.config.mjs          # PostCSS (Tailwind plugin)
├── tsconfig.json               # TypeScript config
└── tsconfig.tsbuildinfo        # Build cache
```

### `middleware.ts`
Runs on every request. Delegates to `lib/supabase/middleware.ts` which refreshes the Supabase session cookie and protects `/admin` routes (redirects unauthenticated users to `/login`).

---

## `app/` — Next.js App Router Pages

### Layout & Global

| File | Type | Purpose |
|---|---|---|
| `layout.tsx` | Root layout | Loads Inter + Outfit fonts, renders `<Toaster>`, wraps all pages |
| `globals.css` | Global styles | Tailwind imports, `@theme inline` CSS variables, animation keyframes (`fade-in`, `float`, `shimmer`, etc.), utility classes (`.heading`, `.glass-card`, `.hover-lift`, `.animate-gradient`) |
| `page.tsx` | `/` — Home page | Server component. Dark hero with animated gradient, floating orbs, CTA buttons, "Why Choose Us" features, featured items grid, contact section, footer |
| `favicon.ico` | Favicon | Browser tab icon |

### `app/login/`

| File | Purpose |
|---|---|
| `page.tsx` | Admin login page. Client component. Gradient background with animated blurred circles, frosted glass card, email/password form with Zod validation, show/hide password toggle |

### `app/admin/` — Admin Dashboard

All admin pages are **server components** that check auth via `supabase.auth.getUser()` and redirect to `/login` if not authenticated. Only users with role `owner`, `admin`, or `staff` can access.

| File | Purpose |
|---|---|
| `layout.tsx` | Admin shell. Checks auth + role, fetches business name. Sticky header with floating Package icon, sidebar navigation (Dashboard, Inventory, Bookings, Calendar, Settings), mobile bottom nav bar |
| `page.tsx` | Dashboard overview. Stat cards (pending bookings, confirmed, total revenue, cancelled, total items) with gradient icons and hover lift. Recent bookings list. Quick actions. "At a Glance" gradient card |
| `bookings/page.tsx` | Bookings list. Table with customer name, email, phone, event dates, status badges (color-coded), total amount. Filters by search and status. OR filter for public bookings |
| `bookings/[id]/page.tsx` | Single booking detail. Client component. Full booking info, items list, status update dropdown, admin notes textarea, confirm/cancel/complete actions with confirmation dialog |
| `inventory/page.tsx` | Inventory list. Table with item name, category pills, price, total quantity, active status. Search by name |
| `inventory/new/page.tsx` | Create new item form. Name, category, description, price, quantity fields |
| `inventory/[id]/page.tsx` | Edit existing item. Same form as create, pre-filled |
| `calendar/page.tsx` | Calendar view (placeholder) |
| `settings/page.tsx` | Settings page (placeholder) |

### `app/booking/` — Public Booking Flow

| File | Purpose |
|---|---|
| `page.tsx` | Multi-step booking form (client component). **Step 1:** Date selection with dual date pickers (react-day-picker in popovers). **Step 2:** Item selection with availability check, quantity +/- controls, category grouping, gradient cart summary. **Step 3:** Customer info form (name, phone, email, address, event type, notes) + dark booking summary panel. Submits to `POST /api/bookings` |
| `confirmation/page.tsx` | Booking confirmation. Server component. Fetches booking by ID from URL params. Dark hero with animated check icon, booking details card, items list with totals, next steps info |

### `app/catalog/` — Public Item Catalog

| File | Purpose |
|---|---|
| `page.tsx` | Server component. Dark hero banner. Search + category filter form. Items grouped by category with colored accent bars, hover-lift cards showing name, price, description, availability, "Book" link |

### `app/business/[slug]/` — Business-Specific Booking

| File | Purpose |
|---|---|
| `page.tsx` | Business landing page. Fetches business by slug, shows items |
| `booking-form.tsx` | Business-specific booking form. Similar to `/booking` but scoped to a specific business's inventory |
| `book/page.tsx` | Alternative booking page for a business |

### `app/api/` — API Routes

| Endpoint | Methods | Purpose |
|---|---|---|
| `bookings/route.ts` | `GET`, `POST` | **POST:** Create public booking. Validates fields, calculates `total_amount`, uses service client (bypasses RLS) for inserts, sends emails (non-blocking). **GET:** Fetch booking by ID for confirmation page |
| `bookings/[id]/route.ts` | `PATCH`, `DELETE` | **PATCH:** Update booking status (pending → confirmed → completed/cancelled). Rechecks availability on confirm. Sends status change emails. **DELETE:** Remove a booking |
| `items/route.ts` | `GET`, `POST` | **GET:** List all active items. **POST:** Create new item (admin) |
| `items/[id]/route.ts` | `GET`, `PATCH`, `DELETE` | **GET:** Single item. **PATCH:** Update item. **DELETE:** Remove item |
| `availability/route.ts` | `GET` | Returns item availability for a date range. Calculates available quantity = total - booked for overlapping dates |
| `business/route.ts` | `GET`, `POST` | **GET:** Fetch business by slug. **POST:** Create/update business |
| `auth/signout/route.ts` | `POST` | Signs out the current user and redirects to `/` |

---

## `components/` — UI Components

### `components/ui/` — shadcn/ui Components

All are reusable, styled UI primitives built on Base UI or Radix.

| File | Component | Notes |
|---|---|---|
| `badge.tsx` | `Badge` | Status/label badges with variants |
| `button.tsx` | `Button`, `buttonVariants` | Primary UI button. All variants have `hover:scale-[1.02]`, `active:scale-[0.98]`, `hover:cursor-pointer` |
| `calendar.tsx` | `Calendar` | react-day-picker wrapper. White background, violet selected state with scale animation, rounded-xl |
| `card.tsx` | `Card`, `CardHeader`, `CardContent`, etc. | Standard card layout components |
| `dialog.tsx` | `Dialog` | Modal dialog (Base UI) |
| `dropdown-menu.tsx` | `DropdownMenu` | Dropdown menus |
| `form.tsx` | `Form`, `FormField`, `FormControl`, etc. | React Hook Form integration components |
| `input.tsx` | `Input` | Text input field |
| `label.tsx` | `Label` | Form label |
| `popover.tsx` | `Popover`, `PopoverTrigger`, `PopoverContent` | Popover primitive. **Critical:** `PopoverTrigger` renders as native `<button>` — do NOT nest `<Button>` inside |
| `select.tsx` | `Select`, `SelectTrigger`, etc. | Dropdown select |
| `separator.tsx` | `Separator` | Visual divider |
| `skeleton.tsx` | `Skeleton` | Loading placeholder |
| `sonner.tsx` | `Toaster` | Toast notification provider |
| `table.tsx` | `Table`, `TableHeader`, `TableRow`, etc. | Data table layout |
| `textarea.tsx` | `Textarea` | Multi-line text input |

---

## `lib/` — Business Logic & Utilities

### `lib/supabase/` — Supabase Client Configuration

| File | Purpose | Key Details |
|---|---|---|
| `server.ts` | Server-side client | Uses `@supabase/ssr` + `cookies()`. Prefers `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, falls back to `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Used by server components and API routes |
| `client.ts` | Browser-side client | Uses `@supabase/ssr` `createBrowserClient`. Same key preference. Used by client components (login page, booking detail) |
| `middleware.ts` | Session refresh + auth guard | Creates client with request/response cookies. Calls `supabase.auth.getUser()`. Protects `/admin/*` routes — redirects to `/login` if no user |
| `service-client.ts` | Admin client (bypasses RLS) | Uses `@supabase/supabase-js` directly (NOT the SSR wrapper). No cookie auth — pure service_role key. Used for public booking creation to avoid RLS conflicts |

### `lib/services/` — Business Logic

| File | Purpose |
|---|---|
| `availability.ts` | `validateBookingAvailability()` and `getItemAvailability()`. Calculates how many of each item are available for a given date range by subtracting booked quantities from total. Supports filtering by categories, item IDs, statuses, and excluding a specific booking |
| `availability-examples.ts` | Usage examples for the availability service |
| `email.ts` | Email notification functions using Resend. `sendCustomerBookingRequest()`, `sendAdminNewBookingNotification()`, `sendCustomerBookingConfirmed()`, `sendCustomerBookingCancelled()`, `sendCustomerBookingCompleted()`. All wrapped in try-catch — silent fail if `RESEND_API_KEY` isn't set |

### `lib/types/`

| File | Purpose |
|---|---|
| `database.types.ts` | Auto-generated Supabase TypeScript types. Defines `Item`, `Booking`, `Profile`, `Business`, `BookingItem` table types and their relationships |

### `lib/utils.ts`
`cn()` helper — merges Tailwind classes using `clsx` + `tailwind-merge`.

---

## `supabase/` — Database

### Migrations

| File | Purpose |
|---|---|
| `001_initial_schema.sql` | Creates core tables: `profiles` (extends auth.users with role), `items` (rental inventory), `bookings` (customer reservations), `booking_items` (junction table). Enables RLS with basic policies |
| `002_multi_tenant.sql` | Adds `businesses` table, `business_id` foreign keys to profiles/items/bookings. Multi-tenant RLS policies using helper functions (`get_user_business_id()`, `user_has_role()`). Seeds a default business. Creates profile on user signup via trigger |
| `003_public_bookings_rls.sql` | Adds RLS policies for public bookings (where `business_id IS NULL`). Lets authenticated admins SELECT and UPDATE unassigned bookings and SELECT their booking items |

### Tables

```
businesses          — Multi-tenant business entities (name, slug, email, etc.)
    │
    ├── profiles    — User accounts (extends auth.users). Has role (owner/admin/staff/customer)
    ├── items       — Rental inventory (name, category, price, quantity, active status)
    ├── bookings    — Customer reservations (customer info, dates, status, total_amount)
    │     └── booking_items  — Junction: which items, how many, at what price
    └── (items, bookings scoped to a business via business_id)
```

---

## `public/` — Static Assets

Default Next.js SVG assets (not yet customized):
- `file.svg`, `globe.svg`, `next.svg`, `vercel.svg`, `window.svg`

---

## Documentation Files

| File | Purpose |
|---|---|
| `README.md` | Project overview, feature list, tech stack, getting started |
| `DEPLOYMENT.md` | Step-by-step deployment guide for Supabase + Vercel |
| `TROUBLESHOOTING.md` | 12 common issues with symptoms, cause, and fix |
| `TESTING_GUIDE.md` | Manual test scenarios for the booking flow |
| `QUICKSTART.md` | Quick setup instructions |
| `PROJECT_OVERVIEW.md` | High-level project description |
| `ADMIN_DASHBOARD.md` | Admin dashboard documentation |
| `BOOKING_FLOW.md` | Booking flow architecture |
| `AVAILABILITY_SERVICE.md` | Availability calculation logic |
| `AVAILABILITY_ENHANCEMENTS.md` | Availability feature improvements |
| `CALENDAR_FEATURES.md` | Calendar feature docs |
| `STATUS.md` | Project status tracking |
| `build_plan.md` | Build plan / roadmap |
| `AGENTS.md` | AI agent rules (Next.js-specific) |
| `CLAUDE.md` | References AGENTS.md |

---

## Environment Variables

| Variable | Required | Where Used | Purpose |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | All Supabase clients | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | server.ts, client.ts, middleware.ts | Anonymous key (fallback) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Recommended | server.ts, client.ts, middleware.ts | New publishable key (preferred over anon) |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | service-client.ts | Admin key — bypasses RLS for booking creation |
| `NEXT_PUBLIC_APP_URL` | Optional | Confirmation page | Public URL for email links |
| `RESEND_API_KEY` | Optional | email.ts | Email sending via Resend |

---

## Data Flow

```
Customer visits /booking
    ↓
Selects dates → GET /api/availability → Supabase queries items + booking_items
    ↓
Selects items → quantities stored in React state
    ↓
Fills customer info → POST /api/bookings
    ↓
API route:
  1. Validates required fields
  2. (Optional) Rechecks availability via validateBookingAvailability()
  3. Creates booking via service client (bypasses RLS)
  4. Creates booking_items via service client
  5. Sends emails (non-blocking, try-catch)
  6. Returns 201 with booking ID
    ↓
Redirects to /booking/confirmation?id=xxx
    ↓
Confirmation page fetches booking via GET /api/bookings?id=xxx
```

```
Admin visits /admin
    ↓
Middleware checks session → redirects to /login if unauthenticated
    ↓
Admin layout checks role → redirects if not owner/admin/staff
    ↓
Dashboard queries bookings + items → displays stats
Bookings page lists all bookings (business-scoped + public/unassigned)
```

---

## Animation System

Defined in `globals.css`:

| Animation | Usage |
|---|---|
| `animate-fade-in` | General entrance |
| `animate-fade-in-up` | Cards, sections rising into view |
| `animate-fade-in-down` | Header/nav sliding down |
| `animate-slide-in-right` | Side panels |
| `animate-scale-in` | Modals, popovers |
| `animate-float` | Decorative icons, orbs |
| `animate-pulse-soft` | Status indicators |
| `animate-shimmer` | Loading states |
| `stagger-children` | Sequential entrance for lists (nth-child delays) |
| `animate-gradient` | Hero background gradient shift |
| `hover-lift` | Card hover → translateY(-4px) + shadow |
| `gradient-text` | Gradient clipped to text |
| `glass-card` | Frosted glass effect |
