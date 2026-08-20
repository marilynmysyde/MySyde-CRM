-- Run this in the Supabase SQL editor (project wyguubkjefkefqosguio) to bring
-- the live `deals` table in line with schema.sql. Safe: 0 rows in the table
-- today, so this is a pure schema fix, no data migration needed.
--
-- What this fixes: the live table is still on the PRE-rate-card-v2 shape
-- (columns: type, package, design_included, design_fee). The 2026-08-14
-- rate card rebuild updated schema.sql and the whole frontend (PlacementSelector,
-- DealCard, rateCard.js) to use placement_type/package_key/screen/pricing_tier/
-- launch_pricing instead — but this ALTER was never actually run against
-- production. Any deal created since 8/14 using the new fields would have
-- silently failed to save (writes get swallowed by a .catch(() => null) in
-- the frontend) or errored with "column does not exist."

alter table deals
  drop column if exists type,
  drop column if exists package,
  drop column if exists design_included,
  drop column if exists design_fee;

alter table deals
  add column placement_type text check (placement_type in (
    'top_banner','bottom_banner','middle_takeover','featured_box',
    'search_button','primary_wrap','side_qr_tile','featured_event',
    'map_stand_out','map_name_under','map_name_category','map_bundle',
    'package'
  )),
  add column package_key text,
  add column screen text check (screen in ('screen_1','screen_2','both')),
  add column pricing_tier text default 'option_2' check (pricing_tier in ('option_1','option_2','option_3')),
  add column launch_pricing boolean default false;

-- Verify after running:
-- select column_name from information_schema.columns where table_name = 'deals' order by ordinal_position;
-- Should include: placement_type, package_key, screen, pricing_tier, launch_pricing
-- Should NOT include: type, package, design_included, design_fee
