/* OBERFLÄCHENTEST. Dieses Skript fängt alle Aufrufe der Edge Function ab und antwortet mit Testdaten.
   Es belegt die Oberfläche und die abgeschickte Nutzlast, NICHT die Wirkung in der Datenbank.
   Was live wirkt, muss live geprüft werden (Regel 6 der Zusammenarbeit). */
/* Bedienprüfung der Vertretung (V24b): klickt die Wege durch, die die Paketdatei als Abnahme nennt.
   Die Edge Function wird abgefangen (pruefung/testdaten.mjs); geprüft wird, was die Seite daraufhin tut
   und welche Aktion sie mit welcher Nutzlast schickt.
   Aufruf: PLAYWRIGHT_MODUL=<pfad>/node_modules/playwright/index.mjs node pruefung/bedienung.mjs */
const { chromium } = await import(process.env.PLAYWRIGHT_MODUL || 'playwright');
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { ANTWORT, FALLBACK, SCHREIBEND, TPA, zuruecksetzen } from './testdaten.mjs';

const ROOT = path.join(path.dirname(new URL(import.meta.url).pathname), '..', 'site');
const MIME = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8',
  '.webp':'image/webp', '.png':'image/png', '.ico':'image/x-icon', '.json':'application/json', '.webmanifest':'application/manifest+json' };
const server = http.createServer((req, res) => {
  const p = decodeURIComponent(req.url.split('?')[0]);
  const f = path.join(ROOT, p === '/' ? 'index.html' : p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end('nicht da'); }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});
await new Promise(r => server.listen(0, r));
const BASE = 'http://127.0.0.1:' + server.address().port;

let fehler = 0;
const pruefe = (name, ok, dazu='') => { if (ok) console.log('  ok     ' + name); else { fehler++; console.log('  FEHLT  ' + name + (dazu ? ' · ' + dazu : '')); } };

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport:{ width:1440, height:1000 }, locale:'de-DE', timezoneId:'Europe/Berlin' });
await ctx.addInitScript(() => {
  try {
    localStorage.setItem('gf_theme','dark'); localStorage.setItem('gf_nav','open');
    sessionStorage.setItem('gf_pw','test'); sessionStorage.setItem('gf_who','Alex');
    const d = new Date(); const t = d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
    for (const w of ['Alex','Lea']) localStorage.setItem(`gf_ci_${w}_${t}`,'1');
  } catch (e) {}
});
/* Jede Anfrage an die Edge Function landet in gesendet, damit die Proben sie nachsehen können. */
const gesendet = [];
let erwarteterFehler = false;   // nur dort gesetzt, wo eine Fehlerantwort zur Probe gehört
await ctx.route('**/functions/v1/**', async (route) => {
  const req = route.request();
  if (req.url().includes('/tpa')) return route.fulfill({ status:200, contentType:'application/json', body:JSON.stringify(TPA) });
  let action = '', nutzlast = {};
  try { const j = JSON.parse(req.postData() || '{}'); action = j.action || ''; nutzlast = j.payload || {}; } catch (e) {}
  gesendet.push({ action, nutzlast });
  const roh = ANTWORT[action] || FALLBACK;
  const body = typeof roh === 'function' ? roh(nutzlast) : roh;
  await route.fulfill({ status: body && body.__status ? body.__status : 200, contentType:'application/json', body:JSON.stringify(body) });
});
const letzte = (action) => [...gesendet].reverse().find(x => x.action === action);
/* Jede Probe beginnt mit leerem Verlauf, sonst bestätigt ein alter Aufruf einen neuen Fall. */
const frisch = () => { gesendet.length = 0; zuruecksetzen(); };   // frischer Aufrufverlauf und frische Daten je Fall
// Konsolenmeldungen bleiben stehen, sie werden am Ende bewertet
const meldungen = [];
const seite = async (url) => {
  const p = await ctx.newPage();
  p.on('dialog', d => d.accept());
  p.on('console', m => {
    if (m.type() !== 'error') return;
    /* Eine abgefangene Fehlerantwort ist gewollt (Asana ohne Token). Der Browser meldet sie trotzdem;
       das ist keine Meldung der Seite und zählt hier nicht. */
    if (erwarteterFehler && /Failed to load resource: the server responded with a status of 400/.test(m.text())) return;
    meldungen.push(m.text());
  });
  p.on('pageerror', e => meldungen.push('Skriptfehler: ' + e.message));
  await p.goto(BASE + url, { waitUntil:'load' }); await p.waitForTimeout(700); return p;
};

