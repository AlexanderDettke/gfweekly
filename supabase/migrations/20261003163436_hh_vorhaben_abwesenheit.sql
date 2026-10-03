-- V31 Vorhaben: Ball während einer Abwesenheit. Angewendet 03.10.2026 (Version 20261003163436).
alter table public.hh_vorhaben add column if not exists ball_vor_abwesenheit text check (ball_vor_abwesenheit is null or ball_vor_abwesenheit in ('alex','lea','gf','team','extern','offen'));
alter table public.hh_vorhaben add column if not exists absence_id uuid references public.gfweekly_absences(id) on delete set null;
