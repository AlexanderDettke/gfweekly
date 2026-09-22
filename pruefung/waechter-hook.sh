#!/bin/sh
# Stop-Hook: bevor Claude eine Antwort abschliesst, laufen die statischen Pruefungen.
# Sie laufen immer, nicht nur bei schmutzigem Arbeitsbaum: ein Commit darf die Kontrolle
# nicht abschalten (Befund 7 der Pruefung von 4cdd506).
set -u
WURZEL="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")/.." && pwd)}"
cd "$WURZEL" || { echo "Wächter: Projektverzeichnis $WURZEL nicht erreichbar." >&2; exit 2; }
if ! git rev-parse --git-dir >/dev/null 2>&1; then
  echo "Wächter: kein Git-Repo unter $WURZEL, die Frischeprüfung ist nicht möglich." >&2
  exit 2
fi
AUSGABE=$(node pruefung/waechter.mjs 2>&1) || {
  printf 'Der Wächter meldet Befunde. Beheben, bevor die Arbeit als fertig gilt:\n\n%s\n' "$AUSGABE" >&2
  exit 2
}
exit 0
