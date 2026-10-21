/* OBERFLÄCHENTEST zum Webapp Standard (Pilot zur Erprobung, WEBAPP-PILOT-0.2).
   Ergänzt pruefung/schirme.mjs (1440/390, dunkel/hell, Kontrast, Überlauf) um die Prüfungen, die dort fehlen:
   320 px (G-05, T-04), 200 Prozent Textgröße (G-05, T-04), kleinste Schrift (G-01, T-02), Trefferflächen (G-03),
   Bedienelemente ohne Namen oder Bezeichnung (G-04, B-03, T-05), Tastaturfokus (B-08, T-05), reduzierte Bewegung (G-06, T-19)
   sowie Öffnen, Escape und Fokusrückgabe der gemeinsamen Dialoge und Meldungen aus core.js (B-08, P-04).
   Die Edge Function wird wie in schirme.mjs abgefangen und mit pruefung/testdaten.mjs beantwortet. Der Test belegt
   Aufbau und Bedienbarkeit der Oberfläche, NICHT die Wirkung in der Datenbank.
   Aufruf:  PLAYWRIGHT_MODUL=<pfad>/playwright/index.mjs node pruefung/webstandard-pruefung.mjs [ergebnis.json]
   Ausgabe: Befunde je Seite auf der Konsole, Zählungen als JSON. Rückgabewert 1, sobald eine harte Prüfung scheitert. */
const { chromium } = await import(process.env.PLAYWRIGHT_MODUL || 'playwright');
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';
import { ANTWORT, FALLBACK, SCHREIBEND, TPA } from './testdaten.mjs';

const HIER = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HIER, '..', 'site');
const AUS = process.argv[2] || null;

const MIME = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8',
  '.webp':'image/webp', '.png':'image/png', '.ico':'image/x-icon', '.json':'application/json', '.webmanifest':'application/manifest+json', '.svg':'image/svg+xml', '.jpg':'image/jpeg' };
const server = http.createServer((req, res) => {
  const p = decodeURIComponent(req.url.split('?')[0]);
  const f = path.join(ROOT, p === '/' ? 'index.html' : p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end('nicht da'); }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});
await new Promise(r => server.listen(0, r));
const BASE = 'http://127.0.0.1:' + server.address().port;

/* Alle Seiten der Webapp, auch die, die schirme.mjs nicht aufnimmt. */
const SEITEN = fs.readdirSync(ROOT).filter(f => f.endsWith('.html')).sort()
  .concat(['vorhaben.html?view=board&v=xceed', 'board.html?view=kacheln', 'arbeiten.html?person=alex&start=1']);
/* WS_SEITEN=a.html,b.html prüft nur diese Seiten (zum Nachprüfen einzelner Befunde; die Abnahme läuft immer über alle). */
const NUR = process.env.WS_SEITEN ? process.env.WS_SEITEN.split(',') : null;
if (NUR) SEITEN.splice(0, SEITEN.length, ...SEITEN.filter(x => NUR.includes(x)));

async function kontext(browser, o = {}) {
  const ctx = await browser.newContext({ viewport:{ width:o.w || 1440, height:o.h || 900 }, deviceScaleFactor:1, locale:'de-DE',
    timezoneId:'Europe/Berlin', reducedMotion:o.reduced ? 'reduce' : 'no-preference' });
  await ctx.addInitScript((thema) => {
    try {
      localStorage.setItem('gf_theme', thema.t);
      localStorage.setItem('gf_nav', 'open');
      const d = new Date();
      const tag = d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
      for (const w of ['Alex','Lea']) localStorage.setItem(`gf_ci_${w}_${tag}`, '1');
      if (!thema.ohnePw) sessionStorage.setItem('gf_pw', 'test');
      sessionStorage.setItem('gf_who', 'Alex');
    } catch (e) {}
  }, { t: o.thema || 'dark', ohnePw: !!o.ohnePw });
  await ctx.route('**/functions/v1/**', async (route) => {
    const req = route.request();
    if (req.url().includes('/tpa')) return route.fulfill({ status:200, contentType:'application/json', body:JSON.stringify(TPA) });
    let action = '', nutzlast = {}, pw = '';
    try { const b = JSON.parse(req.postData() || '{}'); action = b.action || ''; nutzlast = b.payload || {}; pw = b.password || ''; } catch (e) {}
    if (o.log) o.log.push({ action, nutzlast });
    if (pw && pw !== 'test') return route.fulfill({ status:401, contentType:'application/json', body:JSON.stringify({ error:'unauthorized' }) });
    if (o.warte && o.warte(action)) await new Promise(r => setTimeout(r, o.warte(action)));
    if (o.fehler && o.fehler(action)) return route.fulfill({ status:500, contentType:'application/json', body:JSON.stringify({ error:'Testfehler' }) });
    const roh = ANTWORT[action] || FALLBACK;
    const body = typeof roh === 'function' ? roh(nutzlast) : roh;
    await route.fulfill({ status: body && body.__status ? body.__status : 200, contentType:'application/json', body:JSON.stringify(body) });
  });
  return ctx;
}

