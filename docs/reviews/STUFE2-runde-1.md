Geprüft: Stufe 2, Commit a2a7acb8fa6870f1d1e2f912815260b35edb15d7, 48 Dateien

1. [schwer] Umhängen erlaubt eine fehlende oder geschlossene Zielquelle  
Fundstelle: supabase/migrations/20261025210000_stufe2_fristen_phase.sql:124  
Was passiert: `hh_entscheidung_umhaengen` übernimmt auch eine nicht vorhandene Kennung oder eine bereits erledigte Quelle. Eine fehlende Quelle lässt die Entscheidung ohne gültigen Bezug zurück. `p_by` wird ebenfalls nicht geprüft.  
Warum falsch: Abschnitt 4 verlangt einen erhaltenen, eindeutigen Nachfolger; der Prüfauftrag verlangt eine vorhandene und offene Zielquelle.  
Vorschlag: Ziel unter Sperre auf Existenz und Eignung prüfen, `p_by` über `hh_en_person` validieren und bei Fehler mit `PT409` abbrechen.

2. [schwer] Rückgängig öffnet archivierte Themen nicht wieder  
Fundstelle: supabase/migrations/20261025220000_stufe2_sammelaktion_rueckweg.sql:55  
Was passiert: „Hinfällig“ archiviert ein Thema und speichert dessen Originalzustand. `hh_entscheidung_zurueck` stellt anschließend zwar die Entscheidung wieder her, schreibt aber `archived` und `archiv_grund` nicht zurück.  
Warum falsch: Der zugesagte Rückweg aus Abschnitt 3 ist für Themen unvollständig. Die wieder offene Entscheidung verweist weiter auf ein archiviertes Thema.  
Vorschlag: Diese beiden Archivfelder beim Rückgängig wiederherstellen und den Fall mit einem Thema prüfen.

3. [schwer] „Erledigt“ beendet nur die Korbzeile  
Fundstelle: site/uebergabe.html:145  
Was passiert: Der Knopf sendet `handover_set status erledigt`. Dessen Datenbankfunktion ändert weder einen offenen Punkt über `hh_punkt_toggle` noch schließt sie das Vorhaben. Offene Punkte erscheinen zudem nur gesammelt im Dossier, ohne eigene Korbzeile.  
Warum falsch: Abschnitt 5 verlangt „Erledigt“ je Zeile mit Wirkung auf Punkt beziehungsweise Vorhaben. Die Oberfläche meldet Erledigung, während die eigentliche Arbeit offen bleibt.  
Vorschlag: Punkte als einzeln bedienbare Zeilen führen und die jeweilige Abschlussaktion samt Korbstatus in einem geprüften Schreibweg verbinden.

4. [schwer] Unbestätigte offene Korbzeilen verschwinden beim Abschluss aus dem Arbeitsweg  
Fundstelle: supabase/functions/gfweekly/index.ts:1934  
Was passiert: `absence_end` übernimmt nur Zeilen mit `status = bestaetigt` in den Verlauf. Offene Vorschläge bleiben in der Korbtabelle, werden nach dem Ende der Abwesenheit aber nicht als liegen geblieben fortgeführt.  
Warum falsch: Abschnitt 1 und 5 verlangen die Weitergabe offener Korbzeilen. Gerade die dokumentierten unbestätigten Übergaben können so aus Leas Rückkehrbild fallen.  
Vorschlag: Alle noch offenen Zeilen eindeutig als offen oder ungeprüft fortführen und ihren Abschlussstatus nachvollziehbar setzen.

5. [schwer] Abwesenheit kann trotz gescheiterter Korbübernahme als beendet gemeldet werden  
Fundstelle: supabase/functions/gfweekly/index.ts:1928  
Was passiert: Die Abwesenheit wird zuerst per RPC beendet. Danach laufen Verlaufseinträge und Statusänderungen in einzelnen Aufrufen; deren Fehler werden nicht geprüft, und die äußere Fehlerbehandlung meldet trotzdem Erfolg.  
Warum falsch: Abschnitt 5 verlangt einen verlässlichen Abschluss mit übernommenen Korbzeilen. Ein Teilfehler hinterlässt einen abgeschlossenen, aber unvollständig übertragenen Zustand.  
Vorschlag: Abschluss, Verlauf und Korbstatus in eine Datenbanktransaktion legen und den gesamten Vorgang bei einem Fehler zurückrollen.

6. [mittel] „Hinfällig“ ignoriert einen inzwischen geschlossenen Ursprung  
Fundstelle: supabase/migrations/20261025220000_stufe2_sammelaktion_rueckweg.sql:46  
Was passiert: `hh_en_quelle_eignung` wird aufgerufen, sein Ergebnis aber verworfen. Ist ein Punkt bereits erledigt oder ein Thema archiviert, kann die Sammelaktion trotzdem eine weitere Hinfällig Aktion samt Verlauf und Rückweg erzeugen.  
Warum falsch: Abschnitt 3 verlangt Konflikte je Zeile statt einer Aktion auf veraltetem Stand.  
Vorschlag: `false` und `null` als `PT409` behandeln; eine fehlende `expect_updated_at` ebenfalls nicht still akzeptieren.

