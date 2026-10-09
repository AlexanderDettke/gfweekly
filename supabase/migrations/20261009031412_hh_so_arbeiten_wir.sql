-- Das Hohe Haus · So arbeiten wir (V33, 09.10.2026) · angewendet per Supabase-MCP am 09.10.2026 (Fernhistorie 20261009031412)
-- Ist-Aufnahme der Abläufe je Person, Systeme damals und heute, Umfrage für Alex und Lea (unabhängig beantwortet,
-- gemeinsam sichtbar erst wenn beide abgegeben haben), Einordnung der Werkzeuge aus dem Hub-Register.
-- Führend im Hohen Haus: alles hier. Das Hub-Register (hub.werkzeuge) wird nur gelesen (hh_sa_werkzeuge), nie geschrieben.

create table if not exists public.gfweekly_sa_ist (
  id uuid primary key default gen_random_uuid(),
  person text not null check (person in ('Alex','Lea')),
  ablauf text not null check (length(btrim(ablauf)) between 1 and 200),
  haeufigkeit text not null default '' check (length(haeufigkeit) <= 80),
  beruehrt_andere boolean not null default false,
  startet_wenn text not null default '' check (length(startet_wenn) <= 2000),
  schritte text not null default '' check (length(schritte) <= 4000),
  werkzeuge text not null default '' check (length(werkzeuge) <= 2000),
  beteiligte text not null default '' check (length(beteiligte) <= 2000),
  ergebnis_ort text not null default '' check (length(ergebnis_ort) <= 2000),
  laeuft_gut text not null default '' check (length(laeuft_gut) <= 2000),
  hakt text not null default '' check (length(hakt) <= 2000),
  einordnung text not null default 'offen' check (einordnung in ('offen','behalten','anpassen','umbauen','weglassen')),
  freigegeben boolean not null default false,
  sort integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists gfweekly_sa_ist_person on public.gfweekly_sa_ist (person, sort, created_at);

create table if not exists public.gfweekly_sa_systeme (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) between 1 and 160),
  wofuer text not null default '' check (length(wofuer) <= 1000),
  beobachtung text not null default '' check (length(beobachtung) <= 2000),
  stand_quelle text not null default '' check (length(stand_quelle) <= 300),
  reifegrad text not null default 'alltag' check (reifegrad in ('frueher','entwicklung','erprobung','alltag','ruht','abgeloest')),
  einordnung text not null default 'offen' check (einordnung in ('offen','behalten','anpassen','umbauen','weglassen')),
  sort integer not null default 0,
  updated_by text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.gfweekly_sa_hub_stand (
  werkzeug_id uuid primary key,
  reifegrad text not null default '' check (reifegrad in ('','entwicklung','erprobung','alltag')),
  einordnung text not null default 'offen' check (einordnung in ('offen','behalten','anpassen','umbauen','weglassen')),
  notiz text not null default '' check (length(notiz) <= 1000),
  updated_by text not null default '',
  updated_at timestamptz not null default now()
);

create table if not exists public.gfweekly_sa_fragen (
  nr integer primary key,
  thema text not null,
  text text not null,
  art text not null default 'skala' check (art in ('skala','zahl','wahl','text')),
  optionen text not null default '',
  umgekehrt boolean not null default false,
  hinweis text not null default '',
  sort integer not null default 0,
  aktiv boolean not null default true
);

create table if not exists public.gfweekly_sa_runden (
  nr integer primary key,
  bezug text not null default 'die letzten vier Wochen',
  gestartet_at timestamptz not null default now(),
  gestartet_von text not null default '',
  abgegeben_alex timestamptz,
  abgegeben_lea timestamptz
);

create table if not exists public.gfweekly_sa_antworten (
  runde integer not null references public.gfweekly_sa_runden(nr),
  person text not null check (person in ('Alex','Lea')),
  nr integer not null references public.gfweekly_sa_fragen(nr),
  wert integer check (wert between 1 and 5),   -- gelockert in 20261009031450 (0 bis 999 für Zahl- und Wahlfragen)
  kann_nicht boolean not null default false,
  beispiel text not null default '' check (length(beispiel) <= 3000),
  updated_at timestamptz not null default now(),
  primary key (runde, person, nr)
);

create table if not exists public.gfweekly_sa_log (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  who text not null default '',
  what text not null,
  detail jsonb
);

