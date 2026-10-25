-- Kompass · Stufe 1 · Korrekturen aus Codex-Runde 1 (25.10.2026, docs/reviews/STUFE1-runde-1.md, Befunde 1 bis 5).
-- 1. Rückgängig nur, wenn das Original noch den Stand hat, den die Aktion erzeugt hat (rueckweg.nach); sonst Konflikt (PT409).
-- 2. Entscheiden, Vertagen, Abgeben sperren die Quelle und prüfen ihre Eignung neu (nicht archiviert, Ausgang gf, Punkt offen bei der GF);
--    nur Zeilen mit Status offen oder vertagt; abgegebene zuerst zurückholen. Sammeln holt abgegebene Zeilen zurück, deren Quelle wieder
--    bei der GF liegt.
-- 3. hh_korb_zuordnen: Anlegen (optional), Zuordnen und Verlaufseintrag in einer Transaktion.
-- 4. Beschluss aus der Besprechung trägt die Sitzungskennung (p_session).
-- 5. Sammeln: INSERT ... ON CONFLICT DO NOTHING gegen gleichzeitige Listenaufrufe.
-- Rückweg: Migration 20261025150500 erneut anwenden (Funktionen mit create or replace); drop function public.hh_korb_zuordnen(text,uuid,uuid,jsonb,text);
--   drop function public.hh_en_quelle_eignung(text,uuid); drop function public.hh_entscheidung_entscheiden(uuid,text,text,uuid).
set lock_timeout = '10s';

