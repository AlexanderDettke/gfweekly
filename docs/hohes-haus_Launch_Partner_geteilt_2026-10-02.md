# Das Hohe Haus · Launch: Partnerbereich geteilt (02.10.2026)

Auftrag Alex (Chat 02.10.): Partnerbereich je Festival in Formatpartner und Kollektive teilen, Verantwortliche festlegen, Helge den Kollektiv-Auftrag für by nature geben. Per Supabase-MCP als Datenänderung umgesetzt (kein Code nötig, launch.html und Edge Function lesen die Bereiche aus gfweekly_launch_bereiche). Dokumentiert im Repo als supabase/migrations/20261002150000_hh_launch_partner_teilen.sql, Commit f4832b2 (lokal, Push durch Alex offen; die Datenänderung ist bereits live).

## Bereiche
Neu: formatpartner „Formatpartner“ (Formatpartner gewinnen, verhandeln und einbinden, Partnerpaket), kollektive „Kollektive“ (Kollektive auswählen, ansprechen und einbinden), beide Entwicklung, Reihenfolge 6 und 7; Systeme 8, Recht 9. Richtwert und die fünf Meilensteine „Partnerpaket bereit“ hängen jetzt an formatpartner. Pool-Felder: wer partner hatte (Jessica, Helge, Subardo, Novo-Kollektiv, Slawik, Jane), hat jetzt beide; Annie Oelmann ergänzt.
Alter Bereich partner: nicht mehr verwendet, umbenannt in „Partner (alt, entfällt)“, sort 99. Löschen steht aus (Löschbefehle über den Supabase-MCP brauchen eine Freigabe, die nicht rechtzeitig kam): `delete from gfweekly_launch_besetzung_vorher where bereich='partner'; delete from gfweekly_launch_bereiche where key='partner';`

## Besetzung (beide Bereiche gleich, Status bestätigt, bestaetigt_von Alex, Quelle „Entscheidung Alex 02.10.2026“, Protokoll in gfweekly_saison_log mit Vorzustand)
- Draußenbande (FAMRD27): Lea Luce, „erstmal“ (Notiz)
- Fluidity (FLRD27): Slawik Snitkowski, Annie Oelmann als Hilfe an den Partner-Meilensteinen
- Lusatia (LUSRD27): Subardo, „plus weitere, noch zu benennen“ (ersetzt die alte Notiz „Kollektive bei Helge“)
- Wilde Möhre (WMRD27): Alexander Dettke
- by nature (BYNRD27): Helge
Vorher: Möhre und by nature Helge (Vorschlag), Lusatia Subardo (Vorschlag), Fluidity Slawik (Vorschlag), Draußenbande Novo-Kollektiv (bestätigt). Meilensteine folgen (bestätigt, responsible gesetzt); Draußenbande „Partnerpaket bereit“ war schon nach Asana gesendet (Lea) und blieb unverändert.

## Auftrag Helge (Meilenstein im by-nature-Plan, id 4bdd2c14-38af-42fd-b12f-160cf291e608)
„Kollektive für by nature bewerten und Ansprache planen“, Bereich Kollektive, Helge, bestätigt, fällig 16.10.2026 (VVK by nature 01.11.), Aufwand 6–12 Std., Dauer 10 Tage, Generator-Anteil 0,3, Richtwert mit VVK-Abstand −16 Tage angelegt. Inhalt: alle Kollektive im Hub (Art Kollektiv, 103) gegen by nature prüfen, je passendem Kollektiv Begründung, Bereich, Priorität A/B/C; Kontaktplan wer, wann, über welchen Weg, mit welcher Ansprache; Ergebnis an Alex, danach A-Kandidaten im Hub als Gespräch anlegen; keine Zusagen, Budgets oder Verträge. Noch nicht nach Asana gesendet: das geschieht auf launch.html (by nature → Senden).

## Hinweise
- Subardo hat kein Asana-Konto; beim Senden entsteht für Lusatia eine Angebotsaufgabe bei der übergebenden Person.
- „Partnerpaket bereit“ Wilde Möhre steht auf 25.08.2026 (überfällig).
- Helges Rollenentscheidung ist bis 09.10. offen (Notiz der alten Besetzung).
