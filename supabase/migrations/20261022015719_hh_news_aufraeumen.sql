-- Das Hohe Haus · Neuigkeiten aufräumen, einmaliger Teil und Zeitplan (22.10.2026). Auftrag: docs/PAKET-NEUIGKEITEN-AUFRAEUMEN.md.
-- Läuft erst, wenn die Seite mit „Braucht dich“ und der Archivsuche ausgerollt ist.
-- 1. Alle offenen Kandidaten ins Archiv (Grund aufraeumen-20261022), außer „hoch“ der letzten 7 Tage.
--    Rückweg: update public.gfweekly_news set status = 'neu', archiv_grund = null, archiviert_at = null
--             where archiv_grund = 'aufraeumen-20261022';
-- 2. Einmal den Verfall laufen lassen (Ticker und Kandidaten älter als 14 Tage, Grund verfall-14).
-- 3. Täglicher Verfall um 04:50 UTC.
set lock_timeout = '10s';

update public.gfweekly_news set status = 'archiviert', archiv_grund = 'aufraeumen-20261022', archiviert_at = now()
where kind = 'kandidat' and status = 'neu'
  and not (relevance = 'hoch' and created_at >= now() - interval '7 days');

select public.hh_news_verfall(14);

select cron.unschedule(jobid) from cron.job where jobname = 'hh_news_verfall';
select cron.schedule('hh_news_verfall', '50 4 * * *', 'select public.hh_news_verfall(14);');
