-- Das Hohe Haus · Saison (Jahresrad der Festivalsaison), 24.09.2026
-- Eigene Tabellen des Hohen Hauses. Festivals verweisen auf vvp_events, dort wird nichts geschrieben.
create table if not exists public.gfweekly_saison_rows(
  id text primary key, season text not null default '2026/27', label text not null, level int not null check (level between 1 and 3),
  sort int not null default 0, weight numeric not null default 1, kind text not null default 'department'
    check (kind in ('kreislauf','meta','department','festival','strang')),
  event_ref uuid, festival_start date, festival_end date, vvk_start date, target int, note text,
  archived boolean not null default false, updated_by text, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table if not exists public.gfweekly_saison_items(
  id uuid primary key default gen_random_uuid(), row_id text not null references public.gfweekly_saison_rows(id),
  title text not null, starts_on date not null, ends_on date not null check (ends_on >= starts_on),
  cat text not null default 'plan' check (cat in ('nach','sys','plan','prod','fest','sales','koll','prog')),
  form text not null default 'band' check (form in ('band','light','thin','dot')),
  anchor_start text not null default 'fest' check (anchor_start in ('fest','vvk','festival','festival_ende')), off_start int,
  anchor_end text not null default 'fest' check (anchor_end in ('fest','vvk','festival','festival_ende')), off_end int,
  body text, status text not null default 'vorschlag' check (status in ('vorschlag','abgestimmt','strittig')),
  note_alex text, note_lea text, sort int not null default 0, archived boolean not null default false,
  updated_by text, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create index if not exists gfweekly_saison_items_row on public.gfweekly_saison_items(row_id) where not archived;
create table if not exists public.gfweekly_saison_log(
  id bigserial primary key, at timestamptz not null default now(), who text, item_id uuid, row_id text, what text, detail jsonb);
alter table public.gfweekly_saison_rows enable row level security;
alter table public.gfweekly_saison_items enable row level security;
alter table public.gfweekly_saison_log enable row level security;

insert into public.gfweekly_saison_rows(id,label,level,sort,weight,kind,event_ref,festival_start,festival_end,vvk_start,target,note,updated_by) values
('kreis','Kreislauf',1,10,1.7,'kreislauf',null,null,null,null,null,'Durchführung, Nachbereitung, neue Systeme, Planung, Produktion','Claude'),
('meta','Metaphasen',1,20,1.3,'meta',null,null,null,null,null,'Gelten für alle Departments und Festivals','Claude'),
('komm','Kommunikation',2,30,1,'department',null,null,null,null,null,null,'Claude'),
('prod','Produktion',2,40,1,'department',null,null,null,null,null,null,'Claude'),
('book','Booking und Artists',2,50,1,'department',null,null,null,null,null,null,'Claude'),
('sys','Systembau',2,60,1,'department',null,null,null,null,null,'Werkzeug-Wellen, Annahme eine Woche je Plattform','Claude'),
('lus','Lusatia',3,70,1,'festival','eaf9bd69-c54b-446d-809f-eb20a2369cdd','2027-07-23','2027-07-25','2026-10-15',4500,null,'Claude'),
('mmd','Malina, Morio & die Draußenbande',3,80,1,'festival','44dee651-47b8-4bd4-af38-f2014d571fbd','2027-07-29','2027-08-02','2026-10-01',3000,null,'Claude'),
('bn','by nature',3,90,1,'festival','6f6e1bcf-88fa-4989-9711-b4bc40f5c491','2027-08-06','2027-08-08','2026-11-01',3500,null,'Claude'),
('wm','Wilde Möhre Freude Edition',3,100,1,'festival','2f1f096a-1df9-4795-8ade-400ccb0b45a4','2027-08-20','2027-08-22','2026-09-01',5000,null,'Claude'),
('flu','Fluidity',3,110,1,'festival','7125581f-c5c5-45c7-80f0-51e4056951d4','2027-08-27','2027-08-29','2026-08-01',5000,null,'Claude'),
('eg','mit Freude eG',3,120,1,'strang',null,'2027-07-23','2027-08-29','2026-11-15',null,'Pakete und Flex-Tickets für alle Festivals, eigene Gesellschaft','Claude')
on conflict (id) do nothing;
insert into public.gfweekly_saison_items(row_id,title,starts_on,ends_on,cat,form,anchor_start,off_start,anchor_end,off_end,body,sort,updated_by)
select row_id,title,starts_on::date,ends_on::date,cat,form,anchor_start,off_start::int,anchor_end,off_end::int,body,sort,updated_by from (values
('kreis','Nachbereitung','2027-08-30','2027-09-30','nach','band','fest',null,'fest',null,'Abbau, Auswertung, was lief gut, was schlecht',0,'Claude'),
('kreis','Neue Systeme','2026-10-01','2026-12-31','sys','band','fest',null,'fest',null,'Ab 1. Oktober neue Saison. Werkzeuge und Plattformen bauen',10,'Claude'),
('kreis','Planung','2027-01-01','2027-06-30','plan','band','fest',null,'fest',null,'Kernteam plant, dann kommen weitere Leute dazu',20,'Claude'),
('kreis','Produktion','2027-07-01','2027-07-22','prod','band','fest',null,'fest',null,'Aufbau vor dem ersten Festival',30,'Claude'),
('kreis','Durchführung','2027-07-23','2027-08-29','fest','band','fest',null,'fest',null,'Fünf Festivals vom 23.07. bis 29.08.',40,'Claude'),
('meta','Abbau','2027-08-30','2027-09-20','nach','band','fest',null,'fest',null,'Gelände zurückbauen, kleinere Crew',50,'Claude'),
('meta','Analyse und Retro','2026-09-21','2026-10-15','nach','band','fest',null,'fest',null,'Kurzes festes Fenster je Department, reicht in die neue Saison hinein',60,'Claude'),
('meta','Systembau','2026-10-16','2026-12-31','sys','band','fest',null,'fest',null,'Verbesserung und neue Software, Ziel Jahresende',70,'Claude'),
('meta','Kernteam-Planung','2027-01-01','2027-03-31','plan','band','fest',null,'fest',null,'Januar zugleich Puffer für die Einführung der Systeme',80,'Claude'),
('meta','Onboarding','2027-04-01','2027-06-30','plan','band','fest',null,'fest',null,'Weitere Leute kommen dazu',90,'Claude'),
('meta','Aufbau und Produktion','2027-07-01','2027-08-29','prod','band','fest',null,'fest',null,'inklusive Festivalbetrieb',100,'Claude'),
('komm','Sommer auswerten','2027-09-01','2027-09-30','nach','band','fest',null,'fest',null,'Material sichten, Vorlauf der neuen Linie',110,'Claude'),
('komm','Neue Linie aufbauen und fahren','2026-10-01','2026-10-31','sales','band','fest',null,'fest',null,'Moduswechsel: vom Aufnehmen zum Erzählen. Draußenbande und Lusatia starten',120,'Claude'),
('komm','Winterverkauf mit Kollektiven','2026-11-01','2026-12-31','koll','band','fest',null,'fest',null,'Aktionen mit und für die Kollektive, by nature und eG-Pakete starten',130,'Claude'),
('komm','Lineups und Inhalte','2027-01-01','2027-06-30','prog','band','fest',null,'fest',null,'Ab Januar Programm je Festival kommunizieren',140,'Claude'),
('komm','Content vor Ort','2027-07-01','2027-08-31','prod','band','fest',null,'fest',null,'Aufnehmen, Anzeigen, Festivalkommunikation',150,'Claude'),
('prod','Abbau','2027-08-30','2027-09-30','nach','band','fest',null,'fest',null,'Rückbau des Geländes',160,'Claude'),
('prod','Kollektive und Partner suchen','2026-10-01','2026-12-31','koll','band','fest',null,'fest',null,'Moduswechsel: Geländewissen fließt in die Belegung des Habitats',170,'Claude'),
('prod','Bedarfe und Systeme','2027-01-01','2027-03-31','plan','band','fest',null,'fest',null,'Baubedarfe, Material, Dienstleister vorbereiten',180,'Claude'),
('prod','Dienstleister akquirieren','2027-04-01','2027-06-30','plan','band','fest',null,'fest',null,'Nach oder parallel zu Lineup und Inhalten',190,'Claude'),
('prod','Aufbau und Betrieb','2027-07-01','2027-08-29','prod','band','fest',null,'fest',null,'Umbaufenster zwischen den Festivals',200,'Claude'),
('book','Auswertung','2027-08-30','2027-09-30','nach','band','fest',null,'fest',null,'Artist Care und Programm auswerten',210,'Claude'),
('book','Kollektive für alle Festivals','2026-10-01','2026-12-31','koll','band','fest',null,'fest',null,'Erst alle Plätze im Gesamthabitat füllen. Soll 31.10., Muss 31.12.',220,'Claude'),
('book','Programm buchen','2027-01-01','2027-04-30','prog','band','fest',null,'fest',null,'Erst wenn die Plätze vergeben sind',230,'Claude'),
('book','Artist-Planung','2027-05-01','2027-06-30','plan','band','fest',null,'fest',null,'Riders, Anreise, Logistik',240,'Claude'),
('book','Artist Care','2027-07-01','2027-08-29','fest','band','fest',null,'fest',null,'Betreuung während der Festivals',250,'Claude'),
('sys','Welle 1: Hub und Kernplattformen','2026-10-01','2026-12-31','sys','band','fest',null,'fest',null,'Hub-Kern, Orte und Kollektive, CRM, Aufgaben und Meilensteine, Personal, Booking, Finanzen, Lager, Bestellwesen, Wiki, Datenübernahme',260,'Claude'),
('sys','Welle 2: Durchführung','2027-01-01','2027-04-30','sys','thin','fest',null,'fest',null,'Aufbauplanung, Fuhrpark, Schichten und Check-in, Vergabe am Tresen, Telefonposten und Protokolle, Festival-Handbuch, Gastronomie. Januar zugleich Einführung',270,'Claude'),
('lus','Verkauf','2026-10-15','2027-07-22','sales','light','vvk',0,'festival',-1,'Ab VVK-Start bis zum Festival',280,'Claude'),
('lus','Festival','2027-07-23','2027-07-25','fest','band','festival',0,'festival_ende',0,'Ziel 4.500. VVK ab 15.10.2026, vor dem Kollektive-Soll',290,'Claude'),
('lus','Vorlauf','2026-09-15','2026-10-14','sales','thin','vvk',-30,'vvk',-1,'Content erstellen, Spannungsbogen vor dem VVK-Start',300,'Claude'),
('lus','VVK-Start','2026-10-15','2026-10-15','sales','dot','vvk',0,'vvk',0,'Erste Ticketphase, Content-Beginn, kurz danach Anzeigen',310,'Claude'),
('mmd','Verkauf','2026-10-01','2027-07-28','sales','light','vvk',0,'festival',-1,'Ab VVK-Start bis zum Festival',320,'Claude'),
('mmd','Festival','2027-07-29','2027-08-02','fest','band','festival',0,'festival_ende',0,'Ziel 3.000. VVK ab 01.10.2026',330,'Claude'),
('mmd','Vorlauf','2026-09-01','2026-09-30','sales','thin','vvk',-30,'vvk',-1,'Content erstellen, Spannungsbogen vor dem VVK-Start',340,'Claude'),
('mmd','VVK-Start','2026-10-01','2026-10-01','sales','dot','vvk',0,'vvk',0,'Erste Ticketphase, Content-Beginn, kurz danach Anzeigen',350,'Claude'),
('bn','Verkauf','2026-11-01','2027-08-05','sales','light','vvk',0,'festival',-1,'Ab VVK-Start bis zum Festival',360,'Claude'),
('bn','Festival','2027-08-06','2027-08-08','fest','band','festival',0,'festival_ende',0,'Ziel 3.500. VVK ab 01.11.2026',370,'Claude'),
('bn','Vorlauf','2026-10-02','2026-10-31','sales','thin','vvk',-30,'vvk',-1,'Content erstellen, Spannungsbogen vor dem VVK-Start',380,'Claude'),
('bn','VVK-Start','2026-11-01','2026-11-01','sales','dot','vvk',0,'vvk',0,'Erste Ticketphase, Content-Beginn, kurz danach Anzeigen',390,'Claude'),
('wm','Verkauf','2026-09-01','2027-08-19','sales','light','vvk',0,'festival',-1,'Ab VVK-Start bis zum Festival',400,'Claude'),
('wm','Festival','2027-08-20','2027-08-22','fest','band','festival',0,'festival_ende',0,'Ziel 5.000. VVK seit 01.09.2026, Vorlauf lag in der eigenen Produktion',410,'Claude'),
('wm','Vorlauf','2026-08-02','2026-08-31','sales','thin','vvk',-30,'vvk',-1,'Content erstellen, Spannungsbogen vor dem VVK-Start',420,'Claude'),
('wm','VVK-Start','2026-09-01','2026-09-01','sales','dot','vvk',0,'vvk',0,'Erste Ticketphase, Content-Beginn, kurz danach Anzeigen',430,'Claude'),
('flu','Verkauf','2026-08-01','2027-08-26','sales','light','vvk',0,'festival',-1,'Ab VVK-Start bis zum Festival',440,'Claude'),
('flu','Festival','2027-08-27','2027-08-29','fest','band','festival',0,'festival_ende',0,'Ziel 5.000. VVK seit 01.08.2026, vor dem eigenen Festival 2026',450,'Claude'),
('flu','Vorlauf','2026-07-02','2026-07-31','sales','thin','vvk',-30,'vvk',-1,'Content erstellen, Spannungsbogen vor dem VVK-Start',460,'Claude'),
('flu','VVK-Start','2026-08-01','2026-08-01','sales','dot','vvk',0,'vvk',0,'Erste Ticketphase, Content-Beginn, kurz danach Anzeigen',470,'Claude'),
('eg','Pakete und Flex-Tickets','2026-11-15','2027-08-29','sales','light','vvk',0,'festival_ende',0,'Gelten für alle Festivals, eigene Gesellschaft, Verrechnung klären',480,'Claude'),
('eg','Vorlauf','2026-10-16','2026-11-14','sales','thin','vvk',-30,'vvk',-1,'Paketlogik, Einlöseregeln, Content',490,'Claude'),
('eg','VVK-Start','2026-11-15','2026-11-15','sales','dot','vvk',0,'vvk',0,'Pakete der eG für alle Festivals',500,'Claude')
) v(row_id,title,starts_on,ends_on,cat,form,anchor_start,off_start,anchor_end,off_end,body,sort,updated_by)
where not exists (select 1 from public.gfweekly_saison_items);