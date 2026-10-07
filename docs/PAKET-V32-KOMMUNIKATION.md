# Das Hohe Haus · Paket V32 Kommunikation · Stand 05.10.2026

Bauanleitung für Claude Code im Repo ~/Documents/GitHub/gfweekly. Freigabe durch Alex am 05.10.2026. Ziel: Der Postingplan-Standard für alle fünf Festivals 2027 läuft im Hohen Haus. Die Geschäftsführung legt je Festival nur fest, wer die Kommunikation verantwortet, entscheidet über Budget und Extras der Stufe Rot und übergibt einmal den Rahmen. Die verantwortliche Person verteilt alles Weitere selbst in Asana oder in ihrer Redaktionstabelle. Partnerfähige Beiträge stehen als Slots für Kollektive und Formatpartner bereit.

## Leitprinzip

Das Hohe Haus verteilt keine Einzelschritte. Jede Ansicht beantwortet eine Frage der Geschäftsführung: Wer ist zuständig, wo wird es eng, was muss entschieden werden. Alles andere gehört der verantwortlichen Person. Im Zweifel weniger anzeigen und weniger nach Asana schicken.

## Zuständigkeit

Leitung Marketing der Wilden Habitate: Alexander Dettke (alex@wildemoehre.org). Verantwortliche Person Kommunikation je Festival: Bereich `komm` in `gfweekly_launch_besetzung`. Diese Besetzung gibt es schon (V27/V28); keine zweite Besetzungstabelle anlegen. Ist `komm` für ein Festival offen, ist die Leitung Marketing zuständig und die Seite zeigt „Kommunikation nicht besetzt“ unter „Diese Woche entscheiden“. Christian leitet das Subdepartment Kommunikation; er wird in der Besetzung eingetragen, nicht im Code.

## Quellen

1. `docs/referenz/postingplan/habitat-postingplan-regelwerk.json` (Schema 1.2.0) ist das Regelwerk. Maßgeblich zum Rechnen. Nicht von Hand ändern; neue Fassungen kommen aus Cowork.
2. `docs/referenz/postingplan/habitat-postingplan-regelwerk.md`: dieselben Inhalte lesbar, mit Herleitung und Begründungen. Lesen, bevor du rechnest.
3. `docs/referenz/postingplan/referenz-rechner.py`: Referenzumsetzung der Rückwärtsrechnung. Deine JS-Umsetzung muss für Lusatia mit Stichtag 05.10.2026 dieselben Zahlen liefern wie `beispiel-lus-2027-aufgaben.csv` (105 Hauptaufgaben in der CSV, davon 3 Wochenaufgaben, 776 Schritte, 14 überfällige Schritte, 0 Freigaben am Wochenende).
4. Festivaltermine, Vorverkaufsstarts und Zielgrößen nur aus `vvp_events` und der Prognoseplattform. Das Regelwerk enthält Termine 2027 nur als Prüfstand.

## Arbeitsweise und Prüfschleife

Wie V31: Branch `paket/v32-kommunikation`, Eintrag WP-V32 in `docs/ARBEITSPAKETE.md`, erster Commit mit den Cowork-Dateien (`docs(v32): Paket, Regelwerk und Startprompt aus Cowork`). Teilpakete 32a bis 32e in dieser Reihenfolge, je Teilpaket bauen, prüfen, Commit, Codex read-only am genauen Commit, Antwortdatei je Runde, höchstens drei Runden. Codex hat recht, bis das Gegenteil belegt ist. Nach jedem grünen Teilpaket sofort deployen. Technikstand in `docs/TECHNIKSTAND.md` fortschreiben, Abschlussmeldung kurz.

## 32a · Datenbasis und Rechenlogik

Migration (Kennung aus `supabase migration new`), Präfix `komm_`, weil die Daten nicht GF-vertraulich sind und der Habitat Hub sie für Partner und Redaktion liest:

1. `komm_regelwerk` (version text primary key, inhalt jsonb, aktiv bool, eingespielt_am). Eine aktive Zeile.
2. `komm_veroeffentlichungen`: id text primary key (stabile Kennung nach Rechenregel 10 des Regelwerks), event_id (vvp_events), festival_short, regel_id, titel, kanal, klasse, thema, bezug, abstand, t date, vorlaeufig bool, pflicht bool, partnerfaehig bool, status_bearbeitung, status_fakten, briefing jsonb (Zielgruppe, Zweck, Inhalt, Fachfreigabe, Faktenquelle), stunden numeric, asana_task_gid, gesendet_am, sowie Partnerfelder `partner_email`, `partner_name`, `partner_uebernommen_am`, `abgabe_url`, `abgabe_am`, `rechte_bestaetigt`, `freigabe_status` (offen, freigegeben, korrektur, abgelehnt, zurueck_an_redaktion), `freigabe_von`, `freigabe_am`, `freigabe_notiz`, updated_at.
3. `komm_schritte`: veroeffentlichung_id, schritt_id, phase, titel, rolle, werkzeug, start date, faellig date, stunden. Nur Vorschlag; wird bei jeder Berechnung ersetzt, solange die Veröffentlichung nicht gesendet ist.
4. `komm_pruefpunkte`: festival_short, datum, stufe (gruen, gelb, rot, knapp, offen), entschieden_von, entschieden_am, extras text[] (E01 bis E15), notiz.
5. `komm_log` wie `gfweekly_saison_log` (what, detail jsonb, by, at).

