/* Verkauf 2027 (25.10.2026, docs/PAKET-VERKAUF-2027.md). Zwei Teile:
   1. Rechenregeln (immer): verkaufRechne und verkaufEingabe aus supabase/functions/gfweekly/verkauf.ts mit festen Daten.
   2. Wirkung gegen das echte Backend (nur mit GF_PW): verkauf_list, verkauf_set mit Teststand für draussenbande (Notiz „Test“),
      Upsert auf denselben Stichtag, ungültige Eingaben. Danach löscht die Probe genau ihre eigenen Zeilen (nach Kennung),
      auch nach einem Abbruch (über npx supabase db query --linked, aus einem leeren Arbeitsordner, damit das Repo sauber bleibt).
   Aufruf: node pruefung/verkauf-probe.mjs
           GF_PW=… node pruefung/verkauf-probe.mjs   (Passwort aus dem Vault, nie ausgeben; siehe docs/TECHNIKSTAND.md) */
import { verkaufRechne, verkaufEingabe } from '../supabase/functions/gfweekly/verkauf.ts';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

let ok = 0, fehler = 0;
const pruefe = (name, b, info = '') => { if (b) { ok++; console.log('  ok     ' + name); } else { fehler++; console.log('  FEHLT  ' + name + (info ? ' · ' + String(info).slice(0, 300) : '')); } };
const wirft = (f) => { try { f(); return null; } catch (e) { return e.message || String(e); } };
const who = (w) => { const s = String(w ?? '').toLowerCase(); return s.includes('lea') ? 'Lea' : s.includes('alex') ? 'Alex' : 'Team'; };

console.log('== Verkauf: Rechenregeln (feste Daten) ==');
{
  const Z = [
    { festival_key:'a', name:'A', ziel_tickets:1000, minimal_tickets:100, vvk_start:'2026-08-01', festival_von:'2027-08-01', sort:1, aktiv:true },
    { festival_key:'b', name:'B', ziel_tickets:500, minimal_tickets:null, vvk_start:null, festival_von:'2027-07-01', sort:2, aktiv:true },
    { festival_key:'c', name:'C', ziel_tickets:300, minimal_tickets:0, vvk_start:'2026-12-01', festival_von:'2027-06-01', sort:3, aktiv:true },
    { festival_key:'d', name:'D', ziel_tickets:200, minimal_tickets:0, vvk_start:'2026-10-20', festival_von:'2027-06-01', sort:4, aktiv:true },
    { festival_key:'e', name:'E', ziel_tickets:100, minimal_tickets:0, vvk_start:'2026-09-01', festival_von:'2026-11-01', sort:5, aktiv:true },
    { festival_key:'x', name:'X', ziel_tickets:999, minimal_tickets:0, vvk_start:'2026-09-01', festival_von:'2027-06-01', sort:0, aktiv:false },
  ];
  const S = [
    { festival_key:'a', stichtag:'2026-10-22', tickets:300, quelle:'hand' },
    { festival_key:'a', stichtag:'2026-10-22', tickets:310, quelle:'xceed_api' },
    { festival_key:'a', stichtag:'2026-10-22', tickets:305, quelle:'xceed_mail' },
    { festival_key:'a', stichtag:'2026-10-14', tickets:250, quelle:'hand' },
    { festival_key:'a', stichtag:'2026-10-13', tickets:200, quelle:'hand' },
    { festival_key:'a', stichtag:'2026-10-08', tickets:150, quelle:'hand' },
    { festival_key:'b', stichtag:'2026-10-24', tickets:40, quelle:'hand' },
    { festival_key:'d', stichtag:'2026-10-21', tickets:250, quelle:'hand' },
    { festival_key:'e', stichtag:'2026-10-24', tickets:50, quelle:'hand' },
  ];
  const r = verkaufRechne(Z, S, '2026-10-25');
  const f = Object.fromEntries(r.festivals.map(x => [x.festival_key, x]));
  pruefe('nur aktive Festivals, nach sort', r.festivals.map(x => x.festival_key).join() === 'a,b,c,d,e');
  pruefe('gleicher Stichtag: xceed_api vor xceed_mail vor hand', f.a.stand.tickets === 310 && f.a.stand.quelle === 'xceed_api');
  pruefe('Vorwoche: jüngster Stand 7 bis 13 Tage vorher (14.10., nicht 13.10. oder 08.10.)', f.a.vorwoche && f.a.vorwoche.stichtag === '2026-10-14' && f.a.trend === 60, JSON.stringify(f.a.vorwoche));
  pruefe('Anteil am Ziel in Prozent', f.a.anteil === 31);
  pruefe('Tempo = Tickets je Woche seit VVK-Start (310 in 82 Tagen = 26,5)', f.a.tempo === 26.5, f.a.tempo);
  pruefe('nötiges Tempo = Rest bis 14 Tage vor Festival (690 in 269 Tagen = 18,0)', f.a.tempo_noetig === 18, f.a.tempo_noetig);
  pruefe('Tempo über nötigem Tempo: im Plan', f.a.plan === 'im_plan');
  pruefe('ohne VVK-Start: kein Tempo, „start_offen“', f.b.tempo === null && f.b.plan === 'start_offen' && f.b.tempo_noetig !== null);
  pruefe('ohne Stand, VVK-Start in der Zukunft: „vvk_ab“, stand null', f.c.stand === null && f.c.plan === 'vvk_ab' && f.c.trend === null);
  pruefe('Ziel überschritten: nötiges Tempo 0, im Plan; Tempo mindestens über eine Woche', f.d.tempo_noetig === 0 && f.d.plan === 'im_plan' && f.d.tempo === 250);
  pruefe('keine Wochen mehr bis 14 Tage vor Festival: kein nötiges Tempo, unter Plan', f.e.tempo_noetig === null && f.e.plan === 'unter_plan');
  pruefe('alle Handeingaben der Saison für den Dialog, jüngste zuerst', f.a.hand.length === 4 && f.a.hand[0].stichtag === '2026-10-22' && f.a.hand[3].stichtag === '2026-10-08' && f.c.hand.length === 0);
  pruefe('letzte fünf Stände, jüngste zuerst', f.a.verlauf.length === 5 && f.a.verlauf[0].quelle === 'xceed_api' && f.a.verlauf[4].stichtag === '2026-10-13');
  pruefe('Summe: Tickets der letzten Stände, Ziele aller aktiven', r.summe.tickets === 310 + 40 + 250 + 50 && r.summe.ziel === 2100, JSON.stringify(r.summe));
  pruefe('ältester Stand in Tagen und Zahl ohne Stand', r.aeltester_tage === 4 && r.ohne_stand === 1, `${r.aeltester_tage} ${r.ohne_stand}`);
  const leer = verkaufRechne(Z.slice(0, 1), [], '2026-10-25');
  pruefe('ganz ohne Stände: Summe 0, ältester null, kein_stand', leer.summe.tickets === 0 && leer.aeltester_tage === null && leer.festivals[0].plan === 'kein_stand');
  const und = verkaufRechne([{ ...Z[0], ziel_tickets:1000 }], [{ festival_key:'a', stichtag:'2026-10-22', tickets:100, quelle:'hand' }], '2026-10-25');
  pruefe('Tempo unter nötigem Tempo: unter Plan', und.festivals[0].plan === 'unter_plan');
}

