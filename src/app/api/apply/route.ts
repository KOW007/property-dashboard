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

    // Clean empty strings to null, convert numeric strings to numbers
    const cleanedData = Object.fromEntries(
      Object.entries(formData).map(([k, v]) => {
        if (v === '' || v === null || v === undefined) return [k, null]
        // If it's a string that looks like a number, convert it
        if (typeof v === 'string' && v.trim() !== '' && !isNaN(Number(v))) {
          return [k, Number(v)]
        }
        return [k, v]
      })
    )

    // Log cleaned data to find any remaining empty strings
    const problematic = Object.entries(cleanedData).filter(([k, v]) => v === '')
    if (problematic.length > 0) {
      console.error('Fields still empty strings after cleaning:', problematic.map(([k]) => k))
    }
    console.log('Cleaned data:', JSON.stringify(cleanedData))

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
        .map((ref: any) => {
          const cleaned = Object.fromEntries(
            Object.entries(ref).map(([k, v]) => {
              if (v === '' || v === null || v === undefined) return [k, null]
              if (typeof v === 'string' && v.trim() !== '' && !isNaN(Number(v))) return [k, Number(v)]
              return [k, v]
            })
          )
          return { ...cleaned, application_id: application.id }
        })

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
        .map((addr: any) => {
          const cleaned = Object.fromEntries(
            Object.entries(addr).map(([k, v]) => {
              if (v === '' || v === null || v === undefined) return [k, null]
              if (typeof v === 'string' && v.trim() !== '' && !isNaN(Number(v))) return [k, Number(v)]
              return [k, v]
            })
          )
          return { ...cleaned, application_id: application.id }
        })

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
