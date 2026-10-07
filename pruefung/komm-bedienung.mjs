/* OBERFLÄCHENTEST kommunikation.html (V32): die Edge Function wird abgefangen (Testdaten aus testdaten.mjs), belegt werden
   Bedienwege, nicht die Wirkung in der Datenbank.
   Aufruf: PLAYWRIGHT_MODUL=<pfad>/node_modules/playwright/index.mjs node pruefung/komm-bedienung.mjs */
const { chromium } = await import(process.env.PLAYWRIGHT_MODUL || 'playwright');
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
import { ANTWORT, FALLBACK } from './testdaten.mjs';
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'site');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.webp': 'image/webp', '.png': 'image/png', '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon' };
const server = http.createServer((req, res) => { const p = decodeURIComponent(req.url.split('?')[0]); const f = path.join(ROOT, p === '/' ? 'index.html' : p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res); });
await new Promise(r => server.listen(0, r));
const BASE = 'http://127.0.0.1:' + server.address().port;
let ok = 0, fehler = 0;
const wahr = (name, b, info = '') => { if (b) { ok++; console.log('  ok     ' + name); } else { fehler++; console.log('  FEHLT  ' + name + (info ? '\n         ' + info : '')); } };
const browser = await chromium.launch();
for (const s of [{ w: 390, h: 844 }, { w: 1440, h: 900 }]) {
  console.log(`\n${s.w} px`);
  const ctx = await browser.newContext({ viewport: { width: s.w, height: s.h }, locale: 'de-DE', timezoneId: 'Europe/Berlin' });
  await ctx.addInitScript(() => { sessionStorage.setItem('gf_pw', 'test'); sessionStorage.setItem('gf_who', 'Lea'); localStorage.setItem('gf_theme', 'dark'); });
  const aufrufe = [];
  await ctx.route('**/functions/v1/**', async route => { let b = {}; try { b = JSON.parse(route.request().postData() || '{}'); } catch (e) {}
    aufrufe.push(b); const roh = ANTWORT[b.action] || FALLBACK; const body = typeof roh === 'function' ? roh(b.payload || {}) : roh;
    await route.fulfill({ status: body && body.__status || 200, contentType: 'application/json', body: JSON.stringify(body) }); });
  const page = await ctx.newPage(); const meldungen = [];
  page.on('pageerror', e => meldungen.push(e.message)); page.on('console', m => { if (m.type() === 'error') meldungen.push(m.text()); });
  page.on('dialog', d => d.accept());
  await page.goto(BASE + '/kommunikation.html'); await page.waitForSelector('#kmFest li[id^="fest-"]');
  wahr('fünf Festivalzeilen, Lusatia als nicht besetzt hervorgehoben', (await page.$$('#kmFest li[id^="fest-"]')).length === 5 && await page.$eval('#fest-LUSRD27', e => e.classList.contains('offen') && e.innerText.includes('Kommunikation nicht besetzt')));
  await page.click('#fest-FAMRD27 [data-act="vorschau"]'); await page.waitForSelector('#fest-FAMRD27 .vorschau [data-act="senden"]');
  wahr('Vorschau in Worten, Knopf „Senden als Lea“', (await page.innerText('#fest-FAMRD27 .vorschau')).includes('Eigentum und Zuständigkeit') && (await page.innerText('#fest-FAMRD27 [data-act="senden"]')).includes('Lea'));
  wahr('Vorschau ruft komm_send mit vorschau und by Lea', aufrufe.some(a => a.action === 'komm_send' && a.payload.vorschau && a.payload.by === 'Lea'));
  await page.click('#fest-FAMRD27 [data-act="senden"]'); await page.waitForFunction(() => (document.querySelector('#fest-FAMRD27 .vorschau') || {}).innerText?.includes('Gesendet'));
  wahr('Senden schickt bestaetigt und meldet das Ergebnis', aufrufe.some(a => a.action === 'komm_send' && a.payload.bestaetigt === true && a.payload.by === 'Lea'));
  await page.click('#fest-FAMRD27 [data-act="vorschau-zu"]');
  await page.click('#fest-FAMRD27 [data-act="pp"]'); await page.waitForSelector('#fest-FAMRD27 .pp-form');
  await page.click('#fest-FAMRD27 .pp-form .chip[data-v="rot"]');
  await page.click('#fest-FAMRD27 .pp-form label:has(input[value="E05"])');
  await page.click('#fest-FAMRD27 .pp-form button[type="submit"]');
  await page.waitForTimeout(400);
  const pp = aufrufe.filter(a => a.action === 'komm_pruefpunkt_set').pop();
  wahr('Prüfpunkt speichert Stufe, Extras und by', !!pp && pp.payload.stufe === 'rot' && pp.payload.expect_stufe === 'gelb' && pp.payload.extras.includes('E05') && pp.payload.extras.includes('E01') && pp.payload.by === 'Lea', JSON.stringify(pp && pp.payload));
  wahr('Entscheidungen: Besetzung, Prüfpunkt, Extras, Überlast', (await page.innerText('#kmEntscheiden')).match(/Besetzung[\s\S]*Prüfpunkt[\s\S]*Extras mit Budget[\s\S]*Überlast/i) !== null);
  const ziel = await page.$('#kmLast .ziel[tabindex="0"]'); await ziel.focus(); await page.keyboard.press('ArrowRight');
  wahr('Diagramm mit Tastatur: Woche als Wort im Hinweis', (await page.innerText('#kmTip')).includes('Stunden'));
  await page.click('#kmBandAuf > summary');
  wahr('Jahresband zeigt fünf Spuren mit Beschreibung', (await page.$$('#kmBand .spur[aria-label]')).length === 5);
  const breite = await page.evaluate(() => document.documentElement.scrollWidth);
  wahr('keine waagrechte Scrollbreite nach dem Aufklappen', breite <= s.w, 'Breite ' + breite);
  wahr('keine Konsolenfehler', !meldungen.length, meldungen.join(' | '));
  await ctx.close();
}
await browser.close(); server.close();
console.log(`\n${ok} ok, ${fehler} Fehler`); process.exit(fehler ? 1 : 0);
