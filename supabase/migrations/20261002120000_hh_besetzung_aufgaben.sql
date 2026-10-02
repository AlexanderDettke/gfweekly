-- Das Hohe Haus · Aufgaben aus der Besetzungswerkstatt (Paket Besetzung B1, 02.10.2026)
-- Führende Quellen: Partner, Angebote, Festivalzuordnungen, Gesprächsstand, Gesprächszuständigkeit und nächster
-- Schritt bleiben im Habitat Hub (Schema hub, Tabellen besetzung_*). Das Hohe Haus liest sie nur und schreibt nie dorthin.
-- Führend im Hohen Haus: Aufgaben, die aus einem Gespräch entstehen (wer, was, bis wann, Aufgabenstand).
-- Bezug auf den Hub über stabile Kennungen; keine Kopie von Partnerprofilen, Kontaktdaten oder Originalquellen.

create table if not exists public.gfweekly_besetzung_aufgaben (
  id uuid primary key default gen_random_uuid(),
  zuordnung_id uuid not null,              -- hub.besetzung_zuordnungen.id (Gespräch je Angebot, Festival, Saison, Bereich)
  angebot_id uuid not null,                -- hub.besetzung_angebote.id
  partner_id uuid not null,                -- hub.besetzung_partner.id
  format_slug text not null,               -- hub.besetzung_formate.slug
  jahr integer not null check (jahr between 2026 and 2100),
  bereich text not null check (length(bereich) between 1 and 160),
  titel text not null check (length(btrim(titel)) between 1 and 300),
  titel_schluessel text generated always as (lower(regexp_replace(btrim(titel), '\s+', ' ', 'g'))) stored,
  beschreibung text not null default '' check (length(beschreibung) <= 4000),
  person_id uuid references public.gfweekly_people(id),   -- eindeutige Person aus dem Pool; leer = noch unbesetzt
  status text not null default 'offen' check (status in ('offen','in_arbeit','erledigt','verworfen')),
  faellig date,
  aus_schritt text not null default '',    -- Wortlaut des nächsten Schritts im Hub zum Zeitpunkt der Übernahme
  aus_schritt_version integer,             -- Version der Hub-Zuordnung zum Zeitpunkt der Übernahme
  erstellt_von text not null,
  geaendert_von text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  erledigt_at timestamptz,
  version integer not null default 1,
  asana_task_gid text unique,
  asana_gesendet_at timestamptz,
  asana_gesendet_von text,
  asana_sync_at timestamptz,
  constraint gfweekly_besetzung_aufgaben_einmal unique (zuordnung_id, titel_schluessel)
);
create index if not exists gfweekly_besetzung_aufgaben_fest on public.gfweekly_besetzung_aufgaben (format_slug, jahr);
create index if not exists gfweekly_besetzung_aufgaben_person on public.gfweekly_besetzung_aufgaben (person_id);

create table if not exists public.gfweekly_besetzung_aufgaben_log (
  id bigint generated always as identity primary key,
  aufgabe_id uuid not null,
  wer text not null,
  was text not null,
  alt jsonb,
  neu jsonb,
  at timestamptz not null default now()
);
create index if not exists gfweekly_besetzung_aufgaben_log_a on public.gfweekly_besetzung_aufgaben_log (aufgabe_id, at desc);

create or replace function public.hh_besetzung_aufgaben_protokoll() returns trigger
language plpgsql set search_path = public, pg_temp as $$
begin
  if tg_op = 'INSERT' then
    insert into public.gfweekly_besetzung_aufgaben_log(aufgabe_id, wer, was, neu)
    values (new.id, new.erstellt_von, 'angelegt', to_jsonb(new) - 'titel_schluessel');
  elsif tg_op = 'UPDATE' then
    -- Reiner Abgleich (nur Zeitstempel des Asana-Abgleichs oder die Sendesperre) wird nicht protokolliert.
    if (to_jsonb(old) - array['titel_schluessel','asana_sync_at','asana_gesendet_at','asana_gesendet_von'])
       = (to_jsonb(new) - array['titel_schluessel','asana_sync_at','asana_gesendet_at','asana_gesendet_von']) then
      return new;
    end if;
    insert into public.gfweekly_besetzung_aufgaben_log(aufgabe_id, wer, was, alt, neu)
    values (new.id, new.geaendert_von, 'geaendert', to_jsonb(old) - 'titel_schluessel', to_jsonb(new) - 'titel_schluessel');
  end if;
  return new;
end $$;
drop trigger if exists hh_besetzung_aufgaben_protokoll on public.gfweekly_besetzung_aufgaben;
create trigger hh_besetzung_aufgaben_protokoll after insert or update on public.gfweekly_besetzung_aufgaben
  for each row execute function public.hh_besetzung_aufgaben_protokoll();
