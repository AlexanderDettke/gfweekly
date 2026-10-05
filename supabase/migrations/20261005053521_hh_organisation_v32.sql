-- Das Hohe Haus · V32 Organisation (05.10.2026)
-- Angewendet am 05.10.2026 über den Supabase-Connector (apply_migration), Kennung 20261005053521.
-- Stand der acht Entscheidungen vor Stufe 1, Teamaufbau je Rolle und Tore der vier Aufbaustufen.
-- Die Texte (Entscheidungen, Rollen, Schritte, Tore) stehen in site/organisation.html; hier liegt nur der Stand.
-- Zugriff nur über die Edge Function „organisation“ (service_role); RLS an, keine Policies.
create table if not exists public.gfweekly_org_entscheidung(
  id int primary key check (id between 1 and 50),
  wahl int check (wahl between 0 and 9),
  alex_frei boolean not null default false, alex_am timestamptz,
  lea_frei boolean not null default false, lea_am timestamptz,
  begruendung text check (char_length(begruendung) <= 4000),
  freigegeben_am timestamptz, log_decision_id uuid,
  rev int not null default 0, updated_by text, updated_at timestamptz not null default now());
create table if not exists public.gfweekly_org_rolle(
  id text primary key check (id ~ '^[a-z0-9_-]{1,40}$'),
  schritt int not null default 0 check (schritt between 0 and 6),
  leitung text check (char_length(leitung) <= 120),
  stellvertretung text check (char_length(stellvertretung) <= 120),
  rev int not null default 0, updated_by text, updated_at timestamptz not null default now());
create table if not exists public.gfweekly_org_tor(
  key text primary key check (key ~ '^[1-4]-[0-9]$'),
  erfuellt boolean not null default false, updated_by text, updated_at timestamptz not null default now());
create table if not exists public.gfweekly_org_log(
  id bigserial primary key, at timestamptz not null default now(), who text, what text not null, ref text, detail jsonb);
alter table public.gfweekly_org_entscheidung enable row level security;
alter table public.gfweekly_org_rolle enable row level security;
alter table public.gfweekly_org_tor enable row level security;
alter table public.gfweekly_org_log enable row level security;
revoke all on public.gfweekly_org_entscheidung, public.gfweekly_org_rolle, public.gfweekly_org_tor, public.gfweekly_org_log from anon, authenticated;
insert into public.gfweekly_org_entscheidung(id) select g from generate_series(1,8) g on conflict (id) do nothing;

-- Wahl setzen: setzt beide Freigaben zurück (eine andere Wahl braucht eine neue Freigabe beider).
create or replace function public.hh_org_wahl(p_id int, p_wahl int, p_by text, p_expect_rev int)
returns public.gfweekly_org_entscheidung language plpgsql security definer set search_path = public as $$
declare r public.gfweekly_org_entscheidung;
begin
  select * into r from gfweekly_org_entscheidung where id = p_id for update;
  if not found then raise exception 'Entscheidung % fehlt', p_id using errcode = 'PT404'; end if;
  if p_expect_rev is not null and r.rev <> p_expect_rev then raise exception 'Inzwischen geändert' using errcode = 'PT409'; end if;
  if r.freigegeben_am is not null then raise exception 'Schon freigegeben; erst eine Freigabe zurücknehmen' using errcode = 'PT409'; end if;
  if r.wahl is not distinct from p_wahl then return r; end if;
  update gfweekly_org_entscheidung set wahl = p_wahl, alex_frei = false, alex_am = null, lea_frei = false, lea_am = null,
    rev = rev + 1, updated_by = p_by, updated_at = now() where id = p_id returning * into r;
  insert into gfweekly_org_log(who, what, ref, detail) values (p_by, 'wahl', p_id::text, jsonb_build_object('wahl', p_wahl));
  return r;
end $$;

-- Freigabe einer Person an- oder abschalten. Gilt nur für die gesehene Wahl. Liefert neu_freigegeben, wenn damit beide frei sind.
create or replace function public.hh_org_freigabe(p_id int, p_who text, p_on boolean, p_expect_wahl int)
returns jsonb language plpgsql security definer set search_path = public as $$
declare r public.gfweekly_org_entscheidung; neu boolean := false;
begin
  if p_who not in ('Alex','Lea') then raise exception 'Nur Alex oder Lea' using errcode = 'PT400'; end if;
  select * into r from gfweekly_org_entscheidung where id = p_id for update;
  if not found then raise exception 'Entscheidung % fehlt', p_id using errcode = 'PT404'; end if;
  if r.wahl is null then raise exception 'Erst eine Möglichkeit wählen' using errcode = 'PT400'; end if;
  if r.wahl is distinct from p_expect_wahl then raise exception 'Die Wahl hat sich geändert' using errcode = 'PT409'; end if;
  if p_who = 'Alex' then
    update gfweekly_org_entscheidung set alex_frei = p_on, alex_am = case when p_on then now() end, rev = rev + 1, updated_by = p_who, updated_at = now() where id = p_id returning * into r;
  else
    update gfweekly_org_entscheidung set lea_frei = p_on, lea_am = case when p_on then now() end, rev = rev + 1, updated_by = p_who, updated_at = now() where id = p_id returning * into r;
  end if;
  if r.alex_frei and r.lea_frei and r.freigegeben_am is null then
    update gfweekly_org_entscheidung set freigegeben_am = now() where id = p_id returning * into r; neu := true;
  elsif not (r.alex_frei and r.lea_frei) and r.freigegeben_am is not null then
    update gfweekly_org_entscheidung set freigegeben_am = null where id = p_id returning * into r;
  end if;
  insert into gfweekly_org_log(who, what, ref, detail) values (p_who, case when p_on then 'freigabe' else 'freigabe_zurueck' end, p_id::text, jsonb_build_object('wahl', r.wahl, 'beide', neu));
  return jsonb_build_object('entscheidung', to_jsonb(r), 'neu_freigegeben', neu);
end $$;
revoke all on function public.hh_org_wahl(int,int,text,int), public.hh_org_freigabe(int,text,boolean,int) from public, anon, authenticated;
grant execute on function public.hh_org_wahl(int,int,text,int), public.hh_org_freigabe(int,text,boolean,int) to service_role;
