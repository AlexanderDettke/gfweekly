-- Das Hohe Haus · Vorhaben abschließen, Nacharbeit aus der Review Runde 2 (21.10.2026).
-- hh_vorhaben_wiedereroeffnen: Rückgängig (p_rueckgaengig) gilt nur für den jüngsten Abschluss des Vorhabens und nur, solange
-- es erledigt ist; ein älterer Wert gibt PT409. hh_handover_set (Live-Definition vom 21.10.2026 unverändert übernommen)
-- lehnt Korbzeilen zu erledigten oder archivierten Vorhaben unter der Sperre mit PT409 ab.
set lock_timeout = '10s';

create or replace function public.hh_vorhaben_wiedereroeffnen(p_id uuid, p_by text, p_rueckgaengig jsonb default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_alt public.hh_vorhaben;
  v_neu public.hh_vorhaben;
  v_punkte uuid[] := '{}';
  v_themen uuid[] := '{}';
  v_n_punkte int := 0;
  v_n_themen int := 0;
  v_zeit timestamptz;
  v_text text;
begin
  select * into v_alt from public.hh_vorhaben where id = p_id for update;
  if not found then raise exception 'Vorhaben % gibt es nicht', p_id using errcode = 'PT404'; end if;
  if v_alt.status not in ('erledigt', 'archiviert') then
    raise exception 'Das Vorhaben ist nicht abgeschlossen (%), bitte neu laden', v_alt.status using errcode = 'PT409';
  end if;
  if p_rueckgaengig is not null and jsonb_typeof(p_rueckgaengig) = 'object' then
    if jsonb_typeof(p_rueckgaengig->'punkte') = 'array' then
      select coalesce(array_agg(x::uuid), '{}') into v_punkte from jsonb_array_elements_text(p_rueckgaengig->'punkte') x;
    end if;
    if jsonb_typeof(p_rueckgaengig->'themen') = 'array' then
      select coalesce(array_agg(x::uuid), '{}') into v_themen from jsonb_array_elements_text(p_rueckgaengig->'themen') x;
    end if;
    v_zeit := nullif(p_rueckgaengig->>'zeit', '')::timestamptz;
    if v_zeit is null then
      raise exception 'rueckgaengig ohne zeit' using errcode = 'PT400';
    end if;
    -- Rückgängig gilt nur für den jüngsten Abschluss: dessen Verlaufseintrag entstand in derselben Transaktion (created_at = zeit).
    if v_alt.status <> 'erledigt' or v_zeit is distinct from (
         select max(created_at) from public.hh_vorhaben_verlauf
         where vorhaben_id = p_id and art = 'entscheidung' and status = 'bestaetigt' and text ~* '^(Vorhaben )?erledigt:') then
      raise exception 'Rückgängig gilt nur für den letzten Abschluss, bitte neu laden' using errcode = 'PT409';
    end if;
  end if;

  -- Nur die beim Abschluss geänderten Zeilen dieses Vorhabens; was seitdem jemand anders verändert hat, bleibt.
  if cardinality(v_punkte) > 0 then
    update public.hh_vorhaben_punkte set erledigt = false, erledigt_at = null, erledigt_by = null
    where vorhaben_id = p_id and id = any(v_punkte) and erledigt and erledigt_at = v_zeit;
    get diagnostics v_n_punkte = row_count;
  end if;
  if cardinality(v_themen) > 0 then
    update public.gfweekly_topics set archived = false, updated_at = now()
    where vorhaben_id = p_id and id = any(v_themen) and archived and updated_at = v_zeit;
    get diagnostics v_n_themen = row_count;
  end if;

  update public.hh_vorhaben set status = 'aktiv', updated_by = p_by where id = p_id returning * into v_neu;

  v_text := case when p_rueckgaengig is not null then 'Wieder geöffnet (Abschluss rückgängig)' else 'Wieder geöffnet' end;
  if v_n_punkte > 0 or v_n_themen > 0 then
    v_text := v_text || ': ' || concat_ws(', ',
      case when v_n_punkte = 1 then '1 Punkt wieder offen' when v_n_punkte > 1 then v_n_punkte || ' Punkte wieder offen' end,
      case when v_n_themen = 1 then '1 Thema zurück im Board' when v_n_themen > 1 then v_n_themen || ' Themen zurück im Board' end);
  end if;
  insert into public.hh_vorhaben_verlauf (vorhaben_id, art, wer, text, status, created_by)
  values (p_id, 'entscheidung', p_by, v_text, 'bestaetigt', 'hohes-haus');

  return jsonb_build_object('vorhaben', to_jsonb(v_neu), 'punkte', v_n_punkte, 'themen', v_n_themen);
end;
$fn$;


create or replace function public.hh_handover_set(p_id uuid, p_by text, p_patch jsonb DEFAULT '{}'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  -- V31d: p_patch.expect nennt Status, Ampel und Vertretung, wie der Dialog sie gesehen hat. Hat jemand die Zeile
  -- inzwischen entschieden, gibt es 409 statt eines stillen Überschreibens (Alex und Lea im selben Korb).
  if jsonb_typeof(p_patch->'expect') = 'object' then
    if (p_patch->'expect' ? 'status' and (p_patch->'expect'->>'status') is distinct from v_alt.status)
       or (p_patch->'expect' ? 'ampel' and (p_patch->'expect'->>'ampel') is distinct from v_alt.ampel)
       or (p_patch->'expect' ? 'vertretung' and nullif(btrim(coalesce(p_patch->'expect'->>'vertretung','')),'') is distinct from v_alt_vertretung) then
      raise exception 'Die Zeile „%“ wurde inzwischen geändert, bitte neu laden', coalesce(v_alt.title, 'ohne Titel') using errcode = 'PT409';
    end if;
  end if;
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
    -- 21.10.2026: erledigte oder archivierte Vorhaben bewegt die Übergabe nicht mehr (unter der Sperre geprüft).
    if v_vh.status in ('erledigt', 'archiviert') then
      raise exception 'Das Vorhaben ist inzwischen abgeschlossen, bitte neu laden' using errcode = 'PT409';
    end if;
    -- Der Ball vor dieser Abwesenheit: steht schon fest, wenn die Zeile vorher bestätigt wurde.
    v_ball0 := case when v_vh.absence_id = v_abs.id and v_vh.ball_vor_abwesenheit is not null
                    then v_vh.ball_vor_abwesenheit else v_vh.ball end;
    v_bis := coalesce(to_char(coalesce(v_abs.bis, v_abs.bis_geschaetzt), 'DD.MM.YYYY'), 'auf Weiteres');
    v_text := null;
    -- Befund 3 (Review 31a): Ist die Zeile schon bestätigt und hat jemand den Ball seitdem von Hand bewegt (Bindung
    -- gelöst), setzt eine erneute Bestätigung mit denselben Werten den Ball nicht zurück. Nur eine echte Änderung an
    -- Ampel oder Vertretung gilt als neuer, gewollter Wechsel.
    -- Runde 2, Befund 1: nur eine Änderung an Ampel oder Vertretung zählt, ein Statuswechsel (etwa auf erledigt) nicht.
    v_anwenden := v_alt.status = 'vorschlag' or v_vh.absence_id is not distinct from v_abs.id
               or coalesce(v_alt.ampel,'') || '|' || coalesce(v_alt_vertretung,'') <> coalesce(v_ampel,'') || '|' || coalesce(v_vertretung,'');
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

  -- Runde 3, Befund 4: ein Protokolleintrag nur, wenn sich Status, Ampel, Vertretung, Frist oder Regel geändert haben.
  if not (v_geaendert or v_row.frist is distinct from v_alt.frist or v_row.regel_note is distinct from v_alt.regel_note) then
    return jsonb_build_object('item', to_jsonb(v_row), 'vorgang', v_vorgang, 'protokoll', false);
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
$function$;

revoke all on function public.hh_vorhaben_wiedereroeffnen(uuid, text, jsonb) from public, anon, authenticated;
grant execute on function public.hh_vorhaben_wiedereroeffnen(uuid, text, jsonb) to service_role;