async function oeffne(ctx, seite) {
  const page = await ctx.newPage();
  const fehler = [];
  page.on('pageerror', e => fehler.push('Skriptfehler: ' + e.message));
  await page.goto(BASE + '/' + seite, { waitUntil:'load' });
  await page.waitForTimeout(900);
  return { page, fehler };
}

/* Seitlicher Überlauf wie in schirme.mjs: feste Ebenen zählen nicht, Inhalte in eigenen Scrollflächen auch nicht. */
const UEBERLAUF = () => {
  const grenze = document.documentElement.clientWidth + 1, raus = [];
  const scrollt = (el) => { for (let n = el.parentElement; n && n !== document.body; n = n.parentElement) { const ox = getComputedStyle(n).overflowX; if (ox === 'auto' || ox === 'scroll' || ox === 'hidden' || ox === 'clip') return true; } return false; };
  for (const el of document.querySelectorAll('body *')) {
    const r = el.getBoundingClientRect(); if (r.width === 0 && r.height === 0) continue;
    if (getComputedStyle(el).position === 'fixed' || scrollt(el)) continue;
    if (r.right > grenze) { raus.push(el.tagName.toLowerCase() + (typeof el.className === 'string' && el.className.trim() ? '.' + el.className.trim().split(/\s+/)[0] : '') + ' bis ' + Math.round(r.right)); if (raus.length >= 3) break; }
  }
  /* Kein Element ragt hinaus? Dann ist es oft Text, der über sein Kästchen läuft (lange Wörter). */
  if (!raus.length && document.documentElement.scrollWidth > grenze) {
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n;
    while ((n = w.nextNode()) && raus.length < 3) { if (!n.textContent.trim() || scrollt(n.parentElement)) continue; const r = document.createRange(); r.selectNodeContents(n);
      if ([...r.getClientRects()].some(q => q.right > grenze)) raus.push('Text „' + n.textContent.trim().slice(0, 24) + '“ in ' + n.parentElement.tagName.toLowerCase() + (typeof n.parentElement.className === 'string' && n.parentElement.className.trim() ? '.' + n.parentElement.className.trim().split(/\s+/)[0] : '')); }
  }
  return { breite: document.documentElement.scrollWidth, raus };
};

