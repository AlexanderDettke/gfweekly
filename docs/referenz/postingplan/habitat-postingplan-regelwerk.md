# Postingplan-Standard Habitat-Festivals

Stand 05.10.2026 · Schema 1.2.0 · Grundlage zum Hochladen in den Werkzeugkasten

Mindeststandard und Extras für die Festivalkommunikation. Aus Ereignisdaten werden Veröffentlichungen und deren Arbeitsschritte rückwärts berechnet, Rollen zugeteilt und als Aufgaben an Asana oder Kalender übergeben. Generatoren des Werkzeugkastens erzeugen Entwürfe, Menschen geben frei.

Alle Mengen, Stunden und Vorläufe sind Planungsannahmen. Nach der ersten Saison mit echten Zeiten nachstellen.

Lesehinweis für Werkzeuge: Maßgeblich zum Rechnen ist `habitat-postingplan-regelwerk.json`. Diese Datei enthält dieselben Regeln lesbar plus Herleitung, Prüfergebnis, Jahresverlauf und Quellen. Kennungen (Regel-IDs, Klassen, Rollen, Themen B01 bis B32, Extras E01 bis E15) sind in beiden Dateien gleich.

## 1 Dateien und Zusammenspiel

| Datei | Zweck |
| --- | --- |
| `habitat-postingplan-regelwerk.json` | Maschinenlesbares Regelwerk. Das Werkzeug rechnet ausschließlich damit. |
| `habitat-postingplan-regelwerk.md` | Diese Datei: Herleitung, Prüfergebnis, Grundsätze, das komplette Regelwerk, Themenbibliothek, Jahresverlauf, Aufwand, Belege und Quellen. Kontext für Generatoren und für das Werkzeug, das alles zusammenführt. |
| `referenz-rechner.py` | Beispielumsetzung der Rückwärtsrechnung in Python. Liest das JSON und schreibt eine Aufgaben-CSV. |
| `beispiel-lus-2027-aufgaben.csv` | Ergebnis für Lusatia 2027, berechnet am 05.10.2026. Zeigt Hauptaufgaben und Schritte mit Rollen und Terminen. |

Ablauf im Werkzeug: Festivaldaten aus der Prognoseplattform lesen, Regeln anwenden, Schritte rückwärts terminieren, Rollen mit Personen besetzen, Generatoren pro Schritt mit dem Briefing aufrufen, Ergebnis als Entwurf ablegen, nach Freigabe an Asana und Kalender übergeben.

## 2 Herleitung: von den alten Plänen zum neuen Standard

Der neue Standard ist ein Umbau, kein Bruch. Es gibt drei Stufen.

**Die alten Pläne (2019 bis 2026)** waren Themenlisten nach Monaten, ausgerichtet auf die Wilde Möhre im August: Bewerbungen im Januar, DJs im Februar, Helfende im Mai, Timetable im August. Gearbeitet wurde in Coda, Asana und Tabellen, jedes Jahr neu.

**Die Grundlage (`festival-postingplan-grundlage.md`)** hat daraus einen Themenkatalog gemacht (B01 bis B32) und die Termine an Ereignisse gekoppelt statt an Monate.

**Das neue Regelwerk** beschreibt nicht mehr nur, was erscheint, sondern die Arbeit dahinter: wer wann anfängt, wie lange es dauert, wer freigibt. Das gilt für fünf Festivals gleichzeitig und ist so aufgebaut, dass ein Werkzeug damit rechnen kann.

|  | Alte Pläne | Grundlage | Neues Regelwerk |
| --- | --- | --- | --- |
| Bezugspunkt | Monat | Ereignis (F, Z, Ticketstart) | Ereignis, plus Verbund-Stichtage über alle fünf Festivals |
| Einheit | Themenzeile | Posting mit Zeitfenster | Veröffentlichung mit 3 bis 13 Arbeitsschritten |
| Vorlauf | nicht geregelt | ein Ablauf für Kooperationen (14, 7, 3, 1 Tag) | je Aufgabenart 3 bis 42 Tage, mit Werktagsregel |
| Zuständigkeit | Name in der Aufgabe | verantwortliche Person | Geschäftsführung legt die verantwortliche Person fest; diese verteilt 13 vorgeschlagene Rollen selbst |
| Timetable | 1 bis 4 Tage vorher | 7 bis 14 Tage vorher | 14 Tage vorher, interne Freigabe 28 Tage vorher |
| Anreise | 16 Tage vorher (WM 2025) | 42 bis 21 Tage vorher | Grundlagen ab Vorverkauf, Details 42 Tage vorher |
| Wenn es nicht läuft | nicht geregelt | nicht geregelt | Prüfpunkte, Stufen, 15 Extras |
| Werkzeuge | händisch | händisch | Generator je Schritt, Übergabe an Asana und Kalender |
| Themen | jährlich neu gesammelt | Katalog B01 bis B32 | Katalog B01 bis B32 als Themenbibliothek, jedem Thema Regeln oder Slots zugeordnet |

**Warum der Sprung nötig ist**

1. Die Lage 2027 ist eine andere. Die alten Pläne funktionierten für ein großes Festival mit etwa einem halben Jahr Vorlauf. Jetzt laufen fünf Festivals innerhalb von fünf Wochen, mit 40 bis 56 Wochen Vorverkauf und drei Erstauflagen oder Neustarts. Ein Monatsraster für den August passt nicht auf Lusatia im Juli und sieht nicht, dass die Infos sieben Tage vor jeder Öffnung auf den Eröffnungstag des vorherigen Festivals fallen.

2. Die Arbeit war bisher unsichtbar. Alte Pläne und Grundlage sagen, wann etwas erscheint, aber nicht, wann jemand anfangen muss. Erst die Rückwärtsrechnung zeigt, dass für Lusatia am 05.10.2026 schon 14 Schritte überfällig sind und dass der Mai 2027 die dichteste Zeit wird.

3. Gäste brauchen Infos früher. Ein Timetable einen Tag vorher hilft bei der Kaufentscheidung nicht mehr. Wer bucht, will vorher wissen, wie aufwendig Anreise und Unterkunft sind.

4. Es kann automatisch laufen. Nur mit festen Regeln, Rollen und Kennungen kann der Werkzeugkasten Aufgaben erzeugen, Generatoren füttern und an Asana übergeben, ohne dass jemand jedes Jahr neu abtippt.

**Was vom Alten bleibt:** die gemeinsamen Beiträge mit Artists und Kollektiven, die Dankesserie, der Faktencheck vor jeder Veröffentlichung, die Regel, dass nur wirklich Veröffentlichtes als veröffentlicht gilt, und der komplette Themenkatalog der Grundlage. Der Ablauf für Kooperationen aus der Grundlage steckt fast unverändert in der Klasse M. Die Countdowns der Wilden Möhre 2026 sind als optionale Regeln CD-100 und CD-30 enthalten.

**Was in Version 1.1 ergänzt wurde:** Im Abgleich mit der Grundlage fehlten einige Themen als eigene Regel. Deshalb gibt es jetzt die Themenbibliothek B01 bis B32 (Redaktionsslots ziehen ihre Themen daraus), die Regeln A-AUFRUF und A-EINBLICK für den Aufbau, CD-100 und CD-30 für Countdowns und Z10-GALERIE für die Fotogalerie.

**Grenze:** Dass der neue Standard besser wirkt, ist nicht bewiesen. Es gibt keine Daten dazu, wann früher tatsächlich gepostet wurde und was es gebracht hat. Der Sprung begründet sich mit der veränderten Lage und der fehlenden Planbarkeit, nicht mit gemessenem Erfolg. Empfehlung: ein Festival vollständig nach dem Standard fahren, Aufwand und Verkauf mitschreiben und nach der Saison vergleichen.

## 3 Ergebnis der Prüfung von Kommunikationsstandard und Prüfvorlage

Geprüft wurden `habitat-festivals-kommunikationsstandard.md` und `habitat-festivals-pruefvorlage.md` (beide Stand 05.10.2026). Die Grundlogik trägt: vom Ereignis rückwärts planen, Fakten und Freigabe trennen, Pflichtinformationen vor Menge. Für die Saison 2027 fehlten zwei Dinge im Aufbau: Die Zeitachse war zu kurz, und es gab keine Ebene für den Verbund der Festivals. Beides ist in diesem Regelwerk gelöst.

**Zeitachse.** Die Prüfvorlage rechnete mit 26 Wochen zwischen Vorverkauf und Festival. Tatsächlich:

| Festival | Vorverkauf | Gästeöffnung | Abstand |
| --- | --- | --- | --- |
| Fluidity | 01.08.2026 | 27.08.2027 | 56 Wochen |
| Wilde Möhre | 01.09.2026 | 20.08.2027 | 50 Wochen |
| Draußenbande | 10.10.2026 | 30.07.2027 | 42 Wochen |
| Lusatia | 15.10.2026 | 23.07.2027 | 40 Wochen |
| by nature | 01.11.2026 | 06.08.2027 | 40 Wochen |

Deshalb werden die Phasen von der Gästeöffnung aus gerechnet, mit einer Winterruhe und festen Saisonanlässen (Black Friday, Geschenk-Tickets, Urlaubsplanung im Januar). Der Vorverkauf der nächsten Ausgabe kann vor dem Ende der laufenden liegen (Fluidity) und wird dann mit der Nachbereitung zusammengelegt.

**Verbund.** Die Infos sieben Tage vor jeder Öffnung fallen auf den Eröffnungstag des vorherigen Festivals:

| Festival | Infos bündeln (F-7) | an diesem Tag |
| --- | --- | --- |
| Draußenbande | 23.07.2027 | Lusatia öffnet |
| by nature | 30.07.2027 | Draußenbande öffnet |
| Wilde Möhre | 13.08.2027 | Pause zwischen by nature und Wilde Möhre |
| Fluidity | 20.08.2027 | Wilde Möhre öffnet |

Daraus folgen Verbund-Kalender, Stichtag Vorproduktion 15.06.2027, Gästeinfos freigegeben bis 01.07.2027 und eine eigene Community-Betreuung je Festivalwoche.

**Geänderte Fristen gegenüber den Ausgangsdokumenten**

| Punkt | Bisher | Jetzt |
| --- | --- | --- |
| Shop und Ticketarten | V-21 bis V-14 | Einrichtung ab V-42, Testkauf bis V-14, Ankündigung erst nach erfolgreichem Testkauf |
| Interessentenliste | L-7, optional | Pflicht bei Erstauflage oder Neustart |
| Produktionsvorlauf | immer 14 Tage bzw. 7 bis 14 Tage | je Klasse 3 bis 42 Tage |
| Freigabe | 3 Kalendertage vorher | Werktag; Wochenende und Feiertag rücken auf den Werktag davor |
| Programmwellen | keine Anzahl | 4 Wellen bei F-200, F-150, F-100, Lineup komplett F-45 |
| Timetable | F-14 bis F-7 | interne Programmfreigabe F-28, Veröffentlichung F-14 |
| Buchungsschlüsse, Ticketumschreibung | fehlten | eigene Ereignisse mit D-14 und D-3 |
| Nachbereitung und nächste Ausgabe | Z+3 bis Z+7 | Rebooking-Fenster, sobald der nächste Vorverkauf läuft |
| Aftermovie | nach Freigabe | Ziel Z+60 |

**Ergänzte Inhalte:** Presse mit Akkreditierung, Anwohner- und Gemeindeinformation, feste Mails an Ticketinhabende unabhängig vom Newsletter, Krisenvorlagen mit Rufbereitschaft, Antwortzeiten für die Community-Betreuung, Werbekennzeichnung, Musiklizenzen, Foto- und Filmregeln, Double-Opt-in, Festival-App als Kanal und das Merkmal verknappung_erlaubt je Festival (bei Draußenbande nein).

**Sprache und Aufbau:** Begriff Care statt Awareness. Kommunikationsstandard und Prüfvorlage überschnitten sich stark und widersprachen sich bei Vorläufen; dieses Regelwerk ersetzt beide als eine Quelle. Der Quellenlink auf einen chatgpt.com-Space ist für das Team nicht zugänglich.

## 4 Grundsätze

