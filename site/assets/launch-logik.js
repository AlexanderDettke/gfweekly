/* launch-logik.js · V27 Phase B (30.09.2026), erweitert V28 (30.09.2026) · reine Rechenlogik für launch.html und saison.html.
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


  /* ===== V28 · Saison: vier Fragen aus denselben Daten =====
     Alles hier ist wie oben rein: heute kommt als Argument, Namen werden über Rückrufe aufgelöst (opt.name, opt.festival,
     opt.bereich), damit die Logik weder den Pool noch das DOM kennen muss. ===== */
  const KRITISCH = ['Content produziert', 'Hauptfilm freigegeben', 'Launch-Checkliste vollständig', 'Launch durchgeführt'];
  const FENSTER_LAUNCHES = 42, FENSTER_ENTSCHEIDEN = 21, FENSTER_LAST = 60;

  function listeWorte(liste) {
    const l = (liste || []).filter(x => x !== null && x !== undefined && x !== '');
    if (!l.length) return '';
    if (l.length === 1) return String(l[0]);
    return l.slice(0, -1).join(', ') + ' und ' + l[l.length - 1];
  }
  function tageWort(n) { const a = Math.abs(n); return `${a} ${a === 1 ? 'Tag' : 'Tage'}`; }
  function anzahlWort(n, ein, mehr) { return `${n} ${n === 1 ? ein : mehr}`; }

  /* ---- Phasen: welche läuft, welche kommt. Laufen zwei zugleich (Analyse bis 15.10., Systembau ab 01.10.),
     ist die jüngere die Phase der Lage, die ältere läuft aus. ---- */
  function phaseHeute(phasen, heute) {
    heute = istIso(heute) ? heute : iso(new Date());
    const liste = phasen || [];
    const laufend = liste.filter(p => istIso(p.von) && istIso(p.bis) && p.von <= heute && heute <= p.bis);
    const aktuell = laufend.length ? laufend.reduce((a, b) => (b.von > a.von ? b : a)) : null;
    const naechste = liste.filter(p => istIso(p.von) && p.von > heute).sort((a, b) => a.von.localeCompare(b.von))[0] || null;
    const je = {};
    for (const p of liste) {
      let stand = 'später';
      if (p === aktuell) stand = 'läuft';
      else if (laufend.includes(p)) stand = 'läuft aus';
      else if (p === naechste) stand = 'als Nächstes';
      else if (istIso(p.bis) && p.bis < heute) stand = 'vorbei';
      je[p.key] = { stand, tageBisEnde: istIso(p.bis) ? tageZwischen(heute, p.bis) : null, tageBisBeginn: istIso(p.von) ? tageZwischen(heute, p.von) : null };
    }
    return { aktuell, laufend, naechste, je, heute };
  }

  /* ---- Launches in einem Fenster ab heute, nach VVK-Start ---- */
  function launchesBis(festivals, heute, tage) {
    heute = istIso(heute) ? heute : iso(new Date());
    const bis = plusTage(heute, zahl(tage, FENSTER_LAUNCHES));
    return (festivals || []).filter(f => istIso(f.sales_start_on) && f.sales_start_on >= heute && f.sales_start_on <= bis)
      .sort((a, b) => a.sales_start_on.localeCompare(b.sales_start_on));
  }
  /* Besetzung eines Bereichs an einem Festival: Person und Status als Wort. */
  function besetzungVon(besetzung, eventId, bereich) {
    const z = (besetzung || []).find(b => b.event_id === eventId && b.bereich === bereich) || null;
    const status = z && z.person_id ? (z.status === 'bestaetigt' ? 'bestaetigt' : 'vorschlag') : 'offen';
    return { zeile: z, person_id: z && z.person_id || null, status, wort: ZUORDNUNG_WORT[status] };
  }

  /* ---- Lage der Saison in Zahlen: Launches in sechs Wochen, Festivalverantwortung, offene Aufgaben bis Jahresende,
     Personen mit eingetragener Zeit ---- */
  function saisonLage(festivals, meilensteine, besetzung, pool, opt) {
    opt = opt || {};
    const heute = istIso(opt.heute) ? opt.heute : iso(new Date());
    const jahresende = istIso(opt.jahresende) ? opt.jahresende : heute.slice(0, 4) + '-12-31';
    const bald = launchesBis(festivals, heute, opt.fenster || FENSTER_LAUNCHES).map(f => Object.assign({}, f, { fv: besetzungVon(besetzung, f.event_id, 'fv') }));
    const alle = (festivals || []).map(f => Object.assign({}, f, { fv: besetzungVon(besetzung, f.event_id, 'fv') }));
    const ohneFv = alle.filter(f => f.fv.status === 'offen');
    const baldOhneFv = bald.filter(f => f.fv.status === 'offen');
    const baldNurVorschlag = bald.filter(f => f.fv.status === 'vorschlag');
    const offeneBisJahresende = (meilensteine || []).filter(m => !FERTIG.has(m.status) && istIso(m.due_on) && m.due_on <= jahresende).length;
    const ohneTermin = (meilensteine || []).filter(m => !FERTIG.has(m.status) && !istIso(m.due_on)).length;
    const leute = zuweisbar(pool);
    const mitZeit = leute.filter(p => p.launch_std_woche !== null && p.launch_std_woche !== undefined && p.launch_std_woche !== '');
    return { heute, jahresende, bald, ohneFv, baldOhneFv, baldNurVorschlag, offeneBisJahresende, ohneTermin, personenMitZeit: mitZeit.length, poolGesamt: leute.length };
  }
  function saisonLageSatz(l, phase) {
    const n = l.bald.length;
    let satz1;
    if (!n) satz1 = 'In den nächsten sechs Wochen startet kein Launch.';
    else {
      const namen = l.bald.map(f => `${f.kurzname || f.name} (${kurzOhneJahr(f.sales_start_on)})`);
      satz1 = `In den nächsten sechs Wochen ${n === 1 ? 'startet ein Launch' : 'starten ' + n + ' Launches'}: ${listeWorte(namen)}.`;
      const teile = [];
      if (l.baldOhneFv.length) teile.push(`bei ${listeWorte(l.baldOhneFv.map(f => f.kurzname || f.name))} ist die Festivalverantwortung nicht besetzt`);
      if (l.baldNurVorschlag.length) teile.push(`bei ${listeWorte(l.baldNurVorschlag.map(f => f.kurzname || f.name))} ${l.baldNurVorschlag.length === 1 ? 'ist sie' : 'ist sie'} nur ein Vorschlag`);
      if (teile.length) { const t = teile.join(', '); satz1 += ' ' + t.charAt(0).toUpperCase() + t.slice(1) + '.'; }
      else satz1 += ' Die Festivalverantwortung ist überall bestätigt.';
    }
    const satz2 = phase ? `Die Herausforderung der Phase „${phase.name}“: ${phase.herausforderung}` : '';
    return { satz1, satz2 };
  }

  /* ---- Diese Woche entscheiden: offene Besetzungen, unhaltbare VVK-Starts in drei Wochen, Datenwidersprüche ---- */
  function entscheidungen(festivals, besetzung, ketten, opt) {
    opt = opt || {};
    const heute = istIso(opt.heute) ? opt.heute : iso(new Date());
    const bis = plusTage(heute, zahl(opt.tage, FENSTER_ENTSCHEIDEN));
    const fName = f => f.kurzname || f.name || f.short_name;
    const bName = k => (opt.bereich ? opt.bereich(k) : k);
    /* Bereiche, die je Festival besetzt sein müssen: opt.bereiche, sonst alle, die irgendwo in der Besetzung vorkommen.
       Eine fehlende Zeile zählt wie eine leere (Review-Runde 2, Befund 4). */
    const bereiche = opt.bereiche && opt.bereiche.length ? opt.bereiche : [...new Set((besetzung || []).map(b => b.bereich).filter(Boolean))];
    const aus = [];
    for (const f of festivals || []) {
      for (const k of bereiche) {
        const z = besetzungVon(besetzung, f.event_id, k);
        if (z.status !== 'offen') continue;
        const notiz = z.zeile && z.zeile.notiz;
        aus.push({ art: 'besetzung', festival: f.short_name, text: `${fName(f)}: ${bName(k)} ist offen${notiz ? ' (' + notiz + ')' : z.zeile ? '' : ' (keine Besetzung eingetragen)'}.` });
      }
      const k = ketten && ketten[f.short_name];
      if (k && k.fruehesterVVK && istIso(f.sales_start_on) && f.sales_start_on >= heute && f.sales_start_on <= bis && k.fruehesterVVK > f.sales_start_on) {
        aus.push({ art: 'termin', festival: f.short_name, text: `${fName(f)}: VVK-Start ${kurz(f.sales_start_on)} ist nach den Richtwerten nicht zu halten, machbar ist frühestens der ${kurz(k.fruehesterVVK)}.` });
      }
      for (const h of f.hinweise || []) aus.push({ art: 'daten', festival: f.short_name, text: `${fName(f)}: ${h}` });
    }
    return aus;
  }

  /* ---- Kritische Kette: die vier Meilensteine, an denen der Launchtag hängt, mit fertig-am ---- */
  function kritischeKette(meilensteine, ketteErg) {
    const je = ketteErg && ketteErg.je || {};
    const aus = [];
    for (const t of KRITISCH) {
      const m = (meilensteine || []).find(x => x.title === t); if (!m) continue;
      const k = je[m.id] || {};
      aus.push({ id: m.id, title: t, fertig: k.fertig || null, fest: !!k.fest, verzug: k.verzug === undefined ? null : k.verzug, wort: k.wort || '', due_on: istIso(m.due_on) ? m.due_on : null, status: m.status, person_id: m.person_id || null });
    }
    return aus;
  }
  /* Längste Kette rückwärts vom Launchtag: je Schritt der Vorgänger, der am spätesten fertig wird. */
  function laengsteKette(meilensteine, richtwerte, ketteErg) {
    const je = ketteErg && ketteErg.je || {};
    const rw = new Map(); for (const r of richtwerte || []) rw.set(r.title, r);
    const nachTitel = new Map(); for (const m of meilensteine || []) if (!nachTitel.has(m.title)) nachTitel.set(m.title, m);
    let m = (meilensteine || []).find(x => x.title === 'Launch durchgeführt') || null;
    const pfad = []; const gesehen = new Set();
    while (m && !gesehen.has(m.id)) {
      gesehen.add(m.id); pfad.unshift(m.title);
      const r = rw.get(m.title) || {}; let spaet = null;
      for (const t of r.vorgaenger || []) { const v = nachTitel.get(t); if (!v || FERTIG.has(v.status)) continue; const e = je[v.id]; if (e && (!spaet || e.fertig > je[spaet.id].fertig)) spaet = v; }
      m = spaet;
    }
    return pfad;
  }

  /* ---- Haltbar? Launchziel gegen den frühesten machbaren Termin, mit Ursachen ---- */
  function haltbar(festival, meilensteine, richtwerte, ketteErg, besetzung, opt) {
    opt = opt || {};
    const heute = istIso(opt.heute) ? opt.heute : (ketteErg && ketteErg.heute) || iso(new Date());
    const ziel = festival && istIso(festival.sales_start_on) ? festival.sales_start_on : null;
    const fr = ketteErg ? ketteErg.fruehesterVVK : null;
    const offen = (meilensteine || []).filter(m => !FERTIG.has(m.status));
    const ursachen = [];
    const pfad = laengsteKette(meilensteine, richtwerte, ketteErg);
    if (pfad.length > 1) ursachen.push(`längste Kette über ${listeWorte(pfad.slice(0, -1))}`);
    const fv = besetzungVon(besetzung, festival && festival.event_id, 'fv');
    if (fv.status === 'offen') ursachen.push('Festivalverantwortung nicht besetzt');
    const ohnePerson = offen.filter(m => !m.person_id).length;
    if (ohnePerson) ursachen.push(anzahlWort(ohnePerson, 'Aufgabe ohne Person', 'Aufgaben ohne Person'));
    const ueberfaellig = offen.filter(m => istIso(m.due_on) && m.due_on < heute).length;
    if (ueberfaellig) ursachen.push(anzahlWort(ueberfaellig, 'überfällige Aufgabe', 'überfällige Aufgaben'));
    /* Vorbehalte: was auch bei rechnerisch haltbarem Ziel offen ist (Besetzung), damit „haltbar“ nichts verspricht. */
    const vorbehalte = ursachen.filter(u => u === 'Festivalverantwortung nicht besetzt' || / ohne Person$/.test(u));
    if (!ziel || !fr) return { haltbar: null, ziel, fruehester: fr, puffer: null, ursachen, vorbehalte, pfad, offen: offen.length };
    const puffer = tageZwischen(fr, ziel);
    return { haltbar: fr <= ziel, ziel, fruehester: fr, puffer, ursachen, vorbehalte, pfad, offen: offen.length };
  }
  function haltbarSatz(h) {
    if (!h || h.haltbar === null) return h && h.ziel ? `Launchziel ${kurz(h.ziel)}: kein Termin ableitbar, weil kein offener Meilenstein mit Abstand null vorliegt.` : 'Kein Launchziel eingetragen.';
    if (h.haltbar) return `Launchziel ${kurz(h.ziel)} ist rechnerisch haltbar, ${h.puffer > 0 ? 'mit ' + tageWort(h.puffer) + ' Puffer' : 'ohne Puffer'}${h.vorbehalte && h.vorbehalte.length ? ', aber ' + listeWorte(h.vorbehalte) : ''}.`;
    const vorbehalt = h.vorbehalte && h.vorbehalte.length ? ' (rechnerisch, unter Besetzungsvorbehalt)' : '';
    return `Launchziel ${kurz(h.ziel)} ist nicht haltbar. Frühester machbarer Termin ist der ${kurz(h.fruehester)}${vorbehalt}, ${tageWort(-h.puffer)} später. Ursache: ${h.ursachen.length ? listeWorte(h.ursachen) : 'die Kette der offenen Aufgaben'}.`;
  }

  /* ---- Hebel je Festival, berechnet: Parallel (Generator-Anteile an wen), Verschieben (frühester Termin und Abstand),
     Hilfe (angehakt oder verfügbar, mit verfügbar ab), Entscheiden (nur wenn opt.entscheiden gesetzt) ---- */
  function hebel(festival, meilensteine, pool, festivals, ketteErg, opt) {
    opt = opt || {};
    const heute = istIso(opt.heute) ? opt.heute : iso(new Date());
    const name = id => (opt.name ? opt.name(id) : id);
    const offen = (meilensteine || []).filter(m => !FERTIG.has(m.status));
    const leute = zuweisbar(pool);
    /* Parallel: offene Aufgaben mit Generator-Anteil ohne Hilfe, größter Anteil zuerst. Kandidaten: Feld passt, Generator-Arbeit erlaubt, nicht die Zuständige. */
    const parallel = offen.filter(m => zahl(m.generator_anteil, 0) > 0 && !m.hilfe_person_id).map(m => {
      const g = Math.min(1, Math.max(0, zahl(m.generator_anteil, 0)));
      const lo = zahl(m.aufwand_lo, 0) * g, hi = zahl(m.aufwand_hi, zahl(m.aufwand_lo, 0)) * g;
      const kand = leute.filter(p => p.id !== m.person_id && p.generator !== false && (p.felder || []).includes(m.bereich));
      return { id: m.id, title: m.title, prozent: Math.round(g * 100), anteil: { lo, hi }, an: kand.map(p => p.id) };
    }).sort((a, b) => b.anteil.hi - a.anteil.hi);
    const parallelText = parallel.length
      ? parallel.slice(0, 3).map(x => `${x.title}: ${x.prozent} Prozent (${spanne(x.anteil.lo, x.anteil.hi, 'Std.')}) an ${x.an.length ? listeWorte(x.an.map(name)) : 'niemanden mit passendem Feld'}`).join('; ')
      : 'Keine offene Aufgabe hat einen freien Generator-Anteil.';
    /* Verschieben */
    const fr = ketteErg ? ketteErg.fruehesterVVK : null;
    const ab = fr ? abstaende(festivals, festival.event_id, fr) : [];
    const naechster = ab[0] || null;
    const unbesetzt = offen.some(m => !m.person_id);
    const verschiebenText = fr
      ? `${unbesetzt ? 'Rechnerisch frühester Termin (unter Besetzungsvorbehalt) ' : 'Frühester machbarer Termin '}${kurz(fr)}${festival.sales_start_on ? ', ' + tageWort(tageZwischen(festival.sales_start_on, fr)) + (fr > festival.sales_start_on ? ' nach' : fr < festival.sales_start_on ? ' vor' : ' wie') + ' dem Ziel' : ''}${naechster ? '; der nächste Launch ist ' + naechster.name + ' (' + kurzOhneJahr(naechster.sales_start_on) + '), ' + (naechster.tage === 0 ? 'am selben Tag' : naechster.tage < 0 ? tageWort(naechster.tage) + ' später' : tageWort(naechster.tage) + ' davor') : ''}.`
      : 'Kein Termin ableitbar.';
    /* Hilfe */
    const angehakt = []; const seen = new Set();
    for (const m of offen) if (m.hilfe_person_id && !seen.has(m.hilfe_person_id)) { seen.add(m.hilfe_person_id); angehakt.push(m.hilfe_person_id); }
    const bereiche = new Set(offen.map(m => m.bereich).filter(Boolean));
    const verfuegbar = leute.filter(p => istHilfeTyp(p) && !seen.has(p.id) && ((p.felder || []).some(b => bereiche.has(b)) || (p.generator !== false && offen.some(m => zahl(m.generator_anteil, 0) > 0))));
    const mitAb = p => `${name(p.id)}${istIso(p.verfuegbar_ab) && p.verfuegbar_ab > heute ? ' (ab ' + kurzOhneJahr(p.verfuegbar_ab) + ')' : ''}`;
    const hilfeText = (angehakt.length ? `Angehakt: ${listeWorte(angehakt.map(name))}. ` : '')
      + (verfuegbar.length ? `Verfügbar: ${listeWorte(verfuegbar.slice(0, 6).map(mitAb))}${verfuegbar.length > 6 ? ' und ' + (verfuegbar.length - 6) + ' weitere' : ''}.` : 'Niemand aus Hilfe, Minijob, Agentur oder Partner passt auf die offenen Bereiche.');
    const aus = { parallel: { liste: parallel, text: parallelText }, verschieben: { fruehester: fr, naechster, text: verschiebenText }, hilfe: { angehakt, verfuegbar: verfuegbar.map(p => p.id), text: hilfeText } };
    if (opt.entscheiden) aus.entscheiden = { text: String(opt.entscheiden) };
    return aus;
  }

  /* ---- Nächste fällige Meilensteine (für Launches, die schon laufen): kommende zuerst, Überfälliges gezählt ---- */
  function naechsteFaellig(meilensteine, heute, n) {
    heute = istIso(heute) ? heute : iso(new Date());
    const offen = (meilensteine || []).filter(m => !FERTIG.has(m.status));
    const kommend = offen.filter(m => istIso(m.due_on) && m.due_on >= heute).sort((a, b) => a.due_on.localeCompare(b.due_on));
    const ueberfaellig = offen.filter(m => istIso(m.due_on) && m.due_on < heute).sort((a, b) => b.due_on.localeCompare(a.due_on));
    const liste = kommend.concat(ueberfaellig).slice(0, zahl(n, 3));
    return { liste, ueberfaellig: ueberfaellig.length, ohneTermin: offen.filter(m => !istIso(m.due_on)).length, offen: offen.length };
  }

  /* ---- Bisher und jetzt je Bereich: „bisher“ aus der Tabelle, „jetzt“ aus der Besetzung über alle Festivals ---- */
  function bisherJetzt(vorher, besetzung, festivals, pool, bereiche, opt) {
    opt = opt || {};
    const alias = opt.alias || {};
    const person = id => (pool || []).find(p => p.id === id) || null;
    const vorname = n => String(n || '').split(/\s+/)[0].toLowerCase();
    const fests = [...(festivals || [])].sort((a, b) => String(a.sales_start_on || '9999').localeCompare(String(b.sales_start_on || '9999')));
    const aus = [];
    for (const b of bereiche || []) {
      const v = (vorher || []).find(x => x.bereich === b.key) || null;
      const bisher = v ? v.text : 'nicht erfasst';
      const jetzt = fests.map(f => { const z = besetzungVon(besetzung, f.event_id, b.key); const p = z.person_id ? person(z.person_id) : null;
        return { festival: f.short_name, kurzname: f.kurzname || f.name, person_id: z.person_id, name: p ? p.name : (z.person_id ? 'unbekannt' : 'offen'), typ: p ? p.typ : null, status: z.status, wort: z.wort, quelle: z.zeile && z.zeile.quelle || null, notiz: z.zeile && z.zeile.notiz || null }; });
      const namen = [...new Set(jetzt.map(j => j.name))];
      const statusWorte = [...new Set(jetzt.map(j => j.status))];
      const statusWort = statusWorte.length === 1 ? ZUORDNUNG_WORT[statusWorte[0]] : (jetzt.some(j => j.status === 'offen') ? 'teils offen' : 'teils bestätigt');
      const jetztText = namen.length === 1 ? namen[0] : jetzt.map(j => `${j.kurzname}: ${j.name}`).join(' · ');
      /* Änderung: „unverändert“, wenn jede heutige Person schon im Bisher-Text steht (Vorname, Alias oder GF für den Typ gf);
         „neu“, wenn bisher niemand fest zuständig war; sonst „geändert“. Offene Felder zählen als nicht vergleichbar. */
      const t = bisher.toLowerCase();
      const passt = j => { if (j.name === 'offen') return false; const vn = vorname(j.name); if (t.includes(vn)) return true; if (j.typ === 'gf' && /\bgf\b/.test(t)) return true; for (const a in alias) if (t.includes(String(a).toLowerCase()) && vorname(alias[a]) === vn) return true; return false; };
      let aenderung;
      if (jetzt.every(j => j.name === 'offen')) aenderung = 'offen';
      else if (jetzt.filter(j => j.name !== 'offen').every(passt)) aenderung = 'unverändert';
      else if (/niemand|verteilt|verschieden|offen|faktisch/.test(t)) aenderung = 'neu';
      else aenderung = 'geändert';
      aus.push({ key: b.key, name: b.name, bisher, quelle: v ? v.quelle : null, jetzt, jetztText, statusWort, aenderung });
    }
    return aus;
  }

  /* ---- Änderungen seit dem Sommer: Protokoll (launch_set, launch_confirm, launch_send) und Pool (neu, ab Datum), neueste zuerst ---- */
  function aenderungen(log, pool, opt) {
    opt = opt || {};
    const seit = istIso(opt.seit) ? opt.seit : '2026-09-30';
    const max = zahl(opt.max, 30);
    const name = id => (opt.name ? opt.name(id) : id);
    const fest = s => (opt.festival ? opt.festival(s) : s) || s;
    const ber = k => (opt.bereich ? opt.bereich(k) : k) || k;
    const aus = [];
    for (const e of log || []) {
      const d = e.detail || {}; const at = e.at || ''; let text = null;
      if (e.what === 'launch_set') {
        if (d.bereich) text = `${fest(e.row_id)}: ${ber(d.bereich)} ${d.person_id ? 'an ' + name(d.person_id) : 'freigegeben'}${d.meilensteine ? ', ' + anzahlWort(d.meilensteine, 'Aufgabe nachgezogen', 'Aufgaben nachgezogen') : ''}${d.status === 'bestaetigt' ? ', bestätigt' : ''}`;
        else if (d.sales_start_on) text = `${fest(e.row_id)}: VVK-Start von ${kurz(d.sales_start_on.alt) || 'offen'} auf ${kurz(d.sales_start_on.neu)}, ${anzahlWort(zahl(d.verschoben, 0), 'Termin verschoben', 'Termine verschoben')}`;
        else if (d.titel) text = `Meilenstein „${d.titel}“: ${listeWorte((d.geaendert || []).map(g => ({ person: 'Zuständigkeit', hilfe: 'Generator-Anteil', status: 'Stand' })[g] || g))} geändert`;
        else if (d.person) { const k = Object.keys(d.patch || {}); text = `${d.person}: ${listeWorte(k.map(x => x === 'launch_std_woche' ? 'Stunden je Woche ' + (d.patch[x] === null ? 'gelöscht' : 'auf ' + fmt(d.patch[x])) : x === 'verfuegbar_ab' ? 'verfügbar ab ' + (d.patch[x] ? kurz(d.patch[x]) : 'gelöscht') : x))}`; }
      } else if (e.what === 'launch_confirm') text = `${fest(e.row_id)}: ${anzahlWort(zahl(d.bestaetigt, 0), 'Zuordnung', 'Zuordnungen')} und ${anzahlWort(zahl(d.besetzung, 0), 'Besetzung', 'Besetzungen')} bestätigt`;
      else if (e.what === 'launch_send') text = d.schritt ? `${fest(e.row_id)}: Asana-Projekt angelegt` : `${fest(e.row_id)}: nach Asana gesendet, ${zahl(d.neu, 0)} neu, ${zahl(d.aktualisiert, 0)} aktualisiert`;
      if (text) aus.push({ at, datum: String(at).slice(0, 10), wer: e.who || '', art: e.what, text });
    }
    for (const p of zuweisbar(pool)) {
      const c = String(p.created_at || '').slice(0, 10);
      if (istIso(c) && c >= seit) aus.push({ at: p.created_at, datum: c, wer: '', art: 'pool', text: `${p.name} neu im Pool (${typWort(p.typ)})${istIso(p.verfuegbar_ab) ? ', ab ' + kurz(p.verfuegbar_ab) : ''}` });
      else if (istIso(p.verfuegbar_ab) && p.verfuegbar_ab >= seit) aus.push({ at: p.verfuegbar_ab + 'T00:00:00Z', datum: p.verfuegbar_ab, wer: '', art: 'pool', text: `${p.name}: ab ${kurz(p.verfuegbar_ab)}` });
    }
    aus.sort((a, b) => String(b.at).localeCompare(String(a.at)));
    return aus.slice(0, max);
  }

  /* ---- Fenster für „Wer trägt wie viel“: alle offenen Aufgaben der Launches, deren VVK-Start bis in n Tagen liegt
     oder schon zurück (laufende Launches). Nicht nach Fälligkeit gefiltert: Überfälliges ist offene Arbeit und zählt,
     spätere Termine desselben Launches dehnen das Fenster der Person, statt herauszufallen (Review-Runde 1, Befund 3). ---- */
  function imFenster(meilensteine, heute, tage, festivals) {
    heute = istIso(heute) ? heute : iso(new Date());
    const bis = plusTage(heute, zahl(tage, FENSTER_LAST));
    const vvk = new Map(); for (const f of festivals || []) vvk.set(f.short_name, istIso(f.sales_start_on) ? f.sales_start_on : null);
    return (meilensteine || []).filter(m => { if (FERTIG.has(m.status)) return false; const v = vvk.has(m.festival) ? vvk.get(m.festival) : null; return v === null || v <= bis; });
  }

  /* ---- Wochenplan bis Jahresende: je Woche (Montag) fällige offene Meilensteine je Festival, Anzahl und Stunden (Mitte) ---- */
  function montag(isoTag) { const d = datum(isoTag); const wd = (d.getUTCDay() + 6) % 7; return plusTage(isoTag, -wd); }
  function wochenplan(meilensteine, festivals, opt) {
    opt = opt || {};
    const heute = istIso(opt.heute) ? opt.heute : iso(new Date());
    const bis = istIso(opt.bis) ? opt.bis : heute.slice(0, 4) + '-12-31';
    const start = montag(heute);
    const fJe = new Map((festivals || []).map(f => [f.short_name, f]));
    const wochen = new Map();
    for (const m of meilensteine || []) {
      if (FERTIG.has(m.status) || !istIso(m.due_on) || m.due_on < start || m.due_on > bis) continue;
      const mo = montag(m.due_on);
      const w = wochen.get(mo) || { montag: mo, sonntag: plusTage(mo, 6), festivals: new Map(), anzahl: 0, stunden: 0 };
      const f = w.festivals.get(m.festival) || { short_name: m.festival, kurzname: (fJe.get(m.festival) || {}).kurzname || m.festival || 'ohne Festival', anzahl: 0, stunden: 0 };
      const mitte = (zahl(m.aufwand_lo, 0) + zahl(m.aufwand_hi, zahl(m.aufwand_lo, 0))) / 2;
      f.anzahl++; f.stunden += mitte; w.anzahl++; w.stunden += mitte; w.festivals.set(m.festival, f); wochen.set(mo, w);
    }
    return [...wochen.values()].sort((a, b) => a.montag.localeCompare(b.montag)).map(w => {
      const fl = [...w.festivals.values()].sort((a, b) => String((fJe.get(a.short_name) || {}).sales_start_on || '9999').localeCompare(String((fJe.get(b.short_name) || {}).sales_start_on || '9999')));
      return { montag: w.montag, sonntag: w.sonntag, festivals: fl, anzahl: w.anzahl, stunden: Math.round(w.stunden * 10) / 10, dreiLaunches: fl.length >= 3 };
    });
  }

  function statusWort(s) { return STATUS_WORT[s] || s || 'offen'; }
  function statusAusWort(w) { return WORT_STATUS[w] || w; }
  function zuordnungWort(z) { return ZUORDNUNG_WORT[z] || z || 'offen'; }
  function typWort(t) { return TYP_WORT[t] || t || ''; }
  function festivalKurz(name) { return String(name || '').replace(/\s+20\d\d$/, ''); }

  return { FERTIG, STATUS_WORT, ZUORDNUNG_WORT, TYP_WORT, HILFE_TYPEN, EXTERN_TYPEN, ENTLASTUNG_MIN, GRENZE_PASST, GRENZE_KNAPP,
    plusTage, tageZwischen, maxIso, kurz, kurzOhneJahr, fmt, spanne, anteile, kette, last, lage, lageSatz, hilfeBewerten,
    reihenfolge, istHilfeTyp, istExtern, hatKonto, zuweisbar, kandidaten, vvkVerschieben, abstaende, abstandWort, versandWeg,
    statusWort, statusAusWort, zuordnungWort, typWort, festivalKurz,
    /* V28 */ KRITISCH, FENSTER_LAUNCHES, FENSTER_ENTSCHEIDEN, FENSTER_LAST, listeWorte, tageWort, anzahlWort, phaseHeute, launchesBis, besetzungVon,
    saisonLage, saisonLageSatz, entscheidungen, kritischeKette, laengsteKette, haltbar, haltbarSatz, hebel, naechsteFaellig, bisherJetzt, aenderungen,
    imFenster, montag, wochenplan };
});