/* Prüfungen in der Normalansicht 1440. */
const MESSUNG = () => {
  const sichtbar = (el) => { const st = getComputedStyle(el); if (st.display === 'none' || st.visibility === 'hidden') return false; const r = el.getBoundingClientRect(); if (r.width <= 1 || r.height <= 1 || el.closest('[hidden],[inert],[aria-hidden="true"]')) return false;
    /* Inhalt eines geschlossenen <details> wird nicht dargestellt (nur die summary) */
    const zu = el.closest('details:not([open])'); if (zu && !el.closest('summary')) return false; return true; };
  const name = (el) => el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (typeof el.className === 'string' && el.className.trim() ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : '');
  const zugName = (el) => (el.getAttribute('aria-label') || '').trim() || (el.getAttribute('aria-labelledby') ? 'x' : '') || (el.innerText || el.textContent || '').trim() || (el.getAttribute('title') || '').trim() || ([...el.querySelectorAll('img[alt]')].map(i => i.alt).join('').trim());
  const out = { kleinschrift: [], ziele_unter24: [], ziele_unter44: 0, ziele44: [], ohneName: [], ohneBezeichnung: [], nurPlatzhalter: [], klickOhneFokus: [] };
  // G-01: kleinste Schrift 12 px
  for (const el of document.querySelectorAll('body *')) {
    if (!sichtbar(el)) continue;
    if (![...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim().length > 1)) continue;
    const px = parseFloat(getComputedStyle(el).fontSize);
    if (px < 11.95) out.kleinschrift.push(name(el) + ' ' + px.toFixed(1) + 'px');
  }
  // G-03 Trefferflächen, G-04 Namen, B-03 Bezeichnungen
  const bedien = document.querySelectorAll('button, [role=button], a.btn, a.btn-sm, select, input:not([type=hidden]), textarea, summary, [role=tab], [role=menuitem]');
  for (const el of bedien) {
    if (!sichtbar(el)) continue;
    const r = el.getBoundingClientRect();
    // Trefferfläche zählt einschließlich eines vergrößernden Pseudoelements (G-03: kleines Symbol, größere Fläche)
    let w = r.width, h = r.height;
    for (const t of ['::before', '::after']) { const ps = getComputedStyle(el, t); if (ps.content && ps.content !== 'none' && ps.position === 'absolute') { const ex = -Math.min(parseFloat(ps.top) || 0, parseFloat(ps.bottom) || 0) * 2; const ey = -Math.min(parseFloat(ps.left) || 0, parseFloat(ps.right) || 0) * 2; h = Math.max(h, r.height + ex); w = Math.max(w, r.width + ey); } }
    const tp = (el.type || '').toLowerCase();
    if (!(tp === 'checkbox' || tp === 'radio')) {
      if (Math.min(w, h) < 23.95) out.ziele_unter24.push(name(el) + ' ' + Math.round(w) + '×' + Math.round(h));
      else if (Math.min(w, h) < 43.95) { out.ziele_unter44++; out.ziele44.push(el.tagName.toLowerCase() + (typeof el.className === 'string' && el.className.trim() ? '.' + el.className.trim().split(/\s+/)[0] : '') + (el.closest('.sidebar') ? ' (Navigation)' : '')); }
    }
    if (/^(BUTTON|A|SUMMARY)$/.test(el.tagName) || el.getAttribute('role')) { if (!zugName(el)) out.ohneName.push(name(el)); }
    if (/^(INPUT|SELECT|TEXTAREA)$/.test(el.tagName)) {
      const hat = (el.labels && el.labels.length) || el.getAttribute('aria-label') || el.getAttribute('aria-labelledby') || el.getAttribute('title');
      if (!hat) { (el.placeholder ? out.nurPlatzhalter : out.ohneBezeichnung).push(name(el) + (el.placeholder ? ' „' + el.placeholder.slice(0, 30) + '“' : '')); }
    }
  }
  // B-08: Elemente, die wie bedienbar aussehen (Zeiger), aber nicht mit der Tastatur erreichbar sind
  for (const el of document.querySelectorAll('body *')) {
    if (!sichtbar(el)) continue;
    if (/^(A|BUTTON|INPUT|SELECT|TEXTAREA|SUMMARY|LABEL|OPTION|DETAILS|IMG|SVG|PATH|I|B|SPAN|SMALL|STRONG|EM)$/i.test(el.tagName) && el.tagName !== 'DIV') {
      // Inline-Kinder von Bedienelementen erben den Zeiger; sie zählen nur, wenn sie selbst einen Klick tragen
      if (!el.hasAttribute('onclick')) continue;
    }
    const st = getComputedStyle(el); if (st.cursor !== 'pointer') continue;
    if (el.closest('a,button,label,summary,[role=button],[role=tab],[role=link],[tabindex]')) continue;
    /* data-ws-zusatz: zusätzlicher Zeigerweg; derselbe Vorgang hat ein eigenes Bedienelement mit Tastaturzugang (im Code benannt) */
    if (el.closest('[data-ws-zusatz]')) continue;
    if (el.parentElement && getComputedStyle(el.parentElement).cursor === 'pointer' && !el.hasAttribute('onclick')) continue;
    out.klickOhneFokus.push(name(el));
  }
  return out;
};

