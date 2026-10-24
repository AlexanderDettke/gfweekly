-- Vorbereitete Erweiterung des bestehenden eG Bereichs. Nicht produktiv angewendet.
-- Vor einer Freigabe mit Supabase CLI einen regulären Migrationsnamen erzeugen.
begin;
alter table public.hh_vorstand_cases
  add column source_kind text not null default 'mail' check (source_kind in ('mail','chat')),
  add column source_key text,
  add column insight jsonb not null default '{}'::jsonb;
-- Eine Mailquelle bleibt eindeutig. Ein Chat darf mehrere unterschiedliche Erkenntnisse tragen.
alter table public.hh_vorstand_cases drop constraint hh_vorstand_cases_source_url_key;
create unique index hh_vorstand_mail_source on public.hh_vorstand_cases(source_url) where source_kind='mail';
create unique index hh_vorstand_chat_source on public.hh_vorstand_cases(source_key) where source_kind='chat';
alter table public.hh_vorstand_cases add constraint hh_vorstand_chat_provenance check (
  source_kind='mail' and insight='{}'::jsonb and source_key is null
  or source_kind='chat' and jsonb_typeof(insight)='object'
    and coalesce(insight->>'thread_id','') ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    and (coalesce(insight->>'turn_id','') ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' or (coalesce(insight->>'turn_id','')='' and length(trim(coalesce(insight->>'excerpt',''))) between 1 and 2000))
    and coalesce(source_key,'') ~ ('^chat:' || (insight->>'thread_id') || ':' || coalesce(nullif(insight->>'turn_id',''),'manual') || ':[A-Za-z0-9._:-]{1,120}$')
    and source_url in ('https://chatgpt.com/c/'||(insight->>'thread_id'),'codex://threads/'||(insight->>'thread_id'))
    and coalesce(insight->>'evidence_stage','') in ('besprochen','vorgeschlagen','entschieden','vorbereitet','umgesetzt','technisch_geprueft','fachlich_angenommen','wirkung_beobachtet')
    and coalesce(insight->>'evidence_basis','') in ('original_geprueft','quellchat','offen')
    and length(coalesce(insight->>'leadership_relevance','')) between 1 and 4000
    and coalesce(insight->>'occurred_at','') ~ '^\d{4}-\d{2}-\d{2}(T.*)?$'
);
create or replace function public.hh_vorstand_save(p_id text, p_version integer, p_patch jsonb, p_by text)
returns public.hh_vorstand_cases language plpgsql security invoker set search_path = public as $$
declare v public.hh_vorstand_cases; n public.hh_vorstand_cases; k text;
begin
  if p_by not in ('Alex','Lea') or p_by is null then raise exception 'Person fehlt' using errcode='PT400'; end if;
  select * into v from public.hh_vorstand_cases where id=p_id for update;
  if not found then raise exception 'Vorgang nicht gefunden' using errcode='PT404'; end if;
  if p_version is distinct from v.version then raise exception 'Der gemeinsame Stand wurde inzwischen geändert. Neu laden und Änderungen abgleichen.' using errcode='PT409'; end if;
  for k in select jsonb_object_keys(p_patch) loop
    if k <> all(array['title','finding','next_action','priority','status','owner','due_on','waiting_on','completion_evidence','reply_to','reply_subject','reply_body','task_title','task_notes','task_assignee','task_due_on','insight']) then
      raise exception 'Dieses Feld kann hier nicht geändert werden: %',k using errcode='PT400';
    end if;
  end loop;
  if p_patch ? 'insight' and (v.source_kind <> 'chat' or
    (p_patch->'insight'->>'thread_id',p_patch->'insight'->>'turn_id',p_patch->'insight'->>'occurred_at') is distinct from
    (v.insight->>'thread_id',v.insight->>'turn_id',v.insight->>'occurred_at')) then
    raise exception 'Die Herkunft bleibt unverändert. Bitte den passenden Vorgang verwenden.' using errcode='PT400';
  end if;
  n := jsonb_populate_record(v, p_patch);
  if v.task_state in ('creating','unclear','created') and
    (n.task_title,n.task_notes,n.task_assignee,n.task_due_on) is distinct from (v.task_title,v.task_notes,v.task_assignee,v.task_due_on) then
    raise exception 'Der Aufgabenauftrag wurde bereits gestartet. Aufgabenänderungen direkt in Asana vornehmen.' using errcode='PT409';
  end if;
  update public.hh_vorstand_cases set title=n.title, finding=n.finding, next_action=n.next_action, priority=n.priority,
    status=n.status, owner=n.owner, due_on=n.due_on, waiting_on=n.waiting_on, completion_evidence=n.completion_evidence,
    reply_to=n.reply_to, reply_subject=n.reply_subject, reply_body=n.reply_body,
    task_title=n.task_title, task_notes=n.task_notes, task_assignee=n.task_assignee, task_due_on=n.task_due_on,
    insight=n.insight, version=v.version+1, updated_at=now(), last_by=p_by where id=p_id returning * into v;
  insert into public.hh_vorstand_log(case_id,who,action,fields) values(p_id,p_by,'save',(select jsonb_agg(key) from jsonb_object_keys(p_patch) key));
  return v;
end; $$;
commit;
