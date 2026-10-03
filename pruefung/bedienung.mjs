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
    if (erwarteterFehler && /Failed to load resource: the server responded with a status of 40[09]/.test(m.text())) return;
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

console.log('\n== Vorhaben (V31b): Ansichten, Akte, Punkt, Ball ==');
{
  frisch();
  const p = await seite('/vorhaben.html');
  pruefe('Woche ist die Standardansicht', await p.locator('.vh-woche').count() === 1);
  pruefe('Überfällig steht oben', (await p.locator('.vh-wz').first().innerText()).includes('Überfällig'));
  pruefe('Band der Abwesenheit steht in der Woche', await p.locator('.vh-band').count() >= 1);
  await p.locator('[data-view="board"]').click();
  pruefe('Board hat sechs Spalten', await p.locator('.vh-col').count() === 6);
  pruefe('Spalte mit mehr als fünf trägt die Warnmarke', await p.locator('.vh-col.voll .vh-col-w').count() === 1);
  await p.locator('[data-view="liste"]').click();
  pruefe('Liste gruppiert nach Gruppen', await p.locator('.vh-l-g').count() >= 4);
  pruefe('Ansicht wird gemerkt', await p.evaluate(() => localStorage.getItem('gf_vh_view')) === 'liste');
  await p.locator('[data-filter="mir"]').click();
  const mir = await p.locator('.vh-l-z').count();
  pruefe('Filter „Bei mir“ zeigt Ball bei Alex, GF und extern mit Alex als Eigentümer', mir === 4, `${mir} Zeilen`);
  await p.locator('[data-filter="alle"]').click();
  await p.locator('.vh-l-z[data-open="xceed"]').click(); await p.waitForTimeout(300);
  pruefe('Akte öffnet sich mit Titel', (await p.locator('#vhAkte h2').innerText()).includes('XCeed'));
  pruefe('Link trägt die Akte', new URL(p.url()).searchParams.get('v') === 'xceed');
  await p.locator('#vhAkte input[data-toggle="p1"]').check(); await p.waitForTimeout(300);
  const t = letzte('punkt_toggle');
  pruefe('Haken schickt punkt_toggle mit by', t && t.nutzlast.id === 'p1' && t.nutzlast.erledigt === true && t.nutzlast.by === 'Alex', JSON.stringify(t && t.nutzlast));
  await p.locator('[data-ball-akte="alex"]').click(); await p.waitForTimeout(300);
  const b = letzte('vorhaben_save');
  pruefe('Ball geben an schickt den gesehenen Ball mit', b && b.nutzlast.ball === 'alex' && b.nutzlast.expect_ball === 'lea', JSON.stringify(b && b.nutzlast));
  await p.locator('[data-tab="verlauf"]').click();
  pruefe('Verlauf zeigt den Vorschlag mit Übernehmen', await p.locator('.vh-e.vorschlag [data-vstatus="bestaetigt"]').count() === 1);
  await p.locator('.vh-e.vorschlag [data-vstatus="bestaetigt"]').click(); await p.waitForTimeout(300);
  pruefe('Übernehmen schickt verlauf_status', letzte('verlauf_status')?.nutzlast.status === 'bestaetigt');
  await p.keyboard.press('Escape'); await p.waitForTimeout(200);
  pruefe('Escape schließt die Akte', await p.locator('#vhAkte').isHidden());
  await p.close();

  /* Ball weitergeben über den Dialog auf der Boardkarte, mit Pflichtname und Notiz. */
  frisch();
  const q = await seite('/vorhaben.html?view=board');
  const karte = q.locator('.vh-col[data-col="lea"] .vh-card[data-slug="xceed"]');
  await karte.hover();
  await karte.locator('.vh-weiter').click();
  pruefe('Dialog „Ball weitergeben“ öffnet', await q.locator('#vhModal.open .vh-dlg').count() === 1);
  await q.locator('#vhModal .chip[data-v="team"]').click();
  await q.locator('#vhBallOk').click(); await q.waitForTimeout(150);
  pruefe('Team ohne Namen wird nicht gesendet, das Feld meldet sich', !letzte('vorhaben_save') && await q.locator('#vhBallFehler').isVisible());
  await q.locator('#vhBallName').fill('Helge');
  await q.locator('#vhBallNotiz').fill('bitte bis Montag');
  await q.locator('#vhBallOk').click(); await q.waitForTimeout(500);
  const w = letzte('vorhaben_save');
  pruefe('Dialog schickt Ball, Name, Notiz und gesehenen Ball', w && w.nutzlast.ball === 'team' && w.nutzlast.ball_name === 'Helge' && w.nutzlast.notiz === 'bitte bis Montag' && w.nutzlast.expect_ball === 'lea', JSON.stringify(w && w.nutzlast));
  pruefe('Karte steht danach in der Spalte Team', await q.locator('.vh-col[data-col="team"] .vh-card[data-slug="xceed"]').count() === 1);
  /* Veralteter Stand: das Board zeigt noch Lea, im Backend liegt der Ball schon anders. */
  const v2 = q.locator('.vh-col[data-col="lea"] .vh-card[data-slug="subardo"]');
  await q.evaluate(() => { const v = DATA.vorhaben.find(x => x.slug === 'subardo'); v.ball = 'offen'; });
  erwarteterFehler = true;   // die 409 gehört zu dieser Probe
  await v2.hover(); await v2.locator('.vh-weiter').click();
  await q.locator('#vhModal .chip[data-v="alex"]').click(); await q.locator('#vhBallOk').click(); await q.waitForTimeout(400);
  erwarteterFehler = false;
  pruefe('Konflikt meldet sich mit dem aktuellen Stand', (await q.locator('#toast').innerText()).includes('inzwischen'));
  /* Name gehört zur Ballart: by nature liegt bei Team (Helge), der Wechsel zu extern leert das Feld. */
  const bn = q.locator('.vh-col[data-col="team"] .vh-card[data-slug="bynature"]');
  await bn.hover(); await bn.locator('.vh-weiter').click();
  await q.locator('#vhModal .chip[data-v="team"]').click();
  pruefe('bei gleicher Ballart steht der bisherige Name', await q.locator('#vhBallName').inputValue() === 'Helge');
  await q.locator('#vhModal .chip[data-v="extern"]').click();
  pruefe('Wechsel von Team zu extern leert den Namen', await q.locator('#vhBallName').inputValue() === '');
  /* Fokusfalle: zwanzig Mal Tab, der Fokus bleibt im Dialog; Escape gibt ihn an den Knopf zurück. */
  for (let i = 0; i < 20; i++) await q.keyboard.press('Tab');
  pruefe('Tab bleibt im Dialog', await q.evaluate(() => document.getElementById('vhModal').contains(document.activeElement)));
  pruefe('Hintergrund ist inert, solange der Dialog offen ist', await q.evaluate(() => document.getElementById('app').inert === true));
  await q.keyboard.press('Escape'); await q.waitForTimeout(150);
  const nachEsc = await q.evaluate(() => ({ offen: document.getElementById('vhModal').classList.contains('open'), fokus: document.activeElement?.className, inert: document.getElementById('app').inert }));
  pruefe('Escape schließt und gibt den Fokus zurück', !nachEsc.offen && /vh-weiter/.test(nachEsc.fokus || '') && nachEsc.inert === false, JSON.stringify(nachEsc));
  /* Tastatur: Karte mit Enter öffnen. */
  await q.locator('.vh-card[data-slug="lusatia"] .vh-open').focus();
  await q.keyboard.press('Enter'); await q.waitForTimeout(300);
  pruefe('Enter auf einer Karte öffnet die Akte', (await q.locator('#vhAkte h2').innerText()).includes('Lusatia'));
  await q.close();
  /* Punkt ändern: nur geänderte Felder, mit dem gesehenen Wert. */
  frisch();
  const r = await seite('/vorhaben.html?v=xceed');
  await r.locator('[data-punkt-edit="p1"]').click();
  await r.locator('.vh-punkt-form input[name="wer"]').fill('Niclaas und Lea');
  await r.locator('.vh-punkt-form button[type=submit]').click(); await r.waitForTimeout(300);
  const ps = letzte('punkt_save');
  pruefe('Punkt ändern schickt nur das geänderte Feld mit erwartetem Wert', ps && ps.nutzlast.wer === 'Niclaas und Lea' && ps.nutzlast.expect && ps.nutzlast.expect.wer === 'Niclaas'
    && ps.nutzlast.titel === undefined && ps.nutzlast.stand === undefined && ps.nutzlast.frist === undefined, JSON.stringify(ps && ps.nutzlast));
  await r.locator('#vhAkte textarea[data-feld="stand"]').fill('Neuer Stand'); await r.locator('#vhAkte h2').click(); await r.waitForTimeout(300);
  const vsv = letzte('vorhaben_save');
  pruefe('Stand speichert mit dem gesehenen Wert', vsv && vsv.nutzlast.stand === 'Neuer Stand' && vsv.nutzlast.expect && 'stand' in vsv.nutzlast.expect, JSON.stringify(vsv && vsv.nutzlast));
  await r.close();
}

