-- Das Hohe Haus V24a (21.09.2026) · Vertretung: Abwesenheiten, Vertretungslinie, Übergabekorb, Protokoll.
-- Der Knopf „Abwesenheit“ existiert damit im Backend: der Korb baut sich selbst, bewertet sich selbst
-- (Matrix in der Edge Function, Aktion handover_build) und hält sich täglich aktuell (absence_tick).
-- RLS ist an, ohne Policies: gelesen und geschrieben wird ausschließlich über die Edge Function gfweekly
-- mit dem service_role-Schlüssel, genau wie bei gfweekly_news.

-- ---------- Abwesenheiten ----------
create table if not exists public.gfweekly_absences (
  id uuid primary key default gen_random_uuid(),
  person text not null,
  von date not null,
  bis date,                                   -- null = offenes Ende
  bis_geschaetzt date,                        -- Schätzung, wenn bis fehlt
  art text not null check (art in ('geplant','sofort')),
  kontakt text not null check (kontakt in ('keiner','wochenbrief','gespraech')),
  kanal text,                                 -- freier Text, z. B. „Signal, nur Notfall“
  gespraech_zeit text,
  vertretung_standard text,
  stufe text check (stufe in ('kurz','mittel','lang')),
  status text not null default 'geplant' check (status in ('geplant','aktiv','rueckkehr','beendet')),
  test boolean not null default false,
  note text,
  note_rueckkehr text,                        -- Rückkehr-Briefing, vom Tick geschrieben
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.gfweekly_absences is
  'Das Hohe Haus V24a: Abwesenheiten der GF. stufe ergibt sich aus der Dauer (<= 3 Tage kurz, <= 14 mittel, sonst lang; ohne bis kurz), status wandert geplant -> aktiv -> rueckkehr -> beendet. test = true sind Testdaten und werden gelöscht.';
create index if not exists gfweekly_absences_status_idx on public.gfweekly_absences (status, von);
create index if not exists gfweekly_absences_person_idx on public.gfweekly_absences (person, status);
alter table public.gfweekly_absences enable row level security;

-- ---------- Vertretungslinie ----------
create table if not exists public.gfweekly_deputies (
  id uuid primary key default gen_random_uuid(),
  person text not null,
  bereich text not null,                      -- Strang-Schlüssel aus gfweekly_strands, 'gf' oder '*'
  vertretung text not null,
  vollmacht text,
  sort int not null default 100,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (person, bereich)
);
comment on table public.gfweekly_deputies is
  'Das Hohe Haus V24a: Wer vertritt wen in welchem Bereich, mit welcher Vollmacht. bereich = Strang-Schlüssel, ''gf'' (Geschäftsführungssachen) oder ''*'' (Rest).';
create index if not exists gfweekly_deputies_person_idx on public.gfweekly_deputies (person, active);
alter table public.gfweekly_deputies enable row level security;

insert into public.gfweekly_deputies (person, bereich, vertretung, vollmacht, sort)
values
  ('Lea','gf','Alex','Ausgaben bis 2.000 € aus freigegebenen Budgets, keine neuen Verpflichtungen', 10),
  ('Alex','gf','Lea','Ausgaben bis 2.000 € aus freigegebenen Budgets, keine neuen Verpflichtungen', 10),
  ('Lea','*','Alex', null, 90),
  ('Alex','*','Lea', null, 90)
on conflict (person, bereich) do nothing;

-- ---------- Übergabekorb ----------
create table if not exists public.gfweekly_handover (
  id uuid primary key default gen_random_uuid(),
  absence_id uuid not null references public.gfweekly_absences(id) on delete cascade,
  kind text not null check (kind in ('thema','kandidat','meilenstein','ritual','termin','asana','partner')),
  ref_id text not null,
  title text,
  strand text,
  frist date,
  z int check (z between 0 and 3),
  f int check (f between 0 and 3),
  u int check (u between 0 and 3),
  g int check (g between 0 and 3),
  score int,
  dringend boolean,
  wichtig boolean,
  quadrant text check (quadrant in ('sofort','planen','delegieren','warten')),
  cluster text check (cluster in ('A','B','C','D','E')),
  vertretung text,
  ampel text check (ampel in ('gruen','gelb','rot','vorher','ruht')),
  regel_note text,
  begruendung text,                           -- ein Satz: warum die Matrix so gerechnet hat
  dossier jsonb not null default '{}'::jsonb,
  luecke boolean not null default false,      -- Stand fehlt
  status text not null default 'vorschlag' check (status in ('vorschlag','bestaetigt','erledigt','entfallen')),
  by text,                                    -- 'lauf' oder Person
  asana_gid text,
  asana_section text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (absence_id, kind, ref_id)
);
comment on table public.gfweekly_handover is
  'Das Hohe Haus V24a: Übergabekorb je Abwesenheit. Z/F/U/G sind die vier Achsen der Matrix (Zeitdruck, Folgen, Übertragbarkeit, Entscheidungsgewicht), begruendung nennt den Grund in einem Satz. Bestätigte Zeilen überschreibt der Lauf nie, er ergänzt nur frist, dossier und luecke.';
create index if not exists gfweekly_handover_absence_idx on public.gfweekly_handover (absence_id, status);
create index if not exists gfweekly_handover_frist_idx on public.gfweekly_handover (frist);
create index if not exists gfweekly_handover_status_idx on public.gfweekly_handover (status);
alter table public.gfweekly_handover enable row level security;

-- ---------- Vertretungsprotokoll ----------
create table if not exists public.gfweekly_handover_log (
  id uuid primary key default gen_random_uuid(),
  absence_id uuid not null references public.gfweekly_absences(id) on delete cascade,
  handover_id uuid references public.gfweekly_handover(id) on delete set null,
  at timestamptz not null default now(),
  who text,
  art text not null check (art in ('entscheidung','weitergabe','erledigt','notiz','asana','hochstufung','wache')),
  text text
);
comment on table public.gfweekly_handover_log is
  'Das Hohe Haus V24a: Protokoll der Vertretung. Jeder Eintrag wird in der Anzeige mit dem Vermerk „in Vertretung für <person>“ geführt.';
create index if not exists gfweekly_handover_log_absence_idx on public.gfweekly_handover_log (absence_id, at desc);
create index if not exists gfweekly_handover_log_handover_idx on public.gfweekly_handover_log (handover_id);
alter table public.gfweekly_handover_log enable row level security;

-- ---------- Themen: Vertretung sichtbar machen ----------
alter table public.gfweekly_topics
  add column if not exists owner_backup text,
  add column if not exists handover_id uuid;
comment on column public.gfweekly_topics.owner_backup is
  'Das Hohe Haus V24a: während einer aktiven Abwesenheit die Vertretung, bei Rückkehr wieder leer.';
comment on column public.gfweekly_topics.handover_id is
  'Das Hohe Haus V24a: Zeile im Übergabekorb, die dieses Thema trägt.';

-- ---------- Täglicher Tick (pg_cron + pg_net) ----------
-- Der Aufruf braucht das Passwort der Edge Function. Es steht NICHT im Job-Text, sondern im Vault
-- unter dem Namen 'gfweekly_password'. Fehlt das Secret, tut die Funktion nichts und sagt es im Protokoll;
-- der Job läuft dann als Leerlauf, bis das Secret angelegt ist (Fallback: Abschnitt H des täglichen Auftrags).
create extension if not exists pg_net;   -- legt Schema net an

create or replace function public.hh_absence_tick()
returns void
language plpgsql
security definer
set search_path = public, net, vault
as $$
declare
  pw text;
begin
  select decrypted_secret into pw from vault.decrypted_secrets where name = 'gfweekly_password' limit 1;
  if pw is null then
    raise notice 'hh_absence_tick: Vault-Secret gfweekly_password fehlt, nichts getan.';
    return;
  end if;
  perform net.http_post(
    url := 'https://bnfmupnmqyrcltrphfak.supabase.co/functions/v1/gfweekly',
    body := jsonb_build_object('action','absence_tick','password',pw,'payload', jsonb_build_object()),
    params := '{}'::jsonb,
    headers := '{"Content-Type":"application/json"}'::jsonb,
    timeout_milliseconds := 60000
  );
end;
$$;
revoke all on function public.hh_absence_tick() from public, anon, authenticated;
comment on function public.hh_absence_tick() is
  'Das Hohe Haus V24a: ruft die Edge Function gfweekly mit action absence_tick auf. Passwort aus dem Vault-Secret gfweekly_password, nie im Job-Text.';

select cron.unschedule('hh_absence_tick') where exists (select 1 from cron.job where jobname = 'hh_absence_tick');
select cron.schedule('hh_absence_tick', '40 4 * * *', $$select public.hh_absence_tick();$$);

-- Nachtrag 21.09.2026 (aus der Review): der Zeitpunkt der Rückkehr gehört in ein eigenes Feld.
-- Aus updated_at gerechnet konnten die drei Tage bis „beendet“ entfallen, weil updated_at älter sein kann.
alter table public.gfweekly_absences
  add column if not exists rueckkehr_at timestamptz;
comment on column public.gfweekly_absences.rueckkehr_at is
  'Das Hohe Haus V24a: Zeitpunkt des Wechsels auf status rueckkehr. Drei Tage später endet die Abwesenheit von selbst.';
