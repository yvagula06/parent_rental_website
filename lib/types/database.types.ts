export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      businesses: {
        Row: {
          id: string
          name: string
          slug: string
          email: string
          phone: string | null
          address: string | null
          logo_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          email: string
          phone?: string | null
          address?: string | null
          logo_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          email?: string
          phone?: string | null
          address?: string | null
          logo_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          business_id: string | null
          email: string
          full_name: string | null
          role: 'owner' | 'admin' | 'staff' | 'customer'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          business_id?: string | null
          email: string
          full_name?: string | null
          role?: 'owner' | 'admin' | 'staff' | 'customer'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          business_id?: string | null
          email?: string
          full_name?: string | null
          role?: 'owner' | 'admin' | 'staff' | 'customer'
          created_at?: string
          updated_at?: string
        }
      }
      items: {
        Row: {
          id: string
          business_id: string | null
          name: string
          category: string
          description: string | null
          image_url: string | null
          price: number
          total_quantity: number
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_id?: string | null
          name: string
          category: string
          description?: string | null
          image_url?: string | null
          price: number
          total_quantity: number
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          business_id?: string | null
          name?: string
          category?: string
          description?: string | null
          image_url?: string | null
          price?: number
          total_quantity?: number
          active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      bookings: {
        Row: {
          id: string
          business_id: string | null
          customer_name: string
          phone: string
          email: string
          event_address: string
          event_type: string
          event_date: string
          return_date: string
          notes: string | null
          admin_notes: string | null
          status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
          estimated_total: number
          total_amount: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_id?: string | null
          customer_name: string
          phone: string
          email: string
          event_address: string
          event_type: string
          event_date: string
          return_date: string
          notes?: string | null
          admin_notes?: string | null
          status?: 'pending' | 'confirmed' | 'completed' | 'cancelled'
          estimated_total?: number
          total_amount?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          business_id?: string | null
          customer_name?: string
          phone?: string
          email?: string
          event_address?: string
          event_type?: string
          event_date?: string
          return_date?: string
          notes?: string | null
          admin_notes?: string | null
          status?: 'pending' | 'confirmed' | 'completed' | 'cancelled'
          estimated_total?: number
          total_amount?: number
          created_at?: string
          updated_at?: string
        }
      }
      booking_items: {
        Row: {
          id: string
          booking_id: string
          item_id: string
          quantity: number
          item_price: number
          created_at: string
        }
        Insert: {
          id?: string
          booking_id: string
          item_id: string
          quantity: number
          item_price: number
          created_at?: string
        }
        Update: {
          id?: string
          booking_id?: string
          item_id?: string
          quantity?: number
          item_price?: number
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Type helpers
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Inserts<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type Updates<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Specific types for easier use
export type Business = Tables<'businesses'>
export type Profile = Tables<'profiles'>
export type Item = Tables<'items'>
export type Booking = Tables<'bookings'>
export type BookingItem = Tables<'booking_items'>

// Extended types with relations
export type BookingWithItems = Booking & {
  booking_items: (BookingItem & {
    items: Item
  })[]
}

export type BookingItemWithItem = BookingItem & {
  items: Item
}
