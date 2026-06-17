# Customer Booking Flow - Implementation Guide

## Overview

The customer booking flow is a complete, production-ready multi-step wizard that allows customers to:
1. Select event and return dates
2. Browse available inventory with real-time availability
3. Select items and quantities
4. Enter customer information
5. Submit booking request
6. View confirmation

## Implementation Details

### Files Created/Modified

1. **`app/api/availability/route.ts`** - New API endpoint for availability
2. **`app/booking/page.tsx`** - Complete booking flow with 3 steps
3. **`lib/services/availability.ts`** - Already existed (availability calculation logic)
4. **`app/api/bookings/route.ts`** - Already existed (booking submission)
5. **`app/booking/confirmation/page.tsx`** - Already existed (confirmation page)

---

## Booking Flow Architecture

### Step 1: Date Selection

**Purpose**: Capture event date and return date

**Features**:
- Calendar date picker with validation
- Prevents selecting past dates
- Ensures return date >= event date
- Form validation with Zod schema
- Visual progress indicator

**User Actions**:
- Select event date
- Select return date
- Click "Next: Select Items"

**Validation**:
```typescript
const dateSchema = z.object({
  eventDate: z.date({ required_error: 'Event date is required' }),
  returnDate: z.date({ required_error: 'Return date is required' }),
}).refine((data) => data.returnDate >= data.eventDate, {
  message: 'Return date must be on or after event date',
  path: ['returnDate'],
})
```

---

### Step 2: Item Selection with Availability

**Purpose**: Display available items and allow quantity selection

**Features**:
- Fetches real-time availability via `/api/availability`
- Groups items by category (Tables, Chairs, Tents, etc.)
- Shows available quantity for each item
- Displays "Unavailable" or "Only X left" badges
- Quantity selector with +/- buttons
- Prevents selecting more than available quantity
- Shows running subtotal for each item
- Shows total booking amount
- "Clear All" button to reset selections
- Loading skeletons during API fetch

**User Actions**:
- Click + to increase quantity
- Click - to decrease quantity
- Review selected items summary
- Click "Back" to change dates
- Click "Next: Your Information" to proceed

**Real-time Availability**:
The system calls `/api/availability?eventDate=2024-01-15&returnDate=2024-01-16` which:
1. Fetches all active items from database
2. Finds overlapping bookings for the date range
3. Calculates available quantity = total - booked
4. Returns array of `ItemAvailability` objects

**Availability Calculation Logic**:
```typescript
// From lib/services/availability.ts
// A booking overlaps if:
// - booking.event_date <= requested.return_date
// - booking.return_date >= requested.event_date
```

**UI Highlights**:
- Selected items highlighted with blue border and background
- Unavailable items grayed out
- Low stock warnings ("Only 3 left")
- Real-time subtotal calculation
- Visual summary box with total

**Validation**:
- Must select at least one item
- Cannot exceed available quantity
- Toast notification if no items selected

---

### Step 3: Customer Information

**Purpose**: Collect customer details for booking confirmation

**Features**:
- Booking summary card at top (read-only)
  - Event dates
  - Selected items with quantities
  - Total amount
- Customer information form
  - Full name (min 2 characters)
  - Phone number (min 10 characters)
  - Email (valid email format)
  - Event address (min 5 characters)
  - Event type (wedding, birthday, etc.)
  - Special notes (optional)
- Form validation with Zod
- Loading state during submission
- Error handling with toast notifications

**User Actions**:
- Review booking summary
- Fill in contact information
- Add optional notes
- Click "Back" to modify items
- Click "Submit Booking Request"

**Validation Schema**:
```typescript
const customerSchema = z.object({
  customerName: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().min(10, 'Please enter a valid phone number'),
  email: z.string().email('Please enter a valid email'),
  eventAddress: z.string().min(5, 'Address is required'),
  eventType: z.string().min(2, 'Event type is required'),
  notes: z.string().optional(),
})
```

---

## API Integration

### 1. Availability API

**Endpoint**: `GET /api/availability`

