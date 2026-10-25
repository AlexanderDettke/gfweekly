-- Kompass · Stufe 2, Korrekturen nach Codex-Runde 3 (26.10.2026, docs/reviews/STUFE2-runde-3.md; nicht erneut unabhängig geprüft):
-- 1. hh_handover_erledigt: „Erledigt“ an einer Korbzeile schließt bei einem Vorhaben das Vorhaben (Punkte mit) und die Zeile in einer
--    Transaktion (Befund 1).
-- 2. hh_absence_end_s2: Nachfolger eines Themas auch über den Punkt mit quelle 'thema:<id>' (Auflösung); Zeilen ohne Nachfolger und nie
--    bestätigte Vorschläge je Zeile einzeln und ungekürzt im Übergabeprotokoll (Befund 3).
-- 3. hh_lauf_rueckgaengig: nur der Eintrag, der nicht vor der aktuellen Erledigung entstand (gleiche Transaktion wie erledigt_at); verworfen
--    werden nur Einträge ab diesem Zeitpunkt (Befund 4).
-- 4. Der alte Zeitplan hh_themen_erledigt_archivieren ist beendet; es gibt keine offenen Themen mehr (Befund 10, Paket Abschnitt 10).
-- Rückweg: Fassungen aus 20261026010000 erneut anwenden; drop function public.hh_handover_erledigt(uuid,text);
--   select cron.schedule('hh_themen_erledigt_archivieren', '55 4 * * *', 'select public.hh_themen_erledigt_archivieren(14);');
set lock_timeout = '10s';

do $do$ begin
  if exists (select 1 from cron.job where jobname = 'hh_themen_erledigt_archivieren') then perform cron.unschedule('hh_themen_erledigt_archivieren'); end if;
end $do$;

