export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold text-[#2d2d2d] mb-2">Terms & Conditions</h1>
      <p className="text-sm text-gray-500 mb-10">Effective Date: March 20, 2026</p>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-[#2d2d2d] mb-3">1. Overview</h2>
        <p className="text-gray-700 leading-relaxed">
          These Terms and Conditions ("Terms") govern your use of the services provided by Spearhead Properties
          ("Company," "we," "us," or "our"), including our online rental application portal, property inquiry forms,
          and any related communications. By submitting your information through our platform, you agree to these Terms.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-[#2d2d2d] mb-3">2. Collection of Phone Numbers</h2>
        <p className="text-gray-700 leading-relaxed">
          When you apply for a rental property or express interest in a property through our platform, we collect your
          phone number as part of the application or inquiry process. Your phone number is used solely for
          communications related to your application, tenancy, or property inquiries.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-[#2d2d2d] mb-3">3. SMS / Text Message Communications</h2>
        <p className="text-gray-700 leading-relaxed mb-4">
          By providing your phone number, you expressly consent to receive text messages (SMS) from Spearhead Properties.
          These messages may include:
        </p>
        <ul className="list-disc list-inside text-gray-700 space-y-2 ml-2">
          <li>Application status updates and notifications</li>
          <li>Lease signing reminders and document requests</li>
          <li>Property availability updates related to your inquiry</li>
          <li>Maintenance request updates and scheduling</li>
          <li>Rent payment reminders and confirmations</li>
          <li>Important notices related to your tenancy</li>
        </ul>
        <p className="text-gray-700 leading-relaxed mt-4">
          Message frequency varies based on your interactions with us.{' '}
          <strong>Message and data rates may apply</strong> depending on your mobile carrier and plan.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-[#2d2d2d] mb-3">4. How to Opt Out</h2>
        <p className="text-gray-700 leading-relaxed">
          You may opt out of receiving text messages at any time by replying <strong>STOP</strong> to any text message
          you receive from us. After opting out, you will receive one final confirmation message. You may also contact
          us at{' '}
          <a href="mailto:info@spearheadproperties.com" className="text-[#b22625] hover:underline">
            info@spearheadproperties.com
          </a>{' '}
          to be removed from our SMS list. Opting out of SMS does not affect other communications related to your
          application or tenancy.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-[#2d2d2d] mb-3">5. Help</h2>
        <p className="text-gray-700 leading-relaxed">
          Reply <strong>HELP</strong> to any text message for assistance, or contact us at{' '}
          <a href="mailto:info@spearheadproperties.com" className="text-[#b22625] hover:underline">
            info@spearheadproperties.com
          </a>{' '}
          or <a href="tel:5122361512" className="text-[#b22625] hover:underline">(512) 236-1512</a>.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-[#2d2d2d] mb-3">6. Privacy & Data Use</h2>
        <p className="text-gray-700 leading-relaxed">
          Your phone number and personal information are used exclusively for the purposes described in these Terms.
          We do not sell, rent, or share your phone number with third parties for marketing purposes. Your information
          is stored securely and handled in accordance with applicable privacy laws. We may share your information with
          service providers who assist us in operating our platform and delivering communications, solely as necessary
          to provide our services.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-[#2d2d2d] mb-3">7. Consent</h2>
        <p className="text-gray-700 leading-relaxed">
          By submitting your phone number through any Spearhead Properties form, application, or inquiry portal, you
          confirm that you are the account holder or authorized user of the phone number provided, and you consent to
          receive text messages as described in these Terms. Consent to receive SMS messages is not a condition of
          applying for or renting a property.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-[#2d2d2d] mb-3">8. Changes to These Terms</h2>
        <p className="text-gray-700 leading-relaxed">
          We reserve the right to update these Terms at any time. Changes will be posted on this page with an updated
          effective date. Continued use of our services after changes are posted constitutes your acceptance of the
          updated Terms.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-[#2d2d2d] mb-3">9. Contact Us</h2>
        <p className="text-gray-700 leading-relaxed">
          If you have any questions about these Terms or our SMS communications, please contact us:
        </p>
        <div className="mt-3 text-gray-700 space-y-1">
          <p><strong>Spearhead Properties</strong></p>
          <p>PO Box 50408, Austin, TX 78763</p>
          <p>Phone: <a href="tel:5122361512" className="text-[#b22625] hover:underline">(512) 236-1512</a></p>
          <p>Email: <a href="mailto:info@spearheadproperties.com" className="text-[#b22625] hover:underline">info@spearheadproperties.com</a></p>
        </div>
      </section>

      <div className="border-t border-gray-200 pt-6 text-xs text-gray-400">
        &copy; {new Date().getFullYear()} Spearhead Properties. All rights reserved.
      </div>
    </div>
  )
}
