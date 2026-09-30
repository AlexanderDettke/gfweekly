-- Das Hohe Haus · Saison V28 (30.09.2026): Besetzung „bisher“ je Bereich, Stand Sommer 2026.
-- Eine Zeile je Bereich mit Text und Quelle; saison.html stellt sie der heutigen Besetzung gegenüber.
-- Eigene Tabelle des Hohen Hauses, RLS an ohne Policies, Zugriff nur über die Edge Function gfweekly.
create table if not exists public.gfweekly_launch_besetzung_vorher(
  bereich text primary key references public.gfweekly_launch_bereiche(key),
  text text not null,
  quelle text not null default 'Rollen in Pool, TPA und Coda, Stand Sommer 2026',
  sort_order int not null default 0,
  created_at timestamptz not null default now());
alter table public.gfweekly_launch_besetzung_vorher enable row level security;
insert into public.gfweekly_launch_besetzung_vorher(bereich, text, quelle, sort_order) values
('fv','faktisch die GF','Rollen in Pool, TPA und Coda, Stand Sommer 2026',1),
('komm','Antonia (Newsletter, Social)','Rollen in Pool, TPA und Coda, Stand Sommer 2026',2),
('content','Antonia allein','Rollen in Pool, TPA und Coda, Stand Sommer 2026',3),
('ticket','je Festival verschieden, Annie nur Fluidity','Rollen in Pool, TPA und Coda, Stand Sommer 2026',4),
('partner','Lea (Kollektiv-Thread)','Rollen in Pool, TPA und Coda, Stand Sommer 2026',5),
('sys','verteilt, Tracking bei niemandem','Rollen in Pool, TPA und Coda, Stand Sommer 2026',6),
('recht','Legal','Rollen in Pool, TPA und Coda, Stand Sommer 2026',7),
('gf','GF','Rollen in Pool, TPA und Coda, Stand Sommer 2026',8)
on conflict (bereich) do nothing;
