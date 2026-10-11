/* V34 · Bedienprüfung des Wegweisers gegen den Live-Stand der Funktion „arbeiten“ und die echte Datenbank.
   Die Seite kommt aus dem Arbeitsbaum (lokaler HTTP-Server), jeder Aufruf geht unverändert an Supabase. Nichts wird abgefangen.
   Als Lea: der ganze Pfad (Link, Etappe 1, nach drei Fragen neu laden, Später, Link erneut, bis Abgabe, Zurücknehmen,
   erneut abgeben, ein Ablauf in Schritt 2). Als Alex: nur ansehen (seine echten Antworten bleiben unberührt, kein Schreibaufruf).
   Vorher muss Lea in Runde 1 leer sein (keine Antworten, keine Steckbriefe, keine Abgabe), sonst bricht das Skript ab.
   Danach räumt pruefung/v34-testdaten-entfernen.sql die Testdaten von Lea wieder ab (Zeitpunkt „seit“ = Beginn der Prüfung,
   den das Skript zu Beginn ausgibt). Nur ausführen, wenn Lea währenddessen nicht selbst arbeitet.
   Aufruf (Passwort nie ausgeben):
     GF_PW=… BREITE=390 PLAYWRIGHT_MODUL=~/spiel-test/node_modules/playwright/index.mjs node pruefung/v34-bedienpruefung-live.mjs */
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const PW = process.env.GF_PW || '';
if (!PW) { console.error('GF_PW fehlt.'); process.exit(2); }
const BREITE = Number(process.env.BREITE || 390);
const OUT = process.env.PROBE_OUT || '/tmp/v34-bedienpruefung'; fs.mkdirSync(OUT, { recursive: true });
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../site');
const FN = 'https://bnfmupnmqyrcltrphfak.supabase.co/functions/v1/arbeiten';
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json' };
let count = 0;
const check = (name, ok) => { assert.ok(ok, name); count++; console.log('✓ ' + name); };

async function lage(who) {
  const r = await fetch(FN, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'lage', password: PW, payload: { who } }) });
  assert.equal(r.status, 200, 'lage ' + who); return r.json();
}

