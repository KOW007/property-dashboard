/**
 * BOC Bank ACH File Upload API client.
 * POST /api/v1/ach/files — raw octet-stream body, X-API-Key auth.
 * Entire file is accepted or rejected (no partial processing).
 *
 * Outbound requests are routed through Fixie (static IP proxy) when
 * FIXIE_URL is set, so BOC Bank's IP allowlist is satisfied locally
 * and on Vercel.
 */

import nodeFetch from 'node-fetch'
import { HttpsProxyAgent } from 'https-proxy-agent'

export interface BocBankItem {
  bankReference: string
  traceNumber: string
  individualId: string
  individualName: string
  amount: number
  transactionCode: string
  effectiveDate: string
  status: string
}

export interface BocBankUploadResponse {
  fileId: string
  status: string
  receivedDate: string
  totalEntries: number
  totalDebitAmount: number
  items: BocBankItem[]
}

export async function uploadAchFile(
  nachaContent: string,
  fileName: string
): Promise<BocBankUploadResponse> {
  const apiUrl = process.env.BOC_BANK_API_URL
  const apiKey = process.env.BOC_BANK_API_KEY

  if (!apiUrl || !apiKey) {
    throw new Error('BOC_BANK_API_URL and BOC_BANK_API_KEY must be set')
  }

  const body = Buffer.from(nachaContent, 'utf-8')

  const fixieUrl = process.env.FIXIE_URL
  const agent = fixieUrl ? new HttpsProxyAgent(fixieUrl) : undefined

  const res = await nodeFetch(`${apiUrl}/api/v1/ach/files`, {
    method: 'POST',
    headers: {
      'X-API-Key': apiKey,
      'Content-Type': 'application/octet-stream',
      'Content-Length': String(body.byteLength),
      'x-file-name': fileName,
    },
    body,
    agent,
  })

  let data: Record<string, unknown>
  try {
    data = await res.json() as Record<string, unknown>
  } catch {
    throw new Error(`BOC Bank returned non-JSON response (HTTP ${res.status})`)
  }

  if (!res.ok) {
    const code = (data.code as string) ?? ''
    const message = (data.message as string) ?? JSON.stringify(data)

    if (res.status === 409) {
      const existingId = (data.fileId as string) ?? 'unknown'
      throw new Error(`DUPLICATE_FILE: already uploaded as fileId ${existingId}`)
    }
    throw new Error(`BOC Bank error ${res.status} ${code}: ${message}`)
  }

  return data as unknown as BocBankUploadResponse
}
