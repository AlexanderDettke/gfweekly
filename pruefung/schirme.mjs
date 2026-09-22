/* OBERFLÄCHENTEST. Die Edge Function wird abgefangen und mit Testdaten beantwortet; dieses Skript belegt
   Aufbau, Kontrast, Überlauf und Konsole, NICHT die Wirkung in der Datenbank.
   Schirmpruefung (V23): alle Seiten bei 1440 und 390, dunkel und hell.
   Die Edge Function wird abgefangen und mit Testdaten beantwortet, damit ohne Passwort geprueft werden kann.
   Aufruf:  PLAYWRIGHT_MODUL=<pfad>/node_modules/playwright/index.mjs node pruefung/schirme.mjs [zielordner]
   (ohne die Variable muss playwright im Suchpfad liegen; das Paket gehoert bewusst nicht ins Repo)
   Ergebnis: je Seite ein Bild im Zielordner, Konsolenfehler und fehlende Dateien auf der Ausgabe. */
const { chromium } = await import(process.env.PLAYWRIGHT_MODUL || 'playwright');
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'site');
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

/* Bekannte Kontrastschuld: Paare, die heute schon zu schwach sind und in docs/BEKANNTE-MAENGEL.md stehen.
   Sie werden gezaehlt und benannt, lassen den Lauf aber nicht scheitern. Alles, was NICHT in der Liste
   steht, ist neu und laesst ihn scheitern. So bleibt der Waechter scharf, ohne taeglich rot zu sein. */
const AUSNAHMEN = (() => {
  const f = path.join(path.dirname(fileURLToPath(import.meta.url)), 'kontrast-ausnahmen.json');
  if (!fs.existsSync(f)) return [];
  try { return JSON.parse(fs.readFileSync(f, 'utf8')).bekannt || []; }
  catch (e) { console.log('Ausnahmeliste unlesbar: ' + e.message); return []; }
})();
/* Eine Ausnahme gilt nur fuer genau diese Seite, dieses Thema und diesen Messwert. Sonst deckte
   „span“ jeden klassenlosen span im ganzen Haus ab, auch einen neuen, schlechteren (Befund 11). */
/* Mit KONTRAST_AUSNAHMEN_SCHREIBEN=1 wird die Liste aus dem aktuellen Lauf neu erzeugt, statt sie
   von Hand zu pflegen. Nur benutzen, wenn die gefundene Schuld bewusst als Grundlinie gelten soll. */
