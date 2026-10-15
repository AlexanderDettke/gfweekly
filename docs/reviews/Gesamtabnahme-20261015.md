# Technische Gesamtabnahme vom 15.10.2026

Der vollständige Lauf von `pruefung/abnahme.sh` wurde erfolgreich beendet. Auch der anschließende Wächter einschließlich Frischeprüfung meldet keine Befunde. Der neue Prüfbeleg wurde erst nach erfolgreichem Durchlauf geschrieben.

Prüfzeitpunkt UTC: `2026-10-15T04:54:46Z`.

Stand SHA256: `bc715a738bbbdda838fce2d1a707b74d49b7e41949962eeef3dc378cac17dc2e`.

## Wiedergefundene Farbvorlage

Originalarchiv: `/Users/alexanderdettke/Downloads/wilde-habitate-farbpatch.zip`, darin `neu/tokens/colors.css`, Stand 20.09.2026. Paketbeschreibung und Dateikopf stimmen mit der zuvor dokumentierten Quelle überein. Der Vergleich bestätigt alle 57 Farbwerte für dunkel und 46 für hell ohne Abweichung.

Die unveränderte Referenz liegt mit Herkunft und Prüfsummen unter `pruefung/referenz/farbvorlage/`. `tokens.py` verwendet sie standardmäßig, ein expliziter Pfad oder `HH_FARBVORLAGE` bleibt möglich. Der Vergleich läuft jetzt auch in GitHub Actions. Die Referenz stammt aus dem Originalarchiv und wurde nicht aus der geprüften Oberfläche erzeugt.

## Ergebnisse

| Prüfung | Ergebnis |
| --- | --- |
| Originale Farbvorlage | 103 Farbwerte, keine Abweichung |
| Farbscan | Keine Funde |
| Kontrast der Farbwerte | Keine Unterschreitung |
| Entscheidungsmatrix | Alle Proben bestanden |
| Bildschirmansichten | 92 Bilder, keine neuen Meldungen |
| Vorhandene Bedienproben | Vollständig bestanden |
| Organisationsentscheidungen | 44 Oberflächenprüfungen bestanden |
| Organisation in lokaler Datenbank | Originalmigration, Korrekturmigration, Bestandsübernahme, Freigabe, Rückmeldung, Rücknahme und Rechte bestanden |
| Kommunikation | 70 Rechenprüfungen und 56 Bedienprüfungen bestanden |
| Referenzvergleich Kommunikation | Alle fünf Festivals ohne Abweichungen |
| Kommunikation in lokaler Datenbank | 31 Prüfungen bestanden |
| Kommunikationsaktionen mit nachgebauten externen Diensten | 113 Prüfungen bestanden |
| Wegweiser „So arbeiten wir“ | Zusätzlich 415 Prüfungen bestanden |
| Wächter einschließlich Frische | Keine Befunde |

Laufprotokolle: `Gesamtabnahme-20261015.log` und `Wegweiser-Abnahme-20261015.log`. Der versionierte Prüfbeleg steht in `pruefung/letzte-abnahme.json`.

## Aussagegrenzen

Dies ist die technische Gesamtabnahme des vorgesehenen Prüflaufs. Die bereits dokumentierten 137 Kontrastausnahmen sowie sonstige bekannte Mängel bleiben sichtbar und wurden nicht als behoben ausgegeben. Die Prüfungen mit nachgebauten Schnittstellen und lokalen Datenbanken belegen keine neue fachliche Annahme oder Wirkung in externen Produktivsystemen. Es wurden keine Produktionsdaten verändert. Die vorherige Freigabelogik bleibt mit ihrem gesonderten produktiven Prüfbeleg dokumentiert.
