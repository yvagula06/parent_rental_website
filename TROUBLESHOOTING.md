# Troubleshooting Guide

Common issues and their fixes for the Rental Inventory & Booking Management System.

---

## 1. "Failed to create booking" (500 Error)

### Symptoms
- Submitting the booking form shows "Failed to create booking" toast
- Vercel logs show: `new row violates row-level security policy for table "bookings"` (code `42501`)

### Cause
Supabase RLS (Row Level Security) policies block unauthenticated INSERT operations on `bookings` and `booking_items` tables.

### Fix
The app uses a **service role client** that bypasses RLS for public booking creation.

1. Ensure `SUPABASE_SERVICE_ROLE_KEY` is set in **both** `.env.local` (local) and Vercel production environment
2. The service client lives at `lib/supabase/service-client.ts` — it uses `@supabase/supabase-js` directly (NOT `@supabase/ssr`) to avoid cookie-based auth interference
3. Verify the key is the **service_role** key, not the **anon** key — they look similar but have different permissions

**Check Vercel env vars:**
```bash
vercel env ls
```

**Add the key if missing:**
```bash
vercel env add SUPABASE_SERVICE_ROLE_KEY production
# Paste the service_role JWT from Supabase Dashboard > Settings > API
```

---

## 2. Bookings created but not visible in admin dashboard

### Symptoms
- Public booking succeeds (201 response, confirmation page loads)
- Admin dashboard shows 0 bookings
- Admin bookings list is empty

### Cause
Public bookings are created with `business_id = NULL`. The RLS `SELECT` policies only let admins see rows where `business_id = their_business_id`, which doesn't match `NULL`.

### Fix
Run this SQL in your **Supabase Dashboard > SQL Editor**:

```sql
-- Allow admins to see bookings with no business_id (public bookings)
CREATE POLICY "Authenticated users can view unassigned bookings"
    ON bookings FOR SELECT
    TO authenticated
    USING (business_id IS NULL);

-- Allow admins to update unassigned bookings
CREATE POLICY "Authenticated users can update unassigned bookings"
    ON bookings FOR UPDATE
    TO authenticated
    USING (business_id IS NULL);

-- Allow admins to see booking items belonging to unassigned bookings
CREATE POLICY "Authenticated users can view unassigned booking items"
    ON booking_items FOR SELECT
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM bookings b
        WHERE b.id = booking_id
        AND b.business_id IS NULL
    ));
```

Also ensure the admin query uses `OR` to include both scoped and unassigned bookings — see `app/admin/bookings/page.tsx` and `app/admin/page.tsx`.

---

## 3. `total_amount` always shows $0

### Symptoms
- Booking is created successfully
- `total_amount` field in the database is `0.00`

### Cause
The API wasn't calculating `total_amount` from item prices before inserting the booking row.

### Fix
The `POST /api/bookings` route now calculates `total_amount` from the items array:

```ts
const total_amount = items.reduce(
  (sum, item) => sum + Number(item.item_price) * Number(item.quantity),
  0
)
```

Ensure the client-side booking form sends `item_price` for each item in the `items` array.

---

## 4. Uncontrolled → Controlled input warnings in console

### Symptoms
React warning: `A component is changing an uncontrolled input to be controlled`

### Cause
`useForm()` fields start as `undefined` when `defaultValues` aren't provided.

### Fix
Always include `defaultValues` in `useForm()`:

```ts
const form = useForm({
  resolver: zodResolver(schema),
  defaultValues: {
    customerName: '',
    phone: '',
    email: '',
    // ... all fields
  },
})
```

---

## 5. Nested `<button>` hydration error

### Symptoms
React hydration error: `Cannot submit a form that has a <button> inside it`

### Cause
`PopoverTrigger` (Base UI) renders a `<button>` by default. If you wrap a `<Button>` inside it, you get `<button>` nested inside `<button>`.

### Fix
Style the `PopoverTrigger` directly instead of nesting a `<Button>` inside:

```tsx
// ❌ WRONG — nested buttons
<PopoverTrigger asChild>
  <Button variant="outline">Pick a date</Button>
</PopoverTrigger>

// ✅ CORRECT — style PopoverTrigger directly
<PopoverTrigger className={cn(
  buttonVariants({ variant: 'outline' }),
  'w-full pl-3 text-left font-normal'
)}>
  Pick a date
</PopoverTrigger>
```

---

## 6. Calendar appears transparent inside a popover

### Symptoms
The date picker calendar shows no background when opened in a popover.

### Cause
The class `in-data-[slot=popover-content]:bg-transparent` overrides the calendar background.

### Fix
Use explicit background classes on the DayPicker root:

```tsx
// Remove this class:
// in-data-[slot=popover-content]:bg-transparent

// Replace with:
<Calendar
  classNames={{ root: 'bg-white p-3 rounded-xl shadow-sm border border-slate-200' }}
/>
```

