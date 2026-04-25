import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { productInsertSchema, productRowSchema } from '@/lib/supabase/schema'
import { isAllowedOrigin } from '@/lib/http/origin'
import { z } from 'zod'

// GET /api/products — returns latest 20 products
export async function GET() {
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) {
    console.error('[GET /api/products]', error.message)
    return NextResponse.json({ error: 'Gagal mengambil data produk' }, { status: 500 })
  }

  const parsed = z.array(productRowSchema).safeParse(data)
  if (!parsed.success) {
    console.error('[GET /api/products] parse error', parsed.error)
    return NextResponse.json({ error: 'Format data tidak valid' }, { status: 500 })
  }

  return NextResponse.json(parsed.data)
}

// POST /api/products — saves a new product
export async function POST(request: Request) {
  if (!isAllowedOrigin(request)) {
    return NextResponse.json({ error: 'Origin tidak diizinkan' }, { status: 403 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body tidak valid' }, { status: 400 })
  }

  const parsed = productInsertSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validasi gagal', detail: parsed.error.flatten() },
      { status: 422 }
    )
  }

  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('products')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .insert(parsed.data as any)
    .select()
    .single()

  if (error) {
    console.error('[POST /api/products]', error.message)
    return NextResponse.json({ error: 'Gagal menyimpan produk' }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