console.log('\n== Verkauf: Eingaben für verkauf_set ==');
{
  const h = '2026-10-25';
  const e = verkaufEingabe({ festival_key:'draussenbande', tickets:12, umsatz_euro:'1234,5', notiz:'  Test ', by:'alex' }, h, who);
  const ohne = verkaufEingabe({ festival_key:'a1', tickets:2, by:'Lea' }, h, who), leer = verkaufEingabe({ festival_key:'a1', tickets:2, by:'Lea', umsatz_euro:null, notiz:'' }, h, who);
  pruefe('fehlende Felder bleiben weg, null oder leer leert ausdrücklich', !('umsatz_brutto_cents' in ohne) && !('notiz' in ohne) && leer.umsatz_brutto_cents === null && leer.notiz === null);
  pruefe('Standard: Saison 2027, Stichtag heute, Euro in Cent, Notiz getrimmt, by normalisiert', e.saison === 2027 && e.stichtag === h && e.umsatz_brutto_cents === 123450 && e.notiz === 'Test' && e.by === 'Alex', JSON.stringify(e));
  pruefe('Tickets als Ziffernfolge im Text gilt', verkaufEingabe({ festival_key:'a1', tickets:'7', by:'Lea' }, h, who).tickets === 7);
  pruefe('Tickets negativ oder gebrochen: abgelehnt', /tickets/.test(wirft(() => verkaufEingabe({ festival_key:'a1', tickets:-1, by:'Lea' }, h, who)) || '') && /tickets/.test(wirft(() => verkaufEingabe({ festival_key:'a1', tickets:1.5, by:'Lea' }, h, who)) || ''));
  pruefe('Stichtag in der Zukunft oder kein Datum: abgelehnt', /Zukunft/.test(wirft(() => verkaufEingabe({ festival_key:'a1', tickets:1, by:'Lea', stichtag:'2026-10-26' }, h, who)) || '') && /Datum/.test(wirft(() => verkaufEingabe({ festival_key:'a1', tickets:1, by:'Lea', stichtag:'2026-02-30' }, h, who)) || ''));
  pruefe('ohne Person oder fremde Person: abgelehnt', /by/.test(wirft(() => verkaufEingabe({ festival_key:'a1', tickets:1 }, h, who)) || '') && /by/.test(wirft(() => verkaufEingabe({ festival_key:'a1', tickets:1, by:'Team' }, h, who)) || ''));
  pruefe('Umsatz negativ oder Text: abgelehnt', /umsatz/.test(wirft(() => verkaufEingabe({ festival_key:'a1', tickets:1, by:'Lea', umsatz_euro:-3 }, h, who)) || '') && /umsatz/.test(wirft(() => verkaufEingabe({ festival_key:'a1', tickets:1, by:'Lea', umsatz_euro:'zehn' }, h, who)) || ''));
  pruefe('festival_key fehlt: abgelehnt', /festival_key/.test(wirft(() => verkaufEingabe({ tickets:1, by:'Lea' }, h, who)) || ''));
}

