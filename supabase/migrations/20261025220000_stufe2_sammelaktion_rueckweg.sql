-- Kompass · Stufe 2 (25.10.2026): hh_entscheidungen_sammelaktion legt für „hinfällig“ den vollständigen Rückweg ab (original und nach),
-- damit hh_entscheidung_zurueck die Quelle wiederherstellt statt Felder zu leeren. Ersetzt die Fassung aus 20261025210000.
set lock_timeout = '10s';

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
        perform public.hh_en_quelle_eignung(v_e.quelle_art, v_e.quelle_id);
        v_orig := public.hh_en_original(v_e.quelle_art, v_e.quelle_id);
        if v_orig is null then raise exception 'Die Quelle gibt es nicht mehr' using errcode = 'PT409'; end if;
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
revoke all on function public.hh_entscheidungen_sammelaktion(jsonb, text, text, text) from public, anon, authenticated;
grant execute on function public.hh_entscheidungen_sammelaktion(jsonb, text, text, text) to service_role;
