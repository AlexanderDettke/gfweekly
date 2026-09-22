/* Pruefsumme ueber alles, was die Abnahme prueft. Der Beleg selbst zaehlt nicht mit.
   Bewusst in Node statt in einer Shell-Pipeline: Dateinamen duerfen Zeilenumbrueche und
   Sonderzeichen enthalten, und ein Fehler mittendrin darf nicht als leerer Erfolg enden
   (Befunde 4 und 6 der Pruefungen von 4cdd506 und 12d9458). */
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const WURZEL = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const AUS = 'pruefung/letzte-abnahme.json';

function git(...args) {
  return execFileSync('git', args, { cwd: WURZEL, maxBuffer: 64 * 1024 * 1024 });
}
try { git('rev-parse', '--git-dir'); }
catch (e) { console.error('kein Git-Repo unter ' + WURZEL); process.exit(1); }

let roh;
try { roh = git('ls-files', '-z', '--cached', '--others', '--exclude-standard', 'site', 'supabase', 'pruefung'); }
catch (e) { console.error('git ls-files fehlgeschlagen: ' + e.message); process.exit(1); }

const dateien = roh.toString('utf8').split('\0').filter(Boolean).filter(f => f !== AUS).sort();
if (!dateien.length) { console.error('keine Dateien gefunden, das kann nicht stimmen'); process.exit(1); }

const gesamt = createHash('sha256');
for (const f of dateien) {
  const voll = path.join(WURZEL, f);
  let inhalt;
  try {
    if (!statSync(voll).isFile()) continue;   // Verzeichnis oder Sonderdatei
    inhalt = readFileSync(voll);
  } catch (e) {
    console.error(`Datei ${f} nicht lesbar: ${e.message}`);
    process.exit(1);                          // ein Loch in der Pruefsumme ist schlimmer als kein Ergebnis
  }
  gesamt.update(Buffer.from(f, 'utf8'));
  gesamt.update(Buffer.from([0]));
  gesamt.update(createHash('sha256').update(inhalt).digest());
}
console.log(gesamt.digest('hex'));
