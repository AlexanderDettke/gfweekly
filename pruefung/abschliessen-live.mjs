/* Live-Bedienprobe · Vorhaben abschließen (21.10.2026): die Seite aus site/ lokal ausgeliefert, die Edge Function echt
   (kein Abfangen), Handybreite 390 px. Prüft den Ablauf aus docs/PAKET-VORHABEN-ABSCHLIESSEN.md, Abschnitt „Prüfen vor Push“.
   Aufruf:  GF_PW=<passwort> PLAYWRIGHT_MODUL=<pfad>/playwright/index.mjs node pruefung/abschliessen-live.mjs xceed|test
   xceed: Filter Erledigt, Wieder öffnen (aktiv, überfällig), Abschließen ohne Themen-Haken (11 Themen bleiben),
          Rückgängig stellt exakt her, am Ende wieder erledigt.
   test:  braucht test-abschluss aus pruefung/abschliessen-testdaten.sql; Abschließen mit Punkten und Themen, Rückgängig. */
const { chromium } = await import(process.env.PLAYWRIGHT_MODUL || 'playwright');
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const PW = process.env.GF_PW || '';
if (!PW) { console.error('GF_PW fehlt'); process.exit(2); }
const FALL = process.argv[2] || 'xceed';
const FN = 'https://bnfmupnmqyrcltrphfak.supabase.co/functions/v1/gfweekly';
const ROOT = path.join(path.dirname(new URL(import.meta.url).pathname), '..', 'site');
const MIME = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.png':'image/png', '.webp':'image/webp', '.webmanifest':'application/manifest+json' };
const server = http.createServer((req, res) => {
  const p = decodeURIComponent(req.url.split('?')[0]); const f = path.join(ROOT, p === '/' ? 'index.html' : p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res);
});
await new Promise(r => server.listen(0, r));
const BASE = 'http://127.0.0.1:' + server.address().port;
let fehler = 0, n = 0;
const ok = (bed, text, extra) => { n++; if (bed) console.log('  ✓ ' + text); else { fehler++; console.log('  ✕ ' + text + (extra !== undefined ? '  → ' + String(extra).slice(0, 300) : '')); } };
async function api(action, payload = {}) {
  const r = await fetch(FN, { method:'POST', headers:{ 'Content-Type':'application/json' }, body:JSON.stringify({ action, password:PW, payload }) });
  return r.json();
}

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport:{ width:390, height:844 }, locale:'de-DE', timezoneId:'Europe/Berlin' });
await ctx.addInitScript((pw) => { try { sessionStorage.setItem('gf_pw', pw); sessionStorage.setItem('gf_who', 'Alex'); localStorage.setItem('gf_vh_filter', 'alle'); localStorage.setItem('gf_vh_view', 'liste');
  const d = new Date(); const t = d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  for (const w of ['Alex','Lea']) localStorage.setItem(`gf_ci_${w}_${t}`, '1'); } catch (e) {} }, PW);
const konsole = [];
const p = await ctx.newPage();
p.on('console', m => { if (m.type() === 'error') konsole.push(m.text()); });
p.on('pageerror', e => konsole.push('Skriptfehler: ' + e.message));
const warte = async (fn, ms = 15000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await fn()) return true; await p.waitForTimeout(150); } return false; };
const gesendet = [];
p.on('request', r => { if (r.url() === FN) { try { const j = JSON.parse(r.postData() || '{}'); gesendet.push({ action:j.action, nutzlast:j.payload }); } catch (e) {} } });
const antworten = [];
p.on('response', async r => { if (r.url() === FN) { try { const j = JSON.parse(r.request().postData() || '{}'); antworten.push({ action:j.action, status:r.status(), body:await r.json() }); } catch (e) {} } });
const letzteAntwort = (a) => [...antworten].reverse().find(x => x.action === a);

