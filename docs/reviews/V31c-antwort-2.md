# Antwort auf V31c, Runde 2 (Commit 85e3a84)

| Nr. | Schwere | Entscheidung | Beleg |
|---|---|---|---|
| 1 | schwer | übernommen | Zielwechsel setzt bearbeiteten Verlaufstext (`S.vtext`), bearbeiteten nächsten Schritt und „Bearbeiten“ zurück; angezeigt wird der Vorschlag des neuen Ziels. Bedienung: „Zielwechsel verwirft den bearbeiteten Text und zeigt den neuen Vorschlag“. |
| 2 | mittel | übernommen | Der Verlaufstext hat einen eigenen Zustand (`null` = nicht angefasst, `""` = bewusst geleert); ein geleertes Pflichtfeld bleibt leer. Bedienung: „leerer Verlaufstext wird nicht gesendet und bleibt leer“. |
| 3 | mittel | übernommen | Assets auf allen Seiten `?v=30` (178 Einbindungen, einheitlich). |
| 4 | mittel | übernommen | `einwurf_list` nimmt `id`; nach einem Konflikt lädt der Dialog den Einwurf gezielt, sperrt „Übernehmen“ bis dahin und sagt „neu geladen“ nur nach Erfolg, sonst einen Ladefehler. |
| 5 | leicht | übernommen | Technikstand nennt die Proben des Einwurfs neu (siehe Abschnitt 31c). |

Empfehlungen: 1 übernommen über den angezeigten Vorschlag des neuen Ziels. 2 teilweise: der Rohtext steht über dem Feld, das Feld bleibt mit ihm vorbelegt, weil es beim Knopf-Einwurf der eigene Text ist; geleert bleibt es leer. 3 übernommen. 4 teilweise: Vollbild und Fokusfalle bei 390 px sind geprüft, der Wechsel zwischen den Schritten ist im Desktop-Ablauf geprüft.
