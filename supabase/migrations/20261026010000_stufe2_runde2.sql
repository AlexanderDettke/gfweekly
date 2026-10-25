-- Kompass · Stufe 2, Korrekturen nach Codex-Runde 2 (26.10.2026, docs/reviews/STUFE2-runde-2.md):
-- 1. hh_absence_end_s2: bestätigte Korbzeilen zu Themen und Kandidaten bekommen ihren Verlaufseintrag am Vorhaben der Quelle; was kein
--    Vorhaben hat (Partner, Termin, Meilenstein, Thema ohne Vorhaben) und was nie bestätigt war, steht namentlich im Übergabeprotokoll
--    (gfweekly_handover_log), statt still zu entfallen (Befund 2).
-- 2. hh_lauf_rueckgaengig nur für einen bestätigten Eintrag, der zur aktuellen Erledigung des Punkts gehört (Befund 4).
-- 3. hh_vorschlag_verfall nur für Vorschläge automatischer Läufe, nicht für Einträge von Alex, Lea oder dem Kompass selbst (Befund 5).
-- 4. hh_vorhaben_verlauf.status_at (Zeitpunkt des letzten Statuswechsels, Trigger), damit die Bilanz Verfall und Verwerfen der richtigen
--    Woche zuordnet (Befund 6).
-- Rückweg: Fassungen aus 20261026000000 und 20261025230000 erneut anwenden; drop trigger hh_vorhaben_verlauf_status_at on public.hh_vorhaben_verlauf;
--   drop function public.hh_vorhaben_verlauf_status_at(); alter table public.hh_vorhaben_verlauf drop column status_at;
set lock_timeout = '10s';

alter table public.hh_vorhaben_verlauf add column if not exists status_at timestamptz;
comment on column public.hh_vorhaben_verlauf.status_at is 'Zeitpunkt des letzten Statuswechsels (Trigger). Leer, solange der Status nie geändert wurde.';
create or replace function public.hh_vorhaben_verlauf_status_at()
returns trigger
language plpgsql
as $t$
begin
  if new.status is distinct from old.status then new.status_at := now(); end if;
  return new;
end;
$t$;
drop trigger if exists hh_vorhaben_verlauf_status_at on public.hh_vorhaben_verlauf;
create trigger hh_vorhaben_verlauf_status_at before update of status on public.hh_vorhaben_verlauf
  for each row execute function public.hh_vorhaben_verlauf_status_at();

create or replace function public.hh_vorschlag_verfall(p_tage int default 14)
returns int
language plpgsql
security definer
set search_path = public
as $fn$
declare v_n int;
begin
  update public.hh_vorhaben_verlauf set status = 'verfallen'
   where status = 'vorschlag' and created_at < now() - make_interval(days => greatest(1, p_tage))
     and coalesce(created_by, '') not in ('Alex', 'Lea', 'kompass');
  get diagnostics v_n = row_count;
  return v_n;
end;
$fn$;

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
  -- Runde 2, Befund 4: nur der Eintrag, der die aktuelle Erledigung belegt (gleicher Lauf wie erledigt_at).
  if v_p.erledigt_at is null or v_e.created_at not between v_p.erledigt_at - interval '2 minutes' and v_p.erledigt_at + interval '2 minutes' then
    raise exception 'Der Eintrag gehört nicht zur aktuellen Erledigung des Punkts' using errcode = 'PT409'; end if;
  v_r := public.hh_punkt_toggle(v_p.id, false, v_by, 'rueckgaengig:lauf:' || p_verlauf_id);
  update public.hh_vorhaben_verlauf set status = 'verworfen'
   where punkt_id = v_p.id and created_by = 'lauf' and status = 'bestaetigt'
     and created_at between v_e.created_at - interval '2 minutes' and v_e.created_at + interval '2 minutes';
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
  v_protokoll int := 0;
  v_vh uuid;
  v_ohne text[] := '{}';
  v_vorschlaege text[] := '{}';
  z record;
begin
  v_r := public.hh_absence_end(p_id, p_by);
  v_person := v_r->'absence'->>'person';
  for z in select h.id, h.kind, h.ref_id, h.title, h.ampel, h.status from public.gfweekly_handover h
            where h.absence_id = p_id and h.status in ('vorschlag','bestaetigt') order by h.score desc nulls last, h.created_at for update loop
    if z.status = 'bestaetigt' then
      v_vh := null;
      if z.kind = 'vorhaben' then select v.id into v_vh from public.hh_vorhaben v where v.id::text = z.ref_id;
      elsif z.kind = 'thema' then select t.vorhaben_id into v_vh from public.gfweekly_topics t where t.id::text = z.ref_id;
      elsif z.kind = 'kandidat' then select n.vorhaben_id into v_vh from public.gfweekly_news n where n.id::text = z.ref_id;
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
        v_ohne := v_ohne || (coalesce(z.title, '?') || ' (' || z.kind || ', ' || coalesce(z.ampel, 'offen') || ')');
      end if;
    else
      v_vorschlaege := v_vorschlaege || (coalesce(z.title, '?') || ' (' || z.kind || ')');
      v_entfallen := v_entfallen + 1;
    end if;
    update public.gfweekly_handover set status = 'entfallen', updated_at = now() where id = z.id;
  end loop;
  if coalesce(array_length(v_ohne, 1), 0) > 0 then
    insert into public.gfweekly_handover_log (absence_id, art, who, text)
    values (p_id, 'notiz', p_by, left('Beim Ende bestätigt, aber ohne Vorhaben als Nachfolger (' || array_length(v_ohne, 1) || '): ' || array_to_string(v_ohne, '; '), 1800));
    v_protokoll := v_protokoll + 1;
  end if;
  if v_entfallen > 0 then
    insert into public.gfweekly_handover_log (absence_id, art, who, text)
    values (p_id, 'notiz', p_by, left('Beim Ende entfallen, nie bestätigt (' || v_entfallen || '): ' || array_to_string(v_vorschlaege, '; '), 1800));
    v_protokoll := v_protokoll + 1;
  end if;
  return v_r || jsonb_build_object('liegen_geblieben', v_liegen, 'ohne_vorhaben', coalesce(array_length(v_ohne, 1), 0), 'entfallen', v_entfallen, 'protokoll', v_protokoll);
end;
$fn$;
revoke all on function public.hh_absence_end_s2(uuid, text) from public, anon, authenticated;
grant execute on function public.hh_absence_end_s2(uuid, text) to service_role;
