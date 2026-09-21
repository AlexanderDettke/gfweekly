-- Das Hohe Haus V24d (22.09.2026) · Eine Übergabe ist ein Vorgang, kein Stapel Einzelschritte.
-- Befund 7.1 der unabhängigen Review: handover_set hat erst die Korbzeile bestätigt und danach das Thema
-- nachgezogen. Scheiterte der zweite Schritt, stand eine bestätigte Zeile ohne Wirkung da.
-- hh_handover_set macht beides in einer Transaktion: Korbzeile, Vorgang, Protokoll. Alles oder nichts.
--
-- p_patch enthält nur die Felder, die wirklich geändert werden sollen (jsonb, fehlende Schlüssel bleiben).
-- Rückgabe: { item: <Korbzeile>, vorgang: <Thema oder Kandidat oder null> }.

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
  v_ampel text; v_vertretung text; v_status text;
  v_ende date; v_gate text; v_note text; v_wort text;
  v_vorgang jsonb := null;
begin
  -- Die Zeile und ihre Abwesenheit werden gesperrt, damit zwei gleichzeitige Klicks sich nicht überholen.
  select * into v_alt from public.gfweekly_handover where id = p_id for update;
  if not found then raise exception 'Korbzeile % gibt es nicht', p_id using errcode = 'no_data_found'; end if;
  select * into v_abs from public.gfweekly_absences where id = v_alt.absence_id for update;
  if not found then raise exception 'Zur Korbzeile % fehlt die Abwesenheit', p_id using errcode = 'no_data_found'; end if;

  v_ampel := coalesce(p_patch->>'ampel', v_alt.ampel);
  v_status := coalesce(p_patch->>'status', 'bestaetigt');
  if p_patch ? 'vertretung' then v_vertretung := nullif(p_patch->>'vertretung', '');
  else v_vertretung := v_alt.vertretung; end if;
  -- Was ruht oder vor der Abreise erledigt sein soll, wird nicht vertreten.
  if v_ampel in ('ruht','vorher') then v_vertretung := null; end if;

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
      v_gate := case lower(v_vertretung) when 'lea' then 'lea' when 'alex' then 'alex' else 'team' end;
      update public.gfweekly_topics set
        handover_id = v_row.id, owner_backup = v_vertretung, gate = v_gate,
        gate_by = p_by, gate_at = now(), gate_note = 'in Vertretung für ' || v_abs.person,
        updated_at = now()
      where id = v_row.ref_id::uuid
      returning jsonb_build_object('id', id, 'gate', gate, 'owner_backup', owner_backup) into v_vorgang;
    elsif v_alt.vertretung is not null then
      -- Eine bestehende Vertretung wurde entfernt: der Ausgang gehört wieder der abwesenden Person.
      v_gate := case lower(v_abs.person) when 'lea' then 'lea' when 'alex' then 'alex' else 'gf' end;
      update public.gfweekly_topics set
        handover_id = v_row.id, owner_backup = null, gate = v_gate,
        gate_by = p_by, gate_at = now(), gate_note = 'wieder bei ' || v_abs.person, updated_at = now()
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

  v_wort := case when v_ampel = 'ruht' then 'ruht bis zur Rückkehr'
                 when v_vertretung is not null then 'geht an ' || v_vertretung
                 else 'bestätigt' end;
  insert into public.gfweekly_handover_log (absence_id, handover_id, art, who, text)
  values (v_abs.id, v_row.id,
          case when v_status = 'erledigt' then 'erledigt'
               when v_vertretung is not null then 'weitergabe' else 'notiz' end,
          p_by,
          coalesce(v_row.title,'ohne Titel') || ': ' || v_wort || ' (Ampel ' || coalesce(v_ampel,'offen') || ').');

  return jsonb_build_object('item', to_jsonb(v_row), 'vorgang', v_vorgang);
end;
$fn$;

revoke all on function public.hh_handover_set(uuid, text, jsonb) from public, anon, authenticated;
grant execute on function public.hh_handover_set(uuid, text, jsonb) to service_role;
comment on function public.hh_handover_set(uuid, text, jsonb) is
  'Das Hohe Haus V24d: bestätigt eine Korbzeile, zieht den Vorgang nach und schreibt das Protokoll, alles in einer Transaktion. Aufruf nur aus der Edge Function.';

-- Befund 7.3 · Startwerte der Asana-Kennungen, am 21.09.2026 aus dem Workspace 57435200923138 gelesen.
-- Fehlende Kennungen löst asana_export später selbst über die E-Mail auf. Jessica bleibt offen,
-- weil im Workspace zwei Konten stehen und die Zuordnung eine Entscheidung ist, keine Ableitung.
update public.gfweekly_people set asana_gid = v.gid
from (values
  ('alex@wildemoehre.org',    '484484067861844'),
  ('lea@wildemoehre.org',     '1102276766432081'),
  ('amelie@wildemoehre.org',  '1211935096130739'),
  ('antonia@wildemoehre.org', '1212935737762622'),
  ('helge@wildemoehre.org',   '1210069260604742')
) as v(email, gid)
where lower(public.gfweekly_people.email) = v.email
  and coalesce(public.gfweekly_people.asana_gid, '') = '';

-- Befund 7.2 · Der Korb sagt, wenn eine Quelle an ihre Obergrenze gestoßen ist. Solange die Spalte false ist,
-- ist der Korb vollständig; die Übergabeseite blendet sonst einen Hinweis ein.
alter table public.gfweekly_absences
  add column if not exists korb_truncated boolean not null default false,
  add column if not exists korb_abgeschnitten text;
comment on column public.gfweekly_absences.korb_truncated is
  'Das Hohe Haus V24d: true, wenn beim letzten Bau des Korbs eine Quelle an der Obergrenze (2000 Zeilen) lag.';
