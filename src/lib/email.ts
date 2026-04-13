/**
 * Email sender — Microsoft Graph API (modern auth, no SMTP)
 *
 * Works with Microsoft 365 security defaults enabled.
 * Uses client credentials (app-to-app) — no user login required.
 *
 * Required env vars:
 *   GRAPH_TENANT_ID      — your M365 Azure AD tenant ID
 *   GRAPH_CLIENT_ID      — "Spearhead Email Sender" app registration client ID
 *   GRAPH_CLIENT_SECRET  — client secret from the app registration
 *   OUTLOOK_SENDER       — noreply@spearheadproperties.com
 *   ADMIN_ALERT_EMAIL    — katherine@spearheadproperties.com
 *
 * Azure setup required:
 *   App registration → API permissions → Microsoft Graph →
 *   Application permissions → Mail.Send → Grant admin consent
 */

let cachedToken: { value: string; expiresAt: number } | null = null

async function getGraphToken(): Promise<string> {
  // Return cached token if still valid (with 60s buffer)
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) {
    return cachedToken.value
  }

  const tenantId = process.env.GRAPH_TENANT_ID
  const clientId = process.env.GRAPH_CLIENT_ID
  const clientSecret = process.env.GRAPH_CLIENT_SECRET

  if (!tenantId || !clientId || !clientSecret) {
    throw new Error(
      'Email not configured. Set GRAPH_TENANT_ID, GRAPH_CLIENT_ID, and GRAPH_CLIENT_SECRET in .env.local'
    )
  }

  const res = await fetch(
    `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id:     clientId,
        client_secret: clientSecret,
        scope:         'https://graph.microsoft.com/.default',
        grant_type:    'client_credentials',
      }),
    }
  )

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Failed to get Graph token: ${err}`)
  }

  const data = await res.json()
  cachedToken = {
    value:     data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  }

  return cachedToken.value
}

export interface EmailAttachment {
  name: string          // file name, e.g. "rent_20260401.ach"
  contentType: string   // MIME type, e.g. "application/octet-stream"
  contentBase64: string // base64-encoded file content
}

export interface EmailOptions {
  to: string | string[]
  subject: string
  html: string
  attachments?: EmailAttachment[]
}

export async function sendEmail({ to, subject, html, attachments }: EmailOptions) {
  const sender = process.env.OUTLOOK_SENDER
  if (!sender) {
    throw new Error('OUTLOOK_SENDER not configured in .env.local')
  }

  const token = await getGraphToken()

  const toRecipients = (Array.isArray(to) ? to : [to]).map(address => ({
    emailAddress: { address },
  }))

  const message: Record<string, any> = {
    subject,
    body: { contentType: 'HTML', content: html },
    toRecipients,
  }

  if (attachments && attachments.length > 0) {
    message.attachments = attachments.map(a => ({
      '@odata.type':  '#microsoft.graph.fileAttachment',
      name:           a.name,
      contentType:    a.contentType,
      contentBytes:   a.contentBase64,
    }))
  }

  const res = await fetch(
    `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(sender)}/sendMail`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message, saveToSentItems: false }),
    }
  )

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Graph sendMail failed (${res.status}): ${err}`)
  }
}
