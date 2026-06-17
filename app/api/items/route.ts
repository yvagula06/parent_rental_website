import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET all items or single item by ID
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    const supabase = await createClient()

    if (id) {
      // Get single item
      const { data: item, error } = await supabase
        .from('items')
        .select('*')
        .eq('id', id)
        .single()

      if (error || !item) {
        return NextResponse.json(
          { error: 'Item not found' },
          { status: 404 }
        )
      }

      return NextResponse.json(item)
    }

    // Get all items
    const { data: items, error } = await supabase
      .from('items')
      .select('*')
      .order('category')
      .order('name')

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch items' },
        { status: 500 }
      )
    }

    return NextResponse.json(items)
  } catch (error) {
    console.error('Items GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// CREATE new item (admin only)
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      name,
      category,
      description,
      image_url,
      price,
      total_quantity,
      active,
    } = body

    // Validate required fields
    if (!name || !category || price === undefined || total_quantity === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Verify admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, business_id')
      .eq('id', user.id)
      .single()

    if (!profile || !['owner', 'admin', 'staff'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Create item with business_id
    const { data: item, error } = await supabase
      .from('items')
      .insert({
        name,
        category,
        description,
        image_url,
        price,
        total_quantity,
        active: active !== undefined ? active : true,
        business_id: profile.business_id,
      })
      .select()
      .single()

    if (error || !item) {
      console.error('Item creation error:', error)
      return NextResponse.json(
        { error: 'Failed to create item' },
        { status: 500 }
      )
    }

    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    console.error('Items POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
