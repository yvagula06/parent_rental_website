-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('admin', 'customer')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create items table
CREATE TABLE IF NOT EXISTS items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
    total_quantity INTEGER NOT NULL CHECK (total_quantity >= 0),
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    event_address TEXT NOT NULL,
    event_type TEXT NOT NULL,
    event_date DATE NOT NULL,
    return_date DATE NOT NULL,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
    admin_notes TEXT,
    total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT valid_dates CHECK (return_date >= event_date)
);

-- Create booking_items table (junction table for bookings and items)
CREATE TABLE IF NOT EXISTS booking_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES items(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    item_price DECIMAL(10, 2) NOT NULL CHECK (item_price >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT unique_booking_item UNIQUE (booking_id, item_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_items_category ON items(category);
CREATE INDEX IF NOT EXISTS idx_items_active ON items(active);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_event_date ON bookings(event_date);
CREATE INDEX IF NOT EXISTS idx_bookings_return_date ON bookings(return_date);
CREATE INDEX IF NOT EXISTS idx_booking_items_booking_id ON booking_items(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_items_item_id ON booking_items(item_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_items_updated_at BEFORE UPDATE ON items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, role)
    VALUES (NEW.id, NEW.email, 'customer');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to calculate total amount before inserting/updating booking
CREATE OR REPLACE FUNCTION calculate_booking_total()
RETURNS TRIGGER AS $$
DECLARE
    total DECIMAL(10, 2);
BEGIN
    SELECT COALESCE(SUM(quantity * item_price), 0)
    INTO total
    FROM booking_items
    WHERE booking_id = NEW.id;
    
    UPDATE bookings
    SET total_amount = total
    WHERE id = NEW.id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update booking total when booking items change
CREATE TRIGGER update_booking_total_on_insert
    AFTER INSERT ON booking_items
    FOR EACH ROW EXECUTE FUNCTION calculate_booking_total();

CREATE TRIGGER update_booking_total_on_update
    AFTER UPDATE ON booking_items
    FOR EACH ROW EXECUTE FUNCTION calculate_booking_total();

CREATE TRIGGER update_booking_total_on_delete
    AFTER DELETE ON booking_items
    FOR EACH ROW EXECUTE FUNCTION calculate_booking_total();

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_items ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone"
    ON profiles FOR SELECT
    USING (true);

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

-- Items policies (public read, admin write)
CREATE POLICY "Items are viewable by everyone"
    ON items FOR SELECT
    USING (active = true OR EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    ));

CREATE POLICY "Admins can insert items"
    ON items FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    ));

CREATE POLICY "Admins can update items"
    ON items FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    ));

CREATE POLICY "Admins can delete items"
    ON items FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    ));

-- Bookings policies (anyone can create, admins can view/manage all)
CREATE POLICY "Anyone can create bookings"
    ON bookings FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Admins can view all bookings"
    ON bookings FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    ));

CREATE POLICY "Admins can update bookings"
    ON bookings FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    ));

CREATE POLICY "Admins can delete bookings"
    ON bookings FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    ));

-- Booking items policies
CREATE POLICY "Anyone can create booking items"
    ON booking_items FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Booking items are viewable by admins"
    ON booking_items FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    ));

CREATE POLICY "Admins can update booking items"
    ON booking_items FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    ));

CREATE POLICY "Admins can delete booking items"
    ON booking_items FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    ));

-- Insert some sample data for testing (optional)
-- You can comment this out if you don't want sample data

-- Sample items
INSERT INTO items (name, category, description, price, total_quantity, active) VALUES
    ('Folding Chair', 'Seating', 'Standard white folding chair', 2.50, 200, true),
    ('Banquet Table (8ft)', 'Tables', 'Standard 8-foot banquet table', 15.00, 30, true),
    ('Round Table (60")', 'Tables', '60-inch round table, seats 8-10', 20.00, 20, true),
    ('Table Cloth (White)', 'Linens', 'White polyester table cloth', 5.00, 100, true),
    ('Tent (20x20)', 'Tents', '20x20 foot tent with sides', 150.00, 5, true),
    ('Portable Speaker System', 'Audio', 'Bluetooth speaker with microphone', 75.00, 3, true),
    ('Podium', 'Furniture', 'Standing podium for speeches', 25.00, 2, true),
    ('Dance Floor (12x12)', 'Flooring', '12x12 foot portable dance floor', 200.00, 2, true);

-- Note: To create an admin user, you'll need to:
-- 1. Sign up a user through the application
-- 2. Run this SQL in Supabase SQL Editor:
--    UPDATE profiles SET role = 'admin' WHERE email = 'your-admin@email.com';
