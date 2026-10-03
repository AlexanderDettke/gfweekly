# Antwort auf V31e, Runde 2 (Commit 85e3a84)

Belege: Migration `supabase/migrations/20261003185231_hh_vorhaben_v31e_stand.sql` (angewendet am 03.10.2026), v38 neu deployt nach Diff, Wirkungsprobe 91 von 91,
dazu eine Live-Prüfung an einem per SQL angelegten Stand-Vorschlag am Testvorhaben:

```
veralteter gesehener Stand: 409 Inzwischen geändert (stand), bitte neu laden
übernehmen: 200 neu geprüft
zweites Mal: 409 Dieser Vorschlag ist schon entschieden (bestaetigt)
vertraulich: 400 Der Stand enthält möglicherweise vertrauliche Angaben. Bitte bearbeiten.
Punkt: neu geprüft | E1: bestaetigt | E2: vorschlag | Verlauf zum Stand: Punkt Stand-Probe: neu geprüft
```

| Nr. | Schwere | Entscheidung | Beleg |
|---|---|---|---|
| 1 | mittel | übernommen | „Stand am Punkt übernehmen …“ gibt es nur, wenn der Text einen neuen Stand nach „jetzt so steht:“ trägt; sonst „Nur in den Verlauf übernehmen (Stand von Hand)“. Das Formular zeigt „Bisher: …“ neben dem Vorschlag (Empfehlung 1). Ein leerer Stand wird abgelehnt. |
| 2 | mittel | übernommen | Neue Aktion `vorschlag_stand` ruft `hh_vorschlag_stand`: Vorschlag sperren und prüfen, gesehenen Stand vergleichen, Stand schreiben (mit Verlauf), Vorschlag bestätigen, alles in einer Transaktion. Live belegt (oben); Bedienung: „Speichern übernimmt Stand und Vorschlag in einem Aufruf“. |
| 3 | mittel | übernommen als offen | Richtig: die Nacharbeiten zu 2, 3 und 5 aus Runde 1 sind im Text vorbereitet, nicht im eingerichteten Auftrag aktiv. So steht es jetzt im Technikstand und als Aufgabe 3 für Alex in `FRAGEN_FUER_MORGEN.md` (Commit 92dbac9). Den Cowork-Auftrag kann ich aus dieser Sitzung nicht ändern. |
| 4 | mittel | übernommen | Quelle C schließt auch `to:alex+xceed@wildemoehre.org` aus; XCeed-Berichte nur über C2. |
| 5 | mittel | erledigt | README, Arbeitsstand und Fragen sind in 92dbac9 auf V31 nachgezogen, mit der Umstellung des Auftrags als offenem Punkt. |

Empfehlungen: 1 übernommen. 2 teilweise: die Zeilensperre von `hh_vorhaben_quelle` ist im Code, ein Live-Test mit zwei gleichzeitigen Läufen ist nicht gemacht (beide Läufe sind Cowork-Aufträge). 3 übernommen im Technikstand.
