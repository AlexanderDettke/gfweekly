-- Das Hohe Haus · V31d und V31e, Nacharbeit aus den Reviews 31d und 31e Runde 1 (03.10.2026).
-- hh_handover_set prüft p_patch.expect (Status, Ampel, Vertretung, wie gesehen), sonst 409.
-- hh_vorhaben_quelle setzt den Abgleichstand einer Quelle unter Zeilensperre (zwei Läufe gleichzeitig verlieren nichts).
set lock_timeout = '10s';

create or replace function public.hh_vorhaben_quelle(p_id uuid, p_quelle text, p_at timestamptz default now())
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare v_q jsonb;
begin
  select quellen into v_q from public.hh_vorhaben where id = p_id for update;
  if not found then raise exception 'Vorhaben % gibt es nicht', p_id using errcode = 'PT404'; end if;
  v_q := coalesce((select jsonb_agg(x) from jsonb_array_elements(coalesce(v_q, '[]'::jsonb)) x where x->>'quelle' is distinct from p_quelle), '[]'::jsonb)
         || jsonb_build_array(jsonb_build_object('quelle', p_quelle, 'at', to_char(p_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')));
  update public.hh_vorhaben set quellen = v_q where id = p_id;
  return v_q;
end;
$fn$;
revoke all on function public.hh_vorhaben_quelle(uuid, text, timestamptz) from public, anon, authenticated;
grant execute on function public.hh_vorhaben_quelle(uuid, text, timestamptz) to service_role;

-- Übergabe: wie in 20261003174603, mit expect.
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
$fn$;

revoke all on function public.hh_handover_set(uuid, text, jsonb) from public, anon, authenticated;
grant execute on function public.hh_handover_set(uuid, text, jsonb) to service_role;
