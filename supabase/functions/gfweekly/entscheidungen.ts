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
      ids('punkt').length ? admin.from('hh_vorhaben_punkte').select('id,titel,stand,position,quelle,created_at,vorhaben_id').in('id', ids('punkt')) : { data: [] },
      ids('thema').length ? admin.from('gfweekly_topics').select('id,title,context,short_description,next_action,recommendation,gate_frist,created_at,vorhaben_id,board_lane,archived').in('id', ids('thema')) : { data: [] },
      ids('kandidat').length ? admin.from('gfweekly_news').select('id,title,body,quote,source,source_title,source_url,happened_at,created_at,vorhaben_id,status').in('id', ids('kandidat')) : { data: [] },
    ]);
    for (const r of [punkte, themen, kandidaten]) if (r.error) throw r.error;   // Runde 3, Befund 3: ein Abfragefehler ist kein „Quelle fehlt“
    for (const p of ((punkte.data || []) as Any[])) if (p.vorhaben_id) vhIds.add(p.vorhaben_id);
    const vh: Any = vhIds.size ? await admin.from('hh_vorhaben').select('id,slug,title,status,ball,naechster_schritt').in('id', [...vhIds]) : { data: [] };
    if (vh.error) throw vh.error;
    const VH = new Map<string, Any>(((vh.data || []) as Any[]).map((v: Any) => [v.id, v]));
    const P = new Map<string, Any>(((punkte.data || []) as Any[]).map((x: Any) => [x.id, x]));
    const T = new Map<string, Any>(((themen.data || []) as Any[]).map((x: Any) => [x.id, x]));
    const K = new Map<string, Any>(((kandidaten.data || []) as Any[]).map((x: Any) => [x.id, x]));
    return rows.map(r => {
      let h: Any = { art: r.quelle_art, titel: null, text: null, url: null, datum: null, fehlt: false };
      let vorhaben: Any = r.vorhaben_id ? VH.get(r.vorhaben_id) : null;
      if (r.quelle_art === 'punkt') {
        const p = P.get(r.quelle_id); if (!p) h.fehlt = true;
        else { vorhaben = vorhaben || VH.get(p.vorhaben_id); h = { ...h, titel: p.titel, text: p.stand || null, datum: p.created_at, url: vorhaben ? `vorhaben.html?v=${encodeURIComponent(vorhaben.slug)}` : null }; }
      } else if (r.quelle_art === 'thema') {
        const x = T.get(r.quelle_id); if (!x) h.fehlt = true;
        else h = { ...h, titel: x.title, text: x.short_description || x.context || null, datum: x.created_at, url: `board.html?topic=${encodeURIComponent(x.id)}` };
      } else {
        const x = K.get(r.quelle_id); if (!x) h.fehlt = true;
        else h = { ...h, titel: x.title, text: x.body || x.quote || null, datum: x.happened_at || x.created_at, url: /^https?:/.test(x.source_url || '') ? x.source_url : null, quelle: x.source_title || x.source || null };
      }
      return { ...r, herkunft: h, vorhaben: vorhaben ? { id: vorhaben.id, slug: vorhaben.slug, title: vorhaben.title, status: vorhaben.status } : null };
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
      if (action === 'korb_list') return json(await korbListe());
      if (action === 'korb_set') return json(await korbSet(t));
      return json({ error: 'unknown action' }, 400);
    } catch (e) {
      if (e instanceof EnFehler) return json({ error: e.message }, e.status);
      throw e;
    }
  }
  return { handle };
}
