/* Holt die reinen Funktionen der Matrix aus supabase/functions/gfweekly/index.ts, transpiliert sie und
   stellt sie node zur Verfügung. So lässt sich die Bewertung prüfen, ohne die Edge Function aufzurufen.
   Braucht typescript im Suchpfad: NODE_PATH=<ordner>/node_modules node pruefung/matrix-test.mjs */
import { createRequire } from 'node:module';
const require = createRequire(process.env.TS_BASIS || import.meta.url);
const ts = require('typescript');
import fs from 'node:fs';
import path from 'node:path';

const hier = path.dirname(new URL(import.meta.url).pathname);
const quelle = fs.readFileSync(path.join(hier, '..', 'supabase', 'functions', 'gfweekly', 'index.ts'), 'utf8');
const von = quelle.indexOf('/* ===== v29 · V24a');
const bis = quelle.indexOf('async function handoverItems');
if (von < 0 || bis < 0) { console.error('Marker nicht gefunden'); process.exit(2); }
const rein = quelle.slice(von, bis);
const whoNorm = quelle.match(/function whoNorm[^\n]*\n/)[0];
const addDays = quelle.match(/function addDays[^\n]*\n/)[0];
const code = ts.transpileModule(whoNorm + addDays + rein +
  '\nglobalThis.__pruef = { score, absStufe, absEnde, geldMax, vertretungFuer, absGate, tageBis };\n',
  { compilerOptions:{ target:ts.ScriptTarget.ES2022, module:ts.ModuleKind.None } }).outputText;
new Function(code)();
export const { score, absStufe, absEnde, geldMax, vertretungFuer, absGate, tageBis } = globalThis.__pruef;
