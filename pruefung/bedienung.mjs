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
import { ANTWORT, FALLBACK, SCHREIBEND, TPA, zuruecksetzen, SCHALTER, VORHABEN, VK_SCHALTER } from './testdaten.mjs';

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
    if (erwarteterFehler && /Failed to load resource: the server responded with a status of (40[09]|500)/.test(m.text())) return;
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
  const nv = await p.locator('.vh-e.vorschlag').count(), nb = await p.locator('.vh-e.vorschlag [data-vstatus="bestaetigt"]').count();
  pruefe('Verlauf zeigt den Vorschlag mit Übernehmen', nb === 1, nv + ' Vorschläge, ' + nb + ' Knöpfe');
  /* Stand-Vorschlag: öffnet den Punkt mit dem vorgeschlagenen Stand, Speichern übernimmt beides. */
  await p.locator('[data-vstand="e5"]').click(); await p.waitForTimeout(200);
  pruefe('Stand-Vorschlag öffnet den Punkt mit dem neuen Stand', await p.locator('.vh-punkt-form input[name="stand"]').inputValue() === 'fertig übersetzt');
  await p.locator('.vh-punkt-form button[type=submit]').click(); await p.waitForTimeout(400);
  const vsd = letzte('vorschlag_stand');
  pruefe('Speichern übernimmt Stand und Vorschlag in einem Aufruf, mit dem gesehenen Stand', vsd && vsd.nutzlast.id === 'e5' && vsd.nutzlast.stand === 'fertig übersetzt' && vsd.nutzlast.expect_stand === 'in Arbeit' && !letzte('punkt_save'), JSON.stringify(vsd && vsd.nutzlast));
  await p.locator('[data-tab="verlauf"]').click(); await p.waitForTimeout(200);
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
  /* Konflikt beim Stand: der eigene Text bleibt stehen, auch nach dem Reiterwechsel. */
  erwarteterFehler = true;
  await r.locator('#vhAkte textarea[data-feld="stand"]').fill('KONFLIKT'); await r.locator('[data-tab="verlauf"]').click(); await r.waitForTimeout(500);
  await r.locator('[data-tab="prozess"]').click(); await r.waitForTimeout(300);
  erwarteterFehler = false;
  pruefe('nach Konflikt steht der eigene Text noch im Feld, mit Hinweis', await r.locator('#vhAkte textarea[data-feld="stand"]').inputValue() === 'KONFLIKT' && await r.locator('.vh-entwurf').count() === 1);
  /* Zuordnung lösen mit dem gesehenen Bezug */
  await r.locator('.vh-vk summary').first().click();
  await r.locator('[data-loesen="thema"]').first().click(); await r.waitForTimeout(300);
  const vk = letzte('vorhaben_verknuepfen');
  pruefe('Zuordnung lösen schickt den gesehenen Bezug', vk && vk.nutzlast.vorhaben_id === null && vk.nutzlast.expect_vorhaben_id === 'vh-xceed', JSON.stringify(vk && vk.nutzlast));
  await r.close();
}

console.log('\n== Kompass, Deine 5 Minuten heute (22.10.2026) ==');
{
  frisch();
  const s = await seite('/index.html'); await s.waitForTimeout(500);
  pruefe('Login und Seitenleiste heißen Kompass', (await s.title()).startsWith('Kompass') && !/Hohe/.test(await s.locator('body').innerText()));
  const zeilen = s.locator('#fd5L .fd5-row');
  pruefe('„Deine 5 Minuten heute“ steht oben mit drei Dingen', await zeilen.count() === 3 && await s.evaluate(() => document.querySelector('#app section.fd')?.id) === 'fd5');
  pruefe('ohne Mahnung: kein „wartet auf dich“, kein „überfällig“ auf Für dich', !/wartet auf dich|überfällig/i.test(await s.locator('#app').innerText()));
  const auswahl = await s.evaluate(() => { const k = Object.keys(localStorage).find(x => x.startsWith('gf_5min_Alex_')); return k ? JSON.parse(localStorage.getItem(k)) : null; });
  pruefe('Auswahl des Tages steht im Browser', Array.isArray(auswahl) && auswahl.length === 3, JSON.stringify(auswahl));
  const vh = (auswahl || []).find(x => x.k.startsWith('vh:'));
  if (vh) { const v = VORHABEN.find(x => 'vh:' + x.id === vh.k); v.ball = 'lea'; }
  await s.reload(); await s.waitForTimeout(500);
  pruefe('Ball weitergegeben: Zeile abgeräumt, Fortschritt „1 von 3“', !!vh && await s.locator('#fd5L .fd5-row.ab').count() === 1 && /1 von 3 abgeräumt/.test(await s.locator('#fd5Stand').innerText()), await s.locator('#fd5Stand').innerText());
  pruefe('Auswahl bleibt dieselbe (nicht neu gezogen)', await s.evaluate((k) => JSON.parse(localStorage.getItem(Object.keys(localStorage).find(x => x.startsWith('gf_5min_Alex_')))).length === 3 && document.body.innerText.includes(k), vh ? vh.t : ''));
  pruefe('Zähler in der Seitenleiste sind neutral (keine Warnfarbe)', await s.evaluate(() => { const b = [...document.querySelectorAll('.sb-nav .nbadge')].find(x => x.offsetParent); if (!b) return false; const c = getComputedStyle(b).backgroundColor; const w = getComputedStyle(document.documentElement).getPropertyValue('--warn').trim(); const t = document.createElement('i'); t.style.color = w; document.body.appendChild(t); const wc = getComputedStyle(t).color; t.remove(); return c !== wc; }));
  /* Alle drei abräumen: „Noch drei?“ holt die nächsten. */
  /* Wirklich weitergeben: Vorhaben-Ball an Lea, Entscheidungen im Pförtner an Lea (Testdaten), keine Speicherschlüssel fälschen. */
  const gates = ANTWORT.gate_list.items.map(x => x.gate);
  for (const x of auswahl || []) {
    if (x.k.startsWith('vh:')) { const v = VORHABEN.find(y => 'vh:' + y.id === x.k); if (v) v.ball = 'lea'; }
    else { const g = ANTWORT.gate_list.items.find(y => (y.kind === 'thema' ? 'th:' : 'kd:') + y.id === x.k); if (g) g.gate = 'lea'; }
  }
  await s.reload(); await s.waitForTimeout(500);
  pruefe('alle drei abgeräumt: Lob und „Noch drei?“', /Alles abgeräumt/.test(await s.locator('#fd5Stand').innerText()) && await s.locator('#fd5Mehr').count() === 1, await s.locator('#fd5Stand').innerText() + ' ' + JSON.stringify(auswahl.map(x => x.k)) + ' offen: ' + JSON.stringify(await s.locator('#fd5L .fd5-row:not(.ab) .fd-title').allTextContents()));
  if (await s.locator('#fd5Mehr').count()) { await s.locator('#fd5Mehr').click(); await s.waitForTimeout(200); }
  pruefe('„Noch drei?“ zeigt nur die neue Runde, keine abgeräumten aus der ersten', await s.locator('#fd5L .fd5-row').count() >= 1 && await s.locator('#fd5L .fd5-row.ab').count() === 0
    && !/abgeräumt ·/.test(await s.locator('#fd5Stand').innerText()), await s.locator('#fd5Stand').innerText());
  /* Personenwechsel: Leas Runde, nicht Alex' Einträge stehen lassen. */
  await s.locator('#whoSw button[data-w="Lea"]').click(); await s.waitForTimeout(600);
  const lea = await s.evaluate(() => { const k = Object.keys(localStorage).find(x => x.startsWith('gf_5min_Lea_')); return k ? JSON.parse(localStorage.getItem(k)).slice(-3).map(x => x.t) : null; });
  const sicht = await s.locator('#fd5L .fd-title').allTextContents();
  pruefe('Personenwechsel: Karte zeigt Leas eigene Tagesauswahl', !!lea && lea.length > 0 && JSON.stringify(sicht) === JSON.stringify(lea), JSON.stringify({ lea, sicht }));
  await s.close();
  ANTWORT.gate_list.items.forEach((x, i) => { x.gate = gates[i]; });
  /* Quelle fällt aus: vorläufige Auswahl mit Hinweis, nichts gespeichert. */
  frisch(); SCHALTER.vhListeFehler = true; erwarteterFehler = true;
  const q = await seite('/index.html'); await q.waitForTimeout(300);
  await q.evaluate(() => { for (const k of Object.keys(localStorage)) if (k.startsWith('gf_5min_')) localStorage.removeItem(k); }); await q.reload(); await q.waitForTimeout(500);
  pruefe('Vorhaben nicht geladen: Hinweis „vorläufig“, keine gespeicherte Tagesauswahl', /vorläufig/.test(await q.locator('#fd5L').innerText())
    && await q.evaluate(() => !Object.keys(localStorage).some(x => x.startsWith('gf_5min_Alex_'))));
  await q.close(); SCHALTER.vhListeFehler = false; erwarteterFehler = false;
  const h = await ctx.newPage(); await h.setViewportSize({ width:390, height:844 }); h.on('pageerror', e => meldungen.push('Skriptfehler: ' + e.message));
  await h.goto(BASE + '/index.html'); await h.waitForTimeout(800);
  pruefe('Für dich bei 390 px: 5-Minuten-Karte sichtbar, keine waagrechte Rollleiste', await h.locator('#fd5').isVisible() && await h.evaluate(() => document.documentElement.scrollWidth <= 390));
  await h.close();
}

