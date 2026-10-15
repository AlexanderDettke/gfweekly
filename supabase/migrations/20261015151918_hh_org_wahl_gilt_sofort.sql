-- Das Hohe Haus · Organisation: Alexanders Wahl gilt sofort (15.10.2026).
-- Folge aus OE-20261015-ALEXANDER-LEA und der Auswahl vom 15.10. (keine Freigaben): Wählen und Freigeben
-- waren zwei Schritte, der zweite war für Alexander allein ein Klick ohne Wahlmöglichkeit.
-- Jetzt: Alexanders Wahl ist die Entscheidung. Eine andere Wahl ersetzt sie und erscheint neu im Entscheidungslog.
-- Lea wählt nicht; ihre optionale Rückmeldung bleibt und ändert die Entscheidung nicht.
-- Signaturen bleiben gleich, die Edge Function „organisation“ braucht keine Änderung.

create or replace function public.hh_org_wahl(p_id int, p_wahl int, p_by text, p_expect_rev int)
returns public.gfweekly_org_entscheidung language plpgsql security definer set search_path = public as $$
declare r public.gfweekly_org_entscheidung; vorher int;
begin
  if p_by is distinct from 'Alex' then
    raise exception 'Alexander entscheidet; Lea gibt bei Bedarf eine Rückmeldung' using errcode = 'PT400';
  end if;
  select * into r from gfweekly_org_entscheidung where id = p_id for update;
  if not found then raise exception 'Entscheidung % fehlt', p_id using errcode = 'PT404'; end if;
  if p_expect_rev is not null and r.rev <> p_expect_rev then raise exception 'Inzwischen geändert' using errcode = 'PT409'; end if;
  vorher := r.wahl;
  if p_wahl is null then
    if r.wahl is null then return r; end if;
    update gfweekly_org_entscheidung set wahl = null, alex_frei = false, alex_am = null, lea_frei = false, lea_am = null,
      freigegeben_am = null, log_decision_id = null, rev = rev + 1, updated_by = p_by, updated_at = now()
    where id = p_id returning * into r;
  elsif r.wahl is not distinct from p_wahl then
    -- Gleiche Wahl: gilt sie schon, bleibt alles stehen; sonst gilt sie ab jetzt.
    if r.freigegeben_am is not null then return r; end if;
    update gfweekly_org_entscheidung set alex_frei = true, alex_am = coalesce(alex_am, now()), freigegeben_am = now(),
      rev = rev + 1, updated_by = p_by, updated_at = now()
    where id = p_id returning * into r;
  else
    -- Andere Wahl: neue Entscheidung. Leas Rückmeldung galt der alten Möglichkeit, der alte Logeintrag bleibt Geschichte.
    update gfweekly_org_entscheidung set wahl = p_wahl, alex_frei = true, alex_am = now(), freigegeben_am = now(),
      lea_frei = false, lea_am = null, log_decision_id = null, rev = rev + 1, updated_by = p_by, updated_at = now()
    where id = p_id returning * into r;
  end if;
  insert into gfweekly_org_log(who, what, ref, detail) values (p_by, 'wahl', p_id::text,
    jsonb_build_object('wahl', p_wahl, 'vorher', vorher, 'gilt', r.freigegeben_am is not null));
  return r;
end $$;

-- Bleibt für Leas optionale Rückmeldung. Für Alexander ändert sie nichts mehr: seine Wahl ist die Entscheidung.
-- Ein noch geöffneter alter Seitenstand kann damit weder freigeben noch eine Entscheidung zurücknehmen.
create or replace function public.hh_org_freigabe(p_id int, p_who text, p_on boolean, p_expect_wahl int)
returns jsonb language plpgsql security definer set search_path = public as $$
declare r public.gfweekly_org_entscheidung;
begin
  if p_who is null or p_who not in ('Alex','Lea') or p_on is null then
    raise exception 'Person oder Rückmeldung fehlt' using errcode = 'PT400';
  end if;
  select * into r from gfweekly_org_entscheidung where id = p_id for update;
  if not found then raise exception 'Entscheidung % fehlt', p_id using errcode = 'PT404'; end if;
  if p_who = 'Alex' then
    return jsonb_build_object('entscheidung', to_jsonb(r), 'neu_freigegeben', false);
  end if;
  if r.wahl is null then raise exception 'Erst wählt Alexander eine Möglichkeit' using errcode = 'PT400'; end if;
  if r.wahl is distinct from p_expect_wahl then raise exception 'Die Wahl hat sich geändert' using errcode = 'PT409'; end if;
  update gfweekly_org_entscheidung set
    lea_frei = p_on, lea_am = case when p_on then coalesce(lea_am, now()) end,
    rev = rev + 1, updated_by = p_who, updated_at = now()
  where id = p_id returning * into r;
  insert into gfweekly_org_log(who, what, ref, detail) values (p_who,
    case when p_on then 'rueckmeldung' else 'rueckmeldung_zurueck' end, p_id::text,
    jsonb_build_object('wahl', r.wahl, 'neu_freigegeben', false, 'entscheidungsfuehrung', 'Alex'));
  return jsonb_build_object('entscheidung', to_jsonb(r), 'neu_freigegeben', false);
end $$;

revoke all on function public.hh_org_wahl(int,int,text,int), public.hh_org_freigabe(int,text,boolean,int) from public, anon, authenticated;
grant execute on function public.hh_org_wahl(int,int,text,int), public.hh_org_freigabe(int,text,boolean,int) to service_role;

-- Gewählte, aber noch nicht geltende Entscheidungen gelten ab jetzt. Keine Rückdatierung, keine neue Wahl.
with korrigiert as (
  update public.gfweekly_org_entscheidung
  set alex_frei = true, alex_am = coalesce(alex_am, now()), freigegeben_am = now(),
      rev = rev + 1, updated_at = now(), updated_by = 'System'
  where wahl is not null and freigegeben_am is null
  returning id, wahl, freigegeben_am
)
insert into public.gfweekly_org_log(who, what, ref, detail)
select 'System', 'entscheidungsregel', id::text,
  jsonb_build_object('regel', 'Wahl gilt sofort', 'wahl', wahl, 'wirksam_ab', freigegeben_am)
from korrigiert;
