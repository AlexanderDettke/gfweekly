# Antwort auf V31d, Runde 1 (Commit 40d1463)

Belege: Migration `supabase/migrations/20261003182649_hh_vorhaben_v31de.sql` (angewendet am 03.10.2026), v38 neu deployt nach Diff gegen den Live-Stand
(gleich 40d1463), Wirkungsprobe 88 von 88, Bedienung „Alle Bedienproben in Ordnung“, dazu das Live-Durchspiel über die Oberfläche (siehe Technikstand, Abschnitt Abnahme).
Zusätzlich selbst gefunden und behoben: `vorhaben_seit` blendete für Alex auch Einträge von `abgleich-alex` aus (`whoNorm` erkennt „alex“ im Namen); jetzt fallen nur Einträge mit `created_by` genau „Alex“ bzw. „Lea“ weg.

| Nr. | Schwere | Entscheidung | Beleg |
|---|---|---|---|
| 1 | schwer | übernommen | Der Urlaubsdialog zeigt bestätigte Zeilen mit ihrem Stand („entschieden: bei Alex“, „ruht“), wählt sie entsprechend vor und sendet sie nur, wenn sich die Wahl ändert; offene Vorschläge werden mit „Übergabe senden“ bestätigt. Bedienung: „bestätigte Zeile zeigt ihren Stand“, „unveränderte bestätigte Zeile wird nicht gesendet“. |
| 2 | schwer | übernommen | Jede gesendete Zeile trägt `expect` (Status, Ampel, Vertretung wie gesehen); `hh_handover_set` antwortet bei Abweichung 409, die Aktion gibt den Status durch, `handover_set_many` meldet `konflikt` je Zeile, der Dialog lädt den Korb neu. Wirkungsprobe: „Korbzeile mit veraltetem Stand (409)“. |
| 3 | mittel | übernommen | Gibt es mehrere geplante oder laufende Abwesenheiten der Person, fragt der Dialog „Für welche Abwesenheit?“ und bietet „Neue Abwesenheit anlegen“ an; bei genau einer nimmt er sie. |
| 4 | mittel | übernommen | Hinweis schon beim Anlegen: auch eine Probe baut den Korb aus echten Vorhaben, Gesendetes bewegt echte Bälle bis zum Ende der Probe. Im Korb einer Probe: Warnung und Knopf „Probe beenden, Bälle zurück“ (`absence_end`). Im Live-Durchspiel lief die Probe mit genau einer gesetzten Zeile und endete über die Rückkehrseite. |
| 5 | mittel | übernommen | `vorhaben_seit` filtert in der Datenbank (aktive Vorhaben, nicht eigene) und liest seitenweise bis 2.000 Einträge; darüber meldet die Antwort `gekuerzt`. Wirkungsprobe: „vorhaben_seit: Einträge von Lea ja, eigene nein“. |
| 6 | mittel | übernommen | `rueckkehr.html`: Ladezustand, Fehler mit „noch einmal laden“ vor der Rückübergabe, echter Leerzustand, Kurzzeile „zurückgegeben · noch in Vertretung · haben geruht“ (Empfehlung 4). |
| 7 | mittel | teilweise | Der Beleg `pruefung/letzte-abnahme.json` hängt mit Absicht am Inhalt (`stand`), nicht am Commit (Kommentar in `pruefung/abnahme.sh`); sein Feld `commit` nennt den Start-Commit. Der Technikstand trennt Oberflächentest (Schirme, Bedienung) und Wirkung (Wirkungsprobe, Live-Durchspiel) ausdrücklich. |

Empfehlungen: 1 übernommen (siehe 1). 2 teilweise (der Hinweis verlinkt den Rest des Korbs in der Übergabe). 3 nicht übernommen: der Personenwechsel lädt Für dich ganz neu, `vorhaben.html` zeichnet nur neu; eine verspätete Antwort betrifft dort keine Personendaten. 4 übernommen. 5 übernommen als Live-Durchspiel mit einer Testabwesenheit; eine Probe mit der echten Abwesenheit vom 14. bis 25.10. legt Lea selbst an, sobald sie sie einträgt (`FRAGEN_FUER_MORGEN.md`).
