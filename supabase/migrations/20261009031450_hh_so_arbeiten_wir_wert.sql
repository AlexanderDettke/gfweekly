-- Das Hohe Haus · So arbeiten wir (V33) · angewendet per Supabase-MCP am 09.10.2026 (Fernhistorie 20261009031450)
-- Antwortwert auch für Zahl- (Stunden) und Wahlfragen (Nummer der Option): 0 bis 999 statt 1 bis 5; die Skala prüft die Edge Function.
alter table public.gfweekly_sa_antworten drop constraint if exists gfweekly_sa_antworten_wert_check;
alter table public.gfweekly_sa_antworten add constraint gfweekly_sa_antworten_wert_check check (wert is null or wert between 0 and 999);
