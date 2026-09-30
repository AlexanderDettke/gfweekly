/* launch-logik.js · V27 Phase B (30.09.2026) · reine Rechenlogik für launch.html.
   Kein DOM, kein Netz, keine Uhr: das heutige Datum kommt als Argument. Dadurch lässt sich alles in
   pruefung/launch-test.mjs nachrechnen. Im Browser liegt das Ergebnis als globales Objekt LaunchLogik,
   in node kommt es über require().

   Begriffe: Ein Meilenstein hat aufwand_lo/aufwand_hi (Stunden, Spanne aus den Richtwerten), dauer_tage
   (Kalendertage), generator_anteil (0 bis 1, der Teil, den Generatoren übernehmen können), person_id
   (zuständig), hilfe_person_id (übernimmt den Generator-Anteil), status und due_on (Zieltermin, aus dem
   VVK-Start und dem Abstand des Richtwerts gerechnet). Ein Richtwert bringt vorgaenger (Titel) und
   vvk_offset_tage. Alle Zahlen aus Richtwerten sind Spannen und werden über Ist-Stunden kalibriert. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.LaunchLogik = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const TAG = 86400000;
  const FERTIG = new Set(['complete', 'not_required']);
  const STATUS_WORT = { not_started: 'offen', in_progress: 'läuft', complete: 'erledigt', blocked: 'blockiert', under_review: 'in Prüfung', not_required: 'entfällt' };
  const WORT_STATUS = { offen: 'not_started', 'läuft': 'in_progress', laeuft: 'in_progress', erledigt: 'complete' };
  const ZUORDNUNG_WORT = { offen: 'offen', vorschlag: 'Vorschlag', bestaetigt: 'bestätigt', gesendet: 'gesendet' };
  const TYP_WORT = { gf: 'Geschäftsführung', team: 'Team', extern: 'extern', minijob: 'Minijob', agentur: 'Agentur', partner: 'Partner' };
  const HILFE_TYPEN = ['extern', 'minijob', 'agentur', 'partner'];
  /* Externe im Sinn des Versands (Typ extern, agentur, partner UND ohne Asana-Konto): sie bekommen keine Asana-Aufgabe,
     sondern eine Angebotsaufgabe beim Übergebenden. Externe mit Konto bekommen Aufgaben direkt wie das Team (v34, Entscheidung Alex 30.09.2026). */
  const EXTERN_TYPEN = ['extern', 'agentur', 'partner'];
  const ENTLASTUNG_MIN = 2;          // Stunden nach Briefing, ab denen neue Hilfe sinnvoll ist
  const GRENZE_PASST = 0.85, GRENZE_KNAPP = 1.10;

  /* ---- Datum, immer als ISO-Tag und in UTC, damit Sommerzeit nichts verschiebt ---- */
  function datum(isoTag) { return new Date(isoTag + 'T00:00:00Z'); }
  function iso(d) { return d.toISOString().slice(0, 10); }
  function istIso(x) { return typeof x === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(x); }
  function plusTage(isoTag, n) { const d = datum(isoTag); d.setUTCDate(d.getUTCDate() + n); return iso(d); }
  function tageZwischen(a, b) { return Math.round((datum(b) - datum(a)) / TAG); }
  function maxIso(liste) { let m = null; for (const x of liste) if (istIso(x) && (m === null || x > m)) m = x; return m; }
  function zahl(x, sonst) { const n = Number(x); return Number.isFinite(n) ? n : sonst; }
  function kurz(isoTag) { if (!istIso(isoTag)) return ''; const [j, m, t] = isoTag.split('-'); return `${t}.${m}.${j}`; }
  function kurzOhneJahr(isoTag) { if (!istIso(isoTag)) return ''; const [, m, t] = isoTag.split('-'); return `${t}.${m}.`; }

  /* ---- Zahlen als Wort und Spanne ---- */
  function fmt(n) {
    const v = Math.round(zahl(n, 0) * 10) / 10;
    return v.toLocaleString('de-DE', { maximumFractionDigits: 1 });
  }
  function spanne(lo, hi, einheit) {
    const a = zahl(lo, 0), b = zahl(hi, a);
    const e = einheit ? ' ' + einheit : '';
    return Math.abs(a - b) < 0.05 ? `${fmt(a)}${e}` : `${fmt(a)} bis ${fmt(b)}${e}`;
  }

  /* ---- Anteile eines Meilensteins: was bleibt beim Zuständigen, was geht an die Hilfe ---- */
  function anteile(m) {
    const lo = zahl(m.aufwand_lo, 0), hi = zahl(m.aufwand_hi, lo);
    const g = Math.min(1, Math.max(0, zahl(m.generator_anteil, 0)));
    const hatHilfe = !!m.hilfe_person_id && g > 0;
    const zu = hatHilfe ? 1 - g : 1, hi_ = hatHilfe ? g : 0;
    return { zust: { lo: lo * zu, hi: hi * zu }, hilfe: { lo: lo * hi_, hi: hi * hi_ }, generator: g, hatHilfe };
  }

  /* ---- Kette: fertig-am vorwärts gerechnet ----
     Beginn ist heute oder der Tag nach dem letzten Vorgänger; eine spätere Verfügbarkeit der zuständigen Person
     schiebt den Beginn. Erledigte Meilensteine liegen fest (completed_on, sonst due_on). Was läuft, hat schon
     begonnen und wartet nicht auf Vorgänger. Vorgänger kommen aus den Richtwerten und werden über den Titel im
     selben Festival gefunden; ein Zyklus wird abgebrochen und als Vorgänger ignoriert. */
  function kette(meilensteine, richtwerte, opt) {
    opt = opt || {};
    const heute = istIso(opt.heute) ? opt.heute : iso(new Date());
    const verf = opt.verfuegbarAb || {};
    const rw = new Map(); for (const r of richtwerte || []) rw.set(r.title, r);
    const nachTitel = new Map(); for (const m of meilensteine || []) if (!nachTitel.has(m.title)) nachTitel.set(m.title, m);
    const je = {};
    const offen = new Set();
    function rechne(m) {
      if (je[m.id]) return je[m.id];
      const r = rw.get(m.title) || {};
      if (FERTIG.has(m.status)) {
        const f = istIso(m.completed_on) ? m.completed_on : (istIso(m.due_on) ? m.due_on : heute);
        return (je[m.id] = { beginn: null, fertig: f, fest: true, verzug: 0, wort: STATUS_WORT[m.status] || 'erledigt' });
      }
      if (offen.has(m.id)) return { beginn: heute, fertig: heute, zyklus: true };   // Zyklus: als Vorgänger nicht zählen
      offen.add(m.id);
      let beginn = heute;
      if (m.status !== 'in_progress') {
        for (const t of (r.vorgaenger || [])) {
          const v = nachTitel.get(t); if (!v || v.id === m.id) continue;
          const e = rechne(v); if (e.zyklus) continue;
          const nach = e.fest ? e.fertig : plusTage(e.fertig, 1);
          if (nach > beginn) beginn = nach;
        }
        const ab = m.person_id ? verf[m.person_id] : null;
        if (istIso(ab) && ab > beginn) beginn = ab;
      }
      offen.delete(m.id);
      const dauer = Math.max(1, Math.round(zahl(m.dauer_tage, zahl(r.dauer_tage, 1))));
      const fertig = plusTage(beginn, dauer - 1);
      const verzug = istIso(m.due_on) ? tageZwischen(m.due_on, fertig) : null;
      const wort = verzug === null ? 'ohne Zieltermin' : verzug <= 0 ? 'im Plan' : `${verzug} ${verzug === 1 ? 'Tag' : 'Tage'} später als geplant`;
      return (je[m.id] = { beginn, fertig, fest: false, verzug, wort });
    }
    for (const m of meilensteine || []) rechne(m);
    /* Frühester machbarer VVK-Start: der Tag, an dem der Launchtag (Abstand 0 zum VVK, „Launch durchgeführt“)
       nach der Kette fertig sein kann. Er hängt über die Checkliste an allen Vorbereitungen. Die Abstände der
       übrigen Richtwerte sind Zieltermine, keine Mindestvorläufe: eine Positionierung, die am 5.10. steht,
       verhindert keinen Launch am 15.10. Fehlt der Launchtag oder ist er erledigt, gilt das späteste fertig-am
       der offenen Meilensteine mit Abstand ≤ 0; gibt es auch das nicht, keinen Wert. */
    let fruehesterVVK = null, ersatz = null;
    for (const m of meilensteine || []) {
      if (FERTIG.has(m.status)) continue;
      const r = rw.get(m.title); if (!r || r.vvk_offset_tage === null || r.vvk_offset_tage === undefined) continue;
      const off = zahl(r.vvk_offset_tage, 0); if (off > 0) continue;
      const f = je[m.id].fertig;
      if (off === 0 && (fruehesterVVK === null || f > fruehesterVVK)) fruehesterVVK = f;
      if (ersatz === null || f > ersatz) ersatz = f;
    }
    if (fruehesterVVK === null) fruehesterVVK = ersatz;
    return { je, fruehesterVVK, heute };
  }

  /* ---- Zeit je Person über alle laufenden Launches ----
     Stunden: als Zuständige der eigene Anteil, als Hilfe der Generator-Anteil, nur offene Meilensteine.
     Fenster: von heute (oder verfügbar ab) bis zum spätesten fertig-am oder Zieltermin, mindestens eine Woche.
     Wort nach der Mitte der Spanne: passt bis 85 Prozent, knapp bis 110 Prozent, sonst zu viel.
     Ohne launch_std_woche heißt es „keine Zeit eingetragen“ und zählt nicht als Überlast. */
  function last(meilensteine, personen, opt) {
    opt = opt || {};
    const heute = istIso(opt.heute) ? opt.heute : iso(new Date());
    const fertigJe = opt.fertigJe || {};
    const je = new Map();
    for (const p of personen || []) je.set(p.id, { person: p, lo: 0, hi: 0, aufgaben: 0, festivals: new Set(), ende: null });
    for (const m of meilensteine || []) {
      if (FERTIG.has(m.status)) continue;
      const a = anteile(m);
      const ende = (fertigJe[m.id] && fertigJe[m.id].fertig) || (istIso(m.due_on) ? m.due_on : null);
      const buche = (pid, s) => {
        const e = je.get(pid); if (!e) return;
        e.lo += s.lo; e.hi += s.hi; e.aufgaben++; if (m.festival) e.festivals.add(m.festival);
        if (ende && (!e.ende || ende > e.ende)) e.ende = ende;
      };
      if (m.person_id) buche(m.person_id, a.zust);
      if (a.hatHilfe && m.hilfe_person_id) buche(m.hilfe_person_id, a.hilfe);
    }
    const aus = [];
    for (const e of je.values()) {
      const p = e.person;
      const beginn = istIso(p.verfuegbar_ab) && p.verfuegbar_ab > heute ? p.verfuegbar_ab : heute;
      const tage = e.ende && e.ende > beginn ? tageZwischen(beginn, e.ende) + 1 : 1;
      const wochen = Math.max(1, Math.ceil(tage / 7));
      const proWoche = { lo: e.lo / wochen, hi: e.hi / wochen };
      const std = p.launch_std_woche === null || p.launch_std_woche === undefined || p.launch_std_woche === '' ? null : zahl(p.launch_std_woche, null);
      let quote = null, wort = 'keine Zeit eingetragen', ueber = false;
      if (std !== null && std > 0) {
        const mitte = (proWoche.lo + proWoche.hi) / 2;
        quote = mitte / std;
        wort = quote <= GRENZE_PASST ? 'passt' : quote <= GRENZE_KNAPP ? 'knapp' : 'zu viel';
        ueber = wort === 'zu viel';
      } else if (std !== null && std === 0) { quote = e.hi > 0 ? Infinity : 0; wort = e.hi > 0 ? 'zu viel' : 'passt'; ueber = e.hi > 0; }
      aus.push({ person_id: p.id, name: p.name, typ: p.typ, stunden: { lo: e.lo, hi: e.hi }, aufgaben: e.aufgaben,
        festivals: [...e.festivals], beginn, ende: e.ende, wochen, proWoche, std, quote,
        prozent: quote === null ? null : (quote === Infinity ? null : Math.round(quote * 100)), wort, ueber,
        ohneZeit: std === null });
    }
    return aus;
  }

  /* ---- Lage eines Festivals in vier Zahlen ---- */
  function lage(meilensteine, lastListe, ketteErg) {
    const offen = (meilensteine || []).filter(m => !FERTIG.has(m.status));
    let lo = 0, hi = 0; for (const m of offen) { lo += zahl(m.aufwand_lo, 0); hi += zahl(m.aufwand_hi, zahl(m.aufwand_lo, 0)); }
    const beteiligt = new Set(); for (const m of offen) { if (m.person_id) beteiligt.add(m.person_id); if (m.hilfe_person_id) beteiligt.add(m.hilfe_person_id); }
    const ueber = (lastListe || []).filter(l => l.ueber && beteiligt.has(l.person_id));
    const ohneZeit = (lastListe || []).filter(l => l.ohneZeit && beteiligt.has(l.person_id));
    return { offen: offen.length, stunden: { lo, hi }, fruehesterVVK: ketteErg ? ketteErg.fruehesterVVK : null,
      ueber: ueber.length, ueberNamen: ueber.map(l => l.name), ohneZeit: ohneZeit.length, beteiligt: beteiligt.size };
  }
  function lageSatz(festival, l) {
    const name = festival && (festival.kurzname || festival.name) || 'Dieses Festival';
    if (!l.offen) return `${name}: alle Aufgaben sind erledigt.`;
    const teile = [
      `${l.offen} offene ${l.offen === 1 ? 'Aufgabe' : 'Aufgaben'}`,
      `${spanne(l.stunden.lo, l.stunden.hi, 'Stunden')} nach Richtwerten`,
      l.fruehesterVVK ? `frühestens machbar am ${kurz(l.fruehesterVVK)}` : 'kein Termin ableitbar',
      l.ueber ? `${l.ueber} ${l.ueber === 1 ? 'Person' : 'Personen'} über ihrer Zeit` : 'niemand über seiner Zeit',
    ];
    return `${name}: ${teile.join(', ')}.`;
  }

  /* ---- Hilfe dazuholen: lohnt es sich? ----
     als = 'hilfe' (nur der Generator-Anteil) oder 'zustaendig' (der ganze Meilenstein).
     Briefing-Stunden gehen zu Lasten des Übergebenden. Neue Hilfe ist erst sinnvoll, wenn nach dem Briefing
     mindestens zwei Stunden Entlastung bleiben, gerechnet am unteren Rand der Spanne. Kosten nur mit Stundensatz. */
  function hilfeBewerten(m, helfer, opt) {
    opt = opt || {};
    const als = opt.als === 'zustaendig' ? 'zustaendig' : 'hilfe';
    const lo = zahl(m.aufwand_lo, 0), hi = zahl(m.aufwand_hi, lo);
    const g = Math.min(1, Math.max(0, zahl(m.generator_anteil, 0)));
    const anteil = als === 'hilfe' ? g : 1;
    const uebergeben = { lo: lo * anteil, hi: hi * anteil };
    const briefing = zahl(helfer && helfer.briefing_std, 0);
    const entlastung = { lo: uebergeben.lo - briefing, hi: uebergeben.hi - briefing };
    const sinnvoll = anteil > 0 && entlastung.lo >= ENTLASTUNG_MIN;
    const satz = helfer && helfer.stundensatz !== null && helfer.stundensatz !== undefined && helfer.stundensatz !== '' ? zahl(helfer.stundensatz, null) : null;
    const kosten = satz === null ? null : { lo: uebergeben.lo * satz, hi: uebergeben.hi * satz };
    let grund;
    if (anteil === 0) grund = 'Der Meilenstein hat keinen Generator-Anteil, es gibt nichts abzugeben.';
    else if (!sinnvoll) grund = `Nach ${fmt(briefing)} Stunden Briefing bleiben ${spanne(entlastung.lo, entlastung.hi, 'Stunden')} Entlastung, das ist zu wenig (mindestens ${ENTLASTUNG_MIN}).`;
    else grund = `Entlastet um ${spanne(entlastung.lo, entlastung.hi, 'Stunden')} nach ${fmt(briefing)} Stunden Briefing.`;
    return { als, anteil, uebergeben, briefing, entlastung, sinnvoll, kosten, grund };
  }

  /* ---- Reihenfolge im Pool: Team, dann Hilfe, dann GF; darin nach sort_order und Name ---- */
  function rang(p) { const t = p && p.typ; if (t === 'team') return 0; if (HILFE_TYPEN.includes(t)) return 1; if (t === 'gf') return 2; return 1; }
  function reihenfolge(pool) {
    return [...(pool || [])].sort((a, b) => rang(a) - rang(b) || zahl(a.sort_order, 0) - zahl(b.sort_order, 0) || String(a.name).localeCompare(String(b.name), 'de'));
  }
  function istHilfeTyp(p) { return !!p && HILFE_TYPEN.includes(p.typ); }
  function hatKonto(p) { return !!p && !!(p.hat_asana || p.asana_gid); }
  function istExtern(p) { return !!p && EXTERN_TYPEN.includes(p.typ) && !hatKonto(p); }
  function zuweisbar(pool) { return (pool || []).filter(p => p.active !== false && p.assignable !== false); }

  /* ---- Kandidaten für Umverteilen: Pool-Personen mit passendem Feld; bei Generator-Arbeit alle mit Zeit;
     Alex und Lea nur über den Schalter. Das ist die Auswahl des Weges, nicht eine Sperre: in der Aufgabenliste
     bleibt jede Person überall wählbar. ---- */
  function kandidaten(bereich, pool, opt) {
    opt = opt || {};
    const lastJe = new Map(); for (const l of (opt.last || [])) lastJe.set(l.person_id, l);
    const hatZeit = p => { const l = lastJe.get(p.id); return !!l && !l.ohneZeit && !l.ueber; };
    const aus = new Map();
    for (const p of zuweisbar(pool)) {
      const gf = p.typ === 'gf';
      if (gf && !opt.mitGF) continue;
      const feld = (p.felder || []).includes(bereich);
      const gen = !!opt.generatorArbeit && p.generator !== false && hatZeit(p);
      if (feld || gen || (gf && opt.mitGF)) aus.set(p.id, Object.assign({}, p, { grund: feld ? 'Feld passt' : gen ? 'Generator-Arbeit, hat Zeit' : 'Geschäftsführung' }));
    }
    return reihenfolge([...aus.values()]);
  }

  /* ---- VVK-Start verschieben: neue Zieltermine aus den Richtwerten, Erledigtes bleibt ---- */
  function vvkVerschieben(meilensteine, richtwerte, neuerVVK) {
    if (!istIso(neuerVVK)) return [];
    const rw = new Map(); for (const r of richtwerte || []) rw.set(r.title, r);
    const aus = [];
    for (const m of meilensteine || []) {
      if (FERTIG.has(m.status)) continue;
      const r = rw.get(m.title); if (!r || r.vvk_offset_tage === null || r.vvk_offset_tage === undefined) continue;
      const neu = plusTage(neuerVVK, zahl(r.vvk_offset_tage, 0));
      aus.push({ id: m.id, title: m.title, due_on_alt: istIso(m.due_on) ? m.due_on : null, due_on_neu: neu, geaendert: m.due_on !== neu });
    }
    return aus;
  }
  /* Abstand des neuen Termins zu den anderen Launches, in Tagen (positiv: der neue liegt danach). */
  function abstaende(festivals, eventId, neuerVVK) {
    if (!istIso(neuerVVK)) return [];
    return (festivals || []).filter(f => f.event_id !== eventId && istIso(f.sales_start_on))
      .map(f => ({ event_id: f.event_id, short_name: f.short_name, name: f.kurzname || f.name, sales_start_on: f.sales_start_on, tage: tageZwischen(f.sales_start_on, neuerVVK) }))
      .sort((a, b) => Math.abs(a.tage) - Math.abs(b.tage));
  }
  function abstandWort(tage) {
    const n = Math.abs(tage);
    const w = n === 0 ? 'am selben Tag' : `${n} ${n === 1 ? 'Tag' : 'Tage'} ${tage > 0 ? 'danach' : 'davor'}`;
    return w;
  }

  /* ---- Versandregel: wer bekommt in Asana was ---- */
  function versandWeg(person) {
    if (!person) return { weg: 'keine', wort: 'niemand zuständig' };
    if (istExtern(person)) return { weg: 'angebot', wort: 'Angebot einholen und beauftragen, beim Übergebenden' };
    if (!hatKonto(person)) return { weg: 'notiz', wort: 'ohne Asana-Konto, bleibt als Notiz auf der Seite' };
    return { weg: 'aufgabe', wort: 'Aufgabe in Asana' };
  }

  function statusWort(s) { return STATUS_WORT[s] || s || 'offen'; }
  function statusAusWort(w) { return WORT_STATUS[w] || w; }
  function zuordnungWort(z) { return ZUORDNUNG_WORT[z] || z || 'offen'; }
  function typWort(t) { return TYP_WORT[t] || t || ''; }
  function festivalKurz(name) { return String(name || '').replace(/\s+20\d\d$/, ''); }

  return { FERTIG, STATUS_WORT, ZUORDNUNG_WORT, TYP_WORT, HILFE_TYPEN, EXTERN_TYPEN, ENTLASTUNG_MIN, GRENZE_PASST, GRENZE_KNAPP,
    plusTage, tageZwischen, maxIso, kurz, kurzOhneJahr, fmt, spanne, anteile, kette, last, lage, lageSatz, hilfeBewerten,
    reihenfolge, istHilfeTyp, istExtern, hatKonto, zuweisbar, kandidaten, vvkVerschieben, abstaende, abstandWort, versandWeg,
    statusWort, statusAusWort, zuordnungWort, typWort, festivalKurz };
});
