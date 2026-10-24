-- Entfernt die Teststände der Verkauf-Probe (pruefung/verkauf-probe.mjs, Abnahme in docs/PAKET-VERKAUF-2027.md):
-- nur Handeingaben für draussenbande, Saison 2027, mit der Notiz „Test“.
delete from public.hh_verkauf_stand
where festival_key = 'draussenbande' and saison = 2027 and quelle = 'hand' and notiz = 'Test';