const server = http.createServer((req, res) => {
  const p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  const file = path.resolve(root, '.' + (p === '/' ? '/index.html' : p));
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream' }); res.end(fs.readFileSync(file));
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;

console.log('Beginn der Prüfung (für „seit“ im SQL): ' + new Date().toISOString());
/* Ausgangslage: Lea leer, Alex unverändert festhalten. */
const vorherLea = await lage('Lea'), vorherAlex = await lage('Alex');
const runde = vorherLea.umfrage.runde;
assert.ok(runde && runde.nr === 1, 'Runde 1 läuft');
assert.ok(!runde.abgegeben_lea && vorherLea.umfrage.eigene.length === 0 && vorherLea.ist.eigene.length === 0, 'Lea muss vor der Prüfung leer sein. Erst pruefung/v34-testdaten-entfernen.sql ausführen.');
assert.ok(!runde.abgegeben_alex, 'Alex hat inzwischen abgegeben. Dann sähe Alex Leas Testantworten nach ihrer Abgabe: Prüfung abgebrochen.');
const alexFingerabdruck = JSON.stringify([vorherAlex.umfrage.eigene, vorherAlex.ist.eigene, runde.abgegeben_alex]);
/* Vor jeder Abgabe von Lea erneut: hat Alex inzwischen abgegeben, sähe er Leas Testantworten. Dann sofort abbrechen
   (Testdaten trotzdem mit dem SQL entfernen). */
async function alexNichtAbgegeben() { const a = await lage('Alex'); assert.ok(!a.umfrage.runde.abgegeben_alex, 'Alex hat während der Prüfung abgegeben: Abbruch vor Leas Abgabe.'); }

const { chromium } = await import(process.env.PLAYWRIGHT_MODUL || '/Users/alexanderdettke/spiel-test/node_modules/playwright/index.mjs');
const browser = await chromium.launch();
const tag = `live-${BREITE}`;
try {
  const ctx = await browser.newContext({ viewport: { width: BREITE, height: BREITE < 600 ? 844 : 1000 }, locale: 'de-DE', timezoneId: 'Europe/Berlin' });
  await ctx.addInitScript(pw => {
    sessionStorage.setItem('gf_pw', pw);
    const day = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Berlin' }).format(new Date());
    for (const w of ['Alex', 'Lea']) localStorage.setItem(`gf_ci_${w}_${day}`, '1');
  }, PW);
  const page = await ctx.newPage();
  const errors = [], schreib = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/status of (40\d|50\d)/.test(m.text())) errors.push(m.text()); });
  page.on('request', req => { if (req.url().endsWith('/functions/v1/arbeiten') && req.method() === 'POST') { const b = req.postDataJSON() || {}; if (b.action !== 'lage') schreib.push({ action: b.action, who: b.payload && b.payload.who }); } });
  const bereit = () => page.waitForFunction(() => typeof D !== 'undefined' && D && !BUSY && PENDING === 0 && document.querySelector('#saWeg .sw-karte'), null, { timeout: 30000 });
  const gespeichert = () => page.waitForFunction(() => PENDING === 0 && FAILED.size === 0, null, { timeout: 30000 });
  const wechsel = async klick => { const vor = await page.locator('#saWeg').innerHTML(); await klick(); await page.waitForFunction(v => !TAP && !BUSY && document.querySelector('#saWeg').innerHTML !== v, vor, { timeout: 30000 }); await gespeichert(); };
  const knopf = act => page.locator(`#saWeg [data-act=${act}]`);
  const antworte = v => wechsel(() => page.locator(`#saWeg [data-act=w-antwort][data-v="${v}"]`).click());
  const pos = () => page.locator('#saWeg .sw-pos').innerText();
  const schirm = n => page.screenshot({ path: path.join(OUT, `${n}-${tag}.png`), fullPage: true, animations: 'disabled' });
  const link = w => page.goto(`${base}/arbeiten.html?person=${w}&start=1`);

  /* Alex: nur ansehen. */
  await link('alex'); await bereit();
  check(tag + ': Alex sieht den Wegweiser', (await page.innerText('#saWeg h2')) === 'Guten Tag, Alex.');
  const artVon = nr => (vorherAlex.umfrage.fragen.find(f => f.nr === nr) || {}).art;
  const alexAnzahl = vorherAlex.umfrage.eigene.filter(a => a.kann_nicht || (artVon(a.nr) === 'text' ? !!(a.beispiel || '').trim() : a.wert != null)).length;
  check(tag + ': Alex sieht seinen echten Stand', (await page.innerText('.sw-stand')).includes(alexAnzahl ? '● Etappe 1 von 3' : '○ Etappe 1 offen'));
  check(tag + ': Vorhandene Antworten übernommen', (await knopf('w-etappe').innerText()) === (alexAnzahl ? 'Etappe 1 fortsetzen' : 'Etappe 1 starten'));
  await wechsel(() => knopf('w-etappe').click());
  const ersteOffen = (vorherAlex.umfrage.fragen.filter(f => f.nr <= 9).findIndex(f => !vorherAlex.umfrage.eigene.some(a => a.nr === f.nr && (a.kann_nicht || (f.art === 'text' ? !!(a.beispiel || '').trim() : a.wert != null)))) + 1) || 1;
  check(tag + ': Alex setzt bei der ersten offenen Frage fort', (await pos()) === `Etappe 1 · Frage ${ersteOffen} von 9`);
  await schirm('alex-frage');
  await wechsel(() => page.locator('#saWeg [data-act=w-zurueck]').click());
  check(tag + ': Alex ohne Schreibaufruf', schreib.length === 0);
  await page.evaluate(() => { for (const k of Object.keys(localStorage)) if (k.startsWith('sa_')) localStorage.removeItem(k); });

  /* Lea: der ganze Pfad. */
  await link('lea'); await bereit();
  check(tag + ': Lea sieht den Wegweiser', (await page.innerText('#saWeg h2')) === 'Guten Tag, Lea.' && (await knopf('w-etappe').innerText()) === 'Etappe 1 starten');
  const standAlex = (await page.innerText('.sw-stand'));
  check(tag + ': Stand von Alex ohne Inhalte', /Alex\s*(● Etappe 1 von 3|○ Etappe 1 offen|○ noch offen)/.test(standAlex));
  await schirm('lea-start');
  await wechsel(() => knopf('w-etappe').click());
  check(tag + ': Etappe 1 Frage 1 von 9', (await pos()) === 'Etappe 1 · Frage 1 von 9');
  await antworte(3); await antworte(4); await antworte('kn');
  await page.reload(); await bereit();
  check(tag + ': Neu laden setzt bei Frage 4 fort', (await pos()) === 'Etappe 1 · Frage 4 von 9');
  for (let i = 4; i <= 9; i++) await antworte(3);
  check(tag + ': Etappe 1 geschafft', (await page.innerText('#saWeg')).includes('✓ Etappe 1 geschafft'));
  await schirm('lea-zwischen');
  await wechsel(() => knopf('w-spaeter').click());
  await link('lea'); await bereit();
  check(tag + ': Link erneut: Etappe 2 starten', (await knopf('w-etappe').innerText()) === 'Etappe 2 starten');
  await wechsel(() => knopf('w-etappe').click());
  await antworte(4); await antworte(2);
  await page.locator('#saWeg .stepper [data-d="1"]').click(); await page.locator('#saWeg .stepper [data-d="1"]').click();
  await wechsel(() => knopf('w-weiter-zahl').click());
  await antworte(4); await antworte(3);
  await page.locator('#swText').fill('Testantwort der Bedienprüfung V34'); await wechsel(() => knopf('w-weiter-text').click());
  for (let i = 16; i <= 19; i++) await antworte(3);
  await wechsel(() => knopf('w-etappe').click());
  await antworte(4); await antworte(3);
  await page.locator('#swText').fill('Testantwort der Bedienprüfung V34'); await wechsel(() => knopf('w-weiter-text').click());
  await wechsel(() => knopf('w-ueberspringen').click());
  await wechsel(() => knopf('w-weiter-text').click());
  check(tag + ': Etappe 3 geschafft, Abgabe angeboten', (await page.innerText('#saWeg')).includes('✓ Etappe 3 geschafft') && await knopf('w-abgeben').count() === 1);
  let l = await lage('Lea');
  check(tag + ': 24 Antworten in der Datenbank', l.umfrage.eigene.length === 24 && l.umfrage.eigene.find(a => a.nr === 12).wert === 1 && l.umfrage.eigene.find(a => a.nr === 15).beispiel === 'Testantwort der Bedienprüfung V34' && l.umfrage.eigene.find(a => a.nr === 3).kann_nicht && l.umfrage.eigene.find(a => a.nr === 23).kann_nicht && l.umfrage.eigene.find(a => a.nr === 22).beispiel === 'Testantwort der Bedienprüfung V34');
  await alexNichtAbgegeben();
  await knopf('w-abgeben').click(); await knopf('w-abgeben').click();
  await page.waitForFunction(() => !BUSY && document.querySelector('[data-act=w-ablauf-neu]'), null, { timeout: 30000 });
  check(tag + ': Abgabe gespeichert, Schritt 2 aktiv', !!(await lage('Lea')).umfrage.runde.abgegeben_lea && (await page.innerText('.sw-stand')).includes('✓ abgegeben'));
  await knopf('w-zurueknehmen').click();
  await page.waitForFunction(() => !BUSY && document.querySelector('[data-act=w-abgeben]'), null, { timeout: 30000 });
  check(tag + ': Zurücknehmen wirkt', !(await lage('Lea')).umfrage.runde.abgegeben_lea);
  await alexNichtAbgegeben();
  await knopf('w-abgeben').click(); await knopf('w-abgeben').click();
  await page.waitForFunction(() => !BUSY && document.querySelector('[data-act=w-ablauf-neu]'), null, { timeout: 30000 });
  await schirm('lea-schritt2');
  await wechsel(() => knopf('w-ablauf-neu').click());
  await page.locator('#saWeg [data-act=w-chip][data-v="Freigaben"]').click(); await wechsel(() => knopf('w-ablauf-weiter').click());
  await page.locator('#swStartet').fill('Test V34'); await page.locator('#saWeg [data-act=w-chip][data-v="wöchentlich"]').click(); await wechsel(() => knopf('w-ablauf-weiter').click());
  await page.locator('#saWeg [data-act=w-chip]').first().click(); await wechsel(() => knopf('w-ablauf-weiter').click());
  await page.locator('#swBeteiligte').fill('Test V34'); await page.locator('#saWeg [data-act=w-chip][data-v="Nein"]').click(); await wechsel(() => knopf('w-ablauf-weiter').click());
  await wechsel(() => knopf('w-ablauf-weiter').click());
  await wechsel(() => knopf('w-ablauf-behalten').click());
  l = await lage('Lea');
  const ab = l.ist.eigene[0];
  check(tag + ': Ablauf gespeichert, nur für Lea', l.ist.eigene.length === 1 && ab.ablauf === 'Freigaben' && ab.haeufigkeit === 'wöchentlich' && ab.beruehrt_andere === false && ab.freigegeben === false && !!ab.werkzeuge);
  check(tag + ': Pfad zeigt Ablauf 2', (await knopf('w-ablauf-neu').innerText()) === 'Ablauf 2 beschreiben');
  check(tag + ': Bedienelemente mindestens 44 px', await page.locator('#saWeg button:visible,#saWeg input:not([type=hidden]):visible,#saWeg textarea:visible').evaluateAll(els => els.every(e => e.getBoundingClientRect().height >= 43.9)));
  check(tag + ': Kein horizontales Scrollen', await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  check(tag + ': Schreibaufrufe nur als Lea', schreib.every(s => s.who === 'Lea'));
  check(tag + ': Keine Skriptfehler', errors.length === 0 || (console.log(errors), false));
  /* Alex unverändert, und Alex sieht vor eigener Abgabe nichts von Lea. */
  const nachAlex = await lage('Alex');
  check(tag + ': Alex unverändert', JSON.stringify([nachAlex.umfrage.eigene, nachAlex.ist.eigene, nachAlex.umfrage.runde.abgegeben_alex]) === alexFingerabdruck);
  check(tag + ': Alex sieht keine Antworten von Lea', nachAlex.umfrage.andere.length === 0 && nachAlex.ist.andere.length === 0);
  await ctx.close();
  console.log(`\n${count} Prüfungen gegen den Live-Stand bestanden (${BREITE} px). Testdaten von Lea jetzt mit pruefung/v34-testdaten-entfernen.sql entfernen.`);
} finally { await browser.close(); server.close(); }
