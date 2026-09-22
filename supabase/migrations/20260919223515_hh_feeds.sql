-- Das Hohe Haus V21 (20.09.2026) · Datenvertrag zu den Plattformen Wilde Habitate (vvp_*) und Wild Wild Partner (vvp_partner_*)
-- Vier schreibgeschützte Views im Schema public. Das Hohe Haus liest sie über die Service-Role der Edge Function gfweekly; es schreibt nie in vvp_*.
-- Ändert eine Plattform ihr Schema, wird nur die View angepasst. Rechte: anon/authenticated bekommen KEIN SELECT (die Views laufen als Eigentümer
-- an der RLS der vvp_-Tabellen vorbei), nur service_role.
-- Dazu: Stränge habitate/wwp im Hohen Haus, Quelle 'plattform' in gfweekly_news.

-- 1) Ereignisliste Wilde Habitate --------------------------------------------------------------------------------------
create or replace view public.hh_feed_habitate as
with rel as (
  select coalesce(r.anzeige_ab, r.created_at) as happened_at, 'release'::text as kind, r.titel as title,
         concat_ws(' · ', nullif(r.beschreibung,''), 'Kategorie: '||r.kategorie, nullif('Bezug: '||nullif(r.bezug,''),'Bezug: '), 'Stand: '||to_char(r.datum,'DD.MM.YYYY')) as body,
         'vvp_releases'::text as ref_table, r.id::text as ref_id, null::text as who
  from vvp_releases r
),
ent as (
  select e.updated_at as happened_at, 'entscheidung'::text as kind, e.frage as title,
         concat_ws(' · ', 'Status: '||e.status, 'Dringlichkeit: '||coalesce(e.dringlichkeit,'offen'), nullif('Entscheidet: '||nullif(e.wer_entscheidet,''),'Entscheidet: '),
                   case when e.status='entschieden' and nullif(e.entscheidung,'') is not null then 'Entscheidung: '||left(e.entscheidung,400) end,
                   case when e.status<>'entschieden' and nullif(e.wenn_offen,'') is not null then 'Wenn offen: '||left(e.wenn_offen,240) end) as body,
         'vvp_entscheidungen'::text, e.id::text, e.wer_entscheidet
  from vvp_entscheidungen e
),
entlog as (
  select l.geaendert_am, 'entscheidung_status'::text, e.frage,
         concat_ws(' · ', coalesce(l.alter_status,'–')||' → '||coalesce(l.neuer_status,'–'), nullif(left(l.text,300),'')),
         'vvp_entscheidung_log'::text, l.id::text, e.wer_entscheidet
  from vvp_entscheidung_log l join vvp_entscheidungen e on e.id=l.entscheidung_id
),
ms as (
  select m.updated_at, 'meilenstein'::text, m.titel,
         concat_ws(' · ', 'Status: '||m.status, nullif(m.zeitraum,''), nullif(left(m.beschreibung,240),''), nullif('Bewusst offen: '||nullif(m.bewusst_offen,''),'Bewusst offen: ')),
         'vvp_meilensteine'::text, m.id::text, null::text
  from vvp_meilensteine m
),
hab as (
  select h.updated_at, 'habitat_entscheidung'::text, h.titel,
         concat_ws(' · ', 'Status: '||coalesce(h.status,'offen'), nullif(h.fall,''), nullif('Fehlt: '||nullif(h.was_fehlt,''),'Fehlt: '), nullif('Entscheidet: '||nullif(h.wer_entscheidet,''),'Entscheidet: '),
                   case when h.faellig_am is not null then 'Fällig: '||to_char(h.faellig_am,'DD.MM.YYYY') end, nullif('Nächster Schritt: '||nullif(h.naechster_schritt,''),'Nächster Schritt: ')),
         'vvp_habitat_entscheidungen'::text, h.id::text, h.wer_entscheidet
  from vvp_habitat_entscheidungen h
),
fahr as (
  select f.updated_at, 'invest_fahrplan'::text, coalesce(p.title,'Investitionsprojekt'),
         concat_ws(' · ', case when f.jahr_bestaetigt is not null then 'Bestätigt: '||f.jahr_bestaetigt||coalesce(' / '||f.prioritaet_bestaetigt,'') end,
                   case when f.jahr_entwurf is not null then 'Entwurf: '||f.jahr_entwurf||coalesce(' / '||f.prioritaet_entwurf,'')||coalesce(' ('||f.herkunft_entwurf||')','') end,
                   nullif(left(f.reihenfolge_begruendung,240),'')),
         'vvp_invest_fahrplan'::text, f.id::text, null::text
  from vvp_invest_fahrplan f left join vvp_invest_projects p on p.id=f.project_id
),
hist as (
  -- viele kleine Feldänderungen: je Projekt und Tag eine Zeile
  select max(h.created_at), 'invest_aenderung'::text, coalesce(p.title,'Investitionsprojekt'),
         count(*)||' Änderung(en) an '||string_agg(distinct k.key, ', ' order by k.key),
         'vvp_invest_history'::text, h.project_id::text||':'||to_char(min(h.created_at) at time zone 'Europe/Berlin','YYYY-MM-DD'), null::text
  from vvp_invest_history h left join vvp_invest_projects p on p.id=h.project_id
       left join lateral (select jsonb_object_keys(coalesce(h.changed,'{}'::jsonb)) as key) k on true
  group by h.project_id, p.title, (h.created_at at time zone 'Europe/Berlin')::date
),
launch as (
  select c.changed_at, 'launch_plan'::text, 'Launch-Plan: '||c.field,
         concat_ws(' → ', coalesce(nullif(left(c.old_value,160),''),'–'), coalesce(nullif(left(c.new_value,220),''),'–')),
         'vvp_launch_plan_changes'::text, c.id::text, c.changed_by
  from vvp_launch_plan_changes c
),
gpv as (
  select v.updated_at, 'gp_vorschlag'::text, 'Partner-Vorschlag: '||v.titel,
         concat_ws(' · ', 'Status: '||coalesce(v.status,'neu'), nullif(left(v.beschreibung,300),'')),
         'vvp_gp_vorschlaege'::text, v.id::text, null::text
  from vvp_gp_vorschlaege v
),
gpk as (
  select k.created_at, 'gp_kommentar'::text, 'Kommentar zu: '||coalesce(v.titel,'Vorschlag'),
         concat_ws(' · ', left(k.inhalt,300), coalesce(k.autor_typ,'')||coalesce(' / '||k.sichtbarkeit,'')),
         'vvp_gp_kommentare'::text, k.id::text, null::text
  from vvp_gp_kommentare k left join vvp_gp_vorschlaege v on v.id=k.vorschlag_id
),
u as (
  select * from rel union all select * from ent union all select * from entlog union all select * from ms union all select * from hab
  union all select * from fahr union all select * from hist union all select * from launch union all select * from gpv union all select * from gpk
)
select u.happened_at, 'habitate'::text as platform, u.kind, u.title, u.body, u.ref_table, u.ref_id,
       'https://wilde-habitate.netlify.app'::text as url, u.who