/* B-08: mit Tab durch die Seite; jedes erreichte Element muss einen sichtbaren Fokus zeigen. */
async function tastatur(page, schritte = 45) {
  const ohne = [], gesehen = new Set(); let erreicht = 0;
  await page.evaluate(() => { document.activeElement && document.activeElement.blur && document.activeElement.blur(); window.scrollTo(0, 0); });
  for (let i = 0; i < schritte; i++) {
    await page.keyboard.press('Tab');
    const f = await page.evaluate(() => {
      const el = document.activeElement; if (!el || el === document.body) return null;
      const st = getComputedStyle(el);
      const ring = (st.outlineStyle !== 'none' && parseFloat(st.outlineWidth) >= 1) || (st.boxShadow && st.boxShadow !== 'none');
      const n = el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (typeof el.className === 'string' && el.className.trim() ? '.' + el.className.trim().split(/\s+/)[0] : '');
      return { n, ring, key: n + '|' + Math.round(el.getBoundingClientRect().top) + '|' + Math.round(el.getBoundingClientRect().left) };
    });
    if (!f) continue;
    if (gesehen.has(f.key)) break;
    gesehen.add(f.key); erreicht++;
    if (!f.ring) ohne.push(f.n);
  }
  return { erreicht, ohne };
}

const browser = await chromium.launch();
const ERG = { fassung: 'WEBAPP-PILOT-0.2', datum: new Date().toISOString(), seiten: {} };
let hart = 0;
const ZIELE44 = {};
const melde = (seite, text, istHart = true) => { if (istHart) hart++; console.log(`  ${istHart ? 'FEHLER' : 'Hinweis'}  ${seite}: ${text}`); };