console.log('\n== Neuigkeiten: Braucht dich, Vorhaben-Filter, Archiv (22.10.2026) ==');
{
  frisch();
  const n = await seite('/neuigkeiten.html');
  await n.waitForTimeout(300);
  const fokus = await n.locator('#fokusList').innerText();
  pruefe('Braucht dich zeigt „hoch“ und den Kandidaten zum eigenen Vorhaben', /Pressefrage zur Zeltwiese/.test(fokus) && /Ticketing für Lusatia anlegen/.test(fokus) && !/Helferplanung/.test(fokus), fokus.slice(0, 200));
  pruefe('Vorhaben mit Ball bei mir steht zuerst', (await n.locator('#fokusList .kd .kd-title').first().innerText()).includes('Lusatia'));
  pruefe('Archiviertes steht nirgends auf der Seite', !(await n.locator('#app').innerText()).includes('Alte Anfrage zur Zeltwiese'));
  pruefe('Ticker, Korb und Lage starten zugeklappt', await n.evaluate(() => ['ticker','korb','lage','archiv'].every(id => !document.getElementById(id).open)));
  pruefe('Chip „Lusatia · Vorverkauf · 2“ unter Zu deinen Vorhaben', /Lusatia · Vorverkauf · 2/.test(await n.locator('#vhChips').innerText()));
  await n.locator('#vhChips [data-vhf="vh-lusatia"]').click(); await n.waitForTimeout(300);
  const tk = await n.locator('#feed').textContent(), kb = await n.locator('#kand').textContent();
  pruefe('Chip filtert Ticker und Korb auf das Vorhaben und klappt sie auf', await n.evaluate(() => document.getElementById('ticker').open && document.getElementById('korb').open)
    && /Amt meldet sich/.test(tk) && !/Shuttle/.test(tk) && /Ticketing für Lusatia/.test(kb) && !/Pressefrage/.test(kb), tk.slice(0, 120) + ' | ' + kb.slice(0, 120));
  pruefe('aktiver Filter mit Link zur Akte', (await n.locator('.nw-vhf a').getAttribute('href')) === 'vorhaben.html?v=lusatia');
  await n.locator('.nw-vhf [data-vhf=""]').click(); await n.waitForTimeout(200);
  pruefe('Filter aufheben zeigt wieder alles', /Shuttle/.test(await n.locator('#feed').textContent()));
  /* Verwerfen direkt in „Braucht dich“ */
  const z = n.locator('#fokusList .kd[data-id="n9"]');
  pruefe('Kandidat zum Vorhaben hat „Zum Vorhaben“ mit Link zur Akte', await z.locator('a[href="vorhaben.html?v=lusatia"]').count() === 1);
  await z.locator('.kd-row').click(); await z.locator('[data-act="dismiss"]').click(); await n.waitForTimeout(300);
  const vw = letzte('news_update');
  pruefe('Verwerfen schickt news_update verworfen, Zeile verlässt „Braucht dich“', vw && vw.nutzlast.id === 'n9' && vw.nutzlast.status === 'verworfen'
    && await n.locator('#fokusList .kd[data-id="n9"]').count() === 0, JSON.stringify(vw && vw.nutzlast));
  /* Archiv durchsuchen und zurückholen */
  await n.locator('#archiv > summary').click(); await n.locator('#archivQ').fill('Zeltwiese'); await n.locator('#archivForm button[type=submit]').click(); await n.waitForTimeout(300);
  const as = letzte('news_list');
  pruefe('Archivsuche fragt das Backend mit archiv und Suchbegriff', as && as.nutzlast.archiv === true && as.nutzlast.q === 'Zeltwiese', JSON.stringify(as && as.nutzlast));
  pruefe('Archivtreffer erscheint mit Status archiviert', /Alte Anfrage zur Zeltwiese/.test(await n.locator('#archivList').innerText()) && /archiviert/.test(await n.locator('#archivList').innerText()));
  await n.locator('#archivList .kd[data-id="n8"] .kd-row').click(); await n.locator('#archivList .kd[data-id="n8"] [data-act="reopen"]').click(); await n.waitForTimeout(300);
  const ru = letzte('news_update');
  pruefe('Zurück in den Korb holt den Archivtreffer zurück', ru && ru.nutzlast.id === 'n8' && ru.nutzlast.status === 'neu' && await n.locator('#archivList .kd[data-id="n8"]').count() === 0
    && await n.locator('#kand .kd[data-id="n8"]').count() === 1, JSON.stringify(ru && ru.nutzlast));
  await n.close();
  /* Vorhaben lassen sich nicht laden: der Ausfall wird gesagt, „hoch“ bleibt sichtbar. */
  frisch(); SCHALTER.vhListeFehler = true; erwarteterFehler = true;
  const f = await seite('/neuigkeiten.html'); await f.waitForTimeout(400);
  pruefe('Ladefehler der Vorhaben: Hinweis in beiden Bereichen, „hoch“ bleibt', /Vorhaben nicht geladen/.test(await f.locator('#fokusList').innerText())
    && /ließen sich nicht laden/.test(await f.locator('#vhChips').innerText()) && /Pressefrage/.test(await f.locator('#fokusList').innerText()));
  await f.close(); SCHALTER.vhListeFehler = false;
  /* Neuigkeiten lassen sich nicht laden: der Fehler steht oben und bleibt auch nach einer Filterbedienung. */
  SCHALTER.newsFehler = true;
  const g = await seite('/neuigkeiten.html'); await g.waitForTimeout(400);
  await g.locator('#whoSegs .seg[data-w="Lea"]').click(); await g.waitForTimeout(200);
  /* Wortlaut seit dem Webapp Standard (gfLadefehler): „Nicht geladen. Laden fehlgeschlagen: …“ mit „Erneut laden“. */
  pruefe('Ladefehler bleibt nach Filterbedienung oben sichtbar', /Fehler beim Laden|Nicht geladen/.test(await g.locator('#fokusList').innerText()));
  await g.close(); SCHALTER.newsFehler = false; erwarteterFehler = false;
  const h = await ctx.newPage(); await h.setViewportSize({ width:390, height:844 }); h.on('pageerror', e => meldungen.push('Skriptfehler: ' + e.message));
  await h.goto(BASE + '/neuigkeiten.html'); await h.waitForTimeout(800);
  pruefe('Neuigkeiten bei 390 px ohne waagrechte Rollleiste, Braucht dich sichtbar', await h.evaluate(() => document.documentElement.scrollWidth <= 390) && await h.locator('#fokus').isVisible());
  await h.close();
}

