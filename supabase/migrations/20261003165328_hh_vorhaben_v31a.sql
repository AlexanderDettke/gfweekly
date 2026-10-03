-- Das Hohe Haus · V31a (03.10.2026) · Vorhaben: Backend fertigstellen.
-- 1. Sicht hh_vorhaben_lage neu, damit ball_vor_abwesenheit und absence_id drin sind (v.* wurde beim ersten Anlegen
--    expandiert). Dazu die nächste offene Punkt-Frist und die maßgebliche Frist, nach der Woche und Zustand rechnen.
-- 2. updated_at per Trigger an hh_vorhaben und hh_vorhaben_punkte.
-- 3. Verlauf kennt den Punkt, auf den er sich bezieht (punkt_delete prüft daran).
-- 4. hh_vorhaben_save: Feldänderung, Ballwechsel und Verlauf in einem Zug.
-- 5. hh_handover_set kennt Vorhaben-Zeilen (Vertretung setzt den Ball, Ruhe lässt ihn liegen).
-- 6. hh_vorhaben_zurueck: Bälle nach der Abwesenheit zurück.
set lock_timeout = '10s';

-- 3. Bezug Verlauf zu Punkt
alter table public.hh_vorhaben_verlauf add column if not exists punkt_id uuid references public.hh_vorhaben_punkte(id) on delete set null;
create index if not exists hh_vorhaben_verlauf_punkt on public.hh_vorhaben_verlauf(punkt_id) where punkt_id is not null;

-- 2. updated_at
create or replace function public.hh_touch_updated_at()
returns trigger
language plpgsql
set search_path = public
as $fn$
begin
  new.updated_at := now();
  return new;
end;
$fn$;
drop trigger if exists hh_vorhaben_touch on public.hh_vorhaben;
create trigger hh_vorhaben_touch before update on public.hh_vorhaben
  for each row execute function public.hh_touch_updated_at();
drop trigger if exists hh_vorhaben_punkte_touch on public.hh_vorhaben_punkte;
create trigger hh_vorhaben_punkte_touch before update on public.hh_vorhaben_punkte
  for each row execute function public.hh_touch_updated_at();

-- 1. Sicht
drop view if exists public.hh_vorhaben_lage;
create view public.hh_vorhaben_lage with (security_invoker = on) as
select v.*,
  pf.punkt_frist,
  coalesce(v.frist, pf.punkt_frist) as frist_massgeblich,
  (select count(*) from public.hh_vorhaben_punkte p where p.vorhaben_id = v.id) as punkte_gesamt,
  (select count(*) from public.hh_vorhaben_punkte p where p.vorhaben_id = v.id and p.erledigt) as punkte_erledigt,
  (select max(e.happened_at) from public.hh_vorhaben_verlauf e where e.vorhaben_id = v.id and e.status = 'bestaetigt') as zuletzt_bewegt,
  (select count(*) from public.gfweekly_topics t where t.vorhaben_id = v.id and t.archived = false) as themen_offen,
  (select count(*) from public.gfweekly_news n where n.vorhaben_id = v.id and n.kind = 'kandidat' and n.status = 'neu') as kandidaten_neu,
  (select count(*) from public.hh_einwurf w where w.vorhaben_id = v.id and w.status in ('neu','vorgeschlagen')) as einwuerfe_offen,
  (select count(*) from public.hh_vorhaben_verlauf e where e.vorhaben_id = v.id and e.status = 'vorschlag') as vorschlaege_offen,
  case
    when v.ball = 'offen' then 'ball_fehlt'
    when coalesce(v.frist, pf.punkt_frist) is not null
         and coalesce(v.frist, pf.punkt_frist) < (now() at time zone 'Europe/Berlin')::date
         and v.status = 'aktiv' then 'ueberfaellig'
    when exists (select 1 from public.hh_vorhaben_verlauf e where e.vorhaben_id = v.id and e.status = 'bestaetigt' and e.happened_at > now() - interval '48 hours') then 'bewegt'
    else 'ruhig'
  end as zustand
