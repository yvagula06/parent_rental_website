// ============================================================================
// Inventory Availability Service - Usage Examples
// ============================================================================

import {
  calculateAvailability,
  calculateDetailedAvailability,
  isAvailable,
  getItemAvailability,
  validateBookingAvailability,
  calculateMultiDateAvailability,
  findBestAvailability,
  projectInventory,
  findConflicts,
  getConflictingBookings,
  getLowAvailabilityItems,
  getHighUtilizationItems,
  getFullyBookedItems,
  getAvailabilitySummary,
} from '@/lib/services/availability'

// ============================================================================
// Example 1: Check Basic Availability
// ============================================================================

export async function example1_BasicAvailability() {
  const eventDate = '2026-06-15'
  const returnDate = '2026-06-17'

  // Get availability for all active items
  const availability = await calculateAvailability(eventDate, returnDate)

  console.log('=== Basic Availability ===')
  availability.forEach((item) => {
    console.log(`${item.item.name}:`)
    console.log(`  Available: ${item.available}`)
    console.log(`  Booked: ${item.booked}`)
    console.log(`  Total: ${item.totalQuantity}`)
    console.log(`  Utilization: ${item.utilizationPercent}%`)
  })

  return availability
}

// ============================================================================
// Example 2: Filter by Category
// ============================================================================

export async function example2_FilterByCategory() {
  const eventDate = '2026-06-15'
  const returnDate = '2026-06-17'

  // Only check seating and tables
  const availability = await calculateAvailability(eventDate, returnDate, {
    categories: ['Seating', 'Tables'],
  })

  console.log('=== Seating & Tables Availability ===')
  availability.forEach((item) => {
    console.log(`${item.item.category} - ${item.item.name}: ${item.available} available`)
  })

  return availability
}

// ============================================================================
// Example 3: Detailed Availability with Booking Info
// ============================================================================

export async function example3_DetailedAvailability() {
  const eventDate = '2026-06-15'
  const returnDate = '2026-06-17'

  // Get detailed info including overlapping bookings
  const detailed = await calculateDetailedAvailability(eventDate, returnDate)

  console.log('=== Detailed Availability ===')
  detailed.forEach((item) => {
    console.log(`\n${item.item.name}:`)
    console.log(`  Available: ${item.available}`)
    console.log(`  Conflicts: ${item.conflicts ? 'YES' : 'NO'}`)

    if (item.overlappingBookings.length > 0) {
      console.log(`  Overlapping Bookings:`)
      item.overlappingBookings.forEach((booking) => {
        console.log(`    - ${booking.customerName}: ${booking.quantity} units`)
        console.log(`      ${booking.eventDate} to ${booking.returnDate} (${booking.status})`)
      })
    }
  })

  return detailed
}

// ============================================================================
// Example 4: Check Specific Item Availability
// ============================================================================

export async function example4_CheckSpecificItem() {
  const itemId = 'your-chair-id' // Replace with actual item ID
  const quantity = 50
  const eventDate = '2026-06-15'
  const returnDate = '2026-06-17'

  // Quick boolean check
  const canBook = await isAvailable(itemId, quantity, eventDate, returnDate)

  console.log('=== Can Book 50 Chairs? ===')
  console.log(canBook ? 'YES' : 'NO')

  // Get detailed info
  const itemAvailability = await getItemAvailability(itemId, eventDate, returnDate)

  if (itemAvailability) {
    console.log(`Available: ${itemAvailability.available}`)
    console.log(`Need: ${quantity}`)
    console.log(`Shortage: ${Math.max(0, quantity - itemAvailability.available)}`)
  }

  return { canBook, itemAvailability }
}

// ============================================================================
// Example 5: Validate Complete Booking
// ============================================================================

export async function example5_ValidateBooking() {
  const requestedItems = [
    { item_id: 'chair-id', quantity: 100 },
    { item_id: 'table-id', quantity: 20 },
    { item_id: 'linen-id', quantity: 20 },
  ]
  const eventDate = '2026-06-15'
  const returnDate = '2026-06-17'

  const validation = await validateBookingAvailability(
    requestedItems,
    eventDate,
    returnDate
  )

  console.log('=== Booking Validation ===')
  console.log(`Valid: ${validation.valid}`)

  if (validation.errors.length > 0) {
    console.log('Errors:')
    validation.errors.forEach((error) => console.log(`  - ${error}`))
  }

  if (validation.warnings.length > 0) {
    console.log('Warnings:')
    validation.warnings.forEach((warning) => console.log(`  - ${warning}`))
  }

  return validation
}

