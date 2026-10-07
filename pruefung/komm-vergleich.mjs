/* Vergleich der Rechenlogik mit dem Python-Referenz-Rechner für alle fünf Festivals des Regelwerks (V32, Review 32a).
   Aufruf: node pruefung/komm-vergleich.mjs   (braucht python3; rechnet in einem temporären Ordner, ändert im Repo nichts)
   Im Referenzmodus muss jede Zeile jeder CSV übereinstimmen: Kennung, Termine, Rollen, Stunden, Status, Hinweis. */
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
const require = createRequire(import.meta.url);
const K = require('../site/assets/komm-logik.js');
const quelle = new URL('../docs/referenz/postingplan/', import.meta.url).pathname;
const rw = JSON.parse(fs.readFileSync(path.join(quelle, 'habitat-postingplan-regelwerk.json'), 'utf8'));
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'komm-vergleich-'));
for (const d of ['habitat-postingplan-regelwerk.json', 'referenz-rechner.py']) fs.copyFileSync(path.join(quelle, d), path.join(tmp, d));
function csv(t) { const rows = []; let i = 0, f = '', row = [], q = false; while (i < t.length) { const c = t[i]; if (q) { if (c === '"') { if (t[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; } else if (c === '"') q = true; else if (c === ',') { row.push(f); f = ''; } else if (c === '\n') { row.push(f); rows.push(row); row = []; f = ''; } else if (c !== '\r') f += c; i++; } if (f || row.length) { row.push(f); rows.push(row); } const h = rows.shift(); return rows.map(r => Object.fromEntries(h.map((k, j) => [k, r[j]]))); }
const saison = K.plus(rw.festivals_2027.map(f => f.F).sort()[0], -21);
let fehler = 0;
for (const f of rw.festivals_2027) {
  execFileSync('python3', ['referenz-rechner.py', f.id], { cwd: tmp, stdio: 'ignore' });
  const py = csv(fs.readFileSync(path.join(tmp, `beispiel-${f.id}-2027-aufgaben.csv`), 'utf8'));
  const fest = { fid: f.id, name: f.name, ausgabe: f.ausgabe, V: f.V, F: f.F, Z: f.Z, merkmale: f.merkmale };
  const erg = K.berechne(rw, fest, '2026-10-05', { saison_start: saison, referenz: true });
  const js = K.csvZeilen(fest, erg, '2026-10-05');
  const ref = new Map(py.map(r => [r.aufgabe_id, r]));
  const abw = [];
  if (js.length !== py.length) abw.push(`Zeilen ${js.length} statt ${py.length}`);
  for (const r of js) {
    const p = ref.get(r.aufgabe_id); if (!p) { abw.push(r.aufgabe_id + ' fehlt'); continue; }
    for (const k of ['eltern_id', 'regel_id', 'titel', 'schritt', 'phase', 'rolle', 'werkzeug', 'start', 'faellig', 'kanal', 'klasse', 'bezug', 'abstand', 'veroeffentlichung', 'status', 'hinweis'])
      if (String(r[k] ?? '') !== String(p[k] ?? '')) abw.push(`${r.aufgabe_id} ${k}`);
    if ((r.stunden === '' ? '' : Number(r.stunden)) !== (p.stunden === '' ? '' : Number(p.stunden))) abw.push(`${r.aufgabe_id} stunden`);
  }
  console.log(`${abw.length ? 'FEHLT' : 'ok   '}  ${f.name}: ${erg.pubs.length} Veröffentlichungen, ${erg.wochen.length} Wochenaufgaben, ${erg.pubs.reduce((s, p) => s + p.schritte.length, 0)} Schritte, ${js.length} Zeilen, ${abw.length} Abweichungen${abw.length ? ' (' + abw.slice(0, 3).join('; ') + ')' : ''}`);
  fehler += abw.length;
}
fs.rmSync(tmp, { recursive: true, force: true });
process.exit(fehler ? 1 : 0);
