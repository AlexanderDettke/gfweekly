-- Gemeinsame Bearbeitung der Vorstandspost, ausschließlich mit Freude eG.
-- Zugriff über die passwortgeschützte Edge Function, keine öffentliche Data API.
create table public.hh_vorstand_cases (
  id text primary key check (id ~ '^(MFMAIL-[0-9]{3}|VG-[0-9a-f-]{36}|TEST-[a-z0-9-]+)$'),
  organization text not null default 'mit-freude' check (organization = 'mit-freude'),
  title text not null check (length(title) between 1 and 500),
  finding text not null default '', next_action text not null default '',
  source_url text not null unique, source_ids jsonb not null default '[]',
  basis_at timestamptz not null default now(), priority boolean not null default false,
  status text not null default 'pruefen' check (status in ('pruefen','in_bearbeitung','wartet','erledigt')),
  owner text not null default '' check (owner in ('','Alex','Lea')),
  due_on date, waiting_on text not null default '', completion_evidence text not null default '',
  reply_to text not null default '', reply_subject text not null default '', reply_body text not null default '',
  task_title text not null default '', task_notes text not null default '',
  task_assignee text not null default 'Alex' check (task_assignee in ('Alex','Lea')),
  task_due_on date,
  task_state text not null default 'none' check (task_state in ('none','creating','created','unclear','failed')),
  task_claim uuid, task_error text not null default '',
  asana_gid text unique, asana_url text, asana_completed boolean, asana_checked_at timestamptz,
  version integer not null default 1,
  last_by text not null default 'Import',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check (status <> 'erledigt' or length(trim(completion_evidence)) > 0)
);
create table public.hh_vorstand_log (
  id bigint generated always as identity primary key,
  case_id text not null references public.hh_vorstand_cases(id) on delete cascade,
  who text not null, action text not null, fields jsonb not null default '[]', created_at timestamptz not null default now()
);
alter table public.hh_vorstand_cases enable row level security;
alter table public.hh_vorstand_log enable row level security;
revoke all on public.hh_vorstand_cases, public.hh_vorstand_log from public, anon, authenticated;
grant all on public.hh_vorstand_cases, public.hh_vorstand_log to service_role;
grant usage, select on sequence public.hh_vorstand_log_id_seq to service_role;
create index hh_vorstand_lage on public.hh_vorstand_cases(status, owner, priority desc, updated_at);

create function public.hh_vorstand_save(p_id text, p_version integer, p_patch jsonb, p_by text)
returns public.hh_vorstand_cases language plpgsql security invoker set search_path = public as $$
declare v public.hh_vorstand_cases; n public.hh_vorstand_cases; k text;
begin
  if p_by not in ('Alex','Lea') or p_by is null then raise exception 'Person fehlt' using errcode='PT400'; end if;
  select * into v from public.hh_vorstand_cases where id=p_id for update;
  if not found then raise exception 'Vorgang nicht gefunden' using errcode='PT404'; end if;
  if p_version is distinct from v.version then raise exception 'Der gemeinsame Stand wurde inzwischen geändert. Neu laden und Änderungen abgleichen.' using errcode='PT409'; end if;
  for k in select jsonb_object_keys(p_patch) loop
    if k <> all(array['title','finding','next_action','priority','status','owner','due_on','waiting_on','completion_evidence','reply_to','reply_subject','reply_body','task_title','task_notes','task_assignee','task_due_on']) then
      raise exception 'Dieses Feld kann hier nicht geändert werden: %',k using errcode='PT400';
    end if;
  end loop;
  n := jsonb_populate_record(v, p_patch);
  if v.task_state in ('creating','unclear','created') and
    (n.task_title,n.task_notes,n.task_assignee,n.task_due_on) is distinct from (v.task_title,v.task_notes,v.task_assignee,v.task_due_on) then
    raise exception 'Der Aufgabenauftrag wurde bereits gestartet. Aufgabenänderungen direkt in Asana vornehmen.' using errcode='PT409';
  end if;
  update public.hh_vorstand_cases set title=n.title, finding=n.finding, next_action=n.next_action, priority=n.priority,
    status=n.status, owner=n.owner, due_on=n.due_on, waiting_on=n.waiting_on, completion_evidence=n.completion_evidence,
    reply_to=n.reply_to, reply_subject=n.reply_subject, reply_body=n.reply_body,
    task_title=n.task_title, task_notes=n.task_notes, task_assignee=n.task_assignee, task_due_on=n.task_due_on,
    version=v.version+1, updated_at=now(), last_by=p_by where id=p_id returning * into v;
  insert into public.hh_vorstand_log(case_id,who,action,fields) values(p_id,p_by,'save',(select jsonb_agg(key) from jsonb_object_keys(p_patch) key));
  return v;
