# Stufe 2 · Läufe: erledigen statt vorschlagen (Wortlaut zum Einsetzen)

Stand 25.10.2026. Quelle: `docs/PAKET-STUFE-2-EIN-BEHAELTER.md`, Abschnitte 4 und 6. Einsetzen in den Auftrag „GF Weekly · Neuigkeiten
täglich“ (Alex) und spiegelbildlich in Leas Tagesabgleich; das Einspielen macht Cowork nach dem Push, nicht die Terminal-Sitzung.
Die Abschnitte B und E aus `STUFE1-NEUIGKEITEN-ABSCHNITTE.md` bleiben gültig, soweit sie hier nicht ersetzt werden (Regel E2 entfällt:
es gibt keine offenen Themen mehr, Kandidaten bekommen `vorhaben_vorschlag` wie bisher).

Datenmodell (alles angewendet am 25.10.2026): `hh_vorhaben.phase` und `fokus`, `hh_entscheidungen.frist_vorschlag`,
`hh_entscheidung_umhaengen`, `hh_entscheidungen_sammelaktion`, `hh_lauf_rueckgaengig`, `hh_vorschlag_verfall` (pg_cron 04:52 UTC),
`hh_punkt_toggle(p_id, p_erledigt, p_by, p_quelle)`. `hh_vorhaben_verlauf.source_ref` ist eindeutig: jeder Eintrag braucht einen eigenen Wert.

## Einmalig: „Stufe 2 · Themen auflösen“ (erledigt durch die Terminal-Sitzung am 25.10.2026)

Die 53 offenen Themen und 35 offenen Kandidaten sind aufgelöst: 30 Themen zu Punkten (`quelle 'thema:<id>'`, Entscheidung umgehängt),
8 zu Verlaufseinträgen, 10 wiederkehrende zu Verlauf und Archiv (`archiv_grund 'stufe2:ritual'`), 3 überholt, 2 ohne Bezug
(`stufe2:unzugeordnet`); 19 Kandidaten zu Punkten, 12 zu Verlaufseinträgen, 4 archiviert (Vorstandspost, fremd). Neue Vorhaben:
`leas-beteiligung`, `gelaende-goeritz`, `team-2027`. Themen mit Ausgang „Kann warten“ sind als Punkt mit Entscheidung „Nicht jetzt“
bis 23.11.2026 zurückgestellt. Der Auftrag braucht nichts mehr zu tun; `gfweekly_topics` ist Archiv, `board.html?topic=` bleibt lesbar.

## Täglich (ersetzt Regel F des Abgleichs)

**Grundregel: drei Sicherheitsstufen, jede Zeile des Laufs trägt eine.**

- `sicher`: Beleg nennt den Punkt oder das Vorhaben eindeutig (Betreff oder Text enthält den Punkttitel oder den Partnernamen in seiner
  Rolle) **und** die Handlung ist in der Quelle abgeschlossen (gesendete Antwort, Zusage, Zahlung, Termin bestätigt). Der Lauf führt aus.
- `wahrscheinlich`: Bezug eindeutig, Abschluss nicht belegt. Der Lauf schreibt einen Verlaufseintrag mit `status 'vorschlag'`; die Akte
  zeigt ihn mit Übernehmen und Verwerfen; nach 14 Tagen ohne Antwort setzt `hh_vorschlag_verfall` ihn auf `verfallen`.
- `unklar`: nichts schreiben. Der Lauf zählt den Fall in seiner Zusammenfassung („7 Mails ohne eindeutigen Bezug“).

**Deckel.** Höchstens 5 neue Einträge am Tag zur Sichtung (Vorschläge `wahrscheinlich` plus Kandidaten im Korb); was darüber liegt,
bleibt `unklar`. Keine neuen Punkte aus Mails ohne `sicher`. Keine Priorität. Keine Frist ohne Datum in der Quelle, und auch dann nur
als `frist_vorschlag` an der Entscheidung (die Frist selbst setzt eine Person oder der Punkt). Keine neuen Themen (`gfweekly_topics`).

**1. Erledigt-Erkennung.** Für jeden offenen Punkt eines aktiven Vorhabens
(`select p.id, p.titel, p.wer, v.title, v.slug from hh_vorhaben_punkte p join hh_vorhaben v on v.id = p.vorhaben_id where not p.erledigt and v.status = 'aktiv'`)
prüft der Lauf täglich:
(1) gesendete Mails von Alex oder Lea (`in:sent newer_than:2d`), deren Betreff oder Text den Punkt beantwortet;
(2) eingegangene Mails mit Zusage oder Bestätigung;
(3) Verlaufseinträge der letzten zwei Tage (Einwurf, WhatsApp) mit „erledigt“, „gemacht“, „ist raus“, „bezahlt“, „unterschrieben“;
(4) Plattform-Fakten (`hh_feed_*`).
Trifft `sicher` zu, in **einer** Transaktion:

