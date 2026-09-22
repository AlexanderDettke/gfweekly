#!/bin/sh
# Stop-Hook: bevor Claude eine Antwort abschließt, laufen die statischen Prüfungen,
# sofern überhaupt etwas geändert wurde. Bei Befunden bricht der Hook mit 2 ab,
# und die Meldung geht zurück an Claude statt an den Nutzer.
cd "$(dirname "$0")/.." || exit 0
[ -z "$(git status --porcelain 2>/dev/null)" ] && exit 0
AUSGABE=$(node pruefung/waechter.mjs 2>&1) || {
  printf 'Der Wächter meldet Befunde. Beheben, bevor die Arbeit als fertig gilt:\n\n%s\n' "$AUSGABE" >&2
  exit 2
}
exit 0
