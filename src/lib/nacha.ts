/**
 * NACHA ACH File Generator
 * Produces standard NACHA-formatted files (94-char fixed-width records).
 * Spec: https://www.nacha.org/rules
 */

/** Left-justify a string, padded with spaces, truncated to length. */
function padR(s: string, len: number): string {
  return String(s ?? '').slice(0, len).padEnd(len, ' ')
}

/** Right-justify a number as zero-padded string. */
function padL(n: number | string, len: number): string {
  return String(n ?? 0).slice(-len).padStart(len, '0')
}

function yymmdd(d: Date): string {
  const yy = d.getFullYear().toString().slice(-2)
  const mm = (d.getMonth() + 1).toString().padStart(2, '0')
  const dd = d.getDate().toString().padStart(2, '0')
  return `${yy}${mm}${dd}`
}

function hhmm(d: Date): string {
  return d.getHours().toString().padStart(2, '0') +
         d.getMinutes().toString().padStart(2, '0')
}

// ─── Public types ─────────────────────────────────────────────────────────────

export interface NachaConfig {
  /** Your bank's 9-digit ABA routing number (ODFI). */
  odfiBankRoutingNumber: string
  /** Your bank's name, shown in file header (max 23 chars). */
  odfiBankName: string
  /** Your company name (max 16 chars for batch, 23 for file header). */
  companyName: string
  /**
   * Company Identification — 10 chars.
   * Convention: "1" + 9-digit EIN, e.g. "1742012345".
   */
  companyId: string
  /** Entry description shown on bank statement, max 10 chars (e.g. "RENT"). */
  entryDescription: string
  /** Date entries should settle (typically next business day). */
  effectiveDate: Date
  /**
   * File ID Modifier — single char A-Z or 0-9.
   * Increment for multiple files sent on the same day.
   */
  fileIdModifier?: string
}

export interface AchEntry {
  /** 9-digit ABA routing number of the receiver's bank. */
  rdfiRoutingNumber: string
  /** Receiver's bank account number (max 17 chars). */
  rdfiAccountNumber: string
  /**
   * Amount in cents (e.g. $1,200.00 = 120000).
   * Must be a positive integer.
   */
  amountCents: number
  /** Your reference ID for the receiver (max 15 chars, e.g. tenant ID). */
  individualId: string
  /** Receiver's name as it appears on their bank account (max 22 chars). */
  individualName: string
  /**
   * NACHA transaction code:
   *   "27" = checking debit   (pull money from tenant — most common for rent)
   *   "22" = checking credit  (push money to someone)
   *   "37" = savings debit
   *   "32" = savings credit
   */
  transactionCode?: '22' | '27' | '32' | '37'
}

export interface NachaResult {
  /** Full NACHA file content — write to a .ach file. */
  content: string
  entryCount: number
  totalDebitCents: number
  totalCreditCents: number
  blockCount: number
}

// ─── Generator ────────────────────────────────────────────────────────────────

const DEBIT_CODES = new Set(['27', '37', '23', '33'])

