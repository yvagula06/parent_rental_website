import { createClient } from '@/lib/supabase/server'
import type { Item } from '@/lib/types/database.types'

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface ItemAvailability {
  item: Item
  available: number
  booked: number
  totalQuantity: number
  utilizationPercent: number
}

export interface DetailedItemAvailability extends ItemAvailability {
  overlappingBookings: OverlappingBooking[]
  conflicts: boolean
}

export interface OverlappingBooking {
  bookingId: string
  customerName: string
  eventDate: string
  returnDate: string
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  quantity: number
}

export interface AvailabilityOptions {
  includeInactive?: boolean
  categories?: string[]
  itemIds?: string[]
  statuses?: ('pending' | 'confirmed' | 'completed' | 'cancelled')[]
  excludeBookingId?: string
  includeBookingDetails?: boolean
  businessId?: string
}

export interface DateRangeAvailability {
  dateRange: {
    eventDate: string
    returnDate: string
  }
  availability: ItemAvailability[]
}

export interface InventoryProjection {
  itemId: string
  itemName: string
  category: string
  totalQuantity: number
  projections: {
    date: string
    available: number
    booked: number
    bookingCount: number
  }[]
}

export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
  availability: ItemAvailability[]
}

// ============================================================================
// Core Availability Functions
// ============================================================================

/**
 * Calculate available inventory for specific dates with flexible options
 * Returns items with their available quantities considering bookings
 * 
 * @param eventDate - Start date of the rental period (YYYY-MM-DD)
 * @param returnDate - End date of the rental period (YYYY-MM-DD)
 * @param options - Optional filtering and configuration options
 * @returns Array of items with availability information
 */
export async function calculateAvailability(
  eventDate: string,
  returnDate: string,
  options: AvailabilityOptions = {}
): Promise<ItemAvailability[]> {
  const {
    includeInactive = false,
    categories,
    itemIds,
    statuses = ['pending', 'confirmed'],
    excludeBookingId,
    businessId,
  } = options

  const supabase = await createClient()

  // Build items query with filters
  let itemsQuery = supabase
    .from('items')
    .select('*')
    .order('category')
    .order('name')

  if (!includeInactive) {
    itemsQuery = itemsQuery.eq('active', true)
  }

  if (categories && categories.length > 0) {
    itemsQuery = itemsQuery.in('category', categories)
  }

  if (itemIds && itemIds.length > 0) {
    itemsQuery = itemsQuery.in('id', itemIds)
  }

  if (businessId) {
    itemsQuery = itemsQuery.eq('business_id', businessId)
  }

  const { data: items, error: itemsError } = await itemsQuery

  if (itemsError || !items) {
    throw new Error('Failed to fetch items')
  }

  // Get overlapping bookings
  // A booking overlaps if:
  // - The booking's event_date is before or on the requested return_date
  // - The booking's return_date is after or on the requested event_date
  let bookingsQuery = supabase
    .from('bookings')
    .select(`
      id,
      event_date,
      return_date,
      status,
      booking_items (
        item_id,
        quantity
      )
    `)
    .lte('event_date', returnDate)
    .gte('return_date', eventDate)
    .in('status', statuses)

  if (excludeBookingId) {
    bookingsQuery = bookingsQuery.neq('id', excludeBookingId)
  }

  const { data: overlappingBookings, error: bookingsError } = await bookingsQuery

  if (bookingsError) {
    throw new Error('Failed to fetch bookings')
  }

  // Calculate availability for each item
  const availability: ItemAvailability[] = items.map((item) => {
    let bookedQuantity = 0

    // Sum up all quantities for this item from overlapping bookings
    if (overlappingBookings) {
      overlappingBookings.forEach((booking) => {
        booking.booking_items?.forEach((bookingItem: any) => {
          if (bookingItem.item_id === item.id) {
            bookedQuantity += bookingItem.quantity
          }
        })
      })
    }

    const available = Math.max(0, item.total_quantity - bookedQuantity)
    const utilizationPercent = item.total_quantity > 0 
      ? Math.round((bookedQuantity / item.total_quantity) * 100)
      : 0

    return {
      item,
      available,
      booked: bookedQuantity,
      totalQuantity: item.total_quantity,
      utilizationPercent,
    }
  })

  return availability
}

