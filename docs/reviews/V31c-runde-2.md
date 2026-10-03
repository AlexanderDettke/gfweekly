Geprüft: 31c, Commit 85e3a84, 15 Dateien

1. [schwer] Bearbeiteter Verlaufstext bleibt nach Zielwechsel erhalten  
Fundstelle: `site/assets/core.js:785`  
Was passiert: Wird ein Verlaufstext bearbeitet und danach ein anderes Vorhaben gewählt, bleibt `S.text` erhalten. Auch nach einem erfolgreichen neuen Vorschlag zeigt das Textfeld den alten Text. „Übernehmen“ sendet ihn als Bearbeitung für das neue Vorhaben.  
Warum falsch: Abschnitt 31c verlangt einen Vorschlag, der zum gewählten Vorhaben passt. Hier kann ein Text zum alten Vorhaben in der neuen Akte landen.  
Vorschlag: Beim Zielwechsel den bearbeiteten Verlaufstext und den bearbeiteten nächsten Schritt zurücksetzen. Nach dem neuen Vorschlag dessen Text anzeigen. Diesen Ablauf als Oberflächenprobe ergänzen.

2. [mittel] Pflichttext erscheint nach dem Leeren erneut als Rohtext  
Fundstelle: `site/assets/core.js:785`  
Was passiert: Ohne passenden Vorschlag ist das Pflichtfeld mit `S.ew.text` vorbelegt. Wird es geleert und „Übernehmen“ gedrückt, zeichnet `render()` wegen `S.text || … || S.ew.text` den Rohtext erneut ein. Beim nächsten Klick kann er übernommen werden.  
Warum falsch: Die Antwort aus Runde 1 bezeichnet den manuellen Verlaufstext als Pflicht. Das Feld respektiert eine bewusst geleerte Eingabe nicht.  
Vorschlag: Leere Eingaben als eigenen Zustand speichern und im manuellen Weg keinen Rohtext erneut einsetzen. Die Probe sollte auch den Feldinhalt nach dem Fehler prüfen.

3. [mittel] Geänderte Assets behalten dieselbe Version  
Fundstelle: `site/vorhaben.html:13`  
Was passiert: `core.js` und `styles.css` wurden in `85e3a84` geändert. `vorhaben.html` und `index.html` laden beide weiterhin `?v=29`. Ein Browser mit zwischengespeicherten Assets kann deshalb den alten Dialog oder alte Stile verwenden.  
Warum falsch: Die Arbeitsregeln in `docs/PAKET-V31-VORHABEN.md`, Abschnitt „Arbeitsweise und Prüfschleife mit Codex“, verlangen eine höhere Assetversion bei jeder Änderung dieser Dateien.  
Vorschlag: Die Version der beiden Assets auf allen einbindenden Seiten einheitlich erhöhen.

4. [mittel] Konfliktmeldung behauptet eine erfolgreiche Neuladung ohne Beleg  
Fundstelle: `site/assets/core.js:880`  
Was passiert: Nach einem Konflikt lädt der Dialog `einwurf_list` und sucht den Einwurf in der Antwort. Fehlt er dort, bleibt der alte Stand erhalten. Trotzdem ergänzt der Dialog „Der Einwurf ist neu geladen“. Die Liste ist im Backend auf 200 Einträge begrenzt (`supabase/functions/gfweekly/index.ts:3003`).  
Warum falsch: Die Antwort aus Runde 1 verspricht, dass der Einwurf bei einem Konflikt neu geladen wird. Bei einem älteren Einwurf ist das über diese Liste nicht zuverlässig.  
Vorschlag: Den Einwurf gezielt per ID laden. Die Aufforderung, die Haken erneut zu prüfen, erst nach erfolgreichem Laden anzeigen; andernfalls einen klaren Ladefehler zeigen.

5. [leicht] Technikstand zählt die alten Bedienproben  
Fundstelle: `docs/TECHNIKSTAND.md:684`  
Was passiert: Der Abschnitt nennt weiterhin 14 Proben. Der Einwurfabschnitt in `pruefung/bedienung.mjs:431` enthält inzwischen 21 `pruefe` Aufrufe.  
Warum falsch: Die Dokumentation bildet die Nacharbeit aus Runde 1 nicht ab.  
Vorschlag: Zahl und beschriebene Fehlerwege aktualisieren.

## Empfehlungen

1. Nach einem Zielwechsel den Dialog deutlich mit „Vorschlag für dieses Vorhaben“ kennzeichnen, sobald die neue Prüfung abgeschlossen ist.
2. Im manuellen Weg den Rohtext nur als Quelle oberhalb des leeren Verlaufsfeldes zeigen. Das macht die bewusste Formulierung für die Akte klarer.
3. Beim Konflikt die Übernahme bis zur erfolgreichen Neuladung sperren.
4. Die mobile Probe um einen tatsächlichen Wechsel zwischen beiden Dialogschritten und die Erreichbarkeit des Übernehmen Knopfs ergänzen.

Die Antworten zu Benachrichtigung, manueller Zuordnung und neuen Oberflächenproben sind im Code grundsätzlich umgesetzt. Der gespeicherte Prüfwert stimmt mit dem aktuell berechneten Wert überein; damit ist die Antwort zum inhaltsgebundenen Abnahmebeleg nachvollziehbar. Browserdarstellung bei 1440 und 390 px, Tastatur und Bildschirmleser, tatsächliche Datenbankwirkung sowie das Aufräumen der Wirkungsprobe konnte ich hier nicht selbst prüfen.