console.log('\n== Vorhaben abschließen, Erledigt, Wieder öffnen (21.10.2026) ==');
{
  frisch();
  const a = await seite('/vorhaben.html?v=xceed');
  await a.locator('#vhAkte [data-erledigt]').click(); await a.waitForTimeout(200);
  pruefe('„✓ Erledigt“ öffnet das Blatt', await a.locator('#vhModal.open .vh-blatt').count() === 1);
  /* Konflikt beim Abschließen: das Blatt schließt, die Akte lädt neu, nichts bleibt auf altem Stand stehen. */
  await a.keyboard.press('Escape'); await a.waitForTimeout(200);
  SCHALTER.abschlussKonflikt = true; erwarteterFehler = true;
  await a.locator('#vhAkte [data-erledigt]').click(); await a.waitForTimeout(200);
  await a.locator('#vhErlOk').click(); await a.waitForTimeout(500);
  erwarteterFehler = false;
  pruefe('Konflikt beim Abschließen: Blatt zu, Akte offen', await a.locator('#vhModal.open').count() === 0 && await a.locator('#vhAkte [data-erledigt]').isVisible());
  await a.locator('#vhAkte [data-erledigt]').click(); await a.waitForTimeout(200);
  await a.keyboard.press('Escape'); await a.waitForTimeout(200);
  pruefe('Escape schließt nur das Blatt, die Akte bleibt offen', await a.locator('#vhModal.open').count() === 0 && await a.locator('#vhAkte').isVisible());
  await a.locator('#vhAkte [data-erledigt]').click(); await a.waitForTimeout(200);
  const hp = a.locator('#vhErlPunkte'), ht = a.locator('#vhErlThemen');
  pruefe('Haken offene Punkte an (5), Themen aus (10)', await hp.isChecked() && !(await ht.isChecked())
    && /\(5\)/.test(await a.locator('label:has(#vhErlPunkte)').innerText()) && /\(10\)/.test(await a.locator('label:has(#vhErlThemen)').innerText()));
  await a.locator('#vhErlSatz').fill('Vertrag unterschrieben am 19.10.');
  await a.locator('#vhErlOk').click(); await a.waitForTimeout(400);
  const ab = letzte('vorhaben_abschliessen');
  pruefe('Abschließen schickt Ergebnis, Punkte an, Themen aus und den gesehenen Stand', ab && ab.nutzlast.id === 'vh-xceed' && ab.nutzlast.ergebnis === 'Vertrag unterschrieben am 19.10.'
    && ab.nutzlast.punkte_mit === true && ab.nutzlast.themen_mit === false && !!ab.nutzlast.expect && ab.nutzlast.by === 'Alex', JSON.stringify(ab && ab.nutzlast));
  pruefe('danach: Akte zu, Karte weg, Hinweis mit Rückgängig', await a.locator('#vhAkte').isHidden() && await a.locator('#vhMain [data-open="xceed"]').count() === 0
    && await a.locator('#vhRueck.show #vhRueckK').isVisible() && /XCeed Ticketing-Vertrag erledigt/.test(await a.locator('#vhRueck').innerText()));
  /* Störung beim Rückgängig: der Hinweis bleibt mit „Noch einmal?“, der zweite Versuch schickt denselben Wert. */
  SCHALTER.wiederFehler = true; erwarteterFehler = true;
  await a.locator('#vhRueckK').click(); await a.waitForTimeout(400);
  erwarteterFehler = false;
  pruefe('Störung beim Rückgängig: Hinweis bleibt mit erneutem Versuch', await a.locator('#vhRueck.show #vhRueckK').isEnabled() && /Noch einmal/.test(await a.locator('#vhRueck').innerText()));
  await a.locator('#vhRueckK').click(); await a.waitForTimeout(400);
  const wr = letzte('vorhaben_wiedereroeffnen');
  pruefe('Rückgängig schickt genau die zurückgegebenen Kennungen', wr && wr.nutzlast.id === 'vh-xceed' && wr.nutzlast.rueckgaengig && wr.nutzlast.rueckgaengig.punkte.length === 5 && wr.nutzlast.rueckgaengig.themen.length === 0 && !!wr.nutzlast.rueckgaengig.zeit, JSON.stringify(wr && wr.nutzlast));
  pruefe('nach Rückgängig ist die Karte wieder da', await a.locator('#vhMain [data-open="xceed"]').count() > 0);
  /* Fokus: Akte per Tastatur öffnen, mit Escape schließen, der Fokus steht wieder auf der Karte. */
  await a.locator('#vhMain [data-open="lusatia"]').first().focus(); await a.keyboard.press('Enter'); await a.waitForTimeout(400);
  await a.locator('#vhAkte h2').focus(); await a.keyboard.press('Escape'); await a.waitForTimeout(200);
  pruefe('Escape schließt die Akte, Fokus zurück auf dem auslösenden Knopf', await a.evaluate(() => document.activeElement?.dataset?.open === 'lusatia'), await a.evaluate(() => document.activeElement?.outerHTML.slice(0, 80)));
  await a.close();

  /* Liste: Kreis am Zeilenanfang öffnet dasselbe Blatt; Themen-Haken an schickt themen_mit. */
  frisch();
  const l = await seite('/vorhaben.html?view=liste');
  await l.locator('[data-fertig="lusatia"]').click(); await l.waitForTimeout(200);
  pruefe('Kreis in der Liste öffnet das Blatt', /Lusatia/.test(await l.locator('#vhModal.open .vh-blatt').innerText()));
  await l.locator('#vhErlThemen').check(); await l.locator('#vhErlOk').click(); await l.waitForTimeout(400);
  const al = letzte('vorhaben_abschliessen');
  pruefe('Liste: Abschließen mit Themen-Haken', al && al.nutzlast.id === 'vh-lusatia' && al.nutzlast.themen_mit === true && al.nutzlast.ergebnis === undefined, JSON.stringify(al && al.nutzlast));
  pruefe('Liste: Zeile verschwindet', await l.locator('.vh-l-z[data-open="lusatia"]').count() === 0);
  /* Filter Erledigt: gedämpfte Zeilen mit Datum und Ergebnis, Akte nur lesend, Wieder öffnen. */
  await l.locator('[data-filter="erledigt"]').click(); await l.waitForTimeout(400);
  pruefe('Filter Erledigt zeigt die erledigten mit Ergebnis', await l.locator('.vh-erl-z').count() === 2 && /Rechnung bezahlt/.test(await l.locator('.vh-erl').innerText()) && /erledigt/.test(await l.locator('.vh-erl-d').first().innerText()));
  pruefe('Filterchip zählt die erledigten', /Erledigt · 2/.test(await l.locator('[data-filter="erledigt"]').innerText()));
  pruefe('Erledigt gruppiert: Letzte 90 Tage', /Letzte 90 Tage/.test(await l.locator('#vhMain').innerText()));
  await l.locator('.vh-erl-z[data-open="saal-alt"]').click(); await l.waitForTimeout(400);
  pruefe('Akte eines erledigten: Erledigt am, nur lesend, Wieder öffnen', /Erledigt am/.test(await l.locator('.vh-a-erl').innerText()) && await l.locator('[data-wieder]').isVisible()
    && await l.locator('[data-erledigt]').count() === 0 && await l.locator('[data-punkt-neu]').count() === 0 && await l.locator('[data-ball-akte]').count() === 0
    && await l.locator('#vhAkte textarea[data-feld="stand"]').getAttribute('readonly') !== null);
  const vor = gesendet.length;
  await l.locator('#vhAkte textarea[data-feld="stand"]').click(); await l.keyboard.type('x'); await l.locator('#vhAkte h2').click(); await l.waitForTimeout(200);
  pruefe('nur lesend: Tippen ins Feld speichert nichts', !gesendet.slice(vor).some(x => x.action === 'vorhaben_save'));
  await l.locator('[data-wieder]').click(); await l.waitForTimeout(500);
  const wo = letzte('vorhaben_wiedereroeffnen');
  pruefe('Wieder öffnen ohne Rückgängig, Filter zurück auf Alle, Akte offen', wo && wo.nutzlast.id === 'vh-saal-alt' && wo.nutzlast.rueckgaengig === undefined
    && await l.locator('[data-filter="alle"].on').count() === 1 && await l.locator('#vhAkte [data-erledigt]').isVisible(), JSON.stringify(wo && wo.nutzlast));
  /* Menü ⋯: Pausieren mit gesehenem Status, Archivieren nur nach Rückfrage. */
  await l.locator('[data-menu]').click();
  pruefe('Menü ⋯ zeigt Pausieren und Archivieren', await l.locator('#vhMenu').isVisible() && /Pausieren/.test(await l.locator('#vhMenu').innerText()));
  await l.locator('#vhMenu [data-status="pausiert"]').click(); await l.waitForTimeout(400);
  const ps = letzte('vorhaben_save');
  pruefe('Pausieren schickt status pausiert mit erwartetem Status', ps && ps.nutzlast.status === 'pausiert' && ps.nutzlast.expect && ps.nutzlast.expect.status === 'aktiv', JSON.stringify(ps && ps.nutzlast));
  await l.locator('[data-menu]').click();
  pruefe('nach dem Pausieren heißt der Eintrag Fortsetzen', /Fortsetzen/.test(await l.locator('#vhMenu').innerText()));
  await l.locator('#vhMenu [data-archiv]').click(); await l.waitForTimeout(200);
  const vorA = gesendet.length;
  pruefe('Archivieren fragt erst nach', await l.locator('#vhArchOk').isVisible() && !gesendet.slice(vorA).some(x => x.action === 'vorhaben_save'));
  await l.locator('#vhArchOk').click(); await l.waitForTimeout(400);
  const pa = letzte('vorhaben_save');
  pruefe('Archivieren schickt status archiviert', pa && pa.nutzlast.status === 'archiviert' && pa.nutzlast.expect.status === 'pausiert' && await l.locator('#vhAkte').isHidden(), JSON.stringify(pa && pa.nutzlast));
  await l.close();

  /* ?filter=erledigt im Link: Wechsel auf Alle nimmt den Parameter heraus. */
  frisch();
  const u = await seite('/vorhaben.html?filter=erledigt');
  await u.locator('[data-filter="alle"]').click(); await u.waitForTimeout(200);
  pruefe('Filter Erledigt auch ohne Parameter im Link teilbar', await (async () => { await u.locator('[data-filter="erledigt"]').click(); await u.waitForTimeout(300); const ja = new URL(u.url()).searchParams.get('filter') === 'erledigt'; await u.locator('[data-filter="alle"]').click(); await u.waitForTimeout(200); return ja; })());
  pruefe('Filterwechsel führt den Link nach', !new URL(u.url()).searchParams.has('filter'), u.url());
  await u.close();

  /* Handy 390 px: das Blatt kommt von unten. */
  frisch();
  const h = await ctx.newPage(); await h.setViewportSize({ width:390, height:844 }); h.on('pageerror', e => meldungen.push('Skriptfehler: ' + e.message));
  await h.goto(BASE + '/vorhaben.html?v=xceed'); await h.waitForTimeout(700);
  await h.locator('#vhAkte [data-erledigt]').click(); await h.waitForTimeout(300);
  const bb = await h.locator('#vhModal .vh-blatt').boundingBox();
  pruefe('Handy: Blatt steht unten, volle Breite', bb && Math.abs(bb.y + bb.height - 844) < 2 && bb.width >= 389, JSON.stringify(bb));
  pruefe('Handy: keine waagrechte Rollleiste', await h.evaluate(() => document.documentElement.scrollWidth <= 390));
  await h.locator('#vhErlOk').click(); await h.waitForTimeout(400);
  const rb = await h.locator('#vhRueck').boundingBox();
  pruefe('Handy: Hinweis mit Rückgängig passt in die Breite', rb && rb.x >= 0 && rb.x + rb.width <= 390, JSON.stringify(rb));
  await h.close();
}

