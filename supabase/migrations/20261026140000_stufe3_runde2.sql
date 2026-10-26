-- Kompass · Stufe 3, Korrekturen nach Codex-Runde 2 (26.10.2026, docs/reviews/STUFE3-runde-2.md):
-- 1. hh_lauf_cursor.rest_bis: bleibt ein Fenster unvollständig (voller Stapel), merkt sich der Lauf die obere Grenze des Rests und liest beim
--    nächsten Tick zuerst die älteren Threads darunter (Befund 1).
-- 2. Ein Zeitplan alle zwei Stunden von 04:07 bis 21:07 UTC; hh_lauf_tick prüft selbst die Berliner Stunde (06 bis 22 Uhr), damit der
--    Wechsel der Sommerzeit auf den Tag genau stimmt (Befund 10). Ersetzt die Jobs hh_lauf_tick_sommer und hh_lauf_tick_winter.
-- Rückweg: alter table public.hh_lauf_cursor drop column rest_bis; Jobs aus 20261026130000 erneut anlegen.
set lock_timeout = '10s';

alter table public.hh_lauf_cursor add column if not exists rest_bis timestamptz;
comment on column public.hh_lauf_cursor.rest_bis is 'Obere Grenze des noch ungelesenen Rests eines Fensters (voller Stapel); leer, wenn das Fenster vollständig gelesen war.';

create or replace function public.hh_lauf_tick()
returns void
language plpgsql
security definer
set search_path = public, net, vault
as $fn$
declare pw text; v_modus text; v_stunde int;
begin
  select modus into v_modus from public.hh_lauf_einstellungen where id = 1;
  if coalesce(v_modus, 'aus') = 'aus' then return; end if;
  v_stunde := extract(hour from (now() at time zone 'Europe/Berlin'))::int;
  if v_stunde < 6 or v_stunde > 22 then return; end if;   -- Berliner Uhrzeit, unabhängig von Sommer- und Winterzeit
  select decrypted_secret into pw from vault.decrypted_secrets where name = 'gfweekly_password' limit 1;
  if pw is null then raise notice 'hh_lauf_tick: Vault-Secret gfweekly_password fehlt, nichts getan.'; return; end if;
  perform net.http_post(
    url := 'https://bnfmupnmqyrcltrphfak.supabase.co/functions/v1/gfweekly',
    body := jsonb_build_object('action', 'lauf_tick', 'password', pw, 'payload', jsonb_build_object('quelle', 'cron')),
    params := '{}'::jsonb,
    headers := '{"Content-Type":"application/json"}'::jsonb,
    timeout_milliseconds := 120000
  );
end;
$fn$;
revoke all on function public.hh_lauf_tick() from public, anon, authenticated;

create or replace function public.hh_lauf_cron_steht()
returns jsonb
language sql
security definer
set search_path = public, cron
as $fn$
  select coalesce(jsonb_agg(jsonb_build_object('jobname', jobname, 'schedule', schedule, 'active', active) order by jobname), '[]'::jsonb) from cron.job where jobname in ('hh_lauf_tick', 'hh_vorschlag_verfall', 'hh_news_verfall');
$fn$;

do $do$ begin
  if exists (select 1 from cron.job where jobname = 'hh_lauf_tick_sommer') then perform cron.unschedule('hh_lauf_tick_sommer'); end if;
  if exists (select 1 from cron.job where jobname = 'hh_lauf_tick_winter') then perform cron.unschedule('hh_lauf_tick_winter'); end if;
  if exists (select 1 from cron.job where jobname = 'hh_lauf_tick') then perform cron.unschedule('hh_lauf_tick'); end if;
end $do$;
select cron.schedule('hh_lauf_tick', '7 4-21/2 * * *', $$select public.hh_lauf_tick();$$);