**Query Parameters**:
- `eventDate` (required): YYYY-MM-DD format
- `returnDate` (required): YYYY-MM-DD format

**Response**:
```json
[
  {
    "item": {
      "id": "uuid",
      "name": "Folding Chair",
      "category": "Seating",
      "description": "Standard white folding chair",
      "price": 2.50,
      "total_quantity": 200,
      "active": true
    },
    "available": 185,
    "booked": 15
  }
]
```

**Error Responses**:
- `400`: Missing or invalid parameters
- `500`: Server error during calculation

### 2. Booking Submission API

**Endpoint**: `POST /api/bookings`

**Request Body**:
```json
{
  "customer_name": "John Doe",
  "phone": "555-1234",
  "email": "john@example.com",
  "event_address": "123 Main St",
  "event_type": "Wedding",
  "event_date": "2024-01-15",
  "return_date": "2024-01-16",
  "notes": "Optional notes",
  "items": [
    {
      "item_id": "uuid",
      "quantity": 100,
      "item_price": 2.50
    }
  ]
}
```

**Response (Success - 201)**:
```json
{
  "id": "booking-uuid",
  "booking": { /* full booking object */ }
}
```

**Error Responses**:
- `400`: Validation error or items not available
  ```json
  {
    "error": "Items not available",
    "details": ["Folding Chair: Only 50 available (requested 100)"]
  }
  ```
- `500`: Database error

**Validation**:
The API validates availability again before creating the booking to prevent race conditions.

---

## State Management

### React State

```typescript
const [step, setStep] = useState<Step>('dates')
const [dates, setDates] = useState<{ eventDate: Date; returnDate: Date } | null>(null)
const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([])
const [availability, setAvailability] = useState<ItemAvailability[]>([])
const [isLoadingAvailability, setIsLoadingAvailability] = useState(false)
const [itemQuantities, setItemQuantities] = useState<Record<string, number>>({})
const [isSubmitting, setIsSubmitting] = useState(false)
```

### Form State

- **dateForm**: React Hook Form for Step 1
- **customerForm**: React Hook Form for Step 3

Step 2 uses local state (`itemQuantities`) for real-time updates.

---

## User Experience Features

### Visual Progress Indicator

- 3 numbered steps at top of page
- Completed steps show green checkmark
- Current step highlighted in blue
- Future steps grayed out
- Step names below: "Select Dates", "Choose Items", "Your Info"

### Loading States

- Skeleton loaders while fetching availability
- Spinner on submit button during submission
- Disabled buttons during async operations

### Error Handling

- Form validation errors shown inline
- API errors shown as toast notifications
- Graceful fallbacks for empty states

### Responsive Design

- Mobile-friendly layout
- Touch-friendly +/- buttons
- Scrollable item lists
- Stacked layout on small screens

---

## Data Flow

```
1. User selects dates
   → Form validates
   → Sets dates state
   → Changes to Step 2

2. Step 2 loads
   → useEffect triggers
   → Fetches /api/availability
   → Sets availability state
   → Renders items with quantities

3. User selects items
   → Updates itemQuantities state
   → Calculates running total
   → Validates at least one item selected
   → Builds selectedItems array
   → Changes to Step 3

4. User enters info
   → Form validates
   → Submits to /api/bookings
   → API validates availability again
   → Creates booking + booking_items
   → Redirects to confirmation page

5. Confirmation page
   → Fetches booking by ID
   → Displays complete booking details
   → Shows next steps
```

---

## Availability Calculation Algorithm

```typescript
/**
 * For a requested date range:
 * 1. Get all active items from database
 * 2. Find bookings that overlap with requested dates
 * 3. For each item:
 *    a. Sum quantities from overlapping bookings
 *    b. Calculate: available = total_quantity - booked
 * 4. Return items with availability info
 */

// Overlap logic:
// Booking overlaps if:
//   booking.event_date <= requested.return_date
//   AND
//   booking.return_date >= requested.event_date

// Example:
// Requested: Jan 15-17
// Booking A: Jan 14-16 ✓ Overlaps
// Booking B: Jan 16-18 ✓ Overlaps
// Booking C: Jan 10-12 ✗ No overlap
// Booking D: Jan 20-22 ✗ No overlap
```