1. Das Festivalprofil bestimmt die Kommunikation. Jedes Festival behält eigene Sprache und Gestaltung, auch wenn der Ort derselbe ist.
2. Publikumsfragen bestimmen die Themen mit. Kommentare, Nachrichten, Suchanfragen und Gästeservice fließen in die Redaktion; wiederkehrende Fragen werden auf der Website und in Beiträgen beantwortet.
3. Eigene Menschen und Erfahrungen liefern das Material. Artists, Crews, Kollektive, Gäste und Mitarbeitende machen das Festival konkret. Nutzungsrechte werden vor Veröffentlichung geklärt.
4. Jede Maßnahme hat eine Hauptaufgabe: Entdeckung, Vertrauen, Entscheidung, Orientierung oder Wiederkehr. Nicht jeder Beitrag muss Tickets verkaufen.
5. Wichtige Informationen bleiben auffindbar. Website oder Infoseite halten bestätigte Fakten aktuell; Social Media und Newsletter führen dorthin.
6. Kapazität bestimmt den Umfang. Wenige gut betreute Kanäle gehen vor. Produktion, Freigabe, Antworten und Auswertung werden mitgeplant.
7. Echte Anlässe begründen Dringlichkeit. Preiswechsel, knappe Kontingente und Fristen werden erst nach Bestätigung kommuniziert.
8. Fachliche Verantwortung bleibt sichtbar. Redaktionelle Freigabe ersetzt keine Faktenprüfung.
9. Generatoren liefern Entwürfe. Preise, Namen, Zusagen, Bestände, Gästestimmen und Care-Maßnahmen werden nie erfunden.
10. Ergebnisse verändern den nächsten Plan. Starke Themen werden weiterentwickelt, schwache anhand ihres Ziels geprüft.

## 5 Zielgruppen und Kanalrollen

Je Festival werden die zwei bis vier wichtigsten Publikumsgruppen beschrieben. Die Generatoren erhalten diese Angaben als Eingabe zielgruppe.

| Angabe | Was festgehalten wird |
| --- | --- |
| Besuchsmotiv | Welches Erlebnis oder Bedürfnis macht das Festival relevant? |
| Besuchserfahrung | Erstbesuch, Wiederkehr oder unentschieden |
| Planungssituation | allein, Gruppe, Familie; nötiger Vorlauf für Reise und Urlaub |
| Einwände | Preis, Anreise, Unterkunft, Unsicherheit über Atmosphäre oder Programm |
| Informationsverhalten | genutzte Kanäle, Suchfragen, vertrauenswürdige Vermittler |
| Belege | Befragungen, Verkaufsdaten, Gespräche, Beobachtungen |
| Unsicherheit | Was ist bekannt, was Annahme, was wird getestet? |
| Konsequenz | passende Botschaft, Format und nächster Schritt |

Mitwirkende (Crew, Helfende, Bewerbungen) sind eine eigene Gruppe mit eigenen Wegen.

| Kanal | Rolle | Mindestanforderung |
| --- | --- | --- |
| Website und Ticketshop | Orientierung und Abschluss | aktuelle Infos, verständliches Angebot, geprüfter Kaufweg |
| Social Media | Entdeckung, Profil, Austausch | eigene Geschichten, betreute Kommentare und Nachrichten |
| Newsletter | Beziehung und Entscheidungshilfe | eigener Nutzen, Empfängergruppen, ein Hauptlink |
| Mails an Ticketinhabende | Orientierung | Pflichtinfos auch für Menschen, die dem Account nicht folgen |
| Anzeigen | gezielte Reichweite | freigegebenes Budget, Ziel, mehrere Motive, Wirkungsmessung |
| Presse | Reichweite und Glaubwürdigkeit | Mitteilung, Pressefotos, Akkreditierung |
| Artists, Crews, Partner | Communities erreichen | abgestimmte Beteiligung, Material, Credits |
| Festival-App | Orientierung vor Ort | Timetable, Geländeplan, Änderungen |

Für ein kleines Team reicht als Start: aktuelle Website, ein betreuter Hauptkanal, Newsletter und Mails an Ticketinhabende. Kein Festival muss alle Kanäle bedienen.

## 6 Rechenregeln

Plantermin = Ereignisdatum plus Abstand in Kalendertagen. Zeitzone Europe/Berlin. Schritttermine werden vom Veröffentlichungstag T zurückgerechnet.

1. Ereignisse aus der Prognoseplattform lesen. Nur bestätigte Daten erzeugen verbindliche Aufgaben; vorläufige Daten erzeugen sichtbar vorläufige Aufgaben; fehlende Daten bleiben offen.

2. Regeln anwenden: Veröffentlichungstermin T = Ereignisdatum + abstand. Regeln mit bedingung nur, wenn das Festivalmerkmal zutrifft.

3. Zusammenführen: gleiche Regel-ID, gleicher Kanal, gleicher Tag wird ein Datensatz. Fallen L und V zusammen, entsteht ein gemeinsames Paket.

4. Redaktionsslots ergänzen, bis die Phasenmenge je Woche erreicht ist (Regel SLOT).

5. Schritte aus der Klasse erzeugen: Schritttermin = T + von bzw. T + bis. Begleitend story fügt einen Schritt CM 0,5 h an T hinzu, begleitend website eine Aufgabe der Klasse WEB.

6. Werktagsregel: Schritte mit werktag=true rücken von Samstag, Sonntag oder Feiertag (Brandenburg und Berlin) auf den Werktag davor. Veröffentlichungen am Wochenende sind erlaubt, wenn CM besetzt ist.

7. Verbund-Stichtag: Für Veröffentlichungen ab dem Tag F-21 des ersten Festivals der Saison bis zum Ende der Saison enden alle Schritte der Phasen planung, erstellung und abstimmung der Klassen M, P und L spätestens am Stichtag Vorproduktion. Die vorgezogenen Aufgaben werden gleichmäßig über das Vorproduktionsfenster (84 Tage vor dem Stichtag) verteilt, früheste Veröffentlichung zuerst. Dafür wird ein Schritt E9 Fakten aktualisieren und Fassung finalisieren (RED, T-7 bis T-6, 0,5 h), danach folgen Faktencheck und Freigabe wie gewohnt ergänzt.

8. Liegt ein Schritt vor dem Berechnungstag, wird er als überfällig markiert und nicht als erledigt eingetragen. Priorität: Sicherheit und Betrieb, dann Fristen und Gästeinformationen, dann Kampagne, dann Geschichten.

9. Kapazität prüfen: Die verantwortliche Person gleicht Stunden je Rolle und Woche mit ihrer Besetzung ab. Bei Überlast zuerst vorziehen, dann bündeln, dann Slots streichen; Pflichtregeln nie streichen. Reicht das nicht, meldet sie es an die Geschäftsführung (Hohes Haus), die über zusätzliche Leute, Agentur oder Verschiebung entscheidet.

10. Stabile ID je Aufgabe: {festival}-{ausgabe}-{regel}-{bezug}{nr}-{kanal}; Schritte mit Suffix -{schritt}. Neuberechnung aktualisiert vorhandene Datensätze und erzeugt keine Kopien.

11. Ändert sich ein Ereignis, werden offene Aufgaben neu berechnet. Bereits extern terminierte Veröffentlichungen werden als zu prüfen markiert. Erledigte Schritte behalten ihr Datum.

12. Generatoren erzeugen Entwürfe. Veröffentlichung, Versand und Anzeigenstart erst nach den Freigabeschritten.

## 7 Rollen

Zuständigkeit in zwei Ebenen: Die Geschäftsführung legt im Hohen Haus je Festival nur die verantwortliche Person für die Kommunikation fest (Rolle KOM) und entscheidet über Budget und Extras der Stufe Rot. Die verantwortliche Person verteilt alle übrigen Rollen und Schritte selbst, in ihrer Redaktionstabelle oder in Asana (Feld besetzung: E-Mail, Vertretung, Wochenstunden). Die Rollen und Schritte des Regelwerks sind dabei ein Vorschlag, keine Vorgabe. Eine Person kann mehrere Rollen haben. Externe Beteiligte (Artists, Crews, Kollektive) sind keine Rolle, sondern stehen im Feld beteiligte.

| Rolle | Name | Aufgaben | Person je Festival | Vertretung |
| --- | --- | --- | --- | --- |
| KOM | Kommunikationsleitung | Briefings, Redaktionsfreigabe, Prüfpunkte, Kapazität | offen | offen |
| RED | Redaktion | Texte, Skripte, Newsletter, Abstimmung mit Beteiligten | offen | offen |
| GRA | Gestaltung | Grafiken, Karussells, Anzeigenmotive | offen | offen |
| VID | Video | Drehplanung, Dreh, Schnitt, Untertitel | offen | offen |
| CM | Community-Betreuung | Einplanen, Posten, Stories, Kommentare und Nachrichten, Dokumentation | offen | offen |
| WEB | Website und Shop | Infoseiten, Programmseite, Ticketshop, Links | offen | offen |
| ADS | Anzeigen | Zielgruppen, Tracking, Start, Kontrolle, Stopp | offen | offen |
| PRESSE | Presse | Mitteilungen, Akkreditierung, Medienkontakte | offen | offen |
| FACH-TIX | Fachfreigabe Ticketing | Preise, Kontingente, Fristen, Kaufweg | offen | offen |
| FACH-PROG | Fachfreigabe Programm | Namen, Schreibweisen, Zeiten, Embargos | offen | offen |
| FACH-CARE | Fachfreigabe Care | Care-Angebote, Kontaktwege, Zugänglichkeit | offen | offen |
| FACH-BETR | Fachfreigabe Betrieb | Anreise, Gelände, Einlass, Sicherheit, Wetter, Anwohner | offen | offen |
| GF | Geschäftsführung | Budgets, Rabatte, Extras der Stufe Rot | offen | offen |

## 8 Werkzeuge des Baukastens

Generatoren erzeugen immer den Status entwurf. Ein Entwurf wird erst nach den Schritten Faktencheck und Freigabe veröffentlicht. Preise, Namen, Zusagen, Bestände, Gästestimmen und Care-Maßnahmen kommen nur aus bestätigten Quellen.

| Werkzeug | Liefert | Eingaben aus dem Briefing |
| --- | --- | --- |
| Textgenerator (GEN-TEXT) | Post-, Newsletter-, Mail-, Website- und Pressetexte | festival, zielgruppe, zweck, kernbotschaft, belegtes_detail, kanal, format, naechster_schritt, faktenquelle, tonalitaet |
| Skriptschreiber (GEN-SKRIPT) | Video- und Reel-Skripte mit 2 bis 3 Einstiegen | festival, zielgruppe, motiv_oder_einwand, kernbotschaft, belegtes_detail, dauer_sekunden, beteiligte, material, naechster_schritt |
| Grafikgenerator (GEN-GRAFIK) | Feedgrafiken, Storygrafiken, Anzeigenmotive | festival_ci, format, motiv, textbausteine, material, credits |
| Content-Generatoren (GEN-CONTENT) | Karussellfolgen, Storysequenzen, Varianten für Kanäle | festival, zielgruppe, frage_oder_thema, anzahl_teile, kanal, material |

Standardformate:

| Kanal | Format |
| --- | --- |
| feed | Instagram-Feed 1080 x 1350 (4:5), Karussell bis 10 Teile |
| reel | Hochformat 1080 x 1920 (9:16), Kernaussage in den ersten 2 Sekunden, Untertitel |
| story | 1080 x 1920, eine Aussage je Teil, Link-Sticker |
| newsletter | 600 px Breite, Betreff, Vorschautext, ein Hauptlink |
| website | Infoseite oder Programmseite des Festivals |
| presse | Mitteilung mit Pressefotos und Ansprechperson |
| anzeige | Varianten 4:5 und 9:16, je Motiv oder Einwand eine Variante |
| mail_ticketinhabende | Servicemail an Käufer:innen über das Ticketsystem |

## 9 Aufgabenklassen mit Planung, Erstellung und Posting

Jede Veröffentlichung gehört zu einer Klasse. Die Klasse legt die Schritte, die Rollen, das zugeordnete Werkzeug und den Vorlauf fest. Schritte mit Werktagsregel rücken vom Wochenende oder Feiertag auf den Werktag davor.

