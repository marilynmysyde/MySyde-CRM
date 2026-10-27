-- Payments ledger: one row per real payment received from an advertiser.
-- Why: deals.invoice_status says "paid" but not WHEN or HOW MUCH, so the Chamber
-- 10% quarterly report (MOU effective 2025-12-16) can't be computed from deals alone.
-- Run in the Supabase SQL editor. Safe to re-run.
-- Includes explicit GRANTs because tables created after 2026-10-30 no longer get
-- default API access.

create table if not exists payments (
  id          uuid primary key default gen_random_uuid(),
  deal_id     uuid not null references deals(id) on delete cascade,
  amount      numeric(10,2) not null,            -- positive = received, negative = refund
  paid_on     date not null,                      -- date the money actually arrived
  method      text not null default 'stripe',     -- stripe | check | ach | cash | other
  notes       text,
  created_at  timestamptz not null default now()
);

create index if not exists payments_paid_on_idx on payments (paid_on);
create index if not exists payments_deal_idx    on payments (deal_id);

alter table payments enable row level security;

drop policy if exists "auth_all" on payments;
create policy "auth_all" on payments for all to authenticated using (true) with check (true);

grant select, insert, update, delete on payments to authenticated;
grant all on payments to service_role;

-- Backfill (confirmed amounts only). Guild's date is approximate (~April 2026, pre-install);
-- Marilyn to confirm. Rosy's first monthly payment 2026-09-30.
-- insert into payments (deal_id, amount, paid_on, method, notes)
-- select d.id, 375, '2026-09-30', 'stripe', 'Month 1 of 6, Stripe self-serve link'
--   from deals d join partners p on p.id = d.partner_id
--  where p.name = 'Rosy''s at the Beach' and d.placement_type = 'featured_box';
-- insert into payments (deal_id, amount, paid_on, method, notes)
-- select d.id, 300, '2026-04-15', 'other', 'One-time pre-launch payment, date approximate'
--   from deals d join partners p on p.id = d.partner_id
--  where p.name like 'Guild Mortgage%' and d.placement_type = 'top_banner';
