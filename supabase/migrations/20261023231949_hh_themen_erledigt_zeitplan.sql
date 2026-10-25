-- Kompass · Board aufräumen (23.10.2026), läuft nach dem Ausrollen der Board-Seite.
-- Erledigte Themen, die seit 14 Tagen erledigt sind, ins Archiv (Grund erledigt-14), einmal sofort und dann täglich 04:55 UTC.
-- Rückweg: update public.gfweekly_topics set archived = false, archiv_grund = null where archiv_grund = 'erledigt-14';
-- Täglichen Lauf beenden: select cron.unschedule(jobid) from cron.job where jobname = 'hh_themen_erledigt_archivieren';
set lock_timeout = '10s';

select public.hh_themen_erledigt_archivieren(14);

select cron.unschedule(jobid) from cron.job where jobname = 'hh_themen_erledigt_archivieren';
select cron.schedule('hh_themen_erledigt_archivieren', '55 4 * * *', 'select public.hh_themen_erledigt_archivieren(14);');
