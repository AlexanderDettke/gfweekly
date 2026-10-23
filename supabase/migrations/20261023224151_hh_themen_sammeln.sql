-- Kompass · Board aufräumen und Mehrfachauswahl (23.10.2026). Auftrag: docs/PAKET-BLICK-UND-AUFRAEUMEN.md, Teil A.
-- archiv_grund an Themen: warum archiviert (hand, erledigt-14). Archivieren war bisher nur ein Schalter ohne Grund.
-- hh_themen_sammeln: eine Aktion für viele Themen (Mehrfachauswahl). Je Thema eine Unter-Transaktion: ein Konflikt
-- (Thema inzwischen geändert) lässt dieses Thema aus, die übrigen werden gespeichert. Rückgabe je Thema ok oder Grund
-- und der Stand davor, mit dem dieselbe Funktion (aktion zuruecksetzen) alles rückgängig macht. Keine Habitat-Taler.
-- hh_themen_erledigt_archivieren: erledigte Themen, die seit p_tage (Standard 14) erledigt sind, ins Archiv.
-- Der tägliche Zeitplan dafür steht in einer eigenen Migration, die nach dem Ausrollen der Seite läuft.
set lock_timeout = '10s';

alter table public.gfweekly_topics add column if not exists archiv_grund text;
comment on column public.gfweekly_topics.archiv_grund is 'Warum archiviert: hand (von Hand oder Mehrfachauswahl), erledigt-<tage> (erledigt und seitdem liegen geblieben). Leer, wenn nicht archiviert oder vor dem 23.10.2026 archiviert.';