Feldhoheit, im Kommentar der Migration festhalten: Plan- und Briefingfelder schreibt nur das Hohe Haus (Edge Function `gfweekly`, Aktionen `komm_*`). Partner- und Freigabefelder schreibt nur der Habitat Hub (eigene Edge Function, Paket im Hub-Repo). RLS an, keine Policies, Zugriff nur über Edge Functions, wie bei `gfweekly_launch_*`.

Rechenlogik als reine Funktionen in `site/assets/komm-logik.js` (Port des Referenz-Rechners): Ereignisse, Regeln mit Bedingungen, Zusammenführen, Slots aus der Themenbibliothek, Schritte rückwärts, Werktagsregel mit Feiertagen, Verbund-Stichtag mit Vorproduktionsfenster, Überfälligkeit, Wochenlast. Test `pruefung/komm-test.mjs`: Lusatia-Zahlen wie oben, Werktagsregel an einem Feiertag, vorgezogener Timetable vor 15.06.2027, Slots partnerfähig nur mit Thema aus `partnerfaehig_themen`.

Edge Function `gfweekly`, neue Aktionen: `komm_list` (je Festival Kennzahlen, verantwortliche Person aus der Besetzung, nächste 14 Tage, Überfälliges, Prüfpunkte, Wochenlast), `komm_berechnen {festival}` (idempotent, Upsert über die stabile Kennung, gesendete Veröffentlichungen nie still verändern, sondern `status_bearbeitung = zu_pruefen` setzen, wenn sich T verschiebt), `komm_pruefpunkt_set` (Stufe und Extras; Stufe Rot und Extras mit Budget nur Alex oder Lea). Regelwerk beim ersten Lauf aus der Datei in `komm_regelwerk` einspielen.

Wirkungsprobe: `komm_berechnen` für alle fünf Festivals, danach `select festival_short, count(*), sum(stunden) from komm_veroeffentlichungen group by 1;` Erwartet je Festival rund 95 bis 105 Veröffentlichungen einschließlich interner Aufgaben; Abweichung über 10 Prozent zur Referenz begründen.

## 32b · Seite `site/kommunikation.html`

Eine Seite, Navigation unter Saison. Oben je Festival eine Zeile: verantwortliche Person (aus der Besetzung, Änderung über den bestehenden Weg in `saison.html`), Stand des Rahmens (nicht gesendet, gesendet am, zu prüfen), nächster Prüfpunkt mit Stufe, Überfälliges als Wort und Zahl. Darunter:

1. „Wo wird es eng?“: Wochenlast über alle Festivals als gestapelte Fläche mit Linien für 1 bis 4 Stellen (35 h), Vorproduktionsfenster und Festivalsaison markiert. Vorlage: Artifact „Redaktionsjahr Habitat 2027“ (Optik an das Hohe Haus anpassen, Farbe trägt keine Bedeutung allein, Werte als Wort im Tooltip).
2. „Was muss die GF entscheiden?“: offene Besetzung `komm`, Prüfpunkte mit Stufe Gelb oder Rot, Extras mit Budget, gemeldete Überlast. Knöpfe nur für diese Entscheidungen.
3. „Was steht an?“: Pflichtveröffentlichungen der nächsten 30 Tage je Festival, nur Titel, Datum, Kanal, Stand. Keine Schritte.
4. Aufklappbar „Jahresband“: Phasen, Programmwellen, Videos, Prüfpunkte je Festival.

Handy zuerst prüfen (Alex bedient das Haus oft am Handy). Assets-Version hochziehen.

## 32c · Rahmen an Asana

Aktion `komm_send {festival}`, Start nur durch Alex oder Lea, mit Vorschau in Worten wie bei `launch_send`. Ziel: Asana-Projekt „Kommunikation <Festival> 2027“, Eigentum und Zuständigkeit bei der verantwortlichen Person. Abschnitte je Monat.

Inhalt: je Veröffentlichung der Klassen P, L, PR, TM, NL, AD und INT sowie jede Pflichtveröffentlichung der Klasse M eine Aufgabe mit Fälligkeit T, zuständig die verantwortliche Person. Die Schritte stehen als abhakbare Liste in der Beschreibung („Vorschlag aus dem Regelwerk, Verteilung durch dich“), nicht als Unteraufgaben. Alle übrigen Beiträge (Klasse S, Slots) je Monat gebündelt in einer Aufgabe „Redaktion <Monat>: n Beiträge“ mit Liste. Partnerfähige Beiträge mit Hinweis „Partner-Slot“. Prüfpunkte als Aufgaben bei der verantwortlichen Person mit Link auf `kommunikation.html`.

