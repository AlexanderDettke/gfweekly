/* ===== V32 Kommunikation (07.10.2026) · Aktionen komm_* der Edge Function gfweekly =====
   Paket docs/PAKET-V32-KOMMUNIKATION.md. Rechenlogik in komm-logik.js (byte-gleich mit site/assets/komm-logik.js),
   Regelwerk in komm-regelwerk.json (byte-gleich mit docs/referenz/postingplan/habitat-postingplan-regelwerk.json).
   Feldhoheit: hier werden nur Plan- und Briefingfelder geschrieben, nie Partner- oder Freigabefelder; einzige
   Ausnahme ist der Rückfall an die Redaktion im täglichen Tick (Paket 32e).
   Bestehendes wird wiederverwendet: Besetzung `komm` aus gfweekly_launch_besetzung, Festivals über launchFestivals(),
   Asana-Token und Arbeitsbereich wie launch_send, Protokoll in komm_log nach dem Muster von gfweekly_saison_log,
   der tägliche Tick (absence_tick, 04:40 UTC). */
import './komm-logik.js';
import regelwerkDatei from './komm-regelwerk.json' with { type: 'json' };

// deno-lint-ignore no-explicit-any
const K: any = (globalThis as any).KommLogik;
// deno-lint-ignore no-explicit-any
type Any = any;

const SEND_BUDGET_MS = 90000;
const ASANA_ZEIT_MS = 20000;      // Zeitgrenze je Asana-Anfrage
const SPERRE_SEKUNDEN = 180;      // länger als Budget plus eine Anfrage plus eine Wartezeit
const TEST_PROJEKT = 'Kommunikation TEST';
const SHEET_ID = '1CG1jQGIX2anXi2CpclgOB_kpqIKySsjK965OMQjol-k';
const SHEET_REITER = 'Contentplan';
const SHEET_START_FORMEL = '=DATE(2026,10,1)';
const SHEET_ALT_FORMEL = '=DATE($B$2,1,1)';
const SHEET_ZEILE = 6;            // Zeile 6 „Fixtermine & Meilensteine“
const SHEET_DATUMSZEILE = 5;      // Zeile 5: Datum je Spalte ab F
const SHEET_ERSTE_SPALTE = 5;     // Spalte F, 0-basiert
const DIENSTKONTO_SECRET = 'GOOGLE_DIENSTKONTO_JSON';

export interface KommKontext {
  admin: Any;
  json: (b: unknown, s?: number) => Response;
  heuteBerlin: () => string;
  whoNorm: (w: unknown) => string;
  launchFestivals: () => Promise<Any[]>;
  launchPersonen: () => Promise<Any[]>;
  ASANA_TOKEN: string;
  ASANA_WORKSPACE: string;
  ASANA_TEAM: string;
  HH_BASIS: string;
  MAIL_ALEX: string;
}