from u where u.happened_at is not null;

-- 2) Ereignisliste Wild Wild Partner --------------------------------------------------------------------------------------
create or replace view public.hh_feed_partner as
select a.occurred_at as happened_at, 'wwp'::text as platform, coalesce(a.activity_type,'note') as kind,
       c.name||': '||left(coalesce(a.summary,''),140) as title,
       concat_ws(' · ', a.summary, case a.direction when 'inbound' then 'eingehend' when 'outbound' then 'ausgehend' when 'internal' then 'intern' else a.direction end) as body,
       'vvp_partner_activities'::text as ref_table, a.id::text as ref_id,
       case when a.source_url like 'https://wild-%' then a.source_url else 'https://wild-wild-partner.netlify.app' end as url,
       v.owner as who
from vvp_partner_activities a
join vvp_partner_candidates c on c.id=a.partner_id
left join vvp_partner_conversations v on v.partner_id=a.partner_id
union all
select v.updated_at, 'wwp', 'stand',
       c.name||' · Stand: '||coalesce(v.stage,'–'),
       concat_ws(' · ', nullif('Nächster Schritt: '||nullif(v.next_action,''),'Nächster Schritt: '), case when v.target_on is not null then 'Zieldatum: '||to_char(v.target_on,'DD.MM.YYYY') end,
                 nullif('Wartet auf: '||nullif(v.waiting_for,''),'Wartet auf: '), nullif('Signal: '||nullif(left(c.current_signal,220),''),'Signal: ')),
       'vvp_partner_conversations', v.id::text, 'https://wild-wild-partner.netlify.app', v.owner