if (FALL === 'xceed') {
  const vorher = await api('vorhaben_get', { slug:'xceed' });
  const themen = vorher.themen.map(t => t.id).sort().join('|');
  ok(vorher.vorhaben.status === 'erledigt' && vorher.themen.length === 11, 'Ausgang: XCeed erledigt, 11 verknüpfte Themen', vorher.vorhaben.status + ' ' + vorher.themen.length);
  await p.goto(BASE + '/vorhaben.html?filter=erledigt');
  ok(await warte(async () => await p.locator('.vh-erl-z[data-open="xceed"]').count() === 1), 'Filter Erledigt zeigt XCeed');
  ok(/Ticketing-Vertrag mit Xceed ist abgeschlossen|Vertrag/.test(await p.locator('.vh-erl-z[data-open="xceed"]').innerText()), 'mit Datum und Ergebnissatz', await p.locator('.vh-erl-z[data-open="xceed"]').innerText());
  await p.locator('.vh-erl-z[data-open="xceed"]').click();
  ok(await warte(async () => await p.locator('#vhAkte [data-wieder]').isVisible()), 'Akte: Erledigt am und Wieder öffnen');
  ok(/Erledigt am/.test(await p.locator('.vh-a-erl').innerText()), 'Kopf „Erledigt am …“', await p.locator('.vh-a-erl').innerText());
  await p.locator('#vhAkte [data-wieder]').click();
  ok(await warte(async () => await p.locator('#vhAkte [data-erledigt]').isVisible()), 'Wieder öffnen: Akte offen mit „✓ Erledigt“');
  let v = (await api('vorhaben_get', { slug:'xceed' })).vorhaben;
  ok(v.status === 'aktiv' && v.zustand === 'ueberfaellig', 'XCeed aktiv und überfällig', v.status + ' ' + v.zustand);
  await p.locator('[data-akte-zu]').first().click();
  ok(await warte(async () => /überfällig/.test(await p.locator('.vh-l-z[data-open="xceed"]').innerText().catch(() => ''))), 'Liste zeigt XCeed überfällig');
  await p.locator('[data-fertig="xceed"]').click();
  ok(await warte(async () => await p.locator('#vhModal .vh-blatt').isVisible()), 'Kreis öffnet das Blatt');
  await p.waitForTimeout(600);   // Einblenden (ht-rise) abwarten, dann messen
  const bb = await p.locator('#vhModal .vh-blatt').boundingBox();
  ok(bb && Math.abs(bb.y + bb.height - 844) < 2, 'Blatt steht am Handy unten', JSON.stringify(bb));
  ok(await p.locator('#vhErlThemen').count() === 1 && !(await p.locator('#vhErlThemen').isChecked()) && /\(11\)/.test(await p.locator('label:has(#vhErlThemen)').innerText()), 'Themen-Haken (11) steht aus');
  await p.locator('#vhErlSatz').fill('Vertrag abgeschlossen (Live-Probe)');
  await p.locator('#vhErlOk').click();
  ok(await warte(async () => await p.locator('#vhRueck.show #vhRueckK').isVisible()), 'Hinweis mit Rückgängig erscheint');
  const ab = letzteAntwort('vorhaben_abschliessen');
  ok(ab && ab.status === 200 && ab.body.themen === 0, 'abgeschlossen ohne Themen', JSON.stringify(ab && ab.body).slice(0, 200));
  let a = await api('vorhaben_get', { slug:'xceed' });
  ok(a.vorhaben.status === 'erledigt' && a.themen.map(t => t.id).sort().join('|') === themen, '11 Themen bleiben offen');
  const vorU = antworten.filter(x => x.action === 'vorhaben_wiedereroeffnen').length;
  await p.locator('#vhRueckK').click();
  ok(await warte(async () => { const w = antworten.filter(x => x.action === 'vorhaben_wiedereroeffnen'); return w.length > vorU && w[w.length - 1].status === 200; }), 'Rückgängig ausgeführt');
  a = await api('vorhaben_get', { slug:'xceed' });
  ok(a.vorhaben.status === 'aktiv' && a.themen.map(t => t.id).sort().join('|') === themen, 'Rückgängig stellt exakt her (aktiv, dieselben 11 Themen)', a.vorhaben.status + ' ' + a.themen.length);
  ok(await warte(async () => await p.locator('.vh-l-z[data-open="xceed"]').count() === 1), 'XCeed wieder in der Liste');
  /* Am Ende wieder erledigt, über die Akte. */
  await p.locator('.vh-l-z[data-open="xceed"]').click();
  ok(await warte(async () => await p.locator('#vhAkte [data-erledigt]').isVisible()), 'Akte offen');
  await p.locator('#vhAkte [data-erledigt]').click(); await warte(async () => await p.locator('#vhErlOk').isVisible());
  await p.locator('#vhErlSatz').fill('Ticketing-Vertrag mit Xceed abgeschlossen');
  await p.locator('#vhErlOk').click();
  ok(await warte(async () => await p.locator('#vhRueck.show').isVisible()), 'erneut abgeschlossen');
  await p.waitForTimeout(800);
  a = await api('vorhaben_get', { slug:'xceed' });
  ok(a.vorhaben.status === 'erledigt' && a.themen.length === 11, 'Am Ende: XCeed erledigt, 11 Themen offen');
} else {
  const vorher = await api('vorhaben_get', { slug:'test-abschluss' });
  ok(vorher.vorhaben?.status === 'aktiv' && vorher.themen.length === 2 && vorher.punkte.filter(x => !x.erledigt).length === 2, 'Ausgang: Testvorhaben aktiv, 2 Punkte, 2 Themen');
  const fix = (a) => ({ p:a.punkte.map(x => [x.id, x.erledigt, x.erledigt_at, x.erledigt_by].join()).sort().join('|'), t:a.themen.map(x => x.id).sort().join('|') });
  await p.goto(BASE + '/vorhaben.html?v=test-abschluss');
  ok(await warte(async () => await p.locator('#vhAkte [data-erledigt]').isVisible()), 'Akte offen');
  await p.locator('#vhAkte [data-erledigt]').click(); await warte(async () => await p.locator('#vhErlOk').isVisible());
  ok(await p.locator('#vhErlPunkte').isChecked() && /\(2\)/.test(await p.locator('label:has(#vhErlPunkte)').innerText()), 'Punkte-Haken (2) an');
  await p.locator('#vhErlThemen').check();
  await p.locator('#vhErlOk').click();
  ok(await warte(async () => await p.locator('#vhRueck.show #vhRueckK').isVisible()), 'Hinweis mit Rückgängig');
  ok(/2 Punkte abgehakt, 2 Themen archiviert/.test(await p.locator('#vhRueck').innerText()), 'Hinweis nennt Punkte und Themen', await p.locator('#vhRueck').innerText());
  let a = await api('vorhaben_get', { slug:'test-abschluss' });
  ok(a.vorhaben.status === 'erledigt' && a.punkte.every(x => x.erledigt) && a.themen.length === 0, 'Datenbank: erledigt, Punkte abgehakt, Themen archiviert');
  const vorU = antworten.filter(x => x.action === 'vorhaben_wiedereroeffnen').length;
  await p.locator('#vhRueckK').click();
  ok(await warte(async () => { const w = antworten.filter(x => x.action === 'vorhaben_wiedereroeffnen'); return w.length > vorU && w[w.length - 1].status === 200; }), 'Rückgängig ausgeführt');
  a = await api('vorhaben_get', { slug:'test-abschluss' });
  ok(a.vorhaben.status === 'aktiv' && JSON.stringify(fix(a)) === JSON.stringify(fix(vorher)), 'Rückgängig stellt Punkte und Themen exakt her');
}
ok(await p.evaluate(() => document.documentElement.scrollWidth <= 390), 'keine waagrechte Rollleiste bei 390 px');
ok(!konsole.length, 'keine Konsolenfehler', konsole.join(' | '));
await browser.close(); server.close();
console.log(`\n${n - fehler} von ${n} bestanden`);
process.exit(fehler ? 1 : 0);
