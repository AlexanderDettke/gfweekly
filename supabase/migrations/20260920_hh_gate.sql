-- Das Hohe Haus V22a (20.09.2026) · Pförtner: jeder offene Eintrag bekommt einen Ausgang.
-- gate: gf (GF gemeinsam) · alex · lea · team · plattform · warten (kann warten). gate_by = 'lauf' heißt Vorschlag des täglichen Laufs,
-- sonst der Name der Person, die bestätigt hat. gate_frist: nur wenn etwas passiert, falls nichts entschieden wird.
alter table public.gfweekly_topics
  add column if not exists gate text,
  add column if not exists gate_frist date,
  add column if not exists gate_by text,
  add column if not exists gate_at timestamptz,
  add column if not exists gate_note text;
alter table public.gfweekly_news
  add column if not exists gate text,
  add column if not exists gate_frist date,
  add column if not exists gate_by text,
  add column if not exists gate_at timestamptz,
  add column if not exists gate_note text;
alter table public.gfweekly_topics drop constraint if exists gfweekly_topics_gate_check;
alter table public.gfweekly_topics add constraint gfweekly_topics_gate_check
  check (gate is null or gate in ('gf','alex','lea','team','plattform','warten'));
alter table public.gfweekly_news drop constraint if exists gfweekly_news_gate_check;
alter table public.gfweekly_news add constraint gfweekly_news_gate_check
  check (gate is null or gate in ('gf','alex','lea','team','plattform','warten'));
create index if not exists gfweekly_topics_gate_idx on public.gfweekly_topics (gate, gate_frist);
create index if not exists gfweekly_news_gate_idx on public.gfweekly_news (gate, gate_frist) where kind = 'kandidat';
comment on column public.gfweekly_topics.gate is 'Das Hohe Haus V22: Ausgang des Pförtners (gf|alex|lea|team|plattform|warten).';
comment on column public.gfweekly_news.gate is 'Das Hohe Haus V22: Ausgang des Pförtners für Kandidaten (gf|alex|lea|team|plattform|warten).';
