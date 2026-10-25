-- Kompass · Stufe 2, Korrekturen nach Codex-Runde 1 (26.10.2026, docs/reviews/STUFE2-runde-1.md):
-- 1. hh_entscheidung_umhaengen prüft die Zielquelle (vorhanden, offen, bei der GF) und p_by (Befund 1).
-- 2. hh_entscheidung_zurueck (Fassung aus 20261025163000 mit Vergleichsstand und 409) stellt bei Themen archived und archiv_grund, bei Kandidaten archiviert_at wieder her (Befund 2).
-- 3. hh_entscheidungen_sammelaktion „hinfällig“ bricht bei erledigter, archivierter oder fehlender Quelle mit PT409 ab (Befund 6).
-- 4. hh_absence_end_s2: Ende und Korbabschluss in einer Transaktion (Befund 5), Vorschläge entfallen ohne Verlauf (Befund 4).
-- Rückweg: die Fassungen aus 20261025150500, 20261025210000 und 20261025220000 erneut anwenden; drop function public.hh_absence_end_s2(uuid,text);
set lock_timeout = '10s';

create or replace function public.hh_entscheidung_umhaengen(p_id uuid, p_art text, p_quelle_id uuid, p_by text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_e public.hh_entscheidungen;
  v_vorhaben uuid;
  v_by text := public.hh_en_person(p_by);
  v_ok boolean;
begin
  if p_art not in ('punkt','thema','kandidat') then raise exception 'art: punkt, thema oder kandidat' using errcode = 'PT400'; end if;
  select * into v_e from public.hh_entscheidungen where id = p_id for update;
  if not found then raise exception 'Entscheidung gibt es nicht' using errcode = 'PT404'; end if;
  -- Runde 1, Befund 1: die Zielquelle muss es geben, sie muss offen sein und bei der GF liegen (sperrt sie zugleich).
  v_ok := public.hh_en_quelle_eignung(p_art, p_quelle_id);
  if v_ok is null then raise exception 'Die neue Quelle gibt es nicht' using errcode = 'PT409'; end if;
  if not v_ok then raise exception 'Die neue Quelle ist erledigt, archiviert oder nicht bei der GF' using errcode = 'PT409'; end if;
  if exists (select 1 from public.hh_entscheidungen where quelle_art = p_art and quelle_id = p_quelle_id and id <> p_id) then
    raise exception 'Zur neuen Quelle gibt es schon eine Entscheidung' using errcode = 'PT409'; end if;
  if p_art = 'punkt' then select vorhaben_id into v_vorhaben from public.hh_vorhaben_punkte where id = p_quelle_id;
  elsif p_art = 'thema' then select vorhaben_id into v_vorhaben from public.gfweekly_topics where id = p_quelle_id;
  else select vorhaben_id into v_vorhaben from public.gfweekly_news where id = p_quelle_id; end if;
  update public.hh_entscheidungen set quelle_art = p_art, quelle_id = p_quelle_id, vorhaben_id = coalesce(v_vorhaben, vorhaben_id),
    status = case when status = 'hinfaellig' then 'offen' else status end, rueckweg = null, rueckweg_at = null, updated_at = now()
   where id = p_id returning * into v_e;
  return jsonb_build_object('entscheidung', to_jsonb(v_e), 'von', v_by);
end;
$fn$;

create or replace function public.hh_entscheidung_zurueck(p_id uuid, p_by text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_e public.hh_entscheidungen;
  v_by text := public.hh_en_person(p_by);
  v_o jsonb;
  v_eig jsonb;
  v_jetzt jsonb;
begin
  select * into v_e from public.hh_entscheidungen where id = p_id for update;
  if not found then raise exception 'Entscheidung gibt es nicht' using errcode = 'PT404'; end if;
  if v_e.rueckweg is null then raise exception 'Nichts zum Zurücknehmen' using errcode = 'PT409'; end if;
  if v_e.rueckweg_at < now() - interval '24 hours' then raise exception 'Rückgängig geht nur innerhalb von 24 Stunden' using errcode = 'PT409'; end if;
  v_o := v_e.rueckweg->'original'; v_eig := v_e.rueckweg->'eigen';
  -- Quelle sperren und mit dem Stand nach der Aktion vergleichen: hat jemand sie seither geändert, kein stilles Überschreiben.
  perform public.hh_en_quelle_eignung(v_e.quelle_art, v_e.quelle_id);
  v_jetzt := public.hh_en_original(v_e.quelle_art, v_e.quelle_id);
  if v_jetzt is null then raise exception 'Die Quelle gibt es nicht mehr; Rückgängig nicht möglich' using errcode = 'PT409'; end if;
  if (v_e.rueckweg ? 'nach') and v_jetzt is distinct from v_e.rueckweg->'nach' then
    raise exception 'Die Quelle wurde seit der Aktion geändert; Rückgängig nicht möglich, bitte von Hand nachsehen' using errcode = 'PT409';
  end if;

  if v_e.quelle_art = 'punkt' then
    update public.hh_vorhaben_punkte set
      erledigt = coalesce((v_o->>'erledigt')::boolean, erledigt), erledigt_at = (v_o->>'erledigt_at')::timestamptz, erledigt_by = v_o->>'erledigt_by',
      wer = case when v_o ? 'wer' then v_o->>'wer' else wer end, frist = case when v_o ? 'frist' then (v_o->>'frist')::date else frist end, updated_at = now()
     where id = v_e.quelle_id;
  elsif v_e.quelle_art = 'thema' then
    update public.gfweekly_topics set
      board_lane = coalesce(v_o->>'board_lane', board_lane), status = coalesce(v_o->>'status', status), decision = coalesce(v_o->>'decision', ''),
      resolved_at = (v_o->>'resolved_at')::timestamptz, gate = v_o->>'gate', gate_by = v_o->>'gate_by', gate_at = (v_o->>'gate_at')::timestamptz,
      gate_frist = (v_o->>'gate_frist')::date, last_discussed = (v_o->>'last_discussed')::date, updated_at = now(),
      archived = coalesce((v_o->>'archived')::boolean, archived), archiv_grund = case when v_o ? 'archiv_grund' then v_o->>'archiv_grund' else archiv_grund end
     where id = v_e.quelle_id;
  else
    update public.gfweekly_news set
      status = coalesce(v_o->>'status', status), decided_by = coalesce(v_o->>'decided_by', ''), decided_at = (v_o->>'decided_at')::timestamptz,
      archiv_grund = v_o->>'archiv_grund', gate = v_o->>'gate', gate_by = v_o->>'gate_by', gate_at = (v_o->>'gate_at')::timestamptz,
      gate_frist = (v_o->>'gate_frist')::date,
      archiviert_at = case when v_o ? 'archiviert_at' then (v_o->>'archiviert_at')::timestamptz else archiviert_at end
     where id = v_e.quelle_id;
  end if;
  if (v_e.rueckweg->>'verlauf_id') is not null then delete from public.hh_vorhaben_verlauf where id = (v_e.rueckweg->>'verlauf_id')::uuid; end if;
  if (v_e.rueckweg->>'decision_id') is not null then delete from public.gfweekly_decisions where id = (v_e.rueckweg->>'decision_id')::uuid; end if;

  update public.hh_entscheidungen set
    status = coalesce(v_eig->>'status', 'offen'),
    ergebnis = case when v_eig ? 'ergebnis' then v_eig->>'ergebnis' else ergebnis end,
    entschieden_am = case when v_eig ? 'entschieden_am' then (v_eig->>'entschieden_am')::timestamptz else entschieden_am end,
    entschieden_von = case when v_eig ? 'entschieden_von' then v_eig->>'entschieden_von' else entschieden_von end,
    frist = case when v_eig ? 'frist' then (v_eig->>'frist')::date else frist end,
    frist_quelle = case when v_eig ? 'frist_quelle' then v_eig->>'frist_quelle' else frist_quelle end,
    vertagt_bis = case when v_eig ? 'vertagt_bis' then (v_eig->>'vertagt_bis')::date else vertagt_bis end,
    abgegeben_an = case when v_eig ? 'abgegeben_an' then v_eig->>'abgegeben_an' else abgegeben_an end,
    rueckweg = null, rueckweg_at = null, updated_at = now()
   where id = p_id returning * into v_e;
  return jsonb_build_object('entscheidung', to_jsonb(v_e), 'geaendert', true, 'von', v_by);
end;
$fn$;

create or replace function public.hh_entscheidungen_sammelaktion(p_items jsonb, p_aktion text, p_wert text, p_by text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_by text := public.hh_en_person(p_by);
  v_it jsonb;
  v_id uuid;
  v_e public.hh_entscheidungen;
  v_r jsonb;
  v_erg jsonb := '[]'::jsonb;
  v_ok int := 0;
  v_bis date;
  v_vorher jsonb;
  v_orig jsonb;
  v_verlauf uuid;
  v_ok2 boolean;
begin
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 or jsonb_array_length(p_items) > 200 then
    raise exception 'items: 1 bis 200 Entscheidungen' using errcode = 'PT400'; end if;
  if p_aktion not in ('nicht_jetzt','abgeben','hinfaellig') then raise exception 'aktion: nicht_jetzt, abgeben oder hinfaellig' using errcode = 'PT400'; end if;
  if p_aktion = 'nicht_jetzt' then
    v_bis := coalesce(nullif(p_wert, '')::date, (current_date + 28) + ((8 - extract(isodow from current_date + 28)::int) % 7));
    if v_bis < current_date then raise exception 'Datum ab heute' using errcode = 'PT400'; end if;
  end if;
  if p_aktion = 'abgeben' and p_wert not in ('alex','lea','team') then raise exception 'abgeben an alex, lea oder team' using errcode = 'PT400'; end if;
  for v_it in select * from jsonb_array_elements(p_items) loop
    begin
      v_id := (v_it->>'id')::uuid;
      select * into v_e from public.hh_entscheidungen where id = v_id for update;
      if not found then raise exception 'Entscheidung gibt es nicht' using errcode = 'PT404'; end if;
      if (v_it ? 'expect_updated_at') and (v_it->>'expect_updated_at') is not null and date_trunc('milliseconds', (v_it->>'expect_updated_at')::timestamptz) is distinct from date_trunc('milliseconds', v_e.updated_at) then
        raise exception 'inzwischen geändert' using errcode = 'PT409'; end if;
      v_vorher := jsonb_build_object('status', v_e.status, 'vertagt_bis', v_e.vertagt_bis, 'frist', v_e.frist, 'frist_quelle', v_e.frist_quelle, 'abgegeben_an', v_e.abgegeben_an);
      if p_aktion = 'nicht_jetzt' then
        v_r := public.hh_entscheidung_vertagen(v_id, v_bis, v_by);
      elsif p_aktion = 'abgeben' then
        v_r := public.hh_entscheidung_abgeben(v_id, p_wert, v_by);
      else
        if v_e.status not in ('offen','vertagt') then raise exception 'nur offene oder vertagte Zeilen' using errcode = 'PT409'; end if;
        v_ok2 := public.hh_en_quelle_eignung(v_e.quelle_art, v_e.quelle_id);
        if v_ok2 is null then raise exception 'Die Quelle gibt es nicht mehr; bitte neu laden' using errcode = 'PT409'; end if;
        if not v_ok2 then raise exception 'Die Quelle ist inzwischen erledigt, archiviert oder weitergegeben; bitte neu laden' using errcode = 'PT409'; end if;
        v_orig := public.hh_en_original(v_e.quelle_art, v_e.quelle_id);
        v_verlauf := null;
        if v_e.quelle_art = 'punkt' then
          update public.hh_vorhaben_punkte set erledigt = true, erledigt_at = now(), erledigt_by = v_by, updated_at = now() where id = v_e.quelle_id and erledigt = false;
          insert into public.hh_vorhaben_verlauf (vorhaben_id, punkt_id, art, wer, text, status, created_by)
            select vorhaben_id, id, 'system', v_by, 'Punkt hinfällig (Entscheidungsliste): ' || titel, 'bestaetigt', 'kompass' from public.hh_vorhaben_punkte where id = v_e.quelle_id
            returning id into v_verlauf;
        elsif v_e.quelle_art = 'thema' then
          update public.gfweekly_topics set archived = true, archiv_grund = 'hinfaellig', updated_at = now() where id = v_e.quelle_id and archived = false;
        else
          update public.gfweekly_news set status = 'verworfen', decided_by = v_by, decided_at = now() where id = v_e.quelle_id and status = 'neu';
        end if;
        update public.hh_entscheidungen set status = 'hinfaellig',
          rueckweg = jsonb_build_object('aktion', 'hinfaellig', 'eigen', v_vorher, 'original', v_orig, 'nach', public.hh_en_original(v_e.quelle_art, v_e.quelle_id), 'verlauf_id', v_verlauf),
          rueckweg_at = now(), updated_at = now()
         where id = v_id returning * into v_e;
        v_r := jsonb_build_object('entscheidung', to_jsonb(v_e), 'geaendert', true);
      end if;
      v_ok := v_ok + 1;
      v_erg := v_erg || jsonb_build_object('id', v_id, 'ok', true, 'vorher', v_vorher, 'entscheidung', v_r->'entscheidung');
    exception when others then
      v_erg := v_erg || jsonb_build_object('id', v_it->>'id', 'ok', false, 'grund', sqlerrm, 'konflikt', sqlstate = 'PT409');
    end;
  end loop;
  return jsonb_build_object('ok', v_ok, 'gesamt', jsonb_array_length(p_items), 'aktion', p_aktion, 'wert', coalesce(v_bis::text, p_wert), 'ergebnis', v_erg);
end;
$fn$;

-- Runde 1, Befund 5: Ende der Abwesenheit und Korbabschluss in einer Transaktion. Bestätigte, nicht erledigte Zeilen gelten als liegen
-- geblieben (Verlaufseintrag am Vorhaben), unbestätigte Vorschläge entfallen ohne Eintrag (Befund 4: sie waren nie Arbeit der Vertretung,
-- bleiben aber im Rückkehr-Lagebild, solange die Abwesenheit läuft).
create or replace function public.hh_absence_end_s2(p_id uuid, p_by text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_r jsonb;
  v_person text;
  v_liegen int := 0;
  v_entfallen int := 0;
  z record;
begin
  v_r := public.hh_absence_end(p_id, p_by);
  v_person := v_r->'absence'->>'person';
  for z in select h.id, h.kind, h.ref_id, h.title, h.ampel, h.status from public.gfweekly_handover h
            where h.absence_id = p_id and h.status in ('vorschlag','bestaetigt') for update loop
    if z.status = 'bestaetigt' and z.kind = 'vorhaben' and exists (select 1 from public.hh_vorhaben v where v.id::text = z.ref_id) then
      insert into public.hh_vorhaben_verlauf (vorhaben_id, art, wer, status, created_by, text, source_ref)
      values (z.ref_id::uuid, 'system', p_by, 'bestaetigt', 'kompass',
              left('In der Abwesenheit von ' || coalesce(v_person, '?') || ' liegen geblieben (Korb ' || coalesce(z.ampel, 'offen') || '): ' || coalesce(z.title, ''), 500),
              'abwesenheit:' || p_id || ':liegen:' || z.id)
      on conflict (source_ref) do nothing;
      v_liegen := v_liegen + 1;
    else
      v_entfallen := v_entfallen + 1;
    end if;
    update public.gfweekly_handover set status = 'entfallen', updated_at = now() where id = z.id;
  end loop;
  return v_r || jsonb_build_object('liegen_geblieben', v_liegen, 'entfallen', v_entfallen);
end;
$fn$;
revoke all on function public.hh_absence_end_s2(uuid, text) from public, anon, authenticated;
grant execute on function public.hh_absence_end_s2(uuid, text) to service_role;
