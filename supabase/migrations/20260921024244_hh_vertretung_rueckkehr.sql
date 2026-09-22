-- Das Hohe Haus V24a, Nachtrag vom 21.09.2026 (aus der unabhängigen Review).
-- Der Zeitpunkt der Rückkehr gehört in ein eigenes Feld: aus updated_at gerechnet konnten die drei Tage
-- bis „beendet“ entfallen, weil updated_at auch von anderen Änderungen stammt.
-- Angewendet am 21.09.2026 als Migration hh_vertretung_rueckkehr_at.
-- Aus updated_at gerechnet konnten die drei Tage bis „beendet“ entfallen, weil updated_at älter sein kann.
alter table public.gfweekly_absences
  add column if not exists rueckkehr_at timestamptz;
comment on column public.gfweekly_absences.rueckkehr_at is
  'Das Hohe Haus V24a: Zeitpunkt des Wechsels auf status rueckkehr. Drei Tage später endet die Abwesenheit von selbst.';