| Klasse | Name | Vorlauf | Stunden | Planung | Erstellung und Abstimmung | Freigabe | Posting | Nachbereitung |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| S | Einfacher Beitrag | 7 Tage | 3,2 | 0,25 h | 1,5 h | 0,5 h | 0,35 h | 0,6 h |
| M | Mittlerer Beitrag | 14 Tage | 8,25 | 1 h | 5,25 h | 0,5 h | 0,5 h | 1 h |
| P | Programmwelle | 28 Tage | 10 | 2 h | 6 h | 0,5 h | 1 h | 0,5 h |
| L | Video mit Dreh | 42 Tage | 20,5 | 5 h | 14 h | 0,75 h | 0,25 h | 0,5 h |
| NL | Newsletter | 10 Tage | 4 | 0,25 h | 2,25 h | 0,5 h | 0,75 h | 0,25 h |
| TM | Mail an Ticketinhabende | 7 Tage | 3 | 0,25 h | 1,25 h | 0,75 h | 0,75 h | 0 h |
| WEB | Website-Update | 3 Tage | 1,5 | 0 h | 1 h | 0,25 h | 0,25 h | 0 h |
| PR | Pressemitteilung | 14 Tage | 5 | 0,5 h | 3 h | 0,75 h | 0,5 h | 0,25 h |
| AD | Anzeigenkampagne | 14 Tage | 5,75 | 0,5 h | 4 h | 0,5 h | 0,25 h | 0,5 h |

### Klasse S: Einfacher Beitrag

Beispiel: Erinnerung, Foto-Post mit vorhandenem Material. Summe 3,2 h.

| Schritt | Phase | Aufgabe | Rolle | Werkzeug | Zeitraum | Stunden |
| --- | --- | --- | --- | --- | --- | --- |
| P1 | planung | Briefing anlegen (Zielgruppe, Zweck, Kernbotschaft, Faktenquelle) | KOM |  | T-7 | 0,25 |
| E1 | erstellung | Text erzeugen und überarbeiten | RED | Textgenerator | T-6 bis T-5 | 0,5 |
| E2 | erstellung | Grafik erzeugen und anpassen | GRA | Grafikgenerator | T-6 bis T-4 | 1 |
| F1 | freigabe | Faktencheck | Fachrolle der Regel |  | T-4 bis T-3 | 0,25 |
| F2 | freigabe | Redaktionsfreigabe | KOM |  | T-3 | 0,25 |
| X1 | posting | Einplanen, Links und Markierungen prüfen | CM |  | T-1 | 0,25 |
| X2 | posting | Veröffentlichung kontrollieren | CM |  | T | 0,1 |
| N1 | nachbereitung | Kommentare und Nachrichten betreuen | CM |  | T bis T+2 | 0,5 |
| N2 | nachbereitung | Link und Ergebnis dokumentieren | CM |  | T+7 | 0,1 |

### Klasse M: Mittlerer Beitrag

Beispiel: Karussell, Reel aus vorhandenem Material, Infobündel. Summe 8,25 h.

| Schritt | Phase | Aufgabe | Rolle | Werkzeug | Zeitraum | Stunden |
| --- | --- | --- | --- | --- | --- | --- |
| P1 | planung | Briefing anlegen | KOM |  | T-14 | 0,5 |
| P2 | planung | Material und Beteiligte anfragen | RED |  | T-14 bis T-10 | 0,5 |
| E1 | erstellung | Text oder Skript erzeugen und überarbeiten | RED | Textgenerator oder Skriptschreiber | T-10 bis T-8 | 1,5 |
| E2 | erstellung | Karussell oder Schnitt erstellen | GRA | Content-Generatoren oder Grafikgenerator | T-9 bis T-6 | 3 |
| A1 | abstimmung | Mit Beteiligten abstimmen, Collab-Einladung klären | RED |  | T-7 bis T-5 | 0,75 |
| F1 | freigabe | Faktencheck | Fachrolle der Regel |  | T-5 bis T-4 | 0,25 |
| F2 | freigabe | Redaktionsfreigabe | KOM |  | T-3 | 0,25 |
| X1 | posting | Einplanen, Collab und Markierungen setzen | CM |  | T-1 | 0,25 |
| X2 | posting | Veröffentlichung kontrollieren, Beteiligte informieren | CM |  | T | 0,25 |
| N1 | nachbereitung | Kommentare und Nachrichten betreuen | CM |  | T bis T+3 | 0,75 |
| N2 | nachbereitung | Link und Ergebnis dokumentieren | CM |  | T+7 | 0,25 |

### Klasse P: Programmwelle

Beispiel: Lineup-Ankündigung mit mehreren Artists und Kollektiven. Summe 10 h.

| Schritt | Phase | Aufgabe | Rolle | Werkzeug | Zeitraum | Stunden |
| --- | --- | --- | --- | --- | --- | --- |
| P1 | planung | Namensliste und Briefing mit Programmteam | KOM |  | T-28 | 0,5 |
| P2 | planung | Embargo, Material, Accounts und Schreibweisen bei Artists einholen | RED |  | T-28 bis T-14 | 1,5 |
| E1 | erstellung | Texte je Act erzeugen und überarbeiten | RED | Textgenerator | T-14 bis T-10 | 2 |
| E2 | erstellung | Lineup-Grafik und Einzelkacheln erstellen | GRA | Grafikgenerator | T-12 bis T-8 | 3 |
| A1 | abstimmung | Freigabe durch Artists, gemeinsame Veröffentlichung vereinbaren | RED |  | T-8 bis T-5 | 1 |
| F1 | freigabe | Programm-Fakten prüfen | FACH-PROG |  | T-5 bis T-4 | 0,25 |
| F2 | freigabe | Redaktionsfreigabe | KOM |  | T-3 | 0,25 |
| W1 | posting | Programmseite der Website vorbereiten | WEB |  | T-2 bis T-1 | 0,5 |
| X1 | posting | Einplanen, Materialpaket an Beteiligte senden | CM |  | T-1 | 0,5 |
| N1 | nachbereitung | Kommentare betreuen, geteilte Beiträge sammeln | CM |  | T bis T+3 | 0,5 |

### Klasse L: Video mit Dreh

Beispiel: Erlebnis-, Menschen-, Anreise- oder Care-Video, Aftermovie. Summe 20,5 h.

| Schritt | Phase | Aufgabe | Rolle | Werkzeug | Zeitraum | Stunden |
| --- | --- | --- | --- | --- | --- | --- |
| P1 | planung | Konzept und Briefing | KOM |  | T-42 | 1 |
| P2 | planung | Skript mit 2 bis 3 Einstiegen erzeugen und auswählen | RED | Skriptschreiber | T-40 bis T-35 | 2 |
| P3 | planung | Drehplanung, Termine, Einverständnisse, Musikrechte | VID |  | T-35 bis T-28 | 2 |
| E1 | erstellung | Dreh | VID |  | T-28 bis T-21 | 6 |
| E2 | erstellung | Rohschnitt | VID |  | T-21 bis T-14 | 5 |
| A1 | abstimmung | Feedback von Beteiligten einholen | RED |  | T-14 bis T-10 | 1 |
| E3 | erstellung | Finalschnitt, Untertitel, Formate | VID |  | T-10 bis T-6 | 2 |
| F1 | freigabe | Fakten, Personen- und Musikrechte prüfen | Fachrolle der Regel |  | T-6 bis T-5 | 0,5 |
| F2 | freigabe | Redaktionsfreigabe | KOM |  | T-5 | 0,25 |
| X1 | posting | Einplanen | CM |  | T-2 | 0,25 |
| N1 | nachbereitung | Kommentare betreuen, Ergebnis dokumentieren | CM |  | T bis T+3 | 0,5 |

### Klasse NL: Newsletter

Beispiel: je Empfängergruppe. Summe 4 h.

| Schritt | Phase | Aufgabe | Rolle | Werkzeug | Zeitraum | Stunden |
| --- | --- | --- | --- | --- | --- | --- |
| P1 | planung | Thema und Empfängergruppe festlegen | KOM |  | T-10 | 0,25 |
| E1 | erstellung | Betreff, Vorschau und Text erzeugen und überarbeiten | RED | Textgenerator | T-7 bis T-5 | 1,5 |
| E2 | erstellung | Bilder erstellen | GRA | Grafikgenerator | T-6 bis T-4 | 0,75 |
| F1 | freigabe | Faktencheck | Fachrolle der Regel |  | T-4 bis T-3 | 0,25 |
| F2 | freigabe | Redaktionsfreigabe | KOM |  | T-3 | 0,25 |
| X1 | posting | Testversand, Links und Segment prüfen | RED |  | T-2 | 0,5 |
| X2 | posting | Versand | RED |  | T | 0,25 |
| N1 | nachbereitung | Klicks, Antworten, Abmeldungen auswerten | RED |  | T+3 | 0,25 |

### Klasse TM: Mail an Ticketinhabende

Beispiel: Service- und Orientierungsmail. Summe 3 h.

| Schritt | Phase | Aufgabe | Rolle | Werkzeug | Zeitraum | Stunden |
| --- | --- | --- | --- | --- | --- | --- |
| P1 | planung | Inhalt und Segment festlegen | KOM |  | T-7 | 0,25 |
| E1 | erstellung | Text aus Vorlage erzeugen und überarbeiten | RED | Textgenerator | T-6 bis T-5 | 1,25 |
| F1 | freigabe | Faktencheck | Fachrolle der Regel |  | T-4 bis T-3 | 0,5 |
| F2 | freigabe | Redaktionsfreigabe | KOM |  | T-3 | 0,25 |
| X1 | posting | Testversand und Links prüfen | RED |  | T-1 | 0,5 |
| X2 | posting | Versand | RED |  | T | 0,25 |

### Klasse WEB: Website-Update

Beispiel: Infoseite, FAQ, Programmseite. Summe 1,5 h.

| Schritt | Phase | Aufgabe | Rolle | Werkzeug | Zeitraum | Stunden |
| --- | --- | --- | --- | --- | --- | --- |
| E1 | erstellung | Seite aktualisieren | WEB | Textgenerator | T-3 bis T-2 | 1 |
| F1 | freigabe | Faktencheck | Fachrolle der Regel |  | T-1 | 0,25 |
| X1 | posting | Live schalten, Links prüfen | WEB |  | T | 0,25 |

### Klasse PR: Pressemitteilung

Beispiel: Launch, Programm, Akkreditierung, Bilanz. Summe 5 h.

| Schritt | Phase | Aufgabe | Rolle | Werkzeug | Zeitraum | Stunden |
| --- | --- | --- | --- | --- | --- | --- |
| P1 | planung | Anlass und Verteiler festlegen | PRESSE |  | T-14 | 0,5 |
| E1 | erstellung | Mitteilung erzeugen und überarbeiten | PRESSE | Textgenerator | T-12 bis T-9 | 2 |
| E2 | erstellung | Pressefotos auswählen, Credits | GRA |  | T-10 bis T-8 | 1 |
| F1 | freigabe | Faktencheck | Fachrolle der Regel |  | T-7 bis T-6 | 0,5 |
| F2 | freigabe | Freigabe | KOM |  | T-5 | 0,25 |
| X1 | posting | Versand | PRESSE |  | T | 0,5 |
| N1 | nachbereitung | Nachfassen, Veröffentlichungen sammeln | PRESSE |  | T+2 bis T+5 | 0,25 |

### Klasse AD: Anzeigenkampagne

Beispiel: Laufzeit aus der Regel; Kontrolle wöchentlich. Summe 5,75 h plus 1 h je Laufwoche.

