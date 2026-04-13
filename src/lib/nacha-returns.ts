/**
 * NACHA ACH Return Code reference
 * Source: NACHA Operating Rules
 */

export interface ReturnCode {
  code: string
  description: string
  /** Who initiates the return */
  initiator: 'RDFI' | 'ODFI' | 'ACH Operator'
  /** Recommended action for the property manager */
  action: string
  /** How urgent is follow-up needed */
  severity: 'high' | 'medium' | 'low'
  /** Can this payment be retried automatically */
  retryable: boolean
}

export const RETURN_CODES: Record<string, ReturnCode> = {
  R01: {
    code: 'R01',
    description: 'Insufficient Funds',
    initiator: 'RDFI',
    action: 'Contact tenant to arrange payment. May retry after 5 business days (once per 30 days max).',
    severity: 'medium',
    retryable: true,
  },
  R02: {
    code: 'R02',
    description: 'Account Closed',
    initiator: 'RDFI',
    action: 'Contact tenant immediately — account is closed. Collect new bank authorization before retrying.',
    severity: 'high',
    retryable: false,
  },
  R03: {
    code: 'R03',
    description: 'No Account / Unable to Locate Account',
    initiator: 'RDFI',
    action: 'Verify routing and account numbers with tenant. Do not retry until corrected.',
    severity: 'high',
    retryable: false,
  },
  R04: {
    code: 'R04',
    description: 'Invalid Account Number Structure',
    initiator: 'RDFI',
    action: 'Account number format is invalid. Re-collect banking details from tenant.',
    severity: 'high',
    retryable: false,
  },
  R05: {
    code: 'R05',
    description: 'Unauthorized Debit to Consumer Account',
    initiator: 'RDFI',
    action: 'Tenant may dispute the authorization. Review signed ACH authorization form immediately.',
    severity: 'high',
    retryable: false,
  },
  R06: {
    code: 'R06',
    description: 'Returned per ODFI Request',
    initiator: 'ODFI',
    action: 'Your bank requested this return. Contact your bank for details.',
    severity: 'medium',
    retryable: false,
  },
  R07: {
    code: 'R07',
    description: 'Authorization Revoked by Customer',
    initiator: 'RDFI',
    action: 'Tenant has revoked ACH authorization. Stop all future ACH debits for this tenant. Collect payment by other means.',
    severity: 'high',
    retryable: false,
  },
  R08: {
    code: 'R08',
    description: 'Payment Stopped',
    initiator: 'RDFI',
    action: 'Tenant placed a stop payment. Contact tenant to resolve before retrying.',
    severity: 'medium',
    retryable: false,
  },
  R09: {
    code: 'R09',
    description: 'Uncollected Funds',
    initiator: 'RDFI',
    action: 'Funds are present but uncollected (e.g. recently deposited check). Retry after 5 business days.',
    severity: 'low',
    retryable: true,
  },
  R10: {
    code: 'R10',
    description: 'Customer Advises Not Authorized',
    initiator: 'RDFI',
    action: 'Tenant claims no authorization was given. Provide signed authorization form to your bank within 10 business days.',
    severity: 'high',
    retryable: false,
  },
  R11: {
    code: 'R11',
    description: 'Check Truncation Entry Return',
    initiator: 'RDFI',
    action: 'Contact your bank for details on this return.',
    severity: 'medium',
    retryable: false,
  },
  R12: {
    code: 'R12',
    description: 'Branch Sold to Another DFI',
    initiator: 'RDFI',
    action: 'Tenant\'s bank branch was acquired. Re-collect current routing and account numbers.',
    severity: 'medium',
    retryable: false,
  },
  R13: {
    code: 'R13',
    description: 'Invalid ACH Routing Number',
    initiator: 'RDFI',
    action: 'Routing number is not valid or not an ACH participant. Verify routing number with tenant.',
    severity: 'high',
    retryable: false,
  },
  R14: {
    code: 'R14',
    description: 'Representative Payee Deceased or Unable to Continue',
    initiator: 'RDFI',
    action: 'Contact tenant to update authorized representative and banking details.',
    severity: 'high',
    retryable: false,
  },
  R15: {
    code: 'R15',
    description: 'Beneficiary or Account Holder Deceased',
    initiator: 'RDFI',
    action: 'Contact estate or co-tenant. Cease ACH debits until legal situation is resolved.',
    severity: 'high',
    retryable: false,
  },
  R16: {
    code: 'R16',
    description: 'Account Frozen',
    initiator: 'RDFI',
    action: 'Account has been frozen (regulatory action, fraud, etc.). Contact tenant.',
    severity: 'high',
    retryable: false,
  },
  R17: {
    code: 'R17',
    description: 'File Record Edit Criteria',
    initiator: 'RDFI',
    action: 'Technical error in the ACH file. Contact your bank to review the submission.',
    severity: 'medium',
    retryable: false,
  },
  R20: {
    code: 'R20',
    description: 'Non-Transaction Account',
    initiator: 'RDFI',
    action: 'Account cannot receive ACH debits (e.g. savings restrictions). Ask tenant for a checking account.',
    severity: 'medium',
    retryable: false,
  },
  R23: {
    code: 'R23',
    description: 'Credit Entry Refused by Receiver',
    initiator: 'RDFI',
    action: 'Receiver refused the credit. Contact tenant.',
    severity: 'medium',
    retryable: false,
  },
  R29: {
    code: 'R29',
    description: 'Corporate Customer Advises Not Authorized',
    initiator: 'RDFI',
    action: 'Corporate account holder claims no authorization. Review authorization documentation.',
    severity: 'high',
    retryable: false,
  },
}

/** Notification of Change codes */
export const NOC_CODES: Record<string, string> = {
  C01: 'Incorrect DFI Account Number — update account number on file',
  C02: 'Incorrect Routing Number — update routing number on file',
  C03: 'Incorrect Routing Number and Account Number — update both',
  C04: 'Incorrect Individual Name — update tenant name on file',
  C05: 'Incorrect Transaction Code — verify account type (checking vs savings)',
  C06: 'Incorrect Account Number and Transaction Code — update both',
  C07: 'Incorrect Routing, Account Number, and Transaction Code — update all three',
  C09: 'Incorrect Individual Identification Number — update tenant ID on file',
  C13: 'Addenda Format Error',
  C61: 'Misrouted Return',
  C62: 'Incorrect Trace Number',
  C63: 'Incorrect Company Identification',
  C64: 'Incorrect Individual Identification Number',
  C65: 'Incorrectly Formatted CCD Addenda Record',
  C66: 'Incorrect Discretionary Data',
  C67: 'Routing Number Not From Original Entry',
  C68: 'Account Number Not From Original Entry',
  C69: 'Incorrect Transaction Code',
}

export function getReturnCode(code: string): ReturnCode | null {
  return RETURN_CODES[code] ?? null
}

export function getNocDescription(code: string): string {
  return NOC_CODES[code] ?? `Unknown NOC code: ${code}`
}

export function getEventLabel(eventType: string): string {
  switch (eventType) {
    case 'ach.settlement': return 'Settled'
    case 'ach.return':     return 'Returned'
    case 'ach.noc':        return 'Notice of Change'
    default:               return eventType
  }
}
