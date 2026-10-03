Geprüft: 31a, Commit c58ffd1, 19 Dateien

1. [schwer] Einwurf kann nach einem Fehler doppelte Punkte erzeugen  
Fundstelle: `supabase/functions/gfweekly/index.ts`:2913  
Was passiert: `einwurf_apply` schreibt Verlauf, Punktänderungen, neue Punkte, Vorhabenfelder und Ticker in getrennten Datenbankaufrufen. Scheitert ein späterer Schritt, setzt der Fehlerpfad nur den Einwurf zurück. Bei erneutem Übernehmen werden neue Punkte erneut angelegt; bereits geänderte Daten bleiben bestehen.  
Warum falsch: Abschnitt 31a verlangt, dass die gewählten Teile zuverlässig angewendet werden. Der Status „neu“ oder „vorgeschlagen“ kann nach einem Fehler einen unveränderten Zustand vortäuschen. Die `source_ref` schützt nur Verlauf und Ticker.  
Vorschlag: Anwendung und Statuswechsel in eine Datenbanktransaktion legen. Bis dahin für jeden neu angelegten Punkt eine eindeutige Einwurfkennung speichern und beim Wiederholen prüfen.

2. [schwer] KI Vorschlag lässt sich auf ein anderes Vorhaben anwenden  
Fundstelle: `supabase/functions/gfweekly/index.ts`:2908  
Was passiert: Eine beim Übernehmen übergebene `vorhaben_id` ersetzt das erkannte Vorhaben. Der Code kann danach den vorgeschlagenen Verlauf, Ball, nächsten Schritt und die Frist in dieses andere Vorhaben schreiben. Nur vorgeschlagene Punkt IDs werden nochmals gegen das Ziel geprüft.  
Warum falsch: Der Vorschlag wurde anhand des Kontexts eines anderen Vorhabens geprüft. Damit ist die strenge Prüfung aus Abschnitt 31a beim Zielwechsel nicht mehr gültig.  
Vorschlag: Bei geändertem Ziel den bisherigen Vorschlag verwerfen und nur einen von der Person bearbeiteten Verlauf übernehmen oder den Vorschlag für das neue Ziel erneut prüfen lassen.

3. [schwer] Erneute Bestätigung kann einen manuellen Ballwechsel überschreiben  
Fundstelle: `supabase/migrations/20261003165328_hh_vorhaben_v31a.sql`:324  
Was passiert: `hh_handover_set` setzt bei vorhandener Vertretung den Ball erneut auf die Vertretung, auch wenn ein manueller Ballwechsel die `absence_id` bereits gelöst hat. Zugleich entsteht bei unveränderter Korbzeile kein neuer Vorhabensverlauf.  
Warum falsch: Abschnitt 31a verlangt, dass spätere manuelle Änderungen von Alex oder Lea erhalten bleiben. Hier kann eine erneute Bestätigung sie still zurücksetzen.  
Vorschlag: Bei bereits bestätigter Korbzeile und gelöster Abwesenheitsbindung den Vorhabenball nicht erneut setzen. Einen gewollten neuen Wechsel als eigene Änderung mit Verlauf behandeln.

4. [schwer] Bestätigter Abgleich kann ohne erledigten Punkt stehen bleiben  
Fundstelle: `supabase/functions/gfweekly/index.ts`:2857  
Was passiert: `verlauf_status` bestätigt zuerst den Vorschlag und hakt erst danach den zugehörigen Punkt ab. Misslingt das Abhaken oder der Verlaufseintrag des Toggles, bleibt der Vorschlag bestätigt. Ein erneuter Aufruf hakt den Punkt nicht mehr ab, weil `alt.status` dann nicht mehr `vorschlag` ist.  
Warum falsch: Verlauf und Punkt widersprechen sich dauerhaft.  
Vorschlag: Beides in einer Transaktion ausführen oder den Status erst nach erfolgreichem Abhaken setzen und eine sichere Wiederholung ermöglichen.

5. [mittel] Schichtübergabe schützt nicht vor gleichzeitigem Ballwechsel  
Fundstelle: `supabase/functions/gfweekly/index.ts`:3006  
Was passiert: `schicht_uebergabe` liest den Ball und speichert anschließend ohne `expect_ball`. Ändert die andere Person dazwischen den Ball, überschreibt die Schichtübergabe deren Entscheidung. `von`, `an` und `by` werden zudem nicht auf Übereinstimmung geprüft.  
Warum falsch: Abschnitt 31a nennt den Schichtwechsel ausdrücklich; gerade bei Alex und Lea zugleich muss ein veralteter Stand sichtbar werden.  
Vorschlag: Den gelesenen Ball als `expect_ball` an `vhSave` geben und bei Konflikt die betroffene Zeile zur erneuten Entscheidung zurückmelden. `by` gegen `von` prüfen.