| Schritt | Phase | Aufgabe | Rolle | Werkzeug | Zeitraum | Stunden |
| --- | --- | --- | --- | --- | --- | --- |
| P1 | planung | Ziel, Budget, Laufzeit und Stoppregeln festlegen | KOM |  | T-14 | 0,5 |
| E1 | erstellung | Motive je Einwand oder Motiv erstellen | GRA | Grafikgenerator | T-12 bis T-8 | 2 |
| E2 | erstellung | Textvarianten erzeugen | RED | Textgenerator | T-12 bis T-9 | 1 |
| E3 | erstellung | Zielgruppen und Tracking einrichten | ADS |  | T-8 bis T-4 | 1 |
| F1 | freigabe | Preise, Bestand und Kaufweg prüfen | FACH-TIX |  | T-4 bis T-3 | 0,25 |
| F2 | freigabe | Freigabe mit Budget | KOM |  | T-3 | 0,25 |
| X1 | posting | Kampagne starten | ADS |  | T | 0,25 |
| N1 | nachbereitung | Wöchentliche Kontrolle, bei Ausverkauf oder falschem Preis sofort anpassen | ADS | | wöchentlich bis Laufzeitende | 1 je Woche |
| N2 | nachbereitung | Abschluss und Kosten je Ergebnis dokumentieren | ADS |  | Laufzeitende +3 | 0,5 |

Interne Aufgaben (Klasse INT) tragen ihre Schritte direkt in der Regel, etwa Shop einrichten, Anwohnerinfo, Krisenvorlagen und Prüfpunkte.

## 10 Phasen, Mengen und Wochenaufgaben

| Phase | von | bis | Feedbeiträge pro Woche | Hinweis |
| --- | --- | --- | --- | --- |
| verkaufsstart | V | V+28 | 1,25 |  |
| winterruhe | V+28 | F-150 | 0,6 | plus Saisonanlässe |
| programmaufbau | F-150 | F-60 | 1 |  |
| heisse phase | F-60 | F | 2 |  |
| festival | F | Z | 1 | Orientierung läuft zusätzlich über Stories und App |
| nachbereitung | Z | Z+30 | 1,25 |  |

Ereignisbeiträge zählen in die Wochenmenge. Fehlende Beiträge füllt das Werkzeug mit Redaktionsslots (Regel SLOT). Pflichtinformationen werden nie wegen der Menge gestrichen.

Laufende Arbeit wird als wiederkehrende Wochenaufgabe geplant, nicht als Einzelaufgaben:

| Wochenaufgabe | Rolle | Stunden pro Woche | Hinweis |
| --- | --- | --- | --- |
| Wochenpaket Stories | CM | winterruhe 0,5, programmaufbau 1, heisse phase 2, festival 4, nachbereitung 1 |  |
| Kommentare und Nachrichten | CM | winterruhe 1, programmaufbau 2, heisse phase 4, festival 12, nachbereitung 3 | werktags innerhalb von 24 Stunden; ab F minus 7 bis Z am selben Tag |
| Redaktionsrunde: Termine, Fragen, Ergebnisse | KOM | alle aktiven phasen 1 | Im Verbund eine gemeinsame Runde für alle Festivals |

## 11 Ereignisse

Jedes Ereignis wird mit Festival, Ausgabe, Kennung, Datum, Uhrzeit, Bestätigungsstatus und fachlicher Verantwortung gespeichert. Mehrere Programmwellen oder Fristen erhalten jeweils ein eigenes Ereignis.

| Kürzel | Ereignis | Pflicht | Standard |
| --- | --- | --- | --- |
| L | Öffentlicher Launch der Ausgabe | nein |  |
| V | Vorverkaufsbeginn | ja |  |
| VC | Community- oder Frühzugangsfenster | nein |  |
| P | Programmwelle (je Welle ein Ereignis) | ja | F-200, F-150, F-100, F-45; -45 = Lineup komplett |
| D-PREIS | Fester Preiswechsel | nein |  |
| B-OPEN | Bewerbung öffnet | nein |  |
| D-BEW | Bewerbungsschluss | nein |  |
| D-ADDON | Buchungsschluss Camping, Shuttle, Parken oder Zusatzangebot | nein |  |
| D-TRANSFER | Frist Ticketumschreibung | nein |  |
| G | Begleitende Veranstaltung | nein |  |
| A | Aufbaubeginn | nein | löst A-AUFRUF und A-EINBLICK aus |
| F | Erste Öffnung für Gäste | ja |  |
| PS | Programmstart, falls abweichend von F | nein |  |
| Z | Festivalende | ja |  |
| R | Materialfreigabe (Fotogalerie, Aftermovie) | nein | Z+60 |
| S-BF | Saisonanlass Black Friday | nein | 2026-11-27 |
| S-XMAS | Saisonanlass Geschenk-Tickets | nein | 2026-12-15 |
| S-NL | Saisonnewsletter (Urlaubsplanung, Frühling) | nein | 2027-01-20, 2027-03-17, 2027-04-28 |
| REB | Vorverkauf der nächsten Ausgabe (Rebooking) | nein | kann vor Z liegen; dann mit Nachbereitung zusammenlegen |

## 12 Mindeststandard: Veröffentlichungsregeln

Termin = Bezugsereignis plus Abstand. Die Klasse bestimmt Schritte und Vorlauf. Begleitend bedeutet zusätzliche Story oder Website-Aktualisierung am selben Tag.

| ID | Bezug | Abstand | Klasse | Veröffentlichung | Kanal | Zielgruppe | Inhalt | Fachfreigabe | Bedingung |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| L-NEUGIER | L | -7 | S | Neugier wecken, Interessentenliste öffnen | feed | interessierte | Was kommt, Datum der Ankündigung, Eintrag in die Liste | KOM | erstauflage_oder_relaunch |
| L-HAUPT | L | +0 | M | Ausgabe vorstellen | feed + story, website | alle | Profil, Datum, Ort, Erlebnis, nächster Schritt | KOM |  |
| L-PRESSE | L | +0 | PR | Pressemitteilung Launch | presse | medien | Profil, Datum, Ort, Ansprechperson | KOM |  |
| L-VERTIEF | L | +3 | S | Festivalidee vertiefen, erste Fragen beantworten | feed | interessierte | Häufigste Fragen nach dem Launch | KOM |  |
| V-SHOP | V | -42 | INT | Ticketarten, Gesamtpreise, Kontingente und Shop einrichten | intern |  | Ticketstruktur aus der Prognoseplattform übernehmen (FACH-TIX, 1 h); Shop konfigurieren, Texte und Bilder einsetzen (WEB, 4 h); Testkauf mit allen Ticketarten, Mails und Links (FACH-TIX, 1 h) |  |  |
| V-ANK | V | -7 | M | Vorverkauf ankündigen | feed + story | interessierte | Datum, Uhrzeit, Ticketarten, Gesamtpreise, Kaufweg | FACH-TIX | testkauf_erfolgreich |
| V-NL-ANK | V | -7 | NL | Newsletter Ankündigung Vorverkauf | newsletter | interessierte und fruehere gaeste | Datum, Uhrzeit, Angebot, Erinnerungsoption | FACH-TIX |  |
| V-ERINN | V | -1 | S | Erinnerung am Vortag | story | interessierte | Uhrzeit und Link | FACH-TIX |  |
| V-START | V | +0 | M | Verkaufsstart | feed + story, website | alle | Kaufweg, Angebot, wichtigste Bedingungen | FACH-TIX |  |
| V-NL-START | V | +0 | NL | Newsletter Verkaufsstart | newsletter | interessentenliste | Kauflink | FACH-TIX |  |
| V-PRUEF | V | +2 | INT | Fragen und Kaufabbrüche prüfen, Missverständnisse beheben | intern |  | Abbrüche, Fragen und Fehler sichten, Korrekturen beauftragen (KOM, 1 h) |  |  |
| P-WELLE | P | +0 | P | Programmwelle veröffentlichen | feed + story, website | alle | Namen, Charakter, Erlebnis; bei unbekannten Acts der Grund für den Besuch | FACH-PROG |  |
| P-VERTIEF | P | +3 | S | Einzelne Acts oder Kollektive vorstellen | feed | alle | Eigene Geschichte des Acts | FACH-PROG |  |
| PREIS-7 | D-PREIS | -7 | S | Preiswechsel ankündigen | feed | kaufinteressierte | Aktueller Preis, neuer Preis, genaue Frist, Link | FACH-TIX | verknappung_erlaubt |
| PREIS-2 | D-PREIS | -2 | S | Preiswechsel erinnern | story | kaufinteressierte | Frist und Link | FACH-TIX | verknappung_erlaubt |
| PREIS-0 | D-PREIS | +0 | WEB | Preise aktualisieren, laufende Anzeigen prüfen | website | alle | Neue Preise | FACH-TIX |  |
| BEW-OPEN | B-OPEN | +0 | M | Bewerbung öffnet | feed + website | mitwirkende | Gesuchte Beiträge, Voraussetzungen, Frist, Bewerbungsweg | FACH-PROG |  |
| BEW-14 | D-BEW | -14 | S | Bewerbungsschluss in zwei Wochen | feed | mitwirkende | Noch gesuchte Beiträge | FACH-PROG |  |
| BEW-3 | D-BEW | -3 | S | Bewerbungsschluss in drei Tagen | story | mitwirkende | Frist und Link | FACH-PROG |  |
| ADDON-14 | D-ADDON | -14 | TM | Buchungsschluss Zusatzangebot | mail_ticketinhabende | ticketinhabende | Was, bis wann, wie buchen | FACH-TIX |  |
| ADDON-3 | D-ADDON | -3 | S | Buchungsschluss erinnern | story | ticketinhabende | Frist und Link | FACH-TIX |  |
| TRANS-14 | D-TRANSFER | -14 | TM | Frist Ticketumschreibung | mail_ticketinhabende | ticketinhabende | Frist, Verfahren, Kosten | FACH-TIX |  |
| G-ANK | G | -21 | M | Veranstaltung ankündigen | feed | passende gruppe | Eigener Nutzen, Ort, Teilnahmeweg, Verbindung zum Festival | KOM |  |
| G-ERKL | G | -7 | S | Veranstaltung erklären | feed | passende gruppe | Ablauf, Anmeldung | KOM |  |
| G-ERINN | G | -1 | S | Erinnerung | story | angemeldete | Uhrzeit, Ort | KOM |  |
| G-NACH | G | +2 | S | Nachbereitung | feed | alle | Eindrücke, nächste Möglichkeit | KOM |  |
| S-BF | S-BF | +0 | S | Black Friday | feed + story | kaufinteressierte | Nur mit echtem Angebot aus der Preisarchitektur | FACH-TIX | angebot_freigegeben |
| S-XMAS | S-XMAS | +0 | S | Tickets als Geschenk | feed + story | kaufinteressierte | Geschenkoption, letzte Liefer- oder Versandfrist | FACH-TIX |  |
| S-NL | S-NL | +0 | NL | Saisonnewsletter | newsletter | interessierte | Urlaubsplanung, Programmstand, Anreise-Grundlagen | KOM |  |
| F120-VID | F | -120 | L | Video Erlebnis | reel | interessierte | Atmosphäre und konkrete Situationen | KOM |  |
| F90-NL | F | -90 | NL | Newsletter Planung und Aufenthalt | newsletter | interessierte und ticketinhabende | Camping, Unterkunft, Gruppen, Familien, Buchungsfristen | FACH-BETR |  |
| F75-VID | F | -75 | L | Video Menschen | reel | interessierte | Artists, Crews, Kollektive mit eigener Perspektive | KOM |  |
| F60-WERTE | F | -60 | M | Werte anhand echter Maßnahmen | feed | alle | Nachhaltigkeit, Zugänglichkeit, Gemeinschaft, Unterstützung | FACH-CARE |  |
| F60-NL | F | -60 | NL | Newsletter Entscheidungshilfe | newsletter | interessierte | Gründe für den Besuch, offene Einwände | KOM |  |
| F42-TM | F | -42 | TM | Mail Anreise und Aufenthalt | mail_ticketinhabende | ticketinhabende | Anreise, Shuttle, Mitfahren, Fahrrad, Unterkünfte, Buchungsfristen | FACH-BETR |  |
| F42-WEB | F | -42 | WEB | Infoseite Anreise und Aufenthalt | website | alle | Bestätigte Anreisewege und Aufenthaltsmöglichkeiten | FACH-BETR |  |
| F40-VID | F | -40 | L | Video Anreise | reel | unentschlossene | Weg und realer Aufwand | FACH-BETR |  |
| F30-PR | F | -30 | PR | Pressemitteilung Programm und Akkreditierung | presse | medien | Programm, Akkreditierungsschluss, Pressebereich | FACH-PROG |  |
| F30-NL | F | -30 | NL | Newsletter letzte Entscheidung | newsletter | interessierte | Programmauswahl, Anreise, Kaufweg | FACH-TIX |  |
| F21-VID | F | -21 | L | Video Care und Vorfreude | reel | alle | Care-Angebote, Kontaktwege, Atmosphäre | FACH-CARE |  |
| F21-WEB | F | -21 | WEB | Infoseite Care, Einlass, Packliste, Bezahlen | website | ticketinhabende | Care, Einlassregeln, Packliste, Cashless, Rückzahlung | FACH-CARE |  |
| F21-PACK | F | -21 | S | Packliste und Einlass | feed | ticketinhabende | Wichtigste Regeln, Link zur Infoseite | FACH-BETR |  |
| F14-TT | F | -14 | M | Timetable und Geländeplan | feed + story, website | alle | Freigegebener Timetable, Geländeplan, Programmauswahl | FACH-PROG |  |
| F14-TM | F | -14 | TM | Mail Care, Regeln, Timetable | mail_ticketinhabende | ticketinhabende | Care-Angebote, Regeln, Timetable-Link | FACH-CARE |  |
| F14-NL | F | -14 | NL | Newsletter Programmauswahl | newsletter | interessierte | Highlights je Tag, Kaufweg | FACH-PROG |  |
| F14-ANW | F | -14 | INT | Anwohner, Gemeinde und Behörden informieren | brief_und_mail |  | Anwohnerinfo erzeugen (Verkehr, Lärm, Zeiten, Kontakt) (RED, 1 h); Betrieb prüft und gibt frei (FACH-BETR, 0,5 h); Verteilen und an Gemeinde senden (FACH-BETR, 1 h) |  |  |
| F14-KRISE | F | -14 | INT | Krisenvorlagen freigeben und Rufbereitschaft festlegen | intern |  | Vorlagen Unwetter, Einlassstopp, Programmänderung, Absage erzeugen (RED, 2 h); Betrieb und Geschäftsführung geben frei, Freigabeweg festlegen (FACH-BETR, 1 h); Rufbereitschaft und Kontakte im Dienstplan eintragen (KOM, 0,5 h) |  |  |
| F7-BUENDEL | F | -7 | M | Wichtigste Infos bündeln | feed + story, website | ticketinhabende | Öffnungszeiten, Anreise, Einlass, Care, Links | FACH-BETR |  |
| F7-PR | F | -7 | PR | Pressemitteilung Festivalstart | presse | medien | Programmhöhepunkte, Pressekontakt vor Ort | FACH-PROG |  |
| F3-TM | F | -3 | TM | Mail letzte Infos | mail_ticketinhabende | ticketinhabende | Öffnungszeiten, Check-in, bestätigte Änderungen, Wetter | FACH-BETR |  |
| F1-STORY | F | -1 | S | Letzte Orientierung | story | ticketinhabende | Ankunft, Check-in, Wetter | FACH-BETR |  |
| F-LIVE | F | +0 | INT | Tagesorientierung während des Festivals | story_app |  | Tagesprogramm, Änderungen, Care-Hinweise ausspielen (CM, 1,5 h) |  |  |
| Z1-DANK | Z | +1 | S | Dank und Fundsachen | feed + story | alle | Dank, Fundsachen, Kontaktwege | KOM |  |
| Z1-TM | Z | +1 | TM | Mail Dank, Fundsachen, Feedback | mail_ticketinhabende | ticketinhabende | Dank, Fundsachen, Feedbackformular, Rückzahlung falls relevant | FACH-BETR |  |
| Z2-PR | Z | +2 | PR | Pressemitteilung Bilanz | presse | medien | Bilanz, nächste Ausgabe falls bestätigt | KOM |  |
| Z5-NL | Z | +5 | NL | Newsletter Rückblick und nächste Ausgabe | newsletter | fruehere gaeste | Rückblick, Feedback, nächste Ausgabe falls bestätigt | KOM |  |
| Z14-DANKSERIE | Z | +14 | M | Dankesserie für Beteiligte | feed | alle | Crews, Kollektive, Artists mit Credits | KOM |  |
| Z30-AUSW | Z | +30 | INT | Auswertung: beibehalten, verändern, beenden | intern |  | Ergebnisse, Aufwand und Erkenntnisse festhalten (KOM, 3 h) |  |  |
| R-AFTER | R | +0 | L | Aftermovie | reel | fruehere gaeste | Freigegebenes Material, Credits, Anlass für Wiederkehr | KOM |  |
| AD-WINTER | S-BF | -7 | AD | Anzeigen Black Friday und Geschenk-Tickets, Laufzeit 32 Tage | anzeige | kaufinteressierte | Motive zu Geschenk und Planungssicherheit | FACH-TIX | budget_freigegeben |
| AD-FRUEH | F | -140 | AD | Anzeigen Frühjahr, Laufzeit 30 Tage | anzeige | neue passende gruppen | Erlebnis und Programm | FACH-TIX | budget_freigegeben |
| AD-FINAL | F | -60 | AD | Anzeigen Abschluss, Laufzeit 50 Tage | anzeige | kaufinteressierte | Gründe, Anreise, Kaufweg | FACH-TIX | budget_freigegeben |
| A-AUFRUF | A | -7 | S | Aufruf zum Mitbauen | feed | mitwirkende | Aufgaben, Zeiträume, Zugang, Anmeldung | FACH-BETR | aufbau_mitmachen_offen |
| A-EINBLICK | A | +1 | S | Einblick in den Aufbau | feed + story | alle | Menschen, Fortschritt, Gestaltung, Bildnachweise | FACH-BETR |  |
| CD-100 | F | -100 | S | Countdown 100 Tage mit neuem Inhalt | feed | alle | Eine neue Information oder Geschichte, keine bloße Zahl | KOM | countdown_aktiv |
| CD-30 | F | -30 | S | Countdown 30 Tage mit neuem Inhalt | story | alle | Eine neue Information oder Geschichte | KOM | countdown_aktiv |
| Z10-GALERIE | Z | +10 | M | Fotogalerie und Rückblick | feed | fruehere gaeste | Freigegebene Fotos mit Credits, gezeigte Beteiligte markiert | KOM |  |

