-- Migration: Fix public bookings visibility for admin pages
--
-- Problem: Bookings created from the public /booking page have business_id = NULL.
-- The existing RLS policies only let business members see/update bookings where
-- business_id matches their own, so admins can't see or manage public bookings.
--
-- Fix: Add RLS policies that let authenticated users (admins) see and update
-- bookings (and their booking_items) where business_id IS NULL.
-- In PostgreSQL RLS, if ANY policy matches, the row is accessible (OR logic).

-- Allow authenticated users to also see bookings with no business_id
-- (public bookings created from /booking without a specific business)
CREATE POLICY "Authenticated users can view unassigned bookings"
    ON bookings FOR SELECT
    TO authenticated
    USING (business_id IS NULL);

-- Allow authenticated users to update unassigned bookings
CREATE POLICY "Authenticated users can update unassigned bookings"
    ON bookings FOR UPDATE
    TO authenticated
    USING (business_id IS NULL);

-- Allow authenticated users to see booking_items belonging to unassigned bookings
CREATE POLICY "Authenticated users can view unassigned booking items"
    ON booking_items FOR SELECT
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM bookings b
        WHERE b.id = booking_id
        AND b.business_id IS NULL
    ));
