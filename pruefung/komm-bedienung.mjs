/* OBERFLÄCHENTEST kommunikation.html (V32): die Edge Function wird abgefangen (Testdaten aus testdaten.mjs), belegt werden
   Bedienwege, nicht die Wirkung in der Datenbank.
   Aufruf: PLAYWRIGHT_MODUL=<pfad>/node_modules/playwright/index.mjs node pruefung/komm-bedienung.mjs */
const { chromium } = await import(process.env.PLAYWRIGHT_MODUL || 'playwright');
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
import { ANTWORT, FALLBACK, KOMM_LIST } from './testdaten.mjs';
const KOMM_SAAT = JSON.stringify(KOMM_LIST);
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
  Object.assign(KOMM_LIST, JSON.parse(KOMM_SAAT));   // jeder Durchgang beginnt mit demselben Stand
  const ctx = await browser.newContext({ viewport: { width: s.w, height: s.h }, locale: 'de-DE', timezoneId: 'Europe/Berlin' });
  let ausfall = false, konflikt = false;
  /* Jemand anderes entscheidet denselben Prüfpunkt, während der Entwurf offen ist. */
  const fremd = () => { const pp = KOMM_LIST.festivals.find(f => f.short_name === 'FAMRD27').pruefpunkte[0]; Object.assign(pp, { stufe: 'rot', extras: ['E04'], entschieden_von: 'Alex (fremd)', entschieden_am: '2026-10-07T09:00:00.000Z' }); };
  await ctx.addInitScript(() => { sessionStorage.setItem('gf_pw', 'test'); sessionStorage.setItem('gf_who', 'Lea'); localStorage.setItem('gf_theme', 'dark'); });
  const aufrufe = [];
  await ctx.route('**/functions/v1/**', async route => { let b = {}; try { b = JSON.parse(route.request().postData() || '{}'); } catch (e) {}
    aufrufe.push(b);
    if (ausfall && b.action === 'komm_list') return route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: 'Probe: Dienst nicht erreichbar' }) });
    if (konflikt && b.action === 'komm_pruefpunkt_set') return route.fulfill({ status: 409, contentType: 'application/json', body: JSON.stringify({ error: 'Inzwischen geändert: Stufe steht auf rot' }) });
    const roh = ANTWORT[b.action] || FALLBACK; const body = typeof roh === 'function' ? roh(b.payload || {}) : roh;
    await route.fulfill({ status: body && body.__status || 200, contentType: 'application/json', body: JSON.stringify(body) }); });
  const page = await ctx.newPage(); const meldungen = [];
  page.on('pageerror', e => meldungen.push(e.message)); page.on('console', m => { if (m.type() === 'error') meldungen.push(m.text()); });
  page.on('dialog', d => d.accept());
  await page.goto(BASE + '/kommunikation.html'); await page.waitForSelector('#kmFest li[id^="fest-"]');
  wahr('fünf Festivalzeilen, Lusatia als nicht besetzt hervorgehoben', (await page.$$('#kmFest li[id^="fest-"]')).length === 5 && await page.$eval('#fest-LUSRD27', e => e.classList.contains('offen') && e.innerText.includes('Kommunikation nicht besetzt')));
  wahr('vor dem Versand: Rahmen Draußenbande unvollständig mit Fehlerliste', (await page.innerText('#fest-FAMRD27')).includes('unvollständig'));
  await page.click('#fest-FAMRD27 [data-act="vorschau"]'); await page.waitForSelector('#fest-FAMRD27 .vorschau [data-act="senden"]');
  wahr('Vorschau in Worten, Knopf „Senden als Lea“', (await page.innerText('#fest-FAMRD27 .vorschau')).includes('Eigentum und Zuständigkeit') && (await page.innerText('#fest-FAMRD27 [data-act="senden"]')).includes('Lea'));
  wahr('Vorschau ruft komm_send mit vorschau und by Lea', aufrufe.some(a => a.action === 'komm_send' && a.payload.vorschau && a.payload.by === 'Lea'));
  await page.click('#fest-FAMRD27 [data-act="senden"]'); await page.waitForFunction(() => (document.querySelector('#fest-FAMRD27 .vorschau') || {}).innerText?.includes('Gesendet'));
  wahr('nach dem Senden liegt der Fokus im Ergebnis (Knopf „Schließen“)', await page.evaluate(() => document.activeElement?.matches('#fest-FAMRD27 .vorschau [data-act="vorschau-zu"]')));
  wahr('Senden schickt bestaetigt und meldet das Ergebnis', aufrufe.some(a => a.action === 'komm_send' && a.payload.bestaetigt === true && a.payload.by === 'Lea'));
  await page.click('#fest-FAMRD27 [data-act="vorschau-zu"]');
  wahr('nach dem Versand: Rahmen „gesendet“, nicht mehr unvollständig', !(await page.innerText('#fest-FAMRD27')).includes('unvollständig') && (await page.innerText('#fest-FAMRD27')).includes('gesendet am'));
  await page.click('#fest-FAMRD27 [data-act="pp"]'); await page.waitForSelector('#fest-FAMRD27 .pp-form');
  wahr('Formular öffnet mit dem Fokus auf der gewählten Stufe', await page.evaluate(() => document.activeElement?.matches('.pp-form .chip.on') && document.activeElement.dataset.v === 'gelb'));
  await page.fill('#fest-FAMRD27 .pp-form textarea', 'Entwurf bleibt');
  await page.click('#fest-BYNRD27 [data-act="vorschau"]'); await page.waitForSelector('#fest-BYNRD27 .vorschau [data-act="senden"]');
  wahr('Entwurf übersteht das Öffnen einer anderen Vorschau', (await page.inputValue('#fest-FAMRD27 .pp-form textarea')) === 'Entwurf bleibt');
  await page.click('#fest-BYNRD27 [data-act="vorschau-zu"]');
  await page.click('#fest-FAMRD27 .pp-form .chip[data-v="rot"]');
  await page.click('#fest-FAMRD27 .pp-form label:has(input[value="E05"])');
  await page.click('#fest-FAMRD27 .pp-form button[type="submit"]');
  await page.waitForTimeout(400);
  const pp = aufrufe.filter(a => a.action === 'komm_pruefpunkt_set').pop();
  wahr('Prüfpunkt speichert Stufe, Extras, Notiz, by und den gesehenen Stand', !!pp && pp.payload.stufe === 'rot' && pp.payload.expect_stufe === 'gelb' && JSON.stringify(pp.payload.expect_extras) === '["E01","E03"]' && pp.payload.extras.includes('E05') && pp.payload.extras.includes('E01') && pp.payload.notiz === 'Entwurf bleibt' && pp.payload.by === 'Lea', JSON.stringify(pp && pp.payload));
  wahr('nach dem Speichern zeigt die Seite den neuen Stand und der Fokus steht am Auslöser', (await page.innerText('#fest-FAMRD27')).includes('Stufe rot') && await page.evaluate(() => document.activeElement?.matches('#fest-FAMRD27 [data-act="pp"]')));
  wahr('Meldung für Bildschirmleser', (await page.innerText('#kmStatus')).includes('gespeichert'));
  konflikt = true;
  await page.click('#fest-FAMRD27 [data-act="pp"]'); await page.waitForSelector('#fest-FAMRD27 .pp-form');
  await page.click('#fest-FAMRD27 .pp-form .chip[data-v="gruen"]'); await page.click('#fest-FAMRD27 .pp-form button[type="submit"]'); await page.waitForTimeout(400);
  wahr('Konflikt: sichtbare Meldung „Nicht gespeichert“ mit Fokus, Formular zu', (await page.innerText('#kmMeldung')).includes('Nicht gespeichert') && await page.evaluate(() => document.activeElement?.id === 'kmMeldung') && !(await page.$('#fest-FAMRD27 .pp-form')));
  konflikt = false;
  wahr('Rahmenstatus Wilde Möhre: begonnen, Rest folgt', (await page.innerText('#fest-WMRD27')).includes('begonnen'));
  /* Entwurf, während jemand anderes entscheidet: der Ausgangsstand bleibt, Speichern meldet den Konflikt. */
  await page.click('#fest-FAMRD27 [data-act="pp"]'); await page.waitForSelector('#fest-FAMRD27 .pp-form');
  fremd();
  await page.click('#fest-FAMRD27 .pp-form .chip[data-v="gelb"]'); await page.click('#fest-FAMRD27 .pp-form button[type="submit"]'); await page.waitForTimeout(400);
  wahr('Entwurf über eine fremde Entscheidung hinweg: 409 statt Überschreiben', (await page.innerText('#kmMeldung')).includes('Nicht gespeichert') && KOMM_LIST.festivals.find(f => f.short_name === 'FAMRD27').pruefpunkte[0].entschieden_von === 'Alex (fremd)');
  /* Budgetfreigabe: danach verschwindet die offene Entscheidung. */
  const fe = KOMM_LIST.festivals.find(f => f.short_name === 'FAMRD27').pruefpunkte[0];
  Object.assign(fe, { stufe: 'gelb', extras: ['E01'], entschieden_von: 'Christian Linck', entschieden_am: '2026-10-06T10:00:00.000Z' });
  KOMM_LIST.entscheiden.push({ art: 'extras', festival: 'FAMRD27', datum: fe.datum, extras: ['E01'], text: 'Draußenbande: Extras mit Budget gewählt (E01), Freigabe der GF fehlt.' });
  await page.reload(); await page.waitForSelector('[data-act="extras-frei"]');
  await page.click('[data-act="extras-frei"]'); await page.waitForTimeout(500);
  wahr('nach der Freigabe liegt der Fokus auf der Ergebnismeldung', await page.evaluate(() => document.activeElement?.id === 'kmMeldung'));
  wahr('nach der Freigabe ist die Budgetentscheidung verschwunden und gemeldet', !(await page.$('[data-act="extras-frei"]')) && (await page.innerText('#kmMeldung')).includes('freigegeben'));

  wahr('Entscheidungen: Besetzung, Prüfpunkt, Überlast (die freigegebenen Extras sind weg)', (await page.innerText('#kmEntscheiden')).match(/Besetzung[\s\S]*(Prüfpunkt[\s\S]*)?Überlast/i) !== null && !(await page.innerText('#kmEntscheiden')).includes('Extras mit Budget'));
  const ziel = await page.$('#kmLast .ziel[tabindex="0"]'); await ziel.focus();
  const vorher = await page.evaluate(() => [document.activeElement.dataset.i, document.getElementById('kmTip').innerText]);
  await page.keyboard.press('ArrowRight');
  const nachher = await page.evaluate(() => [document.activeElement.dataset.i, document.getElementById('kmTip').innerText]);
  wahr('Diagramm mit Tastatur: Pfeil rechts wechselt die Woche, Hinweis nennt die neue Woche in Worten', Number(nachher[0]) === Number(vorher[0]) + 1 && nachher[1] !== vorher[1] && nachher[1].includes('Stunden') && nachher[1].includes('Woche ab'), JSON.stringify([vorher, nachher]));
  await page.click('#kmBandAuf > summary');
  wahr('Jahresband zeigt fünf Spuren mit Beschreibung', (await page.$$('#kmBand .spur[aria-label]')).length === 5);
  const zellen = await page.evaluate(() => [...document.querySelectorAll('#kmAnstehend td:nth-child(2)')].map(td => Math.round(td.getBoundingClientRect().width)));
  wahr('Titelspalte in „Was steht an?“ breit genug zum Lesen (mindestens 150 px)', zellen.length > 0 && Math.min(...zellen) >= 150, 'Breiten ' + zellen.slice(0, 5).join(', '));
  const hoehe = await page.evaluate(() => document.getElementById('kmAnstehend').getBoundingClientRect().height);
  wahr('„Was steht an?“ ohne Riesenzeilen (unter 6000 px hoch)', hoehe < 6000, 'Höhe ' + Math.round(hoehe));
  const breite = await page.evaluate(() => document.documentElement.scrollWidth);
  wahr('keine waagrechte Scrollbreite nach dem Aufklappen', breite <= s.w, 'Breite ' + breite);
  wahr('keine Konsolenfehler', !meldungen.filter(m => !/503|409/.test(m)).length, meldungen.join(' | '));
  /* Abgelehntes Speichern bei gleichzeitigem Ladeausfall: keine Meldung „gespeichert“, Stand als veraltet gesperrt. */
  await page.click('#fest-FAMRD27 [data-act="pp"]'); await page.waitForSelector('#fest-FAMRD27 .pp-form');
  konflikt = true; ausfall = true;
  await page.click('#fest-FAMRD27 .pp-form button[type="submit"]'); await page.waitForTimeout(500);
  const mld = await page.innerText('#kmMeldung'), alt = await page.isVisible('#kmVeraltet');
  wahr('Ablehnung plus Ladeausfall: nicht „gespeichert“, Stand veraltet und gesperrt', !mld.includes('gespeichert: Stufe') && mld.includes('Nicht gespeichert') && mld.includes('veraltet') && !mld.includes('aktuellen Stand') && alt, JSON.stringify([mld, alt]));
  konflikt = false;
  await page.click('#fest-FAMRD27 [data-act="vorschau"]'); await page.waitForTimeout(200);
  wahr('veralteter Stand: Versand gesperrt mit Hinweis', (await page.innerText('#kmMeldung')).includes('veraltet') && !(await page.$('#fest-FAMRD27 .vorschau [data-act="senden"]')));
  await page.reload(); await page.waitForTimeout(800);
  wahr('Ladefehler: jeder Abschnitt sagt „nicht geladen“, Knopf „Noch einmal laden“', (await page.innerText('#km')).includes('Noch einmal laden') && !(await page.innerText('#km')).includes('lädt …') && (await page.innerText('#kmEntscheiden')).includes('unbekannt'));
  ausfall = false; await page.click('#kmFest [data-act="neu-laden"]'); await page.waitForSelector('#kmFest li[id^="fest-"]');
  wahr('Noch einmal laden holt die Daten', (await page.$$('#kmFest li[id^="fest-"]')).length === 5);
  await ctx.close();
}
await browser.close(); server.close();
console.log(`\n${ok} ok, ${fehler} Fehler`); process.exit(fehler ? 1 : 0);