for (const seite of SEITEN) {
  const e = ERG.seiten[seite] = {};
  // 1440 dunkel: Messung und Tastatur
  {
    const ctx = await kontext(browser, {});
    const { page, fehler } = await oeffne(ctx, seite);
    const m = await page.evaluate(MESSUNG);
    Object.assign(e, { kleinschrift: m.kleinschrift.length, ziele_unter24: m.ziele_unter24.length, ziele_unter44: m.ziele_unter44,
      ohneName: m.ohneName.length, ohneBezeichnung: m.ohneBezeichnung.length, nurPlatzhalter: m.nurPlatzhalter.length, klickOhneFokus: m.klickOhneFokus.length });
    if (m.kleinschrift.length) melde(seite, `Schrift unter 12 px (${m.kleinschrift.length}): ` + [...new Set(m.kleinschrift)].slice(0, 4).join(', '));
    if (m.ziele_unter24.length) melde(seite, `Trefferfläche unter 24 px (${m.ziele_unter24.length}): ` + [...new Set(m.ziele_unter24)].slice(0, 4).join(', '));
    if (m.ohneName.length) melde(seite, `Bedienelement ohne Namen (${m.ohneName.length}): ` + [...new Set(m.ohneName)].slice(0, 4).join(', '));
    if (m.ohneBezeichnung.length) melde(seite, `Eingabe ohne Bezeichnung (${m.ohneBezeichnung.length}): ` + [...new Set(m.ohneBezeichnung)].slice(0, 4).join(', '));
    if (m.nurPlatzhalter.length) melde(seite, `Eingabe nur mit Platzhalter (${m.nurPlatzhalter.length}): ` + [...new Set(m.nurPlatzhalter)].slice(0, 3).join(', '));
    if (m.klickOhneFokus.length) melde(seite, `Zeigerziel ohne Tastaturzugang (${m.klickOhneFokus.length}): ` + [...new Set(m.klickOhneFokus)].slice(0, 4).join(', '));
    for (const z of m.ziele44) ZIELE44[z] = (ZIELE44[z] || 0) + 1;
    const t = await tastatur(page);
    e.tab_erreicht = t.erreicht; e.tab_ohneFokus = t.ohne.length;
    if (t.ohne.length) melde(seite, `Tastaturfokus nicht sichtbar (${t.ohne.length} von ${t.erreicht}): ` + [...new Set(t.ohne)].slice(0, 4).join(', '));
    if (fehler.length) melde(seite, fehler.join(' | '));
    await ctx.close();
  }
  // 320 hell: Umbruch
  {
    const ctx = await kontext(browser, { w:320, h:740, thema:'light' });
    const { page, fehler } = await oeffne(ctx, seite);
    const u = await page.evaluate(UEBERLAUF);
    e.ueberlauf320 = u.breite > 321 ? u.breite : 0;
    if (u.breite > 321) melde(seite, `320 px: seitlicher Überlauf ${u.breite} px` + (u.raus.length ? ' (zuerst ' + u.raus.join(', ') + ')' : ''));
    if (fehler.length) melde(seite, '320 px: ' + fehler.join(' | '));
    await ctx.close();
  }
  // 200 Prozent Textgröße bei 1280 px (nur Text vergrößert, nicht der ganze Zoom)
  {
    const ctx = await kontext(browser, { w:1280, h:900 });
    await ctx.addInitScript(() => { document.addEventListener('DOMContentLoaded', () => { document.documentElement.style.fontSize = '200%'; }); });
    const { page, fehler } = await oeffne(ctx, seite);
    const u = await page.evaluate(UEBERLAUF);
    const skaliert = await page.evaluate(() => parseFloat(getComputedStyle(document.body).fontSize));
    e.text200_body = skaliert; e.ueberlauf200 = u.breite > 1281 ? u.breite : 0;
    if (skaliert < 31) melde(seite, `200 % Text: Grundschrift wächst nicht mit (${skaliert} px)`);
    if (u.breite > 1281) melde(seite, `200 % Text: seitlicher Überlauf ${u.breite} px` + (u.raus.length ? ' (zuerst ' + u.raus.join(', ') + ')' : ''));
    if (fehler.length) melde(seite, '200 %: ' + fehler.join(' | '));
    await ctx.close();
  }
  // Reduzierte Bewegung: nach dem Laden darf keine Animation mehr laufen
  {
    const ctx = await kontext(browser, { reduced:true });
    const { page } = await oeffne(ctx, seite);
    const laufend = await page.evaluate(() => document.getAnimations().filter(a => a.playState === 'running').map(a => (a.animationName || a.constructor.name) + '@' + (a.effect && a.effect.target ? a.effect.target.tagName.toLowerCase() + '.' + String(a.effect.target.className).split(' ')[0] : '')));
    e.animationen_reduziert = laufend.length;
    if (laufend.length) melde(seite, `Reduzierte Bewegung: ${laufend.length} Animationen laufen weiter: ` + laufend.slice(0, 3).join(', '));
    await ctx.close();
  }
}