console.log('\n== Für dich, Übergabe, Rückkehr (V31d) ==');
{
  frisch();
  const f = await seite('/index.html');
  /* Seit 25.10.2026 steht „Verkauf 2027“ zwischen beiden (docs/PAKET-VERKAUF-2027.md). */
  pruefe('„Deine Vorhaben“ folgt auf „Deine 5 Minuten heute“ und „Verkauf 2027“', await f.evaluate(() => [...document.querySelectorAll('#app section.fd')].slice(0, 3).map(x => x.id).join()) === 'fd5,fdVk,fdVh');
  const zeilen = await f.locator('#fdVhL .fd-row').count();
  pruefe('Deine Vorhaben: Ball bei Alex oder GF, höchstens fünf', zeilen === 3, `${zeilen} Zeilen`);
  pruefe('sortiert nach Frist', (await f.locator('#fdVhL .fd-row .fd-title').first().innerText()).includes('Lusatia'));
  pruefe('Seit du zuletzt da warst: je Vorhaben eine Zeile', await f.locator('#fdSeitL .fd-row').count() === 2);
  pruefe('Ball seitdem zu mir gewechselt: Marke „für dich bereit“', (await f.locator('#fdSeitL .fd-row').first().innerText()).includes('für dich bereit'));
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
  pruefe('Rückübergabe ist bedienbar, sobald die Vorhaben geladen sind', !(await r.locator('#endBtn').isDisabled()));
  await r.close();
  SCHALTER.rueckkehrFehler = true; erwarteterFehler = true;
  const r2 = await seite('/rueckkehr.html?id=abs-3');
  pruefe('Ladefehler: Hinweis mit Neuladen, Rückübergabe gesperrt', (await r2.locator('#vhList').innerText()).includes('noch einmal laden') && await r2.locator('#endBtn').isDisabled());
  SCHALTER.rueckkehrFehler = false;
  await r2.locator('#vhNochmal').click(); await r2.waitForTimeout(400);
  pruefe('nach erfolgreichem Neuladen wieder bedienbar', !(await r2.locator('#endBtn').isDisabled()));
  erwarteterFehler = false; await r2.close();

  /* Übergabe-Dialog als Lea: Feierabend, dann Urlaub mit der laufenden Abwesenheit. */
  frisch();
  const p = await seite('/vorhaben.html');
  await p.evaluate(() => { sessionStorage.setItem('gf_who', 'Lea'); document.dispatchEvent(new CustomEvent('gf-who', { detail:'Lea' })); });
  await p.locator('#vhUebergabe').click(); await p.waitForTimeout(150);
  pruefe('Übergabe fragt nach dem Anlass', await p.locator('[data-anlass]').count() === 3);
  await p.locator('[data-anlass="schicht"]').click();
  const reihen = await p.locator('.vh-ue-z').count();
  pruefe('Feierabend listet die Bälle bei Lea', reihen === 6, `${reihen} Zeilen`);
  pruefe('Vorauswahl ist „bleibt bei mir“', await p.locator('.vh-ue-z [data-v="bleibt"].on').count() === 6);
  await p.locator('.vh-ue-z').nth(0).locator('[data-v="andere"]').click();
  await p.locator('.vh-ue-z').nth(2).locator('[data-v="andere"]').click();
  await p.locator('.vh-ue-z').nth(0).locator('.vh-ue-n').fill('Bürgschaft liegt im Ordner');
  await p.locator('.vh-ue-z').nth(3).locator('.vh-ue-n').fill('nur zur Info');
  await p.locator('#vhUeOk').click(); await p.waitForTimeout(300);
  const sw = letzte('schicht_uebergabe');
  pruefe('schicht_uebergabe: von Lea an Alex, gesehener Ball, Notiz, „bleibt“ ohne Notiz fällt weg',
    sw && sw.nutzlast.von === 'Lea' && sw.nutzlast.an === 'Alex' && sw.nutzlast.by === 'Lea'
      && sw.nutzlast.eintraege.length === 3 && sw.nutzlast.eintraege.every(e => e.expect_ball === 'lea')
      && sw.nutzlast.eintraege.filter(e => e.ball === 'alex').length === 2 && sw.nutzlast.eintraege.some(e => e.ball === 'lea' && e.notiz === 'nur zur Info')
      && sw.nutzlast.eintraege.some(e => e.notiz === 'Bürgschaft liegt im Ordner'), JSON.stringify(sw && sw.nutzlast).slice(0, 300));
  await p.locator('#vhUebergabe').click(); await p.waitForTimeout(150);
  await p.locator('[data-anlass="urlaub"]').click(); await p.waitForTimeout(200);
  pruefe('Urlaub fragt nach der Abwesenheit, auch wenn es nur eine gibt', await p.locator('[data-abw]').count() === 1 && await p.locator('[data-abw-neu]').count() === 1);
  await p.locator('[data-abw]').click(); await p.waitForTimeout(400);
  pruefe('Urlaub nimmt die gewählte Abwesenheit und zeigt die Vorhaben-Zeile', await p.locator('.vh-ue-z').count() === 1 && (await p.locator('.vh-ue').innerText()).includes('weitere Einträge im Korb'));
  await p.locator('.vh-ue-z [data-v="team"]').click();
  await p.locator('#vhUeSenden').click(); await p.waitForTimeout(150);
  pruefe('Team ohne Namen wird nicht gesendet', !letzte('handover_set_many') && (await p.locator('.vh-ew-fehler').count()) === 1);
  await p.locator('.vh-ue-z [data-v="ruht"]').click();
  await p.locator('#vhUeSenden').click(); await p.waitForTimeout(300);
  const hs = letzte('handover_set_many');
  pruefe('Ruht geht als Ampel ruht an handover_set_many, mit dem gesehenen Stand', hs && hs.nutzlast.items.length === 1 && hs.nutzlast.items[0].id === 'hv1' && hs.nutzlast.items[0].ampel === 'ruht'
    && hs.nutzlast.items[0].expect && hs.nutzlast.items[0].expect.status === 'bestaetigt' && hs.nutzlast.items[0].expect.vertretung === 'Alex', JSON.stringify(hs && hs.nutzlast));
  /* Bestätigte Zeile unverändert: nichts wird gesendet. */
  gesendet.length = 0;
  await p.locator('#vhUebergabe').click(); await p.waitForTimeout(150);
  await p.locator('[data-anlass="urlaub"]').click(); await p.waitForTimeout(200);
  await p.locator('[data-abw]').click(); await p.waitForTimeout(400);
  pruefe('bestätigte Zeile zeigt ihren Stand', (await p.locator('.vh-ue-z').innerText()).includes('entschieden'));
  await p.locator('#vhUeSenden').click(); await p.waitForTimeout(300);
  pruefe('unveränderte bestätigte Zeile wird nicht gesendet', !letzte('handover_set_many'));
  await p.close();
}

