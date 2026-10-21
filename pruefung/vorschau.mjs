/* OBERFLÄCHENTEST-VORSCHAU zum Webapp Standard (Pilot zur Erprobung): öffnet die Seiten in einem sichtbaren Chrome mit
   denselben synthetischen Testdaten wie pruefung/schirme.mjs. Die Edge Function wird abgefangen; nichts erreicht die
   echte Datenbank, Asana oder Mail. Speichern wird nur simuliert: die Antwort ist ein leerer Erfolg, der Stand bleibt
   nach dem Neuladen der alte. Für die fachliche Bedienprobe von Gestaltung und Abläufen, nicht für die Wirkung.
   Aufruf:  PLAYWRIGHT_MODUL=<pfad>/playwright/index.mjs node pruefung/vorschau.mjs [seite.html]
   Ohne die Variable muss playwright im Suchpfad liegen. Benutzt das installierte Google Chrome (channel "chrome").
   Beenden: Browserfenster schließen. */
const { chromium } = await import(process.env.PLAYWRIGHT_MODUL || 'playwright');
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';
import { ANTWORT, FALLBACK, TPA } from './testdaten.mjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'site');
const MIME = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8',
  '.webp':'image/webp', '.png':'image/png', '.ico':'image/x-icon', '.json':'application/json', '.webmanifest':'application/manifest+json', '.svg':'image/svg+xml', '.jpg':'image/jpeg' };
const server = http.createServer((req, res) => {
  const p = decodeURIComponent(req.url.split('?')[0]);
  const f = path.join(ROOT, p === '/' ? 'index.html' : p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end('nicht da'); }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const BASE = 'http://127.0.0.1:' + server.address().port;

const ohneFenster = !!process.env.VORSCHAU_OHNE_FENSTER;   // nur für die eigene Probe dieses Skripts
const browser = await chromium.launch(ohneFenster ? {} : { channel:'chrome', headless:false });
const ctx = await browser.newContext({ viewport:null, locale:'de-DE', timezoneId:'Europe/Berlin' });
await ctx.addInitScript(() => {
  try { sessionStorage.setItem('gf_pw', 'vorschau'); if (!sessionStorage.getItem('gf_who')) sessionStorage.setItem('gf_who', 'Alex'); } catch (e) {}
  /* Sichtbarer Hinweis: Simulation, keine Wirkung */
  document.addEventListener('DOMContentLoaded', () => {
    const b = document.createElement('div');
    b.textContent = 'Vorschau mit Testdaten · Speichern wird nur simuliert · keine Wirkung auf echte Daten';
    b.setAttribute('role', 'note');
    b.style.cssText = 'position:fixed;right:12px;bottom:12px;z-index:200;padding:8px 12px;border-radius:6px;background:#23201b;color:#f4eedc;font:600 13px/1.3 system-ui;pointer-events:none;opacity:.92';
    document.body.appendChild(b);
  });
});
/* Zuerst registriert, also zuletzt geprüft (Playwright prüft Routen in umgekehrter Reihenfolge): alles andere Externe (Schriften ausgenommen) wird nicht geladen, damit nichts nach außen geht. */
await ctx.route(/^https?:\/\/(?!127\.0\.0\.1|fonts\.googleapis\.com|fonts\.gstatic\.com)/, route => route.abort());
await ctx.route('**/functions/v1/**', async (route) => {
  const req = route.request();
  if (req.url().includes('/tpa')) return route.fulfill({ status:200, contentType:'application/json', body:JSON.stringify(TPA) });
  let action = '', nutzlast = {};
  try { const b = JSON.parse(req.postData() || '{}'); action = b.action || ''; nutzlast = b.payload || {}; } catch (e) {}
  const roh = ANTWORT[action] || FALLBACK;
  const body = typeof roh === 'function' ? roh(nutzlast) : roh;
  await route.fulfill({ status: body && body.__status ? body.__status : 200, contentType:'application/json', body:JSON.stringify(body) });
});
const page = await ctx.newPage();
await page.goto(BASE + '/' + (process.argv[2] || 'index.html'));
if (ohneFenster) { await page.waitForTimeout(1200); const r = await page.evaluate(() => ({ hinweis: [...document.querySelectorAll('[role=note]')].some(n => /simuliert/.test(n.textContent)), tor: getComputedStyle(document.getElementById('gate')).display, inhalt: (document.getElementById('app')?.innerText || '').length })); console.log(JSON.stringify(r)); await browser.close(); server.close(); process.exit(r.hinweis && r.tor === 'none' && r.inhalt > 50 ? 0 : 1); }
console.log('Vorschau läuft unter ' + BASE + ' (nur in diesem Fenster mit Testdaten). Fenster schließen zum Beenden.');
browser.on('disconnected', () => { server.close(); process.exit(0); });
