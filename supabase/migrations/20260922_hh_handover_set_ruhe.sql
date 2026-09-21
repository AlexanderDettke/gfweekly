-- Das Hohe Haus V24d, zweiter Nachtrag vom 22.09.2026 (aus der Prüfung von 81a0941).
-- Befund 3: Wurde eine Zeile erst auf „ruht“ bestätigt und danach auf eine andere Ampel, blieb am Thema stehen,
-- was die Ruhe gesetzt hatte: Ausgang „warten“, die Rückkehrfrist und die Notiz „ruht bis zur Rückkehr“.
-- Die Übergabe war atomar, aber der gespeicherte Zustand widersprach sich. Eine aufgehobene Ruhe räumt jetzt auf.
--
-- Zum Kommentar in 20260922_hh_handover_set.sql: die dort erwähnte Ausnahme für ein drittes Asana-Konto gilt
-- nicht mehr. Zugewiesen wird über die E-Mail; in der Vertretungslinie stehen nur Alex und Lea.

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
  v_ampel text; v_vertretung text; v_status text; v_alt_vertretung text;
  v_ende date; v_gate text; v_wort text;
  v_ruhte boolean;
  v_vorgang jsonb := null;
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