7. [mittel] „Vor Abreise“ hängt nicht nachweislich an einer Personenfrist  
Fundstelle: supabase/functions/gfweekly/index.ts:1267  
Was passiert: Der Korb verwendet `frist_massgeblich` des Vorhabens. Die bestehende Bewertung setzt bei frühem Datum „vorher“, ohne zu prüfen, welcher Punkt die Frist trägt und ob sie von einer Person stammt.  
Warum falsch: Abschnitt 5 erlaubt „vorher“ nur bei einer Personenfrist eines Punktes vor Abreise.  
Vorschlag: Den auslösenden Punkt samt Fristquelle lesen und „vorher“ ausschließlich bei erfüllter Bedingung setzen.

8. [mittel] „Nach Menschen“ lässt gemeinsame offene Entscheidungen aus  
Fundstelle: supabase/functions/gfweekly/entscheidungen.ts:308  
Was passiert: Die Gruppierung enthält offene Punkte und nur abgegebene Entscheidungen. Offene Entscheidungen der GF gemeinsam sowie bereits entschiedene Einträge fehlen dort, obwohl sie in den Phasenblöcken stehen.  
Warum falsch: Abschnitt 5 verlangt dieselben Punkte und Entscheidungen nach Menschen, gerade für die gemeinsame Aufgabenverteilung.  
Vorschlag: Die Einträge der Phasenblöcke nach `wer` gruppieren und die Zähler mit dieser Darstellung abgleichen.

9. [mittel] Rückkehrzeitraum verwendet ganzjährig die Sommerzeit  
Fundstelle: supabase/functions/gfweekly/entscheidungen.ts:269  
Was passiert: Anfang und Ende werden fest mit `+02:00` gebildet. Am 25.10.2026 wechselt Berlin auf `+01:00`; Ereignisse in der letzten lokalen Stunde des Tages können fehlen.  
Warum falsch: Das Lagebild aus Abschnitt 5 muss den gesamten Abwesenheitszeitraum erfassen.  
Vorschlag: Berliner Tagesgrenzen zeitzonengerecht berechnen und den Zeitwechsel als Probe ergänzen.

10. [mittel] Laufbilanz zählt Rücknahmen und Wochen nicht wie beschriftet  
Fundstelle: supabase/functions/gfweekly/entscheidungen.ts:243  
Was passiert: Erledigungen werden nur gezählt, solange `erledigt_by = lauf` aktuell am Punkt steht. Nach Rückgängig verschwinden sie aus der Erledigtzahl; eine eigene Rücknahmezahl fehlt. Verfall und Verwerfen werden der Erstellungswoche des Verlaufseintrags zugerechnet.  
Warum falsch: Abschnitt 6 verlangt je Woche erzeugt, übernommen, zurückgenommen und verfallen. So lässt sich auch das Abbruchkriterium nicht zuverlässig beurteilen.  
Vorschlag: Zustandswechsel als Ereignisse mit Zeitpunkt zählen und Rücknahmen ausdrücklich ausweisen.

11. [mittel] Standardtermin für „Nicht jetzt“ ist auf der Liste ein anderer  
Fundstelle: site/entscheidungen.html:289  
Was passiert: Der Dialog trägt genau 28 Tage als Datum ein und sendet es als ausdrücklichen Wert. Die Datenbankregel für den ersten Montag nach vier Wochen greift dadurch nicht. Am 25.10.2026 wäre der Dialogstandard der 22.11., die Vorgabe der 23.11.2026.  
Warum falsch: Abschnitt 3 nennt den Montag als Standard.  
Vorschlag: Den Montag im Dialog vorbelegen oder bei unverändertem Standard keinen Datumswert senden.

12. [mittel] „Für dich“ priorisiert weiterhin Kandidaten nach Laufeinschätzung  
Fundstelle: site/index.html:298  
Was passiert: Die Fünf Minuten Auswahl nimmt Kandidaten mit `relevance = hoch` auf, nennt sie „Kandidat hoch“ und gibt ihnen einen Rang.  
Warum falsch: Abschnitt 2 entfernt die Priorität des Laufs aus „Für dich“ und untersagt die Sortierung danach. Neue Kandidaten können diesen Weg weiterhin erreichen.  
Vorschlag: Den Rang aus `relevance` entfernen und Kandidaten nur nach dem vorgesehenen Korb und Fokus anzeigen.

## Empfehlungen

1. Die Proben um die negativen Fälle ergänzen: fehlendes Ziel beim Umhängen, Rückgängig eines Themas, Teilfehler bei `absence_end` und „Erledigt“ mit Prüfung des eigentlichen Punktes.
2. `lauf_bilanz` anhand einer Folge aus Erledigung, Rücknahme und Verfall über zwei Wochen prüfen.
3. Vor Abschluss des Pakets die fehlende, bereits verlinkte `docs/STAND-STUFE-2.md` erstellen.

Die behauptete Liveauflösung der 53 Themen und 35 Kandidaten sowie die Backendwirkung habe ich wegen des untersagten Netzzugriffs nicht unabhängig geprüft. Ich habe keine Tests ausgeführt und keine Dateien geändert.

