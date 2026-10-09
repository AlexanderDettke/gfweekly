# Paket V33 · So arbeiten wir · Stand 09.10.2026 (Cowork, nachts)

Anlass: Alex und Lea wollen die Strukturen und Abläufe finden, die zu ihnen beiden passen. Vorher wird nichts Neues gebaut.
Zuerst wird der Ist-Zustand festgehalten (wie arbeitet jede Person heute, mit welchen Systemen damals und heute), beide
beantworten getrennt dieselbe Umfrage, und erst danach wird gemeinsam eingeordnet: behalten, anpassen, umbauen, weglassen.
Dieses Paket liefert dafür die Seite im Hohen Haus, ab morgen nutzbar. Lösungsentwürfe für das spätere Modul sind
bewusst nicht Teil der Seite (nur ein Link auf das Konzeptdokument).

Die Entscheidungen sind getroffen (Alex, 09.10.2026): Seite im Hohen Haus; Ist-Aufnahme, Umfrage und Systeme als erste
Fassung; keine Lösungsfunktionen; Info an Alex und Lea, sobald es live ist. Technische, umkehrbare Details entscheidet die
Terminal-Sitzung selbst.

## Was aus Cowork schon da ist (nicht neu bauen)

| Teil | Stand |
|---|---|
| Migrationen `20261009031412_hh_so_arbeiten_wir.sql`, `20261009031450_hh_so_arbeiten_wir_wert.sql` | live angewendet (Supabase-MCP), Dateien im Repo mit Fernhistorie-Kennung |
| Tabellen `gfweekly_sa_ist`, `gfweekly_sa_systeme`, `gfweekly_sa_hub_stand`, `gfweekly_sa_fragen` (24 Fragen), `gfweekly_sa_runden` (Runde 1), `gfweekly_sa_antworten`, `gfweekly_sa_log`; Lesefunktion `hh_sa_werkzeuge()` (security definer, nur service_role) | live; RLS an, keine Policies, anon und authenticated ohne Rechte |
| Edge Function `arbeiten` (`supabase/functions/arbeiten/index.ts`, v1, verify_jwt aus, Passwort wie gfweekly) | live deployt (Supabase-MCP), `ping` meldet `version: 1`; Repo-Datei = deployter Inhalt |
| Seite `site/arbeiten.html` (Tabs Start, Ist-Aufnahme, Umfrage, Systeme; Präfix `.sa-`) | im Repo, noch nicht live (wartet auf Push) |
| `site/assets/core.js`: Menüpunkt „So arbeiten wir“ (Gruppe Arbeiten, Schlüssel `arbeiten`, Icon `zwei`) | im Repo |
| Assets `?v=33` in allen 25 Seiten | im Repo |
| Wirkungsprobe aus Cowork (pg_net mit Vault-Secret): `lage` als Alex und Lea, `ist_save`, `antwort_set` (gültig und ungültig), `ist_delete` fremd (404 wie gewollt) | bestanden; Testreste siehe unten |

Regeln der Funktion: Steckbriefe gehören der Person, die andere sieht sie erst nach Freigabe (`freigegeben`). Umfrage: die
Antworten der anderen Person werden erst geliefert, wenn beide die Runde abgegeben haben; nach der eigenen Abgabe sind die
Antworten fest; zurücknehmen nur, solange die andere Person noch nicht abgegeben hat; neue Runde nur, wenn die laufende
von beiden abgegeben ist. Das Haus hat keine Konten, `who` ist die Person aus der Kopfzeile.

## Aufgaben der Terminal-Sitzung (V33a bis V33d)

### V33a · Seite prüfen und feinschleifen

- `site/arbeiten.html` gegen die Regeln des Hauses prüfen: nur Tokens aus `styles.css`, Zustand immer Symbol plus Wort,
  echte Knöpfe mit Beschriftung, Fokus sichtbar, 390 und 1440 px, dunkel und hell, keine Gedankenstriche in
  Oberflächentexten, Leer-, Fehler- und Ladezustände. Design wie die übrigen Seiten (Habitat-Tycoon-Designsystem).
- Bekannte Stellen, die genau anzusehen sind: Chip-Reihen (`gfChips`) in Steckbrief, Umfrage und Systemen (Autosave über
  `change` auf dem versteckten Eingabefeld); gesperrte Umfrage nach Abgabe (Felder und Chips deaktiviert); Auswertung
  nur, wenn `umfrage.beide`; Hub-Liste mit Filter und Suche bei 93 Einträgen am Handy.
- Startseite „Für dich“ bleibt unverändert. Kein weiterer Eingriff in `gfweekly` (Edge Function) nötig.

### V33b · Wirkungsprobe gegen das echte Backend, mit Aufräumen

- Ablauf als Alex und als Lea: Steckbrief anlegen, ändern, freigeben, als andere Person sehen, löschen; Umfrage
  beantworten (Skala, kann nicht, Zahl, Wahl, Text, Beispiel), abgeben, zurücknehmen, beide abgeben, Auswertung,
  neue Runde; Hub-Einordnung setzen. Alle Testdaten restlos entfernen (Runde 1 muss danach wieder ohne Antworten und
  ohne Abgaben sein, `gfweekly_sa_runden` nur Runde 1).
- Testreste aus Cowork entfernen: in `gfweekly_sa_antworten` die Zeile Runde 1, Alex, Frage 1 (leer gesetzt) und in
  `gfweekly_sa_log` die Einträge zu „Probe aus dem Test“. Der Steckbrief „Probe aus dem Test“ wurde über die Funktion
  gelöscht; prüfen, dass `gfweekly_sa_ist` leer ist.

### V33c · Dokumentation

- `docs/TECHNIKSTAND.md`: Abschnitt „V33 So arbeiten wir“ (Tabellen, Funktion, Aktionen, Regeln, Wirkungsprobe,
  Live-Stand). `README.md` um V33 ergänzen. `docs/ARBEITSPAKETE.md`: Eintrag WP-V33 mit Stand.
- `FRAGEN_FUER_MORGEN.md` nur, wenn etwas offen bleibt, das nur Alex tun kann.

### V33d · Veröffentlichen und prüfen

- Commit auf `main` (vorher `git status` und `git log`, Parallelarbeit möglich), Push, Netlify baut aus `main`.
- Live prüfen: `https://hohes-haus.netlify.app/arbeiten.html` lädt, Menüpunkt da, `lage` für beide Personen, ein
  Steckbrief am Handy anlegen und wieder löschen.
- Die Info an Alex und Lea verschickt ein geplanter Cowork-Auftrag, sobald die Seite live ist (stündliche Prüfung).
  Nichts zusätzlich verschicken.

## Rollen und Prüfschleife

- Ausführer: Codex CLI (Sandbox `workspace-write`, im Repo). Prüfer: Claude Code nach `docs/reviews/V33-pruefauftrag.md`,
  je Teilpaket am genauen Commit, höchstens drei Runden; jedes Verwerfen eines Befunds wird belegt.
- Wenn Claude die Token ausgehen, läuft es ohne Claude weiter: Codex schließt V33a bis V33d allein ab und prüft sich
  selbst mit demselben Prüfauftrag. Wenn Codex die Token ausgehen und Claude hat noch welche, übernimmt Claude Code
  die Umsetzung selbst. Beides steht im Startprompt (`docs/STARTPROMPT-V33.md`).

## Abschlussmeldung

Höchstens zehn Zeilen: oben, was Alex tun muss (wenn etwas), darunter Live-Adresse, Funktionsversion, offene Punkte.
Alles andere steht im Technikstand.
