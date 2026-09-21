/* Schirmpruefung (V23): alle Seiten bei 1440 und 390, dunkel und hell.
   Die Edge Function wird abgefangen und mit Testdaten beantwortet, damit ohne Passwort geprueft werden kann.
   Aufruf:  PLAYWRIGHT_MODUL=<pfad>/node_modules/playwright/index.mjs node pruefung/schirme.mjs [zielordner]
   (ohne die Variable muss playwright im Suchpfad liegen; das Paket gehoert bewusst nicht ins Repo)
   Ergebnis: je Seite ein Bild im Zielordner, Konsolenfehler und fehlende Dateien auf der Ausgabe. */
const { chromium } = await import(process.env.PLAYWRIGHT_MODUL || 'playwright');
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.join(path.dirname(new URL(import.meta.url).pathname), '..', 'site');
const OUT = process.argv[2] || '/tmp/hh-schirme';
fs.mkdirSync(OUT, { recursive: true });

const MIME = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8',
  '.webp':'image/webp', '.png':'image/png', '.ico':'image/x-icon', '.json':'application/json', '.webmanifest':'application/manifest+json', '.svg':'image/svg+xml' };
const server = http.createServer((req, res) => {
  const p = decodeURIComponent(req.url.split('?')[0]);
  const f = path.join(ROOT, p === '/' ? 'index.html' : p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end('nicht da'); }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});
await new Promise(r => server.listen(0, r));
const BASE = 'http://127.0.0.1:' + server.address().port;

import { ANTWORT, FALLBACK, SCHREIBEND, TPA, heute } from './testdaten.mjs';

const SEITEN = [
  ['index.html', '#fdEntL'], ['neuigkeiten.html', '#feed'], ['besprechung.html', '#bsAgL'], ['board.html', '#lanes,#grid,.board'],
  ['cockpit.html', '#list'], ['entscheidungen.html', '#log'], ['jahr.html', '#cycle'], ['capture.html', '#form'],
  ['seiten.html', '#groups'], ['bearbeiten.html', '#itemsView'], ['aufraeumen.html', '#list'], ['checkin.html', '#agenda'],
  ['inbox.html', '#list'],
  ['vertretung.html', '#absList'], ['uebergabe.html', '#list'], ['rueckkehr.html', '#entList'],
];
const SCHIRME = [ { name:'1440', w:1440, h:900 }, { name:'390', w:390, h:844 } ];
const THEMES = ['dark','light'];