6. [mittel] Wirkungsprobe räumt Testdaten nicht vollständig auf  
Fundstelle: `pruefung/vorhaben-probe.mjs`:149  
Was passiert: Die Probe archiviert `test-v31`, lässt aber das Vorhaben samt Punkten, Verlauf und entschiedenen Einwürfen bestehen. Auch die angelegte Testabwesenheit wird beendet, nicht entfernt. Wiederholungen sammeln weitere Datensätze.  
Warum falsch: Abschnitt 31a verlangt, dass die Wirkungsprobe hinter sich aufräumt. „Kein Testvorhaben unter den aktiven“ belegt lediglich, dass es ausgeblendet ist.  
Vorschlag: Testdaten mit eindeutiger Laufkennung anlegen und samt abhängigen Datensätzen sicher entfernen oder im Paket ausdrücklich einen dauerhaft archivierten Testbestand festlegen und die Probe darauf begrenzen.

7. [mittel] „Streng geprüft“ deckt vertrauliche KI Texte nicht ab  
Fundstelle: `supabase/functions/gfweekly/index.ts`:1261  
Was passiert: Die Prüfung begrenzt Länge und einzelne Werte, übernimmt Textfelder der KI aber inhaltlich unverändert. Ein Hinweis im Prompt auf Passwörter, Gesundheit und Bewertungen wird nicht technisch durchgesetzt. Beim Übernehmen können diese Texte im Verlauf, in Punkten oder im Ticker landen.  
Warum falsch: Der Prüfauftrag verlangt Vertraulichkeit und eine streng geprüfte KI Antwort. Der Technikstand beschreibt die Prüfung stärker, als dieser Code sie belegt.  
Vorschlag: Vor dem Speichern und Anwenden erkennbare Zugangsdaten und sensible Personenangaben zurückweisen oder zur manuellen Bearbeitung markieren. Den tatsächlichen Umfang der Prüfung im Technikstand benennen.

8. [mittel] Die 57 Proben belegen einige Fehlerursachen und Nebenwirkungen nicht  
Fundstelle: `pruefung/vorhaben-probe.mjs`:52  
Was passiert: Mehrere Negativproben zählen nach dem erwarteten HTTP Status ohne Prüfung des Fehlergrunds als bestanden. Es gibt keine Probe für einen Fehler mitten in `einwurf_apply`, einen Zielwechsel des KI Vorschlags oder zwei gleichzeitige Ballwechsel. Der Vergleich echter Vorhaben erfasst nur ausgewählte Felder der Listenantwort.  
Warum falsch: Die Aussage „57 von 57“ in `docs/TECHNIKSTAND.md`:654 kann als umfassendere Wirkungsprüfung gelesen werden, als das Skript leistet.  
Vorschlag: Die genannten Fälle gezielt ergänzen und im Technikstand die geprüften Grenzen aufführen.

### Empfehlungen

1. Für alle mehrstufigen Schreibaktionen eine gemeinsame Datenbankfunktion mit Transaktion verwenden. Das vereinfacht Fehlerbehandlung und Wiederholung.
2. Bei Ballwechseln durchgehend den zuletzt gesehenen Ball prüfen und Konflikte mit dem aktuellen Namen zurückgeben.
3. Testdaten über eine Laufkennung auffindbar machen und den Aufräumer auch nach Abbruch erneut ausführbar halten.
4. Den Technikstand um eine kurze Tabelle ergänzen: Code geprüft, Backend laut dokumentiertem Probelauf geprüft, hier ohne Backendzugang offen.

Ich habe den Diff und die Dateien gelesen. Die Datenbank war für diese Prüfung nicht erreichbar. Die behauptete Anwendung der Migration, der Deploy von v38 und der Lauf mit 57 von 57 Proben konnten deshalb nicht unabhängig bestätigt werden. Neue Oberflächenseiten gehören erst zu den folgenden Teilpaketen; Darstellungen bei 1440 und 390 Pixeln sowie Bedienung mit Tastatur und Bildschirmleser waren an 31a nicht prüfbar.