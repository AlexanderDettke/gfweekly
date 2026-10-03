# Antwort auf V31a, Runde 2 (Commit 7b7240c)

Alle sieben Befunde am Code bestätigt und übernommen. Belege: Migration `supabase/migrations/20261003173522_hh_vorhaben_v31a_runde2.sql`
(angewendet am 03.10.2026, `hh_vertraulich` geprüft: „Das Passwort ist 1234“, „Lea ist krank“ und eine IBAN treffen, „Telefonat mit Victor: Auszahlung ab Monat 1 schriftlich bis Montag“ nicht),
Edge Function v38 neu deployt, `pruefung/vorhaben-probe.mjs` 81 von 81 gegen das echte Backend; danach in der Datenbank 0 Probe-Ticker, 0 Probe-Einwürfe.

| Nr. | Schwere | Entscheidung | Beleg |
|---|---|---|---|
| 1 | schwer | übernommen | `v_anwenden` vergleicht nur noch Ampel und Vertretung, nicht den Status. Ein Wechsel auf erledigt bewegt keinen Ball. |
| 2 | schwer | übernommen | `hh_einwurf_apply` prüft jeden Text, der in den Verlauf geht, mit `hh_vertraulich`, gleich ob bearbeitet, aus dem Vorschlag oder der Text des Einwurfs (auch beim Zielwechsel und ohne Vorschlag). Probe: „Zielwechsel mit vertraulichem Einwurftext braucht Bearbeitung“. |
| 3 | mittel | übernommen | Beim Zielwechsel gilt die vorgeschlagene Benachrichtigung nicht; nur eine ausdrücklich gewählte „sofort“ legt einen Ticker an, nach der Textprüfung. Probe: „Zielwechsel: nur der Verlauf, kein Ticker“ und „ausdrücklich sofort legt den Ticker an“. Technikstand angepasst. |
| 4 | mittel | übernommen | Edge Function prüft `bearbeitet.naechster_schritt`, die Datenbankfunktion prüft den angewendeten nächsten Schritt und den Tickertext. Probe: „bearbeiteter nächster Schritt mit Kennwort wird abgelehnt“. |
| 5 | mittel | übernommen | Jeder Vorschlag aus `einwurf_add` und `einwurf_vorschlag` trägt `revision` (UUID). `hh_einwurf_apply` vergleicht sie unter der Zeilensperre und antwortet bei Abweichung 409. Vorschläge des Abgleichs ohne Revision bleiben anwendbar. Probe: „veraltete Revision des Vorschlags“, „neuer Vorschlag hat eine neue Revision“. |
| 6 | mittel | übernommen | `hh_verlauf_status` lässt Einträge mit Tag „Vorschlag: …“ nur einmal entscheiden (danach 409). Nicht in der Probe, weil Vorschläge nur der Abgleich schreibt (per SQL, nicht über die Edge Function); geprüft am Code der Funktion. |
| 7 | mittel | übernommen | Einwürfe der Probe beginnen mit „V31-Probe:“; `probe_aufraeumen` löscht sie zu Beginn und am Ende (`nur_einwuerfe`), dazu Ticker aus Einwürfen an den Testvorhaben. Der erste KI-Einwurf bleibt ohne vorgegebenes Vorhaben, sonst wäre die Erkennung nicht geprüft; ordnet die KI ihn einem echten Vorhaben zu, wird er trotzdem gelöscht und nichts angewendet. |

Empfehlungen: 1 übernommen (`expect_ball` je Eintrag Pflicht, Probe „ohne gesehenen Ball wird je Zeile abgelehnt“). 2 übernommen (Zielwechsel mit „sofort“ und mit vertraulichem Text, neue Revision). 3 übernommen.
