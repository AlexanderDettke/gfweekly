-- Kompass · Stufe 2 · Ein Behälter (25.10.2026). Auftrag: docs/PAKET-STUFE-2-EIN-BEHAELTER.md, Abschnitte 2, 3 und 4.
-- 1. Fristen: hh_entscheidungen.frist_vorschlag. Eine Frist zählt nur, wenn ein Punkt oder eine Person sie gesetzt hat; gate_frist von
--    Themen und Kandidaten (meist aus dem Aufräumen) wird zum Vorschlag. Bestehende Zeilen mit frist_quelle thema oder kandidat ziehen um.
-- 2. Phase und Fokus je Vorhaben (systembau, launch, formatpartner, sonstiges), Startbelegung aus Gruppe und Slug; metaphase bleibt Beschriftung.
-- 3. hh_entscheidung_umhaengen: eine Entscheidung wechselt die Quelle (Thema → Punkt) statt hinfällig zu werden.
-- 4. hh_entscheidungen_sammelaktion: Mehrfachaktion (nicht_jetzt, abgeben, hinfaellig) mit einer Unter-Transaktion je Zeile und Rückweg je Zeile.
-- Rückweg: alter table hh_entscheidungen drop column frist_vorschlag; alter table hh_vorhaben drop column phase, drop column fokus;
--   drop function hh_entscheidung_umhaengen(uuid,text,uuid,text); drop function hh_entscheidungen_sammelaktion(jsonb,text,text,text);
--   Migration 20261025193000 erneut anwenden (hh_entscheidungen_sammeln).
set lock_timeout = '10s';

alter table public.hh_entscheidungen add column if not exists frist_vorschlag date;
comment on column public.hh_entscheidungen.frist_vorschlag is 'Datum aus der Quelle (gate_frist eines Themas oder Kandidaten), kein Fristzustand; ein Klick übernimmt es als Frist (frist_quelle hand).';
update public.hh_entscheidungen set frist_vorschlag = frist, frist = null, frist_quelle = null where frist_quelle in ('thema','kandidat');
alter table public.hh_entscheidungen drop constraint if exists hh_entscheidungen_frist_quelle_check;
alter table public.hh_entscheidungen add constraint hh_entscheidungen_frist_quelle_check check (frist_quelle is null or frist_quelle in ('punkt','hand'));

alter table public.hh_vorhaben add column if not exists phase text not null default 'sonstiges' check (phase in ('systembau','launch','formatpartner','sonstiges'));
alter table public.hh_vorhaben add column if not exists fokus boolean not null default false;
comment on column public.hh_vorhaben.phase is 'Phase nach Alex (25.10.2026): systembau, launch, formatpartner, sonstiges. Setzen nur Personen (Chip in der Akte); der Lauf schlägt vor.';
comment on column public.hh_vorhaben.fokus is 'Trägt gerade (Aufbau der Organisation, Start der Launches). Setzen nur Personen.';
update public.hh_vorhaben set phase = case
  when gruppe = 'launch' then 'launch'
  when gruppe = 'partner' or slug in ('kollektive','helge','subardo') then 'formatpartner'
  when gruppe = 'system' or slug in ('habitat-hub','kompass','organisation') then 'systembau'
  else 'sonstiges' end
 where phase = 'sonstiges';
update public.hh_vorhaben set fokus = true where phase in ('launch','formatpartner') or slug = 'habitat-hub';

-- Sammeln: Frist nur aus Punkten, Vorschlag aus Themen und Kandidaten in frist_vorschlag.
create or replace function public.hh_entscheidungen_sammeln()
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_neu int := 0;
  v_akt int := 0;
  v_hin int := 0;
  v_zurueck int := 0;
  v_abg int := 0;
