-- Kompass · Verkauf 2027 je Festival auf „Für dich“ (25.10.2026). Auftrag: docs/PAKET-VERKAUF-2027.md, Stufe 1a.
-- hh_verkauf_ziel: Ziel, Minimalfall, VVK-Start und Festivalbeginn je Festival und Saison. event_id verweist nur auf
-- vvp_events (kein Fremdschlüssel); in vvp_* wird nichts geschrieben.
-- hh_verkauf_stand: Verkaufsstände je Stichtag und Quelle (Stufe 1 nur hand, Stufe 2 xceed_api).
-- Zugriff nur über die passwortgeschützte Edge Function (service_role), RLS an ohne Policies wie die anderen Kompass-Tabellen.
-- Seed Saison 2027 nach der Vorgabe vom 24.10.2026; Abweichungen zu vvp_events stehen im Paket (Abschnitt 0).
-- Rückweg (löscht auch alle eingetragenen Stände):
--   drop table public.hh_verkauf_stand; drop table public.hh_verkauf_ziel;
set lock_timeout = '10s';

create table public.hh_verkauf_ziel (
  festival_key text not null check (festival_key ~ '^[a-z0-9-]{2,40}$'),
  saison int not null check (saison between 2020 and 2100),
  name text not null check (length(trim(name)) between 1 and 120),
  ziel_tickets int not null check (ziel_tickets > 0),
  minimal_tickets int check (minimal_tickets >= 0),
  vvk_start date,
  festival_von date not null,
  event_id uuid,
  sort int not null default 0,
  aktiv boolean not null default true,
  primary key (festival_key, saison)
);

create table public.hh_verkauf_stand (
  id uuid primary key default gen_random_uuid(),
  festival_key text not null,
  saison int not null,
  stichtag date not null,
  tickets int not null check (tickets >= 0),
  umsatz_brutto_cents bigint check (umsatz_brutto_cents >= 0),
  quelle text not null check (quelle in ('hand','xceed_api','xceed_mail')),
  notiz text check (notiz is null or length(notiz) <= 500),
  "by" text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (festival_key, saison, stichtag, quelle),
  foreign key (festival_key, saison) references public.hh_verkauf_ziel (festival_key, saison) on update cascade
);
create index hh_verkauf_stand_lage on public.hh_verkauf_stand (saison, festival_key, stichtag desc);

alter table public.hh_verkauf_ziel enable row level security;
alter table public.hh_verkauf_stand enable row level security;
revoke all on public.hh_verkauf_ziel, public.hh_verkauf_stand from public, anon, authenticated;
grant all on public.hh_verkauf_ziel, public.hh_verkauf_stand to service_role;

insert into public.hh_verkauf_ziel (festival_key, saison, name, ziel_tickets, minimal_tickets, vvk_start, festival_von, event_id, sort) values
  ('fluidity',      2027, 'Fluidity',                         5000, 1500, '2026-08-01', '2027-08-27', '7125581f-c5c5-45c7-80f0-51e4056951d4', 1),
  ('wilde-moehre',  2027, 'Wilde Möhre Freude Edition',       5000, 3500, '2026-09-01', '2027-08-20', '2f1f096a-1df9-4795-8ade-400ccb0b45a4', 2),
  ('draussenbande', 2027, 'Malina, Morio & die Draußenbande', 3000, 2000, '2026-10-01', '2027-07-29', '44dee651-47b8-4bd4-af38-f2014d571fbd', 3),
  ('lusatia',       2027, 'Lusatia',                          4500, 2000, null,         '2027-07-23', 'eaf9bd69-c54b-446d-809f-eb20a2369cdd', 4),
  ('by-nature',     2027, 'by nature',                        3500,    0, '2026-11-01', '2027-08-06', '6f6e1bcf-88fa-4989-9711-b4bc40f5c491', 5);
