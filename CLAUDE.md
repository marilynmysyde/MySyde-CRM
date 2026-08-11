# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

MySyde Connect — the internal operating system for MySyde (Aligned Abundance Inc.). Manages sales pipeline for kiosk ad space, partner relationships, social content, task tracking, and kiosk operations across 7+ community association partners.

## Commands

```bash
npm run dev      # start dev server (localhost:5173)
npm run build    # production build
npm run preview  # preview production build
```

## Tech stack

- **Vite + React** (no framework — client-side SPA)
- **Tailwind CSS v4** — config lives in `src/index.css` under `@theme`, not `tailwind.config.js`
- **Supabase** (`@supabase/supabase-js`) — Postgres + Auth + Storage
- **React Router v6** — all routes in `src/App.jsx`
- **@dnd-kit** — drag-and-drop for kanban boards
- **@tanstack/react-query** — data fetching and caching
- **date-fns** — date formatting and run/renewal calculations

## Project structure

```
src/
  components/
    layout/       Shell.jsx (root layout), Topbar.jsx, AgendaSidebar.jsx
    board/        BoardView.jsx, BoardColumn.jsx, DealCard.jsx
    shared/       PartnerTypeTag.jsx — reuse this for all partner type display
  pages/          One file per route. Board.jsx is the default landing.
  lib/
    supabase.js   Supabase client — import { supabase } from '../lib/supabase'
supabase/
  schema.sql      Full DB schema — run in Supabase SQL editor to reset/init
```

## Brand design system

All colors and fonts come from the parent workspace's `brand/overview.md` (v2, refreshed 2026-08-11). Never deviate.

| Token | Value | Use for |
|---|---|---|
| Mysyde Blue (primary) | `#1D4ED8` | Topbar, primary buttons, column headers, links |
| Mysyde Blue Dark | `#1E40AF` | Hover / pressed states |
| Amber (accent) | `#F59E0B` | Highlights, warnings, celebratory moments |
| Ink | `#111827` | All body text and headings |
| Muted | `#6B7280` | Secondary text |
| App Background | `#F9FAFB` | Page background, column backgrounds |
| Border | `#E5E7EB` | Standard borders / dividers |
| White | `#FFFFFF` | Cards, modals, sidebar |
| Emerald | `#10B981` | Success / done tasks |
| Rose | `#E11D48` | Danger / destructive actions |

**Retired:** `#02348E` (too dark), `#FFEC00` (community yellow), `#010100` (pure black), `#F2F3F7` (old bg). Do not reintroduce.

**Fonts** — **Manrope only**, loaded via Google Fonts in `src/index.css`. Weights: 400 · 500 · 600 · 700 · 800.

Manrope is set as the default body font — inline `style={{ fontFamily: ... }}` overrides are no longer required for regular text. Use Tailwind weight utilities (`font-medium`, `font-semibold`, `font-bold`, `font-extrabold`) instead.

**Radii** (available as CSS vars in `@theme`):
- Buttons: `8px` (`--radius-btn`)
- Cards: `14px` (`--radius-card`)
- Pills / chips: full round (`--radius-pill`)

**Partner type color pills** — always use `<PartnerTypeTag type={partner.type} />` from `src/components/shared/PartnerTypeTag.jsx`. Never inline partner type colors.

## Database

Schema: `supabase/schema.sql`. All tables use `uuid` PKs with `gen_random_uuid()`.

Key tables and their stage/status enums:

| Table | Key enum field | Values |
|---|---|---|
| `deals` | `stage` | prospect → pitched → proposal → creative → live → closed_won / closed_lost |
| `deals` | `design_status` | none → briefed → in_progress → revised → approved → uploaded |
| `tasks` | `status` | todo → in_progress → review → done |
| `posts` | `status` | idea → draft → review → scheduled → live → archived |
| `partners` | `type` | chamber, city_gov, downtown_assoc, community_org, local_business, nonprofit, other |
| `kiosks` | `status` | active, inactive, pending |

`deals.total_value` and `deals.renewal_alert` are **generated columns** — never write to them directly.

## Patterns

**Supabase reads** — always join related tables inline:
```js
supabase.from('deals').select('*, partners(name, type)')
```

**Sample data fallback** — Board, Partners, and Contacts pages define `SAMPLE_*` constants at the top. If Supabase returns 0 rows or errors, sample data stays visible so the UI is never blank during development.

**Stage changes** on the kanban use optimistic local state update first, then `supabase.from('deals').update({ stage })` — the `.catch(() => null)` is intentional (silent fail when Supabase isn't connected).

**Stub pages** — Tasks, Social, Kiosks, Calendar, Dashboard render `<ComingSoon>` from `src/pages/Tasks.jsx`. When building Phase 2+, replace the export in the relevant page file.

## Environment

Required in `.env.local` (never commit):
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_GOOGLE_CLIENT_ID=
VITE_CANVA_CLIENT_ID=
```
MailerLite API key goes in Supabase Edge Function secrets only — never in frontend env.

## Build phases

| Phase | Scope |
|---|---|
| 1 ✅ | Foundation: Shell, Board, Partners, Contacts, schema |
| 2 | DealRecord, PartnerRecord, KioskRecord, ActivityLog |
| 3 | Task boards (dnd-kit), recurring tasks, per-partner tabs |
| 4 | Social module — content calendar, post management, Canva linking |
| 5 | Google OAuth, Calendar/Gmail integration, MailerLite Edge Function |
| 6 | Dashboard, global search, renewal alert emails, CSV export |