begin
  create temp table if not exists tmp_en_quellen (
    quelle_art text, quelle_id uuid, vorhaben_id uuid, frage text, frist date, frist_vorschlag date, vorschlag text
  ) on commit drop;
  truncate tmp_en_quellen;
  insert into tmp_en_quellen
    select 'punkt', p.id, p.vorhaben_id, left(trim(p.titel), 500), p.frist, null, nullif(trim(coalesce(v.naechster_schritt, '')), '')
      from public.hh_vorhaben_punkte p join public.hh_vorhaben v on v.id = p.vorhaben_id
     where p.erledigt = false and v.status in ('aktiv','pausiert')
       and (p.wer ilike 'GF%' or (p.wer ilike '%alex%' and p.wer ilike '%lea%'))
  union all
    select 'thema', t.id, t.vorhaben_id, left(trim(regexp_replace(t.title, '^\s*Titel:\s*', '')), 500), null, t.gate_frist,
           coalesce(nullif(trim(coalesce(t.next_action, '')), ''), nullif(trim(coalesce(t.recommendation, '')), ''))
      from public.gfweekly_topics t
     where t.archived = false and t.board_lane in ('zu_besprechen','in_klaerung') and t.gate = 'gf'
  union all
    select 'kandidat', n.id, n.vorhaben_id, left(trim(n.title), 500), null, n.gate_frist, null
      from public.gfweekly_news n
     where n.kind = 'kandidat' and n.status = 'neu' and n.gate = 'gf';
  delete from tmp_en_quellen where frage is null or frage = '';

  insert into public.hh_entscheidungen (quelle_art, quelle_id, vorhaben_id, frage, frist, frist_quelle, frist_vorschlag, vorschlag, created_by)
    select q.quelle_art, q.quelle_id, q.vorhaben_id, q.frage, q.frist, case when q.frist is null then null else 'punkt' end, q.frist_vorschlag, q.vorschlag, 'kompass'
      from tmp_en_quellen q
     where not exists (select 1 from public.hh_entscheidungen e where e.quelle_art = q.quelle_art and e.quelle_id = q.quelle_id)
  on conflict (quelle_art, quelle_id) do nothing;
  get diagnostics v_neu = row_count;

  update public.hh_entscheidungen e set
    frist          = case when e.frist_quelle = 'hand' then e.frist else q.frist end,
    frist_quelle   = case when e.frist_quelle = 'hand' then 'hand' when q.frist is null then null else 'punkt' end,
    frist_vorschlag = q.frist_vorschlag,
    vorhaben_id    = coalesce(q.vorhaben_id, e.vorhaben_id),
    frage          = case when e.frage_form then e.frage else q.frage end,
    vorschlag      = coalesce(e.vorschlag, q.vorschlag),
    updated_at     = now()
   from tmp_en_quellen q
   where e.quelle_art = q.quelle_art and e.quelle_id = q.quelle_id
     and e.status in ('offen','vertagt','abgegeben','hinfaellig')
     and ( (case when e.frist_quelle = 'hand' then e.frist else q.frist end) is distinct from e.frist
        or q.frist_vorschlag is distinct from e.frist_vorschlag
        or coalesce(q.vorhaben_id, e.vorhaben_id) is distinct from e.vorhaben_id
        or (not e.frage_form and q.frage is distinct from e.frage)
        or (e.vorschlag is null and q.vorschlag is not null) );
  get diagnostics v_akt = row_count;

  update public.hh_entscheidungen e set status = 'hinfaellig', updated_at = now()
   where e.status in ('offen','vertagt')
     and not exists (select 1 from tmp_en_quellen q where q.quelle_art = e.quelle_art and q.quelle_id = e.quelle_id);
  get diagnostics v_hin = row_count;

  update public.hh_entscheidungen e set status = 'offen', updated_at = now()
   where e.status = 'hinfaellig'
     and exists (select 1 from tmp_en_quellen q where q.quelle_art = e.quelle_art and q.quelle_id = e.quelle_id);
  get diagnostics v_zurueck = row_count;

  update public.hh_entscheidungen e set status = 'offen', abgegeben_an = null, rueckweg = null, rueckweg_at = null, updated_at = now()
   where e.status = 'abgegeben'
     and exists (select 1 from tmp_en_quellen q where q.quelle_art = e.quelle_art and q.quelle_id = e.quelle_id);
  get diagnostics v_abg = row_count;

  return jsonb_build_object('eingefuegt', v_neu, 'aktualisiert', v_akt, 'hinfaellig', v_hin, 'wieder_offen', v_zurueck + v_abg);
end;
$fn$;