Regel SLOT: Fehlt in einer Woche die Phasenmenge, wird ein Slot ergänzt. Das Thema kommt aus der Themenbibliothek: Kandidaten sind Einträge mit slot=true, deren Zeitfenster den Tag enthält und deren Umfang zum Festival passt; gewählt wird das bisher am seltensten genutzte. Ohne Kandidat rotieren die Grundthemen erlebnis, menschen, entscheidung, orientierung. Klassen wechseln S, M, S, M, S. Kein Slot innerhalb von 2 Tagen vor oder nach einem anderen Feedbeitrag.

## 13 Themenbibliothek B01 bis B32

Der Themenkatalog der Grundlage, jedem Thema die Regeln zugeordnet, die es abdecken. Themen mit Slot-Fenster füllen freie Redaktionsslots in diesem Zeitraum. Umfang: basis = immer, bedarf = nur wenn das Angebot existiert, ergaenzung = Profil und Vorfreude.

| ID | Thema | Inhalt | Umfang | Zeitfenster | Regeln | Slot | Beteiligte |
| --- | --- | --- | --- | --- | --- | --- | --- |
| B01 | Festivalankündigung | Datum, Ort, Idee, erster Handlungsaufruf | basis | L; bei Fortsetzung Z Vorjahr +7 bis +30 | L-HAUPT, L-PRESSE, V-START |  | Veranstaltende, mitveranstaltende Crew |
| B02 | Ticketstart | Ticketarten, Gesamtpreise, Kaufweg | basis | V-7, V-1, V | V-ANK, V-NL-ANK, V-ERINN, V-START, V-NL-START |  | Ticketing für Fakten |
| B03 | Mitmachen: Programm und Kollektive | Gesuchte Beiträge, Voraussetzungen, Bewerbungsweg | bedarf | F-240 bis F-150 oder Bewerbungsstart | BEW-OPEN, BEW-14, BEW-3 |  | Programmteam, aufnehmende Kollektive (eigenes Ereignis B-OPEN/D-BEW je Bereich) |
| B04 | Jobs und Praktika | Rollen, Voraussetzungen, Bewerbung | bedarf | F-180 bis F-90 oder Bewerbungsstart | BEW-OPEN, BEW-14, BEW-3 |  | betroffene Arbeitsbereiche |
| B05 | Erste Programmwelle | Bestätigte Namen und Festivalprofil | basis | F-200 (Welle 1) | P-WELLE, P-VERTIEF |  | Programm, gezeigte Artists |
| B06 | Kollektive und Bühnen | Wer gestaltet welchen Ort? | basis bei beteiligung | F-120 bis F-45 |  | F-120 bis F-45, Klasse M | Kollektive, zuständige Crew als Collab |
| B07 | Rahmenprogramm | Workshops, Kultur, Erholung, Mitmachen | basis bei angebot | F-120 bis F-45 |  | F-120 bis F-45, Klasse M | Leitende der Angebote als Collab |
| B08 | Helfendenaufruf | Aufgaben, Zeiträume, Gegenleistung, Bewerbung | bedarf | F-120 bis F-60, Erinnerung F-30 | BEW-OPEN, BEW-14, BEW-3 |  | Helfendenkoordination, suchende Bereiche |
| B09 | Camping, Camper, Glamping | Optionen, Buchung, Regeln | bedarf | F-90 bis F-45, Fristen vorrangig | F90-NL, ADDON-14, ADDON-3 | F-90 bis F-45, Klasse S | Campingteam, Unterkunftsanbietende |
| B10 | Gruppenangebote, besondere Ticketarten | Angebot und Bedingungen | bedarf | am Freigabetag, vor der Reiseplanung |  |  | beteiligte Communities (als Extra E04 oder eigenes Ereignis) |
| B11 | Artistporträts und Musik | Warum diesen Auftritt sehen? | ergaenzung | F-120 bis F-7, an Programmwellen gekoppelt | P-VERTIEF | F-120 bis F-7, Klasse S | Artist als Collab, Label oder Crew |
| B12 | Festivalerlebnis | Lieblingsorte, Essen, Spa, Kunst, Besonderheiten | ergaenzung | F-90 bis F-14 | F120-VID | F-150 bis F-14, Klasse M | die Menschen und Crews hinter dem Angebot |
| B13 | Aufbau und Gestaltung | Was entsteht gerade? | ergaenzung | A-7 (Aufruf) und ab A bis F-1 | A-AUFRUF, A-EINBLICK |  | Aufbau, Gestaltung, Technik, Kollektive |
| B14 | Werte und konkrete Maßnahmen | Nachhaltigkeit, Zugänglichkeit, Gemeinschaft | basis | F-60 bis F-21 | F60-WERTE |  | zuständiges Team, umsetzende Partner |
| B15 | Anreiseübersicht | Bahn, Shuttle, Bus, Fahrrad, Auto, Adresse | basis | Grundlagen ab V, Details F-42, Aktualisierung F-7 | F42-TM, F42-WEB, F40-VID, F7-BUENDEL |  | Mobilitätspartner, sofern bestätigt |
| B16 | Mitfahren und gemeinsame Anreise | Vermittlungsweg, Communities | bedarf | F-30 bis F-21, Erinnerung F-7 | F7-BUENDEL | F-30 bis F-21, Klasse S | anreisende Crews und Communities |
| B17 | Care und Unterstützung | Care-Angebote, Erreichbarkeit, Verhalten (Begriff Care statt Awareness) | basis | F-21 bis F-14, Kurzfassung F-3 | F21-VID, F21-WEB, F14-TM, F3-TM |  | Care-Team |
| B18 | Cashless und Bezahlen | Einrichtung, Nutzung, Rückzahlung | bedarf | F-21 bis F-14, Erinnerung F-3 | F21-WEB, F3-TM |  | Zahlungsteam |
| B19 | Camping, Packliste, Einlassregeln | Was mitbringen, was beachten | basis | F-21 bis F-10 | F21-PACK, F21-WEB |  | Camping, Einlass, Gästeservice |
| B20 | Geländeplan | Flächen, Bühnen, Wege, Wasser, Unterstützung | basis | F-14 bis F-7 | F14-TT |  | Bühnen und Crews mit eigenen Ausschnitten |
| B21 | Timetable | Spielzeiten, Orte, Download | basis | F-14 bis F-7 | F14-TT, F14-NL |  | Artists und Bühnencrews mit eigenen Ausschnitten |
| B22 | Letzte Fragen | Kompakte Zusammenfassung mit aktuellen Links | basis | F-7 | F7-BUENDEL |  | Gästeservice, Fachbereiche |
| B23 | Countdown mit neuem Inhalt | Jeder Countdown zeigt etwas Neues | ergaenzung | F-100, F-30, F-7 | CD-100, CD-30, F7-BUENDEL |  | bestätigte Artists oder Crews im Motiv (aktiv über Festivalmerkmal countdown_aktiv; historisch WM 2026 mit 100, 70, 50, 40, 30, 20 Tagen) |
| B24 | Aktuelle Lage und Brandschutz | Bestätigte Maßnahmen | bedarf | F-7 bis F-1 oder sofort nach Entscheidung | F14-KRISE |  | Betriebsleitung, Sicherheit (ereignisgetrieben, Vorlagen aus F14-KRISE) |
| B25 | Ankunft und Einlass | Öffnungszeiten, Check-in, Parken | basis | F-1 und F | F3-TM, F1-STORY |  | Einlass, Camping, Gästeservice |
| B26 | Orientierung während des Festivals | Tagesprogramm, freie Angebote, Änderungen | basis | täglich F bis Z | F-LIVE |  | tagesaktuelle Artists und Bühnen |
| B27 | Erster Dank | Dank an Gäste und Beteiligte | basis | Z+1 bis Z+3 | Z1-DANK, Z1-TM |  | Crews, Artists, Kollektive, Helfende |
| B28 | Fundsachen | Wo und wie nachfragen | basis | Z+1 bis Z+3 | Z1-DANK, Z1-TM |  | Fundsachenkoordination |
| B29 | Feedback und offene Fragen | Feedback, gegebenenfalls Rückzahlung | basis | Z+3 bis Z+7 | Z1-TM, Z5-NL |  | Gästeservice, Rückzahlungsteam |
| B30 | Dankesserie und Kollektivporträts | Einzelne Würdigung der Arbeit | ergaenzung | Z+7 bis Z+30 | Z14-DANKSERIE |  | je Beitrag die gezeigte Crew als Collab |
| B31 | Fotogalerie und Rückblick | Freigegebenes Material mit Credits | ergaenzung | Z+7 bis Z+21 | Z10-GALERIE |  | Fotografierende, gezeigte Beteiligte |
| B32 | Sets und Aftermovie | Material, Credits, Anlass für Wiederkehr | ergaenzung | R, Planungsfenster Z+14 bis Z+60 | R-AFTER |  | Artists, Filmteam, Crews |