export function generateNachaFile(
  config: NachaConfig,
  entries: AchEntry[]
): NachaResult {
  if (!entries.length) throw new Error('NACHA file requires at least one entry.')

  const now = new Date()
  const fileId = config.fileIdModifier ?? 'A'
  const batchNum = 1
  const odfi8 = config.odfiBankRoutingNumber.slice(0, 8)

  // Determine service class code
  let debits = 0, credits = 0
  for (const e of entries) {
    const code = e.transactionCode ?? '27'
    if (DEBIT_CODES.has(code)) debits += e.amountCents
    else credits += e.amountCents
  }
  const svc = debits > 0 && credits > 0 ? '200' : debits > 0 ? '225' : '220'

  const lines: string[] = []

  // ── File Header (type 1) ── 94 chars ──────────────────────────────────────
  lines.push(
    '1' +                                 // [1]    Record type
    '01' +                                // [2-3]  Priority code
    (' ' + odfiFmt(config.odfiBankRoutingNumber)) + // [4-13]  Immediate dest (10)
    padL(config.companyId, 10) +          // [14-23] Immediate origin (10)
    yymmdd(now) +                         // [24-29] Creation date
    hhmm(now) +                           // [30-33] Creation time
    fileId +                              // [34]   File ID modifier
    '094' +                               // [35-37] Record size
    '10' +                                // [38-39] Blocking factor
    '1' +                                 // [40]   Format code
    padR(config.odfiBankName, 23) +       // [41-63] Dest name
    padR(config.companyName, 23) +        // [64-86] Origin name
    '        '                            // [87-94] Reference code
  )

  // ── Batch Header (type 5) ── 94 chars ─────────────────────────────────────
  lines.push(
    '5' +                                 // [1]    Record type
    svc +                                 // [2-4]  Service class
    padR(config.companyName, 16) +        // [5-20] Company name
    ''.padEnd(20) +                       // [21-40] Discretionary data
    padR(config.companyId, 10) +          // [41-50] Company ID
    'PPD' +                               // [51-53] SEC code
    padR(config.entryDescription, 10) +   // [54-63] Entry description
    ''.padEnd(6) +                        // [64-69] Descriptive date
    yymmdd(config.effectiveDate) +        // [70-75] Effective entry date
    '   ' +                               // [76-78] Settlement date (bank fills)
    '1' +                                 // [79]   Originator status
    odfi8 +                               // [80-87] ODFI routing (8 chars)
    padL(batchNum, 7)                     // [88-94] Batch number
  )

  // ── Entry Detail Records (type 6) ── 94 chars each ───────────────────────
  let entryHash = 0
  let totalDebit = 0
  let totalCredit = 0

  entries.forEach((entry, i) => {
    const code = entry.transactionCode ?? '27'
    const routing9 = entry.rdfiRoutingNumber.replace(/\D/g, '')
    const rdfi8 = routing9.slice(0, 8)
    const checkDigit = routing9.slice(8, 9)
    const traceNum = odfi8 + padL(i + 1, 7)   // 8 + 7 = 15 chars

    lines.push(
      '6' +                               // [1]    Record type
      code +                              // [2-3]  Transaction code
      rdfi8 +                             // [4-11] RDFI routing (8)
      checkDigit +                        // [12]   Check digit
      padR(entry.rdfiAccountNumber, 17) + // [13-29] Account number
      padL(entry.amountCents, 10) +       // [30-39] Amount (cents, no decimal)
      padR(entry.individualId, 15) +      // [40-54] Individual ID
      padR(entry.individualName, 22) +    // [55-76] Individual name
      '  ' +                              // [77-78] Discretionary data
      '0' +                               // [79]   Addenda indicator
      traceNum                            // [80-94] Trace number
    )

    entryHash += parseInt(rdfi8, 10)
    if (DEBIT_CODES.has(code)) totalDebit += entry.amountCents
    else totalCredit += entry.amountCents
  })

  // Entry hash: last 10 digits of sum of all RDFI routing numbers
  const hashStr = padL(entryHash % 10_000_000_000, 10)

  // ── Batch Control (type 8) ── 94 chars ────────────────────────────────────
  lines.push(
    '8' +                                 // [1]    Record type
    svc +                                 // [2-4]  Service class
    padL(entries.length, 6) +             // [5-10] Entry/addenda count
    hashStr +                             // [11-20] Entry hash
    padL(totalDebit, 12) +               // [21-32] Total debit
    padL(totalCredit, 12) +              // [33-44] Total credit
    padR(config.companyId, 10) +          // [45-54] Company ID
    ''.padEnd(19) +                       // [55-73] Message auth code (spaces)
    ''.padEnd(6) +                        // [74-79] Reserved
    odfi8 +                               // [80-87] ODFI routing
    padL(batchNum, 7)                     // [88-94] Batch number
  )

  // ── File Control (type 9) ── 94 chars ─────────────────────────────────────
  // Block count = ceil(total records / 10) — includes padding
  const recordsBeforePad = lines.length + 1  // +1 for file control itself
  const blockCount = Math.ceil(recordsBeforePad / 10)
  const paddingNeeded = blockCount * 10 - recordsBeforePad

  lines.push(
    '9' +                                 // [1]    Record type
    padL(1, 6) +                          // [2-7]  Batch count
    padL(blockCount, 6) +                 // [8-13] Block count
    padL(entries.length, 8) +             // [14-21] Entry/addenda count
    hashStr +                             // [22-31] Entry hash
    padL(totalDebit, 12) +               // [32-43] Total debit
    padL(totalCredit, 12) +              // [44-55] Total credit
    ''.padEnd(39)                         // [56-94] Reserved
  )

  // Pad file to multiple of 10 records
  for (let p = 0; p < paddingNeeded; p++) {
    lines.push('9'.repeat(94))
  }

  // Sanity-check every line is exactly 94 chars
  lines.forEach((line, i) => {
    if (line.length !== 94) {
      throw new Error(
        `NACHA record ${i + 1} is ${line.length} chars (expected 94): ${line.slice(0, 20)}...`
      )
    }
  })

  return {
    content: lines.join('\r\n'),   // NACHA spec requires CRLF
    entryCount: entries.length,
    totalDebitCents: totalDebit,
    totalCreditCents: totalCredit,
    blockCount,
  }
}

/** Format routing number as 10-char immediate destination field (space + 9 digits). */
function odfiFmt(routing: string): string {
  return routing.replace(/\D/g, '').slice(0, 9).padEnd(9)
}
