-- Das Hohe Haus · Neuigkeiten aufräumen, Nacharbeit aus der Review Runde 1 (22.10.2026).
-- aktiv_ab: wann ein Eintrag aus dem Archiv zurückgeholt wurde („Zurück in den Korb“). Der Verfall zählt die 14 Tage
-- auch ab diesem Zeitpunkt, damit ein zurückgeholter alter Eintrag nicht in der nächsten Nacht wieder verschwindet.
-- hh_news_verfall bekommt p_grund, damit der erste Lauf beim einmaligen Aufräumen einen eigenen, umkehrbaren Grund trägt.
set lock_timeout = '10s';

alter table public.gfweekly_news add column if not exists aktiv_ab timestamptz;
comment on column public.gfweekly_news.aktiv_ab is 'Zeitpunkt, an dem der Eintrag aus dem Archiv zurückgeholt wurde; der Verfall zählt ab dem jüngsten von happened_at, created_at, gate_at und aktiv_ab.';

drop function if exists public.hh_news_verfall(int);
create or replace function public.hh_news_verfall(p_tage int default 14, p_grund text default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_tage int := greatest(coalesce(p_tage, 14), 1);
  v_grenze timestamptz := now() - make_interval(days => greatest(coalesce(p_tage, 14), 1));
  v_grund text := coalesce(nullif(btrim(coalesce(p_grund, '')), ''), 'verfall-' || greatest(coalesce(p_tage, 14), 1));
  v_ticker int := 0;
  v_kandidaten int := 0;
begin
  -- decided_by und decided_at bleiben leer: niemand hat entschieden, der Eintrag ist nur gealtert.
  with a as (
    update public.gfweekly_news set status = 'archiviert', archiv_grund = v_grund, archiviert_at = now()
    where kind in ('ticker', 'kandidat') and status in ('neu', 'gesehen')
      and greatest(happened_at, created_at, coalesce(gate_at, '-infinity'::timestamptz), coalesce(aktiv_ab, '-infinity'::timestamptz)) < v_grenze
      and (gate_frist is null or gate_frist < (now() at time zone 'Europe/Berlin')::date)
    returning kind
  )
  select count(*) filter (where kind = 'ticker'), count(*) filter (where kind = 'kandidat') into v_ticker, v_kandidaten from a;
  return jsonb_build_object('ticker', v_ticker, 'kandidaten', v_kandidaten, 'grenze', v_grenze, 'grund', v_grund, 'tage', v_tage);
end;
$fn$;

revoke all on function public.hh_news_verfall(int, text) from public, anon, authenticated;
grant execute on function public.hh_news_verfall(int, text) to service_role;