/**
 * Get detailed availability including which bookings are overlapping
 * Useful for conflict resolution and detailed reporting
 * 
 * @param eventDate - Start date of the rental period
 * @param returnDate - End date of the rental period
 * @param options - Optional filtering and configuration options
 * @returns Array of items with detailed booking information
 */
export async function calculateDetailedAvailability(
  eventDate: string,
  returnDate: string,
  options: AvailabilityOptions = {}
): Promise<DetailedItemAvailability[]> {
  const {
    includeInactive = false,
    categories,
    itemIds,
    statuses = ['pending', 'confirmed'],
    excludeBookingId,
  } = options

  const supabase = await createClient()

  // Build items query
  let itemsQuery = supabase
    .from('items')
    .select('*')
    .order('category')
    .order('name')

  if (!includeInactive) {
    itemsQuery = itemsQuery.eq('active', true)
  }

  if (categories && categories.length > 0) {
    itemsQuery = itemsQuery.in('category', categories)
  }

  if (itemIds && itemIds.length > 0) {
    itemsQuery = itemsQuery.in('id', itemIds)
  }

  const { data: items, error: itemsError } = await itemsQuery

  if (itemsError || !items) {
    throw new Error('Failed to fetch items')
  }

  // Get overlapping bookings with customer info
  let bookingsQuery = supabase
    .from('bookings')
    .select(`
      id,
      customer_name,
      event_date,
      return_date,
      status,
      booking_items (
        item_id,
        quantity
      )
    `)
    .lte('event_date', returnDate)
    .gte('return_date', eventDate)
    .in('status', statuses)

  if (excludeBookingId) {
    bookingsQuery = bookingsQuery.neq('id', excludeBookingId)
  }

  const { data: overlappingBookings, error: bookingsError } = await bookingsQuery

  if (bookingsError) {
    throw new Error('Failed to fetch bookings')
  }

  // Calculate detailed availability for each item
  const availability: DetailedItemAvailability[] = items.map((item) => {
    const overlappingForItem: OverlappingBooking[] = []
    let bookedQuantity = 0

    if (overlappingBookings) {
      overlappingBookings.forEach((booking) => {
        booking.booking_items?.forEach((bookingItem: any) => {
          if (bookingItem.item_id === item.id) {
            bookedQuantity += bookingItem.quantity
            overlappingForItem.push({
              bookingId: booking.id,
              customerName: booking.customer_name,
              eventDate: booking.event_date,
              returnDate: booking.return_date,
              status: booking.status as any,
              quantity: bookingItem.quantity,
            })
          }
        })
      })
    }

    const available = Math.max(0, item.total_quantity - bookedQuantity)
    const utilizationPercent = item.total_quantity > 0 
      ? Math.round((bookedQuantity / item.total_quantity) * 100)
      : 0

    return {
      item,
      available,
      booked: bookedQuantity,
      totalQuantity: item.total_quantity,
      utilizationPercent,
      overlappingBookings: overlappingForItem,
      conflicts: available < 0 || bookedQuantity > item.total_quantity,
    }
  })

  return availability
}

// ============================================================================
// Specific Item Functions
// ============================================================================

/**
 * Check if a specific quantity of items is available for the given dates
 * 
 * @param itemId - ID of the item to check
 * @param quantity - Quantity needed
 * @param eventDate - Start date
 * @param returnDate - End date
 * @param options - Optional configuration
 * @returns True if available, false otherwise
 */
