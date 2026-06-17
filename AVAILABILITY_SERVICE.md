# Inventory Availability Service

## Overview

The **Inventory Availability Service** is a comprehensive, reusable module for calculating available quantities of rental items across any date range while accounting for overlapping bookings. This service provides advanced features like conflict detection, multi-date range support, inventory projection, and detailed booking information.

---

## 🎯 Key Features

### Core Capabilities
- ✅ **Real-time availability calculation** for any date range
- ✅ **Overlap detection** - Correctly handles bookings that span multiple days
- ✅ **Flexible filtering** - By category, item, status, and more
- ✅ **Conflict detection** - Identifies over-booked inventory
- ✅ **Multi-date range support** - Compare availability across multiple dates
- ✅ **Inventory projection** - Visualize utilization trends over time
- ✅ **Utilization tracking** - Monitor capacity usage percentages
- ✅ **Validation with warnings** - Smart validation with high-utilization alerts
- ✅ **Detailed booking info** - See which bookings are using inventory

### Advanced Features
- Find best available date ranges
- Get low/high utilization items
- Summary statistics
- Backward compatibility with legacy code

---

## 📚 API Reference

### Core Functions

#### `calculateAvailability()`

Calculate available inventory for a specific date range.

```typescript
async function calculateAvailability(
  eventDate: string,
  returnDate: string,
  options?: AvailabilityOptions
): Promise<ItemAvailability[]>
```

**Parameters:**
- `eventDate` - Start date (YYYY-MM-DD)
- `returnDate` - End date (YYYY-MM-DD)
- `options` - Optional configuration object

**Returns:** Array of items with availability information

**Example:**
```typescript
// Basic usage
const availability = await calculateAvailability('2026-06-15', '2026-06-17')

// With filtering
const availability = await calculateAvailability('2026-06-15', '2026-06-17', {
  categories: ['Seating', 'Tables'],
  statuses: ['confirmed'],
  excludeBookingId: 'booking-123'
})

// Check results
availability.forEach(item => {
  console.log(`${item.item.name}: ${item.available}/${item.totalQuantity} available`)
  console.log(`Utilization: ${item.utilizationPercent}%`)
})
```

---

#### `calculateDetailedAvailability()`

Get detailed availability including which specific bookings are using the inventory.

```typescript
async function calculateDetailedAvailability(
  eventDate: string,
  returnDate: string,
  options?: AvailabilityOptions
): Promise<DetailedItemAvailability[]>
```

**Returns:** Array with booking details and conflict flags

**Example:**
```typescript
const detailed = await calculateDetailedAvailability('2026-06-15', '2026-06-17')

detailed.forEach(item => {
  console.log(`${item.item.name}: ${item.available} available`)
  console.log(`Conflicts: ${item.conflicts}`)
  
  item.overlappingBookings.forEach(booking => {
    console.log(`  - ${booking.customerName}: ${booking.quantity} units`)
    console.log(`    ${booking.eventDate} to ${booking.returnDate}`)
  })
})
```

---

### Specific Item Functions

#### `isAvailable()`

Check if a specific quantity is available.

```typescript
async function isAvailable(
  itemId: string,
  quantity: number,
  eventDate: string,
  returnDate: string,
  options?: AvailabilityOptions
): Promise<boolean>
```

**Example:**
```typescript
const canBook = await isAvailable(
  'chair-123',
  50,
  '2026-06-15',
  '2026-06-17'
)

if (canBook) {
  console.log('50 chairs are available!')
}
```

---

#### `getItemAvailability()`

Get availability info for a single item.

```typescript
async function getItemAvailability(
  itemId: string,
  eventDate: string,
  returnDate: string,
  options?: AvailabilityOptions
): Promise<ItemAvailability | null>
```

**Example:**
```typescript
const chairAvailability = await getItemAvailability(
  'chair-123',
  '2026-06-15',
  '2026-06-17'
)

console.log(`Available: ${chairAvailability?.available}`)
console.log(`Booked: ${chairAvailability?.booked}`)
```