```sql
select public.hh_punkt_toggle('<punkt-id>', true, 'lauf', 'mail:<threadId>:erledigt:<punkt-id>');
insert into public.hh_vorhaben_verlauf (vorhaben_id, punkt_id, art, wer, text, status, created_by, source_ref, source_url, happened_at)
values ('<vorhaben-id>', '<punkt-id>', 'mail', 'Lauf', 'Erledigt (Lauf): <Beleg in einem Satz>', 'bestaetigt', 'lauf',
        'mail:<threadId>:beleg:<punkt-id>', '<Link zur Mail oder null>', '<Zeitpunkt der Quelle>');
```

`art` nach Quelle: `mail`, `whatsapp`, `notiz` (Einwurf), `system` (Plattform-Fakt). Die Entscheidung zum Punkt wird beim nächsten
`entscheidungen_list` hinfällig (bestehende Regel in `hh_entscheidungen_sammeln`). Rückgängig: Alex oder Lea klicken in der Akte am
Lauf-Eintrag „Rückgängig (vom Lauf erledigt)“ (`hh_lauf_rueckgaengig`, 7 Tage); der Lauf nimmt nichts selbst zurück und erledigt einen
Punkt, der schon einmal zurückgenommen wurde (`source_ref 'rueckgaengig:lauf:%'` am Punkt), nicht noch einmal.

**2. Zuordnung und Vorschläge (`wahrscheinlich`).**

```sql
insert into public.hh_vorhaben_verlauf (vorhaben_id, punkt_id, art, wer, text, tag, status, created_by, source_ref, source_url, happened_at)
values ('<vorhaben-id>', '<punkt-id oder null>', 'mail', 'Lauf', '<Was die Quelle sagt, ein bis zwei Sätze>',
        'Vorschlag: Punkt erledigt' /* oder 'Vorschlag: Stand' */, 'vorschlag', 'lauf', 'mail:<threadId>:vorschlag:<punkt-id oder k<n>>', '<Link>', '<Zeitpunkt>');
```

Ein Vorschlag je Punkt und Quelle; ein zweiter Lauf aktualisiert `text`, `happened_at` per `ON CONFLICT (source_ref) DO UPDATE`, statt
eine zweite Zeile zu schreiben. Vorschläge ohne offenen Punkt nur mit `vorhaben_id` und `tag 'Vorschlag: Stand'`.

**3. Kandidaten.** Ein Kandidat ist nur noch ein Vorschlag an ein Vorhaben: `gfweekly_news` mit `kind 'kandidat'`, `status 'neu'` und
`vorhaben_vorschlag`, wenn der Bezug eindeutig ist (Stufe-1-Regel E2). Alex oder Lea ordnen ihn im Korb auf `vorhaben.html` zu; nach
14 Tagen verfällt er (`hh_news_verfall`). Kein Kandidat aus `in:sent` (Regel B2), kein Kandidat, wenn Alex oder Lea schon geantwortet haben (B1).

**4. Fragen formulieren (E1 aus Stufe 1) bleibt**, erweitert: der Vorschlag steht immer in einem Satz mit Betrag, Datum oder Name, wenn die
Quelle einen nennt. Nur Zeilen mit `frage_form = false`; `frage_von` in ('Alex', 'Lea') nie anfassen.

**5. Rückkehr-Brief.** Am Morgen der Rückkehr (Abwesenheit mit `status 'rueckkehr'` oder `bis = heute`): `rueckkehr_lage` lesen und
in höchstens fünf Sätzen nach Phasen zusammenfassen (Launch, Formatpartner, Systembau, Weiteres: was entschieden ist, was sich bewegt hat,
was wartet); `update gfweekly_absences set note_rueckkehr = '<Text>' where id = '<id>' and note_rueckkehr is null`. Einen vorhandenen
Brief nie überschreiben (Alex oder Lea können ihn geändert haben).

**6. Zusammenfassung des Laufs** (Ticker, `kind 'ticker'`, `source 'lauf'`): „Erledigt: n Punkte (sicher), Vorschläge: m, Kandidaten: k,
unklar: u.“ Grundlage der Messung ist `lauf_bilanz` (Klappe „Was der Lauf getan hat“ auf Für dich): erledigt (`erledigt_by 'lauf'`),
Verlauf nach Status, Kandidaten nach Ausgang, Fragen.

**Modell.** Für die Erledigt-Erkennung und die Zuordnung ist das stärkste verfügbare Modell richtig (`claude-opus-5-5`), weil
Fehlentscheidungen Arbeit kosten und die Menge klein ist; Alex stellt es im Cowork-Auftrag selbst ein. Reihenfolge: zuerst diese Regeln
und Schwellen, dann Modell hoch, dann ist der Unterschied in `lauf_bilanz` messbar.