-- Rechte wie im übrigen Haus: RLS an, keine Policies, nur die Edge Function (service_role) liest und schreibt.
alter table public.gfweekly_sa_ist enable row level security;
alter table public.gfweekly_sa_systeme enable row level security;
alter table public.gfweekly_sa_hub_stand enable row level security;
alter table public.gfweekly_sa_fragen enable row level security;
alter table public.gfweekly_sa_runden enable row level security;
alter table public.gfweekly_sa_antworten enable row level security;
alter table public.gfweekly_sa_log enable row level security;
revoke all on public.gfweekly_sa_ist, public.gfweekly_sa_systeme, public.gfweekly_sa_hub_stand, public.gfweekly_sa_fragen,
  public.gfweekly_sa_runden, public.gfweekly_sa_antworten, public.gfweekly_sa_log from anon, authenticated;

-- Werkzeuge aus dem Hub-Register, nur lesen: Name, Zweck, Status, Kümmerer (Anzeigename), Quelle der Wahrheit.
create or replace function public.hh_sa_werkzeuge()
returns table (id uuid, name text, zweck text, url text, kategorie text, status text, sichtbarkeit text,
  quelle_der_wahrheit boolean, kuemmerer text, zuletzt_geprueft_at timestamptz, gesellschaft text)
language sql security definer set search_path = public, hub, pg_temp as $$
  select w.id, w.name, coalesce(w.zweck,''), coalesce(w.url,''), coalesce(w.kategorie::text,''), coalesce(w.status::text,''),
    coalesce(w.sichtbarkeit::text,''), coalesce(w.quelle_der_wahrheit,false), coalesce(p.anzeigename,''), w.zuletzt_geprueft_at,
    coalesce(w.gesellschaft::text,'')
  from hub.werkzeuge w left join hub.profile p on p.user_id = w.kuemmerer
  where coalesce(w.sichtbarkeit::text,'') in ('gf','team','alle')
  order by (coalesce(w.status::text,'') = 'aktiv') desc, w.name;
$$;
revoke all on function public.hh_sa_werkzeuge() from public, anon, authenticated;
grant execute on function public.hh_sa_werkzeuge() to service_role;

-- Fragen der Umfrage (Bezug: die letzten vier Wochen; 1 trifft gar nicht zu bis 5 trifft voll zu, oder „kann ich nicht beurteilen“).
insert into public.gfweekly_sa_fragen (nr, thema, text, art, optionen, umgekehrt, hinweis, sort) values
 (1,'Orientierung','Ich finde ohne Nachfrage, wo der aktuelle Stand eines Vorgangs liegt.','skala','',false,'',10),
 (2,'Orientierung','Ich weiß, welches System für welche Information verbindlich ist.','skala','',false,'',20),
 (3,'Orientierung','Fristen und Zusagen habe ich auch ohne Erinnerung aus dem System im Blick.','skala','',false,'',30),
 (4,'Entscheidungen','Bei offenen Entscheidungen ist klar, wer entscheidet und bis wann.','skala','',false,'',40),
 (5,'Entscheidungen','Bei meinen Aufgaben passen Verantwortung und Entscheidungsbefugnis zusammen.','skala','',false,'',50),
 (6,'Entscheidungen','Getroffene Entscheidungen finde ich später wieder.','skala','',false,'',60),
 (7,'Anfragen und Erreichbarkeit','Wenn mich eine Anfrage erreicht, erkenne ich, was erwartet wird und bis wann.','skala','',false,'',70),
 (8,'Anfragen und Erreichbarkeit','Ich weiß, wann ich von der anderen Person realistisch eine Antwort bekomme.','skala','',false,'',80),
 (9,'Anfragen und Erreichbarkeit','Ich habe das Gefühl, auch nach Feierabend antworten zu müssen.','skala','',true,'',90),
 (10,'Arbeitszeit und Fokus','Ich habe pro Woche genug ungestörte Zeit für Denkarbeit.','skala','',false,'',100),
 (11,'Arbeitszeit und Fokus','Rückfragen und Unterbrechungen kosten mich viel Zeit.','skala','',true,'',110),
 (12,'Arbeitszeit und Fokus','Wie viele Stunden am Stück hattest du in einer typischen Woche höchstens ungestört?','zahl','',false,'Zahl in Stunden',120),
 (13,'Verlässlichkeit','Zusagen zwischen uns werden eingehalten oder rechtzeitig neu vereinbart.','skala','',false,'',130),
 (14,'Verlässlichkeit','Nach einer Übergabe kann die Arbeit ohne Nachfrage weitergehen.','skala','',false,'',140),
 (15,'Verlässlichkeit','Wodurch werden Zusagen zwischen uns heute unklar, und welche Folgen hat das?','text','',false,'',150),
 (16,'Systeme und Veränderung','Ich verstehe die Systeme, die ich nutzen soll, gut genug für die tägliche Arbeit.','skala','',false,'',160),
 (17,'Systeme und Veränderung','Neue oder geänderte Werkzeuge kosten mich zuerst mehr Arbeit, als sie sparen.','skala','',true,'',170),
 (18,'Systeme und Veränderung','Veränderungen an Systemen und Abläufen werden angekündigt, bevor sie gelten.','skala','',false,'',180),
 (19,'Systeme und Veränderung','Ich werde an der Gestaltung von Abläufen und Werkzeugen beteiligt, die mich betreffen.','skala','',false,'',190),
 (20,'Zusammenarbeit','Ich kann Probleme in unserer Zusammenarbeit ohne Sorge ansprechen.','skala','',false,'',200),
 (21,'Zusammenarbeit','Am besten arbeite ich mit …','wahl','kurzer Tagesliste|Übersicht mit Zusammenhängen|beidem|weiß ich noch nicht',false,'',210),
 (22,'Offen','Beobachtung: Was belastet mich in unserer Zusammenarbeit am meisten? Ein konkretes Beispiel.','text','',false,'',220),
 (23,'Offen','Vorschlag: Was würde ich daran ändern?','text','',false,'',230),
 (24,'Offen','Das soll auf jeden Fall so bleiben:','text','',false,'',240)
