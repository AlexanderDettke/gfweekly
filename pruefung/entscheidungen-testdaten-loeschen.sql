-- Rückweg von Hand für die Entscheidungen-Probe (pruefung/entscheidungen-probe.mjs), falls ein Lauf ohne Antwort abbricht.
-- Die Probe selbst löscht nur ihre eigenen Zeilen nach Kennung. Dieser Rückweg trifft nur Testzeilen mit „Stufe 1 Probe (Test)“ im
-- Titel; vorher mit select prüfen.
delete from public.hh_entscheidungen where quelle_id in (
  select id from public.hh_vorhaben_punkte where titel like 'Stufe 1 Probe (Test)%'
  union all select id from public.gfweekly_topics where title like 'Stufe 1 Probe (Test)%'
  union all select id from public.gfweekly_news where title like 'Stufe 1 Probe (Test)%');
delete from public.gfweekly_decisions where topic_id in (select id from public.gfweekly_topics where title like 'Stufe 1 Probe (Test)%');
delete from public.hh_vorhaben_verlauf where vorhaben_id in (select id from public.hh_vorhaben where title like 'Stufe 1 Probe (Test)%');
delete from public.hh_vorhaben_punkte where vorhaben_id in (select id from public.hh_vorhaben where title like 'Stufe 1 Probe (Test)%');
delete from public.hh_vorhaben where title like 'Stufe 1 Probe (Test)%';
delete from public.gfweekly_topics where title like 'Stufe 1 Probe (Test)%';
delete from public.gfweekly_news where title like 'Stufe 1 Probe (Test)%';