-- Quelle sperren und prüfen, ob sie noch bei der GF liegt. null, wenn es sie nicht mehr gibt.
create or replace function public.hh_en_quelle_eignung(p_art text, p_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $fn$
declare v_ok boolean;
begin
  if p_art = 'punkt' then
    select (p.erledigt = false and v.status in ('aktiv','pausiert') and (p.wer ilike 'GF%' or (p.wer ilike '%alex%' and p.wer ilike '%lea%')))
      into v_ok from public.hh_vorhaben_punkte p join public.hh_vorhaben v on v.id = p.vorhaben_id where p.id = p_id for update of p;
  elsif p_art = 'thema' then
    select (t.archived = false and t.board_lane in ('zu_besprechen','in_klaerung') and t.gate = 'gf')
      into v_ok from public.gfweekly_topics t where t.id = p_id for update;
  else
    select (n.kind = 'kandidat' and n.status = 'neu' and n.gate = 'gf')
      into v_ok from public.gfweekly_news n where n.id = p_id for update;
  end if;
  return v_ok;
end;
$fn$;

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
  v_abg int := 0;
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

  insert into public.hh_entscheidungen (quelle_art, quelle_id, vorhaben_id, frage, frist, frist_quelle, vorschlag, created_by)
    select q.quelle_art, q.quelle_id, q.vorhaben_id, q.frage, q.frist, case when q.frist is null then null else q.quelle_art end, q.vorschlag, 'kompass'
      from tmp_en_quellen q
     where not exists (select 1 from public.hh_entscheidungen e where e.quelle_art = q.quelle_art and e.quelle_id = q.quelle_id)
  on conflict (quelle_art, quelle_id) do nothing;
  get diagnostics v_neu = row_count;

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

  update public.hh_entscheidungen e set status = 'hinfaellig', updated_at = now()
   where e.status in ('offen','vertagt')
     and not exists (select 1 from tmp_en_quellen q where q.quelle_art = e.quelle_art and q.quelle_id = e.quelle_id);
  get diagnostics v_hin = row_count;

  update public.hh_entscheidungen e set status = 'offen', updated_at = now()
   where e.status = 'hinfaellig'
     and exists (select 1 from tmp_en_quellen q where q.quelle_art = e.quelle_art and q.quelle_id = e.quelle_id);
  get diagnostics v_zurueck = row_count;

  -- Abgegeben und wieder bei der GF (Ausgang erneut gf, Punkt wieder GF): zurück in die Liste, Rückweg verfällt.
  update public.hh_entscheidungen e set status = 'offen', abgegeben_an = null, rueckweg = null, rueckweg_at = null, updated_at = now()
   where e.status = 'abgegeben'
     and exists (select 1 from tmp_en_quellen q where q.quelle_art = e.quelle_art and q.quelle_id = e.quelle_id);
  get diagnostics v_abg = row_count;

  return jsonb_build_object('eingefuegt', v_neu, 'aktualisiert', v_akt, 'hinfaellig', v_hin, 'wieder_offen', v_zurueck + v_abg);
end;
$fn$;

drop function if exists public.hh_entscheidung_entscheiden(uuid, text, text);
create or replace function public.hh_entscheidung_entscheiden(p_id uuid, p_ergebnis text, p_by text, p_session uuid default null)
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
  v_ok boolean;
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
  if v_e.status = 'abgegeben' then raise exception 'Abgegeben an %; erst zurückholen (Rückgängig) oder den Ausgang wieder auf GF setzen', v_e.abgegeben_an using errcode = 'PT409'; end if;
  if v_e.status = 'hinfaellig' then raise exception 'Die Quelle ist inzwischen erledigt oder weitergegeben; bitte neu laden' using errcode = 'PT409'; end if;
  v_ok := public.hh_en_quelle_eignung(v_e.quelle_art, v_e.quelle_id);
  if v_ok is null then raise exception 'Die Quelle gibt es nicht mehr; bitte neu laden' using errcode = 'PT409'; end if;
  if not v_ok then raise exception 'Die Quelle ist inzwischen erledigt, archiviert oder weitergegeben; bitte neu laden' using errcode = 'PT409'; end if;
  v_orig := public.hh_en_original(v_e.quelle_art, v_e.quelle_id);

  if v_e.quelle_art = 'punkt' then
    update public.hh_vorhaben_punkte set erledigt = true, erledigt_at = now(), erledigt_by = v_by, updated_at = now()
     where id = v_e.quelle_id returning vorhaben_id, titel into v_vorhaben, v_titel;
    insert into public.hh_vorhaben_verlauf (vorhaben_id, punkt_id, art, wer, text, status, created_by)
      values (v_vorhaben, v_e.quelle_id, 'entscheidung', v_by, 'Entschieden: ' || v_erg, 'bestaetigt', 'kompass')
      returning id into v_verlauf;
  elsif v_e.quelle_art = 'thema' then
    update public.gfweekly_topics set board_lane = 'entschieden', decision = v_erg, resolved_at = now(), last_discussed = current_date, updated_at = now()
     where id = v_e.quelle_id returning title into v_titel;
    -- Sitzungskennung nur, wenn es die Sitzung gibt (sonst bliebe der Beschluss am Fremdschlüssel hängen).
    insert into public.gfweekly_decisions (topic_id, session_id, topic_title, decision, decided_by, decided_at)
      values (v_e.quelle_id, (select s.id from public.gfweekly_sessions s where s.id = p_session), coalesce(v_titel, v_e.frage), v_erg, v_by, current_date)
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
               'original', v_orig, 'nach', public.hh_en_original(v_e.quelle_art, v_e.quelle_id), 'verlauf_id', v_verlauf, 'decision_id', v_decision),
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
  v_ok boolean;
begin
  if p_bis is null or p_bis < current_date then raise exception 'Vertagen braucht ein Datum ab heute' using errcode = 'PT400'; end if;
  select * into v_e from public.hh_entscheidungen where id = p_id for update;
  if not found then raise exception 'Entscheidung gibt es nicht' using errcode = 'PT404'; end if;
  if v_e.status = 'entschieden' then raise exception 'Schon entschieden; bitte neu laden' using errcode = 'PT409'; end if;
  if v_e.status = 'abgegeben' then raise exception 'Abgegeben an %; erst zurückholen (Rückgängig) oder den Ausgang wieder auf GF setzen', v_e.abgegeben_an using errcode = 'PT409'; end if;
  if v_e.status = 'hinfaellig' then raise exception 'Die Quelle ist inzwischen erledigt oder weitergegeben; bitte neu laden' using errcode = 'PT409'; end if;
  if v_e.status = 'vertagt' and v_e.vertagt_bis = p_bis then
    return jsonb_build_object('entscheidung', to_jsonb(v_e), 'geaendert', false);
  end if;
  v_ok := public.hh_en_quelle_eignung(v_e.quelle_art, v_e.quelle_id);
  if v_ok is null then raise exception 'Die Quelle gibt es nicht mehr; bitte neu laden' using errcode = 'PT409'; end if;
  if not v_ok then raise exception 'Die Quelle ist inzwischen erledigt, archiviert oder weitergegeben; bitte neu laden' using errcode = 'PT409'; end if;
  v_orig := public.hh_en_original(v_e.quelle_art, v_e.quelle_id);

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
                 'frist', v_e.frist, 'frist_quelle', v_e.frist_quelle, 'abgegeben_an', v_e.abgegeben_an),
               'original', v_orig, 'nach', public.hh_en_original(v_e.quelle_art, v_e.quelle_id)),
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
  v_ok boolean;
  v_wer text;
  v_verlauf uuid;
  v_vorhaben uuid;