console.log('\n== Einwurf (V31c) ==');
{
  frisch();
  const p = await seite('/vorhaben.html');
  await p.locator('#vhEinwurf').click(); await p.waitForSelector('#gfEwText');
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
  /* KI fällt aus: Wahl von Hand ohne neuen KI-Aufruf, Verlaufstext Pflicht. */
  frisch();
  const k = await seite('/vorhaben.html');
  await k.locator('#vhEinwurf').click(); await k.waitForTimeout(300);
  await k.locator('#gfEwText').fill('AUSFALL: Telefonat mit Jane'); await k.locator('#gfEwWeiter').click(); await k.waitForTimeout(400);
  pruefe('ohne Vorschlag: Hinweis und Wahl von Hand', (await k.locator('#gfEwModal').innerText()).includes('ohne Vorschlag') && await k.locator('#gfEwZiel2').count() === 1);
  await k.locator('#gfEwModal .chip[data-v="vh-booking"]').click(); await k.waitForTimeout(300);
  pruefe('Wahl von Hand fragt die KI nicht erneut', !letzte('einwurf_vorschlag') && await k.locator('#gfEwKi').count() === 1);
  await k.locator('#gfEwVerlauf').fill('');
  await k.locator('#gfEwOk').click(); await k.waitForTimeout(200);
  pruefe('leerer Verlaufstext wird nicht gesendet und bleibt leer', !letzte('einwurf_apply') && (await k.locator('.vh-ew-fehler').innerText()).includes('Verlaufseintrag') && await k.locator('#gfEwVerlauf').inputValue() === '');
  await k.locator('#gfEwVerlauf').fill('Telefonat mit Jane über die Standards.');
  await k.locator('#gfEwOk').click(); await k.waitForTimeout(400);
  const ka = letzte('einwurf_apply');
  pruefe('übernommen wird nur der Verlauf mit dem eigenen Text', ka && ka.nutzlast.vorhaben_id === 'vh-booking' && ka.nutzlast.auswahl.verlauf === true && !ka.nutzlast.auswahl.ball && ka.nutzlast.bearbeitet.verlauf_text === 'Telefonat mit Jane über die Standards.', JSON.stringify(ka && ka.nutzlast));
  /* Zielwechsel scheitert: „sofort“ aus dem alten Vorschlag gilt nicht weiter. */
  await k.locator('#vhEinwurf').click(); await k.waitForTimeout(300);
  await k.locator('#gfEwText').fill('Telefonat mit Victor'); await k.locator('#gfEwWeiter').click(); await k.waitForTimeout(400);
  await k.locator('#gfEwModal .chip[data-v="sofort"]').click();
  await k.locator('#gfEwBearb').click(); await k.locator('#gfEwVerlauf').fill('Text zum alten Vorhaben');
  await k.locator('#gfEwAendern').click(); await k.locator('#gfEwModal .chip[data-v="vh-lusatia"]').click(); await k.waitForTimeout(400);
  pruefe('Zielwechsel verwirft den bearbeiteten Text und zeigt den neuen Vorschlag', !(await k.locator('#gfEwModal').innerText()).includes('Text zum alten Vorhaben') && (await k.locator('#gfEwModal').innerText()).includes('Neu geprüft.'));
  await k.locator('#gfEwModal .chip[data-v="sofort"]').click();
  erwarteterFehler = true;
  await k.locator('#gfEwAendern').click(); await k.locator('#gfEwModal .chip[data-v="vh-gls"]').click(); await k.waitForTimeout(400);
  pruefe('gescheiterter Zielwechsel: Fehler sichtbar, Benachrichtigung zurück auf Morgenbericht', (await k.locator('.vh-ew-fehler').innerText()).includes('Kein neuer Vorschlag') && await k.locator('#gfEwModal .chip[data-v="morgen"].on').count() === 1);
  /* Konflikt beim Übernehmen: Meldung bleibt im Dialog. */
  await k.locator('#gfEwAendern').click(); await k.locator('#gfEwModal .chip[data-v="vh-subardo"]').click(); await k.waitForTimeout(400);
  await k.locator('#gfEwOk').click(); await k.waitForTimeout(400);
  pruefe('Konflikt beim Übernehmen bleibt sichtbar im Dialog', (await k.locator('.vh-ew-fehler').innerText()).includes('inzwischen') && await k.locator('#gfEwModal.open').count() === 1);
  erwarteterFehler = false;
  await k.keyboard.press('Escape'); await k.close();
  /* Handy: Dialog bei 390 px, Fokus bleibt drin. */
  const h = await ctx.newPage(); await h.setViewportSize({ width:390, height:844 }); h.on('pageerror', e => meldungen.push('Skriptfehler: ' + e.message));
  await h.goto(BASE + '/vorhaben.html'); await h.waitForTimeout(700);
  await h.locator('#vhFab').click(); await h.waitForTimeout(300);
  for (let i = 0; i < 15; i++) await h.keyboard.press('Tab');
  const box = await h.locator('#gfEwModal .modal').boundingBox();
  pruefe('Einwurf am Handy: Vollbild und Fokus bleibt im Dialog', box && box.width >= 389 && await h.evaluate(() => document.getElementById('gfEwModal').contains(document.activeElement)));
  await h.close();
  frisch();
  const f = await seite('/index.html');
  pruefe('Für dich hat den Einwurf-Knopf', await f.locator('#fdEinwurf').isVisible());
  await f.locator('#fdEinwurf').click(); await f.waitForTimeout(300);
  pruefe('Einwurf öffnet auf Für dich', await f.locator('#gfEwModal.open').count() === 1);
  await f.close();
}

