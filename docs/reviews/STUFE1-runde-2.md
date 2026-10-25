Geprüft: Stufe 1, Commit 7f45ccaaf8ca5b0edbe747fd8c5eb921c8e5bfc7, 52 Dateien

1. [schwer] Abweichendes Ergebnis wird als gespeichert gemeldet  
Fundstelle: `supabase/migrations/20261025163000_stufe1_korrekturen.sql:132`  
Was passiert: Ist eine Entscheidung bereits getroffen, liefert ein zweiter Aufruf auch bei einem anderen Ergebnis Erfolg ohne Änderung. Die Besprechung übernimmt das zweite Ergebnis dennoch ins Protokoll.  
Warum falsch: Protokoll und gespeicherter Beschluss widersprechen sich. Der Hauptweg aus Paketabschnitt 5 liefert damit ein falsches Ergebnis.  
Vorschlag: Nur denselben wiederholten Aufruf als folgenlos behandeln. Bei abweichendem Ergebnis einen Konflikt zurückgeben und den gespeicherten Stand anzeigen.

2. [schwer] Rückgängig erkennt eine spätere Archivierung nicht  
Fundstelle: `supabase/migrations/20261025150500_stufe1_entscheidungen.sql:156`  
Was passiert: Der für Rückgängig verglichene Stand eines Themas enthält `archived` nicht. Wird ein entschiedenes Thema danach archiviert, kann Rückgängig den Beschluss löschen und die Entscheidung wieder öffnen, während das Thema archiviert bleibt.  
Warum falsch: Befund 1 aus Runde 1 ist damit nicht vollständig geschlossen. Der Rückweg soll spätere Änderungen am Original erkennen und keinen widersprüchlichen Stand erzeugen.  
Vorschlag: Archivzustand in den Vergleich aufnehmen und bei einer Änderung einen Konflikt melden.

3. [mittel] Korb ordnet inzwischen erledigte Einträge zu  
Fundstelle: `supabase/migrations/20261025163000_stufe1_korrekturen.sql:348`  
Was passiert: Die neue Transaktion sperrt den Eintrag, prüft aber nur seine Kennung und die fehlende Zuordnung. Auch ein inzwischen archiviertes Thema oder ein verworfener Kandidat kann noch einem Vorhaben zugeordnet werden und einen Verlaufseintrag erzeugen.  
Warum falsch: Paketabschnitt 4 beschränkt den Korb auf offene Themen und neue Kandidaten. Die Transaktion schließt den Teilfehler aus Runde 1, schützt aber nicht gegen diesen veralteten Zustand.  
Vorschlag: Status und Archivzustand unter derselben Sperre prüfen; bei Abweichung mit Konflikt abbrechen.

4. [mittel] Die Check-in-Karte fehlt, während weiter Taler vergeben werden  
Fundstelle: `site/assets/core.js:205`  
Was passiert: Bei `GF_SPIEL=false` ersetzt ein Toast die bisherige Check-in-Karte. Der weiterhin aufgerufene Serverpfad vergibt beim ersten Check-in Taler und prüft Spielziele und Abzeichen.  
Warum falsch: Paketabschnitt 7.2 verlangt eine verbleibende Check-in-Karte ohne Taler-Anzeige und eine ausgeschaltete Spielschicht. Die Bedienprobe prüft nur einen bereits gesetzten Tagesschlüssel.  
Vorschlag: Den Gruß als Karte ohne Spielangaben darstellen und den Check-in ohne Punktevergabe von der Spielschicht trennen.

## Empfehlungen

1. Für die ersten drei Befunde gezielte Proben mit zwei verschiedenen Ergebnissen, Archivierung vor Rückgängig und einem veralteten Korbeintrag ergänzen.
2. Den Check-in bei frischem Tagesschlüssel mit `GF_SPIEL=false` prüfen.

Die übrigen Korrekturen aus Runde 1 sind im Code nachvollziehbar. Datenbankwirkung und Liveoberfläche habe ich wegen des untersagten Netzaufrufs nicht selbst geprüft; ich habe keine Dateien geändert und keine Tests mit Schreibwirkung gestartet.

