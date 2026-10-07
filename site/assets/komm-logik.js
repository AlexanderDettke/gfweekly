/* komm-logik.js · V32 Kommunikation (06.10.2026) · reine Rechenlogik des Postingplan-Standards.
   Port von docs/referenz/postingplan/referenz-rechner.py (Regelwerk Schema 1.2.0). Kein DOM, kein Netz, keine Uhr:
   Regelwerk, Festivaldaten und das heutige Datum kommen als Argument. Dieselbe Datei läuft im Browser
   (globales Objekt KommLogik), in node (require) und in der Edge Function (Kopie unter
   supabase/functions/gfweekly/komm-logik.js, byte-gleich, geprüft in pruefung/komm-test.mjs).

   Abweichung von der Referenz, bewusst: Redaktionsslots werden ab dem Vorverkaufsstart V gezählt, nicht ab
   max(heute, V). So bleiben Kennung, Termin und Thema eines Slots von Tag zu Tag gleich (Rechenregel 10: stabile
   Kennung), und ein Partner, der einen Slot übernimmt, behält ihn. Vergangene Slots fallen danach wie alle
   vergangenen Veröffentlichungen heraus. Mit { referenz: true } rechnet berechne() exakt wie der Python-Rechner;
   der Test vergleicht beide Wege mit der Beispiel-CSV. Für Lusatia (V nach dem Stichtag 05.10.2026) sind beide gleich. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.KommLogik = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const TAG = 86400000;
  const MONATE = ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];
  /* Kürzel je Festival für die Redaktionstabelle und die Seite; Regelwerk-Kennung je short_name der Plattform. */
  const FESTIVALS = {
    LUSRD27: { fid: 'lus', kuerzel: 'LUS' },
    FAMRD27: { fid: 'dbd', kuerzel: 'DB' },
    BYNRD27: { fid: 'bn', kuerzel: 'BN' },
    WMRD27:  { fid: 'wm', kuerzel: 'WM' },
    FLRD27:  { fid: 'flu', kuerzel: 'FLU' },
  };
  /* Klassen, die als eigene Aufgabe nach Asana gehen (Paket 32c); M nur als Pflichtveröffentlichung. */
  const ASANA_EINZELN = new Set(['P', 'L', 'PR', 'TM', 'NL', 'AD', 'INT']);
  const STUFEN = ['gruen', 'gelb', 'rot', 'knapp', 'offen'];
  const STUFE_WORT = { gruen: 'grün', gelb: 'gelb', rot: 'rot', knapp: 'knapp', offen: 'offen' };
  const FREIGABE = ['offen', 'freigegeben', 'korrektur', 'abgelehnt', 'zurueck_an_redaktion'];
  const STELLE_STUNDEN = 35;

  /* ---------- Datum ---------- */
  function ms(iso) { return Date.parse(String(iso).slice(0, 10) + 'T00:00:00Z'); }
  function iso(t) { return new Date(t).toISOString().slice(0, 10); }
  function plus(isoTag, n) { return iso(ms(isoTag) + n * TAG); }
  function tage(a, b) { return Math.round((ms(b) - ms(a)) / TAG); }
  function wochentag(isoTag) { return (new Date(ms(isoTag)).getUTCDay() + 6) % 7; } // 0 = Montag
  function montag(isoTag) { return plus(isoTag, -wochentag(isoTag)); }
  function maxIso(a, b) { return a > b ? a : b; }
  function minIso(a, b) { return a < b ? a : b; }
  function kurz(isoTag) { if (!isoTag) return ''; const [y, m, d] = String(isoTag).slice(0, 10).split('-'); return `${d}.${m}.${y}`; }
  function kurzOhneJahr(isoTag) { if (!isoTag) return ''; const [, m, d] = String(isoTag).slice(0, 10).split('-'); return `${d}.${m}.`; }
  function monatName(isoTag) { const [y, m] = String(isoTag).split('-'); return `${MONATE[Number(m) - 1]} ${y}`; }
  /* Python round(): bei .5 zur geraden Zahl (Rechenregel 7 im Referenz-Rechner). */
  function rundeWiePython(x) {
    const f = Math.floor(x), r = x - f;
    if (Math.abs(r - 0.5) < 1e-9) return f % 2 === 0 ? f : f + 1;
    return Math.round(x);
  }
  /* Zahl wie Python str(float): 1.0 statt 1. */
  function zahlPy(x) { return Number.isInteger(Number(x)) ? Number(x).toFixed(1) : String(x); }
  function runde(x, stellen) { const p = Math.pow(10, stellen); return Math.round((x + Number.EPSILON) * p) / p; }

  /* Werktagsregel: Samstag, Sonntag und Feiertag rücken auf den Werktag davor (Rechenregel 6). */
  function werktag(isoTag, feiertage) {
    let d = isoTag;
    while (wochentag(d) >= 5 || feiertage.has(d)) d = plus(d, -1);
    return d;
  }

  /* ---------- Regelwerk ---------- */
  function regelwerkInfo(rw) {
    const v = rw.verbund_2027;
    const ev = {};
    for (const e of rw.ereignisse || []) ev[e.kuerzel] = e;
    return {
      feiertage: new Set(v.feiertage || []),
      stichtag: v.stichtag_vorproduktion,
      fenster: v.vorproduktion_fenster_tage,
      gaesteinfos: v.stichtag_gaesteinfos_freigegeben,
      ereignisse: ev,
      partnerThemen: new Set(rw.partnerfaehig_themen || []),
    };
  }
  /* Festival aus Plattform und Regelwerk: Termine aus der Plattform (vvp_events), Merkmale aus dem Regelwerk. */
  function festivalAus(rw, ev) {
    const zuo = FESTIVALS[ev.short_name] || null;
    const f = zuo ? (rw.festivals_2027 || []).find(x => x.id === zuo.fid) : null;
    return {
      short_name: ev.short_name, fid: zuo ? zuo.fid : String(ev.short_name || '').toLowerCase(),
      kuerzel: zuo ? zuo.kuerzel : String(ev.short_name || ''), name: f ? (f.kurz || f.name) : String(ev.name || '').replace(/\s+20\d\d$/, ''),
      ausgabe: f ? f.ausgabe : (ev.year || 2027), V: ev.sales_start_on || null, F: ev.starts_on || null, Z: ev.ends_on || null,
      A: (f && f.A) || null, merkmale: f ? Object.assign({}, f.merkmale) : {}, pruefen: f ? (f.pruefen || null) : null,
      ziel_gaeste: f ? f.ziel_gaeste : null, event_id: ev.id || ev.event_id || null,
    };
  }
  /* Beginn der Saison für den Verbund-Stichtag: F-21 des ersten Festivals. */
  function saisonStart(festivals) {
    const fs = festivals.map(f => f.F).filter(Boolean).sort();
    return fs.length ? plus(fs[0], -21) : null;
  }

  /* Faktenquelle je Fachrolle, für das Briefing. */
  const FAKTENQUELLE = {
    'FACH-TIX': 'Ticketsystem und Prognoseplattform (Preise, Kontingente, Fristen)',
    'FACH-PROG': 'Programmplanung (bestätigte Namen, Schreibweisen, Zeiten, Embargos)',
    'FACH-CARE': 'Care-Team (Angebote, Kontaktwege, Zugänglichkeit)',
    'FACH-BETR': 'Betrieb (Anreise, Gelände, Einlass, Sicherheit)',
    KOM: 'Festivalprofil und Prognoseplattform',
  };

  /* ---------- Rückwärtsrechnung ----------
     berechne(rw, festival, heute, { saison_start, referenz })
     festival: { fid, name, ausgabe, V, F, Z, A?, merkmale, pruefen? }
     Ergebnis: { pubs, vergangen, wochen, offen } · pubs je Veröffentlichung mit Schritten, sortiert nach T und Regel. */
  function berechne(rw, festival, heute, opt) {
    opt = opt || {};
    const info = regelwerkInfo(rw);
    const FT = info.feiertage;
    const wt = d => werktag(d, FT);
    const STICHTAG = info.stichtag, FENSTER = info.fenster;
    const SAISON = opt.saison_start || saisonStart([festival]);
    const V = festival.V, F = festival.F, Z = festival.Z;
    if (!V || !F || !Z) return { pubs: [], vergangen: [], wochen: [], offen: ['V, F oder Z fehlt in der Plattform'] };
    const merk = Object.assign({}, festival.merkmale || {});
    /* Annahmen wie im Referenz-Rechner: Anzeigenbudget freigegeben, Testkauf erfolgreich, kein Black-Friday-Angebot. */
    merk.budget_freigegeben = true; merk.testkauf_erfolgreich = true; merk.angebot_freigegeben = false;
    const E = info.ereignisse;
    const pAbst = (E.P && E.P.standard_abstaende_zu_F) || [-200, -150, -100, -45];
    const ev = {
      V: [V], F: [F], Z: [Z], R: [plus(Z, 60)], L: [V],
      P: pAbst.map(n => plus(F, n)),
      'S-BF': [(E['S-BF'] && E['S-BF'].datum_2026) || '2026-11-27'],
      'S-XMAS': [(E['S-XMAS'] && E['S-XMAS'].datum_2026) || '2026-12-15'],
      'S-NL': (E['S-NL'] && E['S-NL'].daten_2027) || ['2027-01-20', '2027-03-17', '2027-04-28'],
    };
    if (festival.A) ev.A = [festival.A];
    const offen = ['D-PREIS (Preiswechsel)', 'D-ADDON (Buchungsschlüsse)', 'D-TRANSFER (Ticketumschreibung)', 'B-OPEN/D-BEW (Bewerbungen)', 'G (begleitende Veranstaltungen)', 'A (Aufbaubeginn)', 'L (eigener Launch, hier gleich V gesetzt)'];
    let pubs = [];
    for (const r of rw.regeln) {
      if (r.id === 'SLOT' || !ev[r.bezug]) continue;
      if (r.bedingung && !merk[r.bedingung]) continue;
      ev[r.bezug].forEach((e, i) => pubs.push({ regel: r, T: plus(e, r.abstand), nr: i + 1 }));
    }
    /* Zusammenführen: L und V am selben Tag (Rechenregel 3). */
    if (ev.L[0] === V) pubs = pubs.filter(p => p.regel.id !== 'L-HAUPT' && p.regel.id !== 'L-NEUGIER');
    /* Redaktionsslots (Regel SLOT). */
    const feeds = pubs.filter(p => p.regel.kanal === 'feed' || p.regel.kanal === 'reel').map(p => p.T).sort();
    const rate = d => {
      if (d < plus(V, 28)) return 1.25;
      if (d < plus(F, -150)) return 0.6;
      if (d < plus(F, -60)) return 1.0;
      if (d < F) return 2.0;
      if (d <= Z) return 0;
      if (d <= plus(Z, 30)) return 1.25;
      return 0;
    };
    const grund = ['erlebnis', 'menschen', 'entscheidung', 'orientierung'];
    const genutzt = {};
    const slotregel = rw.regeln.find(r => r.id === 'SLOT');
    let acc = 0, k = 0, d = opt.referenz ? maxIso(heute, V) : V;
    const ende = plus(Z, 30);
    while (d <= ende) {
      acc += rate(d) / 7;
      if (feeds.some(x => x === d)) acc -= 1;
      else if (acc >= 1 && !feeds.some(x => Math.abs(tage(x, d)) <= 2)) {
        const kl = [0, 2, 4].includes(k % 5) ? 'S' : 'M';
        const fx = tage(F, d);
        const kand = (rw.themenbibliothek || []).filter(t => t.slot && t.slot.von <= fx && fx <= t.slot.bis);
        let r;
        if (kand.length) {
          const t = kand.slice().sort((a, b) => ((genutzt[a.id] || 0) - (genutzt[b.id] || 0)) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))[0];
          genutzt[t.id] = (genutzt[t.id] || 0) + 1;
          r = Object.assign({}, slotregel, { klasse: kl, abstand: 0, bezug: 'phase', thema: t.id, titel: `${t.titel} (${t.id})`, inhalt: t.inhalt });
        } else {
          r = Object.assign({}, slotregel, { klasse: kl, abstand: 0, bezug: 'phase', thema: grund[k % 4], titel: 'Redaktionsslot ' + grund[k % 4] });
        }
        pubs.push({ regel: r, T: d, nr: k + 1 });
        feeds.push(d); k++; acc -= 1;
      }
      d = plus(d, 1);
    }
    /* Prüfpunkte: V+7, V+28, alle 28 Tage bis F-90, dann F-90, -60, -45, -30, -21. */
    const pp = [plus(V, 7), plus(V, 28)];
    let x = plus(V, 56);
    while (x < plus(F, -90)) { pp.push(x); x = plus(x, 28); }
    for (const n of [-90, -60, -45, -30, -21]) pp.push(plus(F, n));
    const ppSortiert = Array.from(new Set(pp)).sort();
    const ppSchritt = (rw.pruefpunkte && rw.pruefpunkte.schritt) || {};
    ppSortiert.forEach((t, i) => pubs.push({ regel: { id: 'PRUEF', bezug: 'pruefpunkt', abstand: 0, klasse: 'INT', titel: 'Prüfpunkt Verkauf gegen Zielpfad', kanal: 'intern', fachfreigabe: 'FACH-TIX',
      schritte: [{ id: 'I1', phase: 'nachbereitung', titel: 'Verkauf, Fragen, Reichweite prüfen; Stufe festlegen; Extras auswählen', rolle: ppSchritt.rolle || 'KOM', werkzeug: null, von: 0, bis: 0, stunden: ppSchritt.stunden || 0.5, werktag: true }] }, T: t, nr: i + 1 }));
    /* Begleitende Website-Updates (Rechenregel 5). */
    const extra = [];
    for (const p of pubs) {
      if ((p.regel.begleitend || []).includes('website')) {
        extra.push({ regel: { id: p.regel.id + '-WEB', bezug: p.regel.bezug, abstand: p.regel.abstand || 0, klasse: 'WEB', titel: 'Website zu: ' + p.regel.titel,
          kanal: 'website', fachfreigabe: p.regel.fachfreigabe || 'KOM', zielgruppe: p.regel.zielgruppe, zweck: p.regel.zweck, inhalt: p.regel.inhalt, pflicht_von: p.regel.id }, T: p.T, nr: p.nr });
      }
    }
    pubs = pubs.concat(extra);
    /* Rang für das Vorziehen über das Vorproduktionsfenster: früheste Veröffentlichung zuerst (stabil wie Python sorted). */
    const vz = pubs.map((p, i) => ({ p, i })).filter(o => SAISON && o.p.T >= SAISON && ['M', 'P', 'L'].includes(o.p.regel.klasse))
      .sort((a, b) => (a.p.T < b.p.T ? -1 : a.p.T > b.p.T ? 1 : a.i - b.i));
    const rang = new Map(vz.map((o, i) => [o.p.regel.id + '|' + o.p.T, i]));
    /* Vergangene Veröffentlichungen werden nicht nachgeholt, ihre Schritte aber mitgerechnet: was nach T noch läuft
       (Anzeigenkontrolle, Nachbereitung), gehört zur Wochenlast (Review 32a, Runde 2, Befund 3). */
    const vergangen = pubs.filter(p => (p.T < heute && p.regel.id !== 'V-SHOP') || (p.regel.id === 'V-SHOP' && V < heute));
    const vergSet = new Set(vergangen);
    pubs.sort((a, b) => (a.T < b.T ? -1 : a.T > b.T ? 1 : (a.regel.id < b.regel.id ? -1 : a.regel.id > b.regel.id ? 1 : 0)));
    const aus = [], ausVergangen = [];
    for (const p of pubs) {
      const r = p.regel, T = p.T, kl = r.klasse, kanal = r.kanal || '';
      const bez = r.bezug + ((r.bezug === 'P' || r.bezug === 'S-NL' || r.id === 'SLOT' || r.id === 'PRUEF') ? String(p.nr) : '');
      const id = `${festival.fid}-${festival.ausgabe}-${r.id}-${bez}-${kanal}`;
      const vorlage = (r.schritte && r.schritte.length) ? r.schritte : ((rw.klassen[kl] && rw.klassen[kl].schritte) || []);
      let steps = [];
      for (const s of vorlage) {
        if (s.wiederholung) {
          const endeLz = plus(T, r.laufzeit_tage || 28);
          let w = plus(T, 7), n = 0;
          while (w <= endeLz) {
            steps.push({ schritt_id: `${s.id}w${n + 1}`, phase: s.phase, titel: `${s.titel} (Woche ${n + 1})`, rolle: s.rolle, werkzeug: s.werkzeug || null, start: wt(w), faellig: wt(w), stunden: s.stunden_je_wiederholung });
            w = plus(w, 7); n++;
          }
          continue;
        }
        let a = s.von, b = s.bis;
        if (typeof a === 'string') { const endeLz = plus(T, r.laufzeit_tage || 28); a = b = tage(T, endeLz) + 3; }
        let st = plus(T, a), fa = plus(T, b);
        if (s.werktag !== false) { st = wt(st); fa = wt(fa); }
        let rolle = s.rolle;
        if (rolle === null || rolle === undefined || rolle === '{fachfreigabe}') rolle = r.fachfreigabe || 'KOM';
        steps.push({ schritt_id: s.id, phase: s.phase, titel: s.titel, rolle, werkzeug: s.werkzeug || null, start: st, faellig: fa, stunden: s.stunden });
      }
      if ((r.begleitend || []).includes('story')) steps.push({ schritt_id: 'X9', phase: 'posting', titel: 'Story begleitend ausspielen', rolle: 'CM', werkzeug: 'GEN-CONTENT', start: T, faellig: T, stunden: 0.5 });
      let hinweis = '';
      if (SAISON && T >= SAISON && ['M', 'P', 'L'].includes(kl)) {
        const betroffen = steps.filter(s => ['planung', 'erstellung', 'abstimmung'].includes(s.phase));
        const spaet = betroffen.map(s => s.faellig).sort().pop();
        if (spaet && spaet > STICHTAG) {
          const i = rang.get(r.id + '|' + T);
          const ziel = plus(plus(STICHTAG, -FENSTER), rundeWiePython((i + 1) * FENSTER / Math.max(1, rang.size)));
          const delta = tage(spaet, minIso(ziel, STICHTAG));
          for (const s of betroffen) { s.start = wt(plus(s.start, delta)); s.faellig = wt(plus(s.faellig, delta)); }
          steps.push({ schritt_id: 'E9', phase: 'erstellung', titel: 'Fakten aktualisieren und Fassung finalisieren', rolle: 'RED', werkzeug: 'GEN-TEXT', start: wt(plus(T, -7)), faellig: wt(plus(T, -6)), stunden: 0.5 });
          hinweis = `vorgezogen auf Stichtag ${kurzOhneJahr(STICHTAG)}`;
        }
      }
      /* Stabil nach Start, dann Fälligkeit (wie Python sort mit Schlüssel). */
      steps = steps.map((s, i) => ({ s, i })).sort((a, b) => (a.s.start < b.s.start ? -1 : a.s.start > b.s.start ? 1 : (a.s.faellig < b.s.faellig ? -1 : a.s.faellig > b.s.faellig ? 1 : a.i - b.i))).map(o => o.s);
      const h = steps.reduce((sum, s) => sum + Number(s.stunden || 0), 0);
      const thema = r.thema || themaZurRegel(rw, r.pflicht_von || r.id);
      const partnerfaehig = r.id === 'SLOT' ? info.partnerThemen.has(r.thema) : !!r.partnerfaehig;
      const vorlaeufig = !!(festival.pruefen && ['F', 'Z', 'R', 'P'].includes(r.bezug));
      const ff = r.fachfreigabe || 'KOM';
      (vergSet.has(p) ? ausVergangen : aus).push({
        id, regel_id: r.id, titel: r.titel, kanal, klasse: kl, thema: thema || null, bezug: r.bezug, abstand: r.abstand || 0, nr: p.nr, t: T,
        vorlaeufig, pflicht: r.id !== 'SLOT', partnerfaehig,
        briefing: { zielgruppe: r.zielgruppe || null, zweck: r.zweck || null, inhalt: r.inhalt || null, fachfreigabe: ff, faktenquelle: FAKTENQUELLE[ff] || FAKTENQUELLE.KOM,
          format: (rw.formate || {})[kanal] || null, bezug: `${r.bezug}${r.abstand ? (r.abstand > 0 ? '+' : '') + r.abstand : ''}` },
        stunden: runde(h, 2), hinweis, start: steps.length ? steps.map(s => s.start).sort()[0] : T,
        ende: kl === 'INT' ? (steps.length ? steps.map(s => s.faellig).sort().pop() : T) : T,
        schritte: steps,
      });
    }
    /* Wochenaufgaben je Phase (laufende Arbeit). */
    const grenzen = [['winterruhe', maxIso(heute, plus(V, 28)), plus(F, -150)], ['programmaufbau', plus(F, -150), plus(F, -60)],
      ['heisse_phase', plus(F, -60), plus(F, -7)], ['festival', plus(F, -7), plus(Z, 1)], ['nachbereitung', plus(Z, 1), plus(Z, 15)]];
    if (plus(V, 28) > heute) grenzen.unshift(['verkaufsstart', maxIso(heute, V), plus(V, 28)]);
    const wochen = [];
    for (const wa of rw.wochenaufgaben || []) {
      const teile = [];
      for (const [ph, a, b] of grenzen) {
        if (b <= a) continue;
        const sj = wa.stunden_je_woche || {};
        const rt = sj[ph] !== undefined ? sj[ph] : (sj.alle_aktiven_phasen !== undefined ? sj.alle_aktiven_phasen : (sj.programmaufbau !== undefined ? sj.programmaufbau : 1.0));
        teile.push({ phase: ph, von: a, bis: b, je_woche: rt, stunden: rt * tage(a, b) / 7 });
      }
      wochen.push({ id: `${festival.fid}-${festival.ausgabe}-${wa.id}`, regel_id: wa.id, titel: wa.titel, rolle: wa.rolle, werkzeug: wa.werkzeug || null,
        von: grenzen[0][1], bis: grenzen[grenzen.length - 1][2], teile });
    }
    return { pubs: aus, vergangen: vergangen.map(p => ({ regel_id: p.regel.id, t: p.T })), vergangen_voll: ausVergangen, wochen, offen };
  }
  function themaZurRegel(rw, regelId) {
    const t = (rw.themenbibliothek || []).find(x => (x.regeln || []).includes(regelId));
    return t ? t.id : null;
  }

  /* Hauptaufgaben und Schritte als CSV-Zeilen wie der Referenz-Rechner (für den Test). */
  function csvZeilen(festival, erg, heute) {
    const rows = [];
    for (const a of erg.pubs) {
      const ueber = a.schritte.some(s => s.faellig < heute);
      rows.push({ aufgabe_id: a.id, eltern_id: '', regel_id: a.regel_id, titel: a.titel, schritt: '', phase: '', rolle: 'KOM', werkzeug: '', start: a.start, faellig: a.ende,
        stunden: a.stunden, kanal: a.kanal, klasse: a.klasse, bezug: a.bezug, abstand: a.abstand, veroeffentlichung: a.t,
        status: a.t < heute ? 'ueberfaellig' : (ueber ? 'teilweise_ueberfaellig' : 'offen'), hinweis: a.hinweis });
      for (const s of a.schritte) rows.push({ aufgabe_id: `${a.id}-${s.schritt_id}`, eltern_id: a.id, regel_id: a.regel_id, titel: s.titel, schritt: s.schritt_id, phase: s.phase, rolle: s.rolle,
        werkzeug: s.werkzeug || '', start: s.start, faellig: s.faellig, stunden: s.stunden, kanal: a.kanal, klasse: a.klasse, bezug: a.bezug, abstand: a.abstand, veroeffentlichung: a.t,
        status: s.faellig < heute ? 'ueberfaellig' : 'offen', hinweis: '' });
    }
    for (const w of erg.wochen) {
      rows.push({ aufgabe_id: w.id, eltern_id: '', regel_id: w.regel_id, titel: w.titel, schritt: '', phase: '', rolle: w.rolle, werkzeug: w.werkzeug || '', start: w.von, faellig: w.bis,
        stunden: '', kanal: 'laufend', klasse: 'WOCHE', bezug: 'phase', abstand: '', veroeffentlichung: '', status: 'offen', hinweis: 'wiederkehrend wöchentlich' });
      for (const t of w.teile) rows.push({ aufgabe_id: `${w.id}-${t.phase}`, eltern_id: w.id, regel_id: w.regel_id, titel: `${w.titel} (${t.phase.replace(/_/g, ' ')})`, schritt: t.phase, phase: 'laufend',
        rolle: w.rolle, werkzeug: w.werkzeug || '', start: t.von, faellig: t.bis, stunden: runde(t.stunden, 1), kanal: 'laufend', klasse: 'WOCHE', bezug: 'phase', abstand: '', veroeffentlichung: '', status: 'offen', hinweis: `${zahlPy(t.je_woche)} h pro Woche` });
    }
    return rows;
  }

  /* ---------- Auswertung für Seite und Edge Function ---------- */
  /* Ein Schritt ist überfällig, wenn seine Fälligkeit vor heute liegt und die Veröffentlichung noch kommt (Rechenregel 8). */
  const ERLEDIGT = new Set(['veroeffentlicht', 'dokumentiert']);
  /* Gilt eine Veröffentlichung noch als kommend? V-SHOP liegt vor V und zählt, solange V nicht vorbei ist (wie im Referenz-Rechner). */
  function aktuell(p, heute) {
    if (p.regel_id === 'V-SHOP') return plus(p.t, -Number(p.abstand || 0)) >= heute;
    return p.t >= heute;
  }
  function ueberfaellig(pubs, heute) {
    let schritte = 0; const veroeff = [];
    for (const p of pubs) {
      if (!aktuell(p, heute) || ERLEDIGT.has(p.status_bearbeitung)) continue;
      const n = (p.schritte || []).filter(s => s.faellig < heute).length;
      if (n) { schritte += n; veroeff.push(p.id); }
    }
    return { schritte, veroeffentlichungen: veroeff.length, ids: veroeff };
  }
  function naechste(pubs, heute, tageVoraus, nurPflicht) {
    const bis = plus(heute, tageVoraus);
    return pubs.filter(p => p.t >= heute && p.t <= bis && (!nurPflicht || p.pflicht) && p.kanal !== 'intern')
      .sort((a, b) => (a.t < b.t ? -1 : a.t > b.t ? 1 : String(a.titel).localeCompare(String(b.titel))));
  }
  /* Wochenlast: Stunden je Montag. Schritte verteilen ihre Stunden gleichmäßig über die Tage von Start bis Fälligkeit,
     Wochenaufgaben ihre Rate über ihre Phase. Ergebnis je Woche und Festival. */
  function wochenlast(festivals, heute, bisTag) {
    const last = {};
    const buche = (tag, fest, h) => {
      if (tag < montag(heute) || (bisTag && tag > bisTag)) return;
      const w = montag(tag);
      const e = last[w] || (last[w] = { woche: w, gesamt: 0, je: {} });
      e.je[fest] = (e.je[fest] || 0) + h; e.gesamt += h;
    };
    for (const f of festivals) {
      for (const p of f.pubs || []) for (const s of p.schritte || []) {
        const n = Math.max(1, tage(s.start, s.faellig) + 1);
        for (let i = 0; i < n; i++) buche(plus(s.start, i), f.kuerzel, Number(s.stunden || 0) / n);
      }
      for (const w of f.wochen || []) for (const t of w.teile || []) {
        const n = tage(t.von, t.bis);
        for (let i = 0; i < n; i++) buche(plus(t.von, i), f.kuerzel, t.je_woche / 7);
      }
    }
    return Object.values(last).sort((a, b) => (a.woche < b.woche ? -1 : 1)).map(e => ({
      woche: e.woche, gesamt: runde(e.gesamt, 1), stellen: runde(e.gesamt / STELLE_STUNDEN, 1),
      je: Object.fromEntries(Object.entries(e.je).map(([k, v]) => [k, runde(v, 1)])),
    }));
  }
  function stellenWort(stunden) {
    const s = stunden / STELLE_STUNDEN;
    if (s <= 1) return 'bis eine Stelle';
    if (s <= 2) return 'bis zwei Stellen';
    if (s <= 3) return 'bis drei Stellen';
    if (s <= 4) return 'bis vier Stellen';
    return 'über vier Stellen';
  }
  /* Jahresband je Festival: Phasen, Programmwellen, Videos, Prüfpunkte. */
  function jahresband(rw, festival, pubs) {
    const V = festival.V, F = festival.F, Z = festival.Z;
    if (!V || !F || !Z) return { phasen: [], wellen: [], videos: [], pruefpunkte: [] };
    const grenze = s => { const m = /^([VFZ])([+-]\d+)?$/.exec(s); if (!m) return null; const basis = { V, F, Z }[m[1]]; return plus(basis, m[2] ? Number(m[2]) : 0); };
    const phasen = (rw.phasen || []).map(ph => ({ id: ph.id, von: grenze(ph.von), bis: grenze(ph.bis), je_woche: ph.feedbeitraege_pro_woche })).filter(p => p.von && p.bis && p.bis > p.von);
    return {
      phasen,
      wellen: pubs.filter(p => p.regel_id === 'P-WELLE').map(p => ({ t: p.t, nr: p.nr, lineup: p.nr === 4 })),
      videos: pubs.filter(p => p.klasse === 'L').map(p => ({ t: p.t, titel: p.titel })),
      pruefpunkte: pubs.filter(p => p.regel_id === 'PRUEF').map(p => ({ t: p.t, nr: p.nr })),
    };
  }

  /* ---------- Asana (32c) ----------
     Rahmen für die verantwortliche Person: Einzelaufgaben je Veröffentlichung der Klassen P, L, PR, TM, NL, AD, INT
     und Pflicht-M; alles Übrige (S, Slots, WEB) je Monat gebündelt; Prüfpunkte als Aufgaben mit Link.
     Die Schritte stehen als abhakbare Liste in der Beschreibung. Abschnitt = Monat des Veröffentlichungstags. */
  function asanaEinzeln(p) { return ASANA_EINZELN.has(p.klasse) || (p.klasse === 'M' && p.pflicht); }
  function schrittListe(p) {
    return (p.schritte || []).map(s => `[ ] ${kurz(s.faellig)} ${s.titel} (${s.rolle}${s.werkzeug ? ', ' + s.werkzeug : ''}, ${String(s.stunden).replace('.', ',')} h)`).join('\n');
  }
  /* Mehrfache Ereignisse (Programmwellen, Saisonnewsletter) tragen ihre Nummer im Namen, damit der Name im Projekt eindeutig bleibt. */
  function nummer(p) { return p.bezug === 'P' ? ` (Welle ${p.nr})` : p.bezug === 'S-NL' ? ` (${p.nr})` : ''; }
  function asanaRahmen(festival, pubs, basisUrl) {
    const einzeln = [], buendel = {};
    const link = `${basisUrl || ''}/kommunikation.html?festival=${encodeURIComponent(festival.short_name || '')}`;
    for (const p of pubs) {
      const abschnitt = monatName(p.t);
      if (p.regel_id === 'PRUEF') {
        einzeln.push({ art: 'pruefpunkt', vid: p.id, name: `Prüfpunkt ${p.nr} · ${festival.name}: Verkauf gegen Zielpfad`, due_on: p.t, abschnitt,
          notes: [`Prüfpunkt ${p.nr} am ${kurz(p.t)}: Verkauf laut Ticketsystem gegen Zielpfad, Kaufabbrüche, wiederkehrende Fragen, Reichweite, Klicks auf den Kaufweg.`,
            'Stufe festlegen (grün, gelb, rot, knapp) und Extras auswählen. Stufe Rot und Extras mit Budget entscheidet die Geschäftsführung.',
            `Stufe eintragen im Hohen Haus: ${link}`, '', 'Vorschlag aus dem Regelwerk, Verteilung durch dich:', schrittListe(p)].join('\n') });
        continue;
      }
      if (asanaEinzeln(p)) {
        const b = p.briefing || {};
        einzeln.push({ art: 'veroeffentlichung', vid: p.id, name: `${p.titel}${nummer(p)} · ${p.kanal} · ${festival.name}`, due_on: p.t, abschnitt,
          notes: [`Veröffentlichung am ${kurz(p.t)} · Klasse ${p.klasse} · Bezug ${b.bezug || p.bezug}${p.vorlaeufig ? ' · Termin vorläufig' : ''}${p.hinweis ? ' · ' + p.hinweis : ''}`,
            b.zielgruppe ? `Zielgruppe: ${String(b.zielgruppe).replace(/_/g, ' ')}` : '', b.zweck ? `Zweck: ${b.zweck}` : '', b.inhalt ? `Inhalt: ${b.inhalt}` : '',
            `Fachfreigabe: ${b.fachfreigabe || 'KOM'} · Faktenquelle: ${b.faktenquelle || ''}`, b.format ? `Format: ${b.format}` : '',
            `Richtwert ${String(p.stunden).replace('.', ',')} Stunden.`, '', 'Vorschlag aus dem Regelwerk, Verteilung durch dich:', schrittListe(p), '', `Kennung ${p.id} · ${link}`].filter(z => z !== '').join('\n') });
        continue;
      }
      const e = buendel[abschnitt] || (buendel[abschnitt] = { art: 'buendel', abschnitt, monat: p.t.slice(0, 7), pubs: [] });
      e.pubs.push(p);
    }
    const buendelListe = Object.values(buendel).sort((a, b) => (a.monat < b.monat ? -1 : 1)).map(e => {
      const n = e.pubs.length, letzte = e.pubs.map(p => p.t).sort().pop();
      const zeilen = e.pubs.map(p => `[ ] ${kurz(p.t)} ${p.titel}${nummer(p)} · ${p.kanal} · Klasse ${p.klasse}${p.partnerfaehig ? ' · Partner-Slot' : ''}${p.vorlaeufig ? ' · vorläufig' : ''}`);
      return { art: 'buendel', vid: null, ids: e.pubs.map(p => p.id), name: `Redaktion ${e.abschnitt}: ${n} Beiträge · ${festival.name}`, due_on: letzte, abschnitt: e.abschnitt,
        notes: [`${n} Beiträge im ${e.abschnitt}, Richtwert ${String(runde(e.pubs.reduce((s, p) => s + p.stunden, 0), 1)).replace('.', ',')} Stunden. Fällig ist die letzte Veröffentlichung des Monats.`,
          'Partner-Slots können Kollektive und Formatpartner im Habitat-Baukasten übernehmen; ohne Übernahme fallen sie 10 Tage vorher an die Redaktion zurück.',
          '', 'Vorschlag aus dem Regelwerk, Verteilung durch dich:', ...zeilen, '', link].join('\n') };
    });
    const alle = einzeln.concat(buendelListe);
    const abschnitte = Array.from(new Set(alle.map(a => a.abschnitt))).sort((a, b) => {
      const k = s => { const [m, y] = s.split(' '); return y + String(MONATE.indexOf(m)).padStart(2, '0'); };
      return k(a) < k(b) ? -1 : 1;
    });
    return { aufgaben: alle, abschnitte, einzeln: einzeln.length, buendel: buendelListe.length, pruefpunkte: einzeln.filter(a => a.art === 'pruefpunkt').length };
  }
  /* Vorschau in Worten wie bei launch_send. */
  function versandSaetze(festival, rahmen, person, bekannt) {
    const neu = rahmen.aufgaben.filter(a => !(bekannt || new Set()).has(a.name)).length;
    const s = [];
    s.push(`Projekt „Kommunikation ${festival.name} ${festival.ausgabe || 2027}“ in Asana, Eigentum und Zuständigkeit bei ${person || 'niemandem (Kommunikation nicht besetzt)'}.`);
    s.push(`${rahmen.einzeln - rahmen.pruefpunkte} Veröffentlichungen als eigene Aufgabe, ${rahmen.pruefpunkte} Prüfpunkte, ${rahmen.buendel} Monatsbündel für die übrigen Beiträge; Abschnitte je Monat (${rahmen.abschnitte.length}).`);
    s.push(neu === rahmen.aufgaben.length ? `Alle ${neu} Aufgaben werden neu angelegt.` : `${neu} neu, ${rahmen.aufgaben.length - neu} werden aktualisiert (Fälligkeit und Beschreibung; Zuständigkeit, Unteraufgaben, Kommentare und Abschnitt bleiben).`);
    return s;
  }

  /* ---------- Redaktionstabelle (32d) ----------
     Fixtermine je Tag, Festival als Kürzel. Ergebnis: [{ datum, eintraege: [{ id, text }] }] */
  function fixtermine(rw, festivals, berechnet) {
    const info = regelwerkInfo(rw);
    const tag = {};
    const add = (d, id, text) => { if (!d) return; (tag[d] || (tag[d] = [])).push({ id, text }); };
    for (const f of festivals) {
      const k = f.kuerzel;
      add(f.V, `${f.fid}-V`, `${k} VVK`);
      const pubs = (berechnet && berechnet[f.short_name]) || [];
      const wellen = (f.F ? ((info.ereignisse.P && info.ereignisse.P.standard_abstaende_zu_F) || [-200, -150, -100, -45]).map(n => plus(f.F, n)) : []);
      wellen.forEach((d, i) => add(d, `${f.fid}-P${i + 1}`, i === wellen.length - 1 ? `${k} Lineup` : `${k} P${i + 1}`));
      add(f.F, `${f.fid}-F`, `${k} F`);
      add(f.Z, `${f.fid}-Z`, `${k} Z`);
      for (const p of pubs.filter(x => x.regel_id === 'PRUEF')) add(p.t, `${f.fid}-PRUEF${p.nr}`, `${k} Prüfpunkt`);
    }
    add(info.stichtag, 'verbund-stichtag', 'Stichtag Vorproduktion');
    add(info.gaesteinfos, 'verbund-gaesteinfos', 'Gästeinfos freigegeben');
    return Object.keys(tag).sort().map(d => ({ datum: d, eintraege: tag[d], text: tag[d].map(e => e.text).join(' · '), notiz: `komm:fix-${d}` }));
  }
  /* Spalte der Tabelle zu einem Datum: Spalte F (Index 5, 0-basiert) ist der Starttag. */
  function spalteZu(startTag, datum) { const i = tage(startTag, datum); return i < 0 ? null : 5 + i; }
  function spaltenName(index0) { let n = index0 + 1, s = ''; while (n > 0) { const r = (n - 1) % 26; s = String.fromCharCode(65 + r) + s; n = Math.floor((n - 1) / 26); } return s; }
  /* Darf eine Zelle geschrieben werden? Leer oder schon von uns (Hinweis beginnt mit komm:). */
  function zelleFrei(wert, notiz) { return (!wert || !String(wert).trim()) || /^komm:/.test(String(notiz || '')); }

  /* ---------- Partner-Slots (32e) ---------- */
  function slotOffen(p, heute) {
    return !!p.partnerfaehig && !p.partner_uebernommen_am && !p.partner_email && p.t >= plus(heute, 14)
      && (!p.freigabe_status || p.freigabe_status === 'offen') && p.status_bearbeitung !== 'zu_pruefen';
  }
  function abgabefrist(p) { return plus(p.t, -7); }
  /* Automatik im Tick: Rückfall an die Redaktion 10 Tage vor T, Hinweis 3 Tage vor T bei Abgabe ohne Freigabe. */
  function tickEntscheidungen(pubs, heute) {
    const zurueck = [], hinweis = [];
    for (const p of pubs) {
      if (!p.partnerfaehig || p.t < heute) continue;
      const tageBis = tage(heute, p.t);
      const status = p.freigabe_status || 'offen';
      if (!p.partner_uebernommen_am && tageBis <= 10 && status === 'offen') zurueck.push(p.id);
      if (p.abgabe_am && tageBis <= 3 && status !== 'freigegeben' && status !== 'abgelehnt' && status !== 'zurueck_an_redaktion') hinweis.push(p.id);
    }
    return { zurueck, hinweis };
  }

  /* ---------- Lage je Festival für die Kopfzeile ---------- */
  function wort(n, eins, mehr) { return n === 1 ? `1 ${eins}` : `${n} ${mehr}`; }
  function zahlWort(n) { return ['keine', 'eine', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun', 'zehn', 'elf', 'zwölf'][n] || String(n); }
  function naechsterPruefpunkt(pubs, entscheidungen, heute) {
    const p = pubs.filter(x => x.regel_id === 'PRUEF' && x.t >= heute).sort((a, b) => (a.t < b.t ? -1 : 1))[0];
    if (!p) return null;
    const e = (entscheidungen || []).find(x => x.datum === p.t);
    return { datum: p.t, nr: p.nr, stufe: e ? e.stufe : 'offen' };
  }

  return { TAG, FESTIVALS, ASANA_EINZELN, STUFEN, STUFE_WORT, FREIGABE, STELLE_STUNDEN, MONATE,
    ms, iso, plus, tage, wochentag, montag, maxIso, minIso, kurz, kurzOhneJahr, monatName, rundeWiePython, runde, werktag,
    regelwerkInfo, festivalAus, saisonStart, berechne, csvZeilen, themaZurRegel,
    aktuell, ueberfaellig, naechste, wochenlast, stellenWort, jahresband,
    asanaEinzeln, schrittListe, asanaRahmen, versandSaetze,
    fixtermine, spalteZu, spaltenName, zelleFrei,
    slotOffen, abgabefrist, tickEntscheidungen,
    wort, zahlWort, naechsterPruefpunkt };
});