## 14 Artists, Crews und Kollektive einbinden

Für jeden Beitrag wird bei der Planung beantwortet: Wer macht diesen Inhalt möglich? Die Beteiligung wird im Schritt P2 (Material anfragen) und A1 (Abstimmung) der Klassen M, P und L abgearbeitet.

| Inhalt | Beteiligte | Form |
| --- | --- | --- |
| Einzelner Artist oder Set | Artist, gegebenenfalls Crew | Collab, wenn vereinbart; sonst Markierung und Material zum Weiterteilen |
| Programmwelle | alle gezeigten Artists, Programmcrew | Namen und Accounts vollständig, ausgewählte Collabs, Einzelmotive zum Weiterteilen |
| Bühne oder Kollektivfläche | verantwortliche Crew, Gestaltung | Collab mit Crewaccount |
| Workshop, Kunst, Rahmenprogramm | Person oder Gruppe hinter dem Angebot | Collab oder kurzes Interview |
| Aufbau und Technik | Aufbaucrew, Werkstätten, Gestaltung, Technik | Erwähnung, Porträt oder Collab |
| Care, Barrierearmut, Rückzugsräume | zuständiges Team, Initiative | gemeinsamer erklärender Beitrag nach Abstimmung |
| Anreise, Camping, Essen | zuständige Anbieter und Teams | Erwähnung oder gemeinsamer Servicebeitrag |
| Ticketaktion oder Verlosung | Partner der Aktion | Collab nach Abstimmung |
| Fotos und Videos | Fotografierende, Filmteam, gezeigte Beteiligte | Credits und Markierungen |
| Dank und Nachbereitung | Crews, Kollektive, Artists, Helfende | gezielte Dankesserie statt Sammelmarkierung |

Collab heißt abgestimmte gemeinsame Veröffentlichung. Markierung und Erwähnung sind etwas anderes. Ein eingetragener Account belegt keine Zusage. Abstimmungsstatus: nicht angefragt, angefragt, zugesagt, umgesetzt, entfällt. Historische Namen werden je Ausgabe neu geprüft.

**Partnerfähige Beiträge (Habitat-Baukasten).** Zentral bleiben alle Beiträge mit Fakten: Tickets, Preise, Fristen, Anreise, Care, Einlass, Timetable, Krisen, Presse, Mails an Ticketinhabende, Anzeigen. Partnerfähig sind Beiträge, die von Menschen leben: Kollektiv- und Bühnenporträts, Rahmenprogramm, Artistporträts, Festivalerlebnis, Aufbau, Galerie, Dankesserie, begleitende Veranstaltungen. Ein Redaktionsslot ist nur partnerfähig, wenn sein Thema in PARTNERFAEHIG_THEMEN steht. Partner erstellen im Baukasten aus gesperrten Vorlagen; Freigabe durch die verantwortliche Person Kommunikation, Faktencheck durch die Fachrolle. Veröffentlicht wird als gemeinsamer Beitrag mit dem Partneraccount. Ist ein partnerfähiger Beitrag 10 Tage vor T nicht übernommen, fällt er an die Redaktion zurück.

Partnerfähige Regeln: P-VERTIEF, G-ANK, G-ERKL, G-NACH, Z14-DANKSERIE, A-EINBLICK, Z10-GALERIE, SLOT. Partnerfähige Themen für Slots: B06, B07, B11, B12, B13, B30, B31. In der Beispielrechnung sind das rund 175 von gut 400 Veröffentlichungen über alle fünf Festivals.

## 15 Prüfpunkte und Extras, falls es nicht läuft

Prüfpunkte: V+7, V+28, alle 28 Tage bis F-90, F-90, F-60, F-45, F-30, F-21. Je Prüfpunkt 0,5 h für KOM mit FACH-TIX. Gemessen wird: verkaufte Tickets laut Ticketsystem gegen Zielpfad, Kaufabbrüche, wiederkehrende Fragen pro Woche, Reichweite passender Menschen, Klicks auf den Kaufweg.

| Stufe | Bedeutung |
| --- | --- |
| gruen | auf oder über Zielpfad; nichts ändern |
| gelb | unter 90 Prozent des Zielpfads oder ein klares Warnsignal; bis zu zwei Extras der Stufe Gelb wählen |
| rot | unter 75 Prozent des Zielpfads oder zwei Prüfpunkte in Folge gelb; Extras der Stufe Rot mit Freigabe der Geschäftsführung |
| knapp | Restbestand unter 10 Prozent; Verknappung nur bei verknappung_erlaubt kommunizieren, Anzeigen drosseln |

Zielpfad: Verkaufsplan der Prognoseplattform je Festival. Platzhalter bis dahin: V+28 15 Prozent, F-150 35 Prozent, F-90 55 Prozent, F-60 70 Prozent, F-30 85 Prozent, F-7 95 Prozent. Platzhalter ohne Datengrundlage. Nur verwenden, bis der Verkaufsplan aus der Prognoseplattform hinterlegt ist. Erstauflagen verkaufen erfahrungsgemäß später.

Extras sind Bausteine, die das Werkzeug erst nach einer Stufenentscheidung einplant. Ihre Aufgaben nutzen dieselben Klassen und werden ab dem gewählten Starttermin rückwärts gerechnet.

| ID | Extra | Stufe | Auslöser | Einsatzfenster | Vorlauf | Stunden | Budget | Freigabe | Aufgaben | Erfolgsmaß | Stopp |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| E01 | Zusätzliche Anzeigenwelle | gelb | Verkauf unter Zielpfad bei funktionierendem Kaufweg | V+28 bis F-10 | 7 Tage | 5 + 1 je Woche | ja | KOM, Budget GF | AD T: Zusatzwelle mit neuen Motiven zu den häufigsten Einwänden | Käufe und Kosten je Kauf laut Ticketsystem | Kosten je Kauf über Grenzwert oder zwei Wochen ohne Wirkung |
| E02 | Retargeting für Seitenbesucher und Kaufabbrüche | gelb | Kaufabbrüche oder viele Shopbesuche ohne Kauf | V+7 bis F-7 | 7 Tage | 4 + 0,5 je Woche | ja | KOM (nur mit gültiger Einwilligung und eingerichtetem Tracking) | AD T: Retargeting mit Antworten auf Abbruchgründe | Abschlussquote der Abbrecher | keine Verbesserung nach drei Wochen |
| E03 | Artists und Kollektive posten selbst | gelb | Reichweite unter Erwartung oder Programmwelle mit wenig Resonanz | ab erster Programmwelle bis F-14 | 21 Tage | 6 | nein | KOM | M T: Materialpaket und gemeinsame Beiträge mit 3 bis 5 Acts | neue Follower aus Collabs, Klicks auf Kaufweg | Acts sagen ab oder Material wird nicht genutzt |
| E04 | Gruppenangebot | rot | Verkauf unter 75 Prozent des Zielpfads | F-150 bis F-30 | 14 Tage | 8 | nein | FACH-TIX und GF (nur innerhalb der Preisarchitektur; bei Draußenbande keine Verknappung, Kinderpreise bleiben) | INT T-14: Angebot im Shop anlegen und testen; M T: Gruppenangebot vorstellen; NL T: Gruppenangebot an frühere Gäste | verkaufte Gruppenpakete | Ende der festgelegten Laufzeit |
| E05 | Reaktivierung früherer Gäste | gelb | Wiederkehrer kaufen später als im Vorjahr | V+28 bis F-45 | 7 Tage | 4 | nein | KOM (nur Empfänger:innen mit gültiger Einwilligung) | NL T: Persönlicher Newsletter an frühere Gäste mit Neuem dieser Ausgabe | Klicks und Käufe aus dem Segment | nach einem Versand ohne Wirkung nicht wiederholen |
| E06 | Serie zu den häufigsten Einwänden | gelb | dieselbe Frage mehr als fünfmal pro Woche oder Stufe rot | jederzeit ab V | 10 Tage | 18 | nein | KOM | M T: Einwand 1 beantworten (zum Beispiel Anreise); M T+7: Einwand 2 beantworten (zum Beispiel Atmosphäre); WEB T: FAQ ergänzen | weniger wiederkehrende Fragen, gespeicherte Beiträge | Fragen gehen zurück |
| E07 | Live-Fragestunde mit Team oder Artists | gelb | viele Fragen oder Unsicherheit über Atmosphäre | F-120 bis F-14 | 14 Tage | 5 | nein | KOM | S T-7: Live ankündigen; INT T: Live durchführen und Fragen sammeln | Zuschauende, gestellte Fragen, Käufe in den Folgetagen | einmalig je Phase |
| E08 | Regionale Medienpartnerschaft oder Verlosung | rot | Stufe rot bei Festivals mit regionalem Publikum | F-120 bis F-21 | 28 Tage | 8 | ja | KOM, Budget GF (Teilnahmebedingungen bei Verlosungen) | PR T: Partnerschaft vereinbaren und Material liefern | Reichweite im Zielgebiet, Käufe mit Partnercode | Laufzeit der Vereinbarung |
| E09 | Warm-up-Veranstaltung in einer Großstadt | rot | Stufe rot und mindestens 60 Tage bis F | F-150 bis F-45 | 35 Tage | 25 | ja | GF | Regel G-ANK; Regel G-ERKL; Regel G-ERINN; Regel G-NACH | Teilnehmende, Käufe mit Eventcode | einmalig |
| E10 | Programmhöhepunkt vorziehen | rot | Stufe rot und bestätigter Höhepunkt vorhanden | bis F-45 | 14 Tage | 10 | nein | FACH-PROG und GF (nur mit Zustimmung der Artists) | P T: Vorgezogene Programmwelle | Käufe in den 7 Tagen danach | entfällt |
| E11 | Empfehlungscode für Ticketinhabende | gelb | früh in der Saison zu wenig neue Käufer:innen | V+28 bis F-90 | 21 Tage | 6 | nein | FACH-TIX (Gegenleistung aus der Preisarchitektur) | INT T-14: Code im Shop einrichten; TM T: Code an Ticketinhabende | eingelöste Codes | Ende der Laufzeit |
| E12 | Plakate und Flyer in der Region | rot | regionales Publikum erreicht zu wenig | F-90 bis F-21 | 28 Tage | 10 | ja | KOM, Budget GF (Druckvorlauf beachten) | INT T-28: Motiv aus Grafikgenerator, Druck, Verteilung planen | Käufe mit Regionalcode oder Abfrage im Checkout | einmalig |
| E13 | Last-Minute-Paket | rot | Stufe rot am Prüfpunkt F-30 | F-30 bis F-3 | 7 Tage | 8 | nein | FACH-TIX und GF (keine Preissenkung gegenüber Frühkäufer:innen ohne Begründung) | M T: Tagestickets oder Anreisehilfe vorstellen; AD T: Kurze Kampagne im Umkreis | Käufe bis F | F |
| E14 | Warteliste und Rückläuferbörse | knapp | Restbestand unter 10 Prozent | ab Knappheit | 3 Tage | 4 | nein | FACH-TIX | WEB T: Warteliste oder Börse einrichten; S T: Verfügbarkeit ehrlich kommunizieren | Einträge, weitergegebene Tickets | Ausverkauf oder F |
| E15 | Ersatzbeitrag bei Absage eines Acts | betrieb | bestätigte Absage | jederzeit | 1 Tage | 3 | nein | FACH-PROG | S T: Absage und Ersatz klar benennen; WEB T: Programmseite und laufende Anzeigen korrigieren | Fragen dazu beantwortet | entfällt |

