-- Nur innerhalb BEGIN/ROLLBACK ausführen. Testzeile 50 darf nicht existieren.
-- Regel seit 15.10.2026: Alex’ Wahl gilt sofort; Lea wählt nicht, ihre Rückmeldung bleibt optional.
do $$
declare r jsonb; e public.gfweekly_org_entscheidung; ts timestamptz; revision int;
begin
  insert into public.gfweekly_org_entscheidung(id) values (50);
  begin
    perform public.hh_org_freigabe(50, 'Lea', true, null);
    raise exception 'Rückmeldung ohne Wahl wurde akzeptiert';
  exception when sqlstate 'PT400' then null; end;
  begin
    perform public.hh_org_wahl(50, 0, 'Lea', 0);
    raise exception 'Lea konnte entscheiden';
  exception when sqlstate 'PT400' then null; end;
  assert (select wahl is null and freigegeben_am is null from public.gfweekly_org_entscheidung where id=50), 'Leas Versuch ändert nichts';

  e := public.hh_org_wahl(50, 0, 'Alex', 0);
  assert e.wahl = 0 and e.alex_frei and e.freigegeben_am is not null, 'Alex’ Wahl gilt sofort';
  assert not e.lea_frei;
  ts := e.freigegeben_am;
  assert (select detail->>'gilt' from public.gfweekly_org_log where ref='50' and what='wahl' order by id desc limit 1) = 'true';

  e := public.hh_org_wahl(50, 0, 'Alex', null);
  assert e.freigegeben_am = ts and e.rev = 1, 'Gleiche Wahl ändert nichts';

  r := public.hh_org_freigabe(50, 'Lea', true, 0);
  assert (r->'entscheidung'->>'lea_frei')::boolean and not (r->>'neu_freigegeben')::boolean;
  assert (r->'entscheidung'->>'freigegeben_am')::timestamptz = ts, 'Rückmeldung ändert die Entscheidung nicht';
  r := public.hh_org_freigabe(50, 'Lea', false, 0);
  assert (r->'entscheidung'->>'freigegeben_am')::timestamptz = ts, 'Rücknahme der Rückmeldung sperrt nichts';
  r := public.hh_org_freigabe(50, 'Lea', true, 0);

  r := public.hh_org_freigabe(50, 'Alex', false, 0);
  assert (r->'entscheidung'->>'freigegeben_am')::timestamptz = ts and not (r->>'neu_freigegeben')::boolean,
    'Alter Freigabeknopf nimmt nichts zurück';
  r := public.hh_org_freigabe(50, 'Alex', true, 0);
  assert not (r->>'neu_freigegeben')::boolean;

  update public.gfweekly_org_entscheidung set log_decision_id = '11111111-1111-4111-8111-111111111111' where id = 50;
  revision := (select rev from public.gfweekly_org_entscheidung where id = 50);
  begin
    perform public.hh_org_wahl(50, 1, 'Alex', revision - 1);
    raise exception 'Veraltete Revision wurde akzeptiert';
  exception when sqlstate 'PT409' then null; end;
  begin
    perform public.hh_org_wahl(50, 1, 'Lea', revision);
    raise exception 'Lea konnte die Entscheidung ändern';
  exception when sqlstate 'PT400' then null; end;
  e := public.hh_org_wahl(50, 1, 'Alex', revision);
  assert e.wahl = 1 and e.alex_frei and e.freigegeben_am is not null, 'Andere Wahl gilt sofort';
  assert not e.lea_frei and e.lea_am is null, 'Leas Rückmeldung galt der alten Möglichkeit';
  assert e.log_decision_id is null, 'Neue Entscheidung bekommt einen eigenen Logeintrag';
  begin
    perform public.hh_org_freigabe(50, 'Lea', true, 0);
    raise exception 'Rückmeldung zur alten Wahl wurde akzeptiert';
  exception when sqlstate 'PT409' then null; end;

  e := public.hh_org_wahl(50, null, 'Alex', e.rev);
  assert e.wahl is null and e.freigegeben_am is null and not e.alex_frei, 'Alex kann die Wahl zurücknehmen';

  -- Gewählt, aber nicht geltend (alter Stand): gleiche Wahl von Alex lässt sie gelten.
  update public.gfweekly_org_entscheidung set wahl = 1, alex_frei = false, freigegeben_am = null where id = 50;
  e := public.hh_org_wahl(50, 1, 'Alex', null);
  assert e.freigegeben_am is not null and e.alex_frei, 'Gleiche Wahl lässt einen alten Stand gelten';

  assert not has_function_privilege('anon','public.hh_org_wahl(integer,integer,text,integer)','EXECUTE');
  assert not has_function_privilege('authenticated','public.hh_org_wahl(integer,integer,text,integer)','EXECUTE');
  assert has_function_privilege('service_role','public.hh_org_wahl(integer,integer,text,integer)','EXECUTE');
  assert not has_function_privilege('anon','public.hh_org_freigabe(integer,text,boolean,integer)','EXECUTE');
  assert not has_function_privilege('authenticated','public.hh_org_freigabe(integer,text,boolean,integer)','EXECUTE');
  assert has_function_privilege('service_role','public.hh_org_freigabe(integer,text,boolean,integer)','EXECUTE');
end $$;
select 'Entscheidungslogik und Zugriffsrechte bestanden' as pruefung;
