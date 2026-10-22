# Paket · Kompass sichtbar und „Deine 5 Minuten heute“ · Stand 22.10.2026

## Auftrag (wörtlich)

Alex am 22.10.2026: „sieht soweit gut aus. beim login steht noch hohes haus. Das muss auch in Kompass geändert werden. Also überall wo hohes haus steht heißt es kompass und was super wäre, wenn dieser panik modus mit so und so viel wartet noch auf dich etwas abgemildert wird und eher positiv formuliert wird. in 5 Minuten die wichtigsten Themen abräumen. Mach mir für beides jeweils drei Vorschläge“

Gewählt: Umbenennung **C · Ganz durch, auch technisch**, Ton **A · 5-Minuten-Runde oben**. Auf den Vorschlag, C in drei Schritte zu teilen (Paket 1 sichtbar plus 5-Minuten-Runde, Paket 2 technisch mit Übergangsbrücken, Schritt 3 Brücken entfernen), antwortete Alex „ja“. Dieses Paket ist Paket 1.

## Umfang

- Kompass-Commit `bbca119` (Branch `paket/kompass`, Cowork 21.10.2026, Inhalt in `docs/PAKET-KOMPASS.md`) auf den aktuellen main übertragen: Seitentitel, Login, Seitenleiste, Manifest, Kompassrose als Bildmarke und Favicon, Texte in Mails, Asana-Notizen und Edge Functions. Asset-Version einheitlich `?v=37`.
- Übrige sichtbare „Hohes Haus“-Texte in Prüfskripten und Testdaten auf Kompass. Kommentare mit „vormals Das Hohe Haus“ und die Historie im README bleiben als Herkunftsangabe; angewendete Migrationen bleiben unverändert.
- Nicht in diesem Paket (Paket 2): technische Namen (Edge Function `gfweekly`, Tabellen `hh_*`/`gfweekly_*`, `created_by='hohes-haus'`, Speicherschlüssel `gf_*`).
- „Deine 5 Minuten heute“ oben auf Für dich, ruhigerer Ton (siehe Annahmen), neutrale Zähler in der Seitenleiste.

## Annahmen (ohne Rückfrage getroffen)

- Die drei Dinge des Tages kommen aus dem, was schon bei der Person liegt: Vorhaben mit Ball bei ihr (Frist vorbei zuerst, dann heute, dann bald), Entscheidungen im Pförtner an sie oder die GF, Kandidaten „hoch“ der letzten 7 Tage. Die Auswahl steht je Person und Tag im Browser und bleibt den Tag über gleich; „abgeräumt“ heißt, der Eintrag steht nicht mehr an (Ball weitergegeben oder Vorhaben erledigt, entschieden, Kandidat übernommen oder verworfen). Nach drei abgeräumten gibt es „Noch drei?“.
- Ton: „wartet auf dich“ → „für dich bereit“, „überfällig“ auf Für dich → „Frist war am …“ (Warnton statt Alarm), „Nichts wartet auf dich“ → „Alles entschieden, nichts offen. ✓“, „Kein Ball bei dir“ → „… alles im Fluss“, „Zieldaten überfällig“ → „Zieldaten vorbei“ (ohne Warnfarbe), Rückkehrseite „Für dich bereit“. Die Vorhabenseite behält „überfällig“ als Arbeitskennzeichen.
- Zähler in der Seitenleiste (Vorhaben, Themen, Neuigkeiten) neutral grau statt Warnfarbe.
- Die Quell-SVGs der Kompassrose liegen unter `docs/marke/` statt im ausgelieferten Ordner; ausgeliefert werden nur die PNGs. Grund: zwei Grautöne der großen SVG fallen unter die Türkis-Regel des Farbscans, die Gestaltung bleibt unverändert.
- `pruefung/abnahme.sh` war im Kompass-Commit nicht mehr ausführbar; das Ausführrecht ist wiederhergestellt.
