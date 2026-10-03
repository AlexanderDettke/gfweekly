-- Das Hohe Haus · V31e, Nacharbeit aus der Review 31e Runde 2 (03.10.2026).
-- hh_vorschlag_stand: einen Stand-Vorschlag des Abgleichs übernehmen, in einer Transaktion: Vorschlag sperren und prüfen,
-- den Punkt aus dem source_ref mit dem gesehenen Stand vergleichen, neuen Stand schreiben (hh_punkt_save, mit Verlauf),
-- Vorschlag bestätigen. Scheitert ein Teil, bleibt alles wie vorher.
set lock_timeout = '10s';

create or replace function public.hh_vorschlag_stand(p_verlauf uuid, p_stand text, p_expect_stand text, p_by text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_e public.hh_vorhaben_verlauf;
  v_pid text;
  v_p jsonb;
begin
  select * into v_e from public.hh_vorhaben_verlauf where id = p_verlauf for update;
  if not found then raise exception 'Eintrag % gibt es nicht', p_verlauf using errcode = 'PT404'; end if;
  if v_e.status <> 'vorschlag' then raise exception 'Dieser Vorschlag ist schon entschieden (%)', v_e.status using errcode = 'PT409'; end if;
  if coalesce(v_e.tag, '') not ilike 'Vorschlag: Stand%' then raise exception 'Das ist kein Vorschlag zum Stand' using errcode = 'PT400'; end if;
  v_pid := substring(coalesce(v_e.source_ref, '') from 'vorschlag:([^:]+):');
  if v_pid is null or not exists (select 1 from public.hh_vorhaben_punkte where id::text = v_pid and vorhaben_id = v_e.vorhaben_id) then
    raise exception 'Der Punkt zu diesem Vorschlag gehört nicht zum Vorhaben' using errcode = 'PT400';
  end if;
  if nullif(btrim(coalesce(p_stand, '')), '') is null then raise exception 'Der neue Stand ist leer' using errcode = 'PT400'; end if;
  if public.hh_vertraulich(p_stand) then raise exception 'Der Stand enthält möglicherweise vertrauliche Angaben. Bitte bearbeiten.' using errcode = 'PT400'; end if;
  v_p := public.hh_punkt_save(v_pid::uuid, jsonb_build_object('stand', left(btrim(p_stand), 1000), 'expect', jsonb_build_object('stand', p_expect_stand)), p_by);
  update public.hh_vorhaben_verlauf set status = 'bestaetigt' where id = p_verlauf;
  return jsonb_build_object('punkt', v_p->'punkt', 'verlauf_id', p_verlauf);
end;
$fn$;
revoke all on function public.hh_vorschlag_stand(uuid, text, text, text) from public, anon, authenticated;
grant execute on function public.hh_vorschlag_stand(uuid, text, text, text) to service_role;