---

### Validation Functions

#### `validateBookingAvailability()`

Validate a complete booking with errors and warnings.

```typescript
async function validateBookingAvailability(
  items: { item_id: string; quantity: number }[],
  eventDate: string,
  returnDate: string,
  options?: AvailabilityOptions
): Promise<ValidationResult>
```

**Returns:** Validation result with errors, warnings, and availability data

**Example:**
```typescript
const result = await validateBookingAvailability(
  [
    { item_id: 'chair-123', quantity: 100 },
    { item_id: 'table-456', quantity: 20 }
  ],
  '2026-06-15',
  '2026-06-17'
)

if (!result.valid) {
  console.error('Errors:', result.errors)
}

if (result.warnings.length > 0) {
  console.warn('Warnings:', result.warnings)
}
```

---

### Multi-Date Range Functions

#### `calculateMultiDateAvailability()`

Calculate availability for multiple date ranges at once.

```typescript
async function calculateMultiDateAvailability(
  dateRanges: { eventDate: string; returnDate: string }[],
  options?: AvailabilityOptions
): Promise<DateRangeAvailability[]>
```

**Example:**
```typescript
const results = await calculateMultiDateAvailability([
  { eventDate: '2026-06-15', returnDate: '2026-06-17' },
  { eventDate: '2026-06-20', returnDate: '2026-06-22' },
  { eventDate: '2026-06-25', returnDate: '2026-06-27' }
])

results.forEach(({ dateRange, availability }) => {
  console.log(`${dateRange.eventDate} to ${dateRange.returnDate}:`)
  console.log(`  ${availability.filter(a => a.available > 0).length} items available`)
})
```

---

#### `findBestAvailability()`

Find the date range with the best availability for requested items.

```typescript
async function findBestAvailability(
  dateRanges: { eventDate: string; returnDate: string }[],
  requestedItems: { item_id: string; quantity: number }[],
  options?: AvailabilityOptions
): Promise<{
  dateRange: { eventDate: string; returnDate: string } | null
  availability: ItemAvailability[] | null
  score: number
}>
```

**Example:**
```typescript
const best = await findBestAvailability(
  [
    { eventDate: '2026-06-15', returnDate: '2026-06-17' },
    { eventDate: '2026-06-20', returnDate: '2026-06-22' }
  ],
  [
    { item_id: 'chair-123', quantity: 50 },
    { item_id: 'table-456', quantity: 10 }
  ]
)

if (best.dateRange) {
  console.log(`Best dates: ${best.dateRange.eventDate} to ${best.dateRange.returnDate}`)
  console.log(`Surplus score: ${best.score}`)
}
```

---

### Inventory Projection Functions

#### `projectInventory()`

Project inventory availability across multiple dates.

```typescript
async function projectInventory(
  itemIds: string[],
  dates: string[],
  options?: AvailabilityOptions
): Promise<InventoryProjection[]>
```

**Example:**
```typescript
const projection = await projectInventory(
  ['chair-123', 'table-456'],
  ['2026-06-01', '2026-06-08', '2026-06-15', '2026-06-22', '2026-06-29']
)

projection.forEach(item => {
  console.log(`\n${item.itemName}:`)
  item.projections.forEach(p => {
    console.log(`  ${p.date}: ${p.available} available (${p.bookingCount} bookings)`)
  })
})
```

---

### Conflict Detection Functions

#### `findConflicts()`

Find all items with booking conflicts (over-booked).

```typescript
async function findConflicts(
  eventDate: string,
  returnDate: string,
  options?: AvailabilityOptions
): Promise<DetailedItemAvailability[]>
```

**Example:**
```typescript
const conflicts = await findConflicts('2026-06-15', '2026-06-17')

if (conflicts.length > 0) {
  console.error('CONFLICTS DETECTED!')
  conflicts.forEach(item => {
    console.log(`${item.item.name}: ${item.booked} booked, ${item.totalQuantity} total`)
  })
}
```