console.log('== Übergabe, lange geplante Abwesenheit ==');
{
  frisch();
  const p = await seite('/uebergabe.html?id=abs-1');
  pruefe('Kopf nennt die Person', (await p.locator('#kopf h2').innerText()).includes('Lea'));
  pruefe('vier Quadranten stehen da', await p.locator('.ub-quad').count() === 4);
  const alle = await p.locator('.ub-row').count();
  pruefe('sieben Zeilen im Korb, davon sechs Vorschläge', alle === 6, `${alle} sichtbar`);

  await p.locator('.ub-quad[data-q="warten"]').click(); await p.waitForTimeout(200);
  const gefiltert = await p.locator('.ub-row').count();
  pruefe('Klick auf Warten filtert', gefiltert === 1, `${gefiltert} Zeilen`);

  await p.locator('#allBtn').click(); await p.waitForTimeout(500);
  const many = letzte('handover_set_many');
  pruefe('Alle Vorschläge übernehmen schickt handover_set_many', !!many && (many.nutzlast.items||[]).length === 1,
         many ? JSON.stringify(many.nutzlast).slice(0,80) : 'nichts gesendet');

  await p.locator('.ub-quad[data-q="warten"]').click(); await p.waitForTimeout(200);
  await p.locator('.ub-row').first().locator('[data-act="auf"]').click(); await p.waitForTimeout(200);
  const doss = p.locator('.ub-row').first().locator('.ub-doss');
  pruefe('Dossier klappt auf', await doss.isVisible());
  pruefe('Dossier zeigt den Knopf für ein neues Dossier', await doss.locator('[data-act="doss"]').count() === 1);

  const zeile = p.locator('.ub-row').first();
  const vorher = await p.locator('.ub-row').count();
  await zeile.locator('.chip[data-set="ampel"][data-v="gruen"]').click(); await p.waitForTimeout(600);
  const set = letzte('handover_set');
  pruefe('Ampel-Klick schickt handover_set mit Ampel grün', !!set && set.nutzlast.ampel === 'gruen',
         set ? JSON.stringify(set.nutzlast).slice(0,80) : 'nichts gesendet');
  const nachher = await p.locator('.ub-row').count();
  pruefe('und die bestätigte Zeile verlässt die Ansicht „nur Vorschläge“', nachher === vorher - 1,
    `vorher ${vorher}, nachher ${nachher}`);
  pruefe('Vertretungsbrief lässt sich öffnen', await p.locator('#briefBtn').count() === 1);
  await p.locator('#briefBtn').click(); await p.waitForTimeout(400);
  const brief = await p.locator('.modal-text').inputValue().catch(() => '');
  pruefe('Brief nennt Zeitraum, Notfall und die Ampellisten',
    brief.includes('Zeitraum') && brief.includes('Notfall heißt') && brief.includes('Zur anderen GF'));
  await p.close();
}

console.log('\n== Übergabe als Wache, kurze und ungeplante Abwesenheit ==');
{
  frisch();
  const p = await seite('/uebergabe.html?id=abs-2');
  pruefe('Hinweiszeile der Wache steht da', (await p.locator('.ub-wache').allInnerTexts()).join(' ').includes('Am Tag 4'));
  const zeilen = p.locator('.ub-row');
  const notfall = zeilen.nth(0), alltag = zeilen.nth(1);
  pruefe('Notfall bleibt bedienbar', !(await notfall.locator('.chip[data-set="ampel"]').first().isDisabled()));
  pruefe('Alltag ist gesperrt', await alltag.locator('.chip[data-set="ampel"]').first().isDisabled());
  pruefe('Alle Vorschläge übernehmen ist gesperrt', await p.locator('#allBtn').isDisabled());
  await p.close();
}

