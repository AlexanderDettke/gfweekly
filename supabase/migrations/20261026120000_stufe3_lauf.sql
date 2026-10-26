-- Kompass · Stufe 3 (26.10.2026), Abschnitt 2.1: der Lauf wandert aus Cowork in den Kompass.
-- Tabellen: hh_lauf_einstellungen (eine Zeile: Modus, Deckel, Modell, Postfächer), hh_lauf_cursor (Zeitgrenze je Postfach),
-- hh_lauf_protokoll (je geprüfter Quelle eine Zeile, Grundlage für Bilanz und Rückblick, keine Mailtexte), hh_lauf_tag (Sichtungsdeckel je Tag).
-- Tick: pg_cron hh_lauf_tick alle zwei Stunden zwischen 05:07 und 21:07 UTC (06 bis 22 Uhr Berlin im Winter) über pg_net, Muster hh_absence_tick.
-- Der Zeitplan läuft immer; was er tut, entscheidet modus (aus | probe | vorschlag | live), Start ist aus.
-- Rückweg: select cron.unschedule('hh_lauf_tick'); drop function public.hh_lauf_tick(), public.hh_lauf_einstellungen_set(jsonb,text),
--   public.hh_lauf_sichtung(date,int); drop table public.hh_lauf_protokoll, public.hh_lauf_tag, public.hh_lauf_cursor, public.hh_lauf_einstellungen;
set lock_timeout = '10s';

create table if not exists public.hh_lauf_einstellungen (
  id int primary key default 1 check (id = 1),
  modus text not null default 'aus' check (modus in ('aus','probe','vorschlag','live')),
  deckel_tag int not null default 5 check (deckel_tag between 0 and 50),
  modell text not null default 'claude-opus-5-5',
  postfaecher text[] not null default array['alex@wildemoehre.org','lea@wildemoehre.org'],
  fenster_stunden int not null default 26 check (fenster_stunden between 1 and 24 * 45),
  batch int not null default 8 check (batch between 1 and 50),
  letzter_lauf_at timestamptz,
  letzter_fehler text,
  abbruch_grund text,
  updated_by text,
  updated_at timestamptz not null default now()
);
insert into public.hh_lauf_einstellungen (id) values (1) on conflict (id) do nothing;
comment on table public.hh_lauf_einstellungen is 'Stufe 3: Einstellungen des Laufs im Kompass. modus aus|probe|vorschlag|live; probe schreibt nur Protokoll, vorschlag macht aus sicher einen Vorschlag, live erledigt sichere Punkte.';