create or replace function public.hh_themen_sammeln(p_items jsonb, p_by text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_it jsonb;
  v_alt public.gfweekly_topics;
  v_aktion text;
  v_wert jsonb;
  v_ergebnis jsonb := '[]'::jsonb;
  v_ok int := 0;
  v_id uuid;
begin
  if jsonb_typeof(p_items) <> 'array' then raise exception 'items fehlt' using errcode = 'PT400'; end if;
  for v_it in select * from jsonb_array_elements(p_items) loop
    begin
      v_id := (v_it->>'id')::uuid;
      v_aktion := v_it->>'aktion';
      v_wert := v_it->'wert';
      select * into v_alt from public.gfweekly_topics where id = v_id for update;
      if not found then raise exception 'Thema gibt es nicht' using errcode = 'PT404'; end if;
      -- Gesehener Stand: Spalte und letzte Änderung (millisekundengenau, wie der Browser sie kennt).
      if jsonb_typeof(v_it->'expect') = 'object' then
        if (v_it->'expect' ? 'board_lane') and (v_it->'expect'->>'board_lane') is distinct from v_alt.board_lane then
          raise exception 'inzwischen verschoben' using errcode = 'PT409'; end if;
        if (v_it->'expect' ? 'updated_at') and date_trunc('milliseconds', (v_it->'expect'->>'updated_at')::timestamptz) is distinct from date_trunc('milliseconds', v_alt.updated_at) then
          raise exception 'inzwischen geändert' using errcode = 'PT409'; end if;
      end if;
      if v_aktion = 'erledigt' then
        update public.gfweekly_topics set board_lane = 'erledigt', status = 'erledigt', resolved_at = now(), updated_at = now() where id = v_id;
      elsif v_aktion = 'in_bearbeitung' then
        update public.gfweekly_topics set board_lane = 'in_klaerung', status = 'in_klaerung', resolved_at = null, updated_at = now() where id = v_id;
      elsif v_aktion = 'offen' then
        update public.gfweekly_topics set board_lane = 'zu_besprechen', status = 'offen', resolved_at = null, updated_at = now() where id = v_id;
      elsif v_aktion = 'verschieben' then
        update public.gfweekly_topics set next_suggested = nullif(v_wert #>> '{}', '')::date, updated_at = now() where id = v_id;
      elsif v_aktion = 'weitergeben' then
        if (v_wert #>> '{}') not in ('alex', 'lea', 'gf', 'team') then raise exception 'weitergeben an alex, lea, gf oder team' using errcode = 'PT400'; end if;
        update public.gfweekly_topics set gate = v_wert #>> '{}', gate_by = p_by, gate_at = now(), updated_at = now() where id = v_id;
      elsif v_aktion = 'archivieren' then
        update public.gfweekly_topics set archived = true, archiv_grund = 'hand', updated_at = now() where id = v_id;
      elsif v_aktion = 'zuruecksetzen' then
        -- Rückgängig: genau die Felder des Stands davor, nur wenn sie im Wert stehen.
        if jsonb_typeof(v_wert) <> 'object' then raise exception 'zuruecksetzen braucht den Stand davor' using errcode = 'PT400'; end if;
        update public.gfweekly_topics set
          board_lane     = case when v_wert ? 'board_lane' then v_wert->>'board_lane' else board_lane end,
          status         = case when v_wert ? 'status' then v_wert->>'status' else status end,
          resolved_at    = case when v_wert ? 'resolved_at' then (v_wert->>'resolved_at')::timestamptz else resolved_at end,
          next_suggested = case when v_wert ? 'next_suggested' then (v_wert->>'next_suggested')::date else next_suggested end,
          gate           = case when v_wert ? 'gate' then v_wert->>'gate' else gate end,
          gate_by        = case when v_wert ? 'gate_by' then v_wert->>'gate_by' else gate_by end,
          gate_at        = case when v_wert ? 'gate_at' then (v_wert->>'gate_at')::timestamptz else gate_at end,
          archived       = case when v_wert ? 'archived' then (v_wert->>'archived')::boolean else archived end,
          archiv_grund   = case when v_wert ? 'archiv_grund' then v_wert->>'archiv_grund' else archiv_grund end,
          updated_at     = now()
        where id = v_id;
      else
        raise exception 'aktion unbekannt' using errcode = 'PT400';
      end if;
      v_ergebnis := v_ergebnis || jsonb_build_object('id', v_id, 'ok', true,
        'vorher', jsonb_build_object('board_lane', v_alt.board_lane, 'status', v_alt.status, 'resolved_at', v_alt.resolved_at,
          'next_suggested', v_alt.next_suggested, 'gate', v_alt.gate, 'gate_by', v_alt.gate_by, 'gate_at', v_alt.gate_at,
          'archived', v_alt.archived, 'archiv_grund', v_alt.archiv_grund),
        'thema', (select to_jsonb(x) from public.gfweekly_topics x where x.id = v_id));
      v_ok := v_ok + 1;
    exception when others then
      v_ergebnis := v_ergebnis || jsonb_build_object('id', v_it->>'id', 'ok', false, 'grund', sqlerrm,
        'konflikt', sqlstate = 'PT409');
    end;
  end loop;
  return jsonb_build_object('ok', v_ok, 'gesamt', jsonb_array_length(p_items), 'ergebnis', v_ergebnis);
end;
$fn$;

create or replace function public.hh_themen_erledigt_archivieren(p_tage int default 14)
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare v_n int; v_tage int := greatest(coalesce(p_tage, 14), 1);
begin
  update public.gfweekly_topics set archived = true, archiv_grund = 'erledigt-' || v_tage
  where board_lane = 'erledigt' and not archived
    and coalesce(resolved_at, updated_at) < now() - make_interval(days => v_tage);
  get diagnostics v_n = row_count;
  return jsonb_build_object('archiviert', v_n, 'tage', v_tage);
end;
$fn$;

revoke all on function public.hh_themen_sammeln(jsonb, text) from public, anon, authenticated;
grant execute on function public.hh_themen_sammeln(jsonb, text) to service_role;
revoke all on function public.hh_themen_erledigt_archivieren(int) from public, anon, authenticated;
grant execute on function public.hh_themen_erledigt_archivieren(int) to service_role;
