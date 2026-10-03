# Fragen für morgen · Stand 03.10.2026 (V31 Vorhaben)

## V31: was von euch kommen muss

1. **Push und Live-Check (Alex).** Branch `paket/v31-vorhaben` pushen und nach `main` bringen, dann am Handy `hohes-haus.netlify.app/vorhaben.html` öffnen: Woche, Akte, Einwurf mit dem Mikrofon der Tastatur. Edge Function v38 und alle Migrationen sind schon live; bis zum Push zeigt die alte Seite einfach keine Vorhaben.
2. **Leas Urlaub eintragen (Lea, spätestens 13.10.).** Über „Übergeben“ → Urlaub (14. bis 25.10.) oder `vertretung.html`. Erst dann zeigen Woche und Lagezeile das Band „Lea abwesend“, und der Übergabekorb nimmt ihre Vorhaben auf. Heute ist keine Abwesenheit eingetragen.
3. **Abgleich-Auftrag in Cowork ersetzen (Alex) und Leas Lauf einrichten (Lea).** Der Text in `docs/ABGLEICH-VORHABEN.md` ist nach der Review nachgezogen: Quelle C ohne die Einwurf-Adresse (sonst landet eine Einwurf-Mail doppelt in der Akte), neue Quelle C2 für XCeed-Berichte an `alex+xceed@wildemoehre.org`, Abgleichstand über `select hh_vorhaben_quelle(…)` statt UPDATE. Der eingerichtete Auftrag trägt noch den alten Text. Er läuft (erster Lauf mit Wirkung am 03.10. um 20:18 Uhr).
4. **Zwei Vorschläge des Abgleichs warten in der XCeed-Akte** (Stand von „Bürgschaftstext auf Deutsch“ und „Auszahlung ab Monat 1 schriftlich“). „Stand am Punkt übernehmen …“ öffnet den Punkt mit dem vorgeschlagenen Stand.
5. **Der Einwurf aus dem Durchspiel ist nicht in XCeed eingetragen.** „Telefonat mit Victor: Auszahlung ab Monat 1 schriftlich bis Montag“ wurde erkannt (XCeed, Punkt „Auszahlung ab Monat 1 schriftlich“), übernommen habe ich ihn am Testvorhaben, damit keine unbestätigte Zusage in der echten Akte steht. Wenn das so stimmt: einmal selbst einwerfen.

## V31: zu entscheiden

6. **Doppeltes auf Für dich.** Ich habe nichts entfernt: „Deine Entscheidung“ zeigt Themen und Kandidaten, die Akte zählt verknüpfte Themen nur. Sollen Themen, die an einem Vorhaben hängen, aus „Deine Entscheidung“ verschwinden? Dann wäre die Startseite kürzer, aber Entscheidungen stünden nur noch in der Akte.
7. **„Erfährt es im Morgenbericht“.** Die Wahl im Einwurf heißt jetzt „in Für dich“ oder „sofort im Laufband“, weil der Morgenbericht nicht angebunden ist. Den Morgenbericht schreibt der tägliche Cowork-Auftrag; der liest den Verlauf der Vorhaben noch nicht. Bis dahin sieht die andere Person den Eintrag unter „Seit du zuletzt da warst“. Soll der tägliche Auftrag einen Absatz „Vorhaben seit gestern“ bekommen?
8. **Stand-Vorschläge des Abgleichs strukturiert schreiben?** Heute steht der neue Stand im Text nach „jetzt so steht:“, die Akte liest ihn dort heraus und lässt ihn prüfen. Sauberer wäre ein eigenes Feld; das hieße, den Abgleich-Text und die Tabelle zu ändern.
9. **Stufen für Verträge** (Angebot, Verhandlung, Rechtsprüfung … im Prototyp der XCeed-Akte) sind weggelassen, wie das Paket es für V31 erlaubt.
10. **XCeed-Schlüssel.** Für die Partner Tickets API vergibt XCeed einen API-Schlüssel (partners@xceed.me); drei Fragen an XCeed stehen in `docs/XCEED-SCHNITTSTELLE.md`.

11. **Abschluss der Übergabe im Dialog.** Der Urlaubsdialog zeigt die Vorhaben des Korbs und verlinkt den Rest (Themen, Kandidaten, Termine) auf die Übergabeseite. Soll der Dialog am Ende alle noch offenen Korbzeilen zeigen?
12. **Ansicht „Vor dem 14.10. entscheiden“.** Codex schlägt einen Filter vor, der offene Korbzeilen und Vorhaben mit Frist im Urlaub zusammenführt. Ich habe ihn nicht gebaut, weil der Übergabekorb genau diese Fälle sammelt. Lohnt ein zweiter Ort?

## V31: gut zu wissen