-- Umhängen: die Entscheidung wechselt zur neuen Quelle (zum Beispiel Thema → Punkt), Status, Frage, Ergebnis bleiben.
create or replace function public.hh_entscheidung_umhaengen(p_id uuid, p_art text, p_quelle_id uuid, p_by text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_e public.hh_entscheidungen;
  v_vorhaben uuid;
begin
  if p_art not in ('punkt','thema','kandidat') then raise exception 'art: punkt, thema oder kandidat' using errcode = 'PT400'; end if;
  select * into v_e from public.hh_entscheidungen where id = p_id for update;
  if not found then raise exception 'Entscheidung gibt es nicht' using errcode = 'PT404'; end if;
  if exists (select 1 from public.hh_entscheidungen where quelle_art = p_art and quelle_id = p_quelle_id and id <> p_id) then
    raise exception 'Zur neuen Quelle gibt es schon eine Entscheidung' using errcode = 'PT409'; end if;
  if p_art = 'punkt' then select vorhaben_id into v_vorhaben from public.hh_vorhaben_punkte where id = p_quelle_id;
  elsif p_art = 'thema' then select vorhaben_id into v_vorhaben from public.gfweekly_topics where id = p_quelle_id;
  else select vorhaben_id into v_vorhaben from public.gfweekly_news where id = p_quelle_id; end if;
  update public.hh_entscheidungen set quelle_art = p_art, quelle_id = p_quelle_id, vorhaben_id = coalesce(v_vorhaben, vorhaben_id),
    status = case when status = 'hinfaellig' then 'offen' else status end, rueckweg = null, rueckweg_at = null, updated_at = now()
   where id = p_id returning * into v_e;
  return jsonb_build_object('entscheidung', to_jsonb(v_e), 'von', p_by);
end;
$fn$;

-- Mehrfachaktion: je Zeile eine Unter-Transaktion; Konflikt oder Fehler lässt die Zeile aus. Aktionen:
--   nicht_jetzt (vertagen bis p_wert, Standard erster Montag nach vier Wochen), abgeben (p_wert alex|lea|team),
--   hinfaellig (Quelle schließen: Punkt erledigt mit Grund hinfällig, Thema archiviert, Kandidat verworfen; Entscheidung hinfällig).
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
      if (v_it ? 'expect_updated_at') and date_trunc('milliseconds', (v_it->>'expect_updated_at')::timestamptz) is distinct from date_trunc('milliseconds', v_e.updated_at) then
        raise exception 'inzwischen geändert' using errcode = 'PT409'; end if;
      v_vorher := jsonb_build_object('status', v_e.status, 'vertagt_bis', v_e.vertagt_bis, 'frist', v_e.frist, 'frist_quelle', v_e.frist_quelle, 'abgegeben_an', v_e.abgegeben_an);
      if p_aktion = 'nicht_jetzt' then
        v_r := public.hh_entscheidung_vertagen(v_id, v_bis, v_by);
      elsif p_aktion = 'abgeben' then
        v_r := public.hh_entscheidung_abgeben(v_id, p_wert, v_by);
      else
        if v_e.status not in ('offen','vertagt') then raise exception 'nur offene oder vertagte Zeilen' using errcode = 'PT409'; end if;
        if v_e.quelle_art = 'punkt' then
          update public.hh_vorhaben_punkte set erledigt = true, erledigt_at = now(), erledigt_by = v_by, updated_at = now() where id = v_e.quelle_id and erledigt = false;
          insert into public.hh_vorhaben_verlauf (vorhaben_id, punkt_id, art, wer, text, status, created_by)
            select vorhaben_id, id, 'system', v_by, 'Punkt hinfällig (Entscheidungsliste): ' || titel, 'bestaetigt', 'kompass' from public.hh_vorhaben_punkte where id = v_e.quelle_id;
        elsif v_e.quelle_art = 'thema' then
          update public.gfweekly_topics set archived = true, archiv_grund = 'hinfaellig', updated_at = now() where id = v_e.quelle_id and archived = false;
        else
          update public.gfweekly_news set status = 'verworfen', decided_by = v_by, decided_at = now() where id = v_e.quelle_id and status = 'neu';
        end if;
        update public.hh_entscheidungen set status = 'hinfaellig', rueckweg = jsonb_build_object('aktion', 'hinfaellig', 'eigen', v_vorher), rueckweg_at = now(), updated_at = now()
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

revoke all on function public.hh_entscheidungen_sammeln() from public, anon, authenticated;
grant execute on function public.hh_entscheidungen_sammeln() to service_role;
revoke all on function public.hh_entscheidung_umhaengen(uuid, text, uuid, text) from public, anon, authenticated;
grant execute on function public.hh_entscheidung_umhaengen(uuid, text, uuid, text) to service_role;
revoke all on function public.hh_entscheidungen_sammelaktion(jsonb, text, text, text) from public, anon, authenticated;
grant execute on function public.hh_entscheidungen_sammelaktion(jsonb, text, text, text) to service_role;
