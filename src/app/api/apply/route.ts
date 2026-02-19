import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const body = await request.json()
    const { references, previousAddresses, ...formData } = body

    // Clean empty strings to null
    const cleanedData = Object.fromEntries(
      Object.entries(formData).map(([k, v]) => [k, v === '' ? null : v])
    )

    // Insert main application
    const { data: application, error: appError } = await supabase
      .from('tenant_applications')
      .insert([cleanedData])
      .select()
      .single()

    if (appError) throw appError

    // Insert references
    if (application && references?.length > 0) {
      const refsToInsert = references
        .filter((ref: any) => ref.reference_name && ref.phone)
        .map((ref: any) => ({ ...ref, application_id: application.id }))

      if (refsToInsert.length > 0) {
        const { error: refError } = await supabase
          .from('application_references')
          .insert(refsToInsert)
        if (refError) throw refError
      }
    }

    // Insert previous addresses
    if (application && previousAddresses?.length > 0) {
      const addrsToInsert = previousAddresses
        .filter((addr: any) => addr.street_address)
        .map((addr: any) => ({ ...addr, application_id: application.id }))

      if (addrsToInsert.length > 0) {
        const { error: addrError } = await supabase
          .from('application_previous_addresses')
          .insert(addrsToInsert)
        if (addrError) throw addrError
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error submitting application:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to submit application' },
      { status: 500 }
    )
  }
}