from public.hh_vorhaben v
left join lateral (
  select min(p.frist) as punkt_frist from public.hh_vorhaben_punkte p
  where p.vorhaben_id = v.id and not p.erledigt and p.frist is not null
) pf on true;
revoke all on public.hh_vorhaben_lage from anon, authenticated;
grant select on public.hh_vorhaben_lage to service_role;

-- Ball als Wort, wie er im Verlauf steht.
create or replace function public.hh_ball_wort(p_ball text, p_name text)
returns text
language sql
immutable
set search_path = public
as $fn$
  select case p_ball
    when 'alex' then 'Alex'
    when 'lea' then 'Lea'
    when 'gf' then 'GF gemeinsam'
    when 'team' then coalesce(nullif(btrim(p_name), ''), 'Team')
    when 'extern' then coalesce(nullif(btrim(p_name), ''), 'extern')
    else 'niemand' end;
$fn$;

-- 4. Speichern mit Verlauf. Die Werte prüft die Edge Function (erlaubte Felder, Ballwerte, Datum); hier passiert
--    nur, was zusammengehört: die Zeile, ball_seit und die Verlaufseinträge, alles oder nichts.
--    p_patch.expect_ball: wer den Ball weitergibt, sagt, wo er ihn gesehen hat. Liegt er inzwischen woanders
--    (Alex und Lea gleichzeitig), bricht der Wechsel ab, statt still zu überschreiben.
--    p_anlass: 'abwesenheit' lässt die Bindung an eine Abwesenheit stehen; jeder andere Ballwechsel löst sie,
--    damit die Rückgabe nach der Abwesenheit keinen von Hand gesetzten Ball überschreibt.
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
begin
  select * into v_alt from public.hh_vorhaben where id = p_id for update;
  if not found then raise exception 'Vorhaben % gibt es nicht', p_id using errcode = 'no_data_found'; end if;
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
revoke all on function public.hh_vorhaben_save(uuid, jsonb, text, text, text) from public, anon, authenticated;
grant execute on function public.hh_vorhaben_save(uuid, jsonb, text, text, text) to service_role;

