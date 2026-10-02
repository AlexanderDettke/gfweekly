-- Das Hohe Haus · V29 (02.10.2026): Zeitstempel des Rückwegs aus Asana je Launch-Plan.
-- launch_list ruft launch_sync auf, wenn der letzte Lauf älter als 60 Minuten ist; der Stand steht hier,
-- nicht in vvp_launch_plans.notes. Eigene Tabelle des Hohen Hauses, RLS an ohne Policies.
create table if not exists public.gfweekly_launch_sync(
  plan_id uuid primary key,
  synced_at timestamptz not null default now(),
  ergebnis jsonb,
  updated_at timestamptz not null default now());
alter table public.gfweekly_launch_sync enable row level security;
