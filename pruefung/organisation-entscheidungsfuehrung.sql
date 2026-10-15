-- Nur innerhalb BEGIN/ROLLBACK ausführen. Testzeile 50 darf nicht existieren.
do $$
declare r jsonb; ts timestamptz; revision int;
begin
  insert into public.gfweekly_org_entscheidung(id) values (50);
  begin
    perform public.hh_org_freigabe(50, 'Alex', true, null);
    raise exception 'Freigabe ohne Wahl wurde akzeptiert';
  exception when sqlstate 'PT400' then null; end;
  perform public.hh_org_wahl(50, 0, 'Alex', 0);
  r := public.hh_org_freigabe(50, 'Lea', true, 0);
  assert not (r->>'neu_freigegeben')::boolean, 'Lea allein gibt nicht frei';
  assert r->'entscheidung'->>'freigegeben_am' is null;
  r := public.hh_org_freigabe(50, 'Lea', false, 0);
  r := public.hh_org_freigabe(50, 'Alex', true, 0);
  assert (r->>'neu_freigegeben')::boolean, 'Alex allein gibt frei';
  assert not (r->'entscheidung'->>'lea_frei')::boolean;
  ts := (r->'entscheidung'->>'freigegeben_am')::timestamptz;
  assert ts is not null;
  r := public.hh_org_freigabe(50, 'Alex', true, 0);
  assert not (r->>'neu_freigegeben')::boolean, 'Wiederholung erzeugt keine neue Freigabe';
  r := public.hh_org_freigabe(50, 'Lea', true, 0);
  assert not (r->>'neu_freigegeben')::boolean;
  r := public.hh_org_freigabe(50, 'Lea', false, 0);
  assert (r->'entscheidung'->>'freigegeben_am')::timestamptz = ts, 'Lea kann Alex nicht sperren';
  revision := (r->'entscheidung'->>'rev')::int;
  begin
    perform public.hh_org_freigabe(50, 'Alex', false, 1);
    raise exception 'Veraltete Wahl wurde akzeptiert';
  exception when sqlstate 'PT409' then null; end;
  begin
    perform public.hh_org_wahl(50, 1, 'Lea', revision);
    raise exception 'Freigegebene Wahl wurde verändert';
  exception when sqlstate 'PT409' then null; end;
  perform public.hh_org_freigabe(50, 'Lea', true, 0);
  r := public.hh_org_freigabe(50, 'Alex', false, 0);
  assert r->'entscheidung'->>'freigegeben_am' is null, 'Alex nimmt selbst zurück';
  assert (r->'entscheidung'->>'lea_frei')::boolean, 'Rückmeldung bleibt erhalten';
  revision := (r->'entscheidung'->>'rev')::int;
  begin
    perform public.hh_org_wahl(50, 1, 'Alex', revision - 1);
    raise exception 'Veraltete Revision wurde akzeptiert';
  exception when sqlstate 'PT409' then null; end;
  perform public.hh_org_wahl(50, 1, 'Alex', revision);
  assert (select not alex_frei and not lea_frei and freigegeben_am is null from public.gfweekly_org_entscheidung where id=50);
  r := public.hh_org_freigabe(50, 'Alex', true, 1);
  assert (r->>'neu_freigegeben')::boolean;
  assert not has_function_privilege('anon','public.hh_org_freigabe(integer,text,boolean,integer)','EXECUTE');
  assert not has_function_privilege('authenticated','public.hh_org_freigabe(integer,text,boolean,integer)','EXECUTE');
  assert has_function_privilege('service_role','public.hh_org_freigabe(integer,text,boolean,integer)','EXECUTE');
end $$;
select 'Entscheidungslogik und Zugriffsrechte bestanden' as pruefung;
