-- Das Hohe Haus · Neuigkeiten aufräumen (22.10.2026). Auftrag: docs/PAKET-NEUIGKEITEN-AUFRAEUMEN.md.
-- Status „archiviert“ mit Grund und Zeitpunkt; nichts wird gelöscht, die Suche findet Archiviertes weiter.
-- hh_news_verfall legt unbearbeitete Ticker und Kandidaten ins Archiv, wenn Ereignis, Eintragung durch den Lauf und
-- letzte Zuteilung durch eine Person alle älter als p_tage sind (Standard 14).
-- Das einmalige Aufräumen der alten Kandidaten und der tägliche Zeitplan (04:50 UTC) stehen in einer eigenen Migration
-- (…_hh_news_aufraeumen), die erst nach dem Ausrollen der Seite läuft.
set lock_timeout = '10s';

alter table public.gfweekly_news drop constraint if exists gfweekly_news_status_check;
alter table public.gfweekly_news add constraint gfweekly_news_status_check
  check (status = any (array['neu', 'gesehen', 'uebernommen', 'verworfen', 'archiviert']));
alter table public.gfweekly_news add column if not exists archiv_grund text;
alter table public.gfweekly_news add column if not exists archiviert_at timestamptz;
comment on column public.gfweekly_news.archiv_grund is 'Warum archiviert: verfall-<tage> (täglicher Verfall) oder aufraeumen-20261022 (einmaliges Aufräumen). Leer, wenn nicht archiviert.';

create or replace function public.hh_news_verfall(p_tage int default 14)
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_tage int := greatest(coalesce(p_tage, 14), 1);
  v_grenze timestamptz := now() - make_interval(days => greatest(coalesce(p_tage, 14), 1));
  v_ticker int := 0;
  v_kandidaten int := 0;
begin
  -- decided_by und decided_at bleiben leer: niemand hat entschieden, der Eintrag ist nur gealtert.
  with a as (
    update public.gfweekly_news set status = 'archiviert', archiv_grund = 'verfall-' || v_tage, archiviert_at = now()
    where kind in ('ticker', 'kandidat') and status in ('neu', 'gesehen')
      and greatest(happened_at, created_at, coalesce(gate_at, '-infinity'::timestamptz)) < v_grenze
      and (gate_frist is null or gate_frist < (now() at time zone 'Europe/Berlin')::date)
    returning kind
  )
  select count(*) filter (where kind = 'ticker'), count(*) filter (where kind = 'kandidat') into v_ticker, v_kandidaten from a;
  return jsonb_build_object('ticker', v_ticker, 'kandidaten', v_kandidaten, 'grenze', v_grenze);
end;
$fn$;

revoke all on function public.hh_news_verfall(int) from public, anon, authenticated;
grant execute on function public.hh_news_verfall(int) to service_role;
