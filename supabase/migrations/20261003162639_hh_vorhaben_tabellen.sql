-- V31 Vorhaben: Tabellen. Angewendet am 03.10.2026 aus Cowork per Supabase-MCP (Version 20261003162639).
create table if not exists public.hh_vorhaben (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  gruppe text not null default 'sonstiges' check (gruppe in ('launch','geld','team','partner','system','sonstiges')),
  strand text,
  metaphase text,
  saison_row_id text,
  saison_item_id uuid,
  ball text not null default 'offen' check (ball in ('alex','lea','gf','team','extern','offen')),
  ball_name text,
  ball_seit timestamptz,
  owner text check (owner is null or owner in ('alex','lea','gf')),
  stand text,
  naechster_schritt text,
  frist date,
  frist_text text,
  konflikt text,
  status text not null default 'aktiv' check (status in ('aktiv','pausiert','erledigt','archiviert')),
  sort integer default 100,
  quellen jsonb not null default '[]'::jsonb,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.hh_vorhaben_punkte (
  id uuid primary key default gen_random_uuid(),
  vorhaben_id uuid not null references public.hh_vorhaben(id) on delete cascade,
  titel text not null,
  position text,
  stand text,
  wer text,
  frist date,
  erledigt boolean not null default false,
  erledigt_at timestamptz,
  erledigt_by text,
  sort integer default 100,
  quelle text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists hh_vorhaben_punkte_vh on public.hh_vorhaben_punkte(vorhaben_id, sort);
create table if not exists public.hh_vorhaben_verlauf (
  id uuid primary key default gen_random_uuid(),
  vorhaben_id uuid not null references public.hh_vorhaben(id) on delete cascade,
  happened_at timestamptz not null default now(),
  art text not null default 'notiz' check (art in ('whatsapp','telefon','mail','plattform','notiz','einwurf','uebergabe','system','entscheidung','kalender','termin')),
  wer text,
  text text not null,
  tag text,
  news_id uuid,
  source_ref text unique,
  source_url text,
  status text not null default 'bestaetigt' check (status in ('bestaetigt','vorschlag','verworfen')),
  created_by text,
  created_at timestamptz not null default now()
);
create index if not exists hh_vorhaben_verlauf_vh on public.hh_vorhaben_verlauf(vorhaben_id, happened_at desc);
create table if not exists public.hh_einwurf (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  von text not null,
  kanal text not null default 'knopf' check (kanal in ('knopf','mail','cowork','whatsapp','sprache')),
  text text not null,
  vorhaben_id uuid references public.hh_vorhaben(id) on delete set null,
  vorschlag jsonb,
  status text not null default 'neu' check (status in ('neu','vorgeschlagen','uebernommen','verworfen')),
  source_ref text unique,
  entschieden_by text,
  entschieden_at timestamptz
);
create index if not exists hh_einwurf_status on public.hh_einwurf(status, created_at desc);
alter table public.hh_vorhaben enable row level security;
alter table public.hh_vorhaben_punkte enable row level security;
alter table public.hh_vorhaben_verlauf enable row level security;
alter table public.hh_einwurf enable row level security;
revoke all on public.hh_vorhaben, public.hh_vorhaben_punkte, public.hh_vorhaben_verlauf, public.hh_einwurf from anon, authenticated;
