// deno-lint-ignore-file no-explicit-any
/* Kompass · Stufe 1 · Entscheiden können (25.10.2026). Auftrag: docs/PAKET-STUFE-1-ENTSCHEIDUNGEN.md, Abschnitte 2 und 4.
   Aktionen: entscheidungen_list, entscheidung_set, entscheidung_entscheiden, entscheidung_vertagen, entscheidung_abgeben,
   entscheidung_zurueck, korb_list, korb_set. Die Wirkung in der Datenbank läuft über die Funktionen der Migration
   20261025150500 (eine Transaktion je Aktion, Rückweg in rueckweg). Die reinen Rechenregeln (Fristzustand, reif, Sortierung,
   Zähler) stehen in enRechne, damit pruefung/entscheidungen-probe.mjs sie ohne Datenbank prüfen kann. */
type Any = any;

export class EnFehler extends Error { status: number; constructor(m: string, s = 400) { super(m); this.status = s; } }

export const EN_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const EN_STATUS = ['offen', 'vertagt', 'abgegeben', 'entschieden', 'alle'];
export const EN_ZUSTAND_REIHE = ['ueberfaellig', 'heute', 'woche', 'zwei_wochen', 'spaeter', 'ohne'];

export function gueltigerTag(x: unknown): string | null {
  const s = (x ?? '').toString().trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const d = new Date(s + 'T00:00:00Z'); return isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== s ? null : s;
}
function tageBis(frist: string | null, heute: string): number | null {
  if (!frist) return null;
  return Math.round((Date.parse(frist + 'T00:00:00Z') - Date.parse(heute + 'T00:00:00Z')) / 86400000);
}
/* Fristzustand: überfällig (vor heute), heute, diese Woche (bis sechs Tage), nächste zwei Wochen (bis 14 Tage), später, ohne. */
export function fristZustand(frist: string | null, heute: string): string {
  const n = tageBis(frist, heute);
  if (n === null) return 'ohne';
  if (n < 0) return 'ueberfaellig'; if (n === 0) return 'heute'; if (n <= 6) return 'woche'; if (n <= 14) return 'zwei_wochen'; return 'spaeter';
}
export function istReif(e: Any): boolean { return !!(e.frage_form || e.frist || (e.vorschlag && String(e.vorschlag).trim())); }

/* Reine Rechnung über die Zeilen von hh_entscheidungen: Zustand, reif, wieder fällig; Sortierung überfällig, dann Frist aufsteigend,
   dann ohne Frist nach updated_at (jüngste zuerst); Zähler über die offenen (einschließlich wieder fälliger vertagter). */
export function enRechne(rows: Any[], heute: string) {
  const alle = rows.map(r => {
    const zustand = fristZustand(r.frist ?? null, heute);
    const wiederFaellig = r.status === 'vertagt' && !!r.vertagt_bis && r.vertagt_bis <= heute;
    return { ...r, zustand, tage: tageBis(r.frist ?? null, heute), reif: istReif(r), wieder_faellig: wiederFaellig, faellig: r.status === 'offen' || wiederFaellig };
  });
  const rang = (e: Any) => e.zustand === 'ueberfaellig' ? 0 : e.frist ? 1 : 2;
  alle.sort((a, b) => rang(a) - rang(b)
    || (a.frist && b.frist ? a.frist.localeCompare(b.frist) : 0)
    || (!a.frist && !b.frist ? String(b.updated_at || '').localeCompare(String(a.updated_at || '')) : 0)
    || String(a.id).localeCompare(String(b.id)));
  const offen = alle.filter(e => e.faellig);
  const zaehler = {
    offen: offen.length,
    diese_woche: offen.filter(e => ['ueberfaellig', 'heute', 'woche'].includes(e.zustand)).length,
    ueberfaellig: offen.filter(e => e.zustand === 'ueberfaellig').length,
    mit_vorschlag: offen.filter(e => e.vorschlag && String(e.vorschlag).trim()).length,
    unreif: offen.filter(e => !e.reif).length,
    vertagt: alle.filter(e => e.status === 'vertagt' && !e.wieder_faellig).length,
    abgegeben: alle.filter(e => e.status === 'abgegeben').length,
  };
  return { alle, offen, zaehler };
}
/* Welche Zeilen ein Filter zeigt. offen = fällig jetzt (offen plus vertagt mit Datum bis heute); entschieden = letzte 30 Tage. */
export function enFilter(alle: Any[], status: string, heute: string) {
  if (status === 'alle') return alle;
  if (status === 'offen') return alle.filter(e => e.faellig);
  if (status === 'vertagt') return alle.filter(e => e.status === 'vertagt');
  if (status === 'abgegeben') return alle.filter(e => e.status === 'abgegeben');
  if (status === 'entschieden') {
    const seit = new Date(Date.parse(heute + 'T00:00:00Z') - 30 * 86400000).toISOString();
    return alle.filter(e => e.status === 'entschieden' && String(e.entschieden_am || '') >= seit)
      .sort((a, b) => String(b.entschieden_am || '').localeCompare(String(a.entschieden_am || '')));
  }
  return alle.filter(e => e.faellig);
}

