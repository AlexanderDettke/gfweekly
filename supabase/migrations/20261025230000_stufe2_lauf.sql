-- Kompass · Stufe 2 (25.10.2026), Abschnitt 6: der Lauf erledigt Punkte selbst (hh_punkt_toggle mit p_by 'lauf') und schreibt
-- Vorschläge mit status 'vorschlag'. Zwei Stützen dazu:
-- 1. hh_lauf_rueckgaengig: ein Knopf in der Akte macht eine Lauf-Erledigung innerhalb von 7 Tagen rückgängig (Punkt wieder offen,
--    Lauf-Einträge zum Punkt aus demselben Lauf werden 'verworfen', die hinfällige Entscheidung kommt über hh_entscheidungen_sammeln zurück).
-- 2. hh_vorschlag_verfall: Vorschläge im Verlauf, die älter als p_tage sind und niemand beantwortet hat, werden 'verfallen'
--    (bisher nur eine Regel im Lauf-Auftrag, jetzt täglich um 04:52 UTC durch pg_cron, nach hh_news_verfall um 04:50 UTC).
-- Rückweg: select cron.unschedule('hh_vorschlag_verfall'); drop function public.hh_vorschlag_verfall(int); drop function public.hh_lauf_rueckgaengig(uuid,text);
set lock_timeout = '10s';

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
  if v_e.created_at < now() - interval '7 days' then raise exception 'älter als 7 Tage, bitte den Punkt von Hand wieder öffnen' using errcode = 'PT409'; end if;
  select * into v_p from public.hh_vorhaben_punkte where id = v_e.punkt_id for update;
  if not found then raise exception 'Punkt gibt es nicht mehr' using errcode = 'PT409'; end if;
  if not v_p.erledigt or v_p.erledigt_by is distinct from 'lauf' then raise exception 'Der Punkt ist nicht vom Lauf erledigt' using errcode = 'PT409'; end if;
  v_r := public.hh_punkt_toggle(v_p.id, false, v_by, 'rueckgaengig:lauf:' || p_verlauf_id);
  update public.hh_vorhaben_verlauf set status = 'verworfen'
   where punkt_id = v_p.id and created_by = 'lauf' and status = 'bestaetigt'
     and created_at between v_e.created_at - interval '2 minutes' and v_e.created_at + interval '2 minutes';
  get diagnostics v_n = row_count;
  perform public.hh_entscheidungen_sammeln();
  return jsonb_build_object('punkt', v_r->'punkt', 'verworfen', v_n, 'verlauf', v_r->'verlauf');
end;
$fn$;
revoke all on function public.hh_lauf_rueckgaengig(uuid, text) from public, anon, authenticated;
grant execute on function public.hh_lauf_rueckgaengig(uuid, text) to service_role;

create or replace function public.hh_vorschlag_verfall(p_tage int default 14)
returns int
language plpgsql
security definer
set search_path = public
as $fn$
declare v_n int;
begin
  update public.hh_vorhaben_verlauf set status = 'verfallen'
   where status = 'vorschlag' and created_at < now() - make_interval(days => greatest(1, p_tage));
  get diagnostics v_n = row_count;
  return v_n;
end;
$fn$;
revoke all on function public.hh_vorschlag_verfall(int) from public, anon, authenticated;
grant execute on function public.hh_vorschlag_verfall(int) to service_role;

do $do$ begin
  if exists (select 1 from cron.job where jobname = 'hh_vorschlag_verfall') then perform cron.unschedule('hh_vorschlag_verfall'); end if;
end $do$;
select cron.schedule('hh_vorschlag_verfall', '52 4 * * *', 'select public.hh_vorschlag_verfall(14);');