revoke all on function public.hh_besetzung_aufgaben_protokoll() from public, anon, authenticated;

alter table public.gfweekly_besetzung_aufgaben enable row level security;
alter table public.gfweekly_besetzung_aufgaben_log enable row level security;
revoke all on public.gfweekly_besetzung_aufgaben, public.gfweekly_besetzung_aufgaben_log from anon, authenticated, public;
grant all on public.gfweekly_besetzung_aufgaben, public.gfweekly_besetzung_aufgaben_log to service_role;

-- Lesesicht für die Edge Function „besetzung“ (nur service_role). Liefert aus dem Hub ausschließlich, was die
-- Geschäftsführung zum Verteilen braucht: Partnername und Art, ob ein Sperrhinweis besteht (nicht sein Text),
-- Angebotstitel, Zuordnung mit Gesprächsstand, Gesprächszuständigkeit (Text), nächstem Schritt, Termin, Version.
-- Keine E-Mail, Website, Notiz, Gesprächsnotizen oder Originalquellen.
create or replace function public.hh_besetzung_lage(p_jahr integer default null) returns jsonb
language plpgsql stable security definer set search_path = public, hub, pg_temp as $$
declare j integer; r jsonb;
begin
  j := coalesce(p_jahr, (select max(jahr) from hub.besetzung_zuordnungen), extract(year from now())::int + 1);
  select jsonb_build_object(
    'jahr', j,
    'jahre', coalesce((select jsonb_agg(x order by x) from (
        select distinct jahr x from hub.besetzung_zuordnungen
        union select distinct jahr from public.gfweekly_besetzung_aufgaben
        union select j) s), '[]'::jsonb),
    'formate', coalesce((select jsonb_agg(jsonb_build_object('slug', f.slug, 'name', f.name, 'bereiche', f.bereiche,
        'konzept_da', length(btrim(f.konzept)) > 0) order by f.name) from hub.besetzung_formate f), '[]'::jsonb),
    'zuordnungen', coalesce((select jsonb_agg(jsonb_build_object(
        'id', z.id, 'angebot_id', z.angebot_id, 'partner_id', a.partner_id, 'partner', p.name, 'partner_art', p.art,
        'gesperrt', p.sperre is not null, 'angebot', a.titel, 'kategorie', a.kategorie,
        'format_slug', z.format_slug, 'jahr', z.jahr, 'bereich', z.bereich, 'status', z.status,
        'verantwortlich', z.verantwortlich, 'naechster_schritt', z.naechster_schritt, 'faellig', z.faellig,
        'version', z.version, 'updated_at', z.updated_at,
        'geaendert_von', (select pr.anzeigename from hub.profile pr where pr.user_id = z.geaendert_von),
        'notizen', (select count(*) from hub.besetzung_notizen n where n.zuordnung_id = z.id))
        order by z.updated_at desc)
      from hub.besetzung_zuordnungen z
      join hub.besetzung_angebote a on a.id = z.angebot_id
      join hub.besetzung_partner p on p.id = a.partner_id
      where z.jahr = j), '[]'::jsonb),
    'bestand', jsonb_build_object('partner', (select count(*) from hub.besetzung_partner),
        'angebote', (select count(*) from hub.besetzung_angebote))
  ) into r;
  return r;
end $$;
revoke all on function public.hh_besetzung_lage(integer) from public, anon, authenticated;
grant execute on function public.hh_besetzung_lage(integer) to service_role;

-- Prüfung beim Übernehmen: gibt die Hub-Zuordnung mit Partner- und Angebotsbezug zurück oder null.
create or replace function public.hh_besetzung_zuordnung(p_id uuid) returns jsonb
language sql stable security definer set search_path = public, hub, pg_temp as $$
  select jsonb_build_object('id', z.id, 'angebot_id', z.angebot_id, 'partner_id', a.partner_id, 'partner', p.name,
    'angebot', a.titel, 'format_slug', z.format_slug, 'format', f.name, 'jahr', z.jahr, 'bereich', z.bereich,
    'status', z.status, 'verantwortlich', z.verantwortlich, 'naechster_schritt', z.naechster_schritt,
    'faellig', z.faellig, 'version', z.version)
  from hub.besetzung_zuordnungen z
  join hub.besetzung_angebote a on a.id = z.angebot_id
  join hub.besetzung_partner p on p.id = a.partner_id
  join hub.besetzung_formate f on f.slug = z.format_slug
  where z.id = p_id
$$;
revoke all on function public.hh_besetzung_zuordnung(uuid) from public, anon, authenticated;
grant execute on function public.hh_besetzung_zuordnung(uuid) to service_role;
