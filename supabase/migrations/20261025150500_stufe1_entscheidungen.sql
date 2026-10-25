-- Kompass · Stufe 1 · Entscheiden können (25.10.2026). Auftrag: docs/PAKET-STUFE-1-ENTSCHEIDUNGEN.md, Abschnitt 1.
-- hh_entscheidungen: eine Sicht mit Gedächtnis über die offenen Entscheidungen der Geschäftsführung. Führend für Frage, Frist,
-- Vorschlag, Status und Ergebnis; die Herkunft bleibt im Original (Vorhaben-Punkt, Thema, Kandidat). Eindeutig je (quelle_art, quelle_id).
-- hh_entscheidungen_sammeln: legt fehlende Zeilen aus den drei Quellen an, zieht Frist und Vorhaben nach, setzt hinfällig, was es
--   in der Quelle nicht mehr gibt. Ändert nie status, ergebnis oder eine Frage, die eine Person oder der Lauf formuliert hat.
-- hh_entscheidung_entscheiden / _vertagen / _abgeben: je eine Transaktion, schreiben ins Original zurück und merken sich den Stand
--   davor in rueckweg (für hh_entscheidung_zurueck, nur innerhalb von 24 Stunden).
-- vorhaben_vorschlag auf Themen und Kandidaten: Vorschlag des Laufs für den Korb (Abschnitt 4), kein Fremdschlüssel.
-- hh_vorhaben_verlauf.status bekommt 'verfallen' (Abschnitt 6, E3: Vorschläge älter als 14 Tage ohne Antwort).
-- Zugriff nur über die passwortgeschützte Edge Function (service_role), RLS an ohne Policies wie die anderen Kompass-Tabellen.
-- Rückweg: drop function public.hh_entscheidung_zurueck(uuid,text), public.hh_entscheidung_abgeben(uuid,text,text),
--   public.hh_entscheidung_vertagen(uuid,date,text), public.hh_entscheidung_entscheiden(uuid,text,text), public.hh_entscheidungen_sammeln();
--   drop table public.hh_entscheidungen; alter table public.gfweekly_news drop column vorhaben_vorschlag;
--   alter table public.gfweekly_topics drop column vorhaben_vorschlag; (den CHECK auf hh_vorhaben_verlauf.status kann man lassen).
set lock_timeout = '10s';

create table public.hh_entscheidungen (
  id uuid primary key default gen_random_uuid(),
  quelle_art text not null check (quelle_art in ('punkt','thema','kandidat')),
  quelle_id uuid not null,
  vorhaben_id uuid,
  frage text not null check (length(trim(frage)) between 1 and 500),
  frage_form boolean not null default false,
  frage_von text check (frage_von is null or frage_von in ('lauf','Alex','Lea')),
  frist date,
  frist_quelle text check (frist_quelle is null or frist_quelle in ('punkt','thema','kandidat','hand')),
  vorschlag text check (vorschlag is null or length(vorschlag) <= 2000),
  status text not null default 'offen' check (status in ('offen','entschieden','vertagt','abgegeben','hinfaellig')),
  ergebnis text check (ergebnis is null or length(ergebnis) <= 4000),
  entschieden_am timestamptz,
  entschieden_von text,
  vertagt_bis date,
  abgegeben_an text check (abgegeben_an is null or abgegeben_an in ('alex','lea','team')),
  created_by text not null default 'kompass',
  run_id text,
  rueckweg jsonb,
  rueckweg_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (quelle_art, quelle_id)
);
create index hh_entscheidungen_lage on public.hh_entscheidungen (status, frist);
comment on table public.hh_entscheidungen is 'Offene Entscheidungen der Geschäftsführung als Frage mit Frist und Herkunft (Stufe 1, 25.10.2026). Quelle bleibt das Original.';
comment on column public.hh_entscheidungen.rueckweg is 'Stand davor für Rückgängig: eigene Felder, Felder des Originals und Kennungen angelegter Zeilen. Leer nach Rückgängig oder wenn nie etwas zurückgeschrieben wurde.';

alter table public.gfweekly_news   add column if not exists vorhaben_vorschlag uuid;
alter table public.gfweekly_topics add column if not exists vorhaben_vorschlag uuid;
comment on column public.gfweekly_news.vorhaben_vorschlag   is 'Vorschlag des Laufs, zu welchem Vorhaben der Kandidat gehört (Korb auf vorhaben.html). Kein Fremdschlüssel; Person bestätigt.';
comment on column public.gfweekly_topics.vorhaben_vorschlag is 'Vorschlag des Laufs, zu welchem Vorhaben das Thema gehört (Korb auf vorhaben.html). Kein Fremdschlüssel; Person bestätigt.';

