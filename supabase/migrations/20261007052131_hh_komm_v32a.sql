-- Das Hohe Haus · V32 Kommunikation, Teilpaket 32a (07.10.2026): Datenbasis des Postingplan-Standards.
-- Paket docs/PAKET-V32-KOMMUNIKATION.md. Präfix komm_, weil die Daten nicht GF-vertraulich sind und der Habitat Hub
-- sie für Partner und Redaktion liest.
--
-- Feldhoheit:
--   Plan- und Briefingfelder von komm_veroeffentlichungen (regel_id, titel, kanal, klasse, thema, bezug, abstand, t, t_neu,
--   vorlaeufig, pflicht, partnerfaehig, status_bearbeitung, status_fakten, briefing, stunden, hinweis, asana_task_gid,
--   gesendet_am) sowie komm_schritte, komm_pruefpunkte, komm_regelwerk und komm_log schreibt nur das Hohe Haus
--   (Edge Function gfweekly, Aktionen komm_*).
--   Partner- und Freigabefelder (partner_email, partner_name, partner_uebernommen_am, abgabe_url, abgabe_am,
--   rechte_bestaetigt, freigabe_status, freigabe_von, freigabe_am, freigabe_notiz) schreibt nur der Habitat Hub
--   (eigene Edge Function, Paket im Hub-Repo). Einzige Ausnahme laut Paket 32e: der tägliche Tick des Hauses setzt
--   freigabe_status = zurueck_an_redaktion, wenn ein partnerfähiger Beitrag 10 Tage vor T nicht übernommen ist.
-- RLS an, keine Policies; anon und authenticated ohne Rechte. Zugriff nur über Edge Functions (service_role),
-- wie bei gfweekly_launch_*.

create table if not exists public.komm_regelwerk(
  version text primary key,
  inhalt jsonb not null,
  aktiv boolean not null default false,
  eingespielt_am timestamptz not null default now());
create unique index if not exists komm_regelwerk_ein_aktives on public.komm_regelwerk(aktiv) where aktiv;

