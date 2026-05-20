# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

## Commands

- `npm run dev` — Start dev server (Next.js 16, http://localhost:3000)
- `npm run build` — Production build
- `npm run lint` — ESLint (flat config with next/core-web-vitals + next/typescript)

No test framework is configured.

## Architecture

Property management dashboard for **Spearhead Properties** (Austin, TX). Next.js 16 App Router with Supabase backend, Tailwind CSS v4, React 19, TypeScript.

### Route Groups

Three route groups under `src/app/` provide distinct experiences with separate layouts:

- **`(admin)/`** — Property manager dashboard. Sidebar nav, auth-gated (redirects to `/login`). Pages: dashboard, rent-roll, vacancies, work-orders, renewals, applications, service-request, accounting (with sub-routes), portal-preview, tenants/[id].
- **`(portal)/`** — Tenant portal. Auth-gated (redirects to `/portal-login`). Tenant sees their property info, payments, maintenance requests, lease documents, account, contact. Layout fetches tenant + unit + property data from Supabase based on logged-in user's email.
- **`(public)/`** — Public-facing site. No auth. Pages: home, about, for-rent, apply, contact.

### Authentication

- **Middleware** (`src/middleware.ts`): Uses `@supabase/ssr` `createServerClient` to check auth. Redirects unauthenticated users away from admin/portal routes and redirects authenticated users away from login pages.
- Both admin and portal users authenticate via Supabase Auth but through separate login pages (`/login` vs `/portal-login`).

### Supabase Clients

- `src/lib/supabase.ts` — Browser client (`createBrowserClient`) for `'use client'` components
- `src/lib/supabase-server.ts` — Server client (`createSupabaseServer`) for Server Components and Route Handlers

### API Routes

Located in `src/app/api/`. Route handlers for: all-units, apply, invite-tenant, lease-document, lease-document-admin, portal-logout, vacancies.

### Key Patterns

- Path alias: `@/*` maps to `./src/*`
- Font: Dosis (Google Fonts via `next/font`)
- Brand colors: dark gray `#2d2d2d` (backgrounds), red `#b22625` (accents)
- Icons: `lucide-react`
- Charts: `recharts`
- Excel export: `xlsx`
- Lease documents stored in Supabase Storage, accessed via signed URLs
- Components in `src/components/`, with portal-specific components in `src/components/portal/`

### Environment Variables

Required in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
