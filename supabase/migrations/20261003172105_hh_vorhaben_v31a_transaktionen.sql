-- Das Hohe Haus · V31a, Nacharbeit aus der Review 31a Runde 1 (03.10.2026).
-- Mehrstufige Schreibwege der Vorhaben laufen jetzt in einer Transaktion (Befunde 1, 2, 4; Empfehlung 1):
--   hh_punkt_toggle    Abhaken und Wieder-Öffnen mit Verlauf
--   hh_punkt_save      Punkt ändern, neuer Stand mit Verlauf
--   hh_vorhaben_neu    Vorhaben anlegen mit Verlaufseintrag
--   hh_verlauf_status  Vorschlag übernehmen oder verwerfen, „Punkt erledigt“ hakt den Punkt im selben Zug ab
--   hh_einwurf_apply   Einwurf übernehmen: alles oder nichts; bei geändertem Ziel nur der Verlaufseintrag
-- hh_handover_set: eine erneute Bestätigung setzt keinen von Hand bewegten Ball zurück (Befund 3).
-- Fehlercodes PT400, PT404, PT409 beantwortet PostgREST mit dem jeweiligen HTTP-Status.
set lock_timeout = '10s';

create or replace function public.hh_punkt_toggle(p_id uuid, p_erledigt boolean, p_by text, p_quelle text default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_p public.hh_vorhaben_punkte;
  v_e public.hh_vorhaben_verlauf;
begin
  select * into v_p from public.hh_vorhaben_punkte where id = p_id for update;
  if not found then raise exception 'Punkt % gibt es nicht', p_id using errcode = 'PT404'; end if;
  if v_p.erledigt = p_erledigt then
    return jsonb_build_object('punkt', to_jsonb(v_p), 'geaendert', false, 'verlauf', null);
  end if;
  update public.hh_vorhaben_punkte set
    erledigt = p_erledigt,
    erledigt_at = case when p_erledigt then now() else null end,
    erledigt_by = case when p_erledigt then p_by else null end
  where id = p_id returning * into v_p;
  insert into public.hh_vorhaben_verlauf (vorhaben_id, punkt_id, art, wer, text, source_ref, created_by)
  values (v_p.vorhaben_id, v_p.id, 'system', p_by,
          case when p_erledigt then 'Punkt erledigt: ' else 'Punkt wieder offen: ' end || v_p.titel, p_quelle, p_by)
  returning * into v_e;
  return jsonb_build_object('punkt', to_jsonb(v_p), 'geaendert', true, 'verlauf', to_jsonb(v_e));
end;
$fn$;

-- Ändert einen Punkt (Felder wie in punkt_save geprüft). Ein neuer Stand schreibt Verlauf.
create or replace function public.hh_punkt_save(p_id uuid, p_patch jsonb, p_by text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_alt public.hh_vorhaben_punkte;
  v_neu public.hh_vorhaben_punkte;
begin
  select * into v_alt from public.hh_vorhaben_punkte where id = p_id for update;
  if not found then raise exception 'Punkt % gibt es nicht', p_id using errcode = 'PT404'; end if;
  update public.hh_vorhaben_punkte set
    titel    = case when p_patch ? 'titel' then p_patch->>'titel' else titel end,
    position = case when p_patch ? 'position' then p_patch->>'position' else position end,
    stand    = case when p_patch ? 'stand' then p_patch->>'stand' else stand end,
    wer      = case when p_patch ? 'wer' then p_patch->>'wer' else wer end,
    frist    = case when p_patch ? 'frist' then (p_patch->>'frist')::date else frist end,
    sort     = case when p_patch ? 'sort' then (p_patch->>'sort')::int else sort end
  where id = p_id returning * into v_neu;
  if coalesce(v_neu.stand, '') is distinct from coalesce(v_alt.stand, '') then
    insert into public.hh_vorhaben_verlauf (vorhaben_id, punkt_id, art, wer, text, created_by)
    values (v_neu.vorhaben_id, v_neu.id, 'system', p_by,
            'Punkt ' || v_neu.titel || ': ' || coalesce(nullif(btrim(v_neu.stand), ''), 'Stand gestrichen'), p_by);
  end if;
  return jsonb_build_object('punkt', to_jsonb(v_neu));
end;
$fn$;

-- Legt ein Vorhaben an und schreibt „Vorhaben angelegt“. Der slug kommt geprüft aus der Edge Function.
create or replace function public.hh_vorhaben_neu(p_row jsonb, p_by text, p_notiz text default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v public.hh_vorhaben;
begin
  insert into public.hh_vorhaben (slug, title, gruppe, strand, ball, ball_name, ball_seit, owner, stand, naechster_schritt,
                                  frist, frist_text, konflikt, status, sort, updated_by)
  values (p_row->>'slug', p_row->>'title', coalesce(p_row->>'gruppe', 'sonstiges'), p_row->>'strand',
          coalesce(p_row->>'ball', 'offen'), p_row->>'ball_name',
          case when coalesce(p_row->>'ball', 'offen') <> 'offen' then now() end,
          p_row->>'owner', p_row->>'stand', p_row->>'naechster_schritt', (p_row->>'frist')::date, p_row->>'frist_text',
          p_row->>'konflikt', coalesce(p_row->>'status', 'aktiv'), coalesce((p_row->>'sort')::int, 100), p_by)
  returning * into v;
  insert into public.hh_vorhaben_verlauf (vorhaben_id, art, wer, text, created_by)
  values (v.id, 'system', p_by, 'Vorhaben angelegt' || coalesce(': ' || nullif(btrim(p_notiz), ''), ''), p_by);
  return jsonb_build_object('vorhaben', to_jsonb(v));
end;
$fn$;

-- Vorschlag im Verlauf übernehmen oder verwerfen. Ein Vorschlag „Punkt erledigt“ des Abgleichs trägt die Punkt-ID im
-- source_ref (abgleich:<person>:vorschlag:<Punkt-ID>:<Quelle>); Übernehmen hakt den Punkt im selben Zug ab.
create or replace function public.hh_verlauf_status(p_id uuid, p_status text, p_by text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_alt public.hh_vorhaben_verlauf;
  v_neu public.hh_vorhaben_verlauf;
  v_pid uuid;
  v_angewendet jsonb := null;
begin
  if p_status not in ('bestaetigt', 'verworfen') then
    raise exception 'status: bestaetigt oder verworfen' using errcode = 'PT400';
  end if;
  select * into v_alt from public.hh_vorhaben_verlauf where id = p_id for update;
  if not found then raise exception 'Eintrag % gibt es nicht', p_id using errcode = 'PT404'; end if;
  update public.hh_vorhaben_verlauf set status = p_status where id = p_id returning * into v_neu;
  if v_alt.status = 'vorschlag' and p_status = 'bestaetigt' and coalesce(v_alt.tag, '') ilike 'Vorschlag: Punkt erledigt%' then
    v_pid := nullif(substring(coalesce(v_alt.source_ref, '') from 'vorschlag:([0-9a-fA-F-]{36})'), '')::uuid;
    if v_pid is not null and exists (select 1 from public.hh_vorhaben_punkte where id = v_pid and vorhaben_id = v_alt.vorhaben_id) then
      v_angewendet := public.hh_punkt_toggle(v_pid, true, p_by, null);
    end if;
  end if;
  return jsonb_build_object('verlauf', to_jsonb(v_neu), 'angewendet', v_angewendet);
end;
$fn$;

-- Einwurf übernehmen, alles oder nichts. p_vorhaben ist das Ziel (geprüft in der Edge Function). Gilt der Vorschlag
-- für ein anderes Vorhaben, entsteht nur der Verlaufseintrag (bearbeiteter Text oder der Text des Einwurfs); Punkte,
-- neue Punkte, Ball, nächster Schritt und Frist wurden gegen das andere Vorhaben geprüft und bleiben weg (Befund 2).
-- Hat die Prüfung den Verlaufstext als möglicherweise vertraulich markiert, braucht es einen bearbeiteten Text.
create or replace function public.hh_einwurf_apply(p_id uuid, p_vorhaben uuid, p_auswahl jsonb, p_bearbeitet jsonb, p_benachrichtigung text, p_by text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_ew public.hh_einwurf;
  v_vh public.hh_vorhaben;
  v_vs jsonb;
  v_gleich boolean;
  v_ref text := 'einwurf:' || p_id;
  v_text text; v_art text; v_wer text;
  v_verlauf jsonb := null;
  v_punkte jsonb := '[]'::jsonb;
  v_neue jsonb := '[]'::jsonb;
  v_ueber jsonb := '[]'::jsonb;
  v_felder jsonb := null;
  v_patch jsonb := '{}'::jsonb;
  v_ticker boolean := false;
  v_pid text; v_vp jsonb; v_p public.hh_vorhaben_punkte;
  v_i text; v_n jsonb; v_sort int; v_np public.hh_vorhaben_punkte;
  v_schritt text; v_frist text;
  v_ben text := case when p_benachrichtigung in ('sofort','morgen') then p_benachrichtigung end;
  v_andere text := case when p_by = 'Alex' then 'Lea' else 'Alex' end;
begin
  select * into v_ew from public.hh_einwurf where id = p_id for update;
  if not found then raise exception 'Einwurf % gibt es nicht', p_id using errcode = 'PT404'; end if;
  if v_ew.status not in ('neu', 'vorgeschlagen') then
    raise exception 'Der Einwurf ist schon %', case when v_ew.status = 'uebernommen' then 'übernommen' else 'verworfen' end
      using errcode = 'PT409';
  end if;
  select * into v_vh from public.hh_vorhaben where id = p_vorhaben for update;
  if not found then raise exception 'Vorhaben % gibt es nicht', p_vorhaben using errcode = 'PT404'; end if;
  v_vs := v_ew.vorschlag;
  v_gleich := v_vs is not null and nullif(v_vs->>'vorhaben_id', '') is not null and (v_vs->>'vorhaben_id')::uuid = p_vorhaben;
  if v_vs is not null and not v_gleich then
    v_ueber := v_ueber || to_jsonb('Der Vorschlag galt für ' || coalesce(v_vs->>'vorhaben_titel', 'ein anderes Vorhaben')
                                   || '; übernommen wird nur der Verlaufseintrag.');
  end if;
  v_ben := coalesce(v_ben, nullif(v_vs->>'benachrichtigung', ''), 'morgen');

  -- Verlauf
  if v_vs is null or not v_gleich or coalesce((p_auswahl->>'verlauf')::boolean, false) then
    v_text := nullif(btrim(coalesce(p_bearbeitet->>'verlauf_text', '')), '');
    if v_text is null and v_gleich then
      if coalesce(v_vs->'vertraulich', '[]'::jsonb) ? 'verlauf' then
        raise exception 'Der vorgeschlagene Verlaufstext enthält möglicherweise vertrauliche Angaben. Bitte den Text bearbeiten.'
          using errcode = 'PT400';
      end if;
      v_text := nullif(btrim(coalesce(v_vs#>>'{verlauf,text}', '')), '');
    end if;
    v_text := left(coalesce(v_text, v_ew.text), 2000);
    v_art := case when v_ew.kanal = 'mail' then 'mail'
                  when v_gleich and v_vs#>>'{verlauf,art}' in ('telefon','mail','whatsapp','notiz','entscheidung','termin','plattform') then v_vs#>>'{verlauf,art}'
                  else 'einwurf' end;
    v_wer := case when v_gleich then coalesce(nullif(v_vs#>>'{verlauf,wer}', ''), v_ew.von) else v_ew.von end;
    insert into public.hh_vorhaben_verlauf (vorhaben_id, art, wer, text, tag, happened_at, source_ref, status, created_by)
    values (p_vorhaben, v_art, v_wer, v_text, case when v_gleich then nullif(v_vs#>>'{verlauf,tag}', '') end,
            v_ew.created_at, v_ref, 'bestaetigt', p_by)
    on conflict (source_ref) do nothing;
    select to_jsonb(e) into v_verlauf from public.hh_vorhaben_verlauf e where e.source_ref = v_ref;
  end if;

  if v_gleich then
    -- Punkte: nur IDs aus dem Vorschlag, die zu diesem Vorhaben gehören
    for v_pid in select jsonb_array_elements_text(coalesce(p_auswahl->'punkte', '[]'::jsonb)) loop
      v_vp := null;
      select x into v_vp from jsonb_array_elements(coalesce(v_vs->'punkte', '[]'::jsonb)) x where x->>'id' = v_pid limit 1;
      select * into v_p from public.hh_vorhaben_punkte where id::text = v_pid and vorhaben_id = p_vorhaben for update;
      if v_vp is null or v_p.id is null or v_p.id::text <> v_pid then
        v_ueber := v_ueber || to_jsonb('Punkt ' || coalesce(v_vp->>'titel', v_pid) || ' gehört nicht zu ' || v_vh.title);
        continue;
      end if;
      if nullif(btrim(coalesce(v_vp->>'stand', '')), '') is not null and v_vp->>'stand' is distinct from v_p.stand then
        perform public.hh_punkt_save(v_p.id, jsonb_build_object('stand', v_vp->>'stand'), p_by);
      end if;
      if coalesce((v_vp->>'erledigt')::boolean, false) and not v_p.erledigt then
        perform public.hh_punkt_toggle(v_p.id, true, p_by, null);
      end if;
      v_punkte := v_punkte || to_jsonb(v_pid);
    end loop;
    -- Neue Punkte nach ihrer Nummer im Vorschlag
    select coalesce(max(sort), 0) + 10 into v_sort from public.hh_vorhaben_punkte where vorhaben_id = p_vorhaben;
    for v_i in select jsonb_array_elements_text(coalesce(p_auswahl->'neue_punkte', '[]'::jsonb)) loop
      v_n := v_vs->'neue_punkte'->(v_i::int);
      if v_n is null or nullif(btrim(coalesce(v_n->>'titel', '')), '') is null then
        v_ueber := v_ueber || to_jsonb('neuer Punkt Nr. ' || v_i || ' fehlt im Vorschlag');
        continue;
      end if;
      insert into public.hh_vorhaben_punkte (vorhaben_id, titel, wer, frist, quelle, sort)
      values (p_vorhaben, left(v_n->>'titel', 300), nullif(v_n->>'wer', ''), nullif(v_n->>'frist', '')::date, v_ref, v_sort)
      returning * into v_np;
      v_neue := v_neue || to_jsonb(v_np); v_sort := v_sort + 10;
    end loop;
    -- Felder
    if coalesce((p_auswahl->>'ball')::boolean, false) and nullif(v_vs->>'ball', '') is not null then
      v_patch := v_patch || jsonb_build_object('ball', v_vs->>'ball',
        'ball_name', case when v_vs->>'ball' in ('team','extern') then nullif(v_vs->>'ball_name', '') end);
    end if;
    v_schritt := coalesce(nullif(btrim(coalesce(p_bearbeitet->>'naechster_schritt', '')), ''), nullif(v_vs->>'naechster_schritt', ''));
    if coalesce((p_auswahl->>'naechster_schritt')::boolean, false) and v_schritt is not null then
      v_patch := v_patch || jsonb_build_object('naechster_schritt', left(v_schritt, 1000));
    end if;
    v_frist := coalesce(nullif(p_bearbeitet->>'frist', ''), nullif(v_vs->>'frist', ''));
    if coalesce((p_auswahl->>'frist')::boolean, false) and v_frist is not null then
      v_patch := v_patch || jsonb_build_object('frist', v_frist);
    end if;
    if v_patch <> '{}'::jsonb then
      v_felder := public.hh_vorhaben_save(p_vorhaben, v_patch, p_by, null, 'Einwurf');
    end if;
  end if;

  if v_ben = 'sofort' then
    insert into public.gfweekly_news (kind, source, who, title, body, happened_at, relevance, status, source_ref, vorhaben_id)
    values ('ticker', 'manuell', v_andere,
            left(v_vh.title || ': ' || coalesce(v_verlauf->>'text', v_ew.text), 500),
            left(coalesce(v_verlauf->>'text', v_ew.text) || E'\n\nEinwurf von ' || v_ew.von || ', übernommen von ' || p_by || '.', 6000),
            now(), 'mittel', 'neu', v_ref, p_vorhaben)
    on conflict (source_ref) do nothing;
    v_ticker := true;
  end if;

  update public.hh_einwurf set
    status = 'uebernommen', vorhaben_id = p_vorhaben, entschieden_by = p_by, entschieden_at = now(),
    vorschlag = coalesce(vorschlag, '{}'::jsonb) || jsonb_build_object('benachrichtigung_gewaehlt', v_ben,
      'angewendet', jsonb_build_object('auswahl', p_auswahl, 'vorhaben_id', p_vorhaben, 'uebersprungen', v_ueber))
  where id = p_id;

  return jsonb_build_object('verlauf', v_verlauf, 'punkte', v_punkte, 'neue_punkte', v_neue, 'felder', v_felder,
                            'ticker', v_ticker, 'uebersprungen', v_ueber);
end;
$fn$;

do $$
declare f text;
begin
  foreach f in array array['hh_punkt_toggle(uuid, boolean, text, text)', 'hh_punkt_save(uuid, jsonb, text)',
    'hh_vorhaben_neu(jsonb, text, text)', 'hh_verlauf_status(uuid, text, text)',
    'hh_einwurf_apply(uuid, uuid, jsonb, jsonb, text, text)'] loop
    execute 'revoke all on function public.' || f || ' from public, anon, authenticated';
    execute 'grant execute on function public.' || f || ' to service_role';
  end loop;
end $$;

-- Übergabe: wie in 20261003165328, mit Befund 3.
create or replace function public.hh_handover_set(p_id uuid, p_by text, p_patch jsonb default '{}'::jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_row public.gfweekly_handover;
  v_alt public.gfweekly_handover;
  v_abs public.gfweekly_absences;
  v_vh public.hh_vorhaben;
  v_ampel text; v_vertretung text; v_status text; v_alt_vertretung text;
  v_ende date; v_gate text; v_wort text;
  v_ruhte boolean;
  v_vorgang jsonb := null;
  v_ball0 text; v_ball text; v_ball_name text; v_bis text; v_text text;
  v_geaendert boolean;
  v_anwenden boolean;
begin
  select * into v_alt from public.gfweekly_handover where id = p_id for update;
  if not found then raise exception 'Korbzeile % gibt es nicht', p_id using errcode = 'no_data_found'; end if;
  select * into v_abs from public.gfweekly_absences where id = v_alt.absence_id for update;
  if not found then raise exception 'Zur Korbzeile % fehlt die Abwesenheit', p_id using errcode = 'no_data_found'; end if;

  v_alt_vertretung := nullif(btrim(coalesce(v_alt.vertretung,'')), '');
  v_ampel := coalesce(p_patch->>'ampel', v_alt.ampel);
  v_status := coalesce(p_patch->>'status', 'bestaetigt');
  if p_patch ? 'vertretung' then v_vertretung := nullif(btrim(coalesce(p_patch->>'vertretung','')), '');
  else v_vertretung := v_alt_vertretung; end if;
  -- Was ruht oder vor der Abreise erledigt sein soll, wird nicht vertreten.
  if v_ampel in ('ruht','vorher') then v_vertretung := null; end if;
  -- Lag die Zeile vorher auf „ruht“ und liegt jetzt nicht mehr, ist die Ruhe aufgehoben.
  v_ruhte := coalesce(v_alt.ampel, '') = 'ruht' and coalesce(v_ampel, '') <> 'ruht';
  v_geaendert := coalesce(v_alt.status,'') || '|' || coalesce(v_alt.ampel,'') || '|' || coalesce(v_alt_vertretung,'')
              <> v_status || '|' || coalesce(v_ampel,'') || '|' || coalesce(v_vertretung,'');

  update public.gfweekly_handover set
    cluster    = coalesce(p_patch->>'cluster', cluster),
    ampel      = v_ampel,
    vertretung = v_vertretung,
    frist      = case when p_patch ? 'frist' then nullif(p_patch->>'frist','')::date else frist end,
    regel_note = case when p_patch ? 'regel_note' then nullif(p_patch->>'regel_note','') else regel_note end,
    status     = v_status,
    by         = p_by,
    updated_at = now()
  where id = p_id
  returning * into v_row;

  v_ende := coalesce(v_abs.bis, v_abs.bis_geschaetzt, v_abs.von + 13);

  if v_row.kind = 'thema' then
    if v_ampel = 'ruht' then
      update public.gfweekly_topics set
        handover_id = v_row.id, owner_backup = null, gate = 'warten', gate_frist = v_ende + 1,
        gate_by = p_by, gate_at = now(), gate_note = 'ruht bis zur Rückkehr von ' || v_abs.person,
        updated_at = now()
      where id = v_row.ref_id::uuid
      returning jsonb_build_object('id', id, 'gate', gate, 'owner_backup', owner_backup) into v_vorgang;
    elsif v_vertretung is not null then
      v_gate := public.hh_person_gate(v_vertretung, 'team');
      update public.gfweekly_topics set
        handover_id = v_row.id, owner_backup = v_vertretung, gate = v_gate,
        -- Eine aufgehobene Ruhe nimmt ihre Rückkehrfrist mit; eine sonst gesetzte Frist bleibt.
        gate_frist = case when v_ruhte then null else gate_frist end,
        gate_by = p_by, gate_at = now(), gate_note = 'in Vertretung für ' || v_abs.person,
        updated_at = now()
      where id = v_row.ref_id::uuid
      returning jsonb_build_object('id', id, 'gate', gate, 'owner_backup', owner_backup) into v_vorgang;
    elsif v_alt_vertretung is not null or v_ruhte then
      -- Vertretung entfernt oder Ruhe aufgehoben: der Ausgang gehört wieder der abwesenden Person.
      v_gate := public.hh_person_gate(v_abs.person, 'gf');
      update public.gfweekly_topics set
        handover_id = v_row.id, owner_backup = null, gate = v_gate,
        gate_frist = case when v_ruhte then null else gate_frist end,
        gate_by = p_by, gate_at = now(),
        gate_note = case when v_ruhte then 'Ruhe aufgehoben, wieder bei ' || v_abs.person
                         else 'wieder bei ' || v_abs.person end,
        updated_at = now()
      where id = v_row.ref_id::uuid
      returning jsonb_build_object('id', id, 'gate', gate, 'owner_backup', owner_backup) into v_vorgang;
    else
      -- Zeilen ohne Vertretung (etwa „vor Abreise“) behalten ihren Ausgang.
      update public.gfweekly_topics set handover_id = v_row.id, updated_at = now()
      where id = v_row.ref_id::uuid
      returning jsonb_build_object('id', id, 'gate', gate, 'owner_backup', owner_backup) into v_vorgang;
    end if;
    if v_vorgang is null then
      raise exception 'Thema % zur Korbzeile % gibt es nicht', v_row.ref_id, p_id using errcode = 'no_data_found';
    end if;
  end if;

  if v_row.kind = 'vorhaben' then
    select * into v_vh from public.hh_vorhaben where id = v_row.ref_id::uuid for update;
    if not found then
      raise exception 'Vorhaben % zur Korbzeile % gibt es nicht', v_row.ref_id, p_id using errcode = 'no_data_found';
    end if;
    -- Der Ball vor dieser Abwesenheit: steht schon fest, wenn die Zeile vorher bestätigt wurde.
    v_ball0 := case when v_vh.absence_id = v_abs.id and v_vh.ball_vor_abwesenheit is not null
                    then v_vh.ball_vor_abwesenheit else v_vh.ball end;
    v_bis := coalesce(to_char(coalesce(v_abs.bis, v_abs.bis_geschaetzt), 'DD.MM.YYYY'), 'auf Weiteres');
    v_text := null;
    -- Befund 3 (Review 31a): Ist die Zeile schon bestätigt und hat jemand den Ball seitdem von Hand bewegt (Bindung
    -- gelöst), setzt eine erneute Bestätigung mit denselben Werten den Ball nicht zurück. Nur eine echte Änderung an
    -- Ampel oder Vertretung gilt als neuer, gewollter Wechsel.
    v_anwenden := v_alt.status = 'vorschlag' or v_vh.absence_id is not distinct from v_abs.id or v_geaendert;
    if not v_anwenden then
      v_text := null;
    elsif v_ampel = 'ruht' then
      v_ball := v_ball0;
      v_ball_name := case when v_ball = v_vh.ball then v_vh.ball_name else null end;
      update public.hh_vorhaben set
        ball = v_ball, ball_name = v_ball_name,
        ball_seit = case when v_ball = v_vh.ball then ball_seit else now() end,
        ball_vor_abwesenheit = v_ball0, absence_id = v_abs.id, updated_by = p_by
      where id = v_vh.id;
      v_text := 'ruht bis ' || to_char(v_ende + 1, 'DD.MM.YYYY') || ', Abwesenheit von ' || v_abs.person;
    elsif v_vertretung is not null then
      v_ball := public.hh_person_gate(v_vertretung, 'team');
      v_ball_name := case when v_ball = 'team' then v_vertretung else null end;
      update public.hh_vorhaben set
        ball = v_ball, ball_name = v_ball_name,
        ball_seit = case when v_ball = v_vh.ball and coalesce(v_ball_name,'') = coalesce(v_vh.ball_name,'') then ball_seit else now() end,
        ball_vor_abwesenheit = v_ball0, absence_id = v_abs.id, updated_by = p_by
      where id = v_vh.id;
      v_text := 'in Vertretung für ' || v_abs.person || ' bis ' || v_bis
             || ' (Ball von ' || public.hh_ball_wort(v_vh.ball, v_vh.ball_name) || ' an ' || public.hh_ball_wort(v_ball, v_ball_name) || ')';
    elsif (v_alt_vertretung is not null or v_ruhte) and v_vh.absence_id = v_abs.id then
      update public.hh_vorhaben set
        ball = v_ball0, ball_name = case when v_ball0 = v_vh.ball then ball_name else null end,
        ball_seit = case when v_ball0 = v_vh.ball then ball_seit else now() end,
        ball_vor_abwesenheit = null, absence_id = null, updated_by = p_by
      where id = v_vh.id;
      v_text := case when v_ruhte then 'Ruhe aufgehoben, ' else 'Vertretung aufgehoben, ' end
             || 'Ball wieder bei ' || public.hh_ball_wort(v_ball0, null);
    end if;
    if v_text is not null and v_geaendert then
      insert into public.hh_vorhaben_verlauf (vorhaben_id, art, wer, text, created_by)
      values (v_vh.id, 'uebergabe', p_by, v_text, p_by);
    end if;
    select jsonb_build_object('id', id, 'ball', ball, 'ball_name', ball_name, 'absence_id', absence_id)
      into v_vorgang from public.hh_vorhaben where id = v_vh.id;
  end if;

  v_wort := case when v_ampel = 'ruht' then 'ruht bis zur Rückkehr'
                 when v_vertretung is not null then 'geht an ' || v_vertretung
                 else 'bestätigt' end;
  insert into public.gfweekly_handover_log (absence_id, handover_id, art, who, text)
  values (v_abs.id, v_row.id,
          case when v_status = 'erledigt' then 'erledigt'
               when v_vertretung is not null then 'weitergabe' else 'notiz' end,
          p_by,
          coalesce(v_row.title,'ohne Titel') || ': ' || v_wort || ' (Ampel ' || coalesce(v_ampel,'offen') || ').'
          || case when v_ruhte then ' Die Ruhe ist aufgehoben.' else '' end);

  return jsonb_build_object('item', to_jsonb(v_row), 'vorgang', v_vorgang);
end;
$fn$;

revoke all on function public.hh_handover_set(uuid, text, jsonb) from public, anon, authenticated;
grant execute on function public.hh_handover_set(uuid, text, jsonb) to service_role;