## 16 Übergabe an Asana und Kalender

| Ziel | Abbildung |
| --- | --- |
| Asana Projekt | je Festival und Ausgabe ein Projekt (z. B. Kommunikation Lusatia 2027) oder ein gemeinsames Projekt mit Feld Festival |
| Asana Abschnitt | Monat des Veröffentlichungstermins |
| Asana Hauptaufgabe | Name {titel} · {kanal} · {festival}, fällig an T, zuständig verantwortliche Person des Festivals aus dem Hohen Haus; Beschreibung: Briefing: Zielgruppe, Zweck, Inhalt, Faktenquelle, Bezugsereignis und Abstand, Link zum Entwurf im Werkzeugkasten |
| Asana Unteraufgabe | je Schritt: Start = von, fällig = bis, zuständig = Person der Rolle; Werkzeug-Link, wenn ein Generator zugeordnet ist |
| Asana Abhängigkeiten | planung vor erstellung vor abstimmung vor freigabe vor posting |
| Asana Felder | Festival, Klasse, Kanal, Bezugsereignis, Abstand, Status Bearbeitung, Status Fakten, Werkzeug, Regel-ID |
| Kalender | gemeinsamer Google-Kalender je Festival oder Verbund: ein Termin je Veröffentlichung an T (Uhrzeit, falls festgelegt), Titel {festival}: {titel} ({kanal}) |
| Kalender Fristen | Freigabetermine (F2) und Drehtermine (L-E1) als Termine bei den zuständigen Personen |
| Redaktionstabelle | Die bestehende Redaktionstabelle Social Media - Wilde Habitate (Google Sheets, Christian) bleibt das Arbeitswerkzeug der Redaktion. Das Hohe Haus liefert ihr Pflichttermine und Meilensteine (Zeile Fixtermine & Meilensteine); die Aufteilung nach Kanal, Format und Person macht die Redaktion dort selbst. |

Das Hohe Haus übergibt je Festival den Rahmen an die verantwortliche Person: Pflichtveröffentlichungen, Fristen, Prüfpunkte und Stunden. Eine Hauptaufgabe je Veröffentlichung; die Unteraufgaben je Schritt sind ein Vorschlag, den die verantwortliche Person in Asana oder in ihrer Redaktionstabelle selbst verteilt und anpasst. Die Geschäftsführung verteilt keine Einzelschritte. Wochenaufgaben als wiederkehrende Aufgabe, nicht als Einzelaufgaben. Interne Aufgaben ohne Veröffentlichung als Hauptaufgabe ohne Kanal. Arbeitsschritte laufen über Asana-Fälligkeiten. Der Kalender zeigt nur Veröffentlichungen, Freigaben und Drehs, damit nichts doppelt auftaucht.

CSV-Spalten für Import und Prüfung: `aufgabe_id`, `eltern_id`, `festival`, `ausgabe`, `regel_id`, `titel`, `schritt`, `phase`, `rolle`, `person`, `werkzeug`, `start`, `faellig`, `stunden`, `kanal`, `klasse`, `bezug`, `abstand`, `veroeffentlichung`, `status`, `hinweis`. Zeilen mit leerer `eltern_id` sind Hauptaufgaben.

Status Bearbeitung: offen, in_arbeit, entwurf, in_abstimmung, freigegeben, eingeplant, veroeffentlicht, dokumentiert, ueberfaellig, zu_pruefen. Status Fakten: unbestaetigt, vorlaeufig, bestaetigt. Bearbeitungsstatus und Faktenstatus bleiben getrennt. veroeffentlicht nur nach überprüfter Veröffentlichung.

## 17 Festivals 2027 und Ergebnis der Beispielrechnung

| Festival | Vorverkauf | Öffnung | Ende | Merkmale | Prüfen |
| --- | --- | --- | --- | --- | --- |
| Lusatia | 15.10.2026 | 23.07.2027 | 25.07.2027 | erstauflage_oder_relaunch=ja, verknappung_erlaubt=ja, countdown_aktiv=nein |  |
| Malina, Morio & die Draußenbande | 10.10.2026 | 30.07.2027 | 01.08.2027 | erstauflage_oder_relaunch=ja, verknappung_erlaubt=nein, countdown_aktiv=nein | F 29.07. oder 30.07., Ende 01.08. oder 02.08. |
| by nature | 01.11.2026 | 06.08.2027 | 08.08.2027 | erstauflage_oder_relaunch=ja, verknappung_erlaubt=ja, countdown_aktiv=nein |  |
| Wilde Möhre | 01.09.2026 | 20.08.2027 | 23.08.2027 | erstauflage_oder_relaunch=nein, verknappung_erlaubt=ja, community_fenster=ja, countdown_aktiv=nein | Ende 22.08. oder 23.08. |
| Fluidity | 01.08.2026 | 27.08.2027 | 29.08.2027 | erstauflage_oder_relaunch=nein, verknappung_erlaubt=ja, community_fenster=nein, countdown_aktiv=nein |  |

Verbund: Stichtag Vorproduktion 15.06.2027, Vorproduktionsfenster 84 Tage, Gästeinfos freigegeben bis 01.07.2027. In Wochen, in denen ein Festival läuft, haben dessen Betriebsinformationen Vorrang vor Kampagneninhalten anderer Festivals. Jede Festivalwoche hat eine eigene CM-Person.

Berechnet am 05.10.2026 mit dem Referenz-Rechner. Vergangene Veröffentlichungen werden nicht nachgeholt; überfällige Schritte sind Vorbereitungen für noch kommende Veröffentlichungen. Annahmen: Launch gleich Vorverkauf, Anzeigenbudget freigegeben, kein Black-Friday-Angebot, keine Preiswechsel- und Buchungsfristen hinterlegt.

| Festival | Hauptaufgaben | Schritte | Stunden inkl. Wochenaufgaben | überfällige Schritte | vergangen, nicht berechnet |
| --- | --- | --- | --- | --- | --- |
| Lusatia | 105 | 776 | 719 | 14 | 0 |
| Malina, Morio & die Draußenbande | 105 | 770 | 720 | 14 | 2 |
| by nature | 104 | 769 | 716 | 2 | 0 |
| Wilde Möhre | 98 | 729 | 698 | 0 | 12 |
| Fluidity | 99 | 738 | 701 | 0 | 13 |
| Summe | 511 | 3782 | 3554 | | |

Stunden je Rolle über alle fünf Festivals: Community-Betreuung 1082 h, Redaktion 682 h, Kommunikationsleitung 564 h, Gestaltung 539 h, Video 375 h, Anzeigen 101 h, Website und Shop 76 h, Presse 58 h, Fachfreigabe Betrieb 30 h, Fachfreigabe Programm 24 h, Fachfreigabe Ticketing 16 h, Fachfreigabe Care 8 h.

## 18 Jahresverlauf Oktober 2026 bis September 2027

| Monat | Ø Woche | Stellen | Erscheint | Wird vorbereitet | Achtung |
| --- | --- | --- | --- | --- | --- |
| Okt 2026 | 52 h | 1,5 | Vorverkauf Draußenbande (10.10.) und Lusatia (15.10.), je vier bis sechs Beiträge in den ersten vier Wochen. Wilde Möhre und Fluidity laufen ruhig weiter. | Verkaufsstart by nature (01.11.), Motive und Anzeigen für Black Friday und Geschenk-Tickets. | Für Lusatia und Draußenbande sind 28 Vorbereitungsschritte überfällig; zuerst Kaufweg, Preise, Kerninfos. |
| Nov | 39 h | 1,1 | Vorverkauf by nature (01.11.). Black Friday 27.11., Anzeigen ab 20.11. | Geschenk-Tickets (15.12.), erste Prüfpunkte. | Ein gemeinsames Anzeigenbudget und eine Person für die Kontrolle. |
| Dez | 36 h | 1,0 | Geschenk-Tickets ab 15.12., danach Pause. | Programmwellen Lusatia (04.01.) und Draußenbande (11.01.): Namen, Material, Embargo. | Freigaben vor dem Weihnachtsurlaub sichern. |
| Jan 2027 | 38 h | 1,1 | Programmwellen Lusatia 04.01., Draußenbande 11.01., by nature 18.01. Newsletter Urlaubsplanung 20.01. | Programmwellen Wilde Möhre (01.02.) und Fluidity (08.02.); Vorlagen für alle fünf. | Ruhige Zeit für Vorlagen, die im Sommer Stunden sparen. |
| Feb | 38 h | 1,1 | Programmwellen Wilde Möhre 01.02., Fluidity 08.02. Lusatia ab 23.02. im Programmaufbau. | Erste Videos (Lusatia 25.03., Draußenbande 01.04.): Skripte, Drehplanung. | Letzter Monat unter 40 Stunden pro Woche. |
| Mär | 90 h | 2,6 | Zweite Programmwellen Draußenbande (02.03.) bis Fluidity (30.03.). Frühjahrsanzeigen ab 05.03. | Videos Erlebnis. Ab 23.03. Vorproduktionsfenster für Juli und August. | Last verdoppelt sich; eine Person reicht nicht mehr. |
| Apr | 105 h | 3,0 | Videos Wilde Möhre (22.04.) und Fluidity (29.04.). Dritte Wellen Lusatia 14.04. bis by nature 28.04. | Videos Menschen, Vorproduktion, Newsletter 28.04. | Vorproduktion und Frühjahrskampagnen parallel. |
| Mai | 123 h | 3,5 | Dritte Wellen Wilde Möhre 12.05., Fluidity 19.05. Heiße Phase Lusatia ab 24.05., Draußenbande ab 31.05. | Gästeinfo-Pakete aller fünf, Videos Anreise, Vorlagen Timetable und Infobündel. | Dichteste Zeit des Jahres, Spitzenwoche ab 24.05. |
| Jun | 100 h | 2,8 | Lineups komplett Lusatia (08.06.) bis by nature (22.06.). Mails Anreise ab 11.06. | Letzte Vorproduktion bis 15.06., danach nur Fakten aktualisieren. | Ab 28.06. alle fünf gleichzeitig in der heißen Phase. |
| Jul | 110 h | 3,1 | Lusatia 23. bis 25.07., Draußenbande ab 30.07. Care-Videos und Timetables im Wochentakt. | Aktualisieren, freigeben, einplanen. Gästeinfos bis 01.07. freigegeben. | Zweite Spitze durch Betreuung und Festivalbetrieb; eigene Community-Person je Festivalwoche. |
| Aug | 66 h | 1,9 | by nature 06. bis 08.08., Wilde Möhre 20. bis 23.08., Fluidity 27. bis 29.08. | Dankesserien, Galerien, Feedback, Aftermovie Lusatia. | F-7-Infos fallen auf den Eröffnungstag des vorherigen Festivals. |
| Sep | 9 h | 0,3 | Rückblicke, Feedback, Aftermovies Lusatia und Draußenbande. | Aftermovies by nature, Wilde Möhre, Fluidity; Auswertungen Z+30. | Hier kommt der Vorverkauf 2028 dazu (nicht gerechnet). |

