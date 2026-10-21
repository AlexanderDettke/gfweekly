-- Räumt die Testdaten aus pruefung/abschliessen-testdaten-anlegen.sql ab, nur über ihre festen Kennzeichen
-- (Testvorhaben test-abschluss und seine Themen, Testabwesenheit mit Notiz „Abschluss-Probe“ samt Korb).
-- Ausführen: npx --yes supabase db query --linked --project-ref bnfmupnmqyrcltrphfak -f pruefung/abschliessen-testdaten-loeschen.sql < /dev/null
begin;
delete from public.gfweekly_handover where absence_id in (select id from public.gfweekly_absences where test and note = 'Abschluss-Probe');
delete from public.gfweekly_absences where test and note = 'Abschluss-Probe';
delete from public.gfweekly_topics where vorhaben_id in (select id from public.hh_vorhaben where slug = 'test-abschluss');
delete from public.hh_vorhaben where slug = 'test-abschluss';  -- Punkte und Verlauf fallen per on delete cascade
commit;