alter table public.hh_vorhaben_verlauf drop constraint if exists hh_vorhaben_verlauf_status_check;
alter table public.hh_vorhaben_verlauf add constraint hh_vorhaben_verlauf_status_check check (status in ('bestaetigt','vorschlag','verworfen','verfallen'));

alter table public.hh_entscheidungen enable row level security;
revoke all on public.hh_entscheidungen from public, anon, authenticated;
grant all on public.hh_entscheidungen to service_role;

-- Quellen in einer Form: je Zeile Art, Kennung, Vorhaben, Frage, Frist, Vorschlag.
-- (a) Punkte an aktiven oder pausierten Vorhaben, offen, mit wer bei der GF (GF… oder Alex und Lea zusammen).
-- (b) Themen im Board (zu besprechen, in Klärung), nicht archiviert, Ausgang gf; Frage ohne ein führendes „Titel: “.
-- (c) Kandidaten mit Status neu und Ausgang gf.
create or replace function public.hh_entscheidungen_sammeln()
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_neu int := 0;
  v_akt int := 0;
  v_hin int := 0;
  v_zurueck int := 0;
begin
  create temp table if not exists tmp_en_quellen (
    quelle_art text, quelle_id uuid, vorhaben_id uuid, frage text, frist date, vorschlag text
  ) on commit drop;
  truncate tmp_en_quellen;
  insert into tmp_en_quellen
    select 'punkt', p.id, p.vorhaben_id, left(trim(p.titel), 500), p.frist, nullif(trim(coalesce(v.naechster_schritt, '')), '')
      from public.hh_vorhaben_punkte p join public.hh_vorhaben v on v.id = p.vorhaben_id
     where p.erledigt = false and v.status in ('aktiv','pausiert')
       and (p.wer ilike 'GF%' or (p.wer ilike '%alex%' and p.wer ilike '%lea%'))
  union all
    select 'thema', t.id, t.vorhaben_id, left(trim(regexp_replace(t.title, '^\s*Titel:\s*', '')), 500), t.gate_frist,
           coalesce(nullif(trim(coalesce(t.next_action, '')), ''), nullif(trim(coalesce(t.recommendation, '')), ''))
      from public.gfweekly_topics t
     where t.archived = false and t.board_lane in ('zu_besprechen','in_klaerung') and t.gate = 'gf'
  union all
    select 'kandidat', n.id, n.vorhaben_id, left(trim(n.title), 500), n.gate_frist, null
      from public.gfweekly_news n
     where n.kind = 'kandidat' and n.status = 'neu' and n.gate = 'gf';
  delete from tmp_en_quellen where frage is null or frage = '';

  -- Neue Zeilen.
  insert into public.hh_entscheidungen (quelle_art, quelle_id, vorhaben_id, frage, frist, frist_quelle, vorschlag, created_by)
    select q.quelle_art, q.quelle_id, q.vorhaben_id, q.frage, q.frist, case when q.frist is null then null else q.quelle_art end, q.vorschlag, 'kompass'
      from tmp_en_quellen q
     where not exists (select 1 from public.hh_entscheidungen e where e.quelle_art = q.quelle_art and e.quelle_id = q.quelle_id);
  get diagnostics v_neu = row_count;

  -- Nachziehen: Frist aus der Quelle (außer von Hand gesetzt), Vorhaben (nur wenn die Quelle eines kennt), Frage und Vorschlag
  -- nur, solange niemand die Frage formuliert hat. Status und Ergebnis bleiben unberührt.
  update public.hh_entscheidungen e set
    frist        = case when e.frist_quelle = 'hand' then e.frist else q.frist end,
    frist_quelle = case when e.frist_quelle = 'hand' then 'hand' when q.frist is null then null else q.quelle_art end,
    vorhaben_id  = coalesce(q.vorhaben_id, e.vorhaben_id),
    frage        = case when e.frage_form then e.frage else q.frage end,
    vorschlag    = case when e.frage_form then e.vorschlag else coalesce(q.vorschlag, e.vorschlag) end,
    updated_at   = now()
   from tmp_en_quellen q
   where e.quelle_art = q.quelle_art and e.quelle_id = q.quelle_id
     and e.status in ('offen','vertagt','abgegeben','hinfaellig')
     and ( (case when e.frist_quelle = 'hand' then e.frist else q.frist end) is distinct from e.frist
        or coalesce(q.vorhaben_id, e.vorhaben_id) is distinct from e.vorhaben_id
        or (not e.frage_form and (q.frage is distinct from e.frage or coalesce(q.vorschlag, e.vorschlag) is distinct from e.vorschlag)) );
  get diagnostics v_akt = row_count;

  -- Hinfällig: Quelle erledigt, archiviert, verworfen, gelöscht oder nicht mehr bei der GF (nur offen oder vertagt).
  update public.hh_entscheidungen e set status = 'hinfaellig', updated_at = now()
   where e.status in ('offen','vertagt')
     and not exists (select 1 from tmp_en_quellen q where q.quelle_art = e.quelle_art and q.quelle_id = e.quelle_id);
  get diagnostics v_hin = row_count;

  -- Wieder offen: eine hinfällige Zeile, deren Quelle wieder bei der GF liegt (zum Beispiel Ausgang erneut gf).
  update public.hh_entscheidungen e set status = 'offen', updated_at = now()
   where e.status = 'hinfaellig'
     and exists (select 1 from tmp_en_quellen q where q.quelle_art = e.quelle_art and q.quelle_id = e.quelle_id);
  get diagnostics v_zurueck = row_count;

  return jsonb_build_object('eingefuegt', v_neu, 'aktualisiert', v_akt, 'hinfaellig', v_hin, 'wieder_offen', v_zurueck);
