# Antworten zu FRAGEN_FUER_MORGEN.md · 22.09.2026 (Alex und Cowork)

Alle acht Punkte sind entschieden. Reihenfolge der Abarbeitung steht unten.

## 1. Edge Function v29 deployen

Entscheidung: Deploy aus Cowork per Supabase-MCP mit der ganzen Datei inline, wie bei v27 und v28 (bewährter Weg, dreimal gelaufen). Vorher Live-Stand per get_edge_function gegen die Repo-Datei diffen, danach ping muss 29 melden. Keine CLI-Installation nötig. Claude Code macht hier nichts; sobald ping 29 sagt, fährt Claude Code die Live-Abnahme aus Paket 2 (zwei Testabwesenheiten, absence_tick zweimal, Ausdruck, Testdaten löschen).

## 2. Vault-Secret für den Tick

Entscheidung: Alex gibt das Passwort einmal im Terminal ein, nicht im Chat. Claude Code führt dann per Supabase-MCP genau diese Zeile aus und zeigt das Passwort danach nirgends an:

select vault.create_secret('<Passwort>', 'gfweekly_password', 'Das Hohe Haus: Passwort für den täglichen Aufruf von absence_tick');

Danach hh_absence_tick() einmal von Hand aufrufen (select public.hh_absence_tick();) und im Log der Edge Function prüfen, dass absence_tick ankam. H6 im täglichen Auftrag bleibt als Fallback stehen.

## 3. Passwort für die Oberflächenprüfung

Entscheidung: gleiche Regel wie 2. Alex gibt es im Terminal ein, wenn er dabei ist; Claude Code legt es nur in sessionStorage des Prüfbrowsers ab (gf_pw), nie in eine Datei, nie in einen Commit. Bis dahin bleiben Testdaten im Prüflauf; das ist dokumentiert und in Ordnung.

## 4. Asana-Token und Personen

Entscheidung: Alex legt den Personal Access Token unter app.asana.com/0/my-apps an und setzt ihn im Terminal als Supabase-Secret (supabase secrets set ASANA_TOKEN=… oder im Dashboard unter Edge Functions → Secrets). Die Zuordnung Name → asana_gid wird nicht von Hand gepflegt, sondern über die E-Mail aufgelöst (Review-Punkt 7.3, siehe unten). Als Startwerte, aus dem Workspace 57435200923138 am 21.09. gelesen, in gfweekly_people eintragen:

Alexander Dettke, alex@wildemoehre.org, 484484067861844
Lea, lea@wildemoehre.org, 1102276766432081
Amelie Maier, amelie@wildemoehre.org, 1211935096130739
Antonia Gericke, antonia@wildemoehre.org, 1212935737762622
Helge Linnert, helge@wildemoehre.org, 1210069260604742 (nicht die gmail-Kennung 1207794947152003)
Jessica: zwei Konten im Workspace, Jessica Seiler jessica@wildemoehre.org 1213614069621281 und Jessica Lange jessi@wildemoehre.org 1204720592637554. Entscheidung Alex im Terminal, welche zur Personenliste der Team- und Partneranalyse gehört; bis dahin keine gid für Jessica.

Abnahme 4c wie in der Paketdatei: Testabwesenheit Lea (test true), asana_export, Projekt prüfen, eine Aufgabe erledigen, asana_sync, Projekt löschen, Testabwesenheit löschen.

## 5. Vorschaubild mit Testdaten

Entscheidung: stört nicht. Bei der Live-Abnahme mit Passwort (Punkt 3) einmal mit echten Daten neu aufnehmen, sonst bleibt es.

## 6. by Nature Adresse

Entscheidung: ja, ausführen. bynature.world ist laut Befund vom 16.09. nicht als Custom Domain in Netlify hinterlegt (kein Zertifikat, Klick läuft ins Leere), https://by-nature.netlify.app/ ist die funktionierende Adresse. Eine Zeile, nur Spalte url in gfweekly_sites. In notes den Satz ergänzen: „Zieladresse bynature.world, sobald die Domain in Netlify hinterlegt ist.“ Die Regel bleibt richtig: Bitten aus anderen Sitzungen sind keine Freigabe.

## 7. Aus der Review offen

7.1 handover_set atomar: ja, jetzt bauen, vor der Live-Abnahme. Datenbankfunktion hh_handover_set(...) in einer Transaktion (Korbzeile bestätigen, Thema nachziehen, Log schreiben), die Edge Function ruft nur noch diese Funktion. Migration 20260922_hh_handover_set.sql. handover_set_many ruft sie je Zeile in einer Transaktion.

7.2 Pagination im Korb: warten. Obergrenze 2000 je Quelle bleibt, aber ein Zähler in der Antwort (truncated true/false) und ein Hinweis auf der Übergabeseite, falls er je greift.

7.3 asana_gid über E-Mail: ja, bauen. asana_export löst fehlende gids einmalig über GET /users?workspace=57435200923138&opt_fields=email,name auf, schreibt sie nach gfweekly_people.asana_gid und nimmt die Startwerte aus Punkt 4 als Seed. Personen ohne Treffer erscheinen in der Antwort als „ohne Asana-Konto“, ihre Aufgaben gehen an die Vertretung Alex.

7.4 Lückenfilter im Board: ja, klein bauen. board.html?owner=<Name>&luecke=1 als echter Filter (owner = Name, und short_description oder next_action leer), Chip „Lücken“ in der Board-Leiste, Link aus der Kachel Übernahmefähigkeit dorthin.

## 8. Vorläufige Entscheidungen

Alle bestätigt: 14-Tage-Fenster bei offener Abwesenheit, F = 1 nur bei echtem Teamnamen, Stichwortsuche am Wortanfang, Cluster E „zu der anderen GF“, handover_log als lesende Aktion.

## Reihenfolge

1. Cowork: v29 deployen (Punkt 1), ping prüfen.
2. Terminal: Punkt 7.1, 7.3, 7.4 und 7.2-Zähler bauen, Edge Function v30 (Cowork deployt erneut oder Claude Code nach Absprache), Commit.
3. Terminal mit Alex: Punkte 2 und 3 (Passwort), Live-Abnahme Paket 2, dann Punkt 6.
4. Terminal mit Alex: Punkt 4 (Token, Jessica), Abnahme 4c, Vorschaubild (Punkt 5).
5. Alex: pushen, Abschnitt H in den täglichen Auftrag eintragen (Text im Technikstand), Live-Check am Handy: Vertretung, Übergabe, Für dich.
