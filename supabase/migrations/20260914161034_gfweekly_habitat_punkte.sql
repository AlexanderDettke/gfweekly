-- GF Weekly V17 · Habitat-Punkte (Spielsystem). Angewendet am 14.09.2026 als Migration "gfweekly_habitat_punkte".
-- Regeln und Stufen liegen in Tabellen und lassen sich ohne Code ändern (Edge Function cached sie kurz).

create table if not exists public.gfweekly_score_rules (
  kind text primary key, points integer not null default 0, cap_per_day integer,
  label text not null default '', icon text not null default '', sort_order integer not null default 100);
create table if not exists public.gfweekly_score_levels (
  key text primary key, label text not null, threshold integer not null, image text not null default '', sort_order integer not null default 0);
create table if not exists public.gfweekly_score_events (
  id uuid primary key default gen_random_uuid(), who text not null default 'Team', kind text not null, points integer not null default 0,
  ref_type text not null default '', ref_id text not null default '', day date not null, week text not null, year integer not null,
  note text not null default '', created_at timestamptz not null default now());
create unique index if not exists gfweekly_score_events_uniq on public.gfweekly_score_events (kind, ref_id, who) where (ref_id <> '');
create index if not exists gfweekly_score_events_year_idx on public.gfweekly_score_events (year, who);
create index if not exists gfweekly_score_events_day_idx on public.gfweekly_score_events (day);
create table if not exists public.gfweekly_checkins (
  who text not null, day date not null, hour integer not null default 12, created_at timestamptz not null default now(), primary key (who, day));
create table if not exists public.gfweekly_badges (
  key text not null, who text not null default 'Team', year integer not null, earned_at timestamptz not null default now(), ref text not null default '', primary key (key, who, year));

alter table public.gfweekly_score_rules enable row level security;
alter table public.gfweekly_score_levels enable row level security;
alter table public.gfweekly_score_events enable row level security;
alter table public.gfweekly_checkins enable row level security;
alter table public.gfweekly_badges enable row level security;
-- Zugriff ausschließlich über die Edge Function (Service-Role); keine Policies für anon/authenticated.

insert into public.gfweekly_score_rules (kind, points, cap_per_day, label, icon, sort_order) values
  ('einchecken',5,1,'Eingecheckt','punkte-einchecken',10),
  ('serie_3',15,null,'Drei Tage in Folge','streak-2-flamme',11),
  ('serie_7',40,null,'Sieben Tage in Folge','streak-3-feuer',12),
  ('serie_14',80,null,'Vierzehn Tage in Folge','streak-3-feuer',13),
  ('serie_30',150,null,'Dreißig Tage in Folge','streak-4-fest',14),
  ('thema_neu',3,5,'Thema eingebracht','punkte-thema-neu',20),
  ('thema_vollstaendig',5,5,'Vollständiges Thema eingebracht','punkte-thema-neu',21),
  ('saat',10,null,'Saat aufgegangen','punkte-saat',22),
  ('bewegen',3,null,'Verantwortung und nächster Schritt','punkte-bewegen',30),
  ('behandelt',5,null,'Thema in Besprechung behandelt','punkte-besprechung',31),
  ('thema_erledigt',10,null,'Thema erledigt','punkte-thema',40),
  ('entscheidung',25,null,'Entscheidung festgehalten','punkte-entscheidung',41),
  ('ritual',15,null,'Ritual abgehakt','punkte-ritual',42),
  ('meilenstein',50,null,'Meilenstein erreicht','punkte-meilenstein',43),
  ('altlast',15,null,'Altlast geräumt','punkte-altlast',44),
  ('besprechung',20,null,'Besprechung abgeschlossen','punkte-besprechung',45),
  ('wochenmail',5,null,'Wochenmail erzeugt','punkte-taler',46),
  ('protokoll',5,null,'Protokoll verschickt','punkte-taler',47),
  ('tagesziel',10,null,'Tagesziel erfüllt','punkte-tagesziel',50),
  ('wochenziel',40,null,'Wochenziel erfüllt','punkte-wochenziel',51),
  ('phase_komplett',100,null,'Alle Rituale der Phase','abzeichen-ritualmeister',52),
  ('abzeichen',25,null,'Abzeichen','punkte-taler',60),
  ('levelup',0,null,'Neue Habitat-Stufe','punkte-levelup',61)
on conflict (kind) do nothing;

insert into public.gfweekly_score_levels (key, label, threshold, image, sort_order) values
  ('lichtung','Lichtung',0,'habitat-1-lichtung',1),
  ('lagerplatz','Lagerplatz',600,'habitat-2-lagerplatz',2),
  ('dorf','Dorf',1800,'habitat-3-dorf',3),
  ('festival','Festival',3600,'habitat-4-festival',4),
  ('habitat','Habitat',6000,'habitat-5-habitat',5)
on conflict (key) do nothing;