create or replace function public.hh_handover_erledigt(p_id uuid, p_by text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_row public.gfweekly_handover;
  v_vh public.hh_vorhaben;
  v_ab jsonb := null;
  v_h jsonb;
begin
  select * into v_row from public.gfweekly_handover where id = p_id for update;
  if not found then raise exception 'Korbzeile gibt es nicht' using errcode = 'PT404'; end if;
  if v_row.status in ('erledigt', 'entfallen') then raise exception 'Die Zeile ist schon geschlossen, bitte neu laden' using errcode = 'PT409'; end if;
  if v_row.kind = 'vorhaben' then
    select * into v_vh from public.hh_vorhaben where id = v_row.ref_id::uuid for update;
    if not found then raise exception 'Vorhaben zur Korbzeile gibt es nicht' using errcode = 'PT409'; end if;
    if v_vh.status in ('aktiv', 'pausiert') then
      v_ab := public.hh_vorhaben_abschliessen(v_vh.id, p_by, null, true, false, null);
    end if;
  end if;
  v_h := public.hh_handover_set(p_id, p_by, '{"status":"erledigt"}'::jsonb);
  return jsonb_build_object('item', v_h->'item', 'vorgang', v_h->'vorgang', 'vorhaben', v_ab->'vorhaben', 'punkte', coalesce((v_ab->>'punkte')::int, 0));
end;
$fn$;
revoke all on function public.hh_handover_erledigt(uuid, text) from public, anon, authenticated;
grant execute on function public.hh_handover_erledigt(uuid, text) to service_role;

create or replace function public.hh_lauf_rueckgaengig(p_verlauf_id uuid, p_by text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_by text := public.hh_en_person(p_by);
  v_e public.hh_vorhaben_verlauf;
  v_p public.hh_vorhaben_punkte;
  v_r jsonb;
  v_n int;
begin
  select * into v_e from public.hh_vorhaben_verlauf where id = p_verlauf_id for update;
  if not found then raise exception 'Eintrag gibt es nicht' using errcode = 'PT404'; end if;
  if v_e.created_by is distinct from 'lauf' or v_e.punkt_id is null then raise exception 'kein Lauf-Eintrag zu einem Punkt' using errcode = 'PT400'; end if;
  if v_e.status <> 'bestaetigt' then raise exception 'Der Eintrag ist schon zurückgenommen oder verworfen' using errcode = 'PT409'; end if;
  if v_e.created_at < now() - interval '7 days' then raise exception 'älter als 7 Tage, bitte den Punkt von Hand wieder öffnen' using errcode = 'PT409'; end if;
  select * into v_p from public.hh_vorhaben_punkte where id = v_e.punkt_id for update;
  if not found then raise exception 'Punkt gibt es nicht mehr' using errcode = 'PT409'; end if;
  if not v_p.erledigt or v_p.erledigt_by is distinct from 'lauf' then raise exception 'Der Punkt ist nicht vom Lauf erledigt' using errcode = 'PT409'; end if;
  -- Runde 3, Befund 4: der Eintrag der Erledigung entsteht in derselben Transaktion wie erledigt_at (hh_punkt_toggle); ein älterer Eintrag
  -- gehört zu einer früheren Erledigung und darf die aktuelle nicht zurücknehmen.
  if v_p.erledigt_at is null or v_e.created_at < v_p.erledigt_at - interval '1 second' or v_e.created_at > v_p.erledigt_at + interval '2 minutes' then
    raise exception 'Der Eintrag gehört nicht zur aktuellen Erledigung des Punkts' using errcode = 'PT409'; end if;
  v_r := public.hh_punkt_toggle(v_p.id, false, v_by, 'rueckgaengig:lauf:' || p_verlauf_id);
  update public.hh_vorhaben_verlauf set status = 'verworfen'
   where punkt_id = v_p.id and created_by = 'lauf' and status = 'bestaetigt'
     and created_at between v_p.erledigt_at - interval '1 second' and v_p.erledigt_at + interval '2 minutes';
  get diagnostics v_n = row_count;
  perform public.hh_entscheidungen_sammeln();
  return jsonb_build_object('punkt', v_r->'punkt', 'verworfen', v_n, 'verlauf', v_r->'verlauf');
end;
$fn$;

create or replace function public.hh_absence_end_s2(p_id uuid, p_by text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_r jsonb;
  v_person text;
  v_liegen int := 0;
  v_entfallen int := 0;
  v_ohne int := 0;
  v_vh uuid;
  z record;
begin
  v_r := public.hh_absence_end(p_id, p_by);
  v_person := v_r->'absence'->>'person';
  for z in select h.id, h.kind, h.ref_id, h.title, h.ampel, h.status from public.gfweekly_handover h
            where h.absence_id = p_id and h.status in ('vorschlag','bestaetigt') order by h.score desc nulls last, h.created_at for update loop
    if z.status = 'bestaetigt' then
      v_vh := null;
      if z.kind = 'vorhaben' then select v.id into v_vh from public.hh_vorhaben v where v.id::text = z.ref_id;
      elsif z.kind = 'thema' then
        select t.vorhaben_id into v_vh from public.gfweekly_topics t where t.id::text = z.ref_id;
        -- Runde 3, Befund 3: der Nachfolger aus der Auflösung (Punkt mit quelle 'thema:<id>'), wenn das Thema selbst kein Vorhaben kannte.
        if v_vh is null then select p.vorhaben_id into v_vh from public.hh_vorhaben_punkte p where p.quelle = 'thema:' || z.ref_id order by p.created_at limit 1; end if;
      elsif z.kind = 'kandidat' then
        select n.vorhaben_id into v_vh from public.gfweekly_news n where n.id::text = z.ref_id;
        if v_vh is null then select p.vorhaben_id into v_vh from public.hh_vorhaben_punkte p where p.quelle = 'kandidat:' || z.ref_id order by p.created_at limit 1; end if;
      end if;
      if v_vh is not null and exists (select 1 from public.hh_vorhaben v where v.id = v_vh) then
        insert into public.hh_vorhaben_verlauf (vorhaben_id, art, wer, status, created_by, text, source_ref)
        values (v_vh, 'system', p_by, 'bestaetigt', 'kompass',
                left('In der Abwesenheit von ' || coalesce(v_person, '?') || ' liegen geblieben (Korb ' || coalesce(z.ampel, 'offen')
                     || case when z.kind = 'vorhaben' then '' else ', ' || z.kind end || '): ' || coalesce(z.title, ''), 500),
                'abwesenheit:' || p_id || ':liegen:' || z.id)
        on conflict (source_ref) do nothing;
        v_liegen := v_liegen + 1;
      else
        insert into public.gfweekly_handover_log (absence_id, art, who, text)
        values (p_id, 'notiz', p_by, 'Beim Ende bestätigt, aber ohne Vorhaben als Nachfolger (' || z.kind || ', ' || coalesce(z.ampel, 'offen') || '): ' || coalesce(z.title, '?'));
        v_ohne := v_ohne + 1;
      end if;
    else
      insert into public.gfweekly_handover_log (absence_id, art, who, text)
      values (p_id, 'notiz', p_by, 'Beim Ende entfallen, nie bestätigt (' || z.kind || '): ' || coalesce(z.title, '?'));
      v_entfallen := v_entfallen + 1;
    end if;
    update public.gfweekly_handover set status = 'entfallen', updated_at = now() where id = z.id;
  end loop;
  return v_r || jsonb_build_object('liegen_geblieben', v_liegen, 'ohne_vorhaben', v_ohne, 'entfallen', v_entfallen, 'protokoll', v_ohne + v_entfallen);
end;
$fn$;
