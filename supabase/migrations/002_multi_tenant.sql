-- Multi-Tenant Migration
-- Adds businesses table and business_id to existing tables

-- ============================================
-- BUSINESSES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS businesses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    logo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_businesses_slug ON businesses(slug);

-- ============================================
-- UPDATE PROFILES TABLE
-- ============================================
-- Add business_id and full_name to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id) ON DELETE SET NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS full_name TEXT;

-- Update role check to include new roles
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('owner', 'admin', 'staff', 'customer'));

CREATE INDEX IF NOT EXISTS idx_profiles_business_id ON profiles(business_id);

-- ============================================
-- UPDATE ITEMS TABLE
-- ============================================
ALTER TABLE items ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_items_business_id ON items(business_id);

-- ============================================
-- UPDATE BOOKINGS TABLE
-- ============================================
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS estimated_total DECIMAL(10, 2) DEFAULT 0 CHECK (estimated_total >= 0);
CREATE INDEX IF NOT EXISTS idx_bookings_business_id ON bookings(business_id);

-- ============================================
-- DROP OLD RLS POLICIES
-- ============================================
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Items are viewable by everyone" ON items;
DROP POLICY IF EXISTS "Admins can insert items" ON items;
DROP POLICY IF EXISTS "Admins can update items" ON items;
DROP POLICY IF EXISTS "Admins can delete items" ON items;
DROP POLICY IF EXISTS "Anyone can create bookings" ON bookings;
DROP POLICY IF EXISTS "Admins can view all bookings" ON bookings;
DROP POLICY IF EXISTS "Admins can update bookings" ON bookings;
DROP POLICY IF EXISTS "Admins can delete bookings" ON bookings;
DROP POLICY IF EXISTS "Anyone can create booking items" ON booking_items;
DROP POLICY IF EXISTS "Booking items are viewable by admins" ON booking_items;
DROP POLICY IF EXISTS "Admins can update booking items" ON booking_items;
DROP POLICY IF EXISTS "Admins can delete booking items" ON booking_items;

-- ============================================
-- NEW RLS POLICIES - Multi-tenant
-- ============================================

-- Helper function to get current user's business_id
CREATE OR REPLACE FUNCTION get_user_business_id()
RETURNS UUID AS $$
DECLARE
    biz_id UUID;
BEGIN
    SELECT business_id INTO biz_id FROM profiles WHERE id = auth.uid();
    RETURN biz_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user has role in their business
CREATE OR REPLACE FUNCTION user_has_role(required_roles TEXT[])
RETURNS BOOLEAN AS $$
DECLARE
    user_role TEXT;
BEGIN
    SELECT role INTO user_role FROM profiles WHERE id = auth.uid();
    RETURN user_role = ANY(required_roles);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- BUSINESSES RLS
-- ============================================
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;

-- Anyone can read businesses (for public booking pages)
CREATE POLICY "Businesses are publicly readable"
    ON businesses FOR SELECT
    USING (true);

-- Only authenticated owner/admin can update their business
CREATE POLICY "Business owners can update their business"
    ON businesses FOR UPDATE
    USING (id = get_user_business_id() AND user_has_role(ARRAY['owner', 'admin']));

-- ============================================
-- PROFILES RLS
-- ============================================
-- Users can read their own profile
CREATE POLICY "Users can read own profile"
    ON profiles FOR SELECT
    USING (id = auth.uid());

-- Users in same business can read each other's profiles
CREATE POLICY "Business members can read profiles"
    ON profiles FOR SELECT
    USING (business_id = get_user_business_id() AND get_user_business_id() IS NOT NULL);

-- Users can update own profile
CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (id = auth.uid());

-- ============================================
-- ITEMS RLS
-- ============================================
-- Public can read active items for any business
CREATE POLICY "Public can read active items"
    ON items FOR SELECT
    USING (active = true);

-- Business members can read all items for their business
CREATE POLICY "Business members can read their items"
    ON items FOR SELECT
    USING (business_id = get_user_business_id() AND get_user_business_id() IS NOT NULL);