console.log('\n== Verkauf 2027 auf Für dich (25.10.2026) ==');
{
  frisch();
  const s = await seite('/index.html'); await s.waitForTimeout(600);
  const ids = await s.evaluate(() => [...document.querySelectorAll('#app section.fd')].map(x => x.id));
  pruefe('Verkauf 2027 steht direkt unter „Deine 5 Minuten heute“', ids[0] === 'fd5' && ids[1] === 'fdVk', ids.join(','));
  const kacheln = s.locator('#fdVkL button.kk[data-vk]');
  pruefe('eine Kachel je Festival (5), als Knopf', await kacheln.count() === 5);
  const kopf = await s.locator('#fdVkKopf').innerText();
  pruefe('Kopfzeile: Summe gegen 21.000 und ältester Stand mit Mahnung ab 8 Tagen', /2\.387\s+von 21\.000 Tickets/.test(kopf) && /ältester Stand 12 Tage/.test(kopf) && await s.locator('#fdVkKopf .zst.warn').count() === 1, kopf);
  const fl = s.locator('#fdVkL [data-vk="fluidity"]'), wm = s.locator('#fdVkL [data-vk="wilde-moehre"]');
  pruefe('unter Plan: Ton warn mit Wort, nicht Farbe allein', (await fl.getAttribute('class')).includes('warn') && /unter Plan/.test(await fl.innerText()));
  pruefe('im Plan: Ton pos mit Wort und Trend gegen die Vorwoche', (await wm.getAttribute('class')).includes('pos') && /im Plan/.test(await wm.innerText()) && /\+170/.test(await wm.innerText()) && /steigt/.test(await wm.locator('.kk-trend').innerText()));
  pruefe('Einheit ist das Ziel, darunter „Stand TT.MM.“', /\/ 5\.000/.test(await fl.innerText()) && /Stand \d\d\.\d\d\./.test(await fl.innerText()));
  pruefe('ohne VVK-Start „Start offen“, ohne Stand „noch kein Stand“', /Start offen/.test(await s.locator('#fdVkL [data-vk="lusatia"]').innerText()) && /noch kein Stand/.test(await s.locator('#fdVkL [data-vk="draussenbande"]').innerText()));
  const bn = await s.locator('#fdVkL [data-vk="by-nature"]').innerText();
  pruefe('ohne Stand und VVK in der Zukunft: „noch kein Stand“ und „VVK ab …“', /noch kein Stand/.test(bn) && /VVK ab \d\d\.\d\d\./.test(bn), bn);
  const hoehe = await kacheln.first().evaluate(e => e.getBoundingClientRect().height);
  pruefe('Kachel ist mindestens 44 px hoch', hoehe >= 44, String(hoehe));
  /* Tastatur: Kachel öffnet die Eingabe, Fokus im Tickets-Feld, Escape schließt und gibt den Fokus zurück. */
  await s.locator('#fdVkL [data-vk="draussenbande"]').focus(); await s.keyboard.press('Enter'); await s.waitForTimeout(300);
  pruefe('Kachel öffnet per Tastatur die Eingabe, Fokus auf Tickets', await s.locator('#vkModal.open [role=dialog]').count() === 1 && await s.evaluate(() => document.activeElement?.id) === 'vkTk');
  pruefe('genau ein Primärknopf „Speichern“', await s.locator('#vkModal .btn-primary').count() === 1 && (await s.locator('#vkModal .btn-primary').innerText()).trim() === 'Speichern');
  pruefe('Stichtag steht auf heute', await s.locator('#vkTag').inputValue() === await s.evaluate(() => VK.heute));
  await s.keyboard.press('Escape'); await s.waitForTimeout(200);
  pruefe('Escape schließt, Fokus zurück auf der Kachel', await s.locator('#vkModal.open').count() === 0 && await s.evaluate(() => document.activeElement?.dataset?.vk) === 'draussenbande');
  /* Ungültige Eingabe: kein Aufruf, Hinweis am Feld. */
  await s.locator('#fdVkL [data-vk="draussenbande"]').click(); await s.waitForTimeout(200);
  await s.locator('#vkTk').fill('12a'); await s.locator('#vkModal .btn-primary').click(); await s.waitForTimeout(150);
  pruefe('Tickets keine ganze Zahl: Hinweis, nichts gesendet', /ganze Zahl/.test(await s.locator('#vkErr').innerText()) && !letzte('verkauf_set'));
  await s.locator('#vkTk').fill('40'); await s.locator('#vkEu').fill('abc'); await s.locator('#vkModal .btn-primary').click(); await s.waitForTimeout(150);
  pruefe('Umsatz kein Betrag: Hinweis, nichts gesendet', /Betrag/.test(await s.locator('#vkErr').innerText()) && !letzte('verkauf_set'));
  /* Speichern mit Teststand (Notiz „Test“), danach neue Kachel, Fokus und letzte Stände. */
  await s.locator('#vkEu').fill('1.234,50'); await s.locator('#vkNo').fill('Test'); await s.locator('#vkModal .btn-primary').click(); await s.waitForTimeout(500);
  const g = letzte('verkauf_set');
  pruefe('Speichern schickt verkauf_set mit Festival, Stichtag, Tickets, Euro, Notiz und Person', g && g.nutzlast.festival_key === 'draussenbande' && g.nutzlast.tickets === 40 && g.nutzlast.umsatz_euro === 1234.5 && g.nutzlast.notiz === 'Test' && g.nutzlast.by === 'Alex' && /^\d{4}-\d\d-\d\d$/.test(g.nutzlast.stichtag), JSON.stringify(g && g.nutzlast));
  const db = s.locator('#fdVkL [data-vk="draussenbande"]');
  pruefe('nach dem Speichern: Dialog zu, Kachel zeigt 40 und Fokus steht auf ihr', await s.locator('#vkModal.open').count() === 0 && /^40/.test((await db.locator('.kk-v .ht-num').innerText()).trim()) && await s.evaluate(() => document.activeElement?.dataset?.vk) === 'draussenbande');
  await db.click(); await s.waitForTimeout(200);
  const verlauf = await s.locator('#vkModal .vk-verlauf li').allInnerTexts();
  pruefe('letzte Stände im Dialog zeigen den Teststand mit Notiz', verlauf.length === 1 && /40/.test(verlauf[0]) && /Test/.test(verlauf[0]) && /1\.234,50/.test(verlauf[0]), verlauf.join(' | '));
  pruefe('erneut geöffnet: Handeingabe des Stichtags mit allen Feldern vorbelegt', await s.locator('#vkTk').inputValue() === '40' && await s.locator('#vkEu').inputValue() === '1234,5' && await s.locator('#vkNo').inputValue() === 'Test');
  /* Fehler beim Speichern: Dialog bleibt offen, Meldung steht im Dialog. */
  VK_SCHALTER.setFehler = true; erwarteterFehler = true;
  await s.locator('#vkTk').fill('41'); await s.locator('#vkModal .btn-primary').click(); await s.waitForTimeout(400);
  pruefe('Fehler beim Speichern bleibt im offenen Dialog sichtbar', await s.locator('#vkModal.open').count() === 1 && /Nicht gespeichert/.test(await s.locator('#vkErr').innerText()));
  erwarteterFehler = false;
  /* Gespeichert, nur das Neuladen der Liste scheitert: kein „Nicht gespeichert“, Dialog zu, Übersicht lädt neu. */
  VK_SCHALTER.listeNachSetFehler = true;
  await s.locator('#vkModal .btn-primary').click(); await s.waitForTimeout(500);
  pruefe('gespeichert trotz Fehler beim Neuladen: Dialog zu, Kachel zeigt 41', await s.locator('#vkModal.open').count() === 0 && /^41/.test((await s.locator('#fdVkL [data-vk="draussenbande"] .kk-v .ht-num').innerText()).trim()));
  await s.close();
  /* Ladefehler: eigener Hinweis mit „Erneut laden“, die übrigen Abschnitte bleiben. */
  frisch(); VK_SCHALTER.listeFehler = true; erwarteterFehler = true;
  const e = await seite('/index.html'); await e.waitForTimeout(600);
  pruefe('Ladefehler zeigt Hinweis mit „Erneut laden“', /nicht geladen/i.test(await e.locator('#fdVkL').innerText()) && await e.locator('#fdVkNeu').count() === 1);
  VK_SCHALTER.listeFehler = false;
  await e.locator('#fdVkNeu').click(); await e.waitForTimeout(400);
  pruefe('„Erneut laden“ holt die Kacheln', await e.locator('#fdVkL button.kk').count() === 5);
  erwarteterFehler = false;
  await e.close();
  /* Handy 390: zwei Kacheln je Zeile, Dialog passt in die Breite. */
  frisch();
  const h = await ctx.newPage(); await h.setViewportSize({ width:390, height:844 }); h.on('pageerror', x => meldungen.push('Skriptfehler: ' + x.message));
  await h.goto(BASE + '/index.html'); await h.waitForTimeout(700);
  const xs = await h.evaluate(() => [...document.querySelectorAll('#fdVkL .kk')].slice(0, 3).map(k => Math.round(k.getBoundingClientRect().top)));
  pruefe('390 px: zwei Kacheln je Zeile', xs[0] === xs[1] && xs[2] > xs[0], xs.join(','));
  await h.locator('#fdVkL [data-vk="fluidity"]').click(); await h.waitForTimeout(300);
  const mb = await h.locator('#vkModal .modal').boundingBox();
  pruefe('390 px: Dialog ohne seitlichen Überlauf', mb && mb.x >= 0 && mb.x + mb.width <= 390 && await h.evaluate(() => document.documentElement.scrollWidth <= 390));
  await h.close();
}

await browser.close();
server.close();
if (meldungen.length) { console.log('\nKonsolenmeldungen im letzten Fall:'); for (const m of meldungen) console.log('   ' + m.slice(0,200)); fehler += meldungen.length; }
console.log(fehler ? `\n${fehler} Abweichungen` : '\nAlle Bedienproben in Ordnung');
process.exit(fehler ? 1 : 0);