on conflict (nr) do nothing;

insert into public.gfweekly_sa_runden (nr, bezug, gestartet_von) values (1, 'die letzten vier Wochen', 'Cowork') on conflict (nr) do nothing;

-- Systeme und Formate damals und heute (Vorbefüllung aus Projektwissen und Datenbank, Stand 09.10.2026; von Alex und Lea zu korrigieren).
insert into public.gfweekly_sa_systeme (name, wofuer, beobachtung, stand_quelle, reifegrad, sort, updated_by) values
 ('WhatsApp','schnelle Abstimmung, Übergaben','keine automatische Anbindung; ein bereitgestellter Export ließe sich untersuchen','Anlass von V31, 03.10.2026','alltag',10,'Cowork'),
 ('Google-Kalender','Termine, Arbeitsort','beide mit Arbeitsort-Serie; keine Einträge vom Typ Fokuszeit oder Abwesend zwischen August und Dezember','Abfrage 09.10.2026','alltag',20,'Cowork'),
 ('Gmail','Mail','Alex'' Postfach läuft in die Tagesläufe; Leas Lauf noch nicht eingerichtet','Technikstand, 04.10.2026','alltag',30,'Cowork'),
 ('Drive und Gemini-Notizen','Besprechungsnotizen','Leas Einzeltermine ohne Freigabe für Alex'' Lauf nicht sichtbar','Technikstand, 15.09.2026','alltag',40,'Cowork'),
 ('Miro','Klärung der Partnerschaft, „we grow“','Boards vom Dezember 2023 und Februar 2024','Projektwissen, Mai 2026','ruht',50,'Cowork'),
 ('Korridor-Vereinbarung','erste schriftliche Absprache Prärie und Möhre','Dezember 2023; heutige Gültigkeit unbekannt','Projektwissen, Mai 2026','frueher',60,'Cowork'),
 ('Coda','Stammdaten, Aufgabenbereiche','Aufgaben und Bestellsystem 2026 stillgelegt; Ablösung durch den Hub geplant','Werkzeuglandkarte, 04.10.2026','abgeloest',70,'Cowork'),
 ('Asana','Aufgaben','Lea hatte im Workspace keine Aufgaben; heutiger Stand unbekannt','Technikstand, 14.09.2026','alltag',80,'Cowork'),
 ('Das Hohe Haus','GF-Cockpit: Vorhaben, Neuigkeiten, Pförtner, Vertretung','gebaut von Alex; Nutzung ungleich (Pförtner 52:0, Themen 63:7, Einchecken 24:10 Tage)','Datenbank, 09.10.2026','erprobung',90,'Cowork'),
 ('Habitat Hub','Team-Plattform, Werkzeug-Register, Wiki','gebaut von Alex; 94 Werkzeuge im Register','Werkzeuglandkarte, 04.10.2026','entwicklung',100,'Cowork'),
 ('Kurzabgleich montags','wöchentliche GF-Abstimmung','regelmäßiges Format','Projektwissen, Mai 2026; heute zu bestätigen','alltag',110,'Cowork'),
 ('Begleitung durch Carsten','Klärung struktureller Fragen','Ergebnis des Termins vom 01.06.2026 nicht dokumentiert','Projektwissen, Mai 2026','alltag',120,'Cowork');
