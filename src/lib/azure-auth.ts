/**
 * Azure AD / Entra ID JWT verification
 *
 * Verifies Bearer tokens issued by Azure Active Directory using the tenant's
 * public JWKS endpoint. No client secret required — only the public keys.
 *
 * Required env vars (server-only):
 *   AZURE_TENANT_ID      — Spearhead's Azure AD tenant GUID
 *   AZURE_CLIENT_ID      — Spearhead's app registration client ID
 *   BANK_AZURE_TENANT_ID — Bank's Azure AD tenant GUID
 *   BANK_AZURE_CLIENT_ID — Bank's service principal client ID
 */

import { createRemoteJWKSet, jwtVerify, JWTPayload } from 'jose'

export interface AzureTokenClaims extends JWTPayload {
  oid?: string      // Object ID of the user/service principal
  upn?: string      // User principal name (email)
  name?: string     // Display name
  roles?: string[]  // App roles assigned to the user
}

// Cache JWKS per tenant so we don't re-fetch on every request
const jwksCache = new Map<string, ReturnType<typeof createRemoteJWKSet>>()

function getJwks(tenantId: string) {
  if (!jwksCache.has(tenantId)) {
    jwksCache.set(tenantId, createRemoteJWKSet(
      new URL(`https://login.microsoftonline.com/${tenantId}/discovery/v2.0/keys`)
    ))
  }
  return jwksCache.get(tenantId)!
}

/**
 * Verify a token issued to Spearhead's own app (admin UI → ACH export API).
 */
export async function verifyAzureToken(token: string): Promise<AzureTokenClaims> {
  const tenantId = process.env.AZURE_TENANT_ID
  const clientId = process.env.AZURE_CLIENT_ID

  if (!tenantId || !clientId) {
    throw new Error(
      'Spearhead Azure AD not configured. Set AZURE_TENANT_ID and AZURE_CLIENT_ID in .env.local'
    )
  }

  const { payload } = await jwtVerify(token, getJwks(tenantId), {
    issuer: [
      `https://login.microsoftonline.com/${tenantId}/v2.0`,
      `https://sts.windows.net/${tenantId}/`,
    ],
    audience: clientId,
  })

  return payload as AzureTokenClaims
}

/**
 * Verify a token issued by the bank's Azure tenant (bank → Spearhead webhook).
 * The bank uses client credentials (service principal), so the audience is
 * Spearhead's client ID and the issuer is the bank's tenant.
 */
export async function verifyBankAzureToken(token: string): Promise<AzureTokenClaims> {
  const bankTenantId = process.env.BANK_AZURE_TENANT_ID
  const bankClientId = process.env.BANK_AZURE_CLIENT_ID
  const spearheadClientId = process.env.AZURE_CLIENT_ID

  if (!bankTenantId || !bankClientId || !spearheadClientId) {
    throw new Error(
      'Bank Azure AD not configured. Set BANK_AZURE_TENANT_ID, BANK_AZURE_CLIENT_ID, and AZURE_CLIENT_ID in .env.local'
    )
  }

  const { payload } = await jwtVerify(token, getJwks(bankTenantId), {
    issuer: [
      `https://login.microsoftonline.com/${bankTenantId}/v2.0`,
      `https://sts.windows.net/${bankTenantId}/`,
    ],
    // The bank requests a token scoped to Spearhead's app
    audience: spearheadClientId,
  })

  // Confirm the token came from the expected service principal
  if (payload.azp !== bankClientId && payload.appid !== bankClientId) {
    throw new Error('Token was not issued to the expected bank service principal.')
  }

  return payload as AzureTokenClaims
}

/**
 * Extract the Bearer token from an Authorization header.
 * Returns null if the header is missing or malformed.
 */
export function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader) return null
  const [scheme, token] = authHeader.split(' ')
  return scheme.toLowerCase() === 'bearer' && token ? token : null
}