---

## Edge Cases Handled

### 1. No Items Available
- Shows message: "No items available for the selected dates"
- Encourages user to try different dates

### 2. Partial Availability
- Shows unavailable items but disables selection
- Displays "Unavailable" badge
- User can still book available items

### 3. Low Stock
- Shows "Only X left" badge when available < 5
- Prevents selecting more than available
- Real-time validation

### 4. Concurrent Bookings (Race Conditions)
- API validates availability again during submission
- Returns error if items became unavailable
- User can go back and adjust quantities

### 5. Empty Selection
- Toast notification if user tries to proceed without items
- Prevents advancing to Step 3

### 6. Form Validation Errors
- Inline error messages
- Highlights invalid fields
- Prevents submission until valid

---

## Security Considerations

### 1. Server-Side Validation
- All validation repeated on server
- Cannot bypass client-side checks
- Database constraints enforce data integrity

### 2. RLS Policies
- Anyone can create bookings (customer submissions)
- Only admins can view/modify existing bookings
- Items have public read access

### 3. Input Sanitization
- Zod validation on all inputs
- SQL injection prevented by Supabase parameterized queries
- XSS prevented by React escaping

---

## Testing Scenarios

### Happy Path
1. Select future dates
2. Select multiple items with quantities
3. Enter valid customer info
4. Submit successfully
5. View confirmation

### Availability Testing
1. Create booking for specific dates
2. Try to book overlapping dates
3. Verify reduced availability
4. Verify cannot exceed available quantity

### Validation Testing
1. Try to proceed without dates → Error
2. Try return date before event date → Error
3. Try to proceed without items → Error
4. Submit with invalid email → Error
5. Submit with short name → Error

### Edge Cases
1. Book all available quantity of an item
2. Try to book when none available
3. Navigate back and forth between steps
4. Refresh page during booking (state resets)

---

## Performance Optimizations

### 1. Efficient Queries
- Single API call for all availability
- Indexed database queries
- Minimal data transfer

### 2. Loading States
- Skeleton loaders prevent layout shift
- Optimistic UI updates for quantity changes
- Debounced calculations

### 3. Caching
- Availability cached in state during item selection
- Re-fetched only when dates change

---

## Future Enhancements

Potential improvements:

1. **Item Images**: Display photos in Step 2
2. **Calendar View**: Show availability calendar
3. **Package Deals**: Suggest item bundles
4. **Price Calculator**: Show pricing breakdown
5. **Save Draft**: Allow saving incomplete bookings
6. **Customer Accounts**: Remember customer info
7. **Payment Integration**: Accept deposits/full payment
8. **Inventory Holds**: Reserve items for 15 minutes
9. **Email Notifications**: Send confirmation emails
10. **SMS Reminders**: Send event reminders

---

## Accessibility Features

- Keyboard navigation support
- ARIA labels on interactive elements
- Focus management between steps
- Screen reader friendly
- High contrast text
- Touch-friendly tap targets (minimum 44px)

---

## Browser Compatibility

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile responsive
- Progressive enhancement
- Graceful degradation for older browsers

---

## Deployment Checklist

- [x] Database schema created
- [x] RLS policies configured
- [x] API routes implemented
- [x] Frontend components built
- [x] Form validation implemented
- [x] Error handling added
- [x] Loading states added
- [x] Availability calculation tested
- [x] Booking submission tested
- [ ] Email notifications (future)
- [ ] Payment integration (future)

---

## Summary

The booking flow is **complete and production-ready** with:

✅ **3-step wizard** with progress indicator  
✅ **Real-time availability** checking  
✅ **Form validation** with helpful error messages  
✅ **Server-side validation** to prevent race conditions  
✅ **Responsive design** for mobile and desktop  
✅ **Loading states** and error handling  
✅ **Database persistence** with RLS security  
✅ **Booking confirmation** page  
✅ **Professional UI** with shadcn/ui components

**The customer can now successfully create bookings from start to finish!** 🎉
