Geprüft: 31b, Commit 1069863, 30 Dateien

Die Antworten auf die acht Befunde aus Runde 1 sind am Code nachvollziehbar. Offen bleiben zwei neue Fehlerfälle und eine Lücke bei der Tastaturbedienung.

1. [schwer] Gleichzeitige Punktbearbeitung kann Änderungen überschreiben  
Fundstelle: `site/vorhaben.html:399`  
Was passiert: Das Formular sendet Titel, Zuständigkeit, Frist und Stand zusammen, auch wenn nur eines dieser Felder geändert wurde. Hat Lea inzwischen eines der anderen Felder bearbeitet, schreibt Alex beim Speichern dessen alten Wert zurück. Eine Prüfung auf einen zwischenzeitlich geänderten Stand fehlt.  
Warum falsch: Dadurch können Änderungen verloren gehen. Der Prüfauftrag verlangt ausdrücklich, gleichzeitige Bearbeitung durch Alex und Lea zu prüfen.  
Vorschlag: Nur tatsächlich geänderte Felder senden und vor dem Schreiben eine Version oder `updated_at` im Backend prüfen. Bei Konflikt den aktuellen Punkt zeigen und erneut entscheiden lassen.

2. [mittel] Alter Teamname wird beim Wechsel zu Extern übernommen  
Fundstelle: `site/vorhaben.html:234`  
Was passiert: Liegt der Ball bei „Team: Helge“, ist „Helge“ im Namensfeld vorbelegt. Beim Ziehen in „Wartet extern“ bleibt der Wert stehen und die Pflichtprüfung lässt die Übergabe ohne neue Namensangabe zu.  
Warum falsch: Abschnitt 31b verlangt bei Team und Extern eine Rückfrage nach dem Namen. Die Akte kann danach einen externen Ball fälschlich Helge zuordnen.  
Vorschlag: Den Namen nur vorbelegen, wenn die gewählte Ballart unverändert bleibt. Beim Wechsel zwischen Team und Extern das Feld leeren und neu ausfüllen lassen.

3. [mittel] Der Ball Dialog hält den Tastaturfokus nicht  
Fundstelle: `site/vorhaben.html:239`  
Was passiert: Der Dialog setzt `aria-modal="true"` und fokussiert einen Chip, begrenzt den Fokus aber nicht auf den Dialog. Mit Tab sind Bedienelemente der Seite dahinter erreichbar. Nach dem Schließen wird der Fokus nicht zum auslösenden Knopf zurückgesetzt.  
Warum falsch: Die als modal ausgezeichnete Oberfläche verhält sich für Tastatur und Bildschirmleser nicht modal.  
Vorschlag: Hintergrund während des Dialogs aus der Bedienreihenfolge nehmen, Tab und Umschalt Tab im Dialog halten und den Fokus beim Schließen zurückgeben. Eine Tastaturprobe für Öffnen, Durchlaufen und Schließen ergänzen.

## Empfehlungen

1. Die Bedienprobe um den Wechsel von Team zu Extern mit vorbelegtem Namen und um zwei gleichzeitig geöffnete Punktformulare erweitern.
2. Nach einem erfolgreichen Ballwechsel die geöffnete Akte ausdrücklich mitladen, damit Karte und Akte denselben Stand zeigen.
3. Beim Lösen einer Zuordnung den Knopf „Rückgängig“ auch nach einem fehlgeschlagenen Wiederherstellungsversuch stehen lassen.

Ich konnte keinen Browser starten und hatte keinen Backendzugang. Die Darstellung bei 1440 und 390 px, die 84 dokumentierten Bilder und die tatsächliche Datenbankwirkung habe ich deshalb nicht unabhängig geprüft. Die dokumentierten Schirm und Bedienläufe fangen die Edge Function ab und sind Oberflächentests.