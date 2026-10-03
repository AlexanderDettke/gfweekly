-- Das Hohe Haus · V31b, Nacharbeit aus der Review 31b Runde 2 (03.10.2026).
-- hh_vorhaben_save und hh_punkt_save prüfen p_patch.expect: je Feld der zuletzt gesehene Wert. Weicht der gespeicherte
-- Wert ab, 409 statt still zu überschreiben (Alex und Lea bearbeiten denselben Punkt oder dasselbe Feld).
set lock_timeout = '10s';

create or replace function public.hh_vorhaben_save(p_id uuid, p_patch jsonb, p_by text, p_notiz text default null, p_anlass text default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_alt public.hh_vorhaben;
  v_neu public.hh_vorhaben;
  v_ball_neu boolean;
  v_notiz text := nullif(btrim(coalesce(p_notiz, '')), '');
  v_vor text := case when nullif(btrim(coalesce(p_anlass, '')), '') is null or p_anlass = 'abwesenheit' then '' else p_anlass || ': ' end;
  v_eintraege int := 0;
  v_k text;
begin
  select * into v_alt from public.hh_vorhaben where id = p_id for update;
  if not found then raise exception 'Vorhaben % gibt es nicht', p_id using errcode = 'no_data_found'; end if;
  -- V31b Runde 2: p_patch.expect nennt je Feld den Wert, den die Person zuletzt gesehen hat. Hat jemand anderes
  -- das Feld inzwischen geändert, bricht das Speichern ab, statt die fremde Änderung still zu überschreiben.
  if jsonb_typeof(p_patch->'expect') = 'object' then
    for v_k in select jsonb_object_keys(p_patch->'expect') loop
      if (to_jsonb(v_alt)->v_k) is distinct from (p_patch->'expect'->v_k) then
        raise exception 'Inzwischen geändert (%), bitte neu laden', v_k using errcode = 'PT409';
      end if;
    end loop;
  end if;
  if p_patch ? 'expect_ball' and (p_patch->>'expect_ball') is distinct from v_alt.ball then
    -- PT409: PostgREST antwortet mit 409. Kein serialization_failure (40001): den wiederholt PostgREST bis zum Timeout.
    raise exception 'Der Ball liegt inzwischen bei %, bitte neu laden', public.hh_ball_wort(v_alt.ball, v_alt.ball_name)
      using errcode = 'PT409';
  end if;

  update public.hh_vorhaben set
    title             = case when p_patch ? 'title' then p_patch->>'title' else title end,
    gruppe            = case when p_patch ? 'gruppe' then p_patch->>'gruppe' else gruppe end,
    strand            = case when p_patch ? 'strand' then p_patch->>'strand' else strand end,
    ball              = case when p_patch ? 'ball' then p_patch->>'ball' else ball end,
    ball_name         = case when p_patch ? 'ball_name' then p_patch->>'ball_name' else ball_name end,
    owner             = case when p_patch ? 'owner' then p_patch->>'owner' else owner end,
    stand             = case when p_patch ? 'stand' then p_patch->>'stand' else stand end,
    naechster_schritt = case when p_patch ? 'naechster_schritt' then p_patch->>'naechster_schritt' else naechster_schritt end,
    frist             = case when p_patch ? 'frist' then (p_patch->>'frist')::date else frist end,
    frist_text        = case when p_patch ? 'frist_text' then p_patch->>'frist_text' else frist_text end,
    konflikt          = case when p_patch ? 'konflikt' then p_patch->>'konflikt' else konflikt end,
    status            = case when p_patch ? 'status' then p_patch->>'status' else status end,
    sort              = case when p_patch ? 'sort' then (p_patch->>'sort')::int else sort end,
    updated_by        = p_by
  where id = p_id
  returning * into v_neu;

  v_ball_neu := v_neu.ball is distinct from v_alt.ball
             or coalesce(v_neu.ball_name, '') is distinct from coalesce(v_alt.ball_name, '');
  if v_ball_neu then
    update public.hh_vorhaben set
      ball_seit = now(),
      absence_id = case when p_anlass = 'abwesenheit' then absence_id else null end,
      ball_vor_abwesenheit = case when p_anlass = 'abwesenheit' then ball_vor_abwesenheit else null end
    where id = p_id returning * into v_neu;
    insert into public.hh_vorhaben_verlauf (vorhaben_id, art, wer, text, created_by)
    values (p_id, 'uebergabe', p_by,
            v_vor || 'Ball von ' || public.hh_ball_wort(v_alt.ball, v_alt.ball_name) || ' an ' || public.hh_ball_wort(v_neu.ball, v_neu.ball_name)
            || coalesce('. ' || v_notiz, ''), p_by);
    v_eintraege := v_eintraege + 1;
  elsif v_notiz is not null then
    insert into public.hh_vorhaben_verlauf (vorhaben_id, art, wer, text, created_by)
    values (p_id, 'uebergabe', p_by, v_vor || v_notiz, p_by);
    v_eintraege := v_eintraege + 1;
  end if;
  if v_neu.naechster_schritt is distinct from v_alt.naechster_schritt then
    insert into public.hh_vorhaben_verlauf (vorhaben_id, art, wer, text, created_by)
    values (p_id, 'system', p_by, 'Nächster Schritt: ' || coalesce(nullif(btrim(v_neu.naechster_schritt), ''), 'gestrichen'), p_by);
    v_eintraege := v_eintraege + 1;
  end if;
  if v_neu.stand is distinct from v_alt.stand then
    insert into public.hh_vorhaben_verlauf (vorhaben_id, art, wer, text, created_by)
    values (p_id, 'system', p_by, 'Stand: ' || coalesce(nullif(btrim(v_neu.stand), ''), 'gestrichen'), p_by);
    v_eintraege := v_eintraege + 1;
  end if;
  if v_neu.frist is distinct from v_alt.frist then
    insert into public.hh_vorhaben_verlauf (vorhaben_id, art, wer, text, created_by)
    values (p_id, 'system', p_by, 'Frist: ' || coalesce(to_char(v_neu.frist, 'DD.MM.YYYY'), 'gestrichen'), p_by);
    v_eintraege := v_eintraege + 1;
  end if;
  if v_neu.status is distinct from v_alt.status then
    insert into public.hh_vorhaben_verlauf (vorhaben_id, art, wer, text, created_by)
    values (p_id, 'system', p_by, 'Status: ' || v_neu.status, p_by);
    v_eintraege := v_eintraege + 1;
  end if;

  return jsonb_build_object('vorhaben', to_jsonb(v_neu), 'ball_geaendert', v_ball_neu, 'verlauf', v_eintraege);
end;
$fn$;

create or replace function public.hh_punkt_save(p_id uuid, p_patch jsonb, p_by text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_alt public.hh_vorhaben_punkte;
  v_neu public.hh_vorhaben_punkte;
  v_k text;
begin
  select * into v_alt from public.hh_vorhaben_punkte where id = p_id for update;
  if not found then raise exception 'Punkt % gibt es nicht', p_id using errcode = 'PT404'; end if;
  -- V31b Runde 2: p_patch.expect nennt je Feld den Wert, den die Person zuletzt gesehen hat. Hat jemand anderes
  -- das Feld inzwischen geändert, bricht das Speichern ab, statt die fremde Änderung still zu überschreiben.
  if jsonb_typeof(p_patch->'expect') = 'object' then
    for v_k in select jsonb_object_keys(p_patch->'expect') loop
      if (to_jsonb(v_alt)->v_k) is distinct from (p_patch->'expect'->v_k) then
        raise exception 'Inzwischen geändert (%), bitte neu laden', v_k using errcode = 'PT409';
      end if;
    end loop;
  end if;
  update public.hh_vorhaben_punkte set
    titel    = case when p_patch ? 'titel' then p_patch->>'titel' else titel end,
    position = case when p_patch ? 'position' then p_patch->>'position' else position end,
    stand    = case when p_patch ? 'stand' then p_patch->>'stand' else stand end,
    wer      = case when p_patch ? 'wer' then p_patch->>'wer' else wer end,
    frist    = case when p_patch ? 'frist' then (p_patch->>'frist')::date else frist end,
    sort     = case when p_patch ? 'sort' then (p_patch->>'sort')::int else sort end
  where id = p_id returning * into v_neu;
  if coalesce(v_neu.stand, '') is distinct from coalesce(v_alt.stand, '') then
    insert into public.hh_vorhaben_verlauf (vorhaben_id, punkt_id, art, wer, text, created_by)
    values (v_neu.vorhaben_id, v_neu.id, 'system', p_by,
            'Punkt ' || v_neu.titel || ': ' || coalesce(nullif(btrim(v_neu.stand), ''), 'Stand gestrichen'), p_by);
  end if;
  return jsonb_build_object('punkt', to_jsonb(v_neu));
end;
$fn$;