begin
  if p_an is null or p_an not in ('alex','lea','team') then raise exception 'Abgeben an alex, lea oder team' using errcode = 'PT400'; end if;
  select * into v_e from public.hh_entscheidungen where id = p_id for update;
  if not found then raise exception 'Entscheidung gibt es nicht' using errcode = 'PT404'; end if;
  if v_e.status = 'entschieden' then raise exception 'Schon entschieden; bitte neu laden' using errcode = 'PT409'; end if;
  if v_e.status = 'abgegeben' then raise exception 'Schon abgegeben an %; erst zurückholen (Rückgängig) oder den Ausgang wieder auf GF setzen', v_e.abgegeben_an using errcode = 'PT409'; end if;
  if v_e.status = 'hinfaellig' then raise exception 'Die Quelle ist inzwischen erledigt oder weitergegeben; bitte neu laden' using errcode = 'PT409'; end if;
  v_ok := public.hh_en_quelle_eignung(v_e.quelle_art, v_e.quelle_id);
  if v_ok is null then raise exception 'Die Quelle gibt es nicht mehr; bitte neu laden' using errcode = 'PT409'; end if;
  if not v_ok then raise exception 'Die Quelle ist inzwischen erledigt, archiviert oder weitergegeben; bitte neu laden' using errcode = 'PT409'; end if;
  v_orig := public.hh_en_original(v_e.quelle_art, v_e.quelle_id);
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
                 'vertagt_bis', v_e.vertagt_bis), 'original', v_orig, 'nach', public.hh_en_original(v_e.quelle_art, v_e.quelle_id), 'verlauf_id', v_verlauf),
    rueckweg_at = now()
   where id = p_id returning * into v_e;
  return jsonb_build_object('entscheidung', to_jsonb(v_e), 'geaendert', true);
end;
$fn$;

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
  v_jetzt jsonb;
begin
  select * into v_e from public.hh_entscheidungen where id = p_id for update;
  if not found then raise exception 'Entscheidung gibt es nicht' using errcode = 'PT404'; end if;
  if v_e.rueckweg is null then raise exception 'Nichts zum Zurücknehmen' using errcode = 'PT409'; end if;
  if v_e.rueckweg_at < now() - interval '24 hours' then raise exception 'Rückgängig geht nur innerhalb von 24 Stunden' using errcode = 'PT409'; end if;
  v_o := v_e.rueckweg->'original'; v_eig := v_e.rueckweg->'eigen';
  -- Quelle sperren und mit dem Stand nach der Aktion vergleichen: hat jemand sie seither geändert, kein stilles Überschreiben.
  perform public.hh_en_quelle_eignung(v_e.quelle_art, v_e.quelle_id);
  v_jetzt := public.hh_en_original(v_e.quelle_art, v_e.quelle_id);
  if v_jetzt is null then raise exception 'Die Quelle gibt es nicht mehr; Rückgängig nicht möglich' using errcode = 'PT409'; end if;
  if (v_e.rueckweg ? 'nach') and v_jetzt is distinct from v_e.rueckweg->'nach' then
    raise exception 'Die Quelle wurde seit der Aktion geändert; Rückgängig nicht möglich, bitte von Hand nachsehen' using errcode = 'PT409';
  end if;

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