- Die KI im Einwurf ist Claude Sonnet 5 über `ANTHROPIC_API_KEY` (gesetzt); ein anderes Modell geht über das Secret `GFWEEKLY_EINWURF_MODEL`.
- Testbestand: die Wirkungsprobe löscht am Ende alles, was sie angelegt hat (Stand nach dem letzten Lauf: kein Testvorhaben, keine Testabwesenheit). In der XCeed-Akte stehen acht verworfene Einträge aus dem Durchspiel (Haken und Ball hin und zurück), sie sind in der Akte nicht sichtbar; `ball_seit` ist zurückgesetzt.
- Das Passwort der Edge Function ist in dieser Sitzung nicht gefallen; die Proben holen es aus dem Vault in eine Umgebungsvariable.

---

# Frühere Fragen · Stand 22.09.2026

Die Fragen vom 21.09. sind beantwortet (`ANTWORTEN_ZU_FRAGEN.md`) und abgearbeitet. Was erledigt ist, steht
durchgestrichen und mit einem Satz, wie es ausgegangen ist. Was noch von dir kommen muss, steht unten.

## Noch offen

**34 Befunde aus der vollständigen Prüfung**, elf davon schwer, stehen in `docs/BEKANNTE-MAENGEL.md`. Auf
deine Entscheidung vom 22.09.2026 bleiben sie vorerst offen. Das ist der größte offene Punkt, nicht die
Kleinigkeiten weiter unten.

**Testprojekt in Asana löschen.** `app.asana.com/0/1218725644227780` ist archiviert, aber noch da. Der
Anschluss darf Projekte nicht löschen, das geht nur von Hand.

**Abschnitt H in den täglichen Auftrag eintragen.** Der fertige Textbaustein steht in `docs/TECHNIKSTAND.md`
(H1 bis H8). Ohne ihn erkennt der tägliche Lauf keine neuen Abwesenheiten aus dem Kalender.

**Passwort der Edge Function drehen (Empfehlung).** Es ist im Verlauf dieser Sitzung gefallen. Wenn du es
änderst, müssen **beide** Stellen denselben Wert tragen: das Supabase-Secret `GFWEEKLY_PASSWORD` und das
Vault-Secret `gfweekly_password`, sonst schweigt der tägliche Tick mit 401.

**Pagination im Korb (bewusst zurückgestellt).** Der Korb lädt höchstens 2000 Zeilen je Quelle. Bei 87 Themen
reicht das weit; greift die Grenze doch einmal, sagt die Übergabeseite es seit V24d von selbst
(`korb_truncated`). Erst dann lohnt der Umbau.

## Erledigt am 22.09.2026

~~**1. Edge Function v29 deployen.**~~ Deploy aus der Supabase-CLI, inzwischen v32. `ping` meldet 32.

~~**2. Vault-Secret für den täglichen Tick.**~~ `gfweekly_password` liegt im Vault, `hh_absence_tick()` kommt
mit 200 durch, der Cron-Lauf steht auf täglich 04:40 UTC.

~~**3. Passwort für die Oberflächenprüfung.**~~ Einmal im Prüfbrowser verwendet, nur in `sessionStorage`,
in keiner Datei und in keinem Commit.

~~**4. Asana-Token und Personen.**~~ `ASANA_TOKEN` steht als Secret, die Kennungen kommen über die E-Mail.
Die Frage nach den zwei Konten einer dritten Person ist hinfällig: die Vertretungslinie führt nur Alex und Lea,
und die Aufgabe geht an die Person, die in der Korbzeile als Vertretung steht. Wird dort von Hand ein anderer
Name eingetragen, prüft der Export das nicht nach; er ordnet diesen Namen genau zu oder gibt die Aufgabe an Alex.
Aus der Abnahme 4c ist ein Durchgang gelaufen, nicht die volle Prüfung der Paketdatei.

~~**5. Vorschaubild mit Testdaten.**~~ Neu aufgenommen mit echten Daten.

~~**6. by Nature Adresse.**~~ `gfweekly_sites` zeigt auf `https://by-nature.netlify.app/`, mit dem Hinweis in
`notes`, dass `bynature.world` das Ziel bleibt, sobald die Domain in Netlify hinterlegt ist. Die Regel dazu
bleibt richtig: eine Bitte aus einer anderen Sitzung ist keine Freigabe, deine war es.

~~**7. Aus der Review offen.**~~ 7.1 atomare Übergabe (`hh_handover_set`), 7.3 Kennungen über die E-Mail,
7.4 Lückenfilter im Board sind gebaut; 7.2 ist als Zähler gebaut und als Umbau zurückgestellt (siehe oben).

~~**8. Vorläufige Entscheidungen.**~~ Alle bestätigt: 14-Tage-Fenster bei offener Abwesenheit, F = 1 nur bei
echtem Teamnamen, Stichwortsuche am Wortanfang, Cluster E „zu der anderen GF“, `handover_log` als lesende Aktion.
