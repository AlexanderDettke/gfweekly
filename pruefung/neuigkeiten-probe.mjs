/* Wirkungsprobe · Neuigkeiten aufräumen (22.10.2026) gegen das echte Backend, ohne Abfangen.
   Aufruf:  GF_PW=<passwort> node pruefung/neuigkeiten-probe.mjs
   Legt über die angemeldete Supabase-CLI zwei Testeinträge an (source_ref probe:nw:1 archiviert, probe:nw:2 offen), prüft
   news_list, die Archivsuche und „Zurück in den Korb“ und den Verfall in einer zurückgerollten Transaktion, und räumt die
   Testeinträge am Ende (auch nach einem Abbruch) wieder ab. Echte Neuigkeiten werden nur gelesen. */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
const FN = process.env.GF_FN || 'https://bnfmupnmqyrcltrphfak.supabase.co/functions/v1/gfweekly';
const PW = process.env.GF_PW || '';
if (!PW) { console.error('GF_PW fehlt (Passwort des Hohen Hauses in der Umgebung).'); process.exit(2); }
let fehler = 0, n = 0;
const ok = (bed, text, extra) => { n++; if (bed) console.log('  ✓ ' + text); else { fehler++; console.log('  ✕ ' + text + (extra !== undefined ? '  → ' + JSON.stringify(extra).slice(0, 300) : '')); } };
async function api(action, payload = {}, erwartet = 200) {
  const res = await fetch(FN, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, password: PW, payload }) });
  let d = {}; try { d = await res.json(); } catch (e) {}
  if (res.status !== erwartet) throw new Error(`${action}: HTTP ${res.status} statt ${erwartet}: ${d.error || ''}`);
  return d;
}
const sql = (q) => JSON.parse(execFileSync('npx', ['--yes', 'supabase', 'db', 'query', '--linked', '--project-ref', 'bnfmupnmqyrcltrphfak', q], { stdio: ['ignore', 'pipe', 'ignore'] }).toString()).rows;
const aufraeumen = () => sql("delete from public.gfweekly_news where source_ref in ('probe:nw:1','probe:nw:2','probe:nw:3','probe:nw:4','probe:nw:5')");

