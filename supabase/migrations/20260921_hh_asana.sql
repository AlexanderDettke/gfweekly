-- Das Hohe Haus V24c (21.09.2026) · Asana: Felder für den Export der Vertretung.
-- Der Export selbst läuft in der Edge Function (Aktion asana_export), das Token steht im Secret ASANA_TOKEN.
-- Ohne Token tut der Export nichts und sagt es; es entstehen nie halbe Projekte.

alter table public.gfweekly_people
  add column if not exists asana_gid text;
comment on column public.gfweekly_people.asana_gid is
  'Das Hohe Haus V24c: Nutzerkennung in Asana, damit Aufgaben der Vertretung zugewiesen werden können. Leer = keine Zuweisung.';

alter table public.gfweekly_absences
  add column if not exists asana_project_gid text,
  add column if not exists asana_synced_at timestamptz;
comment on column public.gfweekly_absences.asana_project_gid is
  'Das Hohe Haus V24c: Asana-Projekt „Vertretung <Name> · <von> bis <bis>“. Ein erneuter Export aktualisiert dieses Projekt, statt ein zweites anzulegen.';
comment on column public.gfweekly_absences.asana_synced_at is
  'Das Hohe Haus V24c: letzter Rücksync aus Asana (erledigte Aufgaben und neue Kommentare).';
