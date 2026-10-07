-- Das Hohe Haus · V32 Kommunikation, Nachtrag aus Review 32c Runde 2 (07.10.2026).
-- Ein Versandlauf gehört zu genau einem Zielprojekt (Befund 3) und merkt sich den frühesten Zeitpunkt, zu dem er nach
-- einem Ratenlimit von Asana fortsetzen darf (Befund 5).
alter table public.komm_versandlauf add column if not exists projekt text;
alter table public.komm_versandlauf add column if not exists fortsetzen_ab timestamptz;