-- Korb: Zuordnen (mit optionalem Anlegen) und Verlaufseintrag in einer Transaktion. p_neu: {title, slug} für ein neues Vorhaben.
create or replace function public.hh_korb_zuordnen(p_kind text, p_id uuid, p_vorhaben uuid, p_neu jsonb, p_by text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_by text := public.hh_en_person(p_by);
  v_vh public.hh_vorhaben;
  v_titel text;
  v_n int;
  v_verlauf uuid;
  v_angelegt boolean := false;
  v_neu jsonb;
begin
  if p_kind not in ('thema','kandidat') then raise exception 'kind: thema oder kandidat' using errcode = 'PT400'; end if;
  if p_kind = 'thema' then select title into v_titel from public.gfweekly_topics where id = p_id for update;
  else select title into v_titel from public.gfweekly_news where id = p_id for update; end if;
  if v_titel is null then raise exception 'Eintrag gibt es nicht' using errcode = 'PT404'; end if;
  if p_neu is not null then
    if length(trim(coalesce(p_neu->>'title', ''))) < 3 then raise exception 'titel fehlt' using errcode = 'PT400'; end if;
    -- Erst anlegen (einmal, in eine Variable), dann lesen: ein volatiler Aufruf im WHERE liefe je geprüfter Zeile erneut.
    v_neu := public.hh_vorhaben_neu(
      jsonb_build_object('title', trim(p_neu->>'title'), 'slug', p_neu->>'slug', 'gruppe', coalesce(p_neu->>'gruppe', 'sonstiges'), 'status', 'aktiv', 'ball', 'gf'),
      v_by, 'Aus dem Korb angelegt (' || case when p_kind = 'thema' then 'Thema' else 'Kandidat' end || ': ' || v_titel || ')');
    select * into v_vh from public.hh_vorhaben where id = ((v_neu->'vorhaben')->>'id')::uuid;
    v_angelegt := true;
  else
    select * into v_vh from public.hh_vorhaben where id = p_vorhaben for update;
    if not found then raise exception 'Vorhaben gibt es nicht' using errcode = 'PT404'; end if;
    if v_vh.status not in ('aktiv','pausiert') then raise exception 'Das Vorhaben ist nicht mehr aktiv' using errcode = 'PT409'; end if;
  end if;
  if p_kind = 'thema' then
    update public.gfweekly_topics set vorhaben_id = v_vh.id, updated_at = now() where id = p_id and vorhaben_id is null;
  else
    update public.gfweekly_news set vorhaben_id = v_vh.id where id = p_id and vorhaben_id is null;
  end if;
  get diagnostics v_n = row_count;
  if v_n = 0 then raise exception 'Der Eintrag ist inzwischen einem Vorhaben zugeordnet; bitte neu laden' using errcode = 'PT409'; end if;
  insert into public.hh_vorhaben_verlauf (vorhaben_id, art, wer, text, status, created_by)
    values (v_vh.id, 'notiz', v_by, 'Aus dem Korb zugeordnet: ' || v_titel, 'bestaetigt', v_by) returning id into v_verlauf;
  return jsonb_build_object('ok', true, 'item', jsonb_build_object('id', p_id, 'title', v_titel, 'vorhaben_id', v_vh.id),
                            'vorhaben', jsonb_build_object('id', v_vh.id, 'slug', v_vh.slug, 'title', v_vh.title), 'angelegt', v_angelegt, 'verlauf_id', v_verlauf);
end;
$fn$;

revoke all on function public.hh_en_quelle_eignung(text, uuid) from public, anon, authenticated;
grant execute on function public.hh_en_quelle_eignung(text, uuid) to service_role;
revoke all on function public.hh_entscheidungen_sammeln() from public, anon, authenticated;
grant execute on function public.hh_entscheidungen_sammeln() to service_role;
revoke all on function public.hh_entscheidung_entscheiden(uuid, text, text, uuid) from public, anon, authenticated;
grant execute on function public.hh_entscheidung_entscheiden(uuid, text, text, uuid) to service_role;
revoke all on function public.hh_entscheidung_vertagen(uuid, date, text) from public, anon, authenticated;
grant execute on function public.hh_entscheidung_vertagen(uuid, date, text) to service_role;
revoke all on function public.hh_entscheidung_abgeben(uuid, text, text) from public, anon, authenticated;
grant execute on function public.hh_entscheidung_abgeben(uuid, text, text) to service_role;
revoke all on function public.hh_entscheidung_zurueck(uuid, text) from public, anon, authenticated;
grant execute on function public.hh_entscheidung_zurueck(uuid, text) to service_role;
revoke all on function public.hh_korb_zuordnen(text, uuid, uuid, jsonb, text) from public, anon, authenticated;
grant execute on function public.hh_korb_zuordnen(text, uuid, uuid, jsonb, text) to service_role;
