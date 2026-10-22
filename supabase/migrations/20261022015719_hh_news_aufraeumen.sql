-- Das Hohe Haus · Neuigkeiten aufräumen, einmaliger Teil und Zeitplan (22.10.2026). Auftrag: docs/PAKET-NEUIGKEITEN-AUFRAEUMEN.md.
-- Läuft erst, wenn die Seite mit „Braucht dich“ und der Archivsuche ausgerollt ist.
-- 1. Offene Kandidaten, die vor mehr als 7 Tagen eingetragen wurden, ins Archiv (Grund aufraeumen-20261022). Was in den
--    letzten 7 Tagen kam (auch „mittel“ zu einem Vorhaben mit Ball bei dir), bleibt und verfällt regulär nach 14 Tagen;
--    Einträge mit einer Pförtner-Frist ab heute bleiben ebenfalls.
-- 2. Erster Verfall mit eigenem Grund aufraeumen-20261022-verfall (Ticker und Kandidaten älter als 14 Tage).
-- 3. Täglicher Verfall um 04:50 UTC (Grund verfall-14).
-- Rückweg für beide Schritte:
--   update public.gfweekly_news set status = 'neu', archiv_grund = null, archiviert_at = null
--   where archiv_grund in ('aufraeumen-20261022', 'aufraeumen-20261022-verfall');
-- (Vorher waren alle betroffenen Zeilen im Status neu; gesehen kommt in den Daten vom 22.10.2026 nicht vor.)
set lock_timeout = '10s';

update public.gfweekly_news set status = 'archiviert', archiv_grund = 'aufraeumen-20261022', archiviert_at = now()
where kind = 'kandidat' and status = 'neu'
  and created_at < now() - interval '7 days'
  and (gate_frist is null or gate_frist < (now() at time zone 'Europe/Berlin')::date);

select public.hh_news_verfall(14, 'aufraeumen-20261022-verfall');

select cron.unschedule(jobid) from cron.job where jobname = 'hh_news_verfall';
select cron.schedule('hh_news_verfall', '50 4 * * *', 'select public.hh_news_verfall(14);');
