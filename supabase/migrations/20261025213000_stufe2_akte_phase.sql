-- Kompass · Stufe 2 (25.10.2026), Abschnitt 3 und 5: Phase und Fokus aus der Akte setzen; Rückkehr-Brief in der Abwesenheit ablegen.
-- hh_vorhaben_phase: nur Alex oder Lea; schreibt einen Verlaufseintrag, wenn sich etwas ändert.
-- Rückweg: drop function public.hh_vorhaben_phase(uuid,text,boolean,text);
set lock_timeout = '10s';

create or replace function public.hh_vorhaben_phase(p_id uuid, p_phase text, p_fokus boolean, p_by text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_by text := public.hh_en_person(p_by);
  v public.hh_vorhaben;
  v_alt_phase text; v_alt_fokus boolean;
  v_text text := '';
begin
  if p_phase is not null and p_phase not in ('systembau','launch','formatpartner','sonstiges') then
    raise exception 'phase: systembau, launch, formatpartner oder sonstiges' using errcode = 'PT400'; end if;
  select * into v from public.hh_vorhaben where id = p_id for update;
  if not found then raise exception 'Vorhaben gibt es nicht' using errcode = 'PT404'; end if;
  v_alt_phase := v.phase; v_alt_fokus := v.fokus;
  update public.hh_vorhaben set phase = coalesce(p_phase, phase), fokus = coalesce(p_fokus, fokus), updated_by = v_by, updated_at = now()
   where id = p_id returning * into v;
  if v.phase is distinct from v_alt_phase then v_text := 'Phase: ' || v.phase; end if;
  if v.fokus is distinct from v_alt_fokus then v_text := v_text || case when v_text = '' then '' else ', ' end || case when v.fokus then 'im Fokus' else 'nicht mehr im Fokus' end; end if;
  if v_text <> '' then
    insert into public.hh_vorhaben_verlauf (vorhaben_id, art, wer, text, status, created_by) values (v.id, 'system', v_by, v_text, 'bestaetigt', v_by);
  end if;
  return jsonb_build_object('vorhaben', to_jsonb(v), 'geaendert', v_text <> '');
end;
$fn$;
revoke all on function public.hh_vorhaben_phase(uuid, text, boolean, text) from public, anon, authenticated;
grant execute on function public.hh_vorhaben_phase(uuid, text, boolean, text) to service_role;