/* Gemeinsame Dialoge und Meldungen aus core.js (B-08, P-04, B-04): Titel, Anfangsfokus im Dialog, Escape schließt,
   Fokus kehrt zum auslösenden Element zurück; Kopieren meldet kein Ergebnis, das nicht eingetreten ist. */
{
  const ctx = await kontext(browser, {});
  const { page } = await oeffne(ctx, 'entscheidungen.html');
  for (const art of ['gfTextModal', 'gfNewsModal']) {
    const r = await page.evaluate(async (art) => {
      const ausl = document.createElement('button'); ausl.id = 'wsAusloeser'; ausl.textContent = 'Auslöser'; document.body.appendChild(ausl); ausl.focus();
      if (art === 'gfTextModal') gfTextModal('Prüfprotokoll', 'Zeile eins\nZeile zwei');
      else gfNewsModal({ id:'n1', title:'Prüfereignis', source:'notiz', happened_at:new Date().toISOString(), body:'Text' });
      await new Promise(r => setTimeout(r, 120));
      const dlg = document.querySelector('#gfModal.open [role=dialog]');
      return { offen: !!dlg, titel: dlg ? (dlg.getAttribute('aria-label') || dlg.getAttribute('aria-labelledby') || '') : '', fokusDrin: !!dlg && dlg.contains(document.activeElement) };
    }, art);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(120);
    const z = await page.evaluate(() => ({ zu: !document.querySelector('#gfModal.open'), fokus: document.activeElement && document.activeElement.id }));
    const ok = r.offen && r.titel && r.fokusDrin && z.zu && z.fokus === 'wsAusloeser';
    ERG['dialog_' + art] = { ...r, ...z, ok };
    if (!ok) melde('core.js', `${art}: offen=${r.offen} Titel=${!!r.titel} Fokus im Dialog=${r.fokusDrin} Escape schließt=${z.zu} Fokus zurück=${z.fokus === 'wsAusloeser'}`);
    await page.evaluate(() => document.getElementById('wsAusloeser')?.remove());
  }
  const toast = await page.evaluate(async () => {
    gfToast('Prüfmeldung');
    const t = document.getElementById('toast');
    return { live: !!t && (t.getAttribute('role') === 'status' || t.getAttribute('aria-live') === 'polite') };
  });
  ERG.toast = toast;
  if (!toast.live) melde('core.js', 'gfToast: Meldung ist für Vorlesesoftware nicht als Statusmeldung gekennzeichnet');
  const kopie = await page.evaluate(async () => {
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: () => Promise.reject(new Error('verweigert')) }, configurable:true });
    gfCopy('x'); await new Promise(r => setTimeout(r, 80));
    return document.getElementById('toast').textContent;
  });
  ERG.kopieren_verweigert = kopie;
  if (/kopiert/i.test(kopie) && !/nicht/i.test(kopie)) melde('core.js', `gfCopy meldet Erfolg, obwohl das Kopieren verweigert wurde („${kopie}“)`);
  await ctx.close();
}

/* B-07: Ladefehler werden sichtbar benannt, nicht als leere Seite oder ewiges „lädt …“ (Stichprobe an Hauptseiten). */
for (const [seite, aktion] of [['vorhaben.html', 'vorhaben_list'], ['board.html', 'list'], ['neuigkeiten.html', 'news_list'], ['entscheidungen.html', 'sessions_list']]) {
  const ctx = await kontext(browser, { fehler: (a) => a === aktion });
  const { page } = await oeffne(ctx, seite);
  const r = await page.evaluate(() => { const t = document.body.innerText || ''; return { laedt: t.includes('lädt …'), hinweis: /Fehler|nicht laden|nicht geladen|fehlgeschlagen|Verbindung|Testfehler/i.test(t) }; });
  ERG['ladefehler_' + seite] = r;
  if (!r.hinweis || r.laedt) melde(seite, `Ladefehler bei ${aktion}: Hinweis sichtbar=${r.hinweis}, „lädt …“ bleibt=${r.laedt}`);
  await ctx.close();
}