/* Eingabe für entscheidung_set: nur gegebene Felder, leer heißt leeren. */
export function enSetEingabe(t: Any, heute: string): Record<string, unknown> {
  const patch: Record<string, unknown> = {};
  if (t.frage !== undefined) {
    const f = (t.frage ?? '').toString().trim();
    if (f.length < 3 || f.length > 500) throw new EnFehler('Frage: 3 bis 500 Zeichen');
    patch.frage = f; patch.frage_form = true;
  }
  if (t.frist !== undefined) {
    if (t.frist === null || t.frist === '') { patch.frist = null; patch.frist_quelle = null; }
    else { const d = gueltigerTag(t.frist); if (!d) throw new EnFehler('Frist: Datum als JJJJ-MM-TT oder leer'); patch.frist = d; patch.frist_quelle = 'hand'; }
  }
  if (t.vorschlag !== undefined) {
    const v = (t.vorschlag ?? '').toString().trim();
    if (v.length > 2000) throw new EnFehler('Vorschlag: höchstens 2000 Zeichen');
    patch.vorschlag = v || null;
  }
  if (!Object.keys(patch).length) throw new EnFehler('nichts zu ändern (frage, frist oder vorschlag)');
  void heute;
  return patch;
}

export function entscheidungenModul(ctx: { admin: Any, json: (b: unknown, s?: number) => Response, heuteBerlin: () => string, whoNorm: (w: unknown) => string }) {
  const { admin, json, heuteBerlin, whoNorm } = ctx;

  function by(t: Any): string {
    const roh = (t?.by ?? '').toString().trim();
    if (!roh) throw new EnFehler('by fehlt (Alex oder Lea)');
    const w = whoNorm(roh);
    if (w !== 'Alex' && w !== 'Lea') throw new EnFehler('by muss Alex oder Lea sein');
    return w;
  }
  function id(t: Any): string {
    const s = (t?.id ?? '').toString();
    if (!EN_UUID.test(s)) throw new EnFehler('id fehlt');
    return s;
  }
  async function rpc(name: string, args: Record<string, unknown>) {
    const { data, error } = await admin.rpc(name, args);
    if (error) {
      const m = /^PT(\d{3})$/.exec(error.code || '');
      if (m) throw new EnFehler(error.message, parseInt(m[1]));
      throw error;
    }
    return data;
  }

  /* Herkunft auflösen: Vorhaben (Titel, Slug), Thema, Kandidat, Punkt. Liefert je Zeile titel, text, url, datum. */
  async function herkunft(rows: Any[]) {
    const ids = (art: string) => rows.filter(r => r.quelle_art === art).map(r => r.quelle_id);
    const vhIds = new Set<string>(rows.map(r => r.vorhaben_id).filter(Boolean));
    const [punkte, themen, kandidaten]: Any[] = await Promise.all([
      ids('punkt').length ? admin.from('hh_vorhaben_punkte').select('id,titel,stand,position,quelle,created_at,updated_at,vorhaben_id').in('id', ids('punkt')) : { data: [] },
      ids('thema').length ? admin.from('gfweekly_topics').select('id,title,context,short_description,next_action,recommendation,gate_frist,created_at,vorhaben_id,board_lane,archived').in('id', ids('thema')) : { data: [] },
      ids('kandidat').length ? admin.from('gfweekly_news').select('id,title,body,quote,source,source_title,source_url,happened_at,created_at,vorhaben_id,status').in('id', ids('kandidat')) : { data: [] },
    ]);
    for (const r of [punkte, themen, kandidaten]) if (r.error) throw r.error;   // Runde 3, Befund 3: ein Abfragefehler ist kein „Quelle fehlt“
    /* Stufe 4 (Ruhe halten): ein Punkt ohne Bewegung seit 60 Tagen (Punkt, Entscheidung, Verlauf) ruht; die Liste zeigt ihn nicht als überfällig. */
    const seit60 = new Date(Date.now() - 60 * 86400000).toISOString();
    const bewegt = new Set<string>();
    if (ids('punkt').length) { const { data: vb, error: eb } = await admin.from('hh_vorhaben_verlauf').select('punkt_id').in('punkt_id', ids('punkt')).gte('created_at', seit60); if (eb) throw eb; for (const x of (vb || []) as Any[]) if (x.punkt_id) bewegt.add(x.punkt_id); }
    for (const p of ((punkte.data || []) as Any[])) if (p.vorhaben_id) vhIds.add(p.vorhaben_id);
    const vh: Any = vhIds.size ? await admin.from('hh_vorhaben').select('id,slug,title,status,ball,naechster_schritt,phase,fokus').in('id', [...vhIds]) : { data: [] };
    if (vh.error) throw vh.error;
    const VH = new Map<string, Any>(((vh.data || []) as Any[]).map((v: Any) => [v.id, v]));
    const P = new Map<string, Any>(((punkte.data || []) as Any[]).map((x: Any) => [x.id, x]));
    const T = new Map<string, Any>(((themen.data || []) as Any[]).map((x: Any) => [x.id, x]));
    const K = new Map<string, Any>(((kandidaten.data || []) as Any[]).map((x: Any) => [x.id, x]));
    return rows.map(r => {
      let h: Any = { art: r.quelle_art, titel: null, text: null, url: null, datum: null, fehlt: false };
      let vorhaben: Any = r.vorhaben_id ? VH.get(r.vorhaben_id) : null;
      let ruht = false;
      if (r.quelle_art === 'punkt') {
        const p = P.get(r.quelle_id); if (!p) h.fehlt = true;
        else { vorhaben = vorhaben || VH.get(p.vorhaben_id); h = { ...h, titel: p.titel, text: p.stand || null, datum: p.created_at, url: vorhaben ? `vorhaben.html?v=${encodeURIComponent(vorhaben.slug)}` : null };
          ruht = !bewegt.has(p.id) && String(p.updated_at || p.created_at || '') < seit60 && String(r.updated_at || '') < seit60 && (r.status === 'offen' || r.status === 'vertagt'); }
      } else if (r.quelle_art === 'thema') {
        const x = T.get(r.quelle_id); if (!x) h.fehlt = true;
        else h = { ...h, titel: x.title, text: x.short_description || x.context || null, datum: x.created_at, url: `board.html?topic=${encodeURIComponent(x.id)}` };
      } else {
        const x = K.get(r.quelle_id); if (!x) h.fehlt = true;
        else h = { ...h, titel: x.title, text: x.body || x.quote || null, datum: x.happened_at || x.created_at, url: /^https?:/.test(x.source_url || '') ? x.source_url : null, quelle: x.source_title || x.source || null };
      }
      return { ...r, ruht, herkunft: h, vorhaben: vorhaben ? { id: vorhaben.id, slug: vorhaben.slug, title: vorhaben.title, status: vorhaben.status, phase: vorhaben.phase || 'sonstiges', fokus: !!vorhaben.fokus } : { phase: 'sonstiges', fokus: false, id: null, slug: null, title: null, status: null } };
    });
  }

  async function liste(t: Any) {
    const heute = heuteBerlin();
    const status = (t.status ?? 'offen').toString();
    if (!EN_STATUS.includes(status)) throw new EnFehler('status: ' + EN_STATUS.join('|'));
    let sync: Any = null;
    if (t.sync !== false) sync = await rpc('hh_entscheidungen_sammeln', {});
    const { data, error } = await admin.from('hh_entscheidungen').select('*').neq('status', 'hinfaellig');
    if (error) throw error;
    const { alle, zaehler } = enRechne(data || [], heute);
    const gezeigt = await herkunft(enFilter(alle, status, heute));
    const letzte = alle.filter(e => e.status === 'entschieden').sort((a, b) => String(b.entschieden_am || '').localeCompare(String(a.entschieden_am || '')))[0] || null;
    return { heute, status, sync, zaehler, eintraege: gezeigt, gesamt: alle.length, erfasst: alle.map(e => e.quelle_id),
      zuletzt_entschieden: letzte ? { id: letzte.id, frage: letzte.frage, ergebnis: letzte.ergebnis, entschieden_am: letzte.entschieden_am, entschieden_von: letzte.entschieden_von } : null };
  }

  /* Nach einer gelungenen Datenbankaktion ist das Nachladen kein Grund für einen Fehler (Runde 3, Befund 4). */
  async function antwort(basis: Any, eid: string, roh: Any) {
    try { return { ...basis, entscheidung: await eine(eid) }; }
    catch (e) { return { ...basis, entscheidung: roh?.entscheidung ?? null, nachladen_fehler: String((e as Error).message ?? e) }; }
  }
  async function eine(eid: string) {
    const { data, error } = await admin.from('hh_entscheidungen').select('*').eq('id', eid).maybeSingle();
    if (error) throw error; if (!data) throw new EnFehler('Entscheidung gibt es nicht', 404);
    const [e] = await herkunft([{ ...data, ...enRechne([data], heuteBerlin()).alle[0] }]);
    return e;
  }

  /* Korb: Kandidaten (neu) und Themen (offen) ohne Vorhaben, mit dem Vorschlag des Laufs und den aktiven Vorhaben zur Auswahl. */
  async function korbListe() {
    const [k, th, vh]: Any[] = await Promise.all([
      admin.from('gfweekly_news').select('id,title,body,source,source_title,source_url,happened_at,created_at,gate,gate_frist,vorhaben_vorschlag').eq('kind', 'kandidat').eq('status', 'neu').is('vorhaben_id', null).order('created_at', { ascending: false }),
      admin.from('gfweekly_topics').select('id,title,context,short_description,created_at,gate,gate_frist,board_lane,vorhaben_vorschlag').eq('archived', false).in('board_lane', ['zu_besprechen', 'in_klaerung']).is('vorhaben_id', null).order('created_at', { ascending: false }),
      admin.from('hh_vorhaben').select('id,slug,title,status,gruppe,sort').in('status', ['aktiv', 'pausiert']).order('sort', { ascending: true }),
    ]);
    for (const r of [k, th, vh]) if (r.error) throw r.error;
    const VH = new Map<string, Any>(((vh.data || []) as Any[]).map((v: Any) => [v.id, v]));
    const zeile = (kind: string, x: Any) => ({ kind, id: x.id, titel: x.title, text: kind === 'thema' ? (x.short_description || x.context || '') : (x.body || ''), datum: x.happened_at || x.created_at,
      gate: x.gate, gate_frist: x.gate_frist, quelle: kind === 'kandidat' ? (x.source_title || x.source || null) : null, url: kind === 'kandidat' && /^https?:/.test(x.source_url || '') ? x.source_url : (kind === 'thema' ? `board.html?topic=${x.id}` : null),
      vorschlag_id: x.vorhaben_vorschlag && VH.has(x.vorhaben_vorschlag) ? x.vorhaben_vorschlag : null, vorschlag_titel: x.vorhaben_vorschlag && VH.has(x.vorhaben_vorschlag) ? VH.get(x.vorhaben_vorschlag).title : null });
    const eintraege = [...(k.data || []).map((x: Any) => zeile('kandidat', x)), ...(th.data || []).map((x: Any) => zeile('thema', x))]
      .sort((a, b) => String(b.datum || '').localeCompare(String(a.datum || '')));
    return { eintraege, vorhaben: (vh.data || []).map((v: Any) => ({ id: v.id, slug: v.slug, title: v.title, status: v.status, gruppe: v.gruppe })),
      zaehler: { gesamt: eintraege.length, kandidaten: (k.data || []).length, themen: (th.data || []).length, mit_vorschlag: eintraege.filter(e => e.vorschlag_id).length } };
  }

  async function korbSet(t: Any) {
    const wer = by(t); const kind = (t.kind ?? '').toString(); const kid = id(t);
    const aktion = (t.aktion ?? '').toString();
    if (!['thema', 'kandidat'].includes(kind)) throw new EnFehler('kind: thema oder kandidat');
    if (!['zuordnen', 'neu', 'verwerfen', 'archivieren'].includes(aktion)) throw new EnFehler('aktion: zuordnen, neu, verwerfen oder archivieren');
    const tabelle = kind === 'thema' ? 'gfweekly_topics' : 'gfweekly_news';
    const { data: orig, error: e0 } = await admin.from(tabelle).select('id,title,vorhaben_id').eq('id', kid).maybeSingle();
    if (e0) throw e0; if (!orig) throw new EnFehler('Eintrag gibt es nicht', 404);
    if (aktion === 'verwerfen') {
      if (kind !== 'kandidat') throw new EnFehler('verwerfen gilt für Kandidaten; Themen werden archiviert');
      const { data, error } = await admin.from('gfweekly_news').update({ status: 'verworfen', decided_by: wer, decided_at: new Date().toISOString() }).eq('id', kid).eq('status', 'neu').is('vorhaben_id', null).select('id,status').maybeSingle();
      if (error) throw error; if (!data) throw new EnFehler('Der Kandidat ist inzwischen zugeordnet oder anders entschieden; bitte neu laden', 409);
      return { ok: true, aktion, item: data };
    }
    if (aktion === 'archivieren') {
      if (kind !== 'thema') throw new EnFehler('archivieren gilt für Themen; Kandidaten werden verworfen');
      const { data, error } = await admin.from('gfweekly_topics').update({ archived: true, archiv_grund: 'korb', updated_at: new Date().toISOString() }).eq('id', kid).eq('archived', false).is('vorhaben_id', null).in('board_lane', ['zu_besprechen', 'in_klaerung']).select('id,archived').maybeSingle();
      if (error) throw error; if (!data) throw new EnFehler('Das Thema ist inzwischen zugeordnet, erledigt oder archiviert; bitte neu laden', 409);
      return { ok: true, aktion, item: data };
    }
    /* Zuordnen, Anlegen und Verlaufseintrag laufen in einer Transaktion (hh_korb_zuordnen, Runde 1 Befund 3). */
    if (aktion === 'neu') {
      const titel = (t.titel ?? orig.title ?? '').toString().trim().slice(0, 200);
      if (titel.length < 3) throw new EnFehler('titel fehlt');
      const basis = titel.toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48) || 'vorhaben';
      for (let versuch = 0; versuch < 3; versuch++) {
        const { data: da, error: es } = await admin.from('hh_vorhaben').select('slug').like('slug', basis + '%'); if (es) throw es;
        const vergeben = new Set(((da || []) as Any[]).map((r: Any) => r.slug));
        let slug = basis; for (let i = 2; vergeben.has(slug) && i < 1000; i++) slug = basis + '-' + i;
        const { data, error } = await admin.rpc('hh_korb_zuordnen', { p_kind: kind, p_id: kid, p_vorhaben: null, p_neu: { title: titel, slug, gruppe: 'sonstiges' }, p_by: wer });
        if (error && error.code === '23505') continue;   // slug gleichzeitig vergeben: neuer Versuch
        if (error) { const m = /^PT(\d{3})$/.exec(error.code || ''); if (m) throw new EnFehler(error.message, parseInt(m[1])); throw error; }
        return { ...(data as Any), aktion };
      }
      throw new EnFehler('Kein freier slug gefunden', 409);
    }
    const vorhabenId = (t.vorhaben_id ?? '').toString();
    if (!EN_UUID.test(vorhabenId)) throw new EnFehler('vorhaben_id fehlt');
    const r = await rpc('hh_korb_zuordnen', { p_kind: kind, p_id: kid, p_vorhaben: vorhabenId, p_neu: null, p_by: wer });
    return { ...(r as Any), aktion };
  }

  /* Stufe 2 · Lauf-Bilanz: je ISO-Woche, was der Lauf getan hat (angelegt, erledigt, Vorschläge und ihr Ausgang, Kandidaten). */
  async function laufBilanz(t: Any) {
    const wochen = Math.max(1, Math.min(12, parseInt(t.wochen) || 4));
    const seit = new Date(Date.now() - wochen * 7 * 86400000).toISOString();
    /* Erledigungen und Rücknahmen als Ereignisse im Verlauf (bleiben nach Rückgängig erhalten, Runde 1 Befund 10): der Lauf erledigt über
       hh_punkt_toggle (Eintrag „Punkt erledigt: …“, created_by lauf), Rückgängig schreibt source_ref rueckgaengig:lauf:<eintrag>. Verfall und
       Verwerfen zählen nach status_at (Trigger seit Runde 2). */
    const [pk, vl, kd, en, rz] = await Promise.all([
      admin.from('hh_vorhaben_verlauf').select('created_at').eq('created_by', 'lauf').eq('art', 'system').like('text', 'Punkt erledigt:%').gte('created_at', seit),
      admin.from('hh_vorhaben_verlauf').select('created_at,status,status_at,created_by,tag').not('created_by', 'in', '("Alex","Lea","kompass")').or(`created_at.gte.${seit},status_at.gte.${seit}`),
      admin.from('gfweekly_news').select('created_at,status').eq('kind', 'kandidat').gte('created_at', seit),
      admin.from('hh_entscheidungen').select('updated_at,frage_von').eq('frage_von', 'lauf').gte('updated_at', seit),
      admin.from('hh_vorhaben_verlauf').select('created_at').like('source_ref', 'rueckgaengig:lauf:%').gte('created_at', seit),
    ]);
    for (const r of [pk, vl, kd, en, rz]) if (r.error) throw r.error;
    const woche = (d: string) => { const x = new Date(d); const t0 = new Date(Date.UTC(x.getUTCFullYear(), x.getUTCMonth(), x.getUTCDate())); const tag = t0.getUTCDay() || 7; t0.setUTCDate(t0.getUTCDate() + 4 - tag); const j1 = new Date(Date.UTC(t0.getUTCFullYear(), 0, 1)); return `${t0.getUTCFullYear()}-W${String(Math.ceil((((t0.getTime() - j1.getTime()) / 86400000) + 1) / 7)).padStart(2, '0')}`; };
    const W: Record<string, Any> = {};
    const z = (w: string, k: string) => { W[w] = W[w] || { woche: w, erledigt: 0, zurueckgenommen: 0, vorschlaege: 0, vorschlaege_uebernommen: 0, verlauf: 0, verlauf_bestaetigt: 0, verlauf_vorschlag: 0, verlauf_verworfen: 0, verlauf_verfallen: 0, kandidaten: 0, kandidaten_uebernommen: 0, kandidaten_verworfen: 0, kandidaten_archiviert: 0, fragen: 0 }; W[w][k]++; };
    for (const r of (pk.data || []) as Any[]) z(woche(r.created_at), 'erledigt');
    for (const r of (rz.data || []) as Any[]) z(woche(r.created_at), 'zurueckgenommen');
    for (const r of (vl.data || []) as Any[]) {
      /* Entstehung in der Woche des Eintrags; Verwerfen und Verfall in der Woche des Statuswechsels (status_at, Runde 2 Befund 6). */
      const vorschlag = /^Vorschlag/i.test(r.tag || '') || r.status === 'vorschlag' || r.status === 'verworfen' || r.status === 'verfallen';   // Vorschläge erkennt man am tag, ihr Status wechselt später
      if (r.created_at >= seit) { const w = woche(r.created_at); z(w, 'verlauf'); if (vorschlag) z(w, 'vorschlaege'); if (r.status === 'vorschlag') z(w, 'verlauf_vorschlag'); if (r.status === 'bestaetigt' && !vorschlag) z(w, 'verlauf_bestaetigt'); }
      if (vorschlag && r.status === 'bestaetigt') { const t = r.status_at || r.created_at; if (t >= seit) z(woche(t), 'vorschlaege_uebernommen'); }
      if (r.status === 'verworfen' || r.status === 'verfallen') { const t = r.status_at || r.created_at; if (t >= seit) z(woche(t), 'verlauf_' + r.status); }
    }
    for (const r of (kd.data || []) as Any[]) { const w = woche(r.created_at); z(w, 'kandidaten'); if (['uebernommen','verworfen','archiviert'].includes(r.status)) z(w, 'kandidaten_' + r.status); }
    for (const r of (en.data || []) as Any[]) z(woche(r.updated_at), 'fragen');
    const zeilen = Object.values(W).sort((a: Any, b: Any) => String(b.woche).localeCompare(String(a.woche)));
    const summe = zeilen.reduce((a: Any, r: Any) => { for (const k of Object.keys(r)) if (k !== 'woche') a[k] = (a[k] || 0) + r[k]; return a; }, {} as Any);
    /* Trefferquote: übernommene Vorschläge und Kandidaten an allen erzeugten (Paket Abschnitt 0, Kriterium a). */
    const erzeugt = (summe.vorschlaege || 0) + (summe.kandidaten || 0);
    return { seit, wochen: zeilen, summe, trefferquote: erzeugt ? Math.round(100 * ((summe.vorschlaege_uebernommen || 0) + (summe.kandidaten_uebernommen || 0)) / erzeugt) : null };
  }

  /* Stufe 2 · Rückkehr: Lagebild über den Zeitraum der Abwesenheit nach Phase (Entschieden, Bewegt, Wartet auf dich) und nach Menschen. */
  const PHASEN = ['launch', 'formatpartner', 'systembau', 'sonstiges'];
  /* Zeitversatz Berlins zu einem Zeitpunkt (+01:00 oder +02:00), gemessen nahe der jeweiligen Tagesgrenze, damit auch der Umstellungstag stimmt (Runde 1 Befund 9, Runde 3 Befund 8). */
  const berlinVersatz = (zeitpunkt: string) => {
    try {
      const teil = new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Berlin', timeZoneName: 'longOffset' }).formatToParts(new Date(zeitpunkt)).find(p => p.type === 'timeZoneName')?.value || '';
      const m = teil.match(/([+-]\d\d:\d\d)/); return m ? m[1] : '+01:00';
    } catch { return '+01:00'; }
  };
  async function rueckkehrLage(t: Any) {
    const aid = (t.absence_id ?? '').toString(); if (!EN_UUID.test(aid)) throw new EnFehler('absence_id fehlt');
    const { data: ab, error: e0 } = await admin.from('gfweekly_absences').select('*').eq('id', aid).maybeSingle();
    if (e0) throw e0; if (!ab) throw new EnFehler('Abwesenheit gibt es nicht', 404);
    try { await rpc('hh_entscheidungen_sammeln', {}); } catch (e) { console.warn('rueckkehr_lage sammeln', e); }   // Runde 3, Befund 5: erledigte Quellen zuerst abgleichen
    const person = whoNorm(ab.person); const heute = heuteBerlin();
    const von = ab.von as string; const bis = (ab.bis || heute) as string;
    const bisIso = bis + 'T23:59:59' + berlinVersatz(new Date(Date.parse(bis + 'T23:59:59Z') - 2 * 3600e3).toISOString()); const vonIso = von + 'T00:00:00' + berlinVersatz(new Date(Date.parse(von + 'T00:00:00Z') - 2 * 3600e3).toISOString());
    const [vh, pk, vl, en, dec, ho] = await Promise.all([
      admin.from('hh_vorhaben').select('id,slug,title,status,phase,fokus,ball,ball_name,stand,naechster_schritt,frist'),   // auch abgeschlossene: was in der Abwesenheit geschah, zählt (Runde 2, Befund 3)
      admin.from('hh_vorhaben_punkte').select('id,vorhaben_id,titel,wer,frist,erledigt,erledigt_at,erledigt_by,stand,quelle,updated_at'),
      admin.from('hh_vorhaben_verlauf').select('id,vorhaben_id,happened_at,art,wer,text,status,created_by').eq('status', 'bestaetigt').gte('happened_at', vonIso).lte('happened_at', bisIso).order('happened_at', { ascending: false }).limit(2000),
      admin.from('hh_entscheidungen').select('*').neq('status', 'hinfaellig'),
      admin.from('gfweekly_decisions').select('id,topic_id,topic_title,decision,decided_by,decided_at').gte('decided_at', von).lte('decided_at', bis),
      admin.from('gfweekly_handover').select('id,kind,ref_id,title,ampel,status,vertretung').eq('absence_id', aid).in('status', ['vorschlag','bestaetigt']),
    ]);
    for (const r of [vh, pk, vl, en, dec, ho]) if (r.error) throw r.error;
    const V = new Map<string, Any>(((vh.data || []) as Any[]).map((v: Any) => [v.id, v]));
    const phaseVon = (vid: string | null) => (vid && V.get(vid)?.phase) || 'sonstiges';
    const aktiv = (vid: string | null) => !!vid && ['aktiv', 'pausiert'].includes(V.get(vid)?.status);
    const istPerson = (w: string | null) => (w || '').toLowerCase().includes(person.toLowerCase());
    const istGF = (w: string | null) => /^gf/i.test(w || '') || ((w || '').toLowerCase().includes('alex') && (w || '').toLowerCase().includes('lea'));
    const bloecke: Record<string, Any> = {}; for (const p of PHASEN) bloecke[p] = { phase: p, entschieden: [], bewegt: [], wartet: [] };
    const punkte = (pk.data || []) as Any[];
    for (const p of punkte.filter(x => x.erledigt && x.erledigt_at >= vonIso && x.erledigt_at <= bisIso && V.has(x.vorhaben_id)))
      bloecke[phaseVon(p.vorhaben_id)].entschieden.push({ art: 'punkt', id: p.id, text: p.titel, wer: p.erledigt_by, am: p.erledigt_at, vorhaben: V.get(p.vorhaben_id).title, slug: V.get(p.vorhaben_id).slug });
    const E = (en.data || []) as Any[];
    for (const e of E.filter(x => x.status === 'entschieden' && x.entschieden_am >= vonIso && x.entschieden_am <= bisIso))
      bloecke[phaseVon(e.vorhaben_id)].entschieden.push({ art: 'entscheidung', id: e.id, text: e.frage, ergebnis: e.ergebnis, wer: e.entschieden_von, am: e.entschieden_am, vorhaben: V.get(e.vorhaben_id)?.title || null, slug: V.get(e.vorhaben_id)?.slug || null });
    for (const d of (dec.data || []) as Any[]) if (!E.some(e => e.quelle_id === d.topic_id && e.status === 'entschieden'))
      bloecke.sonstiges.entschieden.push({ art: 'beschluss', id: d.id, text: d.topic_title, ergebnis: d.decision, wer: d.decided_by, am: d.decided_at, vorhaben: null, slug: null });
    const proVh = new Map<string, Any[]>();
    for (const x of (vl.data || []) as Any[]) { if (!V.has(x.vorhaben_id)) continue; if (!proVh.has(x.vorhaben_id)) proVh.set(x.vorhaben_id, []); proVh.get(x.vorhaben_id)!.push(x); }
    for (const [vid, eintraege] of proVh) { const v = V.get(vid); bloecke[v.phase || 'sonstiges'].bewegt.push({ id: vid, slug: v.slug, title: v.title, fokus: !!v.fokus, ball: v.ball, ball_name: v.ball_name, stand: v.stand, anzahl: eintraege.length, verlauf: eintraege.slice(0, 3).map((x: Any) => ({ id: x.id, happened_at: x.happened_at, art: x.art, wer: x.wer, text: x.text })) }); }
    for (const b of Object.values(bloecke)) (b as Any).bewegt.sort((a: Any, c: Any) => (c.fokus - a.fokus) || (c.anzahl - a.anzahl));
    const wartet: Any[] = [];
    for (const e of E.filter(x => (x.status === 'abgegeben' && x.abgegeben_an === person.toLowerCase()) || ((x.status === 'offen' || (x.status === 'vertagt' && x.vertagt_bis && x.vertagt_bis <= heute)) )))
      wartet.push({ art: 'entscheidung', id: e.id, text: e.frage, frist: e.frist, wer: e.status === 'abgegeben' ? person : 'GF gemeinsam', status: e.status, vorhaben_id: e.vorhaben_id, vorhaben: V.get(e.vorhaben_id)?.title || null, slug: V.get(e.vorhaben_id)?.slug || null, phase: phaseVon(e.vorhaben_id) });
    for (const p of punkte.filter(x => !x.erledigt && aktiv(x.vorhaben_id) && istPerson(x.wer) && !istGF(x.wer)))
      wartet.push({ art: 'punkt', id: p.id, text: p.titel, frist: p.frist, wer: p.wer, status: 'offen', vorhaben_id: p.vorhaben_id, vorhaben: V.get(p.vorhaben_id).title, slug: V.get(p.vorhaben_id).slug, phase: phaseVon(p.vorhaben_id) });
    for (const z of (ho.data || []) as Any[]) if (z.kind === 'vorhaben' && aktiv(z.ref_id) && ['ruht','rot','vorher'].includes(z.ampel))
      wartet.push({ art: 'korb', id: z.id, text: z.title, frist: null, wer: person, status: z.ampel, vorhaben_id: z.ref_id, vorhaben: V.get(z.ref_id).title, slug: V.get(z.ref_id).slug, phase: phaseVon(z.ref_id) });
    for (const w of wartet) bloecke[w.phase].wartet.push(w);
    for (const b of Object.values(bloecke)) (b as Any).wartet.sort((a: Any, c: Any) => (a.frist || '9999').localeCompare(c.frist || '9999'));
    /* Nach Menschen: offene Punkte aller aktiven Vorhaben, offene und vertagte Entscheidungen (GF gemeinsam) und abgegebene (Person), gruppiert nach wer. */
    const menschen: Record<string, Any[]> = {};
    const wer = (w: string | null) => { const s = (w || '').trim(); if (!s) return 'offen'; if (istGF(s)) return 'GF gemeinsam'; return s.split(/[,&]|\bund\b|\bmit\b/)[0].trim().split(' ')[0] || s; };
    for (const p of punkte.filter(x => !x.erledigt && aktiv(x.vorhaben_id))) { const k = wer(p.wer); (menschen[k] = menschen[k] || []).push({ art: 'punkt', id: p.id, text: p.titel, frist: p.frist, vorhaben: V.get(p.vorhaben_id).title, slug: V.get(p.vorhaben_id).slug, phase: phaseVon(p.vorhaben_id) }); }
    for (const e of E.filter(x => (x.status === 'abgegeben' || x.status === 'offen' || x.status === 'vertagt') && (!x.vorhaben_id || aktiv(x.vorhaben_id)))) { const k = e.status !== 'abgegeben' ? 'GF gemeinsam' : (e.abgegeben_an === 'team' ? 'Team' : whoNorm(e.abgegeben_an)); (menschen[k] = menschen[k] || []).push({ art: 'entscheidung', id: e.id, text: e.frage, frist: e.frist, status: e.status, abgegeben_an: e.abgegeben_an, updated_at: e.updated_at, vorhaben: V.get(e.vorhaben_id)?.title || null, slug: V.get(e.vorhaben_id)?.slug || null, phase: phaseVon(e.vorhaben_id) }); }
    /* Runde 3, Befund 6: auch das Entschiedene und Erledigte der Abwesenheit, mit Status. */
    for (const b of Object.values(bloecke)) for (const x of (b as Any).entschieden) { const k = wer(x.wer); (menschen[k] = menschen[k] || []).push({ art: x.art, id: x.id, text: x.text, frist: null, status: x.art === 'punkt' ? 'erledigt' : 'entschieden', am: x.am, vorhaben: x.vorhaben, slug: x.slug, phase: (b as Any).phase }); }
    const reihen = ['Lea', 'Alex', 'GF gemeinsam'];
    const nachMenschen = Object.entries(menschen).map(([name, eintraege]) => ({ name, eintraege })).sort((a, b) => { const ia = reihen.indexOf(a.name), ib = reihen.indexOf(b.name); return (ia < 0 ? 9 : ia) - (ib < 0 ? 9 : ib) || b.eintraege.length - a.eintraege.length; });
    const zaehler = { entschieden: Object.values(bloecke).reduce((n, b: Any) => n + b.entschieden.length, 0), bewegt: proVh.size, wartet: wartet.length, tage: Math.max(1, Math.round((Date.parse(bis) - Date.parse(von)) / 86400000) + 1) };
    return { absence: ab, person, von, bis, heute, brief: ab.note_rueckkehr || null, phasen: PHASEN.map(p => bloecke[p]), nach_menschen: nachMenschen, zaehler };
  }

  async function handle(action: string, t: Any): Promise<Response> {
    try {
      if (action === 'entscheidungen_list') return json(await liste(t));
      if (action === 'entscheidung_set') {
        const wer = by(t); const eid = id(t); const patch = enSetEingabe(t, heuteBerlin());
        if (patch.frage !== undefined) patch.frage_von = wer;
        /* Runde 3, Befund 1: nur bearbeitbare Zeilen, und nur vom gesehenen Stand aus (expect_updated_at). */
        const { data: alt, error: e0 } = await admin.from('hh_entscheidungen').select('id,status,updated_at').eq('id', eid).maybeSingle();
        if (e0) throw e0; if (!alt) throw new EnFehler('Entscheidung gibt es nicht', 404);
        if (!['offen', 'vertagt'].includes(alt.status)) throw new EnFehler(`Die Entscheidung ist inzwischen ${alt.status}; bitte neu laden`, 409);
        if (t.expect_updated_at && Math.abs(Date.parse(String(t.expect_updated_at)) - Date.parse(alt.updated_at)) > 1) throw new EnFehler('Die Entscheidung wurde inzwischen geändert; bitte neu laden', 409);
        patch.updated_at = new Date().toISOString();
        const { data, error } = await admin.from('hh_entscheidungen').update(patch).eq('id', eid).eq('updated_at', alt.updated_at).select('id').maybeSingle();
        if (error) throw error; if (!data) throw new EnFehler('Die Entscheidung wurde inzwischen geändert; bitte neu laden', 409);
        return json(await antwort({ ok: true }, eid, null));
      }
      if (action === 'entscheidung_entscheiden') {
        const wer = by(t); const eid = id(t); const erg = (t.ergebnis ?? '').toString().trim();
        if (erg.length < 5) throw new EnFehler('Ergebnis fehlt (ein Satz, mindestens fünf Zeichen)');
        const sitzung = (t.session_id ?? '').toString();
        if (sitzung && !EN_UUID.test(sitzung)) throw new EnFehler('session_id ist keine Kennung');
        const r = await rpc('hh_entscheidung_entscheiden', { p_id: eid, p_ergebnis: erg.slice(0, 4000), p_by: wer, p_session: sitzung || null });
        return json(await antwort({ ok: true, geaendert: !!r?.geaendert }, eid, r));
      }
      if (action === 'entscheidung_vertagen') {
        const wer = by(t); const eid = id(t); const bis = gueltigerTag(t.bis);
        if (!bis) throw new EnFehler('bis: Datum als JJJJ-MM-TT');
        if (bis < heuteBerlin()) throw new EnFehler('Vertagen braucht ein Datum ab heute');
        const r = await rpc('hh_entscheidung_vertagen', { p_id: eid, p_bis: bis, p_by: wer });
        return json(await antwort({ ok: true, geaendert: !!r?.geaendert }, eid, r));
      }
      if (action === 'entscheidung_abgeben') {
        const wer = by(t); const eid = id(t); const an = (t.an ?? '').toString().toLowerCase();
        if (!['alex', 'lea', 'team'].includes(an)) throw new EnFehler('an: alex, lea oder team');
        const r = await rpc('hh_entscheidung_abgeben', { p_id: eid, p_an: an, p_by: wer });
        return json(await antwort({ ok: true, geaendert: !!r?.geaendert }, eid, r));
      }
      if (action === 'entscheidung_zurueck') {
        const wer = by(t); const eid = id(t);
        const r = await rpc('hh_entscheidung_zurueck', { p_id: eid, p_by: wer });
        return json(await antwort({ ok: true }, eid, r));
      }
      if (action === 'entscheidungen_sammelaktion') {
        const wer = by(t); const items = Array.isArray(t.items) ? t.items.slice(0, 200) : [];
        if (!items.length) throw new EnFehler('items: 1 bis 200 Entscheidungen');
        for (const it of items) if (!EN_UUID.test((it?.id ?? '').toString())) throw new EnFehler('id ist keine Kennung');
        const aktion = (t.aktion ?? '').toString(); if (!['nicht_jetzt','abgeben','hinfaellig'].includes(aktion)) throw new EnFehler('aktion: nicht_jetzt, abgeben oder hinfaellig');
        let wert: string | null = null;
        if (aktion === 'nicht_jetzt' && t.wert) { wert = gueltigerTag(t.wert); if (!wert) throw new EnFehler('wert: Datum als JJJJ-MM-TT'); if (wert < heuteBerlin()) throw new EnFehler('Datum ab heute'); }
        if (aktion === 'abgeben') { wert = (t.wert ?? '').toString().toLowerCase(); if (!['alex','lea','team'].includes(wert || '')) throw new EnFehler('wert: alex, lea oder team'); }
        /* Runde 3, Befund 9: der gesehene Stand ist je Zeile Pflicht, sonst gäbe es keinen Konflikt je Zeile. */
        for (const it of items) if (!it.expect_updated_at || isNaN(Date.parse(String(it.expect_updated_at)))) throw new EnFehler('expect_updated_at fehlt oder ist kein Zeitpunkt (je Zeile)');
        const r = await rpc('hh_entscheidungen_sammelaktion', { p_items: items.map((it: Any) => ({ id: it.id, expect_updated_at: it.expect_updated_at })), p_aktion: aktion, p_wert: wert, p_by: wer });
        return json(r);
      }
      if (action === 'lauf_rueckgaengig') {
        /* Stufe 2, Abschnitt 6: eine Lauf-Erledigung innerhalb von 7 Tagen zurücknehmen (hh_lauf_rueckgaengig). */
        const wer = by(t); const vid = id(t);
        return json(await rpc('hh_lauf_rueckgaengig', { p_verlauf_id: vid, p_by: wer }));
      }
      if (action === 'vorhaben_phase') {
        const wer = by(t); const vid = id(t);
        const phase = t.phase === undefined ? null : (t.phase ?? '').toString();
        const fokus = t.fokus === undefined ? null : !!t.fokus;
        if (phase === null && fokus === null) throw new EnFehler('phase oder fokus fehlt');
        const r = await rpc('hh_vorhaben_phase', { p_id: vid, p_phase: phase, p_fokus: fokus, p_by: wer });
        return json(r);
      }
      if (action === 'lauf_bilanz') return json(await laufBilanz(t));
      if (action === 'rueckkehr_lage') return json(await rueckkehrLage(t));
      if (action === 'rueckkehr_brief_set') {
        const wer = by(t); const aid = (t.absence_id ?? '').toString(); if (!EN_UUID.test(aid)) throw new EnFehler('absence_id fehlt');
        const text = (t.text ?? '').toString().trim().slice(0, 6000);
        const { data, error } = await admin.from('gfweekly_absences').update({ note_rueckkehr: text || null, updated_at: new Date().toISOString() }).eq('id', aid).select('id,note_rueckkehr').maybeSingle();
        if (error) throw error; if (!data) throw new EnFehler('Abwesenheit gibt es nicht', 404);
        return json({ ok: true, brief: data.note_rueckkehr, von: wer });
      }
      if (action === 'korb_list') return json(await korbListe());
      if (action === 'korb_set') return json(await korbSet(t));
      return json({ error: 'unknown action' }, 400);
    } catch (e) {
      if (e instanceof EnFehler) return json({ error: e.message }, e.status);
      throw e;
    }
  }
  return { handle, rueckkehrLage, laufBilanz };
}
