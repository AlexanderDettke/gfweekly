-- Das Hohe Haus · Vorhaben abschließen und wieder öffnen (21.10.2026). Auftrag: docs/PAKET-VORHABEN-ABSCHLIESSEN.md.
-- hh_vorhaben_abschliessen: Status erledigt, Verlaufseintrag, auf Wunsch offene Punkte abhaken und verknüpfte Themen
-- archivieren, alles in einer Transaktion. Die Rückgabe nennt die Kennungen genau der geänderten Punkte und Themen.
-- hh_vorhaben_wiedereroeffnen: Status aktiv, Verlaufseintrag; mit p_rueckgaengig werden genau diese Punkte und Themen
-- zurückgesetzt (Rückgängig nach dem Abschließen).
set lock_timeout = '10s';

create or replace function public.hh_vorhaben_abschliessen(p_id uuid, p_by text, p_ergebnis text, p_punkte_mit boolean,
  p_themen_mit boolean, p_expect timestamptz default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_alt public.hh_vorhaben;
  v_neu public.hh_vorhaben;
  v_ergebnis text := nullif(btrim(coalesce(p_ergebnis, '')), '');
  v_punkte uuid[] := '{}';
  v_themen uuid[] := '{}';
  v_text text;
begin
  select * into v_alt from public.hh_vorhaben where id = p_id for update;
  if not found then raise exception 'Vorhaben % gibt es nicht', p_id using errcode = 'PT404'; end if;
  -- PT409: PostgREST antwortet mit 409. Doppeltes Tippen oder ein gleichzeitiger Abschluss wird nicht zweimal verbucht.
  if v_alt.status = 'erledigt' then
    raise exception 'Das Vorhaben ist schon erledigt, bitte neu laden' using errcode = 'PT409';
  end if;
  if v_alt.status not in ('aktiv', 'pausiert') then
    raise exception 'Das Vorhaben ist %, bitte neu laden', v_alt.status using errcode = 'PT409';
  end if;
  if p_expect is not null and date_trunc('milliseconds', v_alt.updated_at) is distinct from date_trunc('milliseconds', p_expect) then
    raise exception 'Das Vorhaben wurde inzwischen geändert, bitte neu laden' using errcode = 'PT409';
  end if;

  if coalesce(p_punkte_mit, false) then
    with g as (
      update public.hh_vorhaben_punkte set erledigt = true, erledigt_at = now(), erledigt_by = p_by
      where vorhaben_id = p_id and not erledigt
      returning id
    ) select coalesce(array_agg(id), '{}') into v_punkte from g;
  end if;
  if coalesce(p_themen_mit, false) then
    with g as (
      update public.gfweekly_topics set archived = true, updated_at = now()
      where vorhaben_id = p_id and archived = false
      returning id
    ) select coalesce(array_agg(id), '{}') into v_themen from g;
  end if;

  -- Direkt statt über hh_vorhaben_save: sonst entstünde neben dem Entscheidungseintrag ein zweiter „Status: erledigt“.
  update public.hh_vorhaben set status = 'erledigt', updated_by = p_by where id = p_id returning * into v_neu;

  v_text := 'Erledigt: ' || coalesce(v_ergebnis, 'ohne Ergebnissatz');
  if cardinality(v_punkte) > 0 or cardinality(v_themen) > 0 then
    v_text := v_text || ' (' || concat_ws(', ',
      case when cardinality(v_punkte) = 1 then '1 Punkt abgehakt' when cardinality(v_punkte) > 1 then cardinality(v_punkte) || ' Punkte abgehakt' end,
      case when cardinality(v_themen) = 1 then '1 Thema archiviert' when cardinality(v_themen) > 1 then cardinality(v_themen) || ' Themen archiviert' end) || ')';
  end if;
  insert into public.hh_vorhaben_verlauf (vorhaben_id, art, wer, text, status, created_by)
  values (p_id, 'entscheidung', p_by, v_text, 'bestaetigt', 'hohes-haus');

  return jsonb_build_object('vorhaben', to_jsonb(v_neu), 'ergebnis', v_ergebnis,
    'punkte', cardinality(v_punkte), 'themen', cardinality(v_themen),
    'rueckgaengig', jsonb_build_object('punkte', to_jsonb(v_punkte), 'themen', to_jsonb(v_themen)));
end;
$fn$;

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
  end if;

  -- Nur die beim Abschluss geänderten Zeilen dieses Vorhabens; was seitdem jemand anders verändert hat, bleibt.
  if cardinality(v_punkte) > 0 then
    update public.hh_vorhaben_punkte set erledigt = false, erledigt_at = null, erledigt_by = null
    where vorhaben_id = p_id and id = any(v_punkte) and erledigt;
    get diagnostics v_n_punkte = row_count;
  end if;
  if cardinality(v_themen) > 0 then
    update public.gfweekly_topics set archived = false, updated_at = now()
    where vorhaben_id = p_id and id = any(v_themen) and archived;
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

revoke all on function public.hh_vorhaben_abschliessen(uuid, text, text, boolean, boolean, timestamptz) from public, anon, authenticated;
grant execute on function public.hh_vorhaben_abschliessen(uuid, text, text, boolean, boolean, timestamptz) to service_role;
revoke all on function public.hh_vorhaben_wiedereroeffnen(uuid, text, jsonb) from public, anon, authenticated;
grant execute on function public.hh_vorhaben_wiedereroeffnen(uuid, text, jsonb) to service_role;
