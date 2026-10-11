-- V34 · Testdaten der Bedienprüfung entfernen (pruefung/v34-bedienpruefung-live.mjs).
-- Vor der Prüfung hatte Lea in Runde 1 keine Antworten, keine Steckbriefe und keine Abgabe; das Skript bricht sonst ab.
-- Gelöscht wird nur, was seit Beginn der Prüfung entstanden ist (Zeitpunkt „seit“, gibt das Skript zu Beginn aus).
-- Hat Lea Antworten oder Steckbriefe von davor, bricht das SQL ab und löscht nichts. Steckbriefe nur mit dem Testmerkmal.
-- Alex wird nicht berührt. Nur ausführen, wenn Lea während der Prüfung nicht selbst gearbeitet hat. Aufruf:
--   npx --yes supabase db query --linked --project-ref bnfmupnmqyrcltrphfak -f pruefung/v34-testdaten-entfernen.sql < /dev/null
begin;
select set_config('v34.seit', '2026-10-11 02:40:21+00', true);   -- seit: Beginn der Prüfung
do $$
declare seit timestamptz := current_setting('v34.seit')::timestamptz;
begin
  if exists (select 1 from gfweekly_sa_antworten where runde = 1 and person = 'Lea' and updated_at < seit)
     or exists (select 1 from gfweekly_sa_ist where person = 'Lea' and created_at < seit)
     or exists (select 1 from gfweekly_sa_runden where nr = 1 and abgegeben_lea < seit) then
    raise exception 'Lea hat Daten von vor der Prüfung. Nichts gelöscht.';
  end if;
end $$;
delete from gfweekly_sa_antworten where runde = 1 and person = 'Lea' and updated_at >= current_setting('v34.seit')::timestamptz;
delete from gfweekly_sa_ist where person = 'Lea' and created_at >= current_setting('v34.seit')::timestamptz and startet_wenn = 'Test V34';
update gfweekly_sa_runden set abgegeben_lea = null where nr = 1 and abgegeben_lea >= current_setting('v34.seit')::timestamptz;
delete from gfweekly_sa_log where who = 'Lea' and at >= current_setting('v34.seit')::timestamptz;
commit;
select
  (select count(*) from gfweekly_sa_antworten where runde = 1 and person = 'Lea') as lea_antworten,
  (select count(*) from gfweekly_sa_ist where person = 'Lea') as lea_steckbriefe,
  (select abgegeben_lea is null from gfweekly_sa_runden where nr = 1) as lea_nicht_abgegeben,
  (select count(*) from gfweekly_sa_antworten where runde = 1 and person = 'Alex') as alex_antworten,
  (select count(*) from gfweekly_sa_ist where person = 'Alex') as alex_steckbriefe;