from vvp_partner_conversations v join vvp_partner_candidates c on c.id=v.partner_id;

-- 3) Stand je Partner (für Kacheln und Zieldaten) ---------------------------------------------------------------------------
create or replace view public.hh_partner_stand as
select c.id as partner_id, c.name, c.slug, c.partner_lane as lane, v.stage, v.owner, v.next_action, v.target_on, v.waiting_for,
       left(c.current_signal,220) as signal, c.last_contact_on, v.updated_at,
       (v.target_on is not null and v.target_on < (now() at time zone 'Europe/Berlin')::date and coalesce(v.stage,'') not in ('closed','paused')) as overdue
from vvp_partner_candidates c left join vvp_partner_conversations v on v.partner_id=c.id;

-- 4) Offene Entscheidungen Wilde Habitate (für die Kachel) -----------------------------------------------------------------
create or replace view public.hh_habitate_offen as
select e.id, e.schluessel, e.frage, coalesce(e.dringlichkeit,'offen') as dringlichkeit, e.wer_entscheidet, e.updated_at,
       'vvp_entscheidungen'::text as ref_table
from vvp_entscheidungen e where e.status<>'entschieden'
union all
select h.id, null, h.titel, case when h.faellig_am is not null and h.faellig_am < (now() at time zone 'Europe/Berlin')::date then 'überfällig' else coalesce(h.status,'offen') end,
       h.wer_entscheidet, h.updated_at, 'vvp_habitat_entscheidungen'
from vvp_habitat_entscheidungen h where coalesce(h.status,'offen') not in ('entschieden','geregelt','erledigt');

-- Rechte: nur die Service-Role liest
revoke all on public.hh_feed_habitate, public.hh_feed_partner, public.hh_partner_stand, public.hh_habitate_offen from anon, authenticated, public;
grant select on public.hh_feed_habitate, public.hh_feed_partner, public.hh_partner_stand, public.hh_habitate_offen to service_role;
comment on view public.hh_feed_habitate is 'Das Hohe Haus V21: Ereignisse der Plattform Wilde Habitate (vvp_*), nur lesen.';
comment on view public.hh_feed_partner is 'Das Hohe Haus V21: Ereignisse der Plattform Wild Wild Partner, ohne Kontaktdaten, nur lesen.';
comment on view public.hh_partner_stand is 'Das Hohe Haus V21: Stand je Partner (Lane, Stufe, nächster Schritt, Zieldatum, überfällig).';
comment on view public.hh_habitate_offen is 'Das Hohe Haus V21: offene Entscheidungen in Wilde Habitate.';

-- 5) Hohes Haus: Stränge und Quelle 'plattform'
insert into public.gfweekly_strands(key,label,short,sort_order) values
  ('habitate','Wilde Habitate · Plattform','Habitate',100),
  ('wwp','Wild Wild Partner','WWP',105)
on conflict (key) do update set label=excluded.label, short=excluded.short, sort_order=excluded.sort_order;

alter table public.gfweekly_news drop constraint if exists gfweekly_news_source_check;
alter table public.gfweekly_news add constraint gfweekly_news_source_check
  check (source = any (array['notiz','asana','kalender','mail','protokoll','entscheidung','manuell','plattform']));