-- Business staff can insert items
CREATE POLICY "Business members can insert items"
    ON items FOR INSERT
    WITH CHECK (business_id = get_user_business_id() AND user_has_role(ARRAY['owner', 'admin', 'staff']));

-- Business staff can update items
CREATE POLICY "Business members can update items"
    ON items FOR UPDATE
    USING (business_id = get_user_business_id() AND user_has_role(ARRAY['owner', 'admin', 'staff']));

-- Business staff can delete items
CREATE POLICY "Business members can delete items"
    ON items FOR DELETE
    USING (business_id = get_user_business_id() AND user_has_role(ARRAY['owner', 'admin', 'staff']));

-- ============================================
-- BOOKINGS RLS
-- ============================================
-- Anyone can create bookings (public booking forms)
CREATE POLICY "Anyone can create bookings"
    ON bookings FOR INSERT
    WITH CHECK (true);

-- Business members can view their bookings
CREATE POLICY "Business members can view bookings"
    ON bookings FOR SELECT
    USING (business_id = get_user_business_id() AND get_user_business_id() IS NOT NULL);

-- Customers can view their own booking by ID (for confirmation page)
CREATE POLICY "Customers can view own booking"
    ON bookings FOR SELECT
    USING (auth.uid() IS NULL); -- Allow public access by ID for confirmation lookup

-- Business members can update bookings
CREATE POLICY "Business members can update bookings"
    ON bookings FOR UPDATE
    USING (business_id = get_user_business_id() AND user_has_role(ARRAY['owner', 'admin', 'staff']));

-- Business members can delete bookings
CREATE POLICY "Business members can delete bookings"
    ON bookings FOR DELETE
    USING (business_id = get_user_business_id() AND user_has_role(ARRAY['owner', 'admin', 'staff']));

-- ============================================
-- BOOKING ITEMS RLS
-- ============================================
-- Anyone can create booking items (public booking forms)
CREATE POLICY "Anyone can create booking items"
    ON booking_items FOR INSERT
    WITH CHECK (true);

-- Business members can view their booking items
CREATE POLICY "Business members can view booking items"
    ON booking_items FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM bookings b
        WHERE b.id = booking_id
        AND b.business_id = get_user_business_id()
    ));

-- Business members can update booking items
CREATE POLICY "Business members can update booking items"
    ON booking_items FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM bookings b
        WHERE b.id = booking_id
        AND b.business_id = get_user_business_id()
        AND user_has_role(ARRAY['owner', 'admin', 'staff'])
    ));

-- Business members can delete booking items
CREATE POLICY "Business members can delete booking items"
    ON booking_items FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM bookings b
        WHERE b.id = booking_id
        AND b.business_id = get_user_business_id()
        AND user_has_role(ARRAY['owner', 'admin', 'staff'])
    ));

-- ============================================
-- UPDATE AUTO-PROFILE TRIGGER
-- ============================================
-- Update the handle_new_user function to include full_name
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, role, full_name)
    VALUES (NEW.id, NEW.email, 'customer', NEW.raw_user_meta_data ->> 'full_name');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- SEED A DEFAULT BUSINESS
-- ============================================
-- This creates a default business for existing data
INSERT INTO businesses (id, name, slug, email, phone, address)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Premium Event Rentals',
    'premium-event-rentals',
    'rentals@example.com',
    '(555) 123-4567',
    '123 Main Street, Anytown, USA'
)
ON CONFLICT (slug) DO NOTHING;

-- Update existing profiles to use default business (skip if already set)
UPDATE profiles SET business_id = '00000000-0000-0000-0000-000000000001' WHERE business_id IS NULL;

-- Update existing items to use default business (skip if already set)
UPDATE items SET business_id = '00000000-0000-0000-0000-000000000001' WHERE business_id IS NULL;

-- Update existing bookings to use default business (skip if already set)
UPDATE bookings SET business_id = '00000000-0000-0000-0000-000000000001' WHERE business_id IS NULL;