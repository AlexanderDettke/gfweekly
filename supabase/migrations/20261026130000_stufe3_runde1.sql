-- Kompass · Stufe 3, Korrekturen nach Codex-Runde 1 (26.10.2026, docs/reviews/STUFE3-runde-1.md):
-- 1. hh_lauf_protokoll.schluessel trägt den Modus: ein Probelauf sperrt dieselbe Quelle nicht mehr für vorschlag oder live (Befund 4).
-- 2. hh_lauf_erledigt: Punkt erledigen (hh_punkt_toggle mit 'lauf') und Beleg-Eintrag in einer Transaktion (Befund 7).
-- 3. Zeitplan nach Berliner Uhrzeit über zwei Jobs: Sommer (April bis Oktober) 06:07 bis 22:07 MESZ = 04:07 bis 20:07 UTC, Winter 05:07 bis 21:07 UTC (Befund 12).
-- Rückweg: alter table public.hh_lauf_protokoll drop column schluessel; …add column schluessel text generated always as (quelle_ref || ':' || coalesce(punkt_id::text,'-')) stored unique;
--   drop function public.hh_lauf_erledigt(uuid,text,text,text,timestamptz,text); cron.unschedule der beiden Jobs und cron.schedule('hh_lauf_tick','7 5-21/2 * * *',…).
set lock_timeout = '10s';

alter table public.hh_lauf_protokoll drop column if exists schluessel;
alter table public.hh_lauf_protokoll add column schluessel text generated always as (quelle_ref || ':' || coalesce(punkt_id::text, '-') || ':' || modus) stored;
create unique index if not exists hh_lauf_protokoll_schluessel on public.hh_lauf_protokoll (schluessel);
create index if not exists hh_lauf_protokoll_quelle on public.hh_lauf_protokoll (quelle_ref);

create or replace function public.hh_lauf_erledigt(p_punkt uuid, p_ref text, p_beleg text, p_url text, p_happened timestamptz, p_art text default 'mail')
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_p public.hh_vorhaben_punkte;
  v_t jsonb;
  v_b public.hh_vorhaben_verlauf;
begin
  select * into v_p from public.hh_vorhaben_punkte where id = p_punkt for update;
  if not found then raise exception 'Punkt gibt es nicht' using errcode = 'PT404'; end if;
  if v_p.erledigt then raise exception 'Der Punkt ist schon erledigt' using errcode = 'PT409'; end if;
  if exists (select 1 from public.hh_vorhaben_verlauf where punkt_id = p_punkt and source_ref like 'rueckgaengig:lauf:%') then
    raise exception 'Der Punkt wurde schon einmal vom Lauf erledigt und zurückgenommen' using errcode = 'PT409'; end if;
  v_t := public.hh_punkt_toggle(p_punkt, true, 'lauf', p_ref || ':erledigt:' || p_punkt);
  insert into public.hh_vorhaben_verlauf (vorhaben_id, punkt_id, art, wer, text, status, created_by, source_ref, source_url, happened_at)
  values (v_p.vorhaben_id, p_punkt, case when p_art in ('mail','plattform','notiz','whatsapp') then p_art else 'mail' end, 'Lauf', left(p_beleg, 2000), 'bestaetigt', 'lauf', p_ref || ':beleg:' || p_punkt, p_url, coalesce(p_happened, now()))
  returning * into v_b;
  return jsonb_build_object('punkt', v_t->'punkt', 'toggle_id', v_t->'verlauf'->>'id', 'beleg_id', v_b.id);
end;
$fn$;
revoke all on function public.hh_lauf_erledigt(uuid, text, text, text, timestamptz, text) from public, anon, authenticated;
grant execute on function public.hh_lauf_erledigt(uuid, text, text, text, timestamptz, text) to service_role;

create or replace function public.hh_lauf_cron_steht()
returns jsonb
language sql
security definer
set search_path = public, cron
as $fn$
  select coalesce(jsonb_agg(jsonb_build_object('jobname', jobname, 'schedule', schedule, 'active', active) order by jobname), '[]'::jsonb) from cron.job where jobname in ('hh_lauf_tick', 'hh_lauf_tick_sommer', 'hh_lauf_tick_winter', 'hh_vorschlag_verfall', 'hh_news_verfall');
$fn$;

do $do$ begin
  if exists (select 1 from cron.job where jobname = 'hh_lauf_tick') then perform cron.unschedule('hh_lauf_tick'); end if;
  if exists (select 1 from cron.job where jobname = 'hh_lauf_tick_sommer') then perform cron.unschedule('hh_lauf_tick_sommer'); end if;
  if exists (select 1 from cron.job where jobname = 'hh_lauf_tick_winter') then perform cron.unschedule('hh_lauf_tick_winter'); end if;
end $do$;
select cron.schedule('hh_lauf_tick_sommer', '7 4-20/2 * 4-10 *', $$select public.hh_lauf_tick();$$);
select cron.schedule('hh_lauf_tick_winter', '7 5-21/2 * 11,12,1,2,3 *', $$select public.hh_lauf_tick();$$);
