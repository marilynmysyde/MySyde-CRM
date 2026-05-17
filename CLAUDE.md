# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

MySyde CRM — the internal operating system for MySyde (Aligned Abundance Inc.). Manages sales pipeline for kiosk ad space, partner relationships, social content, task tracking, and kiosk operations across 7+ community association partners.

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

All colors and fonts come from the parent workspace's `brand/overview.md`. Never deviate.

| Token | Value | Use for |
|---|---|---|
| MySyde Blue | `#02348E` | Topbar, primary buttons, column headers, links |
| Community Yellow | `#FFEC00` | Active nav tab, accents, hover highlights |
| Black | `#010100` | All body text and headings |
| Light Gray | `#F2F3F7` | App background, column backgrounds |
| White | `#FFFFFF` | Cards, modals, sidebar |

**Fonts** — loaded via Google Fonts in `src/index.css`:
- `IBM Plex Sans` — page titles, column headers (`font-family: "'IBM Plex Sans', sans-serif"`)
- `Roboto` — nav labels, buttons, form labels
- `Roboto Condensed` — card body text, data values, timestamps

Apply fonts inline (`style={{ fontFamily: ... }}`) since Tailwind v4 custom font utilities aren't yet configured.

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