const browser = await chromium.launch();
const unbekannt = new Set();
let fehler = 0, bilder = 0;
for (const thema of THEMES) {
  for (const s of SCHIRME) {
    const ctx = await browser.newContext({ viewport:{ width:s.w, height:s.h }, deviceScaleFactor:1, locale:'de-DE', timezoneId:'Europe/Berlin' });
    await ctx.addInitScript((thema) => {
      try {
        localStorage.setItem('gf_theme', thema);
        localStorage.setItem('gf_nav', 'open');
        // Der Tagesschluessel kommt aus dem lokalen Kalendertag des Browsers, genau wie in game.js
        const d = new Date();
        const tag = d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
        for (const w of ['Alex','Lea']) localStorage.setItem(`gf_ci_${w}_${tag}`, '1');   // Check-in-Karte im Test unterdruecken
        sessionStorage.setItem('gf_pw', 'test');
        sessionStorage.setItem('gf_who', 'Alex');
      } catch (e) {}
    }, thema);
    await ctx.route('**/functions/v1/**', async (route) => {
      const req = route.request();
      if (req.url().includes('/tpa')) return route.fulfill({ status:200, contentType:'application/json', body:JSON.stringify(TPA) });
      let action = '';
      try { action = JSON.parse(req.postData() || '{}').action || ''; } catch (e) {}
      if (!ANTWORT[action] && !SCHREIBEND.has(action)) unbekannt.add(action || '(ohne Aktion)');
      let nutzlast = {}; try { nutzlast = JSON.parse(req.postData() || '{}').payload || {}; } catch (e) {}
      const roh = ANTWORT[action] || FALLBACK;
      const body = typeof roh === 'function' ? roh(nutzlast) : roh;
      const status = body && body.__status ? body.__status : 200;
      await route.fulfill({ status, contentType:'application/json', body:JSON.stringify(body) });
    });
    for (const [seite, kern] of SEITEN) {
      const page = await ctx.newPage();
      const meldungen = [];
      page.on('console', m => { if (m.type() === 'error') meldungen.push('Konsole: ' + m.text()); });
      page.on('pageerror', e => meldungen.push('Skriptfehler: ' + e.message));
      page.on('requestfailed', r => { if (r.url().startsWith(BASE)) meldungen.push('Datei fehlt: ' + r.url().replace(BASE, '')); });
      page.on('response', r => { if (r.url().startsWith(BASE) && r.status() >= 400) meldungen.push('HTTP ' + r.status() + ': ' + r.url().replace(BASE, '')); });
      await page.goto(BASE + '/' + seite, { waitUntil:'load' });
      await page.waitForTimeout(900);
      const befund = await page.evaluate((kern) => {
        const g = document.getElementById('gate');
        const app = document.querySelector('.app,.cwrap,.iwrap');
        const el = kern.split(',').map(k => document.querySelector(k.trim())).find(Boolean);
        return {
          tor: !!g && g.style.display !== 'none',
          app: !!app && getComputedStyle(app).display !== 'none',
          nav: document.querySelectorAll('.sb-nav a[data-k]').length,
          unternav: document.querySelectorAll('.sb-nav a[data-sk]').length,
          fehltext: (() => {
            const t = document.body.innerText || '';
            const muster = ['Fehler beim Laden', 'Fehler: ', 'nicht erreichbar', 'Konnte nicht', 'Falsches Passwort'];
            return muster.filter(m => t.includes(m));
          })(),
          kern: el ? (el.innerText || '').trim().length : -1,
          laedt: (document.body.innerText || '').includes('lädt …'),
        };
      }, kern);
      if (befund.tor) meldungen.push('Tor blieb zu');
      if (!befund.app) meldungen.push('Seiteninhalt blieb verborgen');
      if (befund.nav !== 12) meldungen.push('Navigation unvollständig (' + befund.nav + ' von 12 Haupteinträgen)');
      if (befund.unternav !== 4) meldungen.push('Unternavigation unvollständig (' + befund.unternav + ' von 4 Einträgen)');
      if (befund.fehltext.length) meldungen.push('Fehlermeldung auf der Seite: ' + befund.fehltext.join(', '));
      if (befund.kern < 0) meldungen.push('Kerninhalt ' + kern + ' fehlt im Aufbau');
      else if (befund.kern < 20) meldungen.push('Kerninhalt ' + kern + ' blieb leer (' + befund.kern + ' Zeichen)');
      if (befund.laedt) meldungen.push('„lädt …“ blieb stehen');
      const datei = path.join(OUT, `${seite.replace('.html','')}--${s.name}--${thema}.png`);
      await page.screenshot({ path:datei, fullPage:true });
      bilder++;
      if (meldungen.length) { fehler += meldungen.length; console.log(`\n${seite}  ${s.name}  ${thema}`); for (const m of meldungen) console.log('   ' + m); }
      await page.close();
    }
    await ctx.close();
  }
}
await browser.close();
server.close();
if (unbekannt.size) { console.log('\nAktionen ohne Testdaten (Antwort war ein leerer Erfolg): ' + [...unbekannt].join(', ')); fehler += unbekannt.size; }
console.log(`\nBilder: ${bilder}  ·  Meldungen: ${fehler}  ·  Ordner: ${OUT}`);
process.exit(fehler ? 1 : 0);