end; $$;

create function public.hh_vorstand_task_claim(p_id text, p_version integer, p_claim uuid, p_by text)
returns jsonb language plpgsql security invoker set search_path = public as $$
declare v public.hh_vorstand_cases;
begin
  if p_by not in ('Alex','Lea') or p_by is null or p_claim is null then raise exception 'Ungültiger Auftrag' using errcode='PT400'; end if;
  select * into v from public.hh_vorstand_cases where id=p_id for update;
  if not found then raise exception 'Vorgang nicht gefunden' using errcode='PT404'; end if;
  if v.asana_gid is not null then return jsonb_build_object('existing',true,'item',to_jsonb(v)); end if;
  if v.task_state in ('creating','unclear') then raise exception 'Die vorherige Anlage ist noch nicht geklärt. Zuerst in Asana abgleichen.' using errcode='PT409'; end if;
  if p_version is distinct from v.version then raise exception 'Der gemeinsame Stand wurde geändert. Neu laden.' using errcode='PT409'; end if;
  if length(trim(v.task_title))=0 or length(trim(v.task_notes))=0 then raise exception 'Aufgabentitel und Beschreibung fehlen' using errcode='PT400'; end if;
  update public.hh_vorstand_cases set task_state='creating', task_claim=p_claim, task_error='', version=version+1, updated_at=now(), last_by=p_by where id=p_id returning * into v;
  insert into public.hh_vorstand_log(case_id,who,action) values(p_id,p_by,'task_claim');
  return jsonb_build_object('existing',false,'item',to_jsonb(v));
end; $$;

create function public.hh_vorstand_task_result(p_id text, p_claim uuid, p_state text, p_gid text, p_url text, p_error text, p_completed boolean, p_by text)
returns public.hh_vorstand_cases language plpgsql security invoker set search_path = public as $$
declare v public.hh_vorstand_cases;
begin
  if p_by not in ('Alex','Lea') or p_by is null or p_state not in ('created','failed','unclear') then raise exception 'Ungültiger Abschluss' using errcode='PT400'; end if;
  select * into v from public.hh_vorstand_cases where id=p_id for update;
  if not found then raise exception 'Vorgang nicht gefunden' using errcode='PT404'; end if;
  if p_claim is distinct from v.task_claim then raise exception 'Der Aufgabenauftrag hat sich geändert' using errcode='PT409'; end if;
  if p_state='created' and (p_gid is null or p_gid !~ '^[0-9]+$' or p_url not like 'https://app.asana.com/%') then raise exception 'Asana Beleg fehlt' using errcode='PT400'; end if;
  update public.hh_vorstand_cases set task_state=p_state, asana_gid=case when p_state='created' then p_gid else asana_gid end,
    asana_url=case when p_state='created' then p_url else asana_url end, task_error=left(coalesce(p_error,''),500),
    asana_completed=case when p_state='created' then coalesce(p_completed,false) else asana_completed end,
    asana_checked_at=case when p_state='created' then now() else asana_checked_at end,
    version=version+1,updated_at=now(),last_by=p_by where id=p_id returning * into v;
  insert into public.hh_vorstand_log(case_id,who,action) values(p_id,p_by,'task_'||p_state);
  return v;
end; $$;

create function public.hh_vorstand_task_sync(p_id text,p_gid text,p_completed boolean,p_by text)
returns public.hh_vorstand_cases language plpgsql security invoker set search_path = public as $$
declare v public.hh_vorstand_cases;
begin
  if p_by not in ('Alex','Lea') or p_by is null then raise exception 'Person fehlt' using errcode='PT400'; end if;
  update public.hh_vorstand_cases set asana_completed=p_completed,asana_checked_at=now(),updated_at=now(),version=version+1,last_by=p_by
    where id=p_id and asana_gid=p_gid returning * into v;
  if not found then raise exception 'Asana Verknüpfung ist nicht aktuell' using errcode='PT409'; end if;
  return v;
end; $$;
revoke all on function public.hh_vorstand_save(text,integer,jsonb,text), public.hh_vorstand_task_claim(text,integer,uuid,text),
  public.hh_vorstand_task_result(text,uuid,text,text,text,text,boolean,text), public.hh_vorstand_task_sync(text,text,boolean,text) from public,anon,authenticated;
grant execute on function public.hh_vorstand_save(text,integer,jsonb,text), public.hh_vorstand_task_claim(text,integer,uuid,text),
  public.hh_vorstand_task_result(text,uuid,text,text,text,text,boolean,text), public.hh_vorstand_task_sync(text,text,boolean,text) to service_role;