// ============================================================================
// Example 6: Compare Multiple Date Ranges
// ============================================================================

export async function example6_CompareDateRanges() {
  const dateRanges = [
    { eventDate: '2026-06-15', returnDate: '2026-06-17' },
    { eventDate: '2026-06-22', returnDate: '2026-06-24' },
    { eventDate: '2026-06-29', returnDate: '2026-07-01' },
  ]

  const results = await calculateMultiDateAvailability(dateRanges)

  console.log('=== Multi-Date Availability ===')
  results.forEach(({ dateRange, availability }) => {
    console.log(`\n${dateRange.eventDate} to ${dateRange.returnDate}:`)

    const fullyAvailable = availability.filter((a) => a.available === a.totalQuantity).length
    const partiallyAvailable = availability.filter(
      (a) => a.available > 0 && a.available < a.totalQuantity
    ).length
    const fullyBooked = availability.filter((a) => a.available === 0).length

    console.log(`  Fully Available: ${fullyAvailable}`)
    console.log(`  Partially Available: ${partiallyAvailable}`)
    console.log(`  Fully Booked: ${fullyBooked}`)
  })

  return results
}

// ============================================================================
// Example 7: Find Best Available Date
// ============================================================================

export async function example7_FindBestDate() {
  const possibleDates = [
    { eventDate: '2026-06-15', returnDate: '2026-06-17' },
    { eventDate: '2026-06-22', returnDate: '2026-06-24' },
    { eventDate: '2026-06-29', returnDate: '2026-07-01' },
    { eventDate: '2026-07-06', returnDate: '2026-07-08' },
  ]

  const requestedItems = [
    { item_id: 'chair-id', quantity: 100 },
    { item_id: 'table-id', quantity: 20 },
  ]

  const best = await findBestAvailability(possibleDates, requestedItems)

  console.log('=== Best Available Date ===')
  if (best.dateRange) {
    console.log(`Recommended: ${best.dateRange.eventDate} to ${best.dateRange.returnDate}`)
    console.log(`Surplus Score: ${best.score}`)
  } else {
    console.log('No dates have sufficient availability')
  }

  return best
}

// ============================================================================
// Example 8: Project Inventory Over Time
// ============================================================================

export async function example8_InventoryProjection() {
  // Project for next 4 weeks
  const dates = [
    '2026-06-07',
    '2026-06-14',
    '2026-06-21',
    '2026-06-28',
  ]

  // Project for specific items (empty array = all items)
  const itemIds: string[] = [] // or ['chair-id', 'table-id']

  const projection = await projectInventory(itemIds, dates)

  console.log('=== Inventory Projection ===')
  projection.forEach((item) => {
    console.log(`\n${item.itemName} (${item.category}):`)
    console.log(`  Total Quantity: ${item.totalQuantity}`)

    item.projections.forEach((p) => {
      console.log(`  ${p.date}:`)
      console.log(`    Available: ${p.available}`)
      console.log(`    Booked: ${p.booked}`)
      console.log(`    Bookings: ${p.bookingCount}`)
    })
  })

  return projection
}

// ============================================================================
// Example 9: Detect Conflicts
// ============================================================================

export async function example9_DetectConflicts() {
  const eventDate = '2026-06-15'
  const returnDate = '2026-06-17'

  // Find over-booked items
  const conflicts = await findConflicts(eventDate, returnDate)

  console.log('=== Conflicts Detection ===')
  if (conflicts.length === 0) {
    console.log('No conflicts detected')
  } else {
    console.log(`${conflicts.length} conflicts found!`)

    conflicts.forEach((item) => {
      console.log(`\n${item.item.name}:`)
      console.log(`  Total Quantity: ${item.totalQuantity}`)
      console.log(`  Booked: ${item.booked}`)
      console.log(`  Over-booked by: ${item.booked - item.totalQuantity}`)

      item.overlappingBookings.forEach((booking) => {
        console.log(`    - ${booking.customerName}: ${booking.quantity} units (${booking.status})`)
      })
    })
  }

  return conflicts
}

// ============================================================================
// Example 10: Get Detailed Conflict Info
// ============================================================================