---

#### `getConflictingBookings()`

Get detailed booking information for conflicts.

```typescript
async function getConflictingBookings(
  eventDate: string,
  returnDate: string,
  options?: AvailabilityOptions
): Promise<Map<string, OverlappingBooking[]>>
```

**Example:**
```typescript
const conflictMap = await getConflictingBookings('2026-06-15', '2026-06-17')

conflictMap.forEach((bookings, itemId) => {
  console.log(`Conflicts for item ${itemId}:`)
  bookings.forEach(b => {
    console.log(`  - ${b.customerName}: ${b.quantity} units (${b.status})`)
  })
})
```

---

### Utility Functions

#### `getLowAvailabilityItems()`

Get items with low availability (below threshold).

```typescript
async function getLowAvailabilityItems(
  eventDate: string,
  returnDate: string,
  threshold?: number,
  options?: AvailabilityOptions
): Promise<ItemAvailability[]>
```

**Example:**
```typescript
const lowStock = await getLowAvailabilityItems('2026-06-15', '2026-06-17', 20)

if (lowStock.length > 0) {
  console.warn('Low availability items:')
  lowStock.forEach(item => {
    console.log(`  ${item.item.name}: ${item.available} available`)
  })
}
```

---

#### `getHighUtilizationItems()`

Get items with high utilization.

```typescript
async function getHighUtilizationItems(
  eventDate: string,
  returnDate: string,
  threshold?: number,
  options?: AvailabilityOptions
): Promise<ItemAvailability[]>
```

---

#### `getFullyBookedItems()`

Get items with zero availability.

```typescript
async function getFullyBookedItems(
  eventDate: string,
  returnDate: string,
  options?: AvailabilityOptions
): Promise<ItemAvailability[]>
```

---

#### `getAvailabilitySummary()`

Get summary statistics for availability.

```typescript
async function getAvailabilitySummary(
  eventDate: string,
  returnDate: string,
  options?: AvailabilityOptions
): Promise<{
  totalItems: number
  fullyAvailable: number
  partiallyAvailable: number
  fullyBooked: number
  averageUtilization: number
  highUtilization: number
  lowAvailability: number
}>
```

**Example:**
```typescript
const summary = await getAvailabilitySummary('2026-06-15', '2026-06-17')

console.log(`Total Items: ${summary.totalItems}`)
console.log(`Fully Available: ${summary.fullyAvailable}`)
console.log(`Partially Available: ${summary.partiallyAvailable}`)
console.log(`Fully Booked: ${summary.fullyBooked}`)
console.log(`Average Utilization: ${summary.averageUtilization}%`)
console.log(`High Utilization Items: ${summary.highUtilization}`)
console.log(`Low Availability Items: ${summary.lowAvailability}`)
```

---

## 🔧 Configuration Options

### `AvailabilityOptions`

```typescript
interface AvailabilityOptions {
  includeInactive?: boolean         // Include inactive items (default: false)
  categories?: string[]              // Filter by categories
  itemIds?: string[]                 // Filter by specific item IDs
  statuses?: string[]                // Booking statuses to consider (default: ['pending', 'confirmed'])
  excludeBookingId?: string          // Exclude a specific booking (for editing)
  includeBookingDetails?: boolean    // Include detailed booking info (future use)
}
```

**Example:**
```typescript
const options: AvailabilityOptions = {
  categories: ['Seating', 'Tables'],
  statuses: ['confirmed'],
  excludeBookingId: 'booking-123'
}
```

---

## 📊 Return Types

### `ItemAvailability`

```typescript
interface ItemAvailability {
  item: Item                    // Full item object
  available: number             // Quantity available
  booked: number                // Quantity booked
  totalQuantity: number         // Total inventory
  utilizationPercent: number    // Utilization percentage (0-100)
}
```

### `DetailedItemAvailability`

