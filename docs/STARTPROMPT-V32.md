# Startprompt V32 Kommunikation · Stand 05.10.2026

Arbeite im Repository /Users/alexanderdettke/Documents/GitHub/gfweekly auf main als Ausgangspunkt.

Lies zuerst vollständig: docs/PAKET-V32-KOMMUNIKATION.md, docs/TECHNIKSTAND.md (Abschnitte V27, V28 und V31), docs/referenz/postingplan/habitat-postingplan-regelwerk.md. Das JSON im selben Ordner ist maßgeblich zum Rechnen, der Referenz-Rechner zeigt die erwarteten Ergebnisse.

Auftrag: Teilpakete 32a bis 32e in einem Zug, ohne Pause dazwischen, mit der Codex-Prüfschleife aus dem Paket. Die Entscheidungen im Paket sind getroffen; du setzt sie um und stellst sie nicht erneut. Technische, umkehrbare Details entscheidest du selbst.

Bestehendes wiederverwenden: Besetzung `komm` aus `gfweekly_launch_besetzung`, Versandmuster und Idempotenz aus `launch_send`, Protokollmuster aus `gfweekly_saison_log`, den täglichen Tick, die Saisonseite. Keine zweite Besetzungstabelle, keine zweite Asana-Logik.

Was nur Alex tun kann (zum Beispiel Tabelle mit einem Dienstkonto teilen, Secret eintragen), schreibst du als eine Zeile in FRAGEN_FUER_MORGEN.md mit Dauer und genauem Schritt und baust weiter.

Abschlussmeldung im Chat: höchstens zehn Zeilen. Oben, was Alex tun muss und wie lange es dauert. Darunter Live-Adresse, Version, offene Punkte. Alles andere steht im Technikstand.
