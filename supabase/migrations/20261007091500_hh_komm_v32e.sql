-- Das Hohe Haus · V32 Kommunikation, Nachtrag aus Review 32c Runde 3 (07.10.2026).
-- 1. Anlagen mit unklarem Ausgang bleiben je Aufgabenname mit Zeitpunkt im Versandlauf vermerkt (Befund 1); eine erneute
--    Anlage gibt es erst, wenn die Aufgabe nach einer Wartezeit nicht im Projekt steht.
-- 2. Fortschritt wird nur unter gehaltener Sperre gespeichert, Prüfung und Schreiben in einer Transaktion mit Zeilensperre
--    auf komm_sperre (Befund 2). Ein abgelöster Lauf ändert nichts mehr.
alter table public.komm_versandlauf add column if not exists unklar jsonb not null default '{}'::jsonb;

create or replace function public.hh_komm_versandlauf_speichern(
  p_schluessel text, p_sperre text, p_von text, p_lauf uuid, p_projekt text, p_erledigt text[], p_unklar jsonb,
  p_fortsetzen_ab timestamptz, p_gestartet_am timestamptz, p_abgeschlossen boolean)
returns boolean language plpgsql set search_path = public as $$
begin
  perform 1 from komm_sperre where schluessel = p_sperre and von = p_von and bis > now() for update;
  if not found then return false; end if;
  insert into komm_versandlauf(schluessel, lauf, projekt, erledigt, unklar, fortsetzen_ab, gestartet_am, aktualisiert_am, abgeschlossen)
  values (p_schluessel, p_lauf, p_projekt, coalesce(p_erledigt, '{}'), coalesce(p_unklar, '{}'::jsonb), p_fortsetzen_ab, coalesce(p_gestartet_am, now()), now(), p_abgeschlossen)
  on conflict (schluessel) do update set lauf = excluded.lauf, projekt = excluded.projekt, erledigt = excluded.erledigt, unklar = excluded.unklar,
    fortsetzen_ab = excluded.fortsetzen_ab, gestartet_am = excluded.gestartet_am, aktualisiert_am = now(), abgeschlossen = excluded.abgeschlossen;
  return true;
end $$;
revoke all on function public.hh_komm_versandlauf_speichern(text, text, text, uuid, text, text[], jsonb, timestamptz, timestamptz, boolean) from public, anon, authenticated;
grant execute on function public.hh_komm_versandlauf_speichern(text, text, text, uuid, text, text[], jsonb, timestamptz, timestamptz, boolean) to service_role;
