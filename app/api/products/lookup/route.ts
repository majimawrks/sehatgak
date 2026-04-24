import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

// GET /api/products/lookup?barcode=8991234567890
// Returns { found: true, id, nama } or { found: false }
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const barcode = searchParams.get('barcode')?.trim()

  if (!barcode || barcode === 'N/A') {
    return NextResponse.json({ error: 'Barcode tidak valid' }, { status: 400 })
  }

  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('products')
    .select('id, nama')
    .eq('barcode', barcode)
    .maybeSingle()

  if (error) {
    console.error('[GET /api/products/lookup]', error.message)
    return NextResponse.json({ error: 'Gagal mencari produk' }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json({ found: false })
  }

  return NextResponse.json({ found: true, id: data.id, nama: data.nama })
}
