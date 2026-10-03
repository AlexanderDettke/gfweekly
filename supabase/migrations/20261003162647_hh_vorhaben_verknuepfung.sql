-- V31 Vorhaben: Verweise aus Themen und Neuigkeiten, Übergabe kennt Vorhaben. Angewendet 03.10.2026 (Version 20261003162647).
set lock_timeout = '10s';
alter table public.gfweekly_topics add column if not exists vorhaben_id uuid references public.hh_vorhaben(id) on delete set null;
alter table public.gfweekly_news add column if not exists vorhaben_id uuid references public.hh_vorhaben(id) on delete set null;
create index if not exists gfweekly_topics_vorhaben on public.gfweekly_topics(vorhaben_id);
create index if not exists gfweekly_news_vorhaben on public.gfweekly_news(vorhaben_id);
alter table public.gfweekly_handover drop constraint if exists gfweekly_handover_kind_check;
alter table public.gfweekly_handover add constraint gfweekly_handover_kind_check check (kind = any (array['thema','kandidat','meilenstein','ritual','termin','asana','partner','vorhaben']));
