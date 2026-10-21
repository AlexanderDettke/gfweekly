-- Testdaten für pruefung/abschliessen-probe.mjs und pruefung/abschliessen-live.mjs (Fall test).
-- Ausführen: npx --yes supabase db query --linked --project-ref bnfmupnmqyrcltrphfak -f pruefung/abschliessen-testdaten-anlegen.sql < /dev/null
-- Legt an: Testvorhaben test-abschluss (Ball Alex, Frist gestern) mit zwei offenen und einem erledigten Punkt, zwei
-- verknüpfte Testthemen, einen vorgeschlagenen Testeinwurf (source_ref probe:abschluss:1) und eine beendete Testabwesenheit (test, Notiz „Abschluss-Probe“) mit einer Korbzeile zum Vorhaben.
-- Reste eines früheren Laufs räumt zuerst pruefung/abschliessen-testdaten-loeschen.sql ab (gleiche Schritte hier vorab).
begin;
delete from public.gfweekly_handover where absence_id in (select id from public.gfweekly_absences where test and note = 'Abschluss-Probe');
delete from public.gfweekly_absences where test and note = 'Abschluss-Probe';
delete from public.hh_einwurf where source_ref = 'probe:abschluss:1';
delete from public.gfweekly_topics where vorhaben_id in (select id from public.hh_vorhaben where slug = 'test-abschluss');
delete from public.hh_vorhaben where slug = 'test-abschluss';
with v as (
  insert into public.hh_vorhaben (slug, title, gruppe, ball, status, frist, stand, naechster_schritt, updated_by)
  values ('test-abschluss', 'Testvorhaben Abschluss', 'sonstiges', 'alex', 'aktiv', current_date - 1, 'Probe', 'Probe abschließen', 'probe')
  returning id
), p as (
  insert into public.hh_vorhaben_punkte (vorhaben_id, titel, erledigt, erledigt_at, erledigt_by, sort)
  select id, x.titel, x.erledigt, case when x.erledigt then now() - interval '1 day' end, case when x.erledigt then 'Lea' end, x.sort
  from v, (values ('Probe Punkt 1', false, 1), ('Probe Punkt 2', false, 2), ('Probe Punkt schon erledigt', true, 3)) as x(titel, erledigt, sort)
), a as (
  insert into public.gfweekly_absences (person, von, bis, art, kontakt, status, test, note)
  values ('Alex', current_date - 3, current_date - 2, 'geplant', 'keiner', 'beendet', true, 'Abschluss-Probe')
  returning id
), e as (
  insert into public.hh_einwurf (von, kanal, text, vorhaben_id, status, source_ref, vorschlag)
  select 'Alex', 'knopf', 'Abschluss-Probe: Einwurf', v.id, 'vorgeschlagen', 'probe:abschluss:1', '{"vorhaben_id":null,"sicherheit":1}'::jsonb from v
), h as (
  insert into public.gfweekly_handover (absence_id, kind, ref_id, title, status)
  select a.id, 'vorhaben', v.id::text, 'Testvorhaben Abschluss', 'vorschlag' from a, v
)
insert into public.gfweekly_topics (title, vorhaben_id, created_by)
select 'Test Abschluss Thema ' || n, v.id, 'probe' from v, generate_series(1, 2) n;
commit;