export async function isAvailable(
  itemId: string,
  quantity: number,
  eventDate: string,
  returnDate: string,
  options: AvailabilityOptions = {}
): Promise<boolean> {
  const availability = await calculateAvailability(eventDate, returnDate, {
    ...options,
    itemIds: [itemId],
  })
  
  const itemAvailability = availability.find((a) => a.item.id === itemId)

  if (!itemAvailability) {
    return false
  }

  return itemAvailability.available >= quantity
}

/**
 * Get availability for a single item
 * 
 * @param itemId - ID of the item
 * @param eventDate - Start date
 * @param returnDate - End date
 * @param options - Optional configuration
 * @returns Availability information for the item
 */
export async function getItemAvailability(
  itemId: string,
  eventDate: string,
  returnDate: string,
  options: AvailabilityOptions = {}
): Promise<ItemAvailability | null> {
  const availability = await calculateAvailability(eventDate, returnDate, {
    ...options,
    itemIds: [itemId],
  })
  
  return availability.find((a) => a.item.id === itemId) || null
}

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validate an entire booking's items against availability
 * Includes warnings for high utilization and detailed error messages
 * 
 * @param items - Array of items with quantities to validate
 * @param eventDate - Start date
 * @param returnDate - End date
 * @param options - Optional configuration
 * @returns Validation result with errors, warnings, and availability data
 */
