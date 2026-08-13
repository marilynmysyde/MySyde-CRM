-- ═════════════════════════════════════════════════════════════════════════
-- Morgan Hill launch seed data
-- Paste into Supabase SQL editor at supabase.com/dashboard.
-- Idempotent — safe to run twice; will not create duplicates.
-- ═════════════════════════════════════════════════════════════════════════

-- ─── The 3 institutional partners for kiosk launch ─────────────────────────

insert into partners (name, type, website)
select 'Morgan Hill Chamber of Commerce', 'chamber', 'https://morganhill.org'
where not exists (select 1 from partners where name = 'Morgan Hill Chamber of Commerce');

insert into partners (name, type)
select 'Downtown Morgan Hill Association', 'downtown_assoc'
where not exists (select 1 from partners where name = 'Downtown Morgan Hill Association');

insert into partners (name, type, website)
select 'City of Morgan Hill', 'city_gov', 'https://morgan-hill.ca.gov'
where not exists (select 1 from partners where name = 'City of Morgan Hill');


-- ─── The Morgan Hill kiosk itself (owned by Downtown MH Assoc) ─────────────

insert into kiosks (name, location, status, partner_id)
select
  'Downtown Morgan Hill Kiosk',
  'Downtown Morgan Hill, CA',
  'pending',
  (select id from partners where name = 'Downtown Morgan Hill Association')
where not exists (select 1 from kiosks where name = 'Downtown Morgan Hill Kiosk');
