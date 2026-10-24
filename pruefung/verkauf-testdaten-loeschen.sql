-- Rückweg von Hand für die Verkauf-Probe (pruefung/verkauf-probe.mjs), falls ein Lauf ohne Antwort abbricht.
-- Die Probe selbst löscht nur ihre eigenen Zeilen nach Kennung. Dieser Rückweg trifft nur Handeingaben für
-- draussenbande, Saison 2027, mit der Notiz „Test“ vom heutigen Tag (Europe/Berlin); vorher mit select prüfen.
delete from public.hh_verkauf_stand
where festival_key = 'draussenbande' and saison = 2027 and quelle = 'hand' and notiz = 'Test'
  and stichtag = (now() at time zone 'Europe/Berlin')::date;