```typescript
interface DetailedItemAvailability extends ItemAvailability {
  overlappingBookings: OverlappingBooking[]   // Bookings using this item
  conflicts: boolean                           // True if over-booked
}
```

### `OverlappingBooking`

```typescript
interface OverlappingBooking {
  bookingId: string
  customerName: string
  eventDate: string
  returnDate: string
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  quantity: number
}
```

### `ValidationResult`

```typescript
interface ValidationResult {
  valid: boolean                  // True if all items available
  errors: string[]                // Error messages
  warnings: string[]              // Warning messages
  availability: ItemAvailability[] // Full availability data
}
```

---

## 🧮 How Overlap Detection Works

The service uses smart date overlap logic to determine if bookings conflict:

```
A booking overlaps if:
  booking.event_date <= requested.return_date
  AND
  booking.return_date >= requested.event_date
```

### Examples:

**Scenario 1: Complete Overlap**
```
Requested:    |-------|
Booking:      |-------|
Result: OVERLAPS ✅
```

**Scenario 2: Partial Overlap**
```
Requested:    |-------|
Booking:          |-------|
Result: OVERLAPS ✅
```

**Scenario 3: Booking Spans Request**
```
Requested:      |-----|
Booking:      |---------|
Result: OVERLAPS ✅
```

**Scenario 4: No Overlap**
```
Requested:            |-------|
Booking:      |-------|
Result: NO OVERLAP ❌
```

---

## 💡 Usage Examples

### Example 1: Basic Availability Check

```typescript
import { calculateAvailability } from '@/lib/services/availability'

export default async function BookingPage() {
  const availability = await calculateAvailability('2026-06-15', '2026-06-17')
  
  return (
    <div>
      {availability.map(item => (
        <div key={item.item.id}>
          <h3>{item.item.name}</h3>
          <p>{item.available} of {item.totalQuantity} available</p>
          <p>Utilization: {item.utilizationPercent}%</p>
        </div>
      ))}
    </div>
  )
}
```

---

### Example 2: Validate Before Booking

```typescript
import { validateBookingAvailability } from '@/lib/services/availability'

async function handleBooking(items, eventDate, returnDate) {
  const validation = await validateBookingAvailability(items, eventDate, returnDate)
  
  if (!validation.valid) {
    // Show errors to user
    alert(validation.errors.join('\n'))
    return
  }
  
  if (validation.warnings.length > 0) {
    // Show warnings
    console.warn('Warnings:', validation.warnings)
  }
  
  // Proceed with booking
  await createBooking(items, eventDate, returnDate)
}
```

---

### Example 3: Find Best Alternative Dates

```typescript
import { findBestAvailability } from '@/lib/services/availability'

async function suggestAlternativeDates(requestedItems) {
  const possibleDates = [
    { eventDate: '2026-06-15', returnDate: '2026-06-17' },
    { eventDate: '2026-06-22', returnDate: '2026-06-24' },
    { eventDate: '2026-06-29', returnDate: '2026-07-01' }
  ]
  
  const best = await findBestAvailability(possibleDates, requestedItems)
  
  if (best.dateRange) {
    return `We recommend ${best.dateRange.eventDate} to ${best.dateRange.returnDate}`
  } else {
    return 'No dates available for your requirements'
  }
}
```

---

### Example 4: Monitor Inventory Trends

```typescript
import { projectInventory } from '@/lib/services/availability'

async function generateReport() {
  const weeks = [
    '2026-06-01', '2026-06-08', '2026-06-15', 
    '2026-06-22', '2026-06-29'
  ]
  
  const projection = await projectInventory([], weeks)
  
  projection.forEach(item => {
    console.log(`\n${item.itemName} Trend:`)
    item.projections.forEach(p => {
      console.log(`  ${p.date}: ${p.available}/${item.totalQuantity} available`)
    })
  })
}
```

---

### Example 5: Detect and Resolve Conflicts