end;
$fn$;

-- Person aus by: Alex oder Lea, sonst Fehler.
create or replace function public.hh_en_person(p_by text)
returns text
language plpgsql
immutable
as $fn$
begin
  if position('lea' in lower(coalesce(p_by, ''))) > 0 then return 'Lea'; end if;
  if position('alex' in lower(coalesce(p_by, ''))) > 0 then return 'Alex'; end if;
  raise exception 'by muss Alex oder Lea sein' using errcode = 'PT400';
end;
$fn$;

-- Stand des Originals für den Rückweg.
create or replace function public.hh_en_original(p_art text, p_id uuid)
returns jsonb
language sql
stable
as $fn$
  select case p_art
    when 'punkt' then (select jsonb_build_object('erledigt', erledigt, 'erledigt_at', erledigt_at, 'erledigt_by', erledigt_by, 'wer', wer, 'frist', frist)
                         from public.hh_vorhaben_punkte where id = p_id)
    when 'thema' then (select jsonb_build_object('board_lane', board_lane, 'status', status, 'decision', decision, 'resolved_at', resolved_at,
                                                 'gate', gate, 'gate_by', gate_by, 'gate_at', gate_at, 'gate_frist', gate_frist, 'last_discussed', last_discussed)
                         from public.gfweekly_topics where id = p_id)
    when 'kandidat' then (select jsonb_build_object('status', status, 'decided_by', decided_by, 'decided_at', decided_at, 'archiv_grund', archiv_grund,
                                                    'gate', gate, 'gate_by', gate_by, 'gate_at', gate_at, 'gate_frist', gate_frist)
                            from public.gfweekly_news where id = p_id)
    end;
$fn$;

