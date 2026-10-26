-- Kompass · Stufe 3, Korrekturen nach Codex-Runde 3 (26.10.2026, docs/reviews/STUFE3-runde-3.md; nicht erneut unabhängig geprüft):
-- 1. hh_lauf_protokoll.quelle_at: Zeitpunkt der Quelle (Mail, Feed), damit der Rückblick Sichtungen dem Quellentag zuordnet (Befund 5).
-- 2. Zeitplan stündlich 04:07 bis 21:07 UTC; hh_lauf_tick läuft nur zu geraden Berliner Stunden von 6 bis 22 Uhr (Befund 6).
-- Rückweg: alter table public.hh_lauf_protokoll drop column quelle_at; Zeitplan aus 20261026140000 erneut anlegen.
set lock_timeout = '10s';

alter table public.hh_lauf_protokoll add column if not exists quelle_at timestamptz;
comment on column public.hh_lauf_protokoll.quelle_at is 'Zeitpunkt der Quelle (Mail oder Feed); created_at ist der Zeitpunkt der Prüfung.';

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
  if v_stunde < 6 or v_stunde > 22 or v_stunde % 2 = 1 then return; end if;   -- 06, 08, …, 22 Uhr Berliner Zeit, unabhängig von Sommer- und Winterzeit
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

do $do$ begin
  if exists (select 1 from cron.job where jobname = 'hh_lauf_tick') then perform cron.unschedule('hh_lauf_tick'); end if;
end $do$;
select cron.schedule('hh_lauf_tick', '7 4-21 * * *', $$select public.hh_lauf_tick();$$);