export async function validateBookingAvailability(
  items: { item_id: string; quantity: number }[],
  eventDate: string,
  returnDate: string,
  options: AvailabilityOptions = {}
): Promise<ValidationResult> {
  const availability = await calculateAvailability(eventDate, returnDate, options)
  const errors: string[] = []
  const warnings: string[] = []

  for (const requestedItem of items) {
    const itemAvailability = availability.find((a) => a.item.id === requestedItem.item_id)

    if (!itemAvailability) {
      errors.push(`Item not found: ${requestedItem.item_id}`)
      continue
    }

    // Check availability
    if (itemAvailability.available < requestedItem.quantity) {
      errors.push(
        `${itemAvailability.item.name}: Only ${itemAvailability.available} available (requested ${requestedItem.quantity})`
      )
    } else if (itemAvailability.available === requestedItem.quantity) {
      // Warn if requesting all available inventory
      warnings.push(
        `${itemAvailability.item.name}: Requesting all ${requestedItem.quantity} available units (100% utilization)`
      )
    } else if (requestedItem.quantity / itemAvailability.totalQuantity > 0.8) {
      // Warn if high utilization
      const newUtilization = Math.round(
        ((itemAvailability.booked + requestedItem.quantity) / itemAvailability.totalQuantity) * 100
      )
      warnings.push(
        `${itemAvailability.item.name}: High utilization (${newUtilization}% if booked)`
      )
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    availability,
  }
}

// ============================================================================
// Multi-Date Range Functions
// ============================================================================

/**
 * Calculate availability for multiple date ranges at once
 * Useful for comparing availability across different potential booking dates
 * 
 * @param dateRanges - Array of date ranges to check
 * @param options - Optional configuration
 * @returns Array of availability results for each date range
 */
export async function calculateMultiDateAvailability(
  dateRanges: { eventDate: string; returnDate: string }[],
  options: AvailabilityOptions = {}
): Promise<DateRangeAvailability[]> {
  const results: DateRangeAvailability[] = []

  for (const range of dateRanges) {
    const availability = await calculateAvailability(
      range.eventDate,
      range.returnDate,
      options
    )
    results.push({
      dateRange: range,
      availability,
    })
  }

  return results
}

/**
 * Find the date range with the best availability for requested items
 * 
 * @param dateRanges - Array of potential date ranges
 * @param requestedItems - Items and quantities needed
 * @param options - Optional configuration
 * @returns Best date range or null if none work
 */
export async function findBestAvailability(
  dateRanges: { eventDate: string; returnDate: string }[],
  requestedItems: { item_id: string; quantity: number }[],
  options: AvailabilityOptions = {}
): Promise<{
  dateRange: { eventDate: string; returnDate: string } | null
  availability: ItemAvailability[] | null
  score: number
}> {
  let bestScore = -1
  let bestRange: { eventDate: string; returnDate: string } | null = null
  let bestAvailability: ItemAvailability[] | null = null

  for (const range of dateRanges) {
    const validation = await validateBookingAvailability(
      requestedItems,
      range.eventDate,
      range.returnDate,
      options
    )

    if (validation.valid) {
      // Calculate score based on available surplus
      let score = 0
      for (const requestedItem of requestedItems) {
        const itemAvailability = validation.availability.find(
          (a) => a.item.id === requestedItem.item_id
        )
        if (itemAvailability) {
          score += itemAvailability.available - requestedItem.quantity
        }
      }

      if (score > bestScore) {
        bestScore = score
        bestRange = range
        bestAvailability = validation.availability
      }
    }
  }

  return {
    dateRange: bestRange,
    availability: bestAvailability,
    score: bestScore,
  }
}

// ============================================================================
// Inventory Projection Functions
// ============================================================================

/**
 * Project inventory availability across multiple dates
 * Useful for visualizing utilization trends and planning
 * 
 * @param itemIds - Array of item IDs to project (empty for all items)
 * @param dates - Array of dates to check (YYYY-MM-DD)
 * @param options - Optional configuration
 * @returns Array of projections per item
 */
export async function projectInventory(
  itemIds: string[],
  dates: string[],
  options: AvailabilityOptions = {}
): Promise<InventoryProjection[]> {
  const supabase = await createClient()

  // Get items
  let itemsQuery = supabase.from('items').select('*').eq('active', true)

  if (itemIds.length > 0) {
    itemsQuery = itemsQuery.in('id', itemIds)
  }

  const { data: items, error: itemsError } = await itemsQuery

  if (itemsError || !items) {
    throw new Error('Failed to fetch items')
  }

  const projections: InventoryProjection[] = []

  for (const item of items) {
    const itemProjection: InventoryProjection = {
      itemId: item.id,
      itemName: item.name,
      category: item.category,
      totalQuantity: item.total_quantity,
      projections: [],
    }

    for (const date of dates) {
      // For each date, check availability for that single day
      const availability = await calculateAvailability(date, date, {
        ...options,
        itemIds: [item.id],
      })

      const itemAvailability = availability.find((a) => a.item.id === item.id)

      if (itemAvailability) {
        // Count number of bookings on this date
        const detailed = await calculateDetailedAvailability(date, date, {
          ...options,
          itemIds: [item.id],
        })
        const detailedItem = detailed.find((a) => a.item.id === item.id)

        itemProjection.projections.push({
          date,
          available: itemAvailability.available,
          booked: itemAvailability.booked,
          bookingCount: detailedItem?.overlappingBookings.length || 0,
        })
      }
    }

    projections.push(itemProjection)
  }

  return projections
}

// ============================================================================
// Conflict Detection Functions
// ============================================================================

/**
 * Find all booking conflicts for a date range
 * Returns items that are over-booked
 * 
 * @param eventDate - Start date
 * @param returnDate - End date
 * @param options - Optional configuration
 * @returns Array of items with conflicts
 */
export async function findConflicts(
  eventDate: string,
  returnDate: string,
  options: AvailabilityOptions = {}
): Promise<DetailedItemAvailability[]> {
  const availability = await calculateDetailedAvailability(
    eventDate,
    returnDate,
    options
  )

  return availability.filter((item) => item.conflicts)
}

/**
 * Get all bookings that conflict with each other in a date range
 * 
 * @param eventDate - Start date
 * @param returnDate - End date
 * @param options - Optional configuration
 * @returns Map of item IDs to conflicting bookings
 */
export async function getConflictingBookings(
  eventDate: string,
  returnDate: string,
  options: AvailabilityOptions = {}
): Promise<Map<string, OverlappingBooking[]>> {
  const conflicts = await findConflicts(eventDate, returnDate, options)
  const conflictMap = new Map<string, OverlappingBooking[]>()

  conflicts.forEach((conflict) => {
    conflictMap.set(conflict.item.id, conflict.overlappingBookings)
  })

  return conflictMap
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get items with low availability (below threshold)
 * 
 * @param eventDate - Start date
 * @param returnDate - End date
 * @param threshold - Percentage threshold (0-100)
 * @param options - Optional configuration
 * @returns Array of items below threshold
 */
export async function getLowAvailabilityItems(
  eventDate: string,
  returnDate: string,
  threshold: number = 20,
  options: AvailabilityOptions = {}
): Promise<ItemAvailability[]> {
  const availability = await calculateAvailability(eventDate, returnDate, options)
  
  return availability.filter((item) => {
    const availablePercent = (item.available / item.totalQuantity) * 100
    return availablePercent <= threshold
  })
}

/**
 * Get items with high utilization (above threshold)
 * 
 * @param eventDate - Start date
 * @param returnDate - End date
 * @param threshold - Percentage threshold (0-100)
 * @param options - Optional configuration
 * @returns Array of items above threshold
 */
export async function getHighUtilizationItems(
  eventDate: string,
  returnDate: string,
  threshold: number = 80,
  options: AvailabilityOptions = {}
): Promise<ItemAvailability[]> {
  const availability = await calculateAvailability(eventDate, returnDate, options)
  
  return availability.filter((item) => item.utilizationPercent >= threshold)
}

/**
 * Get items with zero availability
 * 
 * @param eventDate - Start date
 * @param returnDate - End date
 * @param options - Optional configuration
 * @returns Array of fully booked items
 */
export async function getFullyBookedItems(
  eventDate: string,
  returnDate: string,
  options: AvailabilityOptions = {}
): Promise<ItemAvailability[]> {
  const availability = await calculateAvailability(eventDate, returnDate, options)
  
  return availability.filter((item) => item.available === 0)
}

/**
 * Get summary statistics for inventory availability
 * 
 * @param eventDate - Start date
 * @param returnDate - End date
 * @param options - Optional configuration
 * @returns Summary statistics
 */
export async function getAvailabilitySummary(
  eventDate: string,
  returnDate: string,
  options: AvailabilityOptions = {}
): Promise<{
  totalItems: number
  fullyAvailable: number
  partiallyAvailable: number
  fullyBooked: number
  averageUtilization: number
  highUtilization: number
  lowAvailability: number
}> {
  const availability = await calculateAvailability(eventDate, returnDate, options)

  const fullyAvailable = availability.filter((a) => a.booked === 0).length
  const fullyBooked = availability.filter((a) => a.available === 0).length
  const partiallyAvailable = availability.length - fullyAvailable - fullyBooked
  const highUtilization = availability.filter((a) => a.utilizationPercent >= 80).length
  const lowAvailability = availability.filter((a) => {
    const availablePercent = (a.available / a.totalQuantity) * 100
    return availablePercent <= 20 && availablePercent > 0
  }).length

  const avgUtilization = availability.length > 0
    ? Math.round(
        availability.reduce((sum, a) => sum + a.utilizationPercent, 0) / availability.length
      )
    : 0

  return {
    totalItems: availability.length,
    fullyAvailable,
    partiallyAvailable,
    fullyBooked,
    averageUtilization: avgUtilization,
    highUtilization,
    lowAvailability,
  }
}

// ============================================================================
// Backward Compatibility
// ============================================================================

/**
 * Legacy function signature support
 * @deprecated Use calculateAvailability with options object instead
 */
export async function calculateAvailabilityLegacy(
  eventDate: string,
  returnDate: string,
  excludeBookingId?: string
): Promise<ItemAvailability[]> {
  return calculateAvailability(eventDate, returnDate, { excludeBookingId })
}

