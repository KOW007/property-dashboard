/**
 * Simple in-memory rate limiter.
 *
 * Works per serverless function instance — effective against rapid repeated
 * requests within the same instance. For distributed rate limiting across
 * all instances, upgrade to Upstash Redis or Vercel KV.
 *
 * Usage:
 *   const allowed = rateLimit(ip, { limit: 5, windowMs: 60_000 })
 *   if (!allowed) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
 */

interface Window {
  count: number
  resetAt: number
}

const store = new Map<string, Window>()

// Clean up expired entries every 5 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now()
  for (const [key, window] of store) {
    if (now > window.resetAt) store.delete(key)
  }
}, 5 * 60 * 1000)

export function rateLimit(
  key: string,
  options: { limit: number; windowMs: number }
): boolean {
  const now = Date.now()
  const existing = store.get(key)

  if (!existing || now > existing.resetAt) {
    store.set(key, { count: 1, resetAt: now + options.windowMs })
    return true
  }

  if (existing.count >= options.limit) return false

  existing.count++
  return true
}

/** Extract the real client IP from Next.js request headers. */
export function getClientIp(headers: Headers): string {
  return (
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    headers.get('x-real-ip') ??
    'unknown'
  )
}