export async function example10_ConflictingBookings() {
  const eventDate = '2026-06-15'
  const returnDate = '2026-06-17'

  const conflictMap = await getConflictingBookings(eventDate, returnDate)

  console.log('=== Conflicting Bookings ===')
  if (conflictMap.size === 0) {
    console.log('No conflicts')
  } else {
    conflictMap.forEach((bookings, itemId) => {
      console.log(`\nItem ID: ${itemId}`)
      console.log(`${bookings.length} conflicting bookings:`)

      bookings.forEach((booking) => {
        console.log(`  - ${booking.customerName}:`)
        console.log(`    Quantity: ${booking.quantity}`)
        console.log(`    Dates: ${booking.eventDate} to ${booking.returnDate}`)
        console.log(`    Status: ${booking.status}`)
      })
    })
  }

  return conflictMap
}

// ============================================================================
// Example 11: Get Low Availability Items
// ============================================================================

export async function example11_LowAvailability() {
  const eventDate = '2026-06-15'
  const returnDate = '2026-06-17'
  const threshold = 20 // 20% or less available

  const lowStock = await getLowAvailabilityItems(eventDate, returnDate, threshold)

  console.log('=== Low Availability Items ===')
  if (lowStock.length === 0) {
    console.log('All items have good availability')
  } else {
    console.log(`${lowStock.length} items below ${threshold}% availability:`)

    lowStock.forEach((item) => {
      const availablePercent = ((item.available / item.totalQuantity) * 100).toFixed(1)
      console.log(`  ${item.item.name}: ${item.available}/${item.totalQuantity} (${availablePercent}%)`)
    })
  }

  return lowStock
}

// ============================================================================
// Example 12: Get High Utilization Items
// ============================================================================

export async function example12_HighUtilization() {
  const eventDate = '2026-06-15'
  const returnDate = '2026-06-17'
  const threshold = 80 // 80% or more booked

  const highUsage = await getHighUtilizationItems(eventDate, returnDate, threshold)

  console.log('=== High Utilization Items ===')
  if (highUsage.length === 0) {
    console.log('No high utilization items')
  } else {
    console.log(`${highUsage.length} items at ${threshold}%+ utilization:`)

    highUsage.forEach((item) => {
      console.log(`  ${item.item.name}: ${item.utilizationPercent}% (${item.booked}/${item.totalQuantity})`)
    })
  }

  return highUsage
}

// ============================================================================
// Example 13: Get Fully Booked Items
// ============================================================================

export async function example13_FullyBooked() {
  const eventDate = '2026-06-15'
  const returnDate = '2026-06-17'

  const fullyBooked = await getFullyBookedItems(eventDate, returnDate)

  console.log('=== Fully Booked Items ===')
  if (fullyBooked.length === 0) {
    console.log('No fully booked items')
  } else {
    console.log(`${fullyBooked.length} items fully booked:`)

    fullyBooked.forEach((item) => {
      console.log(`  ${item.item.name}: ${item.totalQuantity} units booked`)
    })
  }

  return fullyBooked
}

// ============================================================================
// Example 14: Get Availability Summary
// ============================================================================

export async function example14_AvailabilitySummary() {
  const eventDate = '2026-06-15'
  const returnDate = '2026-06-17'

  const summary = await getAvailabilitySummary(eventDate, returnDate)

  console.log('=== Availability Summary ===')
  console.log(`Date Range: ${eventDate} to ${returnDate}`)
  console.log(`\nTotal Items: ${summary.totalItems}`)
  console.log(`Fully Available: ${summary.fullyAvailable}`)
  console.log(`Partially Available: ${summary.partiallyAvailable}`)
  console.log(`Fully Booked: ${summary.fullyBooked}`)
  console.log(`\nAverage Utilization: ${summary.averageUtilization}%`)
  console.log(`High Utilization Items: ${summary.highUtilization}`)
  console.log(`Low Availability Items: ${summary.lowAvailability}`)

  return summary
}

// ============================================================================
// Example 15: Filter by Confirmed Bookings Only
// ============================================================================

export async function example15_ConfirmedOnly() {
  const eventDate = '2026-06-15'
  const returnDate = '2026-06-17'

  // Only count confirmed bookings (not pending)
  const availability = await calculateAvailability(eventDate, returnDate, {
    statuses: ['confirmed'],
  })

  console.log('=== Confirmed Bookings Only ===')
  availability.forEach((item) => {
    console.log(`${item.item.name}: ${item.available} available (${item.booked} confirmed)`)
  })

  return availability
}

// ============================================================================
// Example 16: Exclude Current Booking (for editing)
// ============================================================================

export async function example16_ExcludeBooking() {
  const eventDate = '2026-06-15'
  const returnDate = '2026-06-17'
  const currentBookingId = 'booking-123'

  // When editing a booking, exclude it from availability calculation
  const availability = await calculateAvailability(eventDate, returnDate, {
    excludeBookingId: currentBookingId,
  })

  console.log('=== Availability (Excluding Current Booking) ===')
  availability.forEach((item) => {
    console.log(`${item.item.name}: ${item.available} available`)
  })

  return availability
}