create or replace function public.hh_entscheidung_entscheiden(p_id uuid, p_ergebnis text, p_by text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_e public.hh_entscheidungen;
  v_by text := public.hh_en_person(p_by);
  v_erg text := trim(coalesce(p_ergebnis, ''));
  v_orig jsonb;
  v_vorhaben uuid;
  v_verlauf uuid;
  v_decision uuid;
  v_titel text;
begin
  if length(v_erg) < 5 then raise exception 'Ergebnis fehlt (mindestens fünf Zeichen)' using errcode = 'PT400'; end if;
  select * into v_e from public.hh_entscheidungen where id = p_id for update;
  if not found then raise exception 'Entscheidung gibt es nicht' using errcode = 'PT404'; end if;
  if v_e.status = 'entschieden' then
    return jsonb_build_object('entscheidung', to_jsonb(v_e), 'geaendert', false);
  end if;
  if v_e.status = 'hinfaellig' then raise exception 'Die Quelle ist inzwischen erledigt oder weitergegeben; bitte neu laden' using errcode = 'PT409'; end if;
  v_orig := public.hh_en_original(v_e.quelle_art, v_e.quelle_id);
  if v_orig is null then raise exception 'Die Quelle gibt es nicht mehr; bitte neu laden' using errcode = 'PT409'; end if;

  if v_e.quelle_art = 'punkt' then
    update public.hh_vorhaben_punkte set erledigt = true, erledigt_at = now(), erledigt_by = v_by, updated_at = now()
     where id = v_e.quelle_id returning vorhaben_id, titel into v_vorhaben, v_titel;
    insert into public.hh_vorhaben_verlauf (vorhaben_id, punkt_id, art, wer, text, status, created_by)
      values (v_vorhaben, v_e.quelle_id, 'entscheidung', v_by, 'Entschieden: ' || v_erg, 'bestaetigt', 'kompass')
      returning id into v_verlauf;
  elsif v_e.quelle_art = 'thema' then
    update public.gfweekly_topics set board_lane = 'entschieden', decision = v_erg, resolved_at = now(), last_discussed = current_date, updated_at = now()
     where id = v_e.quelle_id returning title into v_titel;
    insert into public.gfweekly_decisions (topic_id, topic_title, decision, decided_by, decided_at)
      values (v_e.quelle_id, coalesce(v_titel, v_e.frage), v_erg, v_by, current_date)
      returning id into v_decision;
  else
    update public.gfweekly_news set status = 'uebernommen', decided_by = v_by, decided_at = now(), archiv_grund = 'entschieden'
     where id = v_e.quelle_id;
  end if;

  update public.hh_entscheidungen set
    status = 'entschieden', ergebnis = v_erg, entschieden_am = now(), entschieden_von = v_by, updated_at = now(),
    rueckweg = jsonb_build_object('aktion', 'entscheiden', 'eigen', jsonb_build_object('status', v_e.status, 'ergebnis', v_e.ergebnis,
                 'entschieden_am', v_e.entschieden_am, 'entschieden_von', v_e.entschieden_von, 'frist', v_e.frist, 'frist_quelle', v_e.frist_quelle,
                 'vertagt_bis', v_e.vertagt_bis, 'abgegeben_an', v_e.abgegeben_an),
               'original', v_orig, 'verlauf_id', v_verlauf, 'decision_id', v_decision),
    rueckweg_at = now()
   where id = p_id returning * into v_e;
  return jsonb_build_object('entscheidung', to_jsonb(v_e), 'geaendert', true,
                            'original', jsonb_build_object('art', v_e.quelle_art, 'id', v_e.quelle_id, 'verlauf_id', v_verlauf, 'decision_id', v_decision));
end;
$fn$;

create or replace function public.hh_entscheidung_vertagen(p_id uuid, p_bis date, p_by text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_e public.hh_entscheidungen;
  v_by text := public.hh_en_person(p_by);
  v_orig jsonb;
begin
  if p_bis is null or p_bis < current_date then raise exception 'Vertagen braucht ein Datum ab heute' using errcode = 'PT400'; end if;
  select * into v_e from public.hh_entscheidungen where id = p_id for update;
  if not found then raise exception 'Entscheidung gibt es nicht' using errcode = 'PT404'; end if;
  if v_e.status = 'entschieden' then raise exception 'Schon entschieden; bitte neu laden' using errcode = 'PT409'; end if;
  if v_e.status = 'hinfaellig' then raise exception 'Die Quelle ist inzwischen erledigt oder weitergegeben; bitte neu laden' using errcode = 'PT409'; end if;
  if v_e.status = 'vertagt' and v_e.vertagt_bis = p_bis then
    return jsonb_build_object('entscheidung', to_jsonb(v_e), 'geaendert', false);
  end if;
  v_orig := public.hh_en_original(v_e.quelle_art, v_e.quelle_id);
  if v_orig is null then raise exception 'Die Quelle gibt es nicht mehr; bitte neu laden' using errcode = 'PT409'; end if;

  if v_e.quelle_art = 'punkt' then
    update public.hh_vorhaben_punkte set frist = p_bis, updated_at = now() where id = v_e.quelle_id;
  elsif v_e.quelle_art = 'thema' then
    update public.gfweekly_topics set gate_frist = p_bis, updated_at = now() where id = v_e.quelle_id;
  else
    update public.gfweekly_news set gate_frist = p_bis where id = v_e.quelle_id;
  end if;

  update public.hh_entscheidungen set
    status = 'vertagt', vertagt_bis = p_bis, frist = p_bis, frist_quelle = 'hand', updated_at = now(),
    rueckweg = jsonb_build_object('aktion', 'vertagen', 'eigen', jsonb_build_object('status', v_e.status, 'vertagt_bis', v_e.vertagt_bis,
                 'frist', v_e.frist, 'frist_quelle', v_e.frist_quelle, 'abgegeben_an', v_e.abgegeben_an), 'original', v_orig),
    rueckweg_at = now()
   where id = p_id returning * into v_e;
  return jsonb_build_object('entscheidung', to_jsonb(v_e), 'geaendert', true);
end;
$fn$;

create or replace function public.hh_entscheidung_abgeben(p_id uuid, p_an text, p_by text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_e public.hh_entscheidungen;
  v_by text := public.hh_en_person(p_by);
  v_orig jsonb;
  v_wer text;
  v_verlauf uuid;
  v_vorhaben uuid;
begin
  if p_an is null or p_an not in ('alex','lea','team') then raise exception 'Abgeben an alex, lea oder team' using errcode = 'PT400'; end if;
  select * into v_e from public.hh_entscheidungen where id = p_id for update;
  if not found then raise exception 'Entscheidung gibt es nicht' using errcode = 'PT404'; end if;
  if v_e.status = 'entschieden' then raise exception 'Schon entschieden; bitte neu laden' using errcode = 'PT409'; end if;
  if v_e.status = 'hinfaellig' then raise exception 'Die Quelle ist inzwischen erledigt oder weitergegeben; bitte neu laden' using errcode = 'PT409'; end if;
  if v_e.status = 'abgegeben' and v_e.abgegeben_an = p_an then
    return jsonb_build_object('entscheidung', to_jsonb(v_e), 'geaendert', false);
  end if;
  v_orig := public.hh_en_original(v_e.quelle_art, v_e.quelle_id);
  if v_orig is null then raise exception 'Die Quelle gibt es nicht mehr; bitte neu laden' using errcode = 'PT409'; end if;
  v_wer := case p_an when 'alex' then 'Alex' when 'lea' then 'Lea' else 'Team' end;

  if v_e.quelle_art = 'punkt' then
    update public.hh_vorhaben_punkte set wer = v_wer, updated_at = now() where id = v_e.quelle_id returning vorhaben_id into v_vorhaben;
  elsif v_e.quelle_art = 'thema' then
    update public.gfweekly_topics set gate = p_an, gate_by = v_by, gate_at = now(), updated_at = now() where id = v_e.quelle_id returning vorhaben_id into v_vorhaben;
  else
    update public.gfweekly_news set gate = p_an, gate_by = v_by, gate_at = now() where id = v_e.quelle_id returning vorhaben_id into v_vorhaben;
  end if;
  if v_vorhaben is not null then
    insert into public.hh_vorhaben_verlauf (vorhaben_id, punkt_id, art, wer, text, status, created_by)
      values (v_vorhaben, case when v_e.quelle_art = 'punkt' then v_e.quelle_id end, 'system', v_by,
              'Abgegeben an ' || v_wer || ': ' || v_e.frage, 'bestaetigt', 'kompass')
      returning id into v_verlauf;
  end if;

  update public.hh_entscheidungen set
    status = 'abgegeben', abgegeben_an = p_an, updated_at = now(),
    rueckweg = jsonb_build_object('aktion', 'abgeben', 'eigen', jsonb_build_object('status', v_e.status, 'abgegeben_an', v_e.abgegeben_an,
                 'vertagt_bis', v_e.vertagt_bis), 'original', v_orig, 'verlauf_id', v_verlauf),
    rueckweg_at = now()
   where id = p_id returning * into v_e;
  return jsonb_build_object('entscheidung', to_jsonb(v_e), 'geaendert', true);
end;
$fn$;

-- Rückgängig: den Stand davor aus rueckweg zurückschreiben, angelegte Verlaufs- und Beschlusszeilen entfernen. Nur innerhalb 24 h.
create or replace function public.hh_entscheidung_zurueck(p_id uuid, p_by text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_e public.hh_entscheidungen;
  v_by text := public.hh_en_person(p_by);
  v_o jsonb;
  v_eig jsonb;
begin
  select * into v_e from public.hh_entscheidungen where id = p_id for update;
  if not found then raise exception 'Entscheidung gibt es nicht' using errcode = 'PT404'; end if;
  if v_e.rueckweg is null then raise exception 'Nichts zum Zurücknehmen' using errcode = 'PT409'; end if;
  if v_e.rueckweg_at < now() - interval '24 hours' then raise exception 'Rückgängig geht nur innerhalb von 24 Stunden' using errcode = 'PT409'; end if;
  v_o := v_e.rueckweg->'original'; v_eig := v_e.rueckweg->'eigen';

  if v_e.quelle_art = 'punkt' then
    update public.hh_vorhaben_punkte set
      erledigt = coalesce((v_o->>'erledigt')::boolean, erledigt), erledigt_at = (v_o->>'erledigt_at')::timestamptz, erledigt_by = v_o->>'erledigt_by',
      wer = case when v_o ? 'wer' then v_o->>'wer' else wer end, frist = case when v_o ? 'frist' then (v_o->>'frist')::date else frist end, updated_at = now()
     where id = v_e.quelle_id;
  elsif v_e.quelle_art = 'thema' then
    update public.gfweekly_topics set
      board_lane = coalesce(v_o->>'board_lane', board_lane), status = coalesce(v_o->>'status', status), decision = coalesce(v_o->>'decision', ''),
      resolved_at = (v_o->>'resolved_at')::timestamptz, gate = v_o->>'gate', gate_by = v_o->>'gate_by', gate_at = (v_o->>'gate_at')::timestamptz,
      gate_frist = (v_o->>'gate_frist')::date, last_discussed = (v_o->>'last_discussed')::date, updated_at = now()
     where id = v_e.quelle_id;
  else
    update public.gfweekly_news set
      status = coalesce(v_o->>'status', status), decided_by = coalesce(v_o->>'decided_by', ''), decided_at = (v_o->>'decided_at')::timestamptz,
      archiv_grund = v_o->>'archiv_grund', gate = v_o->>'gate', gate_by = v_o->>'gate_by', gate_at = (v_o->>'gate_at')::timestamptz,
      gate_frist = (v_o->>'gate_frist')::date
     where id = v_e.quelle_id;
  end if;
  if (v_e.rueckweg->>'verlauf_id') is not null then delete from public.hh_vorhaben_verlauf where id = (v_e.rueckweg->>'verlauf_id')::uuid; end if;
  if (v_e.rueckweg->>'decision_id') is not null then delete from public.gfweekly_decisions where id = (v_e.rueckweg->>'decision_id')::uuid; end if;

  update public.hh_entscheidungen set
    status = coalesce(v_eig->>'status', 'offen'),
    ergebnis = case when v_eig ? 'ergebnis' then v_eig->>'ergebnis' else ergebnis end,
    entschieden_am = case when v_eig ? 'entschieden_am' then (v_eig->>'entschieden_am')::timestamptz else entschieden_am end,
    entschieden_von = case when v_eig ? 'entschieden_von' then v_eig->>'entschieden_von' else entschieden_von end,
    frist = case when v_eig ? 'frist' then (v_eig->>'frist')::date else frist end,
    frist_quelle = case when v_eig ? 'frist_quelle' then v_eig->>'frist_quelle' else frist_quelle end,
    vertagt_bis = case when v_eig ? 'vertagt_bis' then (v_eig->>'vertagt_bis')::date else vertagt_bis end,
    abgegeben_an = case when v_eig ? 'abgegeben_an' then v_eig->>'abgegeben_an' else abgegeben_an end,
    rueckweg = null, rueckweg_at = null, updated_at = now()
   where id = p_id returning * into v_e;
  return jsonb_build_object('entscheidung', to_jsonb(v_e), 'geaendert', true, 'von', v_by);
end;
$fn$;

revoke all on function public.hh_entscheidungen_sammeln() from public, anon, authenticated;
grant execute on function public.hh_entscheidungen_sammeln() to service_role;
revoke all on function public.hh_en_person(text) from public, anon, authenticated;
grant execute on function public.hh_en_person(text) to service_role;
revoke all on function public.hh_en_original(text, uuid) from public, anon, authenticated;
grant execute on function public.hh_en_original(text, uuid) to service_role;
revoke all on function public.hh_entscheidung_entscheiden(uuid, text, text) from public, anon, authenticated;
grant execute on function public.hh_entscheidung_entscheiden(uuid, text, text) to service_role;
revoke all on function public.hh_entscheidung_vertagen(uuid, date, text) from public, anon, authenticated;
grant execute on function public.hh_entscheidung_vertagen(uuid, date, text) to service_role;
revoke all on function public.hh_entscheidung_abgeben(uuid, text, text) from public, anon, authenticated;
grant execute on function public.hh_entscheidung_abgeben(uuid, text, text) to service_role;
revoke all on function public.hh_entscheidung_zurueck(uuid, text) from public, anon, authenticated;
grant execute on function public.hh_entscheidung_zurueck(uuid, text) to service_role;
