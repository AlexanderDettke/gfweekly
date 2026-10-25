-- Kompass · Stufe 1 · Korrekturen aus Codex-Runde 2 (25.10.2026, docs/reviews/STUFE1-runde-2.md, Befunde 1 bis 3).
-- 1. Entscheiden auf eine schon entschiedene Zeile: derselbe Wortlaut bleibt folgenlos, ein anderes Ergebnis ist ein Konflikt (PT409).
-- 2. Der Stand des Originals (hh_en_original) enthält bei Themen archived und archiv_grund, bei Punkten titel und erledigt_at;
--    Rückgängig erkennt damit eine spätere Archivierung und bricht ab.
-- 3. hh_korb_zuordnen prüft unter der Sperre Status und Archivzustand des Eintrags (Thema offen im Board, Kandidat neu).
-- Rückweg: Migrationen 20261025150500 und 20261025163000 erneut anwenden (create or replace).
set lock_timeout = '10s';

create or replace function public.hh_en_original(p_art text, p_id uuid)
returns jsonb
language sql
stable
as $fn$
  select case p_art
    when 'punkt' then (select jsonb_build_object('erledigt', erledigt, 'erledigt_at', erledigt_at, 'erledigt_by', erledigt_by, 'wer', wer, 'frist', frist, 'titel', titel)
                         from public.hh_vorhaben_punkte where id = p_id)
    when 'thema' then (select jsonb_build_object('board_lane', board_lane, 'status', status, 'decision', decision, 'resolved_at', resolved_at,
                                                 'gate', gate, 'gate_by', gate_by, 'gate_at', gate_at, 'gate_frist', gate_frist, 'last_discussed', last_discussed,
                                                 'archived', archived, 'archiv_grund', archiv_grund)
                         from public.gfweekly_topics where id = p_id)
    when 'kandidat' then (select jsonb_build_object('status', status, 'decided_by', decided_by, 'decided_at', decided_at, 'archiv_grund', archiv_grund,
                                                    'gate', gate, 'gate_by', gate_by, 'gate_at', gate_at, 'gate_frist', gate_frist, 'archiviert_at', archiviert_at)
                            from public.gfweekly_news where id = p_id)
    end;
$fn$;

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
    if v_e.ergebnis = v_erg then return jsonb_build_object('entscheidung', to_jsonb(v_e), 'geaendert', false); end if;
    raise exception 'Schon entschieden (%): „%“; bitte neu laden', coalesce(v_e.entschieden_von, ''), left(v_e.ergebnis, 120) using errcode = 'PT409';
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
  v_offen boolean;
  v_n int;
  v_verlauf uuid;
  v_angelegt boolean := false;
  v_neu jsonb;
begin
  if p_kind not in ('thema','kandidat') then raise exception 'kind: thema oder kandidat' using errcode = 'PT400'; end if;
  -- Unter der Sperre: gibt es den Eintrag noch, und ist er noch offen (Thema im Board, Kandidat neu)?
  if p_kind = 'thema' then
    select title, (archived = false and board_lane in ('zu_besprechen','in_klaerung')) into v_titel, v_offen from public.gfweekly_topics where id = p_id for update;
  else
    select title, (kind = 'kandidat' and status = 'neu') into v_titel, v_offen from public.gfweekly_news where id = p_id for update;
  end if;
  if v_titel is null then raise exception 'Eintrag gibt es nicht' using errcode = 'PT404'; end if;
  if not v_offen then raise exception 'Der Eintrag ist inzwischen erledigt, archiviert oder verworfen; bitte neu laden' using errcode = 'PT409'; end if;
  if p_neu is not null then
    if length(trim(coalesce(p_neu->>'title', ''))) < 3 then raise exception 'titel fehlt' using errcode = 'PT400'; end if;
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

revoke all on function public.hh_en_original(text, uuid) from public, anon, authenticated;
grant execute on function public.hh_en_original(text, uuid) to service_role;
revoke all on function public.hh_entscheidung_entscheiden(uuid, text, text, uuid) from public, anon, authenticated;
grant execute on function public.hh_entscheidung_entscheiden(uuid, text, text, uuid) to service_role;
revoke all on function public.hh_korb_zuordnen(text, uuid, uuid, jsonb, text) from public, anon, authenticated;
grant execute on function public.hh_korb_zuordnen(text, uuid, uuid, jsonb, text) to service_role;