---

## 7. Supabase publishable key not working

### Symptoms
- Console error: `Invalid API key`
- Pages fail to load data
- Admin login redirects in a loop

### Cause
The new publishable key (`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`) isn't set, or the old `NEXT_PUBLIC_SUPABASE_ANON_KEY` was removed.

### Fix
The app uses a fallback pattern — it prefers the publishable key, but falls back to the anon key:

```ts
process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
```

If you're using the new SDK, set **both** variables in `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...old-key...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...new-key...
SUPABASE_SERVICE_ROLE_KEY=eyJ...service-role-key...
```

---

## 8. Admin pages show "Unauthorized" or redirect to login

### Symptoms
- Admin dashboard redirects to `/login` immediately
- API routes return 401

### Cause
- User is not logged in
- Session expired
- Middleware can't read/refresh session cookies

### Fix
1. Ensure the middleware in `middleware.ts` is running and calls `supabase.auth.getUser()`
2. Check that `cookies()` is being awaited properly in `lib/supabase/server.ts`
3. Verify the user exists in `profiles` table with role `admin` or `owner`

---

## 9. Environment variables not loading on Vercel

### Symptoms
- Works locally but fails in production
- `process.env.SUPABASE_SERVICE_ROLE_KEY` is `undefined` on the server

### Fix
1. Run `vercel env ls` to verify the variable exists for the `production` environment
2. **Redeploy** after adding env vars — existing deployments don't pick up new variables:
   ```bash
   vercel --prod
   ```
3. For `NEXT_PUBLIC_*` vars, they're bundled at build time — you must trigger a new deploy
4. For server-only vars (no `NEXT_PUBLIC_`), they're read at runtime — a redeploy may not be needed, but a redeploy is still safest

---

## 10. Emails not sending

### Symptoms
- Booking succeeds but no confirmation emails arrive
- No error shown to user

### Cause
The `RESEND_API_KEY` environment variable is not set. Email sending is wrapped in try-catch and silently fails.

### Fix
1. Sign up at [resend.com](https://resend.com) and get an API key
2. Add it to Vercel:
   ```bash
   vercel env add RESEND_API_KEY production
   ```
3. Redeploy:
   ```bash
   vercel --prod
   ```

---

## 11. Date picker won't select dates / popover doesn't open

### Symptoms
Clicking the date picker trigger does nothing, or the popover flashes and closes.

### Cause
Base UI `PopoverTrigger` requires a native `<button>` for proper positioning. Using a custom `render` prop or zero-dimension elements breaks the anchor.

### Fix
Ensure `PopoverTrigger` renders as a native `<button>` (the default behavior):

```tsx
// ✅ This works
<PopoverTrigger className={cn(buttonVariants({ variant: 'outline' }), '...')}>
  <CalendarIcon />
  {field.value ? format(field.value, 'PPP') : 'Pick a date'}
</PopoverTrigger>

// ❌ This breaks positioning
<PopoverTrigger render={<span className="contents" />}>
  <Button>Pick a date</Button>
</PopoverTrigger>
```

---

## 12. Booking form has stale item data after changing dates

### Symptoms
- User selects dates, picks items
- Goes back and changes dates
- Item list shows wrong availability

### Cause
The availability `useEffect` re-fetches when dates change, but old `itemQuantities` aren't cleared properly.

### Fix
Ensure the `fetchAvailability` function resets quantities for items that are no longer available:

```ts
const newQuantities: Record<string, number> = {}
selectedItems.forEach((selectedItem) => {
  const itemAvail = data.find(a => a.item.id === selectedItem.itemId)
  if (itemAvail && itemAvail.available >= selectedItem.quantity) {
    newQuantities[selectedItem.itemId] = selectedItem.quantity
  }
})
setItemQuantities(newQuantities)
```

---

## Quick Reference: Key Files

| File | Purpose |
|---|---|
| `lib/supabase/server.ts` | Server-side Supabase client (uses cookies for auth) |
| `lib/supabase/client.ts` | Browser-side Supabase client |
| `lib/supabase/service-client.ts` | Admin client (bypasses RLS — uses service_role key) |
| `lib/supabase/middleware.ts` | Session refresh + admin route protection |
| `app/api/bookings/route.ts` | POST — create public bookings |
| `app/api/bookings/[id]/route.ts` | PATCH — update booking status |
| `supabase/migrations/` | Database schema and RLS policies |
| `.env.local` | Local environment variables |
| Vercel dashboard > Settings > Environment Variables | Production env vars |

## Quick Reference: Key Environment Variables

| Variable | Purpose | Required |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | ✅ Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key (fallback) | ✅ Yes |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable key (preferred) | Recommended |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin key — bypasses RLS | ✅ Yes (for booking creation) |
| `NEXT_PUBLIC_APP_URL` | Public URL for email links | Optional |
| `RESEND_API_KEY` | Email sending via Resend | Optional |
