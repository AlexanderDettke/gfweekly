-- 02.10.2026 · Partnerbereich in Formatpartner und Kollektive geteilt (Auftrag Alex, per Supabase-MCP angewendet)
-- Datenänderung, kein Schemawechsel. Frontend und Edge Function lesen die Bereiche aus der Tabelle.
update gfweekly_launch_bereiche set sort_order = sort_order + 1 where sort_order > 6 and key not in ('formatpartner','kollektive');
insert into gfweekly_launch_bereiche(key,name,beschreibung,coda_department,sort_order) values
 ('formatpartner','Formatpartner','Formatpartner gewinnen, verhandeln und einbinden, Partnerpaket','Entwicklung',6),
 ('kollektive','Kollektive','Kollektive auswählen, ansprechen und einbinden','Entwicklung',7)
on conflict (key) do nothing;
update gfweekly_launch_richtwerte set bereich='formatpartner' where bereich='partner';
update vvp_launch_milestones set bereich='formatpartner' where bereich='partner';
update gfweekly_launch_besetzung set bereich='formatpartner' where bereich='partner';
insert into gfweekly_launch_besetzung(event_id,bereich,person_id,status,quelle,notiz)
  select event_id,'kollektive',person_id,status,quelle,notiz from gfweekly_launch_besetzung where bereich='formatpartner'
  on conflict (event_id,bereich) do nothing;
update gfweekly_people set felder = array(select distinct unnest(array_remove(felder,'partner') || array['formatpartner','kollektive'])) where 'partner' = any(felder);
-- Besetzung 02.10. (bestätigt von Alex): FAM Lea, FL Slawik (mit Annie als Hilfe), LUS Subardo plus weitere, WM Alex, BYN Helge;
-- neuer Meilenstein by nature „Kollektive für by nature bewerten und Ansprache planen“ (Helge, 16.10.) plus Richtwert.
-- Offen: delete from gfweekly_launch_besetzung_vorher where bereich='partner'; delete from gfweekly_launch_bereiche where key='partner';