-- 6. Rückgabe nach der Abwesenheit. Betroffen sind nur Vorhaben, die noch an dieser Abwesenheit hängen; wer den Ball
--    zwischendurch von Hand bewegt hat, hat die Bindung gelöst (hh_vorhaben_save). Der Verlaufseintrag trägt einen
--    festen source_ref, damit Rückkehr-Seite und doppelte Aufrufe ihn wiederfinden und nicht verdoppeln.
create or replace function public.hh_vorhaben_zurueck(p_absence uuid, p_by text, p_vorhaben uuid default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_abs public.gfweekly_absences;
  v record;
  v_ziel text;
  v_out jsonb := '[]'::jsonb;
begin
  select * into v_abs from public.gfweekly_absences where id = p_absence;
  if not found then raise exception 'Abwesenheit % gibt es nicht', p_absence using errcode = 'no_data_found'; end if;
  for v in select * from public.hh_vorhaben where absence_id = p_absence and (p_vorhaben is null or id = p_vorhaben) for update loop
    v_ziel := coalesce(v.ball_vor_abwesenheit, v.ball);
    update public.hh_vorhaben set
      ball = v_ziel,
      ball_name = case when v_ziel = v.ball then ball_name else null end,
      ball_seit = case when v_ziel = v.ball then ball_seit else now() end,
      ball_vor_abwesenheit = null, absence_id = null, updated_by = p_by
    where id = v.id;
    insert into public.hh_vorhaben_verlauf (vorhaben_id, art, wer, text, source_ref, created_by)
    values (v.id, 'uebergabe', p_by,
            case when v_ziel = v.ball
                 then 'Abwesenheit von ' || v_abs.person || ' vorbei, der Ball bleibt bei ' || public.hh_ball_wort(v.ball, v.ball_name)
                 else 'Zurück nach der Abwesenheit von ' || v_abs.person || ': Ball von ' || public.hh_ball_wort(v.ball, v.ball_name)
                      || ' an ' || public.hh_ball_wort(v_ziel, null) end,
            'abwesenheit:' || p_absence || ':zurueck:' || v.id, p_by)
    on conflict (source_ref) do nothing;
    v_out := v_out || jsonb_build_object('id', v.id, 'slug', v.slug, 'title', v.title, 'von', v.ball, 'an', v_ziel);
  end loop;
  return jsonb_build_object('zurueck', v_out);
end;
$fn$;
revoke all on function public.hh_vorhaben_zurueck(uuid, text, uuid) from public, anon, authenticated;
grant execute on function public.hh_vorhaben_zurueck(uuid, text, uuid) to service_role;

-- 5. Übergabe: wie 20260921232441_hh_handover_set_ruhe, ergänzt um Vorhaben-Zeilen.
--    Vertretung gesetzt: ball_vor_abwesenheit = Ball vor der Abwesenheit, Ball = Person der Vertretung, absence_id gesetzt,
--    Verlauf „in Vertretung für <Person> bis <bis>“. Ampel ruht: Ball bleibt (oder kehrt von einer früheren Vertretung
--    zurück), Verlauf „ruht bis <bis + 1 Tag>“. Vertretung entfernt oder Ruhe aufgehoben: Ball zurück, Bindung gelöst.
--    Ein Verlaufseintrag entsteht nur, wenn sich Status, Ampel oder Vertretung der Zeile wirklich geändert haben.
create or replace function public.hh_handover_set(p_id uuid, p_by text, p_patch jsonb default '{}'::jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_row public.gfweekly_handover;
  v_alt public.gfweekly_handover;
  v_abs public.gfweekly_absences;
  v_vh public.hh_vorhaben;
  v_ampel text; v_vertretung text; v_status text; v_alt_vertretung text;
  v_ende date; v_gate text; v_wort text;
  v_ruhte boolean;
  v_vorgang jsonb := null;
  v_ball0 text; v_ball text; v_ball_name text; v_bis text; v_text text;
  v_geaendert boolean;
begin
  select * into v_alt from public.gfweekly_handover where id = p_id for update;
  if not found then raise exception 'Korbzeile % gibt es nicht', p_id using errcode = 'no_data_found'; end if;
  select * into v_abs from public.gfweekly_absences where id = v_alt.absence_id for update;
  if not found then raise exception 'Zur Korbzeile % fehlt die Abwesenheit', p_id using errcode = 'no_data_found'; end if;

  v_alt_vertretung := nullif(btrim(coalesce(v_alt.vertretung,'')), '');
  v_ampel := coalesce(p_patch->>'ampel', v_alt.ampel);
  v_status := coalesce(p_patch->>'status', 'bestaetigt');
  if p_patch ? 'vertretung' then v_vertretung := nullif(btrim(coalesce(p_patch->>'vertretung','')), '');
  else v_vertretung := v_alt_vertretung; end if;
  -- Was ruht oder vor der Abreise erledigt sein soll, wird nicht vertreten.
  if v_ampel in ('ruht','vorher') then v_vertretung := null; end if;
  -- Lag die Zeile vorher auf „ruht“ und liegt jetzt nicht mehr, ist die Ruhe aufgehoben.
  v_ruhte := coalesce(v_alt.ampel, '') = 'ruht' and coalesce(v_ampel, '') <> 'ruht';
  v_geaendert := coalesce(v_alt.status,'') || '|' || coalesce(v_alt.ampel,'') || '|' || coalesce(v_alt_vertretung,'')
              <> v_status || '|' || coalesce(v_ampel,'') || '|' || coalesce(v_vertretung,'');

  update public.gfweekly_handover set
    cluster    = coalesce(p_patch->>'cluster', cluster),
    ampel      = v_ampel,
    vertretung = v_vertretung,
    frist      = case when p_patch ? 'frist' then nullif(p_patch->>'frist','')::date else frist end,
    regel_note = case when p_patch ? 'regel_note' then nullif(p_patch->>'regel_note','') else regel_note end,
    status     = v_status,
    by         = p_by,
    updated_at = now()
  where id = p_id
  returning * into v_row;

  v_ende := coalesce(v_abs.bis, v_abs.bis_geschaetzt, v_abs.von + 13);

  if v_row.kind = 'thema' then
    if v_ampel = 'ruht' then
      update public.gfweekly_topics set
        handover_id = v_row.id, owner_backup = null, gate = 'warten', gate_frist = v_ende + 1,
        gate_by = p_by, gate_at = now(), gate_note = 'ruht bis zur Rückkehr von ' || v_abs.person,
        updated_at = now()
      where id = v_row.ref_id::uuid
      returning jsonb_build_object('id', id, 'gate', gate, 'owner_backup', owner_backup) into v_vorgang;
    elsif v_vertretung is not null then
      v_gate := public.hh_person_gate(v_vertretung, 'team');
      update public.gfweekly_topics set
        handover_id = v_row.id, owner_backup = v_vertretung, gate = v_gate,
        -- Eine aufgehobene Ruhe nimmt ihre Rückkehrfrist mit; eine sonst gesetzte Frist bleibt.
        gate_frist = case when v_ruhte then null else gate_frist end,
        gate_by = p_by, gate_at = now(), gate_note = 'in Vertretung für ' || v_abs.person,
        updated_at = now()
      where id = v_row.ref_id::uuid
      returning jsonb_build_object('id', id, 'gate', gate, 'owner_backup', owner_backup) into v_vorgang;
    elsif v_alt_vertretung is not null or v_ruhte then
      -- Vertretung entfernt oder Ruhe aufgehoben: der Ausgang gehört wieder der abwesenden Person.
      v_gate := public.hh_person_gate(v_abs.person, 'gf');
      update public.gfweekly_topics set
        handover_id = v_row.id, owner_backup = null, gate = v_gate,
        gate_frist = case when v_ruhte then null else gate_frist end,
        gate_by = p_by, gate_at = now(),
        gate_note = case when v_ruhte then 'Ruhe aufgehoben, wieder bei ' || v_abs.person
                         else 'wieder bei ' || v_abs.person end,
        updated_at = now()
      where id = v_row.ref_id::uuid
      returning jsonb_build_object('id', id, 'gate', gate, 'owner_backup', owner_backup) into v_vorgang;
    else
      -- Zeilen ohne Vertretung (etwa „vor Abreise“) behalten ihren Ausgang.
      update public.gfweekly_topics set handover_id = v_row.id, updated_at = now()
      where id = v_row.ref_id::uuid
      returning jsonb_build_object('id', id, 'gate', gate, 'owner_backup', owner_backup) into v_vorgang;
    end if;
    if v_vorgang is null then
      raise exception 'Thema % zur Korbzeile % gibt es nicht', v_row.ref_id, p_id using errcode = 'no_data_found';
    end if;
  end if;

  if v_row.kind = 'vorhaben' then
    select * into v_vh from public.hh_vorhaben where id = v_row.ref_id::uuid for update;
    if not found then
      raise exception 'Vorhaben % zur Korbzeile % gibt es nicht', v_row.ref_id, p_id using errcode = 'no_data_found';
    end if;
    -- Der Ball vor dieser Abwesenheit: steht schon fest, wenn die Zeile vorher bestätigt wurde.
    v_ball0 := case when v_vh.absence_id = v_abs.id and v_vh.ball_vor_abwesenheit is not null
                    then v_vh.ball_vor_abwesenheit else v_vh.ball end;
    v_bis := coalesce(to_char(coalesce(v_abs.bis, v_abs.bis_geschaetzt), 'DD.MM.YYYY'), 'auf Weiteres');
    v_text := null;
    if v_ampel = 'ruht' then
      v_ball := v_ball0;
      v_ball_name := case when v_ball = v_vh.ball then v_vh.ball_name else null end;
      update public.hh_vorhaben set
        ball = v_ball, ball_name = v_ball_name,
        ball_seit = case when v_ball = v_vh.ball then ball_seit else now() end,
        ball_vor_abwesenheit = v_ball0, absence_id = v_abs.id, updated_by = p_by
      where id = v_vh.id;
      v_text := 'ruht bis ' || to_char(v_ende + 1, 'DD.MM.YYYY') || ', Abwesenheit von ' || v_abs.person;
    elsif v_vertretung is not null then
      v_ball := public.hh_person_gate(v_vertretung, 'team');
      v_ball_name := case when v_ball = 'team' then v_vertretung else null end;
      update public.hh_vorhaben set
        ball = v_ball, ball_name = v_ball_name,
        ball_seit = case when v_ball = v_vh.ball and coalesce(v_ball_name,'') = coalesce(v_vh.ball_name,'') then ball_seit else now() end,
        ball_vor_abwesenheit = v_ball0, absence_id = v_abs.id, updated_by = p_by
      where id = v_vh.id;
      v_text := 'in Vertretung für ' || v_abs.person || ' bis ' || v_bis
             || ' (Ball von ' || public.hh_ball_wort(v_vh.ball, v_vh.ball_name) || ' an ' || public.hh_ball_wort(v_ball, v_ball_name) || ')';
    elsif (v_alt_vertretung is not null or v_ruhte) and v_vh.absence_id = v_abs.id then
      update public.hh_vorhaben set
        ball = v_ball0, ball_name = case when v_ball0 = v_vh.ball then ball_name else null end,
        ball_seit = case when v_ball0 = v_vh.ball then ball_seit else now() end,
        ball_vor_abwesenheit = null, absence_id = null, updated_by = p_by
      where id = v_vh.id;
      v_text := case when v_ruhte then 'Ruhe aufgehoben, ' else 'Vertretung aufgehoben, ' end
             || 'Ball wieder bei ' || public.hh_ball_wort(v_ball0, null);
    end if;
    if v_text is not null and v_geaendert then
      insert into public.hh_vorhaben_verlauf (vorhaben_id, art, wer, text, created_by)
      values (v_vh.id, 'uebergabe', p_by, v_text, p_by);
    end if;
    select jsonb_build_object('id', id, 'ball', ball, 'ball_name', ball_name, 'absence_id', absence_id)
      into v_vorgang from public.hh_vorhaben where id = v_vh.id;
  end if;

  v_wort := case when v_ampel = 'ruht' then 'ruht bis zur Rückkehr'
                 when v_vertretung is not null then 'geht an ' || v_vertretung
                 else 'bestätigt' end;
  insert into public.gfweekly_handover_log (absence_id, handover_id, art, who, text)
  values (v_abs.id, v_row.id,
          case when v_status = 'erledigt' then 'erledigt'
               when v_vertretung is not null then 'weitergabe' else 'notiz' end,
          p_by,
          coalesce(v_row.title,'ohne Titel') || ': ' || v_wort || ' (Ampel ' || coalesce(v_ampel,'offen') || ').'
          || case when v_ruhte then ' Die Ruhe ist aufgehoben.' else '' end);

  return jsonb_build_object('item', to_jsonb(v_row), 'vorgang', v_vorgang);
end;
$fn$;

revoke all on function public.hh_handover_set(uuid, text, jsonb) from public, anon, authenticated;
grant execute on function public.hh_handover_set(uuid, text, jsonb) to service_role;
