-- V34 · Testdaten der Bedienprüfung entfernen (pruefung/v34-bedienpruefung-live.mjs).
-- Vor der Prüfung hatte Lea in Runde 1 keine Antworten, keine Steckbriefe und keine Abgabe; das Skript bricht sonst ab.
-- Entfernt deshalb alles von Lea in Runde 1, ihre Steckbriefe und ihre Protokollzeilen seit Beginn der Prüfung.
-- Alex wird nicht berührt. Aufruf:
--   npx --yes supabase db query --linked --project-ref bnfmupnmqyrcltrphfak -f pruefung/v34-testdaten-entfernen.sql < /dev/null
-- Den Zeitpunkt in der Zeile mit „seit“ vor dem Aufruf auf den Beginn der Prüfung setzen.
begin;
delete from gfweekly_sa_antworten where runde = 1 and person = 'Lea';
delete from gfweekly_sa_ist where person = 'Lea';
update gfweekly_sa_runden set abgegeben_lea = null where nr = 1;
delete from gfweekly_sa_log where who = 'Lea' and at >= timestamptz '2026-10-11 00:00:00+00';   -- seit
commit;
select
  (select count(*) from gfweekly_sa_antworten where runde = 1 and person = 'Lea') as lea_antworten,
  (select count(*) from gfweekly_sa_ist where person = 'Lea') as lea_steckbriefe,
  (select abgegeben_lea is null from gfweekly_sa_runden where nr = 1) as lea_nicht_abgegeben,
  (select count(*) from gfweekly_sa_antworten where runde = 1 and person = 'Alex') as alex_antworten,
  (select count(*) from gfweekly_sa_ist where person = 'Alex') as alex_steckbriefe;
