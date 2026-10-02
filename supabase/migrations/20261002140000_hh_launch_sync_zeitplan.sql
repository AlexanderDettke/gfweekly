-- Das Hohe Haus · V29b (02.10.2026): Rückweg aus Asana stündlich, unabhängig von Seitenaufrufen.
-- Muster hh_absence_tick: SQL-Funktion ruft die Edge Function gfweekly mit dem Vault-Secret gfweekly_password,
-- pg_cron führt sie stündlich um Minute 23 aus. launch_sync läuft ohne gesendete Aufgaben leer durch.
create or replace function public.hh_launch_sync_tick()
 returns void
 language plpgsql
 security definer
 set search_path to 'public', 'net', 'vault'
as $function$
declare
  pw text;
begin
  select decrypted_secret into pw from vault.decrypted_secrets where name = 'gfweekly_password' limit 1;
  if pw is null then
    raise notice 'hh_launch_sync_tick: Vault-Secret gfweekly_password fehlt, nichts getan.';
    return;
  end if;
  perform net.http_post(
    url := 'https://bnfmupnmqyrcltrphfak.supabase.co/functions/v1/gfweekly',
    body := jsonb_build_object('action','launch_sync','password',pw,'payload', jsonb_build_object('by','Zeitplan')),
    params := '{}'::jsonb,
    headers := '{"Content-Type":"application/json"}'::jsonb,
    timeout_milliseconds := 120000
  );
end;
$function$;
revoke all on function public.hh_launch_sync_tick() from public, anon, authenticated;
select cron.unschedule(jobid) from cron.job where jobname = 'hh_launch_sync_stuendlich';
select cron.schedule('hh_launch_sync_stuendlich', '23 * * * *', 'select public.hh_launch_sync_tick();');
-- Review V29b: ein Asana-Kommentar steht höchstens einmal im Protokoll, auch wenn zwei Läufe sich überschneiden.
create unique index if not exists gfweekly_saison_log_launch_sync_kommentar
  on public.gfweekly_saison_log ((detail->>'asana_gid'))
  where what = 'launch_sync' and detail ? 'asana_gid';
