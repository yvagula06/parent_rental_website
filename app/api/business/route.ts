import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET business for current admin user
export async function GET(request: Request) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('business_id, role')
      .eq('id', user.id)
      .single()

    if (!profile || !profile.business_id) {
      return NextResponse.json({ error: 'No business found for this user' }, { status: 404 })
    }

    const { data: business, error } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', profile.business_id)
      .single()

    if (error || !business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    return NextResponse.json(business)
  } catch (error) {
    console.error('Business GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH - Update business settings (owner/admin only)
export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { name, slug, email, phone, address, logo_url } = body

    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('business_id, role')
      .eq('id', user.id)
      .single()

    if (!profile || !['owner', 'admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Business ID is required' }, { status: 400 })
    }

    // Ensure user's business_id matches
    if (profile.business_id !== id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data: business, error } = await supabase
      .from('businesses')
      .update({
        name,
        slug,
        email,
        phone,
        address,
        logo_url,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error || !business) {
      console.error('Business update error:', error)
      return NextResponse.json({ error: 'Failed to update business' }, { status: 500 })
    }

    return NextResponse.json(business)
  } catch (error) {
    console.error('Business PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}