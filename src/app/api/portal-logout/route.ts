import { createSupabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const supabase = await createSupabaseServer()
  await supabase.auth.signOut()
  const origin = new URL(req.url).origin
  return NextResponse.redirect(new URL('/portal-login', origin))
}
