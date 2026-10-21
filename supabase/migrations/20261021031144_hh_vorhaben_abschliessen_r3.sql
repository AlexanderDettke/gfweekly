-- Das Hohe Haus · Vorhaben abschließen, Nacharbeit aus der Review Runde 3 (21.10.2026).
-- hh_vorhaben_wiedereroeffnen: ein Rückgängig-Wert verfällt, sobald das Vorhaben seit dem Abschluss wieder geöffnet wurde
-- oder sein Status anders gewechselt hat (auch wenn es danach über vorhaben_save wieder auf erledigt steht).
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
    -- Seit dem Abschluss darf es keinen Statuswechsel gegeben haben (Wieder öffnen, Pausieren, „Status: …“ über vorhaben_save).
    if exists (select 1 from public.hh_vorhaben_verlauf
               where vorhaben_id = p_id and created_at > v_zeit
                 and ((art = 'entscheidung' and text ~* '^Wieder geöffnet') or (art = 'system' and text ~ '^Status: '))) then
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


revoke all on function public.hh_vorhaben_wiedereroeffnen(uuid, text, jsonb) from public, anon, authenticated;
grant execute on function public.hh_vorhaben_wiedereroeffnen(uuid, text, jsonb) to service_role;