try {
  aufraeumen();
  sql(`insert into public.gfweekly_news (kind, title, body, source, relevance, status, source_ref, archiv_grund, archiviert_at, happened_at, created_at)
       values ('kandidat', 'Probe Neuigkeiten Archiv Quokka', 'Testeintrag der Wirkungsprobe', 'manuell', 'mittel', 'archiviert', 'probe:nw:1', 'aufraeumen-20261022', now(), now() - interval '40 days', now() - interval '40 days'),
              ('kandidat', 'Probe Neuigkeiten offen Quokka', 'Testeintrag der Wirkungsprobe', 'manuell', 'mittel', 'neu', 'probe:nw:2', null, null, now() - interval '20 days', now() - interval '20 days')`);
  console.log('\n== news_list ==');
  const alle = (await api('news_list', { limit: 2000 })).items;
  ok(!alle.some(x => x.status === 'archiviert'), 'Standard: kein archivierter Eintrag in news_list', alle.filter(x => x.status === 'archiviert').length);
  ok(alle.some(x => x.source_ref === 'probe:nw:2') && !alle.some(x => x.source_ref === 'probe:nw:1'), 'offener Testeintrag da, archivierter nicht');
  const kand = (await api('news_list', { kinds: ['kandidat'], statuses: ['neu'], limit: 500 })).items;
  ok(!kand.some(x => x.source_ref === 'probe:nw:1'), 'Zähler für das Abzeichen (kandidat, neu) ohne Archiviertes');
  const mitArchiv = (await api('news_list', { statuses: ['archiviert'], limit: 50 })).items;
  ok(mitArchiv.some(x => x.source_ref === 'probe:nw:1'), 'Status archiviert ausdrücklich im Filter liefert ihn');
  console.log('\n== Archivsuche ==');
  await api('news_list', { archiv: true, q: 'Q' }, 400).then(d => ok(/zwei Zeichen/.test(d.error), 'zu kurzer Suchbegriff gibt 400'));
  const such = await api('news_list', { archiv: true, q: 'Quokka' });
  ok(such.items.length === 1 && such.items[0].source_ref === 'probe:nw:1', 'Suche findet nur den archivierten Testeintrag', such.items.map(x => x.source_ref));
  const komisch = await api('news_list', { archiv: true, q: 'Quokka,(x)*%' });
  ok(Array.isArray(komisch.items), 'Sonderzeichen im Suchbegriff brechen die Suche nicht', komisch);
  await api('news_list', { archiv: true, q: '__' }, 400).then(d => ok(/zwei Zeichen/.test(d.error), '„__“ ist kein Suchmuster (400 statt Treffer für alles)'));
  console.log('\n== Zurück in den Korb ==');
  const id = such.items[0].id;
  const r = await api('news_update', { id, status: 'neu', decided_by: 'Alex' });
  ok(r.item.status === 'neu' && r.item.archiv_grund === null && r.item.archiviert_at === null, 'Zurück in den Korb hebt Grund und Zeitpunkt auf', r.item);
  const zurueck = sql(`begin; select public.hh_news_verfall(14); select status, aktiv_ab is not null as aktiv from public.gfweekly_news where id = '${id}'; rollback;`);
  ok(zurueck[0]?.status === 'neu' && zurueck[0]?.aktiv === true, 'zurückgeholter 40 Tage alter Eintrag übersteht den nächsten Verfall (aktiv_ab)', zurueck);
  const h = await api('news_update', { id, status: 'archiviert', decided_by: 'Alex' });
  ok(h.item.status === 'archiviert' && h.item.archiv_grund === 'hand' && !!h.item.archiviert_at, 'Von Hand archivieren trägt den Grund „hand“', h.item);
  console.log('\n== Verfall (zurückgerollt) ==');
  const v = sql("begin; select public.hh_news_verfall(14) r; rollback;");
  const nachher = sql("select status from public.gfweekly_news where source_ref = 'probe:nw:2'");
  ok(nachher[0]?.status === 'neu', 'Probelauf des Verfalls ändert nichts (Transaktion zurückgerollt)', v);
  const w = sql("begin; select public.hh_news_verfall(14); select status, archiv_grund from public.gfweekly_news where source_ref = 'probe:nw:2'; rollback;");
  ok(w[0]?.status === 'archiviert' && w[0]?.archiv_grund === 'verfall-14', 'Verfall nimmt den 20 Tage alten offenen Kandidaten (Grund verfall-14)', w);
  const g = sql("begin; select public.hh_news_verfall(14, 'aufraeumen-20261022-verfall'); select archiv_grund from public.gfweekly_news where source_ref = 'probe:nw:2'; rollback;");
  ok(g[0]?.archiv_grund === 'aufraeumen-20261022-verfall', 'erster Verfall beim Aufräumen trägt den eigenen Grund', g);
  console.log('\n== Aufräum-Migration (zurückgerollt) ==');
  /* Die ganze Migration in einer Transaktion mit drei Testzeilen, danach rollback: alt und unberührt wird archiviert,
     alt aber gestern zugeteilt bleibt, frisch bleibt. */
  const datei = fs.readdirSync(new URL('../supabase/migrations/', import.meta.url)).filter(f => /_hh_news_aufraeumen\.sql$/.test(f)).sort().pop();
  const mig = fs.readFileSync(new URL('../supabase/migrations/' + datei, import.meta.url), 'utf8');
  const testzeilen = `insert into public.gfweekly_news (kind, title, source, relevance, status, source_ref, happened_at, created_at, gate, gate_by, gate_at) values
    ('kandidat','Probe alt','manuell','mittel','neu','probe:nw:3', now()-interval '30 days', now()-interval '30 days', null, null, null),
    ('kandidat','Probe alt, gestern zugeteilt','manuell','mittel','neu','probe:nw:4', now()-interval '30 days', now()-interval '30 days', 'lea', 'Alex', now()-interval '1 day'),
    ('kandidat','Probe frisch','manuell','mittel','neu','probe:nw:5', now()-interval '2 days', now()-interval '2 days', null, null, null);`;
  const m = sql(`begin; ${testzeilen} ${mig} select source_ref, status, archiv_grund from public.gfweekly_news where source_ref in ('probe:nw:3','probe:nw:4','probe:nw:5') order by source_ref; rollback;`);
  const st = Object.fromEntries(m.map(r => [r.source_ref, r.archiv_grund || r.status]));
  ok(st['probe:nw:3'] === 'aufraeumen-20261022' && st['probe:nw:4'] === 'neu' && st['probe:nw:5'] === 'neu', `${datei}: alt archiviert, kürzlich zugeteilt und frisch bleiben`, st);
  ok(sql("select count(*)::int n from public.gfweekly_news where source_ref in ('probe:nw:3','probe:nw:4','probe:nw:5')")[0].n === 0 && sql("select count(*)::int n from public.gfweekly_news where status='archiviert' and coalesce(source_ref,'') not like 'probe:nw:%'")[0].n === 0, 'nach dem Rollback nichts archiviert, keine Testzeilen');
} catch (e) { ok(false, 'Probe abgebrochen', e.message); }
finally {
  try { aufraeumen(); console.log('  · Testeinträge abgeräumt'); } catch (e) { ok(false, 'Testeinträge nicht abgeräumt (source_ref probe:nw:1 und probe:nw:2)'); }
}
console.log(`\n${n - fehler} von ${n} bestanden`);
process.exit(fehler ? 1 : 0);
