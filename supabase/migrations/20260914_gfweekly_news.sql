-- GF Weekly V16: Neuigkeiten (Ticker, Sichtungskorb, Themenlage). Angewendet 14.09.2026 (Supabase-Migration gfweekly_news).
create table if not exists public.gfweekly_news (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('ticker','kandidat','lage')),
  happened_at timestamptz not null default now(),
  who text not null default '',                -- Alex, Lea, Alex & Lea, Team, Partner
  source text not null default 'notiz' check (source in ('notiz','asana','kalender','mail','protokoll','entscheidung','manuell')),
  strand text not null default '',             -- key aus gfweekly_strands oder ''
  title text not null,
  body text not null default '',
  quote text not null default '',
  source_title text not null default '',
  source_url text not null default '',
  source_ref text not null default '',         -- Dedup-Schlüssel je Quelle (leer = kein Dedup)
  relevance text not null default 'mittel' check (relevance in ('hoch','mittel','niedrig')),
  topic_id uuid null references public.gfweekly_topics(id) on delete set null,
  status text not null default 'neu' check (status in ('neu','gesehen','uebernommen','verworfen')),
  decided_by text not null default '',
  decided_at timestamptz null,
  run_id text not null default '',
  created_at timestamptz not null default now()
);
create unique index if not exists gfweekly_news_source_ref_uq on public.gfweekly_news (source_ref) where source_ref <> '';
create index if not exists gfweekly_news_kind_happened_idx on public.gfweekly_news (kind, happened_at desc);
create index if not exists gfweekly_news_status_idx on public.gfweekly_news (status) where kind = 'kandidat';
alter table public.gfweekly_news enable row level security;
comment on table public.gfweekly_news is 'GF Weekly Neuigkeiten: Ticker-Zeilen, Kandidaten für den Sichtungskorb und Themenlage je Strang. Befüllt vom täglichen Auftrag; nur über Edge Function gfweekly lesbar/schreibbar.';

-- Nachtrag (gleicher Tag): source_ref nullable + echte Unique-Constraint, damit PostgREST-Upsert (onConflict) greift.
drop index if exists public.gfweekly_news_source_ref_uq;
alter table public.gfweekly_news alter column source_ref drop not null, alter column source_ref drop default;
alter table public.gfweekly_news add constraint gfweekly_news_source_ref_key unique (source_ref);