Erneutes Senden: nur neue Aufgaben anlegen und bei vorhandenen Fälligkeit und Beschreibung aktualisieren. Zuständigkeit, Unteraufgaben, Kommentare und Abschnittswahl in Asana nie überschreiben. Kennung über `asana_task_gid`, sonst Name im Projekt (wie `launch_send` seit v35). Protokoll in `komm_log`.

## 32d · Fixtermine in der Redaktionstabelle

Tabelle „Social Media - Wilde Habitate“, ID `1CG1jQGIX2anXi2CpclgOB_kpqIKySsjK965OMQjol-k`, Reiter „Contentplan“, Eigentümer Christian, Domäne wildemoehre.org hat Schreibrecht. Aufbau: Datum je Spalte ab F (Zeile 5, Formel ab `F5`), Wochentag Zeile 4, Monat Zeile 3, Zeile 6 „Fixtermine & Meilensteine“, darunter Festivalblöcke mit Auswahllisten. Geschrieben wird ausschließlich in Zeile 6 ab Spalte F. Nie in andere Zeilen, Formeln, Auswahllisten oder Formatierungen.

Inhalt je Tag, mehrere Einträge mit „ · “ getrennt, Festival als Kürzel (WM, DB, LUS, BN, FLU): VVK, P1 bis P3, Lineup, F, Z, Prüfpunkt, Stichtag Vorproduktion (15.06.2027), Gästeinfos freigegeben (01.07.2027). Vorher prüfen, ob die Zelle leer ist oder schon von uns stammt (Kennung im Zellhinweis `komm:<id>`); fremde Inhalte nie überschreiben, sondern im Bericht melden.

Startzelle: `F5` steht auf `=DATE($B$2,1,1)` mit Planungsjahr 2027, der Kalender beginnt also am 01.01.2027. Freigabe Alex am 06.10.2026 im Chat: `F5` auf `=DATE(2026,10,1)` setzen und Zeile 6 befüllen, ohne weitere Rückfrage; sonst nichts an der Tabelle ändern. Danach Spaltenzahl prüfen (bis mindestens 31.12.2027).

Zugang: belegten Weg wählen. Bevorzugt ein Dienstkonto im Google-Cloud-Projekt „Wilde Habitate Kalender“ mit Bearbeitungsrecht auf genau diese Tabelle. Fehlt das Teilen, als Aufgabe für Alex melden („Tabelle mit <Dienstkonto> teilen, 1 Minute“). Aktion `komm_tabelle_sync {festival|alle}`, idempotent, Protokoll in `komm_log`, täglicher Lauf mit dem bestehenden Tick.

## 32e · Slots für Partner

Aktionen für den Habitat Hub und den Baukasten, abgesichert mit dem bestehenden `ANBINDUNG_SCHLUESSEL`: `komm_slots_offen` (partnerfähig, nicht übernommen, T mindestens 14 Tage entfernt, mit Briefing, Format und Abgabefrist T-7), `komm_slot_details {id}`. Schreiben übernimmt der Hub selbst (Feldhoheit oben). Automatik im täglichen Tick: partnerfähige Beiträge ohne Übernahme 10 Tage vor T auf `freigabe_status = zurueck_an_redaktion`, abgegebene ohne Freigabe 3 Tage vor T als Hinweis an die verantwortliche Person.

## Abnahme V32

Alle fünf Festivals berechnet, Seite am Handy und am Rechner geprüft, `komm_send` zuerst mit Lusatia gegen ein Asana-Testprojekt „Kommunikation TEST“ (danach löschen), Fixtermine für alle fünf in Zeile 6, Slots über `komm_slots_offen` abrufbar, Tests grün, Codex-Runden beantwortet, Technikstand fortgeschrieben, live.

Durchlauf (Freigabe Alex am 06.10.2026 im Chat: „es soll jetzt einmal alles automatisch durchlaufen“): Nach der Abnahme ohne weitere Rückfrage 1. Besetzung `komm` für alle fünf Festivals auf Christian setzen und als Alex bestätigen (`bestaetigt_von` Alex, Quelle „Freigabe Alex Chat 06.10.2026“), nur wo `komm` offen ist oder schon Christian trägt; eine andere eingetragene Person nicht überschreiben, sondern melden; 2. `komm_send` echt für alle fünf Festivals als Alex; 3. `komm_tabelle_sync alle`. Ergebnis je Festival im Technikstand.

## Grenzen

Keine Zugangsdaten in Dateien oder Protokollen. Keine Personen aus dem Pool streichen oder hinzufügen. Keine Änderungen an Christians Tabelle außer Zeile 6 und `F5`. Keine neuen kostenpflichtigen Dienste.
