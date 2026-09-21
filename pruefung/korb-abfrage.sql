-- Sammelabfrage für den Trockenlauf des Übergabekorbs (pruefung/korb-probe.mjs).
-- Sie bildet handoverItems aus der Edge Function nach, damit die Matrix ohne Deploy gegen echte Zeilen
-- gerechnet werden kann. Person und Fenster unten anpassen, Ergebnis als JSON in die Probe geben.
-- Aufruf über den Supabase-MCP (execute_sql) oder psql; das Ergebnis enthält Betriebsdaten und gehört
-- nicht ins Repo, deshalb liegt hier nur die Abfrage.
--   Person 'lea' (gate) bzw. '%lea%' (owner), Fenster 2026-10-05 bis 2026-10-25.
with themen as (
  select 'thema' as kind, id::text as ref_id, title, null::text as strand, gate_frist::text as frist,
         short_description, context, decision, notes, next_action, owner,
         concat_ws(', ', owner, involved) as who, priority, relevance, board_lane, gate,
         null::text as body, null::text as quote, null::text as stage, null::text as signal, null::text as waiting_for
  from public.gfweekly_topics
  where archived = false and (gate = 'lea' or lower(coalesce(owner,'')) like '%lea%'
        or (gate_frist is not null and gate_frist <= date '2026-10-25'
            and (gate_frist >= date '2026-10-05' or gate_frist < current_date)))
), kandidaten as (
  select 'kandidat', id::text, title, strand, gate_frist::text, null::text, null::text, null::text, null::text,
         null::text, null::text, who, null::text, relevance, null::text, gate, body, quote, null::text, null::text, null::text
  from public.gfweekly_news where kind = 'kandidat' and status = 'neu' and gate = 'lea'
), meilen as (
  select 'meilenstein', id::text, title, strand, date_from::text, null::text, description, null::text, null::text,
         null::text, owner, owner, null::text, null::text, null::text, null::text, null::text, null::text, null::text, null::text, null::text
  from public.gfweekly_milestones
  where archived = false and status not in ('erreicht','abgesagt') and date_from between date '2026-10-05' and date '2026-10-25'
), rituale as (
  select 'ritual', r.id::text, r.title, null::text, null::text, null::text, r.hint, null::text, null::text, null::text,
         'Lea', 'Lea', null::text, null::text, null::text, null::text, null::text, null::text, null::text, null::text, null::text
  from public.gfweekly_rituals r join public.gfweekly_cycle_phases p on p.key = r.phase_key
  where r.active = true and lower(coalesce(p.lead,'')) like '%lea%' and 10 = any(p.months)
), partner as (
  select 'partner', partner_id::text, name, 'wwp', target_on::text, null::text, null::text, null::text, null::text,
         next_action, owner, owner, null::text, null::text, null::text, null::text, null::text, null::text, stage, signal, waiting_for
  from public.hh_partner_stand
  where (lower(coalesce(owner,'')) like '%lea%' or lower(coalesce(owner,'')) = 'together')
    and (overdue or (target_on between date '2026-10-05' and date '2026-10-25'))
), termine as (
  select 'termin', coalesce(nullif(source_ref,''),'cal:'||id::text), title, strand, happened_at::date::text,
         null::text, null::text, null::text, null::text, null::text, null::text, who, null::text, null::text, null::text,
         null::text, body, null::text, null::text, null::text, null::text
  from public.gfweekly_news
  where source = 'kalender' and happened_at >= '2026-10-05' and happened_at <= '2026-10-25 23:59:59'
    and lower(coalesce(who,'')) like '%lea%'
)
select count(*) as zeilen, json_agg(x) as korb from (
  select * from themen union all select * from kandidaten union all select * from meilen
  union all select * from rituale union all select * from partner union all select * from termine
) x;
