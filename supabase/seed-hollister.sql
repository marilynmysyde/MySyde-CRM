-- ═════════════════════════════════════════════════════════════════════════
-- Hollister partner seed data
-- Paste into Supabase SQL editor at supabase.com/dashboard.
-- Idempotent — safe to run twice; will not create duplicates.
-- ═════════════════════════════════════════════════════════════════════════

-- ─── City of Hollister — Economic Development Department ───────────────────

insert into partners (name, type, website, notes)
select
  'City of Hollister — Economic Development',
  'city_gov',
  'https://hollister.ca.gov',
  'Economic Development Department. Kiosk installation in progress — installation and permitting overview drafted for Ana Cortez 2026-10-02.'
where not exists (select 1 from partners where name = 'City of Hollister — Economic Development');

insert into contacts (name, email, role, partner_id)
select
  'Ana Cortez',
  'ana.cortez@hollister.ca.gov',
  'Economic Development',
  (select id from partners where name = 'City of Hollister — Economic Development')
where not exists (select 1 from contacts where email = 'ana.cortez@hollister.ca.gov');
