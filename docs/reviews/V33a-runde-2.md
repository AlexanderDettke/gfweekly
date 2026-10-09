Geprüft: V33a, Commit 7c288d7, 4 Dateien (site/arbeiten.html, supabase/functions/arbeiten/index.ts, pruefung/arbeiten-probe-ui.mjs, docs/reviews/V33a-antwort-1.md).

Prüfer: Claude Code. `node pruefung/arbeiten-probe-ui.mjs` mit Browser: 211 Prüfungen bestanden (davon 19 am echten Funktionscode mit Datenbankdouble). Bildschirmproben 390 und 1440, hell und dunkel, angesehen.

Befunde aus Runde 1:
- 1 (Abgabe atomar): behoben. `abgeben` mit `.is(abgegeben_<W>, null)`, `abgabe_zurueck` mit `.is(abgegeben_<A>, null)`, leeres Ergebnis 409 bzw. `schon: true`. VERSION 2. Live erst nach Deploy (offen, siehe unten).
- 2 (gemeinsame Auswertung): behoben, „Wo es bei beiden hakt“ vor „Größte Unterschiede“, Schwelle 3,5, höchstens sechs, keine Werte je Person zusammengefasst.
- 3 (Hub am Handy): behoben, zugeklappte Zeile etwa 66 px bei 390 px, Filter „noch offen“, nur eine Bearbeitung offen.
- 4 (Skalenenden): behoben.
- 5 (inaktive Fragen): behoben.
- 6 (Datensatz „Das Hohe Haus“): offen, gehört zu V33b.

Neue Befunde: keine der Schwere schwer oder mittel.
1. [leicht] Unter „Beispiel dazu (optional)“ bleibt bei zugeklapptem Beispiel ein Leerraum von etwa 40 px (summary mit Mindesthöhe, Text oben). Kosmetik, nicht behoben.

Offen außerhalb des Codes: Deploy der Edge Function `arbeiten` v2 (Repo-Datei = Stand dieses Commits), danach Wirkungsprobe V33b.