console.log('\n== Für dich, Übergabe, Rückkehr (V31d) ==');
{
  frisch();
  const f = await seite('/index.html');
  pruefe('„Deine Vorhaben“ steht als erster Block', await f.evaluate(() => document.querySelector('#app section.fd')?.id) === 'fdVh');
  const zeilen = await f.locator('#fdVhL .fd-row').count();
  pruefe('Deine Vorhaben: Ball bei Alex oder GF, höchstens fünf', zeilen === 3, `${zeilen} Zeilen`);
  pruefe('sortiert nach Frist', (await f.locator('#fdVhL .fd-row .fd-title').first().innerText()).includes('Lusatia'));
  pruefe('Seit du zuletzt da warst: je Vorhaben eine Zeile', await f.locator('#fdSeitL .fd-row').count() === 2);
  pruefe('Ball seitdem zu mir gewechselt: Marke „wartet auf dich“', (await f.locator('#fdSeitL .fd-row').first().innerText()).includes('wartet auf dich'));
  await f.locator('#fdSeitOk').click(); await f.waitForTimeout(150);
  pruefe('Alles gesehen setzt den Zeitpunkt und leert den Block', !!(await f.evaluate(() => localStorage.getItem('gf_vh_seen_Alex'))) && await f.locator('#fdSeitL .fd-row').count() === 0);
  await f.close();

  frisch();
  const u = await seite('/uebergabe.html?id=abs-1');
  await u.locator('#nurV').uncheck();
  await u.waitForTimeout(200);
  const vh = u.locator('.ub-row', { hasText:'XCeed Ticketing-Vertrag' });
  pruefe('Übergabe zeigt die Vorhaben-Zeile mit dem Wort „Vorhaben“', await vh.count() === 1 && /^vorhaben/i.test(await vh.locator('.k').innerText()), `${await vh.count()} Zeilen`);
  pruefe('Titel führt in die Akte', (await vh.locator('.t a').getAttribute('href')) === 'vorhaben.html?v=xceed');
  await u.close();

  frisch();
  const r = await seite('/rueckkehr.html?id=abs-3');
  pruefe('Rückkehr hat „Deine Vorhaben zurück“', await r.locator('#vhSec').isVisible() && (await r.locator('#vhList').innerText()).includes('Ball zurück bei Alex'));
  pruefe('mit den Einträgen seit Beginn der Abwesenheit', (await r.locator('#vhList').innerText()).includes('Tranche bestätigt'));
  await r.close();

  /* Übergabe-Dialog als Lea: Feierabend, dann Urlaub mit der laufenden Abwesenheit. */
  frisch();
  const p = await seite('/vorhaben.html');
  await p.evaluate(() => { sessionStorage.setItem('gf_who', 'Lea'); document.dispatchEvent(new CustomEvent('gf-who', { detail:'Lea' })); });
  await p.locator('#vhUebergabe').click(); await p.waitForTimeout(150);
  pruefe('Übergabe fragt nach dem Anlass', await p.locator('[data-anlass]').count() === 3);
  await p.locator('[data-anlass="schicht"]').click();
  const reihen = await p.locator('.vh-ue-z').count();
  pruefe('Feierabend listet die Bälle bei Lea', reihen === 6, `${reihen} Zeilen`);
  await p.locator('.vh-ue-z').nth(1).locator('[data-v="bleibt"]').click();
  await p.locator('.vh-ue-z').nth(0).locator('.vh-ue-n').fill('Bürgschaft liegt im Ordner');
  await p.locator('#vhUeOk').click(); await p.waitForTimeout(300);
  const sw = letzte('schicht_uebergabe');
  pruefe('schicht_uebergabe: von Lea an Alex, gesehener Ball, Notiz, „bleibt“ ohne Notiz fällt weg',
    sw && sw.nutzlast.von === 'Lea' && sw.nutzlast.an === 'Alex' && sw.nutzlast.by === 'Lea' && sw.nutzlast.eintraege.length === 5
      && sw.nutzlast.eintraege.every(e => e.expect_ball === 'lea' && e.ball === 'alex') && sw.nutzlast.eintraege.some(e => e.notiz === 'Bürgschaft liegt im Ordner'), JSON.stringify(sw && sw.nutzlast).slice(0, 200));
  await p.locator('#vhUebergabe').click(); await p.waitForTimeout(150);
  await p.locator('[data-anlass="urlaub"]').click(); await p.waitForTimeout(400);
  pruefe('Urlaub nimmt die laufende Abwesenheit und zeigt die Vorhaben-Zeile', await p.locator('.vh-ue-z').count() === 1 && (await p.locator('.vh-ue').innerText()).includes('weitere Einträge im Korb'));
  await p.locator('.vh-ue-z [data-v="team"]').click();
  await p.locator('#vhUeSenden').click(); await p.waitForTimeout(150);
  pruefe('Team ohne Namen wird nicht gesendet', !letzte('handover_set_many') && (await p.locator('.vh-ew-fehler').count()) === 1);
  await p.locator('.vh-ue-z [data-v="ruht"]').click();
  await p.locator('#vhUeSenden').click(); await p.waitForTimeout(300);
  const hs = letzte('handover_set_many');
  pruefe('Ruht geht als Ampel ruht an handover_set_many', hs && hs.nutzlast.items.length === 1 && hs.nutzlast.items[0].id === 'hv1' && hs.nutzlast.items[0].ampel === 'ruht', JSON.stringify(hs && hs.nutzlast));
  await p.close();
}