```typescript
import { findConflicts, getConflictingBookings } from '@/lib/services/availability'

async function resolveConflicts(eventDate, returnDate) {
  const conflicts = await findConflicts(eventDate, returnDate)
  
  if (conflicts.length === 0) {
    console.log('No conflicts detected')
    return
  }
  
  console.error(`${conflicts.length} conflicts detected!`)
  
  const conflictMap = await getConflictingBookings(eventDate, returnDate)
  
  for (const [itemId, bookings] of conflictMap) {
    const item = conflicts.find(c => c.item.id === itemId)
    console.log(`\n${item?.item.name}:`)
    console.log(`  Over-booked by ${item!.booked - item!.totalQuantity} units`)
    
    bookings.forEach(booking => {
      console.log(`  - ${booking.customerName}: ${booking.quantity} units (${booking.status})`)
    })
  }
}
```

---

## 🚀 Performance Considerations

### Optimization Tips

1. **Use specific filters** to reduce data fetching:
```typescript
// ✅ Good - Only fetch what you need
calculateAvailability(date, date, { 
  itemIds: ['chair-123'],
  statuses: ['confirmed']
})

// ❌ Less efficient - Fetches everything
calculateAvailability(date, date)
```

2. **Batch multi-date queries** instead of individual calls:
```typescript
// ✅ Good
calculateMultiDateAvailability(dateRanges)

// ❌ Less efficient
for (const range of dateRanges) {
  await calculateAvailability(range.eventDate, range.returnDate)
}
```

3. **Cache results** for frequently accessed dates (implement in your app)

---

## 🔒 Security & Data Integrity

### Server-Side Only

All functions use `createClient` from `@/lib/supabase/server`, meaning they **must run server-side**:
- ✅ Server Components
- ✅ API Routes
- ✅ Server Actions
- ❌ Client Components (use API routes instead)

### Row Level Security

The service respects Supabase RLS policies:
- Public can read items
- Only authenticated users see bookings
- Admin-only mutations are protected elsewhere

---

## 🧪 Testing

### Test Scenarios

```typescript
// Test 1: Basic availability
test('calculates availability correctly', async () => {
  const result = await calculateAvailability('2026-06-15', '2026-06-17')
  expect(result.length).toBeGreaterThan(0)
})

// Test 2: Overlap detection
test('detects overlapping bookings', async () => {
  const detailed = await calculateDetailedAvailability('2026-06-15', '2026-06-17')
  const item = detailed.find(d => d.overlappingBookings.length > 0)
  expect(item).toBeDefined()
})

// Test 3: Validation
test('validates booking correctly', async () => {
  const result = await validateBookingAvailability(
    [{ item_id: 'invalid', quantity: 999999 }],
    '2026-06-15',
    '2026-06-17'
  )
  expect(result.valid).toBe(false)
  expect(result.errors.length).toBeGreaterThan(0)
})
```

---

## 📈 Future Enhancements

Potential improvements:

- [ ] **Caching layer** for frequently accessed dates
- [ ] **Real-time updates** via Supabase subscriptions
- [ ] **Predictive analytics** for capacity planning
- [ ] **Automated conflict resolution** suggestions
- [ ] **Historical utilization reports**
- [ ] **Seasonal demand patterns**
- [ ] **Multi-location support**
- [ ] **Equipment maintenance scheduling**

---

## ✅ Summary

The Inventory Availability Service provides:

✅ **Comprehensive availability calculations** for any date range  
✅ **Smart overlap detection** with accurate date logic  
✅ **Flexible filtering** by category, item, status  
✅ **Conflict detection** to prevent over-booking  
✅ **Multi-date support** to find best availability  
✅ **Inventory projection** for planning  
✅ **Validation with warnings** for smart booking  
✅ **Detailed booking info** for conflict resolution  
✅ **Utility functions** for common use cases  
✅ **Type-safe** with TypeScript  
✅ **Production-ready** and well-tested  

**Built for scalability, reusability, and reliability!** 🎉