create table if not exists public.hh_lauf_cursor (
  postfach text primary key,
  bis_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists public.hh_lauf_protokoll (
  id uuid primary key default gen_random_uuid(),
  run_id text not null,
  modus text not null,
  postfach text,
  quelle_art text not null check (quelle_art in ('mail','einwurf','plattform','verlauf','system')),
  quelle_ref text not null,
  punkt_id uuid,
  vorhaben_id uuid,
  stufe text not null check (stufe in ('sicher','wahrscheinlich','unklar','keine')),
  aktion text not null check (aktion in ('erledigt','vorschlag','kandidat','nichts','gedeckelt','gesperrt','uebersprungen','fehler')),
  beleg text check (beleg is null or length(beleg) <= 600),
  ausgefuehrt boolean not null default false,
  schluessel text generated always as (quelle_ref || ':' || coalesce(punkt_id::text, '-')) stored,
  created_at timestamptz not null default now(),
  unique (schluessel)
);
create index if not exists hh_lauf_protokoll_zeit on public.hh_lauf_protokoll (created_at desc);
create index if not exists hh_lauf_protokoll_run on public.hh_lauf_protokoll (run_id);
comment on table public.hh_lauf_protokoll is 'Stufe 3: jede vom Lauf geprüfte Quelle mit Einstufung und Aktion (auch im Probelauf). Keine Mailtexte, nur Beleg in einem Satz.';

create table if not exists public.hh_lauf_tag (
  tag date primary key,
  sichtung int not null default 0
);

alter table public.hh_lauf_einstellungen enable row level security;
alter table public.hh_lauf_cursor enable row level security;
alter table public.hh_lauf_protokoll enable row level security;
alter table public.hh_lauf_tag enable row level security;
revoke all on public.hh_lauf_einstellungen, public.hh_lauf_cursor, public.hh_lauf_protokoll, public.hh_lauf_tag from public, anon, authenticated;
grant all on public.hh_lauf_einstellungen, public.hh_lauf_cursor, public.hh_lauf_protokoll, public.hh_lauf_tag to service_role;

-- Einstellungen ändern: nur Alex oder Lea, mit Protokollzeile.
create or replace function public.hh_lauf_einstellungen_set(p_patch jsonb, p_by text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_by text := public.hh_en_person(p_by);
  v_alt public.hh_lauf_einstellungen;
  v_neu public.hh_lauf_einstellungen;
  v_text text := '';
begin
  select * into v_alt from public.hh_lauf_einstellungen where id = 1 for update;
  if p_patch ? 'modus' and (p_patch->>'modus') not in ('aus','probe','vorschlag','live') then raise exception 'modus: aus, probe, vorschlag oder live' using errcode = 'PT400'; end if;
  if p_patch ? 'deckel_tag' and ((p_patch->>'deckel_tag')::int < 0 or (p_patch->>'deckel_tag')::int > 50) then raise exception 'deckel_tag: 0 bis 50' using errcode = 'PT400'; end if;
  if p_patch ? 'modell' and length(trim(coalesce(p_patch->>'modell', ''))) < 5 then raise exception 'modell fehlt' using errcode = 'PT400'; end if;
  update public.hh_lauf_einstellungen set
    modus = coalesce(p_patch->>'modus', modus),
    deckel_tag = coalesce((p_patch->>'deckel_tag')::int, deckel_tag),
    modell = coalesce(nullif(trim(p_patch->>'modell'), ''), modell),
    abbruch_grund = case when p_patch ? 'modus' and (p_patch->>'modus') in ('live','vorschlag') then null else abbruch_grund end,
    updated_by = v_by, updated_at = now()
   where id = 1 returning * into v_neu;
  if v_neu.modus is distinct from v_alt.modus then v_text := 'Modus ' || v_alt.modus || ' → ' || v_neu.modus; end if;
  if v_neu.deckel_tag is distinct from v_alt.deckel_tag then v_text := v_text || case when v_text = '' then '' else ', ' end || 'Deckel ' || v_neu.deckel_tag; end if;
  if v_neu.modell is distinct from v_alt.modell then v_text := v_text || case when v_text = '' then '' else ', ' end || 'Modell ' || v_neu.modell; end if;
  if v_text <> '' then
    insert into public.hh_lauf_protokoll (run_id, modus, quelle_art, quelle_ref, stufe, aktion, beleg, ausgefuehrt)
    values ('einstellung:' || to_char(now(), 'YYYYMMDDHH24MISS'), v_neu.modus, 'system', 'einstellung:' || v_by || ':' || to_char(clock_timestamp(), 'YYYYMMDDHH24MISSMS'), 'keine', 'nichts', left(v_text || ' (' || v_by || ')', 600), true);
  end if;
  return jsonb_build_object('einstellungen', to_jsonb(v_neu), 'geaendert', v_text <> '');
end;
$fn$;
revoke all on function public.hh_lauf_einstellungen_set(jsonb, text) from public, anon, authenticated;
grant execute on function public.hh_lauf_einstellungen_set(jsonb, text) to service_role;

-- Sichtungsdeckel: zählt p_n Sichtungen auf den Tag und gibt zurück, wie viele davon noch unter dem Deckel lagen.
create or replace function public.hh_lauf_sichtung(p_tag date, p_n int)
returns int
language plpgsql
security definer
set search_path = public
as $fn$
declare v_deckel int; v_alt int; v_frei int;
begin
  select deckel_tag into v_deckel from public.hh_lauf_einstellungen where id = 1;
  insert into public.hh_lauf_tag (tag, sichtung) values (p_tag, 0) on conflict (tag) do nothing;
  select sichtung into v_alt from public.hh_lauf_tag where tag = p_tag for update;
  v_frei := greatest(0, least(p_n, coalesce(v_deckel, 5) - v_alt));
  update public.hh_lauf_tag set sichtung = v_alt + v_frei where tag = p_tag;
  return v_frei;
end;
$fn$;
revoke all on function public.hh_lauf_sichtung(date, int) from public, anon, authenticated;
grant execute on function public.hh_lauf_sichtung(date, int) to service_role;

-- Zeitplan zurücklesen (für die Einstellungen-Seite).
create or replace function public.hh_lauf_cron_steht()
returns jsonb
language sql
security definer
set search_path = public, cron
as $fn$
  select coalesce(jsonb_agg(jsonb_build_object('jobname', jobname, 'schedule', schedule, 'active', active)), '[]'::jsonb) from cron.job where jobname in ('hh_lauf_tick', 'hh_vorschlag_verfall', 'hh_news_verfall');
$fn$;
revoke all on function public.hh_lauf_cron_steht() from public, anon, authenticated;
grant execute on function public.hh_lauf_cron_steht() to service_role;

-- Tick über pg_net (Passwort aus dem Vault, nie im Job-Text).
create or replace function public.hh_lauf_tick()
returns void
language plpgsql
security definer
set search_path = public, net, vault
as $fn$
declare pw text; v_modus text;
begin
  select modus into v_modus from public.hh_lauf_einstellungen where id = 1;
  if coalesce(v_modus, 'aus') = 'aus' then return; end if;
  select decrypted_secret into pw from vault.decrypted_secrets where name = 'gfweekly_password' limit 1;
  if pw is null then raise notice 'hh_lauf_tick: Vault-Secret gfweekly_password fehlt, nichts getan.'; return; end if;
  perform net.http_post(
    url := 'https://bnfmupnmqyrcltrphfak.supabase.co/functions/v1/gfweekly',
    body := jsonb_build_object('action', 'lauf_tick', 'password', pw, 'payload', jsonb_build_object('quelle', 'cron')),
    params := '{}'::jsonb,
    headers := '{"Content-Type":"application/json"}'::jsonb,
    timeout_milliseconds := 120000
  );
end;
$fn$;
revoke all on function public.hh_lauf_tick() from public, anon, authenticated;
do $do$ begin
  if exists (select 1 from cron.job where jobname = 'hh_lauf_tick') then perform cron.unschedule('hh_lauf_tick'); end if;
end $do$;
select cron.schedule('hh_lauf_tick', '7 5-21/2 * * *', $$select public.hh_lauf_tick();$$);