console.log('\n== Einwurf (V31c) ==');
{
  frisch();
  const p = await seite('/vorhaben.html');
  await p.locator('#vhEinwurf').click();
  pruefe('Dialog fragt „Was ist passiert?“ mit Diktier-Hinweis', (await p.locator('#gfEwModal .vh-ew').innerText()).includes('Mikrofon der Tastatur'));
  await p.locator('#gfEwWeiter').click(); await p.waitForTimeout(150);
  pruefe('ohne Text geht nichts weiter', !letzte('einwurf_add') && (await p.locator('.vh-ew-fehler').count()) === 1);
  await p.locator('#gfEwText').fill('Telefonat mit Victor: Auszahlung ab Monat 1 schriftlich bis Montag');
  await p.locator('#gfEwWeiter').click(); await p.waitForTimeout(400);
  const add = letzte('einwurf_add');
  pruefe('einwurf_add mit Text, Kanal Knopf und by', add && add.nutzlast.kanal === 'knopf' && add.nutzlast.by === 'Alex' && /Victor/.test(add.nutzlast.text));
  pruefe('Erkannt zeigt das Vorhaben', (await p.locator('.vh-ew-erkannt').innerText()).includes('XCeed'));
  pruefe('Vorschlag als Haken: Verlauf, Punkt, neuer Punkt, Ball, Frist', await p.locator('.vh-ew-haken input[type=checkbox]').count() === 5);
  pruefe('Ball ist nicht vorausgewählt', !(await p.locator('[data-aus="ball"]').isChecked()));
  pruefe('Verworfenes ist sichtbar', (await p.locator('.vh-ew-verw').innerText()).includes('Nicht übernommen'));
  await p.locator('[data-aus="neu:0"]').uncheck();
  await p.locator('#gfEwModal .chip[data-v="sofort"]').click();
  await p.locator('#gfEwOk').click(); await p.waitForTimeout(400);
  const ap = letzte('einwurf_apply');
  pruefe('Übernehmen schickt Auswahl, Revision, gesehenen Ball und Benachrichtigung',
    ap && ap.nutzlast.revision === 'rev-1' && ap.nutzlast.expect_ball === 'lea' && ap.nutzlast.benachrichtigung === 'sofort'
      && ap.nutzlast.auswahl.verlauf === true && ap.nutzlast.auswahl.punkte.includes('p3') && ap.nutzlast.auswahl.neue_punkte.length === 0
      && ap.nutzlast.auswahl.ball === false && ap.nutzlast.auswahl.frist === true, JSON.stringify(ap && ap.nutzlast));
  pruefe('Dialog schließt, Akte zeigt den Verlauf', await p.locator('#gfEwModal.open').count() === 0 && new URL(p.url()).searchParams.get('tab') === 'verlauf');
  /* Warteschlange: Mail-Einwurf aus dem Abgleich */
  await p.locator('#vhWarte').click(); await p.waitForTimeout(400);
  pruefe('Warteschlange zeigt „1 von 1“ und die Herkunft', (await p.locator('#gfEwH').innerText()).includes('1 von 1') && (await p.locator('#gfEwModal').innerText()).includes('Mail · Lea'));
  await p.locator('#gfEwAendern').click();
  await p.locator('#gfEwModal .chip[data-v="vh-lusatia"]').click(); await p.waitForTimeout(400);
  pruefe('anderes Vorhaben holt einen neuen Vorschlag', letzte('einwurf_vorschlag')?.nutzlast.vorhaben_id === 'vh-lusatia');
  await p.locator('#gfEwSpaeter').click(); await p.waitForTimeout(200);
  pruefe('Später schließt ohne Entscheidung', await p.locator('#gfEwModal.open').count() === 0 && !gesendet.some(x => x.action === 'einwurf_verwerfen'));
  await p.close();
  frisch();
  const f = await seite('/index.html');
  pruefe('Für dich hat den Einwurf-Knopf', await f.locator('#fdEinwurf').isVisible());
  await f.locator('#fdEinwurf').click(); await f.waitForTimeout(300);
  pruefe('Einwurf öffnet auf Für dich', await f.locator('#gfEwModal.open').count() === 1);
  await f.close();
}

await browser.close();
server.close();
if (meldungen.length) { console.log('\nKonsolenmeldungen im letzten Fall:'); for (const m of meldungen) console.log('   ' + m.slice(0,200)); fehler += meldungen.length; }
console.log(fehler ? `\n${fehler} Abweichungen` : '\nAlle Bedienproben in Ordnung');
process.exit(fehler ? 1 : 0);
