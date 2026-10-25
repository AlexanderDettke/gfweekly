# Antwort auf Runde 3 · Stufe 1 (25.10.2026)

Geprüfter Stand: `2a44724`. Sechs mittlere Befunde, alle bestätigt und behoben (vierte Migration `20261025193000_stufe1_runde3.sql`,
geprobt und live angewendet; Code; Proben). Drei Runden sind das Maximum: diese Korrekturen sind getestet, aber nicht erneut unabhängig
geprüft. Das steht so in `docs/STAND-STUFE-1.md` und im Technikstand; Alexander entscheidet mit diesem Wissen über den Push.

| Nr | Schwere | Befund | Antwort |
| --- | --- | --- | --- |
| 1 | mittel | Bearbeiten nur des Vorschlags nicht geschützt; veralteter Dialog ändert entschiedene Zeile | Bestätigt. `sammeln` setzt einen Vorschlag nur noch in eine leere Zeile (ein gesetzter bleibt, von Hand oder vom Lauf). `entscheidung_set` gilt nur für offen oder vertagt (sonst 409) und nur vom gesehenen Stand aus (`expect_updated_at`, Update mit Stand-Bedingung; sonst 409, die Seite lädt neu). Live-Probe: nur Vorschlag setzen, danach sammeln, Vorschlag bleibt. Bedienprobe: veralteter Dialog zeigt den Konflikt, nichts überschrieben. |
| 2 | mittel | Verwerfen und Archivieren treffen zugeordnete Einträge | Bestätigt. Beide Updates verlangen `vorhaben_id` null, das Thema zusätzlich eine offene Spalte; sonst 409. Live-Probe: zugeordnetes Thema archivieren → 409. |
| 3 | mittel | Abfragefehler der Herkunft erscheinen als fehlende Quelle | Bestätigt. `herkunft` wirft bei jedem Abfragefehler; die Liste antwortet dann mit 500 und die Seite zeigt den Ladefehler (`gfLadefehler`) statt einer falschen Herkunft. |
| 4 | mittel | Gelungenes Schreiben kann als „Nicht gespeichert“ erscheinen | Bestätigt. Nach einer gelungenen Datenbankaktion liefert die Aktion die Antwort der Funktion; scheitert nur das Nachladen, kommt 200 mit `nachladen_fehler` statt 500. |
| 5 | mittel | Spielschicht schreibt serverseitig weiter Punkte | Bestätigt. `GF_SPIEL_SERVER=false` in `index.ts`: `award` und `grantBadge` schreiben nichts mehr (keine Taler, Serien, Ziele, Abzeichen bei Besprechung, Beschluss, Ritual, Meilenstein, Check-in). Tabellen bleiben; Rückweg ist die Konstante zusammen mit `GF_SPIEL`. Live-Probe nach dem Deploy: Besprechung beenden, Zahl der Punkteereignisse unverändert. |
| 6 | mittel | Abschlussstand überzeichnet die Live-Prüfung | Bestätigt. `docs/STAND-STUFE-1.md` nennt jetzt den belegten Live-Stand (`81cb76e`, 44 Proben, danach 47 gegen die korrigierten Datenbankfunktionen) und weist den Endstand erst nach erneutem Deploy, Dateivergleich und `ping` als veröffentlicht aus. |

Empfehlungen: 1 und 3 in Proben aufgenommen (Vorschlag allein, veralteter Dialog, zugeordneter Korbeintrag, Punktestand vor und nach dem Beenden); Fehler beim Herkunftsabruf und beim Nachladen sind serverseitige Pfade ohne Mock, dafür steht die Codeprüfung; 4 erledigt.
