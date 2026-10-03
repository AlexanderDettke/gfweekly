-- V31 Vorhaben: Lesesicht mit Kennzahlen und Zustand. Angewendet 03.10.2026 (Version 20261003163017).
-- Achtung: v.* wurde beim Anlegen expandiert. Die Spalten aus 20261003163436 fehlen deshalb in der Sicht,
-- Paket 31a legt sie per neuer Migration neu an (drop view, create view).
create or replace view public.hh_vorhaben_lage as
select v.*,
  (select count(*) from public.hh_vorhaben_punkte p where p.vorhaben_id = v.id) as punkte_gesamt,
  (select count(*) from public.hh_vorhaben_punkte p where p.vorhaben_id = v.id and p.erledigt) as punkte_erledigt,
  (select max(e.happened_at) from public.hh_vorhaben_verlauf e where e.vorhaben_id = v.id and e.status = 'bestaetigt') as zuletzt_bewegt,
  (select count(*) from public.gfweekly_topics t where t.vorhaben_id = v.id and t.archived = false) as themen_offen,
  (select count(*) from public.gfweekly_news n where n.vorhaben_id = v.id and n.kind = 'kandidat' and n.status = 'neu') as kandidaten_neu,
  (select count(*) from public.hh_einwurf w where w.vorhaben_id = v.id and w.status in ('neu','vorgeschlagen')) as einwuerfe_offen,
  case
    when v.ball = 'offen' then 'ball_fehlt'
    when v.frist is not null and v.frist < (now() at time zone 'Europe/Berlin')::date and v.status = 'aktiv' then 'ueberfaellig'
    when exists (select 1 from public.hh_vorhaben_verlauf e where e.vorhaben_id = v.id and e.status = 'bestaetigt' and e.happened_at > now() - interval '48 hours') then 'bewegt'
    else 'ruhig'
  end as zustand
from public.hh_vorhaben v;
revoke all on public.hh_vorhaben_lage from anon, authenticated;
grant select on public.hh_vorhaben_lage to service_role;
