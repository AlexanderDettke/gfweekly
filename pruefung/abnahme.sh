#!/bin/zsh
# Abnahme des Hohen Hauses: Tokens, Farben, Kontrast, Matrix, Schirme, Bedienung. Bricht beim ersten Fehler ab.
# Aufruf aus dem Repo:  PLAYWRIGHT_MODUL=<pfad>/node_modules/playwright/index.mjs TS_BASIS=file://<pfad>/x.mjs ./pruefung/abnahme.sh [zielordner]
set -e
set -o pipefail
cd "$(dirname "$0")/.."
ZIEL=${1:-/tmp/hh-schirme}

echo "== Tokens gegen die Quelle =="
python3 pruefung/tokens.py

echo "\n== Farbscan (Türkis in site/assets) =="
FUNDE=$(python3 pruefung/farbscan.py site/assets)
if [ -n "$FUNDE" ]; then echo "$FUNDE"; echo "Farbscan: Funde vorhanden"; exit 1; fi
echo "null Funde"

echo "\n== Kontrast beider Themen =="
# Keine Pipeline: sie wuerde den Fehlerstatus von kontrast.py verschlucken.
if ! KONTRAST=$(python3 pruefung/kontrast.py); then
  echo "$KONTRAST" | grep FEHLT || true
  echo "Kontrast: Paare unter der Schwelle"; exit 1
fi
echo "$KONTRAST" | tail -1

echo "\n== Matrix (reine Funktion, ohne Edge Function) =="
node pruefung/matrix-test.mjs | tail -1

echo "\n== Schirme (16 Seiten, 1440 und 390, dunkel und hell) =="
node pruefung/schirme.mjs "$ZIEL"

echo "\n== Bedienung (Vertretung: Übergabe, Wache, Anlegen, Rückkehr) =="
node pruefung/bedienung.mjs | tail -1

echo "\n== Wächter (statische Prüfungen) =="
WAECHTER_OHNE_FRISCHE=1 node pruefung/waechter.mjs

echo "\nAlle Prüfungen bestanden."
echo "Hinweis: Schirme und Bedienung sind Oberflächentests, sie fangen die Edge Function ab."
echo "Sie belegen Aufbau, Kontrast, Überlauf und Bedienwege, nicht die Wirkung in der Datenbank."
# Beleg schreiben, damit „fertig“ nicht ohne frische Prüfung behauptet werden kann.
# Der Beleg haengt am Inhalt der geprueften Dateien, nicht am Commit: sonst waere er nach dem
# naechsten Commit veraltet, obwohl sich nichts Geprueftes geaendert hat.
STAND=$(pruefung/stand.sh)
cat > pruefung/letzte-abnahme.json <<JSON
{
  "stand": "$STAND",
  "commit": "$(git rev-parse HEAD)",
  "datum": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "laeufe": ["tokens", "farbscan", "kontrast", "matrix", "schirme (Oberfläche)", "bedienung (Oberfläche)", "waechter"],
  "ungeprueft": "Wirkung in der Datenbank, Asana-Lebenszyklus, Nebenläufigkeit, verborgene Oberflächenteile"
}
JSON
echo "Beleg geschrieben: pruefung/letzte-abnahme.json"

echo "\n== Wächter, vollständig (mit Frischeprüfung) =="
node pruefung/waechter.mjs
