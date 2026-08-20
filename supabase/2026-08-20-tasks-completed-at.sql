-- Run in the Supabase SQL editor (project wyguubkjefkefqosguio).
-- Additive + nullable — safe with existing task rows, no data loss.
--
-- Powers the Done-column rolling window (Tasks page): tasks completed more
-- than 7 days ago collapse behind a "Show older" toggle instead of piling
-- up on the board forever. Existing done tasks (completed before this
-- column existed) will have completed_at = null and are treated as
-- "older" by default until reopened/re-closed once.

alter table tasks
  add column if not exists completed_at timestamp with time zone;
