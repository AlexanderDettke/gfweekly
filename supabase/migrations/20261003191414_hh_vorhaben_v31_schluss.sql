-- Das Hohe Haus · V31, Nacharbeit aus den letzten Runden 31c, 31d und der Gesamtprüfung (03.10.2026).
-- hh_einwurf_apply: gesehene Werte für Punktstand, nächsten Schritt und Frist; sofort nur aus dem übernommenen Verlauf.
-- hh_absence_end: Ende der Abwesenheit, Rückgabe der Themen und der Vorhaben-Bälle und Protokoll in einer Transaktion.
set lock_timeout = '10s';

drop function if exists public.hh_einwurf_apply(uuid, uuid, jsonb, jsonb, text, text, text, text);
create or replace function public.hh_einwurf_apply(p_id uuid, p_vorhaben uuid, p_auswahl jsonb, p_bearbeitet jsonb, p_benachrichtigung text, p_by text, p_revision text default null, p_expect_ball text default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_ew public.hh_einwurf;
  v_vh public.hh_vorhaben;
  v_vs jsonb;
  v_gleich boolean;
  v_ref text := 'einwurf:' || p_id;
  v_text text; v_art text; v_wer text;
  v_verlauf jsonb := null;
  v_punkte jsonb := '[]'::jsonb;
  v_neue jsonb := '[]'::jsonb;
  v_ueber jsonb := '[]'::jsonb;
  v_felder jsonb := null;
  v_patch jsonb := '{}'::jsonb;
  v_ticker boolean := false;
  v_pid text; v_vp jsonb; v_p public.hh_vorhaben_punkte;
  v_i text; v_n jsonb; v_sort int; v_np public.hh_vorhaben_punkte;
  v_schritt text; v_frist text;
  v_ben text := case when p_benachrichtigung in ('sofort','morgen') then p_benachrichtigung end;
  v_andere text := case when p_by = 'Alex' then 'Lea' else 'Alex' end;
  v_exp jsonb;
  v_e2 jsonb;
  v_seh text;
begin
  select * into v_ew from public.hh_einwurf where id = p_id for update;
  if not found then raise exception 'Einwurf % gibt es nicht', p_id using errcode = 'PT404'; end if;
  if v_ew.status not in ('neu', 'vorgeschlagen') then
    raise exception 'Der Einwurf ist schon %', case when v_ew.status = 'uebernommen' then 'übernommen' else 'verworfen' end
      using errcode = 'PT409';
  end if;
  select * into v_vh from public.hh_vorhaben where id = p_vorhaben for update;
  if not found then raise exception 'Vorhaben % gibt es nicht', p_vorhaben using errcode = 'PT404'; end if;
  v_vs := v_ew.vorschlag;
  -- Runde 2, Befund 5: angewendet wird nur der Vorschlag, den die Person gesehen hat.
  if nullif(v_vs->>'revision', '') is not null and p_revision is distinct from v_vs->>'revision' then
    raise exception 'Der Vorschlag hat sich inzwischen geändert, bitte den Einwurf neu öffnen' using errcode = 'PT409';
  end if;
  -- Runde 3, Befund 2: Vorschläge des Mail-Abgleichs tragen nur den slug (docs/ABGLEICH-VORHABEN.md, Abschnitt D).
  v_gleich := v_vs is not null and (
       (nullif(v_vs->>'vorhaben_id', '') is not null and v_vs->>'vorhaben_id' = p_vorhaben::text)
    or (nullif(v_vs->>'vorhaben_id', '') is null and nullif(v_vs->>'vorhaben_slug', '') is not null and v_vs->>'vorhaben_slug' = v_vh.slug));
  if v_vs is not null and not v_gleich then
    v_ueber := v_ueber || to_jsonb('Der Vorschlag galt für ' || coalesce(v_vs->>'vorhaben_titel', 'ein anderes Vorhaben')
                                   || '; übernommen wird nur der Verlaufseintrag.');
  end if;
  -- Runde 2, Befund 3: beim Zielwechsel gilt die vorgeschlagene Benachrichtigung nicht, nur eine ausdrücklich gewählte.
  v_ben := coalesce(v_ben, case when v_gleich then nullif(v_vs->>'benachrichtigung', '') end, 'morgen');
  -- Gesamtprüfung / 31c Runde 3: gesehene Werte. Was der Dialog anzeigt (p_bearbeitet.expect), sonst was die KI-Prüfung sah.
  v_exp := coalesce(p_bearbeitet->'expect', '{}'::jsonb);

  -- Verlauf
  if v_vs is null or not v_gleich or coalesce((p_auswahl->>'verlauf')::boolean, false) then
    v_text := nullif(btrim(coalesce(p_bearbeitet->>'verlauf_text', '')), '');
    if v_text is null and v_gleich then
      if coalesce(v_vs->'vertraulich', '[]'::jsonb) ? 'verlauf' then
        raise exception 'Der vorgeschlagene Verlaufstext enthält möglicherweise vertrauliche Angaben. Bitte den Text bearbeiten.'
          using errcode = 'PT400';
      end if;
      v_text := nullif(btrim(coalesce(v_vs#>>'{verlauf,text}', '')), '');
    end if;
    v_text := left(coalesce(v_text, v_ew.text), 2000);
    -- Runde 2, Befund 2: was in den Verlauf geht, wird geprüft, gleich woher der Text kommt.
    if public.hh_vertraulich(v_text) then
      raise exception 'Der Text enthält möglicherweise vertrauliche Angaben (Zugangsdaten, Kontonummer, Gesundheit). Bitte den Verlaufstext bearbeiten.'
        using errcode = 'PT400';
    end if;
    v_art := case when v_ew.kanal = 'mail' then 'mail'
                  when v_gleich and v_vs#>>'{verlauf,art}' in ('telefon','mail','whatsapp','notiz','entscheidung','termin','plattform') then v_vs#>>'{verlauf,art}'
                  else 'einwurf' end;
    v_wer := left(case when v_gleich then coalesce(nullif(v_vs#>>'{verlauf,wer}', ''), v_ew.von) else v_ew.von end, 120);
    -- Runde 3, Befund 1: auch wer und tag des Vorschlags gehen in die Akte.
    if public.hh_vertraulich(v_wer) or (v_gleich and public.hh_vertraulich(v_vs#>>'{verlauf,tag}')) then
      raise exception 'Der Vorschlag nennt im Verlauf möglicherweise vertrauliche Angaben (wer oder Stichwort). Bitte den Einwurf verwerfen oder neu eintragen.'
        using errcode = 'PT400';
    end if;
    insert into public.hh_vorhaben_verlauf (vorhaben_id, art, wer, text, tag, happened_at, source_ref, status, created_by)
    values (p_vorhaben, v_art, v_wer, v_text, case when v_gleich then left(nullif(v_vs#>>'{verlauf,tag}', ''), 120) end,
            v_ew.created_at, v_ref, 'bestaetigt', p_by)
    on conflict (source_ref) do nothing;
    select to_jsonb(e) into v_verlauf from public.hh_vorhaben_verlauf e where e.source_ref = v_ref;
  end if;

  if v_gleich then
    -- Punkte: nur IDs aus dem Vorschlag, die zu diesem Vorhaben gehören
    for v_pid in select jsonb_array_elements_text(coalesce(p_auswahl->'punkte', '[]'::jsonb)) loop
      v_vp := null;
      select x into v_vp from jsonb_array_elements(coalesce(v_vs->'punkte', '[]'::jsonb)) x where x->>'id' = v_pid limit 1;
      select * into v_p from public.hh_vorhaben_punkte where id::text = v_pid and vorhaben_id = p_vorhaben for update;
      if v_vp is null or v_p.id is null or v_p.id::text <> v_pid then
        v_ueber := v_ueber || to_jsonb('Punkt ' || coalesce(v_vp->>'titel', v_pid) || ' gehört nicht zu ' || v_vh.title);
        continue;
      end if;
      -- Hat jemand den Punkt seit der Prüfung geändert, gilt der Vorschlag nicht mehr für ihn.
      if (v_exp->'punkte') ? v_pid then v_seh := v_exp->'punkte'->>v_pid;
      elsif v_vp ? 'stand_gesehen' then v_seh := v_vp->>'stand_gesehen';
      else v_seh := v_p.stand; end if;
      if v_seh is distinct from v_p.stand then
        raise exception 'Der Punkt „%“ wurde inzwischen geändert, bitte den Einwurf neu öffnen', v_p.titel using errcode = 'PT409';
      end if;
      if nullif(btrim(coalesce(v_vp->>'stand', '')), '') is not null and v_vp->>'stand' is distinct from v_p.stand then
        if public.hh_vertraulich(v_vp->>'stand') then
          raise exception 'Der vorgeschlagene Stand zu „%“ enthält möglicherweise vertrauliche Angaben. Bitte ohne diesen Punkt übernehmen.', v_p.titel
            using errcode = 'PT400';
        end if;
        perform public.hh_punkt_save(v_p.id, jsonb_build_object('stand', left(v_vp->>'stand', 1000)), p_by);
      end if;
      if coalesce((v_vp->>'erledigt')::boolean, false) and not v_p.erledigt then
        perform public.hh_punkt_toggle(v_p.id, true, p_by, null);
      end if;
      v_punkte := v_punkte || to_jsonb(v_pid);
    end loop;
    -- Neue Punkte nach ihrer Nummer im Vorschlag
    select coalesce(max(sort), 0) + 10 into v_sort from public.hh_vorhaben_punkte where vorhaben_id = p_vorhaben;
    for v_i in select jsonb_array_elements_text(coalesce(p_auswahl->'neue_punkte', '[]'::jsonb)) loop
      v_n := v_vs->'neue_punkte'->(v_i::int);
      if v_n is null or nullif(btrim(coalesce(v_n->>'titel', '')), '') is null then
        v_ueber := v_ueber || to_jsonb('neuer Punkt Nr. ' || v_i || ' fehlt im Vorschlag');
        continue;
      end if;
      if public.hh_vertraulich(v_n->>'titel') or public.hh_vertraulich(v_n->>'wer') then
        raise exception 'Der neue Punkt „%“ enthält möglicherweise vertrauliche Angaben. Bitte ohne ihn übernehmen.', left(v_n->>'titel', 60)
          using errcode = 'PT400';
      end if;
      insert into public.hh_vorhaben_punkte (vorhaben_id, titel, wer, frist, quelle, sort)
      values (p_vorhaben, left(v_n->>'titel', 300), left(nullif(v_n->>'wer', ''), 120),
              public.hh_datum(v_n->>'frist'), v_ref, v_sort)
      returning * into v_np;
      v_neue := v_neue || to_jsonb(v_np); v_sort := v_sort + 10;
    end loop;
    -- Felder
    if coalesce((p_auswahl->>'ball')::boolean, false) and v_vs->>'ball' in ('alex','lea','gf','team','extern','offen') then
      -- Runde 3, Befund 3: der Ball, den die Person (oder die KI-Prüfung) zuletzt gesehen hat, muss noch dort liegen.
      if coalesce(p_expect_ball, nullif(v_vs->>'ball_gesehen', '')) is not null
         and coalesce(p_expect_ball, v_vs->>'ball_gesehen') <> v_vh.ball then
        raise exception 'Der Ball liegt inzwischen bei %, bitte den Einwurf neu öffnen', public.hh_ball_wort(v_vh.ball, v_vh.ball_name)
          using errcode = 'PT409';
      end if;
      v_patch := v_patch || jsonb_build_object('ball', v_vs->>'ball',
        'ball_name', case when v_vs->>'ball' in ('team','extern') then nullif(v_vs->>'ball_name', '') end);
    end if;
    v_schritt := coalesce(nullif(btrim(coalesce(p_bearbeitet->>'naechster_schritt', '')), ''), nullif(v_vs->>'naechster_schritt', ''));
    if coalesce((p_auswahl->>'naechster_schritt')::boolean, false) and v_schritt is not null then
      if public.hh_vertraulich(v_schritt) then
        raise exception 'Der nächste Schritt enthält möglicherweise vertrauliche Angaben. Bitte bearbeiten.' using errcode = 'PT400';
      end if;
      v_patch := v_patch || jsonb_build_object('naechster_schritt', left(v_schritt, 1000));
    end if;
    v_frist := coalesce(nullif(p_bearbeitet->>'frist', ''), public.hh_datum(v_vs->>'frist')::text);
    if coalesce((p_auswahl->>'frist')::boolean, false) and v_frist is not null then
      v_patch := v_patch || jsonb_build_object('frist', v_frist);
    end if;
    if v_patch <> '{}'::jsonb then
      -- Nächster Schritt und Frist nur, wenn sie noch so stehen wie gesehen (hh_vorhaben_save prüft expect unter der Sperre).
      -- Nur Schlüssel mit bekanntem gesehenem Wert; ein gesehener leerer Wert (JSON null) zählt mit.
      v_e2 := '{}'::jsonb;
      if v_patch ? 'naechster_schritt' then
        if v_exp ? 'naechster_schritt' then v_e2 := v_e2 || jsonb_build_object('naechster_schritt', v_exp->'naechster_schritt');
        elsif v_vs ? 'schritt_gesehen' then v_e2 := v_e2 || jsonb_build_object('naechster_schritt', v_vs->'schritt_gesehen'); end if;
      end if;
      if v_patch ? 'frist' then
        if v_exp ? 'frist' then v_e2 := v_e2 || jsonb_build_object('frist', v_exp->'frist');
        elsif v_vs ? 'frist_gesehen' then v_e2 := v_e2 || jsonb_build_object('frist', v_vs->'frist_gesehen'); end if;
      end if;
      if v_e2 <> '{}'::jsonb then v_patch := v_patch || jsonb_build_object('expect', v_e2); end if;
      v_felder := public.hh_vorhaben_save(p_vorhaben, v_patch, p_by, null, 'Einwurf');
    end if;
  end if;

  -- Gesamtprüfung Befund 1: sofort nur aus dem übernommenen Verlaufstext; ohne Verlauf kein Ticker (nie der Rohtext).
  if v_ben = 'sofort' and v_verlauf is null then
    v_ueber := v_ueber || to_jsonb('Ohne Verlaufseintrag gibt es keine sofortige Benachrichtigung.'::text);
    v_ben := 'morgen';
  end if;
  if v_ben = 'sofort' then
    if public.hh_vertraulich(v_verlauf->>'text') then
      raise exception 'Der Text für die sofortige Benachrichtigung enthält möglicherweise vertrauliche Angaben. Bitte bearbeiten.' using errcode = 'PT400';
    end if;
    insert into public.gfweekly_news (kind, source, who, title, body, happened_at, relevance, status, source_ref, vorhaben_id)
    values ('ticker', 'manuell', v_andere,
            left(v_vh.title || ': ' || (v_verlauf->>'text'), 500),
            left((v_verlauf->>'text') || E'\n\nEinwurf von ' || v_ew.von || ', übernommen von ' || p_by || '.', 6000),
            now(), 'mittel', 'neu', v_ref, p_vorhaben)
    on conflict (source_ref) do nothing;
    v_ticker := true;
  end if;

  update public.hh_einwurf set
    status = 'uebernommen', vorhaben_id = p_vorhaben, entschieden_by = p_by, entschieden_at = now(),
    vorschlag = coalesce(vorschlag, '{}'::jsonb) || jsonb_build_object('benachrichtigung_gewaehlt', v_ben,
      'angewendet', jsonb_build_object('auswahl', p_auswahl, 'vorhaben_id', p_vorhaben, 'uebersprungen', v_ueber))
  where id = p_id;

  return jsonb_build_object('verlauf', v_verlauf, 'punkte', v_punkte, 'neue_punkte', v_neue, 'felder', v_felder,
                            'ticker', v_ticker, 'uebersprungen', v_ueber);
end;
$fn$;




revoke all on function public.hh_einwurf_apply(uuid, uuid, jsonb, jsonb, text, text, text, text) from public, anon, authenticated;
grant execute on function public.hh_einwurf_apply(uuid, uuid, jsonb, jsonb, text, text, text, text) to service_role;

create or replace function public.hh_absence_end(p_id uuid, p_by text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_abs public.gfweekly_absences;
  v_themen int;
  v_zurueck jsonb;
begin
  select * into v_abs from public.gfweekly_absences where id = p_id for update;
  if not found then raise exception 'Abwesenheit % gibt es nicht', p_id using errcode = 'PT404'; end if;
  update public.gfweekly_absences set status = 'beendet', updated_at = now() where id = p_id returning * into v_abs;
  -- Nur Themen, die an einer Korbzeile genau dieser Abwesenheit hängen.
  with z as (select h.id, h.ref_id from public.gfweekly_handover h where h.absence_id = p_id and h.kind = 'thema'),
       u as (update public.gfweekly_topics t set owner_backup = null from z where t.id::text = z.ref_id and t.handover_id = z.id returning t.id)
  select count(*) into v_themen from z;
  v_zurueck := public.hh_vorhaben_zurueck(p_id, p_by, null)->'zurueck';
  insert into public.gfweekly_handover_log (absence_id, art, who, text)
  values (p_id, 'notiz', p_by, 'Rückübergabe bestätigt, ' || v_themen || ' Themen wieder bei ' || v_abs.person
          || case when jsonb_array_length(v_zurueck) > 0 then ', ' || jsonb_array_length(v_zurueck) || ' Vorhaben zurück.' else '.' end);
  return jsonb_build_object('absence', to_jsonb(v_abs), 'themen', v_themen, 'vorhaben_zurueck', v_zurueck);
end;
$fn$;
revoke all on function public.hh_absence_end(uuid, text) from public, anon, authenticated;
grant execute on function public.hh_absence_end(uuid, text) to service_role;
