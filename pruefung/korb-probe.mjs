/* Trockenlauf des Übergabekorbs: rechnet die Matrix über echte Zeilen, ohne die Edge Function aufzurufen.
   Eingabe ist das JSON-Ergebnis der Sammelabfrage (siehe docs/TECHNIKSTAND.md, Abschnitt V24a).
   Aufruf: node pruefung/korb-probe.mjs <datei-mit-json> */
import { score, vertretungFuer, absEnde, absStufe } from './matrix-probe.mjs';
import fs from 'node:fs';
let roh = fs.readFileSync(process.argv[2], 'utf8');
try { const h = JSON.parse(roh); roh = typeof h === 'string' ? h : (h.result ?? roh); } catch (e) {
  if (roh.includes('\\"')) roh = JSON.parse('"' + roh.replace(/\n/g, '\\n').replace(/^"|"$/g, '') + '"');
}
const a = roh.indexOf('[{'), b = roh.lastIndexOf('}]');
const daten = JSON.parse(roh.slice(a, b + 2));
const korb = daten[0].korb || [];
const absence = { id:'probe', person:'Lea', von:'2026-10-05', bis:'2026-10-25', art:'geplant', kontakt:'wochenbrief', test:true };
absence.stufe = absStufe(absence);
const dep = [
  { person:'Lea', bereich:'gf', vertretung:'Alex', active:true },
  { person:'Lea', bereich:'*',  vertretung:'Alex', active:true },
];
const zeilen = korb.map(x => {
  const bew = score(x, absence);
  return { ...bew, kind:x.kind, title:(x.title||'').slice(0,58), frist:x.frist,
           vertretung: vertretungFuer(bew, x, absence, dep) };
});
const zaehl = (feld) => zeilen.reduce((m, r) => (m[r[feld]] = (m[r[feld]]||0)+1, m), {});
console.log(`Abwesenheit Lea ${absence.von} bis ${absence.bis} · Stufe ${absence.stufe} · ${zeilen.length} Zeilen im Korb\n`);
console.log('Art       ', JSON.stringify(zaehl('kind')));
console.log('Quadrant  ', JSON.stringify(zaehl('quadrant')));
console.log('Cluster   ', JSON.stringify(zaehl('cluster')));
console.log('Ampel     ', JSON.stringify(zaehl('ampel')));
const luecken = zeilen.filter(r => r.luecke).length;
console.log(`Lücken     ${luecken} von ${zeilen.length} · Übernahmefähigkeit ${Math.round((zeilen.length-luecken)/zeilen.length*100)} Prozent`);
console.log('\n20 Zeilen, nach Punktzahl sortiert:\n');
const sortiert = zeilen.sort((x,y) => y.score - x.score || (x.frist||'9999').localeCompare(y.frist||'9999'));
for (const r of sortiert.slice(0, 20)) {
  console.log(`[${r.quadrant.padEnd(10)}] ${r.cluster} ${String(r.ampel).padEnd(6)} Z${r.z}F${r.f}U${r.g === undefined ? '' : r.u}G${r.g} ${String(r.frist||'ohne Frist').padEnd(10)} ${r.vertretung ? '→'+r.vertretung : '      '} ${r.kind.padEnd(11)} ${r.title}`);
  console.log(`              ${r.begruendung}`);
}
