# Paket · Hier lohnt sich ein Blick und Mehrfachauswahl · Entwurf 22.10.2026

Status: Vorschlag, noch nicht gebaut. Reihenfolge: nach Paket „Kompass und 5-Minuten-Runde“.

## Auftrag (wörtlich)

Alex am 22.10.2026: „und wir brauchen eine Funktion, die sagt, hier lohnt sich ein Blick. Für Themen, die wir vielleicht übersehen. Bitte mach mir dafür ebenfalls drei Vorschläge. Das sollte man aber auch direkt abhaken oder wegklicken können. Sowieso sollte man viel mehr bearbeiten, verschieben, erledigt oder in bearbeitung setzen können. Kannst du das als Paket überlegen und die verbesserung vorschlagen?“

Gewählt: **B · KI-Blick im täglichen Lauf** und **3 · Mehrfachauswahl zum Aufräumen**.

## Ausgangslage (Datenbank, 22.10.2026)

- Board: 53 offene Themen (45 „Zu besprechen“, 5 „In Klärung“, 3 „Entschieden“), davon 49 seit über 3 Wochen unbewegt, 34 ohne nächsten Schritt, 4 mit abgelaufener Pförtner-Frist. Dazu 36 erledigte, nicht archivierte.
- Vorhaben: 3 seit 14 Tagen still, 2 mit Frist in den nächsten 10 Tagen und seit 7 Tagen ohne Bewegung.
- Die Edge Function ruft Claude schon heute für Einwurf und Aufräumen-Vorschläge (`GFWEEKLY_EINWURF_MODEL`, Standard `claude-sonnet-5`).

## Teil 1 · Hier lohnt sich ein Blick (KI)

Vorschlag zur Umsetzung, abweichend vom Wortlaut „im täglichen Lauf“: der Blick läuft **in der eigenen Edge Function**, angestoßen per pg_cron morgens (wie `hh_absence_tick`), nicht im externen Cowork-Auftrag. Grund: der Cowork-Prompt liegt außerhalb des Repos und lässt sich hier weder prüfen noch versionieren; so bleibt alles prüfbar, und es gibt genau einen KI-Aufruf am Tag.

1. **Daten:** neue Tabelle `hh_blick` (id, tag, person, ref_kind thema|vorhaben|kandidat|partner, ref_id, titel, grund, quellen jsonb, status neu|erledigt|spaeter|passt, bis, entschieden_by/at). Unique (tag, ref_kind, ref_id).
2. **Lauf `blick_lauf`:** sammelt die Kandidaten nach festen Vorfiltern (still, Frist nah, kein nächster Schritt, Frist vorbei, unbeantwortete Mails im Verlauf), lässt Claude höchstens drei je Person auswählen und mit einem Satz begründen, je Hinweis mit Quelle (Verlaufseintrag, Mail, Thema). Was „Passt so“ bekam, ist 30 Tage gesperrt; „Später“ 7 Tage. Ohne Antwort der KI fällt der Lauf auf die Vorfilter-Reihenfolge zurück und sagt das.
3. **Oberfläche:** Block „Hier lohnt sich ein Blick“ auf Für dich unter der 5-Minuten-Runde, je Karte Grund, Quelle, Link und drei Knöpfe: **Erledigt** (Hinweis abgehakt; bei Vorhaben und Themen optional gleich den Status setzen), **Später**, **Passt so**. Rückgängig 10 Sekunden.
4. **Kosten und Grenzen:** ein Aufruf am Tag, geschätzt wenige Cent; keine vertraulichen Inhalte über den bestehenden Filter hinaus (`vhVertraulich`). Die KI schlägt nur vor, nichts wird von selbst geändert.

## Teil 2 · Mehrfachauswahl zum Aufräumen

1. **Wo:** Board (Themen), Vorhaben-Liste, Sichtungskorb und Archivtreffer der Neuigkeiten, Blick-Karten.
2. **Wie:** Knopf „Auswählen“ schaltet Haken an jeder Zeile ein; unten erscheint eine Leiste „n ausgewählt“ mit **Erledigt · In Bearbeitung · Verschieben · Weitergeben · Archivieren**. Am Handy dieselbe Leiste unten, Haken mit großem Ziel.
3. **Gemeinsame Bedeutung:**
   - Themen: In Bearbeitung = Spalte „In Klärung“, Erledigt = „Erledigt“, Archivieren = archived.
   - Vorhaben: In Bearbeitung = aktiv, Erledigt = Abschluss wie bisher (ohne Haken für Punkte und Themen), Archivieren = archiviert.
   - Kandidaten: Erledigt = übernommen nur einzeln (braucht ein Ziel), in der Auswahl Verwerfen oder Archivieren.
   - Verschieben = neue Frist (morgen, nächste Woche, Datum), Weitergeben = Ball bzw. Pförtner an Alex, Lea, GF oder Team.
4. **Backend:** je Bereich eine Sammelaktion in einer Transaktion mit dem gesehenen Stand je Zeile (`expect`), Antwort je Zeile ok oder Grund; Rückgängig für die ganze Auswahl.
5. **Einzeln weiter möglich:** die bestehenden Knöpfe bleiben; die Auswahl ist der schnelle Weg für viele auf einmal (etwa die 49 stillen Themen).

## Prüfung (wie bei den letzten Paketen)

Wirkungsprobe gegen das echte Backend mit Testdaten und Aufräumen, KI-Lauf in einer Probe mit festen Eingaben, Bedienproben, Schirme bei 390 und 1440 px, Codex-Review bis drei Runden, dann Push.