/* Gezielte Bedienproben zu geänderten Abläufen (T-05, T-06, T-08, T-09, T-11, B-07). Jede Probe nennt ihr Ergebnis einzeln. */
const probe = (name, ok, info = '') => { ERG.proben = ERG.proben || {}; ERG.proben[name] = ok; if (!ok) melde('Probe', name + (info ? ' (' + info + ')' : '')); };
// Eingabe: leeres Pflichtfeld, langsame Antwort mit Doppelklick, Fehler mit erhaltenen Eingaben
{
  const log = [];
  const ctx = await kontext(browser, { log, warte: a => a === 'capture' ? 1200 : 0, fehler: a => a === 'capture' && log.filter(x => x.action === 'capture').length > 1 });
  const { page } = await oeffne(ctx, 'capture.html');
  await page.click('#sendBtn');
  const leer = await page.evaluate(() => ({ err: !document.getElementById('rawErr').hidden, inv: document.getElementById('raw').getAttribute('aria-invalid'), fokus: document.activeElement.id }));
  probe('Eingabe: leeres Pflichtfeld zeigt Fehler am Feld und fokussiert es', leer.err && leer.inv === 'true' && leer.fokus === 'raw', JSON.stringify(leer));
  await page.fill('#raw', 'Testgedanke für die Prüfung');
  await page.click('#sendBtn'); await page.click('#sendBtn', { force:true }).catch(() => {});
  const waehrend = await page.evaluate(() => ({ dis: document.getElementById('sendBtn').disabled, txt: document.getElementById('sendBtn').textContent }));
  await page.waitForTimeout(1600);
  probe('Eingabe: während des Sendens gesperrt, Doppelklick erzeugt genau eine Anfrage', waehrend.dis && /gesendet/.test(waehrend.txt) && log.filter(x => x.action === 'capture').length === 1, JSON.stringify(waehrend) + ' Anfragen ' + log.filter(x => x.action === 'capture').length);
  await page.click('#again'); await page.fill('#raw', 'Zweiter Gedanke');
  await page.click('#sendBtn'); await page.waitForTimeout(1600);
  const fehl = await page.evaluate(() => ({ err: !document.getElementById('sendErr').hidden && document.getElementById('sendErr').textContent, wert: document.getElementById('raw').value, form: getComputedStyle(document.getElementById('form')).display }));
  probe('Eingabe: Senden fehlgeschlagen bleibt am Knopf sichtbar, Eingabe bleibt erhalten', !!fehl.err && /erhalten/.test(fehl.err) && fehl.wert === 'Zweiter Gedanke' && fehl.form !== 'none', JSON.stringify(fehl));
  await ctx.close();
}
// Board: Verschieben-Menü per Tastatur, Escape mit Fokusrückgabe, Umsortieren ohne Ziehen; Detailbereich mit Fokusrückgabe
{
  const log = [];
  const ctx = await kontext(browser, { log });
  const { page } = await oeffne(ctx, 'board.html');
  const lane = await page.evaluate(() => { const l = [...document.querySelectorAll('.lane')].find(x => x.querySelectorAll('.bcard').length >= 2); return l ? { col: l.dataset.col, ids: [...l.querySelectorAll('.bcard')].map(c => c.dataset.id) } : null; });
  if (!lane) probe('Board: Spalte mit zwei Karten in den Testdaten', false);
  else {
    const sel = `.bcard[data-id="${lane.ids[0]}"] .mv`;
    await page.focus(sel); await page.keyboard.press('Enter'); await page.waitForTimeout(80);
    const auf = await page.evaluate(() => ({ offen: !document.getElementById('movePop').hidden, drin: document.getElementById('movePop').contains(document.activeElement), runter: [...document.querySelectorAll('#movePop [data-ord]')].map(b => b.textContent) }));
    await page.keyboard.press('Escape'); await page.waitForTimeout(60);
    const zu = await page.evaluate((sel) => ({ zu: document.getElementById('movePop').hidden, fokus: document.activeElement === document.querySelector(sel) }), sel);
    probe('Board: ⇄ öffnet per Tastatur mit Fokus im Menü, Escape schließt und gibt den Fokus zurück', auf.offen && auf.drin && zu.zu && zu.fokus, JSON.stringify({ auf, zu }));
    probe('Board: Umsortieren ohne Ziehen wird angeboten', auf.runter.some(t => /nach unten/.test(t)), JSON.stringify(auf.runter));
    await page.focus(sel); await page.keyboard.press('Enter'); await page.waitForTimeout(60);
    const vorher = log.length;
    await page.evaluate(() => [...document.querySelectorAll('#movePop [data-ord]')].find(b => /Eine Stelle nach unten/.test(b.textContent))?.click());
    await page.waitForTimeout(300);
    const nach = await page.evaluate((col) => [...document.querySelector(`.lane[data-col="${col}"]`).querySelectorAll('.bcard')].map(c => c.dataset.id), lane.col);
    const upd = log.slice(vorher).filter(x => x.action === 'update' && x.nutzlast.lane_order != null);
    probe('Board: „Eine Stelle nach unten“ speichert die Reihenfolge und zeigt sie', upd.length > 0 && nach.indexOf(lane.ids[0]) === 1, 'Reihenfolge ' + nach.join(',') + ' · Speicheraufrufe ' + upd.length);
    const karte = `.bcard[data-id="${lane.ids[1]}"]`;
    await page.focus(karte); await page.keyboard.press('Enter'); await page.waitForTimeout(200);
    const p = await page.evaluate(() => ({ offen: document.getElementById('panel').classList.contains('open'), drin: document.getElementById('panel').contains(document.activeElement), name: !!document.getElementById('panel').getAttribute('aria-labelledby') }));
    await page.keyboard.press('Escape'); await page.waitForTimeout(300);
    const pz = await page.evaluate((k) => ({ zu: !document.getElementById('panel').classList.contains('open'), fokus: document.activeElement === document.querySelector(k) }), karte);
    probe('Board: Detailbereich öffnet per Enter mit Namen und Fokus, Escape schließt mit Fokus auf der Karte', p.offen && p.drin && p.name && pz.zu && pz.fokus, JSON.stringify({ p, pz }));
  }
  await ctx.close();
}
// Tor und Ladefehler: falsches Passwort sichtbar und angesagt; Ladefehler nach der Anmeldung auf der Seite, Passwort bleibt
{
  const ctx = await kontext(browser, { ohnePw:true });
  const { page } = await oeffne(ctx, 'board.html');
  await page.fill('#pw', 'falsch'); await page.click('#unlock'); await page.waitForTimeout(300);
  const t = await page.evaluate(() => ({ label: !!document.querySelector('label[for="pw"]'), err: document.getElementById('gateErr').textContent, rolle: document.getElementById('gateErr').getAttribute('role') }));
  probe('Tor: sichtbare Bezeichnung, falsches Passwort als Meldung mit role=alert', t.label && /Falsches Passwort/.test(t.err) && t.rolle === 'alert', JSON.stringify(t));
  await ctx.close();
  const ctx2 = await kontext(browser, { fehler: a => a === 'list' });
  const { page: p2 } = await oeffne(ctx2, 'cockpit.html');
  const l = await p2.evaluate(() => ({ fehler: !!document.querySelector('.ws-fehler [data-ws-neu]'), tor: getComputedStyle(document.getElementById('gate')).display !== 'none', pw: sessionStorage.getItem('gf_pw') }));
  probe('Ladefehler nach der Anmeldung: Meldung mit „Erneut laden“ auf der Seite, Tor bleibt zu, Passwort bleibt', l.fehler && !l.tor && l.pw === 'test', JSON.stringify(l));
  await ctx2.close();
}