console.log('\n== Abwesenheit anlegen ==');
{
  frisch();
  const p = await seite('/vertretung.html');
  pruefe('drei Abwesenheiten in der Liste', await p.locator('.vt-card[data-id]').count() === 3);
  pruefe('Übernahmefähigkeit je Person', await p.locator('.vt-stat').count() === 2);
  await p.locator('#neuBtn').click(); await p.waitForTimeout(300);
  const m = p.locator('.vt-modal');
  pruefe('Modal fragt fünf Dinge', await m.locator('.fld').count() === 5);
  await m.locator('[name=person]').evaluate(el => el.value = 'Lea');
  await m.locator('.fchips [data-v="1"]').click(); await p.waitForTimeout(150);
  pruefe('unklar zeigt die Schätzung in Tagen', await m.locator('#schaetzWrap').isVisible());
  await m.locator('.fchips [data-v="gespraech"]').click(); await p.waitForTimeout(150);
  pruefe('Gespräch fragt nach der Zeit', await m.locator('#zeitWrap').isVisible());
  await m.locator('.fchips [data-v="sofort"]').click(); await p.waitForTimeout(150);
  await m.locator('[name=kanal]').fill('Signal, nur Notfall');
  await m.locator('[data-save]').click(); await p.waitForTimeout(600);
  const neu = letzte('absence_set');
  await p.waitForTimeout(400);
  pruefe('und leitet zur Übergabe der neuen Abwesenheit weiter', p.url().includes('uebergabe.html?id=abs-neu'), p.url());
  pruefe('Anlegen schickt absence_set mit allen fünf Angaben',
    !!neu && neu.nutzlast.person === 'Lea' && neu.nutzlast.art === 'sofort' && neu.nutzlast.kontakt === 'gespraech'
      && !!neu.nutzlast.bis_geschaetzt && neu.nutzlast.bis === null && neu.nutzlast.kanal === 'Signal, nur Notfall',
    neu ? JSON.stringify(neu.nutzlast) : 'nichts gesendet');
  await p.close();
}

console.log('\n== Rückkehr ==');
{
  frisch();
  const p = await seite('/rueckkehr.html?id=abs-3');
  pruefe('Begrüßung mit Namen', (await p.locator('#kopf h2').innerText()).includes('Willkommen zurück'));
  pruefe('vier Kacheln, die vierte zählt Asana', await p.locator('#kpis .kk').count() === 4
    && (await p.locator('#kpis .kk').last().innerText()).includes('Asana'));
  pruefe('Entscheidungen tragen den Vermerk in Vertretung',
    (await p.locator('#entList .rk-row').first().innerText()).includes('in Vertretung für dich'));
  const wartet = await p.locator('#warList .rk-row').count();
  pruefe('was auf dich wartet, steht getrennt', wartet === 2, `${wartet} Zeilen`);
  await p.locator('#warList [data-act="back"]').first().click(); await p.waitForTimeout(500);
  const zurueck = letzte('handover_zurueck');
  pruefe('Übernehmen ruft handover_zurueck, eine Aktion für Zeile und Thema', !!zurueck && !!zurueck.nutzlast.id);
  pruefe('die Zeile verschwindet aus „wartet auf dich“', await p.locator('#warList .rk-row').count() === 1);
  pruefe('kein update mit Feldern, die das Backend gar nicht kennt', !letzte('update'));
  await p.locator('#endBtn').click(); await p.waitForTimeout(500);
  pruefe('Rückübergabe bestätigen beendet die Abwesenheit', !!letzte('absence_end'));
  await p.close();
}

console.log('\n== Asana ohne Token ==');
{
  frisch();
  const p = await seite('/uebergabe.html?id=abs-3');
  const knopf = p.locator('#asanaBtn');
  pruefe('Nach Asana erscheint, weil es bestätigte Zeilen gibt', await knopf.count() === 1);
  erwarteterFehler = true;
  await knopf.click(); await p.waitForTimeout(500);
  erwarteterFehler = false;
  const ex = letzte('asana_export');
  pruefe('Klick schickt asana_export', !!ex && ex.nutzlast.absence_id === 'abs-3');
  pruefe('ohne Token sagt die Seite das und legt nichts an',
    (await p.locator('#toast').innerText()).includes('noch nicht eingerichtet'));
  pruefe('der Knopf ist danach wieder bedienbar', !(await knopf.isDisabled()));
  await p.close();
  const q = await seite('/uebergabe.html?id=abs-2');
  pruefe('ohne bestätigte Zeilen kein Asana-Knopf', await q.locator('#asanaBtn').count() === 0);
  await q.close();
}