create table if not exists public.komm_veroeffentlichungen(
  id text primary key check (id ~ '^[a-z0-9]+-[0-9]{4}-[A-Za-z0-9-]+-[A-Za-z0-9-]*-[a-z_]*$'),
  event_id uuid references public.vvp_events(id),
  festival_short text not null,
  regel_id text not null,
  titel text not null,
  kanal text not null default '',
  klasse text not null check (klasse in ('S','M','P','L','NL','TM','WEB','PR','AD','INT')),
  thema text,
  bezug text not null,
  abstand int not null default 0,
  nr int not null default 1,
  t date not null,
  t_neu date,                                    -- neuer Termin aus der Rechnung, wenn die Veröffentlichung schon gesendet oder übernommen ist
  vorlaeufig boolean not null default false,
  pflicht boolean not null default true,
  partnerfaehig boolean not null default false,
  status_bearbeitung text not null default 'offen' check (status_bearbeitung in ('offen','in_arbeit','entwurf','in_abstimmung','freigegeben','eingeplant','veroeffentlicht','dokumentiert','ueberfaellig','zu_pruefen')),
  status_fakten text not null default 'unbestaetigt' check (status_fakten in ('unbestaetigt','vorlaeufig','bestaetigt')),
  briefing jsonb not null default '{}'::jsonb,   -- Zielgruppe, Zweck, Inhalt, Fachfreigabe, Faktenquelle, Format, Bezug
  stunden numeric(7,2) not null default 0,
  hinweis text,
  asana_task_gid text,
  gesendet_am timestamptz,
  partner_email text check (partner_email is null or partner_email ~ '^[^@\s]+@[^@\s]+$'),
  partner_name text check (partner_name is null or char_length(partner_name) <= 200),
  partner_uebernommen_am timestamptz,
  abgabe_url text check (abgabe_url is null or abgabe_url ~ '^https://'),
  abgabe_am timestamptz,
  rechte_bestaetigt boolean not null default false,
  freigabe_status text not null default 'offen' check (freigabe_status in ('offen','freigegeben','korrektur','abgelehnt','zurueck_an_redaktion')),
  freigabe_von text,
  freigabe_am timestamptz,
  freigabe_notiz text check (freigabe_notiz is null or char_length(freigabe_notiz) <= 4000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now());
create index if not exists komm_veroeffentlichungen_festival_t on public.komm_veroeffentlichungen(festival_short, t);
create index if not exists komm_veroeffentlichungen_partner on public.komm_veroeffentlichungen(t) where partnerfaehig;

create table if not exists public.komm_schritte(
  veroeffentlichung_id text not null references public.komm_veroeffentlichungen(id) on delete cascade,
  schritt_id text not null,
  phase text not null,
  titel text not null,
  rolle text not null,
  werkzeug text,
  start date not null,
  faellig date not null,
  stunden numeric(6,2) not null default 0,
  primary key (veroeffentlichung_id, schritt_id));

create table if not exists public.komm_pruefpunkte(
  festival_short text not null,
  datum date not null,
  stufe text not null default 'offen' check (stufe in ('gruen','gelb','rot','knapp','offen')),
  entschieden_von text,
  entschieden_am timestamptz,
  extras text[] not null default '{}' check (extras <@ array['E01','E02','E03','E04','E05','E06','E07','E08','E09','E10','E11','E12','E13','E14','E15']::text[]),
  notiz text check (notiz is null or char_length(notiz) <= 4000),
  primary key (festival_short, datum));

create table if not exists public.komm_log(
  id bigserial primary key,
  what text not null,
  detail jsonb,
  "by" text,
  at timestamptz not null default now());
create index if not exists komm_log_what_at on public.komm_log(what, at desc);

alter table public.komm_regelwerk enable row level security;
alter table public.komm_veroeffentlichungen enable row level security;
alter table public.komm_schritte enable row level security;
alter table public.komm_pruefpunkte enable row level security;
alter table public.komm_log enable row level security;
revoke all on public.komm_regelwerk, public.komm_veroeffentlichungen, public.komm_schritte, public.komm_pruefpunkte, public.komm_log from anon, authenticated;
revoke all on sequence public.komm_log_id_seq from anon, authenticated;

create or replace function public.hh_komm_touch() returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;
drop trigger if exists komm_veroeffentlichungen_touch on public.komm_veroeffentlichungen;
create trigger komm_veroeffentlichungen_touch before update on public.komm_veroeffentlichungen for each row execute function public.hh_komm_touch();

-- Ergebnis einer Berechnung einspielen, in einer Transaktion und je Festival gesperrt (komm_berechnen ist idempotent):
--  * neu: anlegen mit Schritten.
--  * schon gesendet (gesendet_am) oder von einem Partner übernommen: nie still verändern. Verschiebt sich T, steht der neue
--    Termin in t_neu und status_bearbeitung wird zu_pruefen; Plan, Briefing und Schritte bleiben.
--  * sonst: Plan- und Briefingfelder aktualisieren, Schritte ersetzen (sie sind nur ein Vorschlag).
--  * Zeilen dieses Festivals ab heute, die die Rechnung nicht mehr kennt: ungesendet und nicht übernommen werden gelöscht,
--    sonst zu_pruefen. Vergangenes bleibt, wie es ist.
-- Partner- und Freigabefelder werden hier nie geschrieben.
create or replace function public.hh_komm_einspielen(p_festival text, p_event_id uuid, p_pubs jsonb, p_heute date)
returns jsonb language plpgsql set search_path = public as $$
declare
  p jsonb; e public.komm_veroeffentlichungen; nt date;
  n_neu int := 0; n_akt int := 0; n_gleich int := 0; n_pruefen int := 0; n_weg int := 0; n_verwaist int := 0;
  ids text[] := '{}';
  aenderung boolean;
begin
  if p_pubs is null or jsonb_typeof(p_pubs) <> 'array' or jsonb_array_length(p_pubs) = 0 then
    raise exception 'Keine Veröffentlichungen übergeben; nichts eingespielt' using errcode = 'PT400';
  end if;
  perform pg_advisory_xact_lock(hashtext('komm_einspielen:' || p_festival));
  for p in select * from jsonb_array_elements(p_pubs) loop
    ids := ids || (p->>'id');
    nt := (p->>'t')::date;
    select * into e from komm_veroeffentlichungen where id = p->>'id' for update;
    if not found then
      insert into komm_veroeffentlichungen(id, event_id, festival_short, regel_id, titel, kanal, klasse, thema, bezug, abstand, nr, t,
        vorlaeufig, pflicht, partnerfaehig, status_fakten, briefing, stunden, hinweis)
      values (p->>'id', p_event_id, p_festival, p->>'regel_id', p->>'titel', coalesce(p->>'kanal',''), p->>'klasse', p->>'thema', p->>'bezug',
        coalesce((p->>'abstand')::int, 0), coalesce((p->>'nr')::int, 1), nt, coalesce((p->>'vorlaeufig')::boolean, false),
        coalesce((p->>'pflicht')::boolean, true), coalesce((p->>'partnerfaehig')::boolean, false),
        case when coalesce((p->>'vorlaeufig')::boolean, false) then 'vorlaeufig' else 'unbestaetigt' end,
        coalesce(p->'briefing', '{}'::jsonb), coalesce((p->>'stunden')::numeric, 0), nullif(p->>'hinweis',''));
      insert into komm_schritte(veroeffentlichung_id, schritt_id, phase, titel, rolle, werkzeug, start, faellig, stunden)
        select p->>'id', s->>'schritt_id', s->>'phase', s->>'titel', s->>'rolle', s->>'werkzeug', (s->>'start')::date, (s->>'faellig')::date, coalesce((s->>'stunden')::numeric, 0)
        from jsonb_array_elements(coalesce(p->'schritte','[]'::jsonb)) s;
      n_neu := n_neu + 1;
    elsif e.gesendet_am is not null or e.partner_uebernommen_am is not null then
      if e.t <> nt then
        if e.t_neu is distinct from nt or e.status_bearbeitung <> 'zu_pruefen' then
          update komm_veroeffentlichungen set t_neu = nt, status_bearbeitung = 'zu_pruefen' where id = e.id;
          n_pruefen := n_pruefen + 1;
        else n_gleich := n_gleich + 1; end if;
      elsif e.t_neu is not null then
        update komm_veroeffentlichungen set t_neu = null where id = e.id; n_akt := n_akt + 1;
      else n_gleich := n_gleich + 1; end if;
    else
      aenderung := e.t <> nt or e.titel <> p->>'titel' or e.kanal <> coalesce(p->>'kanal','') or e.klasse <> p->>'klasse'
        or e.thema is distinct from p->>'thema' or e.bezug <> p->>'bezug' or e.abstand <> coalesce((p->>'abstand')::int,0)
        or e.vorlaeufig <> coalesce((p->>'vorlaeufig')::boolean,false) or e.pflicht <> coalesce((p->>'pflicht')::boolean,true)
        or e.partnerfaehig <> coalesce((p->>'partnerfaehig')::boolean,false) or e.briefing <> coalesce(p->'briefing','{}'::jsonb)
        or e.stunden <> coalesce((p->>'stunden')::numeric,0) or e.hinweis is distinct from nullif(p->>'hinweis','')
        or e.event_id is distinct from p_event_id or e.t_neu is not null
        or exists (
          select 1 from (
            select s->>'schritt_id' sid, s->>'phase' ph, s->>'titel' ti, s->>'rolle' ro, s->>'werkzeug' wz, (s->>'start')::date st, (s->>'faellig')::date fa, coalesce((s->>'stunden')::numeric,0) h
            from jsonb_array_elements(coalesce(p->'schritte','[]'::jsonb)) s
            except select schritt_id, phase, titel, rolle, werkzeug, start, faellig, stunden from komm_schritte where veroeffentlichung_id = e.id) d)
        or (select count(*) from komm_schritte where veroeffentlichung_id = e.id) <> jsonb_array_length(coalesce(p->'schritte','[]'::jsonb));
      if aenderung then
        update komm_veroeffentlichungen set event_id = p_event_id, regel_id = p->>'regel_id', titel = p->>'titel', kanal = coalesce(p->>'kanal',''),
          klasse = p->>'klasse', thema = p->>'thema', bezug = p->>'bezug', abstand = coalesce((p->>'abstand')::int,0), nr = coalesce((p->>'nr')::int,1),
          t = nt, t_neu = null, vorlaeufig = coalesce((p->>'vorlaeufig')::boolean,false), pflicht = coalesce((p->>'pflicht')::boolean,true),
          partnerfaehig = coalesce((p->>'partnerfaehig')::boolean,false),
          status_fakten = case when status_fakten = 'bestaetigt' then status_fakten when coalesce((p->>'vorlaeufig')::boolean,false) then 'vorlaeufig' else 'unbestaetigt' end,
          briefing = coalesce(p->'briefing','{}'::jsonb), stunden = coalesce((p->>'stunden')::numeric,0), hinweis = nullif(p->>'hinweis','')
        where id = e.id;
        delete from komm_schritte where veroeffentlichung_id = e.id;
        insert into komm_schritte(veroeffentlichung_id, schritt_id, phase, titel, rolle, werkzeug, start, faellig, stunden)
          select e.id, s->>'schritt_id', s->>'phase', s->>'titel', s->>'rolle', s->>'werkzeug', (s->>'start')::date, (s->>'faellig')::date, coalesce((s->>'stunden')::numeric, 0)
          from jsonb_array_elements(coalesce(p->'schritte','[]'::jsonb)) s;
        n_akt := n_akt + 1;
      else n_gleich := n_gleich + 1; end if;
    end if;
  end loop;
  -- Was die Rechnung ab heute nicht mehr kennt.
  for e in select * from komm_veroeffentlichungen where festival_short = p_festival and t >= p_heute and not (id = any(ids)) for update loop
    if e.gesendet_am is not null or e.partner_uebernommen_am is not null then
      if e.status_bearbeitung <> 'zu_pruefen' then update komm_veroeffentlichungen set status_bearbeitung = 'zu_pruefen', t_neu = null where id = e.id; n_verwaist := n_verwaist + 1; end if;
    else
      delete from komm_veroeffentlichungen where id = e.id; n_weg := n_weg + 1;
    end if;
  end loop;
  return jsonb_build_object('neu', n_neu, 'aktualisiert', n_akt, 'unveraendert', n_gleich, 'zu_pruefen', n_pruefen, 'entfernt', n_weg, 'verwaist_zu_pruefen', n_verwaist);
end $$;
revoke all on function public.hh_komm_einspielen(text, uuid, jsonb, date) from public, anon, authenticated;
comment on function public.hh_komm_einspielen(text, uuid, jsonb, date) is
  'V32 Kommunikation: Berechnung eines Festivals einspielen (idempotent, je Festival gesperrt). Gesendete oder übernommene Veröffentlichungen werden nie still verändert, sondern zu_pruefen mit t_neu. Schreibt nie Partner- oder Freigabefelder.';