await browser.close();
server.close();
const summe = (k) => Object.values(ERG.seiten).reduce((a, s) => a + (s[k] || 0), 0);
ERG.summen = Object.fromEntries(['kleinschrift', 'ziele_unter24', 'ziele_unter44', 'ohneName', 'ohneBezeichnung', 'nurPlatzhalter', 'klickOhneFokus', 'tab_ohneFokus', 'animationen_reduziert'].map(k => [k, summe(k)]));
ERG.summen.ueberlauf320 = Object.values(ERG.seiten).filter(s => s.ueberlauf320).length;
ERG.summen.ueberlauf200 = Object.values(ERG.seiten).filter(s => s.ueberlauf200).length;
ERG.harte_befunde = hart;
ERG.ziele_unter44_nach_baustein = Object.fromEntries(Object.entries(ZIELE44).sort((a, b) => b[1] - a[1]));
if (AUS) fs.writeFileSync(AUS, JSON.stringify(ERG, null, 2));
console.log('\nSeiten: ' + SEITEN.length + ' · Summen: ' + JSON.stringify(ERG.summen));
console.log(hart ? `Webstandard-Prüfung: ${hart} harte Befunde` : 'Webstandard-Prüfung: keine harten Befunde');
console.log('Hinweis: Oberflächentest mit abgefangener Edge Function; belegt keine Wirkung in der Datenbank.');
process.exit(hart ? 1 : 0);
