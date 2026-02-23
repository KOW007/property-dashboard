# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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
