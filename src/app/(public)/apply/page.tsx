'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function TenantApplicationForm() {
  const [formData, setFormData] = useState({
    // Personal Info
    first_name: '',
    middle_name: '',
    last_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    ssn: '',
    
    // Government ID
    gov_id_type: 'drivers_license',
    gov_id_number: '',
    gov_id_issuing_state: '',
    gov_id_expiration_date: '',
    
    // Current Address
    current_street_address: '',
    current_city: '',
    current_state: '',
    current_zip: '',
    current_move_in_date: '',
    current_monthly_rent: '',
    current_landlord_name: '',
    current_landlord_phone: '',
    reason_for_moving: '',
    
    // Employment
    employer_name: '',
    employer_phone: '',
    employer_address: '',
    job_title: '',
    employment_start_date: '',
    monthly_income: '',
    supervisor_name: '',
    supervisor_phone: '',
    
    // Additional Income
    additional_income_source: '',
    additional_income_amount: '',
    
    // Emergency Contact
    emergency_contact_name: '',
    emergency_contact_relationship: '',
    emergency_contact_phone: '',
    
    // Dependents
    number_of_dependents: 0,
    dependents_details: '',
    
    // Pets
    has_pets: false,
    pet_details: '',
    
    // Vehicles
    vehicle_1_make: '',
    vehicle_1_model: '',
    vehicle_1_year: '',
    vehicle_1_color: '',
    vehicle_1_license_plate: '',
    vehicle_1_state: '',
    
    // Background Questions
    ever_evicted: false,
    eviction_details: '',
    ever_convicted: false,
    conviction_details: '',
    ever_sued_landlord: false,
    lawsuit_details: '',
    has_waterbed_or_aquarium: false,
    waterbed_aquarium_details: '',
    is_smoker: false,
    bankruptcy_filed: false,
    bankruptcy_details: '',
  })

  const [references, setReferences] = useState([
    { reference_name: '', relationship: '', phone: '', email: '' },
    { reference_name: '', relationship: '', phone: '', email: '' },
  ])

  const [previousAddresses, setPreviousAddresses] = useState([
    { street_address: '', city: '', state: '', zip: '', move_in_date: '', move_out_date: '', monthly_rent: '', landlord_name: '', landlord_phone: '' }
  ])

  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleReferenceChange = (index: number, field: string, value: string) => {
    const updated = [...references]
    updated[index] = { ...updated[index], [field]: value }
    setReferences(updated)
  }

  const handlePreviousAddressChange = (index: number, field: string, value: string) => {
    const updated = [...previousAddresses]
    updated[index] = { ...updated[index], [field]: value }
    setPreviousAddresses(updated)
  }

  const addPreviousAddress = () => {
    setPreviousAddresses([...previousAddresses, { 
      street_address: '', city: '', state: '', zip: '', 
      move_in_date: '', move_out_date: '', monthly_rent: '', 
      landlord_name: '', landlord_phone: '' 
    }])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      // Convert all empty strings to null so Postgres doesn't reject them
      const cleanedData = Object.fromEntries(
        Object.entries(formData).map(([k, v]) => [k, v === '' ? null : v])
      ) as typeof formData

      // Insert main application
      const { data: application, error: appError } = await supabase
        .from('tenant_applications')
        .insert([cleanedData])
        .select()
        .single()

      if (appError) throw appError

      // Insert references
      if (application) {
        const refsToInsert = references
          .filter(ref => ref.reference_name && ref.phone)
          .map(ref => ({ ...ref, application_id: application.id }))
        
        if (refsToInsert.length > 0) {
          await supabase.from('application_references').insert(refsToInsert)
        }

        // Insert previous addresses
        const addrsToInsert = previousAddresses
          .filter(addr => addr.street_address)
          .map(addr => ({ ...addr, application_id: application.id }))
        
        if (addrsToInsert.length > 0) {
          await supabase.from('application_previous_addresses').insert(addrsToInsert)
        }
      }

      setSubmitted(true)
    } catch (error: any) {
      console.error('Error submitting application:', error)
      alert(`Error submitting application: ${error?.message || JSON.stringify(error)}`)
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Application Submitted!</h2>
          <p className="text-gray-600 mb-6">
            Thank you for applying. We'll review your application and get back to you soon.
          </p>
          <Link href="/" className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
            Back to Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link href="/" className="text-blue-600 hover:text-blue-800 text-sm mb-2 inline-block">
            ← Back
          </Link>
          <h1 className="text-4xl font-bold text-gray-900">Rental Application</h1>
          <p className="text-gray-600 mt-2">Please fill out all sections completely and honestly</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Personal Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Personal Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                <input
                  type="text"
                  name="first_name"
                  required
                  value={formData.first_name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Middle Name</label>
                <input
                  type="text"
                  name="middle_name"
                  value={formData.middle_name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                <input
                  type="text"
                  name="last_name"
                  required
                  value={formData.last_name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                <input
                  type="tel"
                  name="phone"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth *</label>
                <input
                  type="date"
                  name="date_of_birth"
                  required
                  value={formData.date_of_birth}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Social Security Number *</label>
                <input
                  type="text"
                  name="ssn"
                  required
                  placeholder="XXX-XX-XXXX"
                  value={formData.ssn}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
          </div>

          {/* Government ID */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Government Issued ID</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ID Type *</label>
                <select
                  name="gov_id_type"
                  required
                  value={formData.gov_id_type}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="drivers_license">Driver's License</option>
                  <option value="state_id">State ID</option>
                  <option value="passport">Passport</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ID Number *</label>
                <input
                  type="text"
                  name="gov_id_number"
                  required
                  value={formData.gov_id_number}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Issuing State/Territory *</label>
                <input
                  type="text"
                  name="gov_id_issuing_state"
                  required
                  value={formData.gov_id_issuing_state}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expiration Date</label>
                <input
                  type="date"
                  name="gov_id_expiration_date"
                  value={formData.gov_id_expiration_date}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
          </div>

          {/* Current Residence */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Current Residence</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Street Address *</label>
                <input
                  type="text"
                  name="current_street_address"
                  required
                  value={formData.current_street_address}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                  <input
                    type="text"
                    name="current_city"
                    required
                    value={formData.current_city}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                  <input
                    type="text"
                    name="current_state"
                    required
                    value={formData.current_state}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ZIP *</label>
                  <input
                    type="text"
                    name="current_zip"
                    required
                    value={formData.current_zip}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Move-in Date *</label>
                  <input
                    type="date"
                    name="current_move_in_date"
                    required
                    value={formData.current_move_in_date}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Rent *</label>
                  <input
                    type="number"
                    name="current_monthly_rent"
                    required
                    value={formData.current_monthly_rent}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Landlord Name</label>
                  <input
                    type="text"
                    name="current_landlord_name"
                    value={formData.current_landlord_name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Landlord Phone</label>
                  <input
                    type="tel"
                    name="current_landlord_phone"
                    value={formData.current_landlord_phone}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Moving</label>
                <textarea
                  name="reason_for_moving"
                  value={formData.reason_for_moving}
                  onChange={handleChange}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
          </div>

          {/* Previous Addresses (Residential History) - CONTINUED IN NEXT PART */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Previous Addresses (Last 2 Years)</h2>
            {previousAddresses.map((addr, index) => (
              <div key={index} className="mb-6 pb-6 border-b border-gray-200 last:border-0">
                <h3 className="font-semibold text-gray-700 mb-3">Address {index + 1}</h3>
                <div className="grid grid-cols-1 gap-4">
                  <input
                    type="text"
                    placeholder="Street Address"
                    value={addr.street_address}
                    onChange={(e) => handlePreviousAddressChange(index, 'street_address', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <input
                      type="text"
                      placeholder="City"
                      value={addr.city}
                      onChange={(e) => handlePreviousAddressChange(index, 'city', e.target.value)}
                      className="col-span-2 w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                    <input
                      type="text"
                      placeholder="State"
                      value={addr.state}
                      onChange={(e) => handlePreviousAddressChange(index, 'state', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                    <input
                      type="text"
                      placeholder="ZIP"
                      value={addr.zip}
                      onChange={(e) => handlePreviousAddressChange(index, 'zip', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="date"
                      placeholder="Move-in Date"
                      value={addr.move_in_date}
                      onChange={(e) => handlePreviousAddressChange(index, 'move_in_date', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                    <input
                      type="date"
                      placeholder="Move-out Date"
                      value={addr.move_out_date}
                      onChange={(e) => handlePreviousAddressChange(index, 'move_out_date', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={addPreviousAddress}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              + Add Another Address
            </button>
          </div>

          {/* Employment - TRUNCATED FOR SPACE, CONTINUES... */}
          
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Employment Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Employer Name *</label>
                <input
                  type="text"
                  name="employer_name"
                  required
                  value={formData.employer_name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Job Title *</label>
                <input
                  type="text"
                  name="job_title"
                  required
                  value={formData.job_title}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Income *</label>
                <input
                  type="number"
                  name="monthly_income"
                  required
                  value={formData.monthly_income}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Employer Phone</label>
                <input
                  type="tel"
                  name="employer_phone"
                  value={formData.employer_phone}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Emergency Contact</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  name="emergency_contact_name"
                  required
                  value={formData.emergency_contact_name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Relationship *</label>
                <input
                  type="text"
                  name="emergency_contact_relationship"
                  required
                  value={formData.emergency_contact_relationship}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                <input
                  type="tel"
                  name="emergency_contact_phone"
                  required
                  value={formData.emergency_contact_phone}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
          </div>

          {/* References */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">References (1-2 Required)</h2>
            {references.map((ref, index) => (
              <div key={index} className="mb-4 pb-4 border-b border-gray-200 last:border-0">
                <h3 className="font-semibold text-gray-700 mb-3">Reference {index + 1}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Name *"
                    value={ref.reference_name}
                    onChange={(e) => handleReferenceChange(index, 'reference_name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                  <input
                    type="text"
                    placeholder="Relationship"
                    value={ref.relationship}
                    onChange={(e) => handleReferenceChange(index, 'relationship', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                  <input
                    type="tel"
                    placeholder="Phone *"
                    value={ref.phone}
                    onChange={(e) => handleReferenceChange(index, 'phone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={ref.email}
                    onChange={(e) => handleReferenceChange(index, 'email', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Pets & Vehicles */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Pets & Vehicles</h2>
            <div className="mb-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="has_pets"
                  checked={formData.has_pets}
                  onChange={handleChange}
                  className="mr-2"
                />
                <span className="text-sm font-medium text-gray-700">I have pets</span>
              </label>
              {formData.has_pets && (
                <textarea
                  name="pet_details"
                  value={formData.pet_details}
                  onChange={handleChange}
                  placeholder="Please describe (type, breed, weight, age)"
                  rows={2}
                  className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-md"
                />
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                name="vehicle_1_make"
                placeholder="Vehicle 1 Make"
                value={formData.vehicle_1_make}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
              <input
                type="text"
                name="vehicle_1_license_plate"
                placeholder="License Plate"
                value={formData.vehicle_1_license_plate}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>

          {/* Background Questions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Background Questions</h2>
            <div className="space-y-4">
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="ever_evicted"
                    checked={formData.ever_evicted}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700">Have you ever been evicted?</span>
                </label>
                {formData.ever_evicted && (
                  <textarea
                    name="eviction_details"
                    value={formData.eviction_details}
                    onChange={handleChange}
                    placeholder="Please explain"
                    rows={2}
                    className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-md"
                  />
                )}
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="ever_convicted"
                    checked={formData.ever_convicted}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700">Have you ever been convicted of a crime?</span>
                </label>
                {formData.ever_convicted && (
                  <textarea
                    name="conviction_details"
                    value={formData.conviction_details}
                    onChange={handleChange}
                    placeholder="Please explain"
                    rows={2}
                    className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-md"
                  />
                )}
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="ever_sued_landlord"
                    checked={formData.ever_sued_landlord}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700">Have you ever filed suit against a landlord?</span>
                </label>
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="has_waterbed_or_aquarium"
                    checked={formData.has_waterbed_or_aquarium}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700">Do you have a waterbed or aquarium?</span>
                </label>
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="is_smoker"
                    checked={formData.is_smoker}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700">Are you a smoker?</span>
                </label>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 text-lg font-semibold"
            >
              {submitting ? 'Submitting...' : 'Submit Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
