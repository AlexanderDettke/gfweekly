-- Kompass · Stufe 1 · Korrektur aus Codex-Runde 3 (25.10.2026, docs/reviews/STUFE1-runde-3.md, Befund 1).
-- Sammeln überschreibt einen vorhandenen Vorschlag nicht mehr; nur eine leere Zeile bekommt den Vorschlag aus der Quelle.
-- Damit bleibt ein von Hand gesetzter Vorschlag erhalten, auch wenn die Frage noch nicht formuliert ist (Person vor Lauf).
-- Rückweg: Migration 20261025163000 erneut anwenden (create or replace).
set lock_timeout = '10s';

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
    quelle_art text, quelle_id uuid, vorhaben_id uuid, frage text, frist date, vorschlag text
  ) on commit drop;
  truncate tmp_en_quellen;
  insert into tmp_en_quellen
    select 'punkt', p.id, p.vorhaben_id, left(trim(p.titel), 500), p.frist, nullif(trim(coalesce(v.naechster_schritt, '')), '')
      from public.hh_vorhaben_punkte p join public.hh_vorhaben v on v.id = p.vorhaben_id
     where p.erledigt = false and v.status in ('aktiv','pausiert')
       and (p.wer ilike 'GF%' or (p.wer ilike '%alex%' and p.wer ilike '%lea%'))
  union all
    select 'thema', t.id, t.vorhaben_id, left(trim(regexp_replace(t.title, '^\s*Titel:\s*', '')), 500), t.gate_frist,
           coalesce(nullif(trim(coalesce(t.next_action, '')), ''), nullif(trim(coalesce(t.recommendation, '')), ''))
      from public.gfweekly_topics t
     where t.archived = false and t.board_lane in ('zu_besprechen','in_klaerung') and t.gate = 'gf'
  union all
    select 'kandidat', n.id, n.vorhaben_id, left(trim(n.title), 500), n.gate_frist, null
      from public.gfweekly_news n
     where n.kind = 'kandidat' and n.status = 'neu' and n.gate = 'gf';
  delete from tmp_en_quellen where frage is null or frage = '';

  insert into public.hh_entscheidungen (quelle_art, quelle_id, vorhaben_id, frage, frist, frist_quelle, vorschlag, created_by)
    select q.quelle_art, q.quelle_id, q.vorhaben_id, q.frage, q.frist, case when q.frist is null then null else q.quelle_art end, q.vorschlag, 'kompass'
      from tmp_en_quellen q
     where not exists (select 1 from public.hh_entscheidungen e where e.quelle_art = q.quelle_art and e.quelle_id = q.quelle_id)
  on conflict (quelle_art, quelle_id) do nothing;
  get diagnostics v_neu = row_count;

  -- Nachziehen: Frist (außer von Hand), Vorhaben (nur wenn die Quelle eines kennt), Frage nur ohne Frageform,
  -- Vorschlag nur in eine leere Zeile (ein gesetzter Vorschlag, ob von Hand oder vom Lauf, bleibt).
  update public.hh_entscheidungen e set
    frist        = case when e.frist_quelle = 'hand' then e.frist else q.frist end,
    frist_quelle = case when e.frist_quelle = 'hand' then 'hand' when q.frist is null then null else q.quelle_art end,
    vorhaben_id  = coalesce(q.vorhaben_id, e.vorhaben_id),
    frage        = case when e.frage_form then e.frage else q.frage end,
    vorschlag    = coalesce(e.vorschlag, q.vorschlag),
    updated_at   = now()
   from tmp_en_quellen q
   where e.quelle_art = q.quelle_art and e.quelle_id = q.quelle_id
     and e.status in ('offen','vertagt','abgegeben','hinfaellig')
     and ( (case when e.frist_quelle = 'hand' then e.frist else q.frist end) is distinct from e.frist
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
revoke all on function public.hh_entscheidungen_sammeln() from public, anon, authenticated;
grant execute on function public.hh_entscheidungen_sammeln() to service_role;
