-- Das Hohe Haus · V32 Kommunikation, Nachtrag aus Review 32b Runde 1 (07.10.2026).
-- hh_komm_pruefpunkt_set prüft zusätzlich die gesehenen Extras: eine Freigabe der GF darf keine zwischenzeitliche
-- Entscheidung (andere Stufe oder andere Extras) mit dem alten Seitenstand überschreiben. Abweichung: PT409.
drop function if exists public.hh_komm_pruefpunkt_set(text, date, text, text[], text, boolean, text, text);
create or replace function public.hh_komm_pruefpunkt_set(p_festival text, p_datum date, p_stufe text, p_extras text[], p_notiz text, p_notiz_setzen boolean, p_von text, p_expect text, p_expect_extras text[] default null)
returns jsonb language plpgsql set search_path = public as $$
declare alt public.komm_pruefpunkte; neu public.komm_pruefpunkte;
begin
  perform pg_advisory_xact_lock(hashtext('komm_einspielen:' || p_festival));
  perform pg_advisory_xact_lock(hashtext('komm_pp:' || p_festival || ':' || p_datum));
  if not exists (select 1 from komm_veroeffentlichungen where festival_short = p_festival and regel_id = 'PRUEF' and t = p_datum) then
    raise exception 'An diesem Tag gibt es (inzwischen) keinen Prüfpunkt; bitte neu laden' using errcode = 'PT409';
  end if;
  select * into alt from komm_pruefpunkte where festival_short = p_festival and datum = p_datum for update;
  if p_expect is not null and coalesce(alt.stufe, 'offen') <> p_expect then
    raise exception 'Inzwischen geändert: Stufe steht auf %', coalesce(alt.stufe, 'offen') using errcode = 'PT409';
  end if;
  if p_expect_extras is not null and (select coalesce(array_agg(x order by x), '{}') from unnest(coalesce(alt.extras, '{}')) x)
       <> (select coalesce(array_agg(x order by x), '{}') from unnest(p_expect_extras) x) then
    raise exception 'Inzwischen geändert: Extras stehen auf %', coalesce(array_to_string(alt.extras, ', '), 'keine') using errcode = 'PT409';
  end if;
  insert into komm_pruefpunkte(festival_short, datum, stufe, extras, notiz, entschieden_von, entschieden_am)
  values (p_festival, p_datum, p_stufe, coalesce(p_extras, '{}'), case when p_notiz_setzen then p_notiz else null end, p_von, now())
  on conflict (festival_short, datum) do update set stufe = excluded.stufe, extras = excluded.extras,
    notiz = case when p_notiz_setzen then excluded.notiz else komm_pruefpunkte.notiz end, entschieden_von = excluded.entschieden_von, entschieden_am = excluded.entschieden_am
  returning * into neu;
  insert into komm_log(what, "by", detail) values ('komm_pruefpunkt_set', p_von, jsonb_build_object('festival', p_festival, 'datum', p_datum, 'stufe', p_stufe, 'extras', to_jsonb(coalesce(p_extras, '{}')),
    'notiz', case when p_notiz_setzen then p_notiz else null end, 'vorher', case when alt.festival_short is null then null else to_jsonb(alt) end));
  return to_jsonb(neu);
end $$;
revoke all on function public.hh_komm_pruefpunkt_set(text, date, text, text[], text, boolean, text, text, text[]) from public, anon, authenticated;
grant execute on function public.hh_komm_pruefpunkt_set(text, date, text, text[], text, boolean, text, text, text[]) to service_role;