// ============================================================================
// Example 17: Include Inactive Items
// ============================================================================

export async function example17_IncludeInactive() {
  const eventDate = '2026-06-15'
  const returnDate = '2026-06-17'

  // Include inactive items in the calculation
  const availability = await calculateAvailability(eventDate, returnDate, {
    includeInactive: true,
  })

  console.log('=== All Items (Including Inactive) ===')
  availability.forEach((item) => {
    const status = item.item.active ? 'Active' : 'Inactive'
    console.log(`${item.item.name} (${status}): ${item.available} available`)
  })

  return availability
}

// ============================================================================
// Example 18: Combined Filters
// ============================================================================

export async function example18_CombinedFilters() {
  const eventDate = '2026-06-15'
  const returnDate = '2026-06-17'

  // Combine multiple filters
  const availability = await calculateAvailability(eventDate, returnDate, {
    categories: ['Seating', 'Tables'],
    statuses: ['confirmed'],
    excludeBookingId: 'booking-123',
  })

  console.log('=== Combined Filters ===')
  console.log('Categories: Seating, Tables')
  console.log('Statuses: Confirmed only')
  console.log('Excluding: booking-123')
  console.log('')

  availability.forEach((item) => {
    console.log(`${item.item.category} - ${item.item.name}: ${item.available} available`)
  })

  return availability
}

// ============================================================================
// Example 19: Build Availability Dashboard
// ============================================================================

export async function example19_DashboardData() {
  const eventDate = '2026-06-15'
  const returnDate = '2026-06-17'

  const [summary, lowStock, highUsage, fullyBooked, conflicts] = await Promise.all([
    getAvailabilitySummary(eventDate, returnDate),
    getLowAvailabilityItems(eventDate, returnDate, 20),
    getHighUtilizationItems(eventDate, returnDate, 80),
    getFullyBookedItems(eventDate, returnDate),
    findConflicts(eventDate, returnDate),
  ])

  console.log('=== Dashboard Data ===')
  console.log(`\nOverview:`)
  console.log(`  Average Utilization: ${summary.averageUtilization}%`)
  console.log(`  Items Fully Booked: ${fullyBooked.length}`)
  console.log(`  Items with Low Stock: ${lowStock.length}`)
  console.log(`  Items with High Usage: ${highUsage.length}`)
  console.log(`  Conflicts: ${conflicts.length}`)

  return {
    summary,
    lowStock,
    highUsage,
    fullyBooked,
    conflicts,
  }
}

// ============================================================================
// Example 20: Real-World Booking Flow
// ============================================================================

export async function example20_CompleteBookingFlow() {
  const eventDate = '2026-06-15'
  const returnDate = '2026-06-17'
  const requestedItems = [
    { item_id: 'chair-id', quantity: 100 },
    { item_id: 'table-id', quantity: 20 },
  ]

  console.log('=== Complete Booking Flow ===\n')

  // Step 1: Check availability
  console.log('Step 1: Checking availability...')
  const availability = await calculateAvailability(eventDate, returnDate)
  console.log(`${availability.length} items available to browse\n`)

  // Step 2: Validate selection
  console.log('Step 2: Validating selection...')
  const validation = await validateBookingAvailability(
    requestedItems,
    eventDate,
    returnDate
  )

  if (!validation.valid) {
    console.log('❌ Validation failed:')
    validation.errors.forEach((error) => console.log(`  - ${error}`))
    return { success: false, errors: validation.errors }
  }

  if (validation.warnings.length > 0) {
    console.log('⚠️  Warnings:')
    validation.warnings.forEach((warning) => console.log(`  - ${warning}`))
  }

  console.log('✅ Validation passed\n')

  // Step 3: Check for conflicts
  console.log('Step 3: Checking for conflicts...')
  const conflicts = await findConflicts(eventDate, returnDate)

  if (conflicts.length > 0) {
    console.log('⚠️  Conflicts detected:')
    conflicts.forEach((c) => console.log(`  - ${c.item.name}`))
    console.log('Admin review required\n')
  } else {
    console.log('✅ No conflicts\n')
  }

  // Step 4: Proceed with booking
  console.log('Step 4: Ready to create booking')
  console.log('All checks passed, proceeding with booking creation...')

  return {
    success: true,
    validation,
    conflicts: conflicts.length,
  }
}