export function kommModul(ctx: KommKontext) {
  const { admin, json } = ctx;
  const norm = (x: unknown) => (x ?? '').toString().trim().toLowerCase();

  async function log(what: string, by: string, detail: unknown) {
    const { error } = await admin.from('komm_log').insert({ what, by, detail });
    return !error;
  }

  /* Regelwerk: beim ersten Lauf (oder bei einer neuen Fassung in der Funktion) aus der Datei einspielen. */
  async function regelwerk(): Promise<Any> {
    const meta = (regelwerkDatei as Any).meta || {};
    const version = `${meta.schema_version || '?'} (${meta.stand || '?'})`;
    const { data: aktiv, error } = await admin.from('komm_regelwerk').select('version,inhalt').eq('aktiv', true).maybeSingle();
    if (error) throw error;
    if (aktiv && aktiv.version === version) return aktiv.inhalt;
    /* Neue Fassung aus der Datei: in einer Transaktion aktivieren (alte aus, neue an, Protokoll). Kennt die Tabelle die
       Fassung schon, bleibt die aktive (jemand hat bewusst zurückgestellt). */
    const { data: gilt, error: re } = await admin.rpc('hh_komm_regelwerk_aktivieren', { p_version: version, p_inhalt: regelwerkDatei });
    if (re) throw re;
    if (gilt === version) return regelwerkDatei;
    const { data: nun } = await admin.from('komm_regelwerk').select('inhalt').eq('aktiv', true).maybeSingle();
    return nun ? nun.inhalt : regelwerkDatei;
  }
  function regelwerkVersion(rw: Any) { const m = rw?.meta || {}; return `${m.schema_version || '?'} (${m.stand || '?'})`; }

  /* Die fünf Festivals 2027: Termine aus der Plattform über launchFestivals(), Merkmale aus dem Regelwerk. */
  async function festivals(rw: Any) {
    const alle = await ctx.launchFestivals();
    return alle.filter((f: Any) => K.FESTIVALS[f.short_name]).map((f: Any) => Object.assign(
      K.festivalAus(rw, { id: f.event_id, short_name: f.short_name, name: f.name, sales_start_on: f.sales_start_on, starts_on: f.starts_on, ends_on: f.ends_on }),
      { plan_id: f.plan_id, name_lang: f.name }));
  }
  function waehle(fs: Any[], wer: unknown) {
    const w = (wer ?? '').toString();
    if (!w || w === 'alle') return fs;
    return fs.filter((f: Any) => f.short_name === w || f.event_id === w || f.kuerzel === w || f.fid === w);
  }

  /* Sperre je Vorgang (Versand je Festival, Tabellenabgleich); zeitlich begrenzt, damit ein abgebrochener Lauf nichts blockiert. */
  async function sperren(schluessel: string, sekunden: number) {
    const von = crypto.randomUUID();
    const { data, error } = await admin.rpc('hh_komm_sperre', { p_schluessel: schluessel, p_sekunden: sekunden, p_von: von });
    if (error) throw error;
    return data === true ? von : null;
  }
  async function freigeben(schluessel: string, von: string) { await admin.rpc('hh_komm_frei', { p_schluessel: schluessel, p_von: von }); }

  /* Alle Zeilen einer Abfrage, seitenweise (PostgREST liefert höchstens 1000). */
  async function alleZeilen(bau: () => Any) {
    const aus: Any[] = [];
    for (let von = 0; von < 20000; von += 1000) {
      const { data, error } = await bau().range(von, von + 999);
      if (error) throw error;
      aus.push(...(data || []));
      if (!data || data.length < 1000) break;
    }
    return aus;
  }
  async function gespeichert(shorts: string[]) {
    if (!shorts.length) return [];
    const zeilen = await alleZeilen(() => admin.from('komm_veroeffentlichungen').select('*, komm_schritte(*)').in('festival_short', shorts).order('t').order('id'));
    return zeilen.map((p: Any) => Object.assign(p, {
      schritte: (p.komm_schritte || []).map((s: Any) => ({ schritt_id: s.schritt_id, phase: s.phase, titel: s.titel, rolle: s.rolle, werkzeug: s.werkzeug, start: s.start, faellig: s.faellig, stunden: Number(s.stunden) }))
        .sort((a: Any, b: Any) => (a.start < b.start ? -1 : a.start > b.start ? 1 : (a.faellig < b.faellig ? -1 : a.faellig > b.faellig ? 1 : 0))),
      stunden: Number(p.stunden), komm_schritte: undefined,
    }));
  }

  /* Verantwortliche Person Kommunikation je Festival aus der Besetzung (V27/V28). */
  async function besetzung(fs: Any[]) {
    const ids = fs.map(f => f.event_id).filter(Boolean);
    const [{ data: bes, error }, leute] = await Promise.all([
      ids.length ? admin.from('gfweekly_launch_besetzung').select('event_id,bereich,person_id,status,quelle,notiz,bestaetigt_von,bestaetigt_am').in('event_id', ids).eq('bereich', 'komm') : Promise.resolve({ data: [], error: null }),
      ctx.launchPersonen(),
    ]);
    if (error) throw error;
    const je: Record<string, Any> = {};
    for (const f of fs) {
      const b = (bes || []).find((x: Any) => x.event_id === f.event_id && x.person_id);
      const p = b ? (leute as Any[]).find(x => x.id === b.person_id) : null;
      je[f.short_name] = p ? { person_id: p.id, name: p.name, typ: p.typ, status: b.status, bestaetigt_von: b.bestaetigt_von || null, hat_asana: !!p.asana_gid, asana_gid: p.asana_gid || null, email: p.email || null } : null;
    }
    return { je, leute: leute as Any[] };
  }

  /* ---------- komm_berechnen ---------- */
  async function berechnen(wer: unknown, by: string) {
    const rw = await regelwerk();
    const liste = waehle(await festivals(rw), wer);
    if (!liste.length) return { status: 404, body: { error: 'Festival unbekannt', festivals: (await festivals(rw)).map(f => f.short_name) } };
    const heute = ctx.heuteBerlin();
    const ergebnis: Any[] = [];
    for (const f0 of liste) {
      /* Dieselbe Sperre wie der Versand. Termine werden erst unter der Sperre gelesen; so schreibt ein späterer Lauf nie
         ältere Termine über einen neueren (Review 32a, Runde 2, Befunde 1 und 2). */
      const sperre = `festival:${f0.short_name}`;
      const sperrVon = await sperren(sperre, 120);
      if (!sperrVon) { ergebnis.push({ festival: f0.short_name, kuerzel: f0.kuerzel, uebersprungen: 'Versand oder Berechnung läuft gerade; der nächste Lauf holt es nach' }); continue; }
      try {
        const alle = await festivals(rw);
        const f = alle.find(x => x.short_name === f0.short_name);
        if (!f) { ergebnis.push({ festival: f0.short_name, fehler: 'Festival nicht mehr in der Plattform' }); continue; }
        const erg = K.berechne(rw, f, heute, { saison_start: K.saisonStart(alle) });
        if (!erg.pubs.length) { ergebnis.push({ festival: f.short_name, fehler: 'keine Veröffentlichungen berechnet: ' + (erg.offen || []).join(', ') }); continue; }
        const { data, error } = await admin.rpc('hh_komm_einspielen', { p_festival: f.short_name, p_event_id: f.event_id, p_pubs: erg.pubs, p_heute: heute });
        if (error) { ergebnis.push({ festival: f.short_name, fehler: error.message }); continue; }
        ergebnis.push({ festival: f.short_name, kuerzel: f.kuerzel, berechnet: erg.pubs.length, stunden: K.runde(erg.pubs.reduce((s: number, p: Any) => s + p.stunden, 0), 1),
          vergangen: erg.vergangen.length, ueberfaellig: K.ueberfaellig(erg.pubs, heute).schritte, termine: { V: f.V, F: f.F, Z: f.Z }, ...(data as Any) });
      } finally { await freigeben(sperre, sperrVon); }
    }
    const ok = ergebnis.every(e => !e.fehler);
    const protokoll = await log('komm_berechnen', by, { regelwerk: regelwerkVersion(rw), heute, festivale: ergebnis.filter(e => !e.fehler && !e.uebersprungen).map(e => e.festival), ergebnis });
    return { status: 200, body: { ok, heute, regelwerk: regelwerkVersion(rw), ergebnis, protokoll } };
  }

  /* ---------- komm_list ---------- */
  async function liste() {
    const rw = await regelwerk();
    const fs = await festivals(rw);
    const heute = ctx.heuteBerlin();
    const shorts = fs.map(f => f.short_name);
    /* Letzter Versand und letzte Berechnung je Festival gezielt, nicht aus dem begrenzten Verlauf (Review 32a, Befund 5). */
    const letzte = (what: string, f: string, mitProjekt: boolean) => {
      let q = admin.from('komm_log').select('what,detail,by,at').eq('what', what).order('at', { ascending: false }).limit(1);
      q = mitProjekt ? q.eq('detail->>festival', f).not('detail->>projekt', 'is', null) : q.contains('detail', { festivale: [f] });
      return q;
    };
    const [pubs, bes, pp, logZ, ...je] = await Promise.all([
      gespeichert(shorts),
      besetzung(fs),
      admin.from('komm_pruefpunkte').select('*').in('festival_short', shorts.length ? shorts : ['-']),
      admin.from('komm_log').select('id,what,detail,by,at').order('at', { ascending: false }).limit(200),
      ...shorts.map(f => letzte('komm_send', f, true)),
      ...shorts.map(f => letzte('komm_berechnen', f, false)),
    ]);
    for (const r of je) if ((r as Any).error) throw (r as Any).error;
    const sendJe: Record<string, Any> = {}, berJe: Record<string, Any> = {};
    shorts.forEach((f, i) => { sendJe[f] = ((je[i] as Any).data || [])[0] || null; berJe[f] = ((je[shorts.length + i] as Any).data || [])[0] || null; });
    if ((pp as Any).error) throw (pp as Any).error;
    if ((logZ as Any).error) throw (logZ as Any).error;
    const entsch = (pp as Any).data || [];
    const logs = (logZ as Any).data || [];
    const saison = K.saisonStart(fs);
    const extrasKatalog = (rw.extras || []).map((e: Any) => ({ id: e.id, name: e.name, stufe: e.stufe, budget: !!e.budget_noetig, freigabe: e.freigabe, einsatzfenster: e.einsatzfenster, stunden: e.stunden }));
    const budgetExtra = new Set(extrasKatalog.filter((e: Any) => e.budget || e.stufe === 'rot').map((e: Any) => e.id));
    const fuerLast: Any[] = [];
    const aus: Any[] = [];
    const entscheiden: Any[] = [];
    for (const f of fs) {
      const eigene = pubs.filter((p: Any) => p.festival_short === f.short_name);
      const aktuell = eigene.filter((p: Any) => K.aktuell(p, heute));
      const frisch = K.berechne(rw, f, heute, { saison_start: saison });
      /* Für die Last zählen alle Schritte ab dieser Woche, auch nach dem Veröffentlichungstag (Anzeigenkontrolle,
         Nachbereitung); nicht nur kommende Veröffentlichungen (Review 32a, Befund 3). */
      const mo = K.montag(heute);
      /* Restschritte vergangener Veröffentlichungen, die noch nicht gespeichert sind (erster Lauf nach T; Runde 2, Befund 3). */
      const gespeicherteIds = new Set(eigene.map((p: Any) => p.id));
      const rest = (frisch.vergangen_voll || []).filter((p: Any) => !gespeicherteIds.has(p.id));
      fuerLast.push({ kuerzel: f.kuerzel, pubs: eigene.concat(rest).filter((p: Any) => p.schritte.some((s: Any) => s.faellig >= mo)), wochen: frisch.wochen });
      const ueber = K.ueberfaellig(aktuell, heute);
      const person = bes.je[f.short_name];
      const sendLog = sendJe[f.short_name];
      const ppEigene = entsch.filter((e: Any) => e.festival_short === f.short_name);
      const pruefpunkte = eigene.filter((p: Any) => p.regel_id === 'PRUEF').map((p: Any) => {
        const e = ppEigene.find((x: Any) => x.datum === p.t);
        return { datum: p.t, nr: p.nr, stufe: e?.stufe || 'offen', extras: e?.extras || [], entschieden_von: e?.entschieden_von || null, entschieden_am: e?.entschieden_am || null, notiz: e?.notiz || null };
      });
      const naechster = pruefpunkte.filter((x: Any) => x.datum >= heute)[0] || null;
      const zuPruefen = eigene.filter((p: Any) => p.status_bearbeitung === 'zu_pruefen');
      const kurzP = (p: Any) => ({ id: p.id, titel: p.titel, t: p.t, kanal: p.kanal, klasse: p.klasse, pflicht: p.pflicht, partnerfaehig: p.partnerfaehig, status: p.status_bearbeitung, vorlaeufig: p.vorlaeufig, gesendet: !!p.gesendet_am, t_neu: p.t_neu || null });
      aus.push({
        short_name: f.short_name, kuerzel: f.kuerzel, name: f.name, event_id: f.event_id, V: f.V, F: f.F, Z: f.Z, pruefen: f.pruefen,
        person: person ? { name: person.name, typ: person.typ, status: person.status, bestaetigt_von: person.bestaetigt_von, hat_asana: person.hat_asana } : null,
        rahmen: sendLog ? { gesendet_am: sendLog.at, url: sendLog.detail.url, von: sendLog.by, neu: sendLog.detail.neu, aktualisiert: sendLog.detail.aktualisiert,
          weiter: !!sendLog.detail.weiter, abgebrochen: sendLog.detail.abgebrochen || null, fehler: (sendLog.detail.fehler || []).length, fehler_liste: (sendLog.detail.fehler || []).slice(0, 20),
          aufgaben_gesendet: eigene.filter((p: Any) => p.asana_task_gid).length } : null,
        gesendet: eigene.filter((p: Any) => p.gesendet_am).length,
        zu_pruefen: zuPruefen.map(kurzP),
        anzahl: aktuell.length, stunden: K.runde(aktuell.reduce((s: number, p: Any) => s + p.stunden, 0), 1),
        pflicht: aktuell.filter((p: Any) => p.pflicht).length, partnerfaehig: aktuell.filter((p: Any) => p.partnerfaehig).length,
        ueberfaellig: ueber, ueberfaellig_liste: aktuell.filter((p: Any) => ueber.ids.includes(p.id)).slice(0, 12).map((p: Any) => Object.assign(kurzP(p), { schritte: p.schritte.filter((s: Any) => s.faellig < heute).length })),
        naechster_pruefpunkt: naechster, pruefpunkte,
        naechste14: K.naechste(aktuell, heute, 14, false).map(kurzP),
        pflicht30: K.naechste(aktuell, heute, 30, true).map(kurzP),
        jahresband: K.jahresband(rw, f, eigene),
        berechnet_am: berJe[f.short_name]?.at || null,
      });
      /* Was muss die GF entscheiden? */
      if (!person) entscheiden.push({ art: 'besetzung', festival: f.short_name, kuerzel: f.kuerzel, text: `Kommunikation nicht besetzt: ${f.name}. Bis dahin ist die Leitung Marketing zuständig.` });
      for (const x of pruefpunkte) {
        if (x.stufe === 'gelb' || x.stufe === 'rot') entscheiden.push({ art: 'pruefpunkt', festival: f.short_name, kuerzel: f.kuerzel, datum: x.datum, stufe: x.stufe, extras: x.extras,
          text: `${f.name}: Prüfpunkt ${K.kurz(x.datum)} steht auf ${K.STUFE_WORT[x.stufe]}${x.extras.length ? ', Extras ' + x.extras.join(', ') : ''}.` });
        const budget = (x.extras || []).filter((e: string) => budgetExtra.has(e));
        if (budget.length && !(x.entschieden_von === 'Alex' || x.entschieden_von === 'Lea')) entscheiden.push({ art: 'extras', festival: f.short_name, kuerzel: f.kuerzel, datum: x.datum, extras: budget,
          text: `${f.name}: Extras mit Budget oder Stufe Rot gewählt (${budget.join(', ')}), Freigabe der GF fehlt.` });
      }
    }
    const ueberlast = logs.filter((l: Any) => l.what === 'komm_ueberlast' && (Date.now() - Date.parse(l.at)) < 45 * 86400000)
      .map((l: Any) => ({ at: l.at, by: l.by, festival: l.detail?.festival || null, notiz: l.detail?.notiz || '' }));
    for (const u of ueberlast) entscheiden.push({ art: 'ueberlast', festival: u.festival, text: `Überlast gemeldet${u.festival ? ' für ' + u.festival : ''} von ${u.by || 'unbekannt'} am ${K.kurz(String(u.at).slice(0, 10))}: ${u.notiz}` });
    /* Horizont: späteste Fälligkeit eines Schritts oder Ende einer Wochenaufgabe (Aftermovies bei Z+60; Review 32a, Befund 4). */
    let lastBis: string | null = null;
    for (const x of fuerLast) {
      for (const p of x.pubs) for (const s of p.schritte) if (!lastBis || s.faellig > lastBis) lastBis = s.faellig;
      for (const w of x.wochen) if (!lastBis || w.bis > lastBis) lastBis = w.bis;
    }
    const tabelle = logs.find((l: Any) => l.what === 'komm_tabelle_sync');
    return {
      heute, regelwerk: regelwerkVersion(rw), festivals: aus, entscheiden, extras: extrasKatalog,
      wochenlast: K.wochenlast(fuerLast, heute, lastBis),
      verbund: { stichtag: rw.verbund_2027?.stichtag_vorproduktion, fenster: rw.verbund_2027?.vorproduktion_fenster_tage, gaesteinfos: rw.verbund_2027?.stichtag_gaesteinfos_freigegeben, saison_start: saison },
      asana: { konfiguriert: !!ctx.ASANA_TOKEN },
      tabelle: { konfiguriert: !!Deno.env.get(DIENSTKONTO_SECRET), letzter: tabelle ? { at: tabelle.at, by: tabelle.by, ergebnis: tabelle.detail?.ergebnis || null, geschrieben: tabelle.detail?.geschrieben ?? null, fremd: (tabelle.detail?.fremd || []).length } : null },
      hinweise: logs.filter((l: Any) => l.what === 'komm_hinweis' || l.what === 'komm_hinweis_offen' || l.what === 'komm_rueckfall').slice(0, 30).map((l: Any) => ({ at: l.at, what: l.what, detail: l.detail })),
      log: logs.filter((l: Any) => ['komm_berechnen', 'komm_send', 'komm_send_test', 'komm_pruefpunkt_set', 'komm_tabelle_sync', 'komm_test_aufraeumen'].includes(l.what)).slice(0, 40)
        .map((l: Any) => ({ at: l.at, what: l.what, by: l.by, kurz: kurzLog(l) })),
    };
  }
  function kurzLog(l: Any) {
    const d = l.detail || {};
    if (l.what === 'komm_berechnen') return (d.ergebnis || []).map((e: Any) => e.fehler ? `${e.festival}: Fehler` : `${e.kuerzel}: ${e.berechnet} (neu ${e.neu}, geändert ${e.aktualisiert}, zu prüfen ${e.zu_pruefen})`).join(' · ');
    if (l.what === 'komm_send' || l.what === 'komm_send_test') return `${d.festival}: ${d.neu} neu, ${d.aktualisiert} aktualisiert${d.weiter ? ', Rest folgt' : ''}${(d.fehler || []).length ? ', ' + d.fehler.length + ' Fehler' : ''}`;
    if (l.what === 'komm_pruefpunkt_set') return `${d.festival} ${d.datum}: ${d.stufe}${(d.extras || []).length ? ' mit ' + d.extras.join(', ') : ''}`;
    if (l.what === 'komm_tabelle_sync') return `${d.ergebnis || ''}${d.geschrieben !== undefined ? ', ' + d.geschrieben + ' Zellen' : ''}`;
    return '';
  }

  /* ---------- komm_pruefpunkt_set ---------- */
  async function pruefpunktSetzen(t: Any) {
    const by = ctx.whoNorm(t.by);
    if (!t.by) return { status: 400, body: { error: 'by fehlt' } };
    const rw = await regelwerk();
    const fs = await festivals(rw);
    const f = waehle(fs, t.festival)[0];
    if (!f || !t.festival || t.festival === 'alle') return { status: 404, body: { error: 'Festival unbekannt' } };
    const datum = String(t.datum || '');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(datum)) return { status: 400, body: { error: 'datum fehlt' } };
    const { data: pp, error: pe } = await admin.from('komm_veroeffentlichungen').select('id').eq('festival_short', f.short_name).eq('regel_id', 'PRUEF').eq('t', datum).maybeSingle();
    if (pe) throw pe;
    if (!pp) return { status: 404, body: { error: 'An diesem Tag gibt es für dieses Festival keinen Prüfpunkt' } };
    const stufe = String(t.stufe || 'offen');
    if (!K.STUFEN.includes(stufe)) return { status: 400, body: { error: 'stufe unbekannt' } };
    const extras: string[] = Array.isArray(t.extras) ? Array.from(new Set(t.extras.map(String))) : [];
    const katalog = new Map((rw.extras || []).map((e: Any) => [e.id, e]));
    const unbekannt = extras.filter(e => !katalog.has(e));
    if (unbekannt.length) return { status: 400, body: { error: 'Extras unbekannt: ' + unbekannt.join(', ') } };
    const budget = extras.filter(e => { const x: Any = katalog.get(e); return x.budget_noetig || x.stufe === 'rot'; });
    if ((stufe === 'rot' || budget.length) && by !== 'Alex' && by !== 'Lea') return { status: 403, body: { error: 'Stufe Rot und Extras mit Budget entscheiden nur Alex oder Lea', extras: budget } };
    /* Rechte am normierten Namen prüfen, gespeichert wird der genannte Name (Review 32a, Befund 6). */
    const name = String(t.by).trim().slice(0, 60);
    const notizSetzen = t.notiz !== undefined;
    const notiz = notizSetzen && t.notiz ? String(t.notiz).slice(0, 4000) : null;
    /* Unter derselben Sperre wie Berechnung und Versand; die Funktion prüft den Prüfpunkt noch einmal in ihrer Transaktion. */
    const sperrVon = await sperren(`festival:${f.short_name}`, 30);
    if (!sperrVon) return { status: 409, body: { error: 'Für dieses Festival läuft gerade eine Berechnung oder ein Versand; bitte gleich noch einmal.' } };
    let data: Any = null, error: Any = null;
    try {
      /* Gesehener Stand des Entwurfs: Notiz und Zeitpunkt der letzten Entscheidung (Review 32b, Runde 2, Befund 1).
         Alle Schreibwege auf komm_pruefpunkte laufen unter dieser Sperre, der Vergleich ist deshalb verlässlich. */
      if (t.expect_am !== undefined || t.expect_notiz !== undefined) {
        const { data: jetzt, error: le } = await admin.from('komm_pruefpunkte').select('notiz,entschieden_am').eq('festival_short', f.short_name).eq('datum', datum).maybeSingle();
        if (le) throw le;
        const am = jetzt?.entschieden_am ? new Date(jetzt.entschieden_am).toISOString() : null;
        const erwartetAm = t.expect_am ? new Date(String(t.expect_am)).toISOString() : null;
        if (t.expect_am !== undefined && am !== erwartetAm) return { status: 409, body: { error: 'Inzwischen geändert: der Prüfpunkt wurde seit dem Öffnen neu entschieden' } };
        if (t.expect_notiz !== undefined && (jetzt?.notiz || '') !== String(t.expect_notiz || '')) return { status: 409, body: { error: 'Inzwischen geändert: die Notiz wurde seit dem Öffnen geändert' } };
      }
      ({ data, error } = await admin.rpc('hh_komm_pruefpunkt_set', { p_festival: f.short_name, p_datum: datum, p_stufe: stufe, p_extras: extras,
      p_notiz: notiz, p_notiz_setzen: notizSetzen, p_von: by === 'Alex' || by === 'Lea' ? by : name, p_expect: t.expect_stufe ? String(t.expect_stufe) : null,
      p_expect_extras: Array.isArray(t.expect_extras) ? t.expect_extras.map(String) : null })); }
    finally { await freigeben(`festival:${f.short_name}`, sperrVon); }
    if (error) return { status: error.code === 'PT409' ? 409 : 500, body: { error: error.message } };
    const protokoll = true;
    return { status: 200, body: { ok: true, pruefpunkt: data, protokoll } };
  }

  /* ---------- Asana ---------- */
  /* Jede Anfrage hat eine Zeitgrenze (ASANA_ZEIT_MS), damit ein Lauf seine Sperre nie überdauert (Review 32c, Befund 3).
     Ratenlimit: die verlangte Wartezeit wird eingehalten, wenn sie vor warteBis endet; sonst Fehler mit status 429 und
     retryAfter, der Versand unterbricht dann geordnet (Review 32c, Befund 5). */
  async function asana(pfad: string, methode = 'GET', koerper?: unknown, warteBis = Date.now() + 15000): Promise<Any> {
    for (let versuch = 0; versuch < 2; versuch++) {
      const ab = new AbortController();
      const zeit = setTimeout(() => ab.abort(), ASANA_ZEIT_MS);
      let res: Response, text: string;
      try {
        res = await fetch('https://app.asana.com/api/1.0' + pfad, { method: methode, signal: ab.signal,
          headers: { 'Authorization': 'Bearer ' + ctx.ASANA_TOKEN, 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: koerper === undefined ? undefined : JSON.stringify({ data: koerper }) });
        text = await res.text();
      } catch (e) {
        const f: Any = new Error(`Asana ${methode} ${pfad.split('?')[0]}: ${ab.signal.aborted ? 'keine Antwort in ' + ASANA_ZEIT_MS / 1000 + ' s' : String((e as Error).message).slice(0, 120)}`);
        f.status = 0; f.unklar = true; throw f;
      } finally { clearTimeout(zeit); }
      if (res.status === 429) {
        const w = Math.max(1, Number(res.headers.get('retry-after') || 30));
        if (versuch === 0 && Date.now() + w * 1000 < warteBis) { await new Promise(r => setTimeout(r, w * 1000)); continue; }
        const f: Any = new Error(`Asana ${methode} ${pfad.split('?')[0]}: Ratenlimit, frühestens in ${w} s erneut`); f.status = 429; f.retryAfter = w; throw f;
      }
      let d: Any = {}; try { d = JSON.parse(text); } catch (_e) { d = {}; }
      if (!res.ok) { const e: Any = new Error(`Asana ${methode} ${pfad.split('?')[0]}: ${res.status} ${(d?.errors?.[0]?.message) || text.slice(0, 160)}`); e.status = res.status; throw e; }
      return pfad.includes('limit=') ? d : d.data;
    }
    throw new Error('Asana: zu viele Anfragen');
  }
  async function asanaAlle(pfad: string) {
    const aus: Any[] = [];
    let p = pfad;
    for (let seite = 0; seite < 50 && p; seite++) {
      const d = await asana(p);
      aus.push(...(d.data || []));
      p = d.next_page?.path || '';
    }
    return aus;
  }
  async function projektFinden(name: string, gemerkt: string | null) {
    if (gemerkt) {
      try { const p = await asana(`/projects/${gemerkt}?opt_fields=name,archived`); if (p && !p.archived) return String(p.gid); }
      catch (e) { if ((e as Any).status !== 404) throw e; }
    }
    const projekte = await asanaAlle(`/projects?workspace=${ctx.ASANA_WORKSPACE}&archived=false&opt_fields=name&limit=100`);
    const t = projekte.find((p: Any) => norm(p.name) === norm(name));
    return t ? String(t.gid) : null;
  }
  async function teamFinden() {
    if (ctx.ASANA_TEAM) return ctx.ASANA_TEAM;
    const d = await asana(`/projects?workspace=${ctx.ASANA_WORKSPACE}&limit=20&opt_fields=team,name,archived`);
    return ((d.data || []).find((p: Any) => p?.team?.gid && !p.archived)?.team?.gid) || '';
  }
  function projektNotiz(f: Any, person: string, test: boolean) {
    return [`Kommunikation ${f.name} ${f.ausgabe || 2027} · Rahmen aus dem Hohen Haus (Postingplan-Standard, Regelwerk ${'1.2.0'}).`,
      `Verantwortlich: ${person}. Die Geschäftsführung legt nur den Rahmen fest; Rollen und Schritte verteilst du selbst, hier oder in der Redaktionstabelle.`,
      'Je Veröffentlichung der Klassen P, L, PR, TM, NL, AD und interne Aufgaben sowie jede Pflichtveröffentlichung der Klasse M eine Aufgabe; alle übrigen Beiträge je Monat gebündelt. Die Schritte in der Beschreibung sind ein Vorschlag.',
      'Erneutes Senden legt nur Neues an und aktualisiert bei vorhandenen Aufgaben Fälligkeit und Beschreibung; Zuständigkeit, Unteraufgaben, Kommentare und Abschnitt bleiben.',
      test ? 'TESTPROJEKT: wird nach der Prüfung gelöscht.' : '',
      `Im Hohen Haus: ${ctx.HH_BASIS}/kommunikation.html?festival=${encodeURIComponent(f.short_name)}`].filter(Boolean).join('\n');
  }

  async function senden(t: Any) {
    const von = ctx.whoNorm(t.by);
    if (von !== 'Alex' && von !== 'Lea') return { status: 403, body: { error: 'Den Rahmen senden nur Alex oder Lea' } };
    const rw = await regelwerk();
    const fs = await festivals(rw);
    const f = waehle(fs, t.festival)[0];
    if (!f || !t.festival || t.festival === 'alle') return { status: 404, body: { error: 'Festival unbekannt; je Festival einzeln senden' } };
    const test = !!t.test;
    if (!t.vorschau) {
      if (!ctx.ASANA_TOKEN) return { status: 400, body: { error: 'ASANA_TOKEN fehlt', hinweis: 'Secret in Supabase anlegen, dann erneut senden.' } };
      if (!test && !t.bestaetigt) return { status: 400, body: { error: 'Senden braucht bestaetigt: true (nach der Vorschau)' } };
    }
    /* Eine Sperre je Festival für Versand und Berechnung: gelesen wird erst unter der Sperre, damit eine gleichzeitige
       Neuberechnung keine Veröffentlichung verändert, die gerade nach Asana geht (Review 32a, Runde 1 Befund 2, Runde 2 Befund 1).
       Sie hält länger als das Zeitbudget und verfällt von selbst. Die Vorschau liest ohne Sperre. */
    const sperre = `festival:${f.short_name}`;
    const sperrVon = t.vorschau ? null : await sperren(sperre, SPERRE_SEKUNDEN);
    if (!t.vorschau && !sperrVon) return { status: 409, body: { error: 'Für dieses Festival läuft gerade ein Versand oder eine Berechnung; bitte gleich noch einmal.' } };
    try { return await sendenLesen(t, f, test, von, { schluessel: sperre, von: sperrVon || '' }); }
    finally { if (sperrVon) await freigeben(sperre, sperrVon); }
  }
  async function sendenLesen(t: Any, f: Any, test: boolean, von: string, halt: { schluessel: string, von: string }) {
    const heute = ctx.heuteBerlin();
    const pubs = (await gespeichert([f.short_name])).filter((p: Any) => K.aktuell(p, heute));
    if (!pubs.length) return { status: 400, body: { error: 'Für dieses Festival ist nichts berechnet; zuerst komm_berechnen' } };
    const { je, leute } = await besetzung([f]);
    const komm = je[f.short_name];
    const alex = (leute as Any[]).find(p => norm(p.email) === ctx.MAIL_ALEX) || null;
    /* Ist komm offen oder ohne Asana-Konto, ist die Leitung Marketing zuständig (Paket, Zuständigkeit). */
    const zust = test ? alex : ((komm && komm.asana_gid) ? komm : alex);
    if (!zust || !zust.asana_gid) return { status: 400, body: { error: 'Keine zuständige Person mit Asana-Konto' } };
    const vertretung = !test && (!komm || !komm.asana_gid);
    const rahmen = K.asanaRahmen(f, pubs, ctx.HH_BASIS);
    const projektName = test ? TEST_PROJEKT : `Kommunikation ${f.name} ${f.ausgabe || 2027}`;
    const logWhat = test ? 'komm_send_test' : 'komm_send';
    const bekannt = new Set<string>();
    const gidJe = new Map(pubs.filter((p: Any) => p.asana_task_gid).map((p: Any) => [p.id, p.asana_task_gid]));
    if (!test) for (const a of rahmen.aufgaben) if ((a.vid && gidJe.has(a.vid)) || (a.ids && a.ids.some((i: string) => gidJe.has(i)))) bekannt.add(a.name);
    const saetze = K.versandSaetze(f, rahmen, zust.name + (vertretung ? ' (Leitung Marketing, weil Kommunikation nicht besetzt ist)' : ''), bekannt, projektName);
    if (t.vorschau) return { status: 200, body: { ok: true, vorschau: true, saetze, projekt: projektName, aufgaben: rahmen.aufgaben.length, einzeln: rahmen.einzeln, buendel: rahmen.buendel, pruefpunkte: rahmen.pruefpunkte, abschnitte: rahmen.abschnitte, person: zust.name, test } };
    return await sendenGesperrt(halt, f, test, von, zust, vertretung, rahmen, projektName, logWhat, gidJe, saetze);
  }
  async function abbruch(logWhat: string, von: string, f: Any, projekt: string, grund: string) {
    await log(logWhat, von, { festival: f.short_name, projekt, url: `https://app.asana.com/0/${projekt}`, abgebrochen: grund, neu: 0, aktualisiert: 0, weiter: true, fehler: [grund] });
    return { status: 502, body: { error: grund, projekt } };
  }
  async function sendenGesperrt(halt: { schluessel: string, von: string }, f: Any, test: boolean, von: string, zust: Any, vertretung: boolean, rahmen: Any, projektName: string, logWhat: string, gidJe: Map<string, string>, saetze: string[]) {
    const beginn = Date.now();
    const haltOk = async () => {
      const { data } = await admin.rpc('hh_komm_sperre_halten', { p_schluessel: halt.schluessel, p_von: halt.von, p_sekunden: SPERRE_SEKUNDEN });
      return data === true;
    };

    /* Projekt: Kennung aus dem letzten Versand, sonst Suche nach dem Namen, sonst neu (Eigentum bei der verantwortlichen Person). */
    const { data: letzter } = await admin.from('komm_log').select('detail').in('what', [logWhat, logWhat + '_projekt']).eq('detail->>festival', f.short_name).not('detail->>projekt', 'is', null).order('at', { ascending: false }).limit(1);
    let projekt: string | null = null;
    const vorherProjekt: string | null = (letzter || [])[0]?.detail?.projekt || null;
    try { projekt = await projektFinden(projektName, vorherProjekt); }
    catch (e) { return { status: 502, body: { error: 'Projekt nicht erreichbar: ' + String((e as Error).message).slice(0, 200), hinweis: 'Nichts geändert.' } }; }
    const fehler: string[] = [];
    if (!projekt) {
      if (!(await haltOk())) return { status: 409, body: { error: 'Sperre verloren; ein anderer Lauf ist dran. Nichts angelegt.' } };
      const daten: Any = { name: projektName, workspace: ctx.ASANA_WORKSPACE, notes: projektNotiz(f, zust.name, test), owner: zust.asana_gid, default_view: 'list' };
      try { const team = await teamFinden(); if (team) daten.team = team; } catch (_e) { /* ohne Team versuchen */ }
      try { projekt = String((await asana('/projects', 'POST', daten)).gid); }
      catch (e) {
        /* Unklarer Ausgang (Netz, 5xx, verlorene Antwort): erst nach dem Projekt suchen, nie blind ein zweites anlegen
           (Review 32a, Runde 3, Befund 2). Ein zweiter Versuch ohne owner nur, wenn Asana das Feld ausdrücklich ablehnt. */
        const st = (e as Any).status, text = String((e as Error).message);
        try { projekt = await projektFinden(projektName, null); } catch (_e) { projekt = null; }
        if (!projekt && st === 400 && /owner/i.test(text)) {
          try { delete daten.owner; projekt = String((await asana('/projects', 'POST', daten)).gid); try { await asana(`/projects/${projekt}`, 'PUT', { owner: zust.asana_gid }); } catch (e2) { fehler.push('Eigentum nicht übertragen: ' + String((e2 as Error).message).slice(0, 160)); } }
          catch (e3) { return { status: 400, body: { error: String((e3 as Error).message), erster_fehler: text.slice(0, 200), hinweis: 'Projekt nicht angelegt; nichts geändert.' } }; }
        } else if (!projekt) return { status: 502, body: { error: 'Projekt nicht angelegt: ' + text.slice(0, 200), hinweis: 'Nichts geändert. Beim nächsten Senden wird zuerst nach dem Projekt gesucht.' } };
      }
      /* Eigene Protokollart: die Anlage ist kein Versand (Review 32a, Runde 2, Befund 4). */
      const ok = await log(logWhat + '_projekt', von, { festival: f.short_name, projekt, url: `https://app.asana.com/0/${projekt}`, schritt: 'Projekt angelegt' });
      if (!ok) return { status: 500, body: { error: 'Das Projekt steht in Asana, ließ sich aber nicht protokollieren.', projekt, hinweis: 'Noch keine Aufgabe angelegt. Später erneut senden; das Projekt wird über den Namen gefunden.' } };
      try { await asana(`/projects/${projekt}/addMembers`, 'POST', { members: zust.asana_gid }); } catch (_e) { /* Eigentum genügt */ }
    } else {
      try { await asana(`/projects/${projekt}`, 'PUT', { notes: projektNotiz(f, zust.name, test) }); } catch (e) { fehler.push('Projektbeschreibung nicht aktualisiert: ' + String((e as Error).message).slice(0, 160)); }
    }
    /* Abschnitte je Monat, chronologisch; fehlende vor dem nächsten späteren Abschnitt einfügen. */
    let sektionen: Any[] = [];
    try { sektionen = await asana(`/projects/${projekt}/sections?opt_fields=name`); }
    catch (e) { return await abbruch(logWhat, von, f, projekt!, 'Abschnitte nicht lesbar: ' + String((e as Error).message).slice(0, 160)); }
    const abschnitt: Record<string, string> = {};
    for (const s of sektionen || []) abschnitt[s.name] = s.gid;
    for (let i = 0; i < rahmen.abschnitte.length; i++) {
      const name = rahmen.abschnitte[i];
      if (abschnitt[name]) continue;
      if (!(await haltOk())) return await abbruch(logWhat, von, f, projekt!, 'Sperre verloren beim Anlegen der Abschnitte; ein anderer Lauf ist dran');
      const spaeter = rahmen.abschnitte.slice(i + 1).find((n: string) => abschnitt[n]);
      try { abschnitt[name] = String((await asana(`/projects/${projekt}/sections`, 'POST', spaeter ? { name, insert_before: abschnitt[spaeter] } : { name })).gid); }
      catch (e) { fehler.push(`Abschnitt ${name}: ` + String((e as Error).message).slice(0, 120)); }
    }
    for (const s of sektionen || []) {
      if (!/^(unbenannter abschnitt|untitled section)$/i.test((s.name || '').trim())) continue;
      try { const drin = await asana(`/sections/${s.gid}/tasks?limit=1`); if (!(drin.data || []).length) await asana(`/sections/${s.gid}`, 'DELETE'); } catch (_e) { /* bleibt */ }
    }
    /* Aufgaben im Projekt nach Namen (wie launch_send seit v35): ohne gemerkte Kennung wird eine vorhandene weiterverwendet. */
    const imProjekt = new Map<string, string>();
    try { for (const a of await asanaAlle(`/projects/${projekt}/tasks?opt_fields=name&limit=100`)) if (a?.name && !imProjekt.has(norm(a.name))) imProjekt.set(norm(a.name), String(a.gid)); }
    catch (e) { return await abbruch(logWhat, von, f, projekt!, 'Aufgabenliste nicht lesbar: ' + String((e as Error).message).slice(0, 160) + '. Keine Aufgabe angelegt, sonst könnten Aufgaben doppelt entstehen.'); }

    /* Zeitbudget je Aufruf; der Rest folgt beim nächsten Senden. KOMM_SEND_BUDGET_MS nur für die Probe. */
    const budget = Number(Deno.env.get('KOMM_SEND_BUDGET_MS') || SEND_BUDGET_MS);
    let neu = 0, aktualisiert = 0, rest = 0, verschoben = 0, unterbrochen = '', fortsetzenAb: string | null = null;
    /* Versandlauf: ein Versand über mehrere Aufrufe setzt bei der nächsten unbearbeiteten Aufgabe fort, statt wieder vorn
       zu beginnen (Review 32c, Befund 2). Ein abgeschlossener oder einen Tag alter Lauf beginnt neu. */
    const laufSchluessel = test ? `test:${f.short_name}` : f.short_name;
    const { data: laufAlt } = await admin.from('komm_versandlauf').select('*').eq('schluessel', laufSchluessel).maybeSingle();
    const fortsetzen = !!laufAlt && !laufAlt.abgeschlossen && (Date.now() - Date.parse(laufAlt.aktualisiert_am)) < 86400000;
    const erledigt = new Set<string>(fortsetzen ? (laufAlt.erledigt || []) : []);
    const laufId = fortsetzen ? laufAlt.lauf : crypto.randomUUID();
    const laufSpeichern = async (fertig: boolean) => {
      const { error } = await admin.from('komm_versandlauf').upsert({ schluessel: laufSchluessel, lauf: laufId, erledigt: Array.from(erledigt),
        gestartet_am: fortsetzen ? laufAlt.gestartet_am : new Date(beginn).toISOString(), aktualisiert_am: new Date().toISOString(), abgeschlossen: fertig }, { onConflict: 'schluessel' });
      if (error) fehler.push('Fortschritt des Versands nicht gespeichert: ' + error.message);
    };
    await laufSpeichern(false);
    /* Zugehörigkeit zum Zielprojekt je gemerkter Aufgabe, nicht nur beim erkannten Projektwechsel (Review 32c, Befund 1). */
    const gidsImProjekt = new Set(imProjekt.values());
    const aufgaben = rahmen.aufgaben.slice().sort((a: Any, b: Any) => (a.due_on < b.due_on ? -1 : a.due_on > b.due_on ? 1 : 0)).filter((a: Any) => !erledigt.has(a.name));
    let seitSpeichern = 0;
    for (let i = 0; i < aufgaben.length; i++) {
      const a = aufgaben[i];
      /* Mindestens eine Aufgabe je Aufruf, damit auch ein langsamer Vorlauf den Versand nie zum Stehen bringt. */
      if (unterbrochen || (i > 0 && Date.now() - beginn > budget)) { rest = aufgaben.length - i; break; }
      /* Vor jeder Änderung: Sperre noch unser? Dann verlängern; sonst sofort aufhören (Review 32c, Befund 3). */
      if (!(await haltOk())) { unterbrochen = 'Sperre verloren; ein anderer Lauf ist dran'; rest = aufgaben.length - i; break; }
      const ids: string[] = a.vid ? [a.vid] : (a.ids || []);
      let gid: string | null = test ? null : ((a.vid && gidJe.get(a.vid)) || ids.map(i => gidJe.get(i)).find(Boolean) || null);
      gid = gid || imProjekt.get(norm(a.name)) || null;
      const warteBis = beginn + budget;
      let erfolg = false, neuAngelegt = false;
      for (let versuch = 0; versuch < 2 && !erfolg; versuch++) {
        try {
          if (gid) {
            if (!gidsImProjekt.has(gid)) {
              const sek = abschnitt[a.abschnitt];
              await asana(`/tasks/${gid}/addProject`, 'POST', sek ? { project: projekt, section: sek } : { project: projekt }, warteBis);
              gidsImProjekt.add(gid); imProjekt.set(norm(a.name), gid); verschoben++;
            }
            await asana(`/tasks/${gid}`, 'PUT', { due_on: a.due_on, notes: a.notes }, warteBis);
            aktualisiert++;
          } else {
            const sek = abschnitt[a.abschnitt];
            const d = await asana('/tasks', 'POST', Object.assign({ name: a.name, notes: a.notes, due_on: a.due_on, assignee: zust.asana_gid, workspace: ctx.ASANA_WORKSPACE },
              sek ? { memberships: [{ project: projekt, section: sek }] } : { projects: [projekt] }), warteBis);
            gid = String(d.gid); neu++; neuAngelegt = true; imProjekt.set(norm(a.name), gid); gidsImProjekt.add(gid);
          }
          erfolg = true;
        } catch (e) {
          const st = (e as Any).status;
          if (st === 429) { unterbrochen = String((e as Error).message); fortsetzenAb = new Date(Date.now() + Number((e as Any).retryAfter || 30) * 1000).toISOString(); break; }
          if (st === 404) { fehler.push(`${a.name}: in Asana gelöscht, nicht neu angelegt`); break; }
          if ((e as Any).unklar && !gid) {
            /* Anlage mit unklarem Ausgang: vor einem neuen Versuch im Projekt nachsehen, nie blind doppelt anlegen. */
            try { for (const x of await asanaAlle(`/projects/${projekt}/tasks?opt_fields=name&limit=100`)) if (norm(x.name) === norm(a.name)) { gid = String(x.gid); imProjekt.set(norm(a.name), gid); gidsImProjekt.add(gid); } }
            catch (_e) { /* bleibt offen */ }
            if (gid) { neu++; erfolg = true; break; }
            if (versuch === 0) continue;
          }
          fehler.push(`${a.name}: ${String((e as Error).message).slice(0, 160)}`); break;
        }
      }
      if (unterbrochen) { rest = aufgaben.length - i; break; }
      if (!erfolg) continue;
      /* Nach der Änderung noch einmal: hat ein anderer Lauf übernommen, während die Anfrage lief, wird eine eigene
         Neuanlage zurückgenommen, statt eine Dublette zu hinterlassen. */
      if (!(await haltOk())) {
        if (neuAngelegt && gid) { try { await asana(`/tasks/${gid}`, 'DELETE'); neu--; } catch (e) { fehler.push(`${a.name}: Aufgabe ${gid} nach verlorener Sperre nicht zurückgenommen: ${String((e as Error).message).slice(0, 120)}`); } }
        unterbrochen = 'Sperre verloren; ein anderer Lauf ist dran'; rest = aufgaben.length - i; break;
      }
      erledigt.add(a.name);
      if (!test && ids.length) {
        /* Kennung sofort merken, damit ein Abbruch keine Dublette erzeugt; das erste Sendedatum bleibt. */
        const { data: n1, error: e1 } = await admin.rpc('hh_komm_gesendet', { p_ids: ids, p_gid: gid });
        if (e1) fehler.push(`${a.name}: Aufgabe ${gid} steht in Asana, ließ sich aber nicht merken: ${e1.message}`);
        else if (Number(n1) !== ids.length) fehler.push(`${a.name}: Aufgabe ${gid} steht in Asana, aber nur ${n1} von ${ids.length} Veröffentlichungen im Haus gefunden`);
        else for (const i of ids) gidJe.set(i, gid!);
      }
      if (++seitSpeichern >= 10) { seitSpeichern = 0; await laufSpeichern(false); }
    }
    await laufSpeichern(rest === 0 && !unterbrochen);
    const url = `https://app.asana.com/0/${projekt}`;
    const detail = { festival: f.short_name, projekt, url, neu, aktualisiert, rest, lauf: laufId, im_lauf_erledigt: erledigt.size,
      projektwechsel: verschoben ? { von: vorherProjekt, uebernommen: verschoben } : null, weiter: rest > 0, abgeschlossen: rest === 0 && !unterbrochen,
      unterbrochen: unterbrochen || null, fortsetzen_ab: fortsetzenAb, fehler, person: zust.name, vertretung, aufgaben: rahmen.aufgaben.length, abschnitte: rahmen.abschnitte.length };
    const protokoll = await log(logWhat, von, detail);
    if (!protokoll) fehler.push('Der Versand ließ sich nicht protokollieren (komm_log); die Projektkennung ' + projekt + ' steht nur in dieser Antwort.');
    return { status: 200, body: Object.assign({ ok: true, test, protokoll, saetze }, detail) };
  }

  /* Testprojekt aufräumen: erst die Aufgaben über ihre Kennungen löschen, dann das Projekt (nichts bleibt in „Meine Aufgaben“). */
  async function testAufraeumen(t: Any) {
    const von = ctx.whoNorm(t.by);
    if (von !== 'Alex' && von !== 'Lea') return { status: 403, body: { error: 'Nur Alex oder Lea' } };
    if (!ctx.ASANA_TOKEN) return { status: 400, body: { error: 'ASANA_TOKEN fehlt' } };
    const { data: logs } = await admin.from('komm_log').select('detail').eq('what', 'komm_send_test').not('detail->>projekt', 'is', null).order('at', { ascending: false }).limit(20);
    const kandidaten = Array.from(new Set((logs || []).map((l: Any) => String(l.detail.projekt))));
    const gefunden = await projektFinden(TEST_PROJEKT, null);
    if (gefunden && !kandidaten.includes(gefunden)) kandidaten.push(gefunden);
    let geloescht = 0, projekte = 0; const fehler: string[] = [];
    for (const p of kandidaten) {
      let meta: Any;
      try { meta = await asana(`/projects/${p}?opt_fields=name`); } catch (e) { if ((e as Any).status === 404) continue; fehler.push(String((e as Error).message)); continue; }
      if (norm(meta.name) !== norm(TEST_PROJEKT)) { fehler.push(`Projekt ${p} heißt „${meta.name}“, nicht angefasst`); continue; }
      let offen = 0;
      for (const a of await asanaAlle(`/projects/${p}/tasks?opt_fields=name&limit=100`)) {
        try { await asana(`/tasks/${a.gid}`, 'DELETE'); geloescht++; } catch (e) { if ((e as Any).status === 404) continue; offen++; fehler.push(String((e as Error).message).slice(0, 160)); }
      }
      /* Bleibt eine Aufgabe stehen, bleibt auch das Projekt: der nächste Aufruf findet sie dort wieder (Review 32c, Befund 4). */
      if (offen) { fehler.push(`Projekt ${p} bleibt, weil ${offen} Aufgaben nicht gelöscht werden konnten; bitte erneut aufräumen`); continue; }
      try { await asana(`/projects/${p}`, 'DELETE'); projekte++; } catch (e) { fehler.push(String((e as Error).message).slice(0, 160)); }
    }
    const protokoll = await log('komm_test_aufraeumen', von, { projekte, aufgaben: geloescht, fehler });
    return { status: 200, body: { ok: !fehler.length, projekte, aufgaben: geloescht, fehler, protokoll } };
  }

  /* ---------- Redaktionstabelle (32d) ---------- */
  function b64url(bytes: Uint8Array | string) {
    const s = typeof bytes === 'string' ? btoa(unescape(encodeURIComponent(bytes))) : btoa(String.fromCharCode(...bytes));
    return s.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  async function googleToken(): Promise<string> {
    const roh = Deno.env.get(DIENSTKONTO_SECRET) || '';
    const konto = JSON.parse(roh);
    const pem = String(konto.private_key || '').replace(/-----[^-]+-----/g, '').replace(/\s+/g, '');
    const der = Uint8Array.from(atob(pem), c => c.charCodeAt(0));
    const key = await crypto.subtle.importKey('pkcs8', der, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
    const jetzt = Math.floor(Date.now() / 1000);
    const kopf = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
    const inhalt = b64url(JSON.stringify({ iss: konto.client_email, scope: 'https://www.googleapis.com/auth/spreadsheets', aud: 'https://oauth2.googleapis.com/token', iat: jetzt, exp: jetzt + 3000 }));
    const sig = new Uint8Array(await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(`${kopf}.${inhalt}`)));
    const res = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${kopf}.${inhalt}.${b64url(sig)}` }) });
    const d = await res.json();
    if (!res.ok || !d.access_token) throw new Error('Google-Anmeldung des Dienstkontos fehlgeschlagen: ' + (d.error_description || d.error || res.status));
    return d.access_token;
  }
  async function sheets(token: string, pfad: string, methode = 'GET', koerper?: unknown) {
    const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}${pfad}`, { method: methode,
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' }, body: koerper === undefined ? undefined : JSON.stringify(koerper) });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) { const e: Any = new Error(`Sheets ${methode}: ${res.status} ${d?.error?.message || ''}`.trim()); e.status = res.status; throw e; }
    return d;
  }
  function serienDatum(n: number) { return K.plus('1899-12-30', Math.round(n)); }
  function zellText(c: Any) { return (c?.formattedValue ?? c?.userEnteredValue?.stringValue ?? '').toString(); }
  /* Eingegebener Inhalt: bei Formeln die Formel, nicht ihr Ergebnis (eine fremde Formel ="" ist nicht leer). */
  function zellRoh(c: Any) {
    const u = c?.userEnteredValue; if (!u) return '';
    if (u.formulaValue !== undefined) return String(u.formulaValue);
    if (u.stringValue !== undefined) return String(u.stringValue);
    if (u.numberValue !== undefined) return String(u.numberValue);
    if (u.boolValue !== undefined) return String(u.boolValue);
    return JSON.stringify(u);
  }

  async function tabelleSync(t: Any, by: string) {
    if (!Deno.env.get(DIENSTKONTO_SECRET)) {
      const { termine } = await tabelleTermine(t);
      if (!termine) return { status: 404, body: { error: 'Festival unbekannt' } };
      const ergebnis = 'nicht konfiguriert';
      const protokoll = await log('komm_tabelle_sync', by, { ergebnis, fehlt: DIENSTKONTO_SECRET, zellen: termine.length, festival: t.festival || 'alle' });
      return { status: 200, body: { ok: false, konfiguriert: false, fehlt: DIENSTKONTO_SECRET, hinweis: 'Dienstkonto im Google-Cloud-Projekt „Wilde Habitate Kalender“ anlegen, Sheets API aktivieren, Schlüssel als Secret eintragen und die Tabelle mit dem Dienstkonto teilen.',
        zellen: termine.length, vorschau: termine.slice(0, 12).map((x: Any) => ({ datum: x.datum, text: x.text })), protokoll } };
    }
    /* Erst die Sperre, dann Termine lesen und den Schreibplan bilden: ein älterer Lauf schreibt so nie veraltete Termine
       über einen neueren (Review 32d, Befund 3). */
    const sperrVon = await sperren('tabelle', 120);
    if (!sperrVon) return { status: 409, body: { error: 'Der Abgleich der Redaktionstabelle läuft gerade.' } };
    try {
      const { termine, fs, wahl } = await tabelleTermine(t);
      if (!termine) return { status: 404, body: { error: 'Festival unbekannt' } };
      return await tabelleGesperrt(t, by, fs!, wahl!, termine);
    } finally { await freigeben('tabelle', sperrVon); }
  }
  /* Fixtermine aus den aktuellen Plattformterminen. Prüfpunkte unabhängig vom heutigen Tag: vergangene bleiben in der
     Tabelle, solange es sie gibt (Review 32d, Befund 5). */
  async function tabelleTermine(t: Any) {
    const rw = await regelwerk();
    const fs = await festivals(rw);
    const heute = ctx.heuteBerlin();
    const wahl = (t.festival && t.festival !== 'alle') ? waehle(fs, t.festival) : fs;
    if (!wahl.length) return { termine: null };
    const saison = K.saisonStart(fs);
    const ber: Record<string, Any[]> = {};
    for (const f of fs) { const e = K.berechne(rw, f, heute, { saison_start: saison }); ber[f.short_name] = e.pubs.concat(e.vergangen_voll || []); }
    const alleTermine = K.fixtermine(rw, fs, ber);
    const wahlFid = new Set(wahl.map(f => f.fid));
    const betrifft = (x: Any) => wahl.length === fs.length || x.eintraege.some((e: Any) => wahlFid.has(String(e.id).split('-')[0]));
    return { termine: alleTermine.filter(betrifft), fs, wahl };
  }
  async function tabelleGesperrt(t: Any, by: string, fs: Any[], wahl: Any[], termine: Any[]) {
    const token = await googleToken();
    const meta = await sheets(token, '?fields=sheets(properties(sheetId,title,gridProperties(columnCount,rowCount)))');
    const reiter = (meta.sheets || []).find((s: Any) => s.properties?.title === SHEET_REITER);
    if (!reiter) return { status: 409, body: { error: `Reiter „${SHEET_REITER}“ nicht gefunden; nichts geschrieben` } };
    const sheetId = reiter.properties.sheetId;
    const spalten = reiter.properties.gridProperties?.columnCount || 0;
    const lesen = async () => {
      const r = encodeURIComponent(`'${SHEET_REITER}'!A${SHEET_DATUMSZEILE}:${K.spaltenName(spalten - 1)}${SHEET_ZEILE}`);
      const d = await sheets(token, `?ranges=${r}&includeGridData=true&fields=sheets(data(rowData(values(userEnteredValue,effectiveValue,formattedValue,note))))`);
      return d.sheets?.[0]?.data?.[0]?.rowData || [];
    };
    let zeilen = await lesen();
    const kopf = (zeilen[1]?.values || []).slice(0, SHEET_ERSTE_SPALTE).map(zellText).join(' ');
    if (!/fixtermin/i.test(kopf)) return { status: 409, body: { error: `Zeile ${SHEET_ZEILE} trägt nicht „Fixtermine & Meilensteine“ (gefunden: „${kopf.slice(0, 80)}“); Aufbau geändert, nichts geschrieben` } };
    /* F5: Freigabe Alex 06.10.2026, Kalender ab 01.10.2026. Genau einmal und nur aus der bekannten alten Formel
       (Review 32d, Befund 4). Wird F5 nach der Umstellung zurückgestellt, bleibt es so und steht als Konflikt im Bericht. */
    const f5 = zeilen[0]?.values?.[SHEET_ERSTE_SPALTE]?.userEnteredValue?.formulaValue || '';
    const f5n = f5.replace(/\s/g, '').toUpperCase();
    const { data: f5Log } = await admin.from('komm_log').select('id').eq('what', 'komm_tabelle_f5').limit(1);
    const f5Erledigt = (f5Log || []).length > 0;
    let f5Ergebnis = 'unverändert', konflikt: string[] = [];
    if (f5n !== SHEET_START_FORMEL) {
      if (f5n === SHEET_ALT_FORMEL.toUpperCase() && !f5Erledigt && !t.trocken) {
        const frisch = (await lesen())[0]?.values?.[SHEET_ERSTE_SPALTE]?.userEnteredValue?.formulaValue || '';
        if (frisch !== f5) { f5Ergebnis = 'F5 hat sich während des Abgleichs geändert; nicht geändert'; konflikt.push(f5Ergebnis); }
        else {
          await sheets(token, ':batchUpdate', 'POST', { requests: [{ updateCells: { start: { sheetId, rowIndex: SHEET_DATUMSZEILE - 1, columnIndex: SHEET_ERSTE_SPALTE },
            rows: [{ values: [{ userEnteredValue: { formulaValue: SHEET_START_FORMEL } }] }], fields: 'userEnteredValue' } }] });
          await log('komm_tabelle_f5', by, { vorher: f5, nachher: SHEET_START_FORMEL });
          f5Ergebnis = `von ${f5} auf ${SHEET_START_FORMEL}`;
          zeilen = await lesen();
        }
      } else if (f5Erledigt) { f5Ergebnis = `F5 trägt „${f5}“, obwohl es schon einmal umgestellt wurde; bleibt so (Rückstellung durch die Redaktion?)`; konflikt.push(f5Ergebnis); }
      else f5Ergebnis = t.trocken ? `würde ${f5} auf ${SHEET_START_FORMEL} setzen` : `F5 trägt „${f5}“, nicht die erwartete Formel; nicht geändert`;
    }
    const plan = planen(zeilen, termine, wahl.length === fs.length);
    /* Unmittelbar vor dem Schreiben frisch lesen und nur Zellen schreiben, die seit der Planung unverändert sind
       (Review 32d, Befund 2). Die Sheets-API kennt kein bedingtes Schreiben; ein Rest zwischen dieser Prüfung und dem
       Schreiben (Sekundenbruchteile) bleibt und ist im Technikstand benannt. */
    let anfragen: Any[] = [];
    if (plan.anfragen.length && !t.trocken) {
      const jetzt = (await lesen())[1]?.values || [];
      for (const r of plan.anfragen) {
        const i = r.spalte, vorher = plan.zeile6[i] || {}, nun = jetzt[i] || {};
        if (zellRoh(vorher) !== zellRoh(nun) || String(vorher.note || '') !== String(nun.note || '')) { plan.fremd.push({ zelle: `${K.spaltenName(i)}${SHEET_ZEILE}`, datum: r.datum, vorhanden: zellText(nun).slice(0, 80), soll: r.text, grund: 'während des Abgleichs geändert' }); continue; }
        anfragen.push({ updateCells: { start: { sheetId, rowIndex: SHEET_ZEILE - 1, columnIndex: i }, rows: [{ values: [r.wert] }], fields: 'userEnteredValue,note' } });
      }
      if (anfragen.length) await sheets(token, ':batchUpdate', 'POST', { requests: anfragen });
    } else anfragen = plan.anfragen;
    const geleert = t.trocken ? 0 : anfragen.filter((a: Any) => !a.updateCells?.rows?.[0]?.values?.[0]?.userEnteredValue && a.updateCells).length;
    const unvollstaendig = !plan.reichtBis || plan.reichtBis < '2027-12-31' || plan.doppelt.length > 0 || plan.ausserhalb.length > 0;
    const ergebnis = t.trocken ? 'Trockenlauf' : (unvollstaendig ? 'geschrieben, unvollständig' : 'geschrieben');
    const detail = { ergebnis, festival: t.festival || 'alle', f5: f5Ergebnis, konflikt, geschrieben: t.trocken ? 0 : anfragen.length - geleert, geleert, geplant: plan.anfragen.length,
      unveraendert: plan.unveraendert, fremd: plan.fremd, ausserhalb: plan.ausserhalb, doppelte_daten: plan.doppelt, spalten_bis: plan.reichtBis, reicht_bis_2027: !!plan.reichtBis && plan.reichtBis >= '2027-12-31' };
    const protokoll = await log('komm_tabelle_sync', by, detail);
    return { status: 200, body: Object.assign({ ok: !unvollstaendig && !konflikt.length, konfiguriert: true, protokoll }, detail) };
  }
  /* Schreibplan aus gelesenen Zeilen 5 und 6: Spalte je Datum aus den tatsächlichen Datumswerten (doppelte Daten werden
     nicht beschrieben), eigene Zellen nur mit vollständigem Nachweis (Review 32d, Befund 1). */
  function planen(zeilen: Any[], termine: Any[], voll: boolean) {
    const datumZu = new Map<string, number>(), doppelt: string[] = [];
    (zeilen[0]?.values || []).forEach((c: Any, i: number) => {
      const n = c?.effectiveValue?.numberValue; if (i < SHEET_ERSTE_SPALTE || typeof n !== 'number') return;
      const d = serienDatum(n); if (datumZu.has(d)) { doppelt.push(d); return; } datumZu.set(d, i);
    });
    for (const d of doppelt) datumZu.delete(d);
    const tage = Array.from(datumZu.keys()).sort();
    const reichtBis = tage[tage.length - 1] || null;
    const zeile6 = zeilen[1]?.values || [];
    const anfragen: Any[] = [], fremd: Any[] = [], ausserhalb: Any[] = [];
    let unveraendert = 0;
    const soll = new Map(termine.map((x: Any) => [x.datum, x]));
    for (const x of termine) {
      const i = datumZu.get(x.datum);
      if (i === undefined) { ausserhalb.push({ datum: x.datum, text: x.text, grund: doppelt.includes(x.datum) ? 'Datum steht mehrfach in Zeile 5' : 'Datum nicht in Zeile 5' }); continue; }
      const c = zeile6[i] || {};
      if (!K.zelleFrei(zellRoh(c), c.note, x.datum)) { fremd.push({ zelle: `${K.spaltenName(i)}${SHEET_ZEILE}`, datum: x.datum, vorhanden: zellText(c).slice(0, 80), soll: x.text }); continue; }
      const notiz = K.zellNotiz(x);
      if (zellRoh(c) === x.text && c.note === notiz) { unveraendert++; continue; }
      anfragen.push({ spalte: i, datum: x.datum, text: x.text, wert: { userEnteredValue: { stringValue: x.text }, note: notiz } });
    }
    /* Eigene Zellen, deren Termin es nicht mehr gibt, leeren: nur bei vollem Lauf und nur mit vollständigem Nachweis. */
    if (voll) {
      for (const [d, i] of datumZu.entries()) {
        const c = zeile6[i] || {};
        if (!/^komm:/.test(String(c?.note || '')) || soll.has(d) || !K.zelleFrei(zellRoh(c), c.note, d)) continue;
        anfragen.push({ spalte: i, datum: d, text: '', wert: {} });
      }
    }
    return { anfragen, fremd, ausserhalb, unveraendert, zeile6, reichtBis, doppelt };
  }

  /* ---------- Partner-Slots (32e) ---------- */
  function themaInfo(rw: Any, id: string | null) {
    const t = (rw.themenbibliothek || []).find((x: Any) => x.id === id);
    return t ? { id: t.id, titel: t.titel, inhalt: t.inhalt, beteiligte: t.beteiligte } : (id ? { id, titel: id } : null);
  }
  async function slotsOffen(t: Any) {
    const rw = await regelwerk();
    const fs = await festivals(rw);
    const heute = ctx.heuteBerlin();
    const wahl = (t.festival && t.festival !== 'alle') ? waehle(fs, t.festival) : fs;
    const shorts = wahl.map(f => f.short_name);
    const zeilen = shorts.length ? await alleZeilen(() => admin.from('komm_veroeffentlichungen')
      .select('id,festival_short,regel_id,titel,kanal,klasse,thema,bezug,t,vorlaeufig,briefing,stunden,partnerfaehig,partner_email,partner_uebernommen_am,freigabe_status,status_bearbeitung')
      .in('festival_short', shorts).eq('partnerfaehig', true).gte('t', K.plus(heute, 14)).order('t').order('id')) : [];
    const name = new Map(fs.map(f => [f.short_name, f]));
    const slots = zeilen.filter((p: Any) => K.slotOffen(p, heute)).map((p: Any) => ({
      id: p.id, festival_short: p.festival_short, festival: name.get(p.festival_short)?.name || p.festival_short, kuerzel: name.get(p.festival_short)?.kuerzel || null,
      titel: p.titel, kanal: p.kanal, klasse: p.klasse, t: p.t, abgabefrist: K.abgabefrist(p), vorlaeufig: p.vorlaeufig,
      format: p.briefing?.format || null, briefing: p.briefing || {}, thema: themaInfo(rw, p.thema), stunden: Number(p.stunden) }));
    return { status: 200, body: { ok: true, heute, slots, regel: rw.partner_regel || null } };
  }
  async function slotDetails(t: Any) {
    const id = String(t.id || '');
    if (!id) return { status: 400, body: { error: 'id fehlt' } };
    const rw = await regelwerk();
    const { data: p, error } = await admin.from('komm_veroeffentlichungen').select('*, komm_schritte(*)').eq('id', id).maybeSingle();
    if (error) throw error;
    if (!p || !p.partnerfaehig) return { status: 404, body: { error: 'Kein partnerfähiger Beitrag mit dieser Kennung' } };
    const fs = await festivals(rw);
    const f = fs.find(x => x.short_name === p.festival_short);
    return { status: 200, body: { ok: true, slot: {
      id: p.id, festival_short: p.festival_short, festival: f?.name || p.festival_short, titel: p.titel, kanal: p.kanal, klasse: p.klasse, t: p.t, t_neu: p.t_neu,
      abgabefrist: K.abgabefrist(p), vorlaeufig: p.vorlaeufig, briefing: p.briefing || {}, format: p.briefing?.format || null, thema: themaInfo(rw, p.thema),
      schritte: (p.komm_schritte || []).sort((a: Any, b: Any) => (a.start < b.start ? -1 : 1)).map((s: Any) => ({ schritt_id: s.schritt_id, phase: s.phase, titel: s.titel, rolle: s.rolle, start: s.start, faellig: s.faellig })),
      status_bearbeitung: p.status_bearbeitung, offen: K.slotOffen(p, ctx.heuteBerlin()),
      partner: { name: p.partner_name, uebernommen_am: p.partner_uebernommen_am, abgabe_am: p.abgabe_am, abgabe_url: p.abgabe_url, rechte_bestaetigt: p.rechte_bestaetigt,
        freigabe_status: p.freigabe_status, freigabe_am: p.freigabe_am } } } };
  }
  async function ueberlastMelden(t: Any, by: string) {
    const notiz = String(t.notiz || '').trim().slice(0, 1000);
    if (!notiz) return { status: 400, body: { error: 'notiz fehlt' } };
    const protokoll = await log('komm_ueberlast', by, { festival: t.festival || null, notiz });
    return { status: 200, body: { ok: protokoll } };
  }

  /* ---------- Tick (täglich mit absence_tick) ---------- */
  async function tick() {
    const bericht: string[] = [];
    try {
      const r = await berechnen('alle', 'Zeitplan');
      const b: Any = r.body;
      bericht.push('berechnet: ' + (b.ergebnis || []).map((e: Any) => e.fehler ? `${e.festival} Fehler` : `${e.kuerzel} ${e.berechnet}`).join(', '));
    } catch (e) { bericht.push('berechnen: ' + String((e as Error).message).slice(0, 160)); }
    try {
      const heute = ctx.heuteBerlin();
      const zeilen = await alleZeilen(() => admin.from('komm_veroeffentlichungen').select('id,festival_short,titel,t,partnerfaehig,partner_uebernommen_am,abgabe_am,freigabe_status,asana_task_gid')
        .eq('partnerfaehig', true).gte('t', heute).lte('t', K.plus(heute, 10)).order('id'));
      const ent = K.tickEntscheidungen(zeilen, heute);
      if (ent.zurueck.length) {
        /* Rückfall an die Redaktion: nur, solange niemand übernommen hat und die Freigabe offen ist. */
        const { data, error } = await admin.from('komm_veroeffentlichungen').update({ freigabe_status: 'zurueck_an_redaktion' })
          .in('id', ent.zurueck).is('partner_uebernommen_am', null).eq('freigabe_status', 'offen').select('id');
        if (error) bericht.push('Rückfall: ' + error.message);
        else if ((data || []).length) { await log('komm_rueckfall', 'Zeitplan', { ids: (data || []).map((x: Any) => x.id) }); bericht.push(`${(data || []).length} an die Redaktion zurück`); }
      }
      if (ent.hinweis.length) {
        /* Unter einer Sperre und nur bestätigte Zustellungen entdoppeln: ein fehlgeschlagener Versuch wird beim nächsten
           Tick wiederholt, zwei gleichzeitige Ticks schicken nichts doppelt (Review 32e, Befunde 1 und 2). */
        const hv = await sperren('hinweise', 120);
        if (!hv) bericht.push('Hinweise: ein anderer Lauf ist dabei');
        else try {
          const { data: schon, error: se } = await admin.from('komm_log').select('detail').eq('what', 'komm_hinweis').in('detail->>id', ent.hinweis);
          if (se) throw se;
          const gemeldet = new Set((schon || []).filter((l: Any) => l.detail?.asana === true).map((l: Any) => l.detail?.id));
          let zugestellt = 0, offen = 0;
          for (const id of ent.hinweis.filter((i: string) => !gemeldet.has(i))) {
            const p = zeilen.find((x: Any) => x.id === id);
            if (!p?.asana_task_gid || !ctx.ASANA_TOKEN) { offen++; await log('komm_hinweis_offen', 'Zeitplan', { id, festival: p?.festival_short, titel: p?.titel, t: p?.t, grund: 'keine Asana-Aufgabe' }); continue; }
            try {
              await asana(`/tasks/${p.asana_task_gid}/stories`, 'POST', { text: `Hinweis aus dem Hohen Haus: Für „${p.titel}“ am ${K.kurz(p.t)} liegt eine Abgabe eines Partners vor, die Freigabe fehlt noch. Bitte im Habitat Hub freigeben oder Korrektur anfordern.` });
              const ok = await log('komm_hinweis', 'Zeitplan', { id, festival: p.festival_short, titel: p.titel, t: p.t, asana: true });
              if (!ok) bericht.push(`Hinweis zu ${id} zugestellt, aber nicht protokolliert`);
              zugestellt++;
            } catch (e) { offen++; await log('komm_hinweis_offen', 'Zeitplan', { id, festival: p.festival_short, titel: p.titel, t: p.t, grund: String((e as Error).message).slice(0, 160) }); }
          }
          bericht.push(`${zugestellt} Hinweise zugestellt, ${offen} offen (nächster Tick versucht es erneut)`);
        } finally { await freigeben('hinweise', hv); }
      }
    } catch (e) { bericht.push('Partner-Slots: ' + String((e as Error).message).slice(0, 160)); }
    try {
      if (Deno.env.get(DIENSTKONTO_SECRET)) { const r: Any = await tabelleSync({ festival: 'alle' }, 'Zeitplan'); bericht.push(`Tabelle: ${r.body.ergebnis || r.body.error}${r.body.geschrieben !== undefined ? ', ' + r.body.geschrieben + ' Zellen' : ''}`); }
      else bericht.push('Tabelle: Dienstkonto fehlt');
    } catch (e) { bericht.push('Tabelle: ' + String((e as Error).message).slice(0, 160)); }
    return bericht;
  }

  /* Schlüssel der Anbindung für den Habitat Hub und den Baukasten (nur Server zu Server, nie im Browser). */
  function anbindungGueltig(req: Request, body: Any) {
    const soll = Deno.env.get('ANBINDUNG_SCHLUESSEL') || '';
    const ist = (req.headers.get('x-anbindung-schluessel') || body?.anbindung || '').toString();
    if (!soll || !ist || ist.length !== soll.length) return false;
    let d = 0; for (let i = 0; i < soll.length; i++) d |= soll.charCodeAt(i) ^ ist.charCodeAt(i);
    return d === 0;
  }
  const ANBINDUNG_AKTIONEN = new Set(['komm_slots_offen', 'komm_slot_details', 'komm_ueberlast']);

  async function handle(action: string, t: Any, who: string): Promise<Response> {
    let r: { status: number, body: Any };
    if (action === 'komm_list') r = { status: 200, body: await liste() };
    else if (action === 'komm_berechnen') r = await berechnen(t.festival || 'alle', (t.by ?? who).toString());
    else if (action === 'komm_pruefpunkt_set') r = await pruefpunktSetzen(t);
    else if (action === 'komm_send') r = await senden(t);
    else if (action === 'komm_test_aufraeumen') r = await testAufraeumen(t);
    else if (action === 'komm_tabelle_sync') r = await tabelleSync(t, ctx.whoNorm(t.by ?? who));
    else if (action === 'komm_slots_offen') r = await slotsOffen(t);
    else if (action === 'komm_slot_details') r = await slotDetails(t);
    else if (action === 'komm_ueberlast') r = await ueberlastMelden(t, (t.by ?? who).toString());
    else r = { status: 400, body: { error: 'unbekannte Aktion ' + action } };
    return json(r.body, r.status);
  }

  return { handle, tick, anbindungGueltig, ANBINDUNG_AKTIONEN };
}