const PW = process.env.GF_PW;
if (!PW) { console.log('\nWirkung gegen das echte Backend übersprungen (GF_PW nicht gesetzt).'); }
else {
  console.log('\n== Verkauf: Wirkung gegen das echte Backend (Teststand draussenbande, Notiz „Test“) ==');
  const URL_FN = 'https://bnfmupnmqyrcltrphfak.supabase.co/functions/v1/gfweekly';
  const api = async (action, payload) => { const r = await fetch(URL_FN, { method:'POST', headers:{ 'Content-Type':'application/json' }, body:JSON.stringify({ action, password:PW, payload }) }); let d = null; try { d = await r.json(); } catch (e) {} return { status:r.status, d }; };
  /* Gelöscht werden nur die Zeilen, die diese Probe selbst geschrieben hat (Kennungen aus den Antworten von verkauf_set).
     pruefung/verkauf-testdaten-loeschen.sql bleibt als Rückweg von Hand, falls ein Lauf ohne Antwort abbricht. */
  const eigene = new Set();
  const aufraeumen = () => {
    const ids = [...eigene].filter(i => /^[0-9a-f-]{36}$/.test(i));
    if (!ids.length) return true;
    const leer = fs.mkdtempSync(path.join(os.tmpdir(), 'vk-probe-'));
    const sql = path.join(leer, 'loeschen.sql');
    fs.writeFileSync(sql, `delete from public.hh_verkauf_stand where id in (${ids.map(i => `'${i}'`).join(',')}) and festival_key = 'draussenbande' and quelle = 'hand' and notiz = 'Test';\n`);
    const r = spawnSync('npx', ['--yes', 'supabase', 'db', 'query', '--linked', '--project-ref', 'bnfmupnmqyrcltrphfak', '-f', sql], { cwd:leer, stdio:['ignore', 'pipe', 'pipe'], encoding:'utf8' });
    return r.status === 0;
  };
  let geschrieben = false, heute = null;
  try {
    const p = await api('ping', {});
    pruefe('Edge Function mit Verkauf (ping version ≥ 40)', p.status === 200 && p.d.version >= 40, JSON.stringify(p.d));
    const l = await api('verkauf_list', { saison:2027 });
    pruefe('verkauf_list: fünf Festivals, Ziele zusammen 21.000', l.status === 200 && l.d.festivals.length === 5 && l.d.summe.ziel === 21000, JSON.stringify(l.d).slice(0, 300));
    /* Schutz: Ein echter Handstand von heute würde vom Teststand überschrieben und danach mitgelöscht. Dann nicht schreiben. */
    const vorher = l.d.festivals.find(f => f.festival_key === 'draussenbande');
    heute = l.d.heute;
    if ((vorher.verlauf || []).some(v => v.stichtag === heute && v.quelle === 'hand')) throw new Error('Heute gibt es schon einen Handstand für draussenbande; Probe schreibt nichts.');
    geschrieben = true;
    const s1 = await api('verkauf_set', { festival_key:'draussenbande', tickets:3, notiz:'Test', by:'Alex' });
    if (s1.d && s1.d.gespeichert && s1.d.gespeichert.id) eigene.add(s1.d.gespeichert.id);
    const neu = s1.d && s1.d.festivals && s1.d.festivals.find(f => f.festival_key === 'draussenbande');
    pruefe('verkauf_set speichert mit quelle hand und Stichtag heute (Berlin)', s1.status === 200 && s1.d.gespeichert.quelle === 'hand' && s1.d.gespeichert.stichtag === s1.d.heute && neu.stand.tickets === 3, JSON.stringify(s1.d && s1.d.gespeichert));
    const s2 = await api('verkauf_set', { festival_key:'draussenbande', tickets:4, umsatz_euro:12.5, notiz:'Test', by:'Lea' });
    if (s2.d && s2.d.gespeichert && s2.d.gespeichert.id) eigene.add(s2.d.gespeichert.id);
    pruefe('Upsert behält dieselbe Zeile (gleiche Kennung)', s1.d && s2.d && s1.d.gespeichert.id === s2.d.gespeichert.id);
    const n2 = s2.d && s2.d.festivals.find(f => f.festival_key === 'draussenbande');
    const s3 = await api('verkauf_set', { festival_key:'draussenbande', tickets:5, by:'Alex' });
    if (s3.d && s3.d.gespeichert && s3.d.gespeichert.id) eigene.add(s3.d.gespeichert.id);
    pruefe('ohne umsatz_euro und notiz bleiben beide stehen', s3.status === 200 && s3.d.gespeichert.tickets === 5 && s3.d.gespeichert.umsatz_euro === 12.5 && s3.d.gespeichert.notiz === 'Test', JSON.stringify(s3.d && s3.d.gespeichert));
    pruefe('derselbe Stichtag ändert statt zu verdoppeln', s2.status === 200 && n2.stand.tickets === 4 && n2.stand.umsatz_euro === 12.5 && n2.verlauf.filter(v => v.stichtag === s2.d.heute && v.quelle === 'hand').length === 1);
    const ungueltig = await Promise.all([
      api('verkauf_set', { festival_key:'draussenbande', tickets:-1, notiz:'Test', by:'Alex' }),
      api('verkauf_set', { festival_key:'draussenbande', tickets:1, notiz:'Test' }),
      api('verkauf_set', { festival_key:'gibtsnicht', tickets:1, notiz:'Test', by:'Alex' }),
      api('verkauf_set', { festival_key:'draussenbande', tickets:1, notiz:'Test', by:'Alex', stichtag:'2999-01-01' }),
    ]);
    pruefe('ungültige Eingaben: 400, unbekanntes Festival 404', ungueltig.map(x => x.status).join() === '400,400,404,400', ungueltig.map(x => x.status).join());
    const ohne = await fetch(URL_FN, { method:'POST', headers:{ 'Content-Type':'application/json' }, body:JSON.stringify({ action:'verkauf_list', password:'falsch', payload:{} }) });
    pruefe('ohne Passwort: 401', ohne.status === 401);
  } catch (e) { pruefe('Live-Probe ohne Abbruch', false, e.message); }
  finally {
    if (!geschrieben) { console.log('  (nichts geschrieben, nichts zu löschen)'); }
    else {
    /* Antworten können verloren gehen: vor dem Löschen zurücklesen. Vor dem Schreiben gab es heute keinen Handstand für
       draussenbande (Sperre oben), jede solche Zeile stammt also von dieser Probe. */
    const heuteHand = async () => { try { const l = await api('verkauf_list', { saison:2027 }); if (l.status !== 200) return null; const d = l.d.festivals.find(f => f.festival_key === 'draussenbande'); return (d.verlauf || []).filter(v => v.stichtag === heute && v.quelle === 'hand'); } catch (e) { return null; } };   // Netzfehler: null, Löschen bekannter Kennungen trotzdem
    const vorLoeschen = await heuteHand();
    if (vorLoeschen === null) pruefe('Zurücklesen vor dem Löschen', false, `verkauf_list nicht erreichbar; lösche die ${eigene.size} bekannten Kennungen, Rest von Hand: pruefung/verkauf-testdaten-loeschen.sql`);
    else for (const v of vorLoeschen) if (v.id) eigene.add(v.id);
    let weg = false; try { weg = aufraeumen(); } catch (e) { weg = false; }
    const nachher = weg ? await heuteHand() : null;
    pruefe('eigene Teststände gelöscht und zurückgelesen (heute kein Handstand mehr)', weg && Array.isArray(nachher) && nachher.length === 0, nachher === null ? 'Löschen oder Zurücklesen gescheitert; Rückweg von Hand: pruefung/verkauf-testdaten-loeschen.sql' : JSON.stringify(nachher));
    }
  }
}

console.log(fehler ? `\n${fehler} Abweichungen, ${ok} in Ordnung` : `\nVerkauf-Probe: alle ${ok} in Ordnung`);
process.exit(fehler ? 1 : 0);