## 19 Aufwand und Kapazität

Alle fünf Festivals zusammen: rund 3.550 Stunden ohne Extras, mit gemeinsamen Vorlagen und Runden eher 2.840 Stunden.

| Kennzahl | Wert |
| --- | --- |
| Ø Woche Oktober bis Februar | 39 h (gut eine Vollzeitstelle) |
| Spitzenwoche | ab 24.05.2027: 151 h, 4,3 Stellen |
| Ø Woche 28.06. bis 01.08.2027 | 107 h, vor allem Betreuung und Festivalbetrieb |
| Vollzeitstelle | 35 produktive Stunden pro Woche |

Stunden nach Arbeitsschritt: planung 322 h, erstellung 1357 h, abstimmung 111 h, freigabe 219 h, posting 227 h, nachbereitung 338 h, laufend 981 h. laufend = Stories, Community-Betreuung, Redaktionsrunde.

| Rolle | Stunden über alle fünf |
| --- | --- |
| Community-Betreuung | 1082 h |
| Redaktion | 682 h |
| Kommunikationsleitung | 564 h |
| Gestaltung | 539 h |
| Video | 375 h |
| Anzeigen | 101 h |
| Website und Shop | 76 h |
| Presse | 58 h |
| Fachfreigabe Betrieb | 30 h |
| Fachfreigabe Programm | 24 h |
| Fachfreigabe Ticketing | 16 h |
| Fachfreigabe Care | 8 h |

Die Vorproduktion senkt den Juli, verschiebt die Spitze aber in den Mai. Ohne Vorproduktion läge der Juli im Schnitt bei rund 139 Stunden pro Woche (Spitze 144 Stunden ab 12.07.2027), genau dann, wenn dasselbe Team vor Ort gebraucht wird. Mit Vorproduktion sind es rund 107 Stunden im Juli, dafür bis zu 151 Stunden im Mai. Ab März werden verlässlich drei bis vier Personen gebraucht.

## 20 Redaktionelle Mindestprüfung vor jeder Veröffentlichung

1. Festival und Ausgabe stimmen. Ein gemeinsamer Ort macht Informationen verschiedener Festivals nicht austauschbar.
2. Bezugstag ist eindeutig. Gästeöffnung und Programmstart können abweichen.
3. Tickets, Fristen, Links, Regeln und Anreise sind für die aktuelle Ausgabe bestätigt.
4. Programmbeiträge sind bestätigt, Namen und Accounts geprüft, Material und Text freigegeben.
5. Gemeinsame Beteiligung ist angefragt oder zugesagt und so bezeichnet.
6. Bildnachweise, Nutzungsrechte, Musiklizenzen und Werbekennzeichnung sind geklärt.
7. Gäste erkennen, was sie wissen oder tun sollen. Praktische Infos bleiben auf der Website auffindbar.
8. Veröffentlicht wird erst nach der tatsächlichen Veröffentlichung gesetzt.

## 21 Arbeitsauftrag für den Werkzeugkasten

> Berechne für das gewählte Festival und die Ausgabe den Postingplan nach dem Regelwerk `habitat-postingplan-regelwerk.json`. Lies Termine, Vorverkauf, Preisphasen und Zielgrößen aus der Prognoseplattform und die Zielgruppenanalyse aus dem Festivalprofil.
>
> Erzeuge die Veröffentlichungen aus den Mindestregeln, ergänze Redaktionsslots nach Phasenmenge und rechne für jede Veröffentlichung die Schritte ihrer Klasse rückwärts. Wende Werktagsregel, Verbund-Stichtag und Überfälligkeitsregel an. Übernimm aus dem Hohen Haus die verantwortliche Person des Festivals. Sie verteilt Rollen und Schritte selbst; schlage ihr eine Verteilung vor und zeige die Stunden je Woche, damit sie Überlast früh an die Geschäftsführung melden kann.
>
> Rufe für jeden Schritt mit Werkzeug den passenden Generator mit dem Briefing auf (Zielgruppe, Zweck, Kernbotschaft, belegtes Detail, Kanal, Format, nächster Schritt, Faktenquelle). Für Videos und wichtige Kampagnen liefert der Skriptschreiber zwei bis drei deutlich unterschiedliche Einstiege aus realen Motiven oder Einwänden. Alle Ergebnisse haben den Status Entwurf. Erfinde keine Preise, Namen, Zusagen, Bestände, Gästestimmen oder Care-Maßnahmen.
>
> Plane an jedem Prüfpunkt die Stufe ein. Schlage bei Gelb oder Rot passende Extras mit Vorlauf, Aufwand und Budgetbedarf vor; eingeplant wird erst nach Freigabe. Übergib freigegebene Aufgaben als Hauptaufgabe mit Unteraufgaben an Asana und Veröffentlichungen, Freigaben und Drehs an den Redaktionskalender. Liste fehlende Ereignisdaten und unbesetzte Rollen mit Auswirkung auf den Plan.

## 22 Offene Angaben vor dem ersten Einsatz

| Angabe | Wer | Auswirkung |
| --- | --- | --- |
| Verantwortliche Person Kommunikation je Festival | Geschäftsführung im Hohen Haus | ohne sie keine Übergabe an Asana |
| Verteilung der übrigen Rollen mit Wochenstunden | verantwortliche Person des Festivals | ohne sie keine Kapazitätsprüfung |
| Verkaufsplan je Festival als Zielpfad | Ticketing mit Prognoseplattform | Prüfpunkte laufen sonst mit Platzhaltern |
| Preiswechsel, Buchungsschlüsse, Ticketumschreibung | Ticketing | Fristbeiträge und Mails fehlen im Plan |
| Exakte Öffnung und Ende bei Draußenbande und Wilde Möhre | Produktion | alle Termine ab F verschieben sich |
| Anzeigenbudget je Festival und Kampagne | Geschäftsführung | Anzeigenregeln und Extras E01, E02, E08, E09, E12 |
| Bewerbungsfenster, begleitende Veranstaltungen | Programm | zugehörige Regeln bleiben inaktiv |
| Echte Zeiten nach den ersten zehn Veröffentlichungen | Kommunikationsleitung | Stunden je Klasse nachstellen |

## 23 Historische Belege und ihre Grenzen

Planungsbelege aus den alten Systemen, übernommen aus der Grundlage. Sie zeigen geplante Einträge, nicht geprüfte Veröffentlichungszeitpunkte.

| Beleg | Eintrag | Was ableitbar ist |
| --- | --- | --- |
| Jahresraster 2024 | Bewerbungen Januar, DJ-Liste Februar, Bands und Rahmenprogramm März, Helfende Mai, Mitfahren, Achtsamkeit und Cashless Juli, Timetable und Geländeplan August | Themen und saisonale Reihenfolge, keine exakten Abstände |
| Prærie 2024 | Festival 02. bis 04.08.; FAQ 25. und 26.07.; Lineup und Timetable 29.07.; Dank 08.08. | FAQ 7 bis 8 Tage, Timetable 4 Tage vorher, Dank 4 Tage danach |
| Wilde Möhre 2024 | Festival 09. bis 12.08.; Aufgabe 06.08. „2 Tage noch“ | Titel und Datum widersprechen sich; nicht als Regel nutzen |
| Wilde Möhre 2025 | Geländeplan und Anreise 06.08.; Timetable 21.08.; Startpost 22.08. | Anreise 16 Tage, Timetable 1 Tag vor dem Startpost |
| Wilde Möhre 2026 | Countdowns 100, 70, 50, 40, 30, 20 Tage zwischen 13.05. und 01.08. | konsistenter Bezugstag 21.08.2026; Grundlage für CD-Regeln |
| Dankesserien 2021 und 2022 | eigener Plan mit Texten, Bildern, Credits, Freigaben | Dank als eigene Reihe; bleibt als Z14-DANKSERIE |
| Gemeinsame Beiträge 2024 und 2026 | co-authored Highlights, Felder für gemeinsame Accounts | Collabs waren Standard; bleibt in Klasse M und P |

Für Wilde Möhre ist die historische Grundlage dicht, für Lusatia, Winterreise und Wildeverse nicht. Tatsächliche Veröffentlichungszahlen, Produktionsstunden und Verkaufseffekte lagen nicht vor.

## 24 Quellen

Interne Ausgangsdokumente (Stand 05.10.2026): `festival-postingplan-grundlage.md`, `habitat-festivals-kommunikationsstandard.md`, `habitat-festivals-pruefvorlage.md`. Festivaltermine und Vorverkaufsstarts aus der Prognoseplattform (Beschlüsse vom 27. und 28.09.2026).

Historische Pläne (aus der Grundlage übernommen, nicht erneut ausgelesen):

[Coda Online Content mit historischem Kalender](https://coda.io/d/_dCILGCWlMzx/Online-Content_suEjnBMy)  
[Coda Online Content Socials](https://coda.io/d/_dCILGCWlMzx/Online-Content-Socials_sujzKpbX)  
[Coda Postingplan Dankeschöns 21](https://coda.io/d/_dCILGCWlMzx/Postingplan-Dankeschons-21_su_xFZCf)  
[Asana WMF 22 Social Media](https://app.asana.com/1/57435200923138/project/1200969151897819)  
[Asana WMF 23 Social Media](https://app.asana.com/1/57435200923138/project/1202945039175898)  
[Asana gemeinsamer Postingplan 2024](https://app.asana.com/1/57435200923138/project/1206170414662250)  
[Jahresraster im monatlichen Contentplan](https://docs.google.com/spreadsheets/d/1LVWasN3WbG5Q5wxBXTgrnOtXeCQr2zJtDhIG061UHWw/edit)  
[Contentplan Saison 2025](https://docs.google.com/spreadsheets/d/1IAGNRdr1utJ12z8pChoS2_D_eP4y_BsqDX3pazKxqDs/edit)  
[Contentplan JESSI Saison 2026](https://docs.google.com/spreadsheets/d/1UxuYghmTa2pp9X8ADLzCl6AvY5XgizJV8vMzjgTYM30/edit)  
[Coda Postingplan Wilde Winterreise](https://coda.io/d/_dj2kaJn4gEO/Postingplan_suL4pLDu)  
[Asana Wildeverse Social Media](https://app.asana.com/1/57435200923138/project/1200163172016512)  

Fachliche Einordnung (aus dem Kommunikationsstandard übernommen, nicht erneut geprüft; sie stützen die Richtung, nicht die konkreten Mengen und Fristen):

[Meta zu originalen Inhalten, 28.01.2026](https://about.fb.com/news/2026/01/2026-ai-drives-performance/)  
[Meta zur Wirkungsmessung, 03.03.2026](https://about.fb.com/ltam/news/2026/03/simplificando-la-medicion-de-anuncios-para-un-mundo-social-first/)  
[TikTok Creative Best Practices](https://ads.tiktok.com/resources/help/article/creative-best-practices)  
[TikTok Next 2026](https://ads.tiktok.com/business/en-US/next)  
[WARC und TikTok zur kreativen Entwicklung, 14.07.2026](https://ads.tiktok.com/business/en/blog/warc-report-new-creative-advantage)  
[IPA zum kommerziellen Wert von Vertrauen](https://ipa.co.uk/initiatives/effworks/effworks-ft-reports/trust/)  
[Litmus Email Marketing Trends 2026](https://www.litmus.com/blog/trends-in-email-marketing)  
