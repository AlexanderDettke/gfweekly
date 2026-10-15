-- OE-20261015-ALEXANDER-LEA: Alexander entscheidet die Organisationsentwicklung.
-- Leas gespeicherte Zustimmung bleibt als optionale Rückmeldung erhalten.
-- Bestehende Funktionssignatur und Rechte bleiben kompatibel mit der Edge Function.
create or replace function public.hh_org_freigabe(p_id int, p_who text, p_on boolean, p_expect_wahl int)
returns jsonb language plpgsql security definer set search_path = public as $$
declare r public.gfweekly_org_entscheidung; neu boolean := false;
begin
  if p_who is null or p_who not in ('Alex','Lea') or p_on is null then
    raise exception 'Person oder Rückmeldung fehlt' using errcode = 'PT400';
  end if;
  select * into r from gfweekly_org_entscheidung where id = p_id for update;
  if not found then raise exception 'Entscheidung % fehlt', p_id using errcode = 'PT404'; end if;
  if r.wahl is null then raise exception 'Erst eine Möglichkeit wählen' using errcode = 'PT400'; end if;
  if r.wahl is distinct from p_expect_wahl then raise exception 'Die Wahl hat sich geändert' using errcode = 'PT409'; end if;
  if p_who = 'Alex' then
    neu := p_on and r.freigegeben_am is null;
    update gfweekly_org_entscheidung set
      alex_frei = p_on, alex_am = case when p_on then coalesce(alex_am, now()) end,
      freigegeben_am = case when p_on then coalesce(freigegeben_am, now()) end,
      rev = rev + 1, updated_by = p_who, updated_at = now()
    where id = p_id returning * into r;
  else
    -- Leas Rückmeldung ändert ausdrücklich weder Freigabe noch Freigabezeitpunkt.
    update gfweekly_org_entscheidung set
      lea_frei = p_on, lea_am = case when p_on then coalesce(lea_am, now()) end,
      rev = rev + 1, updated_by = p_who, updated_at = now()
    where id = p_id returning * into r;
  end if;
  insert into gfweekly_org_log(who, what, ref, detail) values (
    p_who,
    case when p_who = 'Lea' then case when p_on then 'rueckmeldung' else 'rueckmeldung_zurueck' end
         else case when p_on then 'freigabe' else 'freigabe_zurueck' end end,
    p_id::text, jsonb_build_object('wahl', r.wahl, 'neu_freigegeben', neu, 'entscheidungsfuehrung', 'Alex'));
  return jsonb_build_object('entscheidung', to_jsonb(r), 'neu_freigegeben', neu);
end $$;
revoke all on function public.hh_org_freigabe(int,text,boolean,int) from public, anon, authenticated;
grant execute on function public.hh_org_freigabe(int,text,boolean,int) to service_role;

-- Vorhandene Freigaben von Alex werden jetzt wirksam. Keine neue Wahl, keine
-- erfundene Zustimmung von Lea und keine Rückdatierung des Wirksamwerdens.
with korrigiert as (
  update public.gfweekly_org_entscheidung
  set freigegeben_am = now(), rev = rev + 1, updated_at = now(), updated_by = 'System'
  where alex_frei and wahl is not null and freigegeben_am is null
  returning id, wahl, alex_am, freigegeben_am
)
insert into public.gfweekly_org_log(who, what, ref, detail)
select 'System', 'entscheidungsregel', id::text,
  jsonb_build_object('regel', 'OE-20261015-ALEXANDER-LEA', 'wahl', wahl,
    'alex_freigabe_am', alex_am, 'wirksam_ab', freigegeben_am)
from korrigiert;