const SCHREIBE_AUSNAHMEN = !!process.env.KONTRAST_AUSNAHMEN_SCHREIBEN;
const gesammelt = [];
const istBekannt = (text, seite, thema) => AUSNAHMEN.some(a => {
  if (a.seite && a.seite !== seite) return false;
  if (a.thema && a.thema !== thema) return false;
  const m = text.match(/ ([\d.]+):1 /);
  if (a.wert != null && m && Number(m[1]) < a.wert - 0.05) return false;   // deutlich schlechter als bekannt   // schlechter als bekannt: neuer Befund
  return text.startsWith(a.muster);
});
let bekannteSchuld = 0;

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
          /* Waechter: laeuft die Seite seitlich ueber den Schirm hinaus? Genau das hat die Pruefung vom
             22.09.2026 uebersehen: die Aufnahmen fuer 390 waren in Wahrheit 428 Pixel breit. */
          breite: document.documentElement.scrollWidth,
          ueber: (() => {
            const grenze = document.documentElement.clientWidth + 1;
            const raus = [];
            for (const el of document.querySelectorAll('body *')) {
              const r = el.getBoundingClientRect();
              if (r.width === 0 && r.height === 0) continue;
              if (getComputedStyle(el).position === 'fixed') continue;
              if (r.right > grenze) raus.push(el.tagName.toLowerCase()
                + (typeof el.className === 'string' && el.className.trim() ? '.' + el.className.trim().split(/\s+/)[0] : '')
                + ' bis ' + Math.round(r.right));
              if (raus.length >= 3) break;
            }
            return raus;
          })(),
          /* Waechter: Kontrast wird gemessen, nicht aus einer Liste gelesen. Die Liste in kontrast.py hat
             am 22.09.2026 genau das Paar ausgelassen, das zu dunkel war (--text-3 auf --surface-2, 4,19:1).
             Hier zaehlt, was der Browser wirklich uebereinander legt, samt Deckkraft. */
          kontrast: (() => {
            /* Gemessen wird, was der Browser wirklich uebereinander legt: Deckkraft der Vorfahren,
               halbdurchsichtige Hintergruende, Platzhalter, Eingabewerte und Pseudoelemente.
               Was sich nicht messen laesst (Hintergrundbild, Verlauf), wird gemeldet statt uebergangen. */
            const zahl = (x) => (x.match(/[\d.]+/g) || []).map(Number);
            const lum = (c) => { const f = v => { v/=255; return v<=0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055,2.4); };
              return 0.2126*f(c[0])+0.7152*f(c[1])+0.0722*f(c[2]); };
            const ueber = (fg, a, bg) => [0,1,2].map(i => fg[i]*a + bg[i]*(1-a));
            const deckkraft = (el) => { let o = 1; for (let n = el; n && n !== document.documentElement; n = n.parentElement) o *= Number(getComputedStyle(n).opacity || 1); return o; };
            /* Untergrund: halbdurchsichtige Schichten werden von oben nach unten aufeinandergelegt. */
            /* Untergrund: Schichten von innen nach aussen. Eine Gruppe mit opacity < 1 verduennt alles,
               was in ihr liegt, also auch ihren eigenen Hintergrund, nicht nur die Schrift. */
            const grund = (el) => {
              const schichten = []; let gruppe = 1;
              for (let n = el; n; n = n.parentElement) {
                const st = getComputedStyle(n);
                if (st.backgroundImage && st.backgroundImage !== 'none') return { nichtMessbar: 'Hintergrundbild an ' + n.tagName.toLowerCase() };
                const c = zahl(st.backgroundColor);
                if (c.length >= 3) {
                  const a = (c[3] === undefined ? 1 : c[3]) * gruppe;
                  if (a > 0) {
                    schichten.push([[c[0],c[1],c[2]], a]);
                    if (a > 0.99) break;
                  }
                }
                gruppe *= Number(st.opacity || 1);   // gilt fuer alles weiter aussen
                if (n === document.documentElement) break;
              }
              let farbe = [255,255,255];
              for (let i = schichten.length - 1; i >= 0; i--) farbe = ueber(schichten[i][0], schichten[i][1], farbe);
              return { farbe };
            };
            const gesehen = new Set(); const schwach = [];
            const merke = (name, k, grenze) => {
              const schluessel = name + '|' + k.toFixed(2);
              if (gesehen.has(schluessel)) return;
              gesehen.add(schluessel);
              schwach.push(`${name} ${k.toFixed(2)}:1 (mind. ${grenze})`);
            };
            const nameVon = (el, zusatz) => el.tagName.toLowerCase()
              + (typeof el.className === 'string' && el.className.trim() ? '.' + el.className.trim().split(/\s+/).join('.') : '')
              + (zusatz || '');
            const pruefe = (el, farbeRoh, px, dick, zusatz) => {
              const v = zahl(farbeRoh); if (v.length < 3) return;
              const g = grund(el);
              if (g.nichtMessbar) { merke(nameVon(el, zusatz) + ' nicht messbar: ' + g.nichtMessbar, 0, 0); return; }
              const a = (v[3] === undefined ? 1 : v[3]) * deckkraft(el);
              const vg = ueber([v[0],v[1],v[2]], a, g.farbe);
              const l1 = lum(vg), l2 = lum(g.farbe);
              const k = (Math.max(l1,l2)+0.05) / (Math.min(l1,l2)+0.05);
              const grenze = (px >= 24 || (px >= 18.66 && dick)) ? 3 : 4.5;
              if (k < grenze) merke(nameVon(el, zusatz), k, grenze);
            };
            for (const el of document.querySelectorAll('body *')) {
              const st = getComputedStyle(el);
              if (st.visibility === 'hidden' || st.display === 'none') continue;
              if (deckkraft(el) < 0.1) continue;   // praktisch unsichtbar, kein Kontrastfall
              if (el.disabled || el.getAttribute('aria-disabled') === 'true' || el.closest('[disabled],[aria-disabled="true"]')) continue;
              const r = el.getBoundingClientRect(); if (r.width < 2 || r.height < 2) continue;
              const px = parseFloat(st.fontSize) || 16, dick = Number(st.fontWeight) >= 700;
              if ([...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim().length > 1)) pruefe(el, st.color, px, dick, '');
              /* Eingabefelder tragen ihren Text als Wert, nicht als Textknoten. */
              if (/^(input|textarea|select)$/i.test(el.tagName)) {
                if (el.value && String(el.value).trim().length > 1) pruefe(el, st.color, px, dick, ' [Wert]');
                if (el.placeholder) {
                  const ph = getComputedStyle(el, '::placeholder');
                  pruefe(el, ph.color || st.color, parseFloat(ph.fontSize) || px, dick, ' [Platzhalter]');
                }
              }
              for (const teil of ['::before', '::after']) {
                const ps = getComputedStyle(el, teil);
                const inhalt = ps.content;
                if (!inhalt || inhalt === 'none' || inhalt === 'normal') continue;
                if (/^("")|^('')$/.test(inhalt.trim())) continue;
                pruefe(el, ps.color, parseFloat(ps.fontSize) || px, Number(ps.fontWeight) >= 700, ' ' + teil);
              }
            }
            return schwach;
          })(),
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
      for (const k of befund.kontrast) {
        if (SCHREIBE_AUSNAHMEN) {
          const m = k.match(/^(.*?) ([\d.]+):1 /);
          gesammelt.push({ muster: m ? m[1] : k, seite, thema, wert: m ? Number(m[2]) : null });
          continue;
        }
        if (istBekannt(k, seite, thema)) { bekannteSchuld++; continue; }
        meldungen.push('Kontrast zu schwach: ' + k);
      }
      if (befund.breite > s.w + 1) meldungen.push(`Seitlicher Überlauf: ${befund.breite} px statt ${s.w} px`
        + (befund.ueber.length ? ' (zuerst ' + befund.ueber.join(', ') + ')' : ''));
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
if (SCHREIBE_AUSNAHMEN) {
  const ziel = path.join(path.dirname(fileURLToPath(import.meta.url)), 'kontrast-ausnahmen.json');
  const einmalig = [];
  for (const g of gesammelt) {
    const da = einmalig.find(e => e.muster === g.muster && e.seite === g.seite && e.thema === g.thema);
    /* Der schlechteste Wert zaehlt: derselbe Baustein kann auf einer Seite mehrfach und auf
       verschiedenen Untergruenden stehen. Sonst gilt die Grundlinie als unterschritten. */
    if (!da) einmalig.push(g);
    else if (g.wert != null && (da.wert == null || g.wert < da.wert)) da.wert = g.wert;
  }
  einmalig.sort((a, b) => (a.seite + a.thema + a.muster).localeCompare(b.seite + b.thema + b.muster));
  fs.writeFileSync(ziel, JSON.stringify({
    _: 'Bekannte Kontrastschuld, maschinell aus einem Lauf erzeugt. Jede Zeile gilt nur fuer genau diese Seite, '
       + 'dieses Thema und diesen Messwert; wird es schlechter oder taucht es woanders auf, ist es ein neuer Befund. '
       + 'Abarbeitung als WP-04 in docs/ARBEITSPAKETE.md.',
    erzeugt: new Date().toISOString().slice(0, 10),
    bekannt: einmalig,
  }, null, 2) + '\n');
  console.log(`\nAusnahmeliste neu geschrieben: ${einmalig.length} Einträge in ${ziel}`);
}
if (bekannteSchuld) console.log(`\nBekannte Kontrastschuld übergangen: ${bekannteSchuld} Treffer (pruefung/kontrast-ausnahmen.json, docs/BEKANNTE-MAENGEL.md).`);
console.log(`\nBilder: ${bilder}  ·  Meldungen: ${fehler}  ·  Ordner: ${OUT}`);
process.exit(fehler ? 1 : 0);
