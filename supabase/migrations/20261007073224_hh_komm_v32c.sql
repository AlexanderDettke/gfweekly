-- Das Hohe Haus · V32 Kommunikation, Nachtrag aus Review 32c Runde 1 (07.10.2026).
-- Versandlauf mit Fortschritt: ein Versand über mehrere Aufrufe merkt sich die schon bearbeiteten Aufgaben und setzt
-- bei der nächsten unbearbeiteten fort (Befund 2). Sperrprüfung: vor jeder Änderung in Asana prüft der Versand, dass
-- er die Sperre noch hält, und verlängert sie (Befund 3).
create table if not exists public.komm_versandlauf(
  schluessel text primary key,              -- Festival (short_name) oder 'test'
  lauf uuid not null default gen_random_uuid(),
  erledigt text[] not null default '{}',     -- Namen der in diesem Lauf bearbeiteten Aufgaben
  gestartet_am timestamptz not null default now(),
  aktualisiert_am timestamptz not null default now(),
  abgeschlossen boolean not null default false);
alter table public.komm_versandlauf enable row level security;
revoke all on public.komm_versandlauf from anon, authenticated;
grant select, insert, update, delete on public.komm_versandlauf to service_role;

-- Hält der Aufrufer die Sperre noch? Wenn ja, um p_sekunden verlängern.
create or replace function public.hh_komm_sperre_halten(p_schluessel text, p_von text, p_sekunden int)
returns boolean language plpgsql set search_path = public as $$
declare n int;
begin
  update komm_sperre set bis = greatest(bis, now() + make_interval(secs => p_sekunden))
   where schluessel = p_schluessel and von = p_von and bis > now();
  get diagnostics n = row_count;
  return n > 0;
end $$;
revoke all on function public.hh_komm_sperre_halten(text, text, int) from public, anon, authenticated;
grant execute on function public.hh_komm_sperre_halten(text, text, int) to service_role;
