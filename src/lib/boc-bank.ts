/**
 * BOC Bank ACH API client.
 *
 * Upload API — POST /api/v1/ach/files (octet-stream, X-API-Key auth)
 * Status API — GET  /api/v1/ach/status (X-API-Key auth, Ach.Status role required)
 *
 * Outbound requests are routed through Fixie (static IP proxy) when
 * FIXIE_URL is set, so BOC Bank's IP allowlist is satisfied locally
 * and on Vercel.
 */

import nodeFetch from 'node-fetch'
import { HttpsProxyAgent } from 'https-proxy-agent'

// ─── Upload API types ─────────────────────────────────────────────────────────

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

// ─── Status API types ─────────────────────────────────────────────────────────

export interface BocStatusEvent {
  eventType: 'Received' | 'Accepted' | 'Rejected' | 'Transmitted' | 'Settled' | 'Returned' | 'NOCApplied'
  eventDate: string
  eventData: {
    returnCode?: string
    returnDescription?: string
    originalTrace?: string
    amount?: number
  } | null
}

export interface BocStatusItem {
  bankReference: string
  customerTraceNumber: string
  assignedOutboundTraceNumber: string | null
  individualId: string
  individualName: string
  amount: number
  transactionCode: string
  effectiveDate: string
  currentStatus: string
  events: BocStatusEvent[]
}

export interface BocStatusFile {
  fileId: string
  fileName?: string
  status: string
  receivedDate: string
  totalEntries?: number
  totalDebitAmount?: number
  items: BocStatusItem[]
}

export interface BocStatusResponse {
  files: BocStatusFile[]
}

// ─── Upload API ───────────────────────────────────────────────────────────────

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

// ─── Status API ───────────────────────────────────────────────────────────────

type StatusQuery =
  | { fileId: string; fileName?: never; fromDate?: never; toDate?: never }
  | { fileName: string; fileId?: never; fromDate?: never; toDate?: never }
  | { fromDate: string; toDate: string; fileId?: never; fileName?: never }

export async function pollAchStatus(
  query: StatusQuery & { traceNumber?: string; individualId?: string }
): Promise<BocStatusResponse> {
  const apiUrl = process.env.BOC_BANK_API_URL
  const apiKey = process.env.BOC_BANK_API_KEY
  if (!apiUrl || !apiKey) throw new Error('BOC_BANK_API_URL and BOC_BANK_API_KEY must be set')

  const qs = new URLSearchParams()
  if ('fileId'   in query && query.fileId)   qs.set('fileId',   query.fileId)
  if ('fileName' in query && query.fileName) qs.set('fileName', query.fileName)
  if ('fromDate' in query && query.fromDate) {
    qs.set('fromDate', query.fromDate)
    qs.set('toDate',   query.toDate)
  }
  if (query.traceNumber)  qs.set('traceNumber',  query.traceNumber)
  if (query.individualId) qs.set('individualId', query.individualId)

  const fixieUrl = process.env.FIXIE_URL
  const agent = fixieUrl ? new HttpsProxyAgent(fixieUrl) : undefined

  const res = await nodeFetch(`${apiUrl}/api/v1/ach/status?${qs}`, {
    method: 'GET',
    headers: { 'X-API-Key': apiKey },
    agent,
  })

  let data: Record<string, unknown>
  try {
    data = await res.json() as Record<string, unknown>
  } catch {
    throw new Error(`BOC Bank status returned non-JSON (HTTP ${res.status})`)
  }

  if (!res.ok) {
    const code    = (data.error as string) ?? ''
    const message = (data.detail as string) ?? JSON.stringify(data)
    throw new Error(`BOC Bank status ${res.status} ${code}: ${message}`)
  }

  return data as unknown as BocStatusResponse
}