console.log('\n== Lückenfilter im Board (Befund 7.4) ==');
{
  frisch();
  const p = await seite('/board.html?owner=Lea&luecke=1');
  const titel = (await p.locator('.bcard').allInnerTexts()).join(' | ');
  const karten = await p.locator('.bcard').count();
  /* Lea hat zwei Themen ohne Stand: die Zeltwiese (auch ohne nächsten Schritt) und den Gastro-Partner
     (Entscheidung und Schritt stehen da, der Stand fehlt). Beide gehören in den Lückenfilter, sonst keins. */
  pruefe('genau Leas beide Lücken stehen da',
    karten === 2 && titel.includes('Zeltwiese') && titel.includes('Gastro-Partner'), `${karten} Karten: ${titel.slice(0,90)}`);
  pruefe('der Personenschalter ist sichtbar und trägt den Namen',
    (await p.locator('#owWrap').innerText()).includes('Lea'));
  await p.locator('#lueckeOn').uncheck(); await p.waitForTimeout(250);
  const ohneLuecke = await p.locator('.bcard').count();
  pruefe('ohne Lückenhaken stehen genau Leas drei Themen da', ohneLuecke === 3, `${ohneLuecke} Karten`);
  await p.locator('#owOn').uncheck(); await p.waitForTimeout(250);
  const alles = await p.locator('.bcard').count();
  pruefe('ohne Personenhaken stehen alle fünf da', alles === 5, `${alles} Karten`);
  await p.close();

  /* Kachel und Filter müssen dieselbe Menge meinen, sonst führt der Weg ins Leere. */
  const v = await seite('/vertretung.html');
  const kachel = await v.locator('.vt-stat').filter({ hasText:'Lea' }).innerText();
  pruefe('die Kachel nennt dieselben Zahlen wie der Filter', kachel.includes('3 Themen') && kachel.includes('2 ohne Stand'),
    kachel.replace(/\n/g,' ').slice(0,90));
  await v.close();
}

console.log('\n== Hinweis auf einen unvollständigen Korb (Befund 7.2) ==');
{
  frisch();
  const p = await seite('/uebergabe.html?id=abs-2');
  const hinweise = await p.locator('.ub-wache').allInnerTexts();
  pruefe('die Wache steht da', hinweise.some(h => h.includes('Am Tag 4')));
  pruefe('und der Hinweis auf die Obergrenze', hinweise.some(h => h.includes('Kandidaten') && h.includes('Obergrenze')));
  await p.close();
}

console.log('\n== Für dich und Besprechung ==');
{
  frisch();
  const p = await seite('/index.html');
  const vt = p.locator('#fdVt');
  pruefe('Vertretungsblock steht auf der Startseite', await vt.isVisible());
  pruefe('für die zurückkehrende Person mit drei Zahlen',
    (await vt.innerText()).includes('Seit du weg warst') && await vt.locator('.fd-zahlen div').count() === 3);
  await p.close();
  frisch();
  const b = await seite('/besprechung.html');
  await b.waitForTimeout(600);
  pruefe('Besprechung lädt die Vertretungsmarken', !!letzte('handover_list'));
  const marke = await b.locator('.bs-q .zst').filter({ hasText:'Vertretung für' }).count();
  pruefe('rote Korbzeilen tragen die Marke in der Agenda', marke >= 1, `${marke} Marken`);
  await b.close();
}

await browser.close();
server.close();
if (meldungen.length) { console.log('\nKonsolenmeldungen im letzten Fall:'); for (const m of meldungen) console.log('   ' + m.slice(0,200)); fehler += meldungen.length; }
console.log(fehler ? `\n${fehler} Abweichungen` : '\nAlle Bedienproben in Ordnung');
process.exit(fehler ? 1 : 0);
