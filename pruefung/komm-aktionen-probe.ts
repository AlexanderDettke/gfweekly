/* Aktionsprobe V32 Kommunikation: das Modul supabase/functions/gfweekly/komm.ts gegen eine nachgebildete Umgebung.
   Datenbank: lokales Postgres (PGlite) mit der echten Migration, angesprochen über einen kleinen Nachbau des
   Supabase-Clients (nur die Aufrufe, die komm.ts macht). Asana, Google-Anmeldung und Google Sheets: nachgebaut über
   globalThis.fetch, mit Zustand und gezielt eingestreuten Fehlern. Kein Zugriff auf Produktion, Asana oder Google.
   Aufruf: PGLITE_MODUL=<pfad>/node_modules/@electric-sql/pglite/dist/index.js npx deno run -A pruefung/komm-aktionen-probe.ts */
// deno-lint-ignore-file no-explicit-any
const PGLITE = Deno.env.get('PGLITE_MODUL');
if (!PGLITE) { console.log('PGLITE_MODUL fehlt'); Deno.exit(2); }
const { PGlite } = await import(PGLITE.startsWith('file:') ? PGLITE : 'file://' + PGLITE);
const BASIS = new URL('../', import.meta.url);
const MIGRATION = ['20261007052131_hh_komm_v32a', '20261007070401_hh_komm_v32b', '20261007073224_hh_komm_v32c', '20261007074130_hh_komm_v32d', '20261007091500_hh_komm_v32e']
  .map(n => Deno.readTextFileSync(new URL(`supabase/migrations/${n}.sql`, BASIS))).join('\n');

let ok = 0, fehler = 0;
const gleich = (name: string, ist: unknown, soll: unknown) => { const a = JSON.stringify(ist), b = JSON.stringify(soll); if (a === b) { ok++; console.log('  ok     ' + name); } else { fehler++; console.log('  FEHLT  ' + name + '\n         ist  ' + a.slice(0, 500) + '\n         soll ' + b.slice(0, 500)); } };
const wahr = (name: string, b: unknown, info = '') => { if (b) { ok++; console.log('  ok     ' + name); } else { fehler++; console.log('  FEHLT  ' + name + (info ? '\n         ' + info.slice(0, 500) : '')); } };

/* ---------- Datenbank ---------- */
const db = new PGlite({ parsers: { 1082: (v: string) => v, 1184: (v: string) => new Date(v).toISOString(), 1114: (v: string) => v, 1700: (v: string) => Number(v) } });
const EV: Record<string, string> = { LUSRD27: '00000000-0000-0000-0000-0000000000a1', FAMRD27: '00000000-0000-0000-0000-0000000000a2', BYNRD27: '00000000-0000-0000-0000-0000000000a3', WMRD27: '00000000-0000-0000-0000-0000000000a4', FLRD27: '00000000-0000-0000-0000-0000000000a5' };
const P = { christian: '00000000-0000-0000-0000-00000000c001', alex: '00000000-0000-0000-0000-00000000a001', lea: '00000000-0000-0000-0000-00000000b001' };
await db.exec(`create role anon; create role authenticated; create role service_role;
  create table public.vvp_events(id uuid primary key);
  insert into public.vvp_events(id) values ${Object.values(EV).map(i => `('${i}')`).join(',')};
  create table public.gfweekly_launch_besetzung(event_id uuid, bereich text, person_id uuid, status text, quelle text, notiz text, bestaetigt_von text, bestaetigt_am timestamptz);`);
await db.exec(MIGRATION);
for (const s of Object.keys(EV)) if (s !== 'LUSRD27') await db.query(`insert into gfweekly_launch_besetzung values ($1,'komm',$2,'bestaetigt','Probe',null,'Alex',now())`, [EV[s], P.christian]);
const q = async (sql: string, p: unknown[] = []) => (await db.query(sql, p)).rows as any[];

function spalte(c: string) {
  if (c === 'by') return '"by"';
  const m = /^(\w+)->>(\w+)$/.exec(c); if (m) return `${m[1]}->>'${m[2]}'`;
  return c;
}
class Q {
  op = 'select'; cols = '*'; f: string[] = []; p: unknown[] = []; ord: string[] = []; lim: number | null = null; off = 0; einzeln: '' | 'single' | 'maybe' = ''; daten: any = null; konflikt = ''; rueck = false;
  constructor(public t: string) {}
  par(v: unknown) { this.p.push(v); return '$' + this.p.length; }
  select(c = '*') { if (this.op === 'select') this.cols = c; else this.rueck = true; return this; }
  eq(c: string, v: unknown) { this.f.push(`${spalte(c)}::text = ${this.par(String(v))}::text`); return this; }
  in(c: string, v: unknown[]) { this.f.push(`${spalte(c)}::text = any(${this.par('{' + v.map(x => '"' + String(x).replace(/"/g, '\\"') + '"').join(',') + '}')}::text[])`); return this; }
  not(c: string, _op: string, _v: null) { this.f.push(`${spalte(c)} is not null`); return this; }
  is(c: string, _v: null) { this.f.push(`${spalte(c)} is null`); return this; }
  gte(c: string, v: unknown) { this.f.push(`${spalte(c)}::text >= ${this.par(String(v))}`); return this; }
  lte(c: string, v: unknown) { this.f.push(`${spalte(c)}::text <= ${this.par(String(v))}`); return this; }
  contains(c: string, v: unknown) { this.f.push(`${spalte(c)} @> ${this.par(JSON.stringify(v))}::jsonb`); return this; }
  order(c: string, o: any = {}) { this.ord.push(`${spalte(c)} ${o.ascending === false ? 'desc' : 'asc'}`); return this; }
  limit(n: number) { this.lim = n; return this; }
  range(a: number, b: number) { this.off = a; this.lim = b - a + 1; return this; }
  single() { this.einzeln = 'single'; return this; }
  maybeSingle() { this.einzeln = 'maybe'; return this; }
  insert(d: any) { this.op = 'insert'; this.daten = d; return this; }
  update(d: any) { this.op = 'update'; this.daten = d; return this; }
  upsert(d: any, o: any = {}) { this.op = 'upsert'; this.daten = d; this.konflikt = o.onConflict || ''; return this; }
  async sql() {
    const wo = this.f.length ? ' where ' + this.f.join(' and ') : '';
    if (this.op === 'select') {
      const embed = /komm_schritte\(\*\)/.test(this.cols);
      const cols = embed ? `m.*, coalesce((select json_agg(s) from komm_schritte s where s.veroeffentlichung_id = m.id), '[]'::json) as komm_schritte`
        : this.cols.split(',').map(c => spalte(c.trim())).join(', ');
      let s = `select ${cols} from ${this.t} m${wo}`;
      if (this.ord.length) s += ' order by ' + this.ord.join(', ');
      if (this.lim !== null) s += ` limit ${this.lim} offset ${this.off}`;
      return s;
    }
    const keys = Object.keys(this.daten).map(spalte);
    const rec = `jsonb_populate_record(null::${this.t}, ${this.par(JSON.stringify(this.daten))}::jsonb)`;
    if (this.op === 'insert') return `insert into ${this.t} (${keys.join(',')}) select ${keys.join(',')} from ${rec} returning *`;
    if (this.op === 'upsert') return `insert into ${this.t} (${keys.join(',')}) select ${keys.join(',')} from ${rec} on conflict (${this.konflikt}) do update set ${keys.map(k => `${k} = excluded.${k}`).join(', ')} returning *`;
    return `update ${this.t} set (${keys.join(',')}) = (select ${keys.join(',')} from ${rec})${wo} returning *`;
  }
  then(ok: any, nein: any) {
    return (async () => {
      try {
        const rows = (await db.query(await this.sql(), this.p)).rows as any[];
        if (this.einzeln === 'single') return rows.length === 1 ? { data: rows[0], error: null } : { data: null, error: { message: 'keine Zeile', code: 'PGRST116' } };
        if (this.einzeln === 'maybe') return { data: rows[0] || null, error: null };
        return { data: this.op === 'select' || this.rueck ? rows : null, error: null };
      } catch (e) { return { data: null, error: { message: (e as Error).message, code: (e as any).code } }; }
    })().then(ok, nein);
  }
}
const RPC_STOERUNG = new Set<string>();
const admin = {
  from: (t: string) => new Q(t),
  /* Wie PostgREST: Argumenttypen aus der Signatur der Funktion. */
  rpc: async (name: string, args: Record<string, unknown>) => {
    if (RPC_STOERUNG.has(name)) { RPC_STOERUNG.delete(name); return { data: null, error: { message: 'Probe: Datenbank nicht erreichbar', code: '08006' } }; }
    const sig = (await db.query(`select a.n as name, format_type(a.t, null) as typ from pg_proc p, unnest(p.proargnames, p.proargtypes::oid[]) a(n, t) where p.proname = $1`, [name])).rows as any[];
    const typ = new Map(sig.map(r => [r.name, r.typ]));
    const teile: string[] = [], p: unknown[] = [];
    for (const [k, v] of Object.entries(args)) {
      const t = typ.get(k) || 'text';
      p.push(v === null ? null : t === 'jsonb' ? JSON.stringify(v) : Array.isArray(v) ? '{' + v.map(x => '"' + String(x).replace(/"/g, '\\"') + '"').join(',') + '}' : v);
      teile.push(`${k} => $${p.length}::${t}`);
    }
    try { const r = (await db.query(`select public.${name}(${teile.join(', ')}) as r`, p)).rows as any[]; return { data: r[0]?.r ?? null, error: null }; }
    catch (e) { return { data: null, error: { message: (e as Error).message, code: (e as any).code } }; }
  },
};

/* ---------- Asana, Google, Sheets ---------- */
const A = { projekte: new Map<string, any>(), abschnitte: new Map<string, any>(), aufgaben: new Map<string, any>(), stories: [] as any[], n: 1000, aufrufe: [] as string[], stoerung: [] as any[], verzoegerung: 0, haenger: null as null | ((m: string, p: string) => Promise<void> | null) };
const neueGid = () => String(++A.n);
function asanaAntwort(status: number, body: unknown) { return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } }); }
function asanaFake(methode: string, url: URL, body: any) {
  const pfad = url.pathname.replace('/api/1.0', '');
  A.aufrufe.push(`${methode} ${pfad}`);
  const st = A.stoerung.findIndex(s => !s.netzNachher && s.methode === methode && s.muster.test(pfad));
  if (st >= 0) { const s = A.stoerung.splice(st, 1)[0]; if (s.vorher) s.vorher(body); const r = asanaAntwort(s.status, { errors: [{ message: s.text }] }); if (s.retryAfter) r.headers.set('retry-after', String(s.retryAfter)); return r; }
  const d = body?.data || {};
  let m: RegExpExecArray | null;
  if (methode === 'GET' && pfad === '/projects') {
    const alle = [...A.projekte.values()].filter(p => !p.geloescht && (url.searchParams.get('archived') !== 'false' || !p.archived));
    return asanaAntwort(200, { data: alle.map(p => ({ gid: p.gid, name: p.name, archived: p.archived, team: { gid: 'TEAM1' } })), next_page: null });
  }
  if (methode === 'POST' && pfad === '/projects') {
    const gid = neueGid(); A.projekte.set(gid, { gid, name: d.name, notes: d.notes, owner: d.owner || null, team: d.team, archived: false, members: [] });
    const s = neueGid(); A.abschnitte.set(s, { gid: s, projekt: gid, name: 'Untitled section', ord: 0 });
    return asanaAntwort(201, { data: { gid } });
  }
  if ((m = /^\/projects\/(\d+)$/.exec(pfad))) {
    const p = A.projekte.get(m[1]); if (!p || p.geloescht) return asanaAntwort(404, { errors: [{ message: 'Unknown object' }] });
    if (methode === 'GET') return asanaAntwort(200, { data: { gid: p.gid, name: p.name, archived: p.archived, owner: p.owner ? { gid: p.owner } : null } });
    if (methode === 'PUT') { Object.assign(p, d); return asanaAntwort(200, { data: p }); }
    if (methode === 'DELETE') { p.geloescht = true; return asanaAntwort(200, { data: {} }); }
  }
  if ((m = /^\/projects\/(\d+)\/addMembers$/.exec(pfad))) { A.projekte.get(m[1]).members.push(d.members); return asanaAntwort(200, { data: {} }); }
  if ((m = /^\/projects\/(\d+)\/sections$/.exec(pfad))) {
    const eigene = [...A.abschnitte.values()].filter(s => s.projekt === m![1] && !s.geloescht).sort((a, b) => a.ord - b.ord);
    if (methode === 'GET') return asanaAntwort(200, { data: eigene.map(s => ({ gid: s.gid, name: s.name })) });
    const gid = neueGid();
    let ord = (eigene[eigene.length - 1]?.ord ?? 0) + 1;
    if (d.insert_before) { const vor = A.abschnitte.get(d.insert_before); ord = vor.ord - 0.001; }
    A.abschnitte.set(gid, { gid, projekt: m[1], name: d.name, ord }); return asanaAntwort(201, { data: { gid } });
  }
  if ((m = /^\/sections\/(\d+)\/tasks$/.exec(pfad))) return asanaAntwort(200, { data: [...A.aufgaben.values()].filter(t => !t.geloescht && t.mitglied.some((x: any) => x.section === m![1])).map(t => ({ gid: t.gid })), next_page: null });
  if ((m = /^\/sections\/(\d+)$/.exec(pfad)) && methode === 'DELETE') { A.abschnitte.get(m[1]).geloescht = true; return asanaAntwort(200, { data: {} }); }
  if ((m = /^\/projects\/(\d+)\/tasks$/.exec(pfad))) return asanaAntwort(200, { data: [...A.aufgaben.values()].filter(t => !t.geloescht && t.mitglied.some((x: any) => x.project === m![1])).filter(t => !(t.unsichtbar > 0 && t.unsichtbar--)).map(t => ({ gid: t.gid, name: t.name })), next_page: null });
  if (methode === 'POST' && pfad === '/tasks') {
    const gid = neueGid();
    const mitglied = d.memberships ? d.memberships.map((x: any) => ({ project: x.project, section: x.section })) : (d.projects || []).map((x: string) => ({ project: x, section: null }));
    A.aufgaben.set(gid, { gid, name: d.name, notes: d.notes, due_on: d.due_on, assignee: d.assignee, mitglied }); return asanaAntwort(201, { data: { gid } });
  }
  if ((m = /^\/tasks\/(\d+)$/.exec(pfad))) {
    const t = A.aufgaben.get(m[1]); if (!t || t.geloescht) return asanaAntwort(404, { errors: [{ message: 'Unknown object' }] });
    if (methode === 'PUT') { Object.assign(t, d); return asanaAntwort(200, { data: t }); }
    if (methode === 'DELETE') { t.geloescht = true; return asanaAntwort(200, { data: {} }); }
  }
  if ((m = /^\/tasks\/(\d+)\/addProject$/.exec(pfad))) { const t = A.aufgaben.get(m[1]); t.mitglied.push({ project: d.project, section: d.section || null }); return asanaAntwort(200, { data: {} }); }
  if ((m = /^\/tasks\/(\d+)\/stories$/.exec(pfad))) {
    if (methode === 'GET') return asanaAntwort(200, { data: A.stories.filter(x => x.task === m![1]).map(x => ({ text: x.text, resource_subtype: 'comment_added' })), next_page: null });
    A.stories.push({ task: m[1], text: d.text }); return asanaAntwort(201, { data: { gid: neueGid() } });
  }
  return asanaAntwort(400, { errors: [{ message: 'nicht nachgebaut: ' + methode + ' ' + pfad }] });
}
/* Sheets: Zeilen 1 bis 7, Spalten A bis ..., Zeile 5 Datum per Formel, Zeile 6 Fixtermine. */
const S = { spalten: 740, f5: '=DATE($B$2,1,1)', zeile6: new Map<number, any>(), schreibe: [] as any[], token: 0, gelesen: 0, nachLesen: null as null | ((n: number) => void), postFehler: false };
const serie = (iso: string) => Math.round((Date.parse(iso + 'T00:00:00Z') - Date.parse('1899-12-30T00:00:00Z')) / 86400000);
const isoPlus = (iso: string, n: number) => new Date(Date.parse(iso + 'T00:00:00Z') + n * 86400000).toISOString().slice(0, 10);
const startDatum = () => S.f5 === '=DATE(2026,10,1)' ? '2026-10-01' : (S.f5 === '=DATE($B$2,1,1)' ? '2027-01-01' : '2027-01-01');
const spalteDatum = (i: number) => isoPlus(startDatum(), i - 5);
function zelle6(i: number, wert?: any, note?: string) { S.zeile6.set(i, { userEnteredValue: wert, note }); }
zelle6(0, { stringValue: 'Fixtermine & Meilensteine' });
function sheetsFake(methode: string, url: URL, body: any) {
  if (url.hostname === 'oauth2.googleapis.com') { S.token++; return asanaAntwort(200, { access_token: 'tok' + S.token, expires_in: 3600 }); }
  if (methode === 'GET' && url.searchParams.get('fields')?.startsWith('sheets(properties')) return asanaAntwort(200, { sheets: [{ properties: { sheetId: 7, title: 'Contentplan', gridProperties: { columnCount: S.spalten, rowCount: 60 } } }] });
  if (methode === 'GET') {
    S.gelesen++; if (S.nachLesen) S.nachLesen(S.gelesen);
    const r5 = [], r6 = [];
    for (let i = 0; i < S.spalten; i++) {
      if (i === 5) r5.push({ userEnteredValue: { formulaValue: S.f5 }, effectiveValue: { numberValue: serie(spalteDatum(5)) } });
      else if (i > 5) r5.push({ userEnteredValue: { formulaValue: '=' + 'X' + (i - 1) + '+1' }, effectiveValue: { numberValue: serie(spalteDatum(i)) } });
      else r5.push({});
      const z = S.zeile6.get(i) || {}; const u = z.userEnteredValue;
      r6.push({ userEnteredValue: u, note: z.note, formattedValue: u ? (u.stringValue ?? (u.formulaValue === '=""' ? '' : u.formulaValue)) : undefined });
    }
    return asanaAntwort(200, { sheets: [{ data: [{ rowData: [{ values: r5 }, { values: r6 }] }] }] });
  }
  if (methode === 'POST' && url.pathname.endsWith(':batchUpdate')) {
    if (S.postFehler) { S.postFehler = false; return asanaAntwort(500, { error: { message: 'Probe: Schreiben scheitert' } }); }
    for (const r of body.requests) {
      const u = r.updateCells; S.schreibe.push({ zeile: u.start.rowIndex + 1, spalte: u.start.columnIndex, felder: u.fields, wert: u.rows[0].values[0] });
      if (u.start.rowIndex === 4 && u.start.columnIndex === 5) S.f5 = u.rows[0].values[0].userEnteredValue.formulaValue;
      else if (u.start.rowIndex === 5) { const v = u.rows[0].values[0]; zelle6(u.start.columnIndex, v.userEnteredValue, v.note); }
    }
    return asanaAntwort(200, {});
  }
  return asanaAntwort(400, { error: { message: 'nicht nachgebaut' } });
}
globalThis.fetch = (async (eingabe: any, init: any = {}) => {
  const url = new URL(typeof eingabe === 'string' ? eingabe : eingabe.url);
  const methode = (init.method || 'GET').toUpperCase();
  let body: any = null; if (init.body && typeof init.body === 'string') { try { body = JSON.parse(init.body); } catch (_e) { body = null; } }
  if (url.hostname === 'app.asana.com') {
    if (A.verzoegerung) await new Promise(r => setTimeout(r, A.verzoegerung));
    if (A.haenger) { const h = A.haenger(methode, url.pathname); if (h) await h; }
    const antwort = asanaFake(methode, url, body);
    const nf = A.stoerung.findIndex(x => x.netzNachher && x.methode === methode && x.muster.test(url.pathname.replace('/api/1.0', '')));
    if (nf >= 0) { A.stoerung.splice(nf, 1); throw new TypeError('Probe: Verbindung nach der Anlage abgerissen'); }
    return antwort;
  }
  return sheetsFake(methode, url, body);
}) as typeof fetch;

/* ---------- Modul ---------- */
const { kommModul } = await import(new URL('supabase/functions/gfweekly/komm.ts', BASIS).href);
let HEUTE = '2026-10-07';
const FESTE: any[] = [
  ['LUSRD27', 'Lusatia 2027', '2026-10-15', '2027-07-23', '2027-07-25'], ['FAMRD27', 'Malina, Morio & die Draußenbande 2027', '2026-10-01', '2027-07-30', '2027-08-01'],
  ['BYNRD27', 'by nature 2027', '2026-11-01', '2027-08-06', '2027-08-08'], ['WMRD27', 'Wilde Möhre Freude Edition 2027', '2026-09-01', '2027-08-20', '2027-08-23'],
  ['FLRD27', 'Fluidity 2027', '2026-10-25', '2027-08-27', '2027-08-29']].map(([s, n, v, f, z]) => ({ plan_id: 'plan-' + s, event_id: EV[s], short_name: s, name: n, sales_start_on: v, starts_on: f, ends_on: z }));
const LEUTE = [{ id: P.christian, name: 'Christian Linck', typ: 'extern', asana_gid: 'U-CHR', email: 'christian@example.org' }, { id: P.alex, name: 'Alexander Dettke', typ: 'gf', asana_gid: 'U-ALEX', email: 'alex@wildemoehre.org' }, { id: P.lea, name: 'Lea Luce', typ: 'gf', asana_gid: 'U-LEA', email: 'lea@wildemoehre.org' }];
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { 'content-type': 'application/json' } });
const whoNorm = (w: unknown) => { const s = String(w ?? '').toLowerCase(); return s.includes('lea') ? 'Lea' : s.includes('alex') ? 'Alex' : 'Team'; };
const K = kommModul({ admin, json, heuteBerlin: () => HEUTE, whoNorm, launchFestivals: async () => FESTE.map(f => ({ ...f })), launchPersonen: async () => LEUTE,
  ASANA_TOKEN: 'test', ASANA_WORKSPACE: 'WS', ASANA_TEAM: '', HH_BASIS: 'https://hohes-haus.example', MAIL_ALEX: 'alex@wildemoehre.org' });
const ruf = async (action: string, t: any = {}) => { const r: Response = await K.handle(action, t, 'Alex'); return { status: r.status, body: await r.json() }; };
const aufgabenIn = (projekt: string) => [...A.aufgaben.values()].filter(t => !t.geloescht && t.mitglied.some((x: any) => x.project === projekt));

console.log('\n1. Berechnen und Liste');
const b1 = await ruf('komm_berechnen', { festival: 'alle', by: 'Alex' }); if (!b1.body.ergebnis?.[0]?.berechnet) console.log(JSON.stringify(b1.body).slice(0, 1500));
gleich('alle fünf berechnet', b1.body.ergebnis.map((e: any) => [e.festival, e.berechnet]), [['LUSRD27', 102], ['FAMRD27', 94], ['BYNRD27', 101], ['WMRD27', 96], ['FLRD27', 105]]);
const b2 = await ruf('komm_berechnen', { festival: 'alle', by: 'Alex' });
gleich('zweiter Lauf: nichts neu, nichts geändert', b2.body.ergebnis.map((e: any) => [e.neu, e.aktualisiert]), Array(5).fill([0, 0]));
gleich('Regelwerk eingespielt', (await q('select version from komm_regelwerk where aktiv'))[0].version, '1.2.0 (2026-10-05)');
const l1 = await ruf('komm_list');
wahr('komm_list: fünf Festivals, Wochenlast, Lusatia ohne Person, Entscheidung „Besetzung“', l1.body.festivals.length === 5 && l1.body.wochenlast.length > 40 && l1.body.festivals[0].person === null && l1.body.entscheiden.some((e: any) => e.art === 'besetzung' && e.festival === 'LUSRD27'));
const fam = l1.body.festivals.find((f: any) => f.short_name === 'FAMRD27');
wahr('Draußenbande: VVK vorbei, V-START nicht mehr in der Liste, Restschritte in der Wochenlast', fam.anzahl === 94 && l1.body.wochenlast[0].je.DB > 0);
gleich('Wochenlast reicht bis zur Woche des letzten Schritts (Aftermovie Fluidity, Z+60 = 28.10.2027)', l1.body.wochenlast[l1.body.wochenlast.length - 1].woche >= '2027-10-25', true);

console.log('\n2. Prüfpunkte');
const ppDat = fam.pruefpunkte[0].datum;
gleich('Rot von Christian: 403', (await ruf('komm_pruefpunkt_set', { festival: 'FAMRD27', datum: ppDat, stufe: 'rot', extras: [], by: 'Christian Linck' })).status, 403);
const p1 = await ruf('komm_pruefpunkt_set', { festival: 'FAMRD27', datum: ppDat, stufe: 'gelb', extras: ['E03', 'E05'], by: 'Christian Linck', notiz: 'Reichweite schwach' });
gleich('Gelb mit Extras ohne Budget von Christian: gespeichert mit Namen', [p1.status, p1.body.pruefpunkt.entschieden_von, p1.body.pruefpunkt.stufe], [200, 'Christian Linck', 'gelb']);
gleich('Extra mit Budget von Christian: 403', (await ruf('komm_pruefpunkt_set', { festival: 'FAMRD27', datum: ppDat, stufe: 'gelb', extras: ['E01'], by: 'Christian Linck' })).status, 403);
gleich('veraltete gesehene Stufe: 409', (await ruf('komm_pruefpunkt_set', { festival: 'FAMRD27', datum: ppDat, stufe: 'rot', extras: ['E04'], by: 'Alex', expect_stufe: 'offen' })).status, 409);
gleich('Freigabe mit altem Stand der Extras: 409', (await ruf('komm_pruefpunkt_set', { festival: 'FAMRD27', datum: ppDat, stufe: 'gelb', extras: ['E03'], by: 'Alex', expect_stufe: 'gelb', expect_extras: ['E03'] })).status, 409);
const ppJetzt = (await q(`select entschieden_am, notiz from komm_pruefpunkte where festival_short = 'FAMRD27' and datum = $1::date`, [ppDat]))[0];
gleich('Entwurf mit altem Entscheidungszeitpunkt: 409', (await ruf('komm_pruefpunkt_set', { festival: 'FAMRD27', datum: ppDat, stufe: 'gelb', extras: ['E03', 'E05'], by: 'Lea', expect_stufe: 'gelb', expect_extras: ['E03', 'E05'], expect_am: '2026-10-01T00:00:00.000Z' })).status, 409);
gleich('Entwurf mit geänderter Notiz: 409', (await ruf('komm_pruefpunkt_set', { festival: 'FAMRD27', datum: ppDat, stufe: 'gelb', extras: ['E03', 'E05'], by: 'Lea', expect_notiz: 'andere Notiz' })).status, 409);
gleich('Entwurf mit passendem Ausgangsstand: 200', (await ruf('komm_pruefpunkt_set', { festival: 'FAMRD27', datum: ppDat, stufe: 'gelb', extras: ['E03', 'E05'], by: 'Lea', expect_stufe: 'gelb', expect_extras: ['E05', 'E03'], expect_notiz: ppJetzt.notiz, expect_am: ppJetzt.entschieden_am })).status, 200);
gleich('Tag ohne Prüfpunkt: 404', (await ruf('komm_pruefpunkt_set', { festival: 'FAMRD27', datum: '2027-01-01', stufe: 'gelb', by: 'Alex' })).status, 404);
const l2 = await ruf('komm_list');
wahr('Entscheidungen zeigen den gelben Prüfpunkt', l2.body.entscheiden.some((e: any) => e.art === 'pruefpunkt' && e.datum === ppDat && e.stufe === 'gelb'));

console.log('\n3. Versand an Asana');
gleich('Team darf nicht senden', (await ruf('komm_send', { festival: 'FAMRD27', by: 'Team', bestaetigt: true })).status, 403);
const v0 = await ruf('komm_send', { festival: 'FAMRD27', by: 'Lea', vorschau: true });
wahr('Vorschau in Worten mit Christian, ohne Asana-Aufruf', v0.status === 200 && v0.body.saetze[0].includes('Christian Linck') && A.aufrufe.length === 0, JSON.stringify(v0.body.saetze));
gleich('ohne bestaetigt kein Versand', (await ruf('komm_send', { festival: 'FAMRD27', by: 'Lea' })).status, 400);
const s1 = await ruf('komm_send', { festival: 'FAMRD27', by: 'Lea', bestaetigt: true });
const proj = [...A.projekte.values()].find(p => p.name === 'Kommunikation Draußenbande 2027');
wahr('Projekt angelegt mit Eigentum bei Christian', !!proj && proj.owner === 'U-CHR' && proj.members.includes('U-CHR'));
const auf1 = aufgabenIn(proj.gid);
gleich('alle Aufgaben angelegt, alle bei Christian', [s1.body.neu, auf1.length, auf1.every(t => t.assignee === 'U-CHR')], [v0.body.aufgaben, v0.body.aufgaben, true]);
const abschn = [...A.abschnitte.values()].filter(s => s.projekt === proj.gid && !s.geloescht).sort((a, b) => a.ord - b.ord).map(s => s.name);
gleich('Abschnitte je Monat in Reihenfolge, ohne „Untitled section“', abschn.slice(0, 3), ['Oktober 2026', 'November 2026', 'Dezember 2026']);
wahr('Abschnitte vollständig', abschn.length === v0.body.abschnitte.length && !abschn.includes('Untitled section'));
const ohneGid = await q(`select count(*)::int n from komm_veroeffentlichungen where festival_short = 'FAMRD27' and t >= '2026-10-07' and asana_task_gid is null`);
gleich('jede kommende Veröffentlichung hat eine Asana-Kennung', ohneGid[0].n, 0);
wahr('Schritte als abhakbare Liste in der Beschreibung, keine Unteraufgaben', auf1.filter(t => /Prüfpunkt|Redaktion/.test(t.name) === false).every(t => t.notes.includes('Vorschlag aus dem Regelwerk, Verteilung durch dich:') && t.notes.includes('[ ] ')) && !A.aufrufe.some(a => a.includes('subtasks')));
wahr('Monatsbündel „Redaktion <Monat>: n Beiträge“ mit Partner-Slots', auf1.some(t => /^Redaktion \S+ 2026: \d+ Beiträge/.test(t.name)) && auf1.some(t => t.notes.includes('Partner-Slot')));
wahr('Prüfpunkte als Aufgaben mit Link auf kommunikation.html', auf1.filter(t => t.name.startsWith('Prüfpunkt')).every(t => t.notes.includes('/kommunikation.html?festival=FAMRD27')));
const logs1 = await q(`select what from komm_log where what like 'komm_send%' order by id`);
gleich('Protokoll: Projektanlage und Versandbericht getrennt', logs1.map(r => r.what), ['komm_send_projekt', 'komm_send']);

console.log('\n4. Erneut senden');
const eine = auf1.find(t => !t.name.startsWith('Redaktion') && !t.name.startsWith('Prüfpunkt'))!;
eine.assignee = 'U-ANNIE'; eine.mitglied[0].section = 'umsortiert'; eine.kommentar = 'bleibt';
A.aufrufe = [];
const s2 = await ruf('komm_send', { festival: 'FAMRD27', by: 'Alex', bestaetigt: true });
gleich('nichts neu, alles aktualisiert', [s2.body.neu, s2.body.aktualisiert], [0, auf1.length]);
gleich('Zuständigkeit und Abschnitt in Asana nicht überschrieben', [eine.assignee, eine.mitglied[0].section, eine.kommentar], ['U-ANNIE', 'umsortiert', 'bleibt']);
wahr('keine Aufgabe angelegt, kein Projekt angelegt', !A.aufrufe.includes('POST /tasks') && !A.aufrufe.includes('POST /projects'));

console.log('\n5. Termin verschiebt sich nach dem Versand');
const tt = (await q(`select id, t from komm_veroeffentlichungen where festival_short = 'FAMRD27' and regel_id = 'F14-TT'`))[0];
FESTE[1].starts_on = '2027-07-29'; FESTE[1].ends_on = '2027-07-31';
const b3 = await ruf('komm_berechnen', { festival: 'FAMRD27', by: 'Zeitplan' });
const tt2 = (await q(`select t, t_neu, status_bearbeitung from komm_veroeffentlichungen where id = $1`, [tt.id]))[0];
gleich('gesendeter Timetable bleibt, t_neu und zu prüfen', [tt2.t, tt2.t_neu, tt2.status_bearbeitung], [tt.t, '2027-07-15', 'zu_pruefen']);
wahr('Berechnung meldet zu prüfen', b3.body.ergebnis[0].zu_pruefen > 0);
const l3 = await ruf('komm_list');
wahr('Seite zeigt „zu prüfen“ mit neuem Termin', l3.body.festivals.find((f: any) => f.short_name === 'FAMRD27').zu_pruefen.some((x: any) => x.id === tt.id && x.t_neu === '2027-07-15'));
FESTE[1].starts_on = '2027-07-30'; FESTE[1].ends_on = '2027-08-01';
await ruf('komm_berechnen', { festival: 'FAMRD27', by: 'Zeitplan' });

console.log('\n6. Zeitbudget und Fortsetzung');
Deno.env.set('KOMM_SEND_BUDGET_MS', '0');
A.aufrufe = [];
const w1 = await ruf('komm_send', { festival: 'BYNRD27', by: 'Alex', bestaetigt: true });
Deno.env.delete('KOMM_SEND_BUDGET_MS');
wahr('erster Teil bricht nach dem Budget ab und meldet weiter', w1.body.weiter === true && w1.body.rest > 0 && w1.body.neu <= 1, JSON.stringify({ neu: w1.body.neu, rest: w1.body.rest }));
const l4 = await ruf('komm_list');
wahr('Seite zeigt „begonnen, Rest folgt“', l4.body.festivals.find((f: any) => f.short_name === 'BYNRD27').rahmen.weiter === true);
const w2 = await ruf('komm_send', { festival: 'BYNRD27', by: 'Alex', bestaetigt: true });
const pbn = [...A.projekte.values()].find(p => p.name === 'Kommunikation by nature 2027');
gleich('Fortsetzung legt den Rest an, ohne Dubletten', [w2.body.weiter, aufgabenIn(pbn.gid).length, new Set(aufgabenIn(pbn.gid).map(t => t.name)).size], [false, w2.body.aufgaben, w2.body.aufgaben]);

console.log('\n7. Gleichzeitig');
const [g1, g2] = await Promise.all([ruf('komm_send', { festival: 'WMRD27', by: 'Alex', bestaetigt: true }), ruf('komm_send', { festival: 'WMRD27', by: 'Lea', bestaetigt: true })]);
gleich('zwei gleichzeitige Versände: einer 200, einer 409', [g1.status, g2.status].sort(), [200, 409]);
gleich('genau ein Projekt Wilde Möhre', [...A.projekte.values()].filter(p => p.name.startsWith('Kommunikation Wilde Möhre')).length, 1);
const [c1, c2] = await Promise.all([ruf('komm_send', { festival: 'WMRD27', by: 'Alex', bestaetigt: true }), ruf('komm_berechnen', { festival: 'WMRD27', by: 'Zeitplan' })]);
wahr('Versand und Berechnung zugleich: die Berechnung überspringt das gesperrte Festival oder läuft danach', c1.status === 200 && (c2.body.ergebnis[0].uebersprungen || c2.body.ergebnis[0].berechnet));

console.log('\n8. Projektanlage mit Störungen');
A.stoerung.push({ methode: 'POST', muster: /^\/projects$/, status: 400, text: 'owner: Not a recognized ID' });
const o1 = await ruf('komm_send', { festival: 'FLRD27', by: 'Alex', bestaetigt: true });
const pfl = [...A.projekte.values()].filter(p => p.name === 'Kommunikation Fluidity 2027');
gleich('owner abgelehnt: ein Projekt, Eigentum danach gesetzt', [o1.status, pfl.length, pfl[0]?.owner], [200, 1, 'U-CHR']);
/* Lusatia: Kommunikation nicht besetzt, Versand geht an die Leitung Marketing. Die Antwort auf das Anlegen geht verloren. */
A.stoerung.push({ methode: 'POST', muster: /^\/projects$/, status: 502, text: 'Bad Gateway', vorher: (b: any) => { const gid = neueGid(); A.projekte.set(gid, { gid, name: b.data.name, owner: b.data.owner, archived: false, members: [] }); } });
const o2 = await ruf('komm_send', { festival: 'LUSRD27', by: 'Alex', bestaetigt: true });
const plu = [...A.projekte.values()].filter(p => p.name === 'Kommunikation Lusatia 2027');
gleich('verlorene Antwort: kein zweites Projekt, Versand läuft weiter', [o2.status, plu.length], [200, 1]);
wahr('Lusatia ohne Besetzung: Aufgaben bei der Leitung Marketing (Alex)', aufgabenIn(plu[0].gid).every(t => t.assignee === 'U-ALEX') && o2.body.vertretung === true);

console.log('\n9. Projektwechsel');
proj.archived = true;
const pw = await ruf('komm_send', { festival: 'FAMRD27', by: 'Alex', bestaetigt: true });
const neuP = [...A.projekte.values()].find(p => p.name === proj.name && !p.archived)!;
wahr('neues Projekt, alle gemerkten Aufgaben dorthin übernommen, keine neuen Aufgaben', !!neuP && neuP.gid !== proj.gid && pw.body.projektwechsel?.uebernommen === auf1.length && pw.body.neu === 0 && aufgabenIn(neuP.gid).length === auf1.length, JSON.stringify(pw.body.projektwechsel));

console.log('\n10. Testprojekt');
const t1 = await ruf('komm_send', { festival: 'LUSRD27', by: 'Alex', test: true });
const ptest = [...A.projekte.values()].find(p => p.name === 'Kommunikation TEST' && !p.geloescht)!;
wahr('Testprojekt bei Alex, Aufgaben bei Alex', !!ptest && ptest.owner === 'U-ALEX' && aufgabenIn(ptest.gid).every(t => t.assignee === 'U-ALEX') && t1.body.test === true);
const gidLus = await q(`select count(*)::int n from komm_veroeffentlichungen where festival_short = 'LUSRD27' and asana_task_gid in (select gid from (select unnest($1::text[]) gid) x)`, ['{' + aufgabenIn(ptest.gid).map(t => t.gid).join(',') + '}']);
gleich('Testversand schreibt keine Kennungen in die Veröffentlichungen', gidLus[0].n, 0);
const ta = await ruf('komm_test_aufraeumen', { by: 'Alex' });
wahr('Aufräumen löscht erst die Aufgaben, dann das Projekt', ta.body.aufgaben === t1.body.neu && ta.body.projekte === 1 && ptest.geloescht && aufgabenIn(ptest.gid).length === 0, JSON.stringify(ta.body));
gleich('echte Projekte unberührt', [...A.projekte.values()].filter(p => p.name.startsWith('Kommunikation ') && p.name !== 'Kommunikation TEST' && !p.geloescht).length, 6);

console.log('\n11. Partner-Slots und Tick');
Deno.env.set('ANBINDUNG_SCHLUESSEL', 'geheim-geheim-geheim-geheim-1234');
const reqOk = new Request('http://x', { headers: { 'x-anbindung-schluessel': 'geheim-geheim-geheim-geheim-1234' } });
const reqNein = new Request('http://x', { headers: { 'x-anbindung-schluessel': 'falsch' } });
gleich('Anbindungsschlüssel geprüft', [K.anbindungGueltig(reqOk, {}), K.anbindungGueltig(reqNein, {}), K.anbindungGueltig(new Request('http://x'), {})], [true, false, false]);
const so = await ruf('komm_slots_offen', {});
wahr('offene Slots: partnerfähig, mindestens 14 Tage entfernt, mit Abgabefrist T-7 und Thema', so.body.slots.length > 20 && so.body.slots.every((x: any) => x.t >= '2026-10-21' && x.abgabefrist < x.t && x.briefing && x.thema));
const sd = await ruf('komm_slot_details', { id: so.body.slots[0].id });
wahr('Details mit Schritten, ohne E-Mail', sd.status === 200 && sd.body.slot.schritte.length > 0 && !JSON.stringify(sd.body).includes('@'));
gleich('Details zu einem zentralen Beitrag: 404', (await ruf('komm_slot_details', { id: (await q(`select id from komm_veroeffentlichungen where not partnerfaehig limit 1`))[0].id })).status, 404);
/* Tick in zehn Tagen: unübernommene Slots fallen zurück; einer mit Abgabe ohne Freigabe bekommt einen Hinweis in Asana. */
const kandidat = (await q(`select id, t, asana_task_gid from komm_veroeffentlichungen where partnerfaehig and festival_short = 'FAMRD27' and t > '2026-10-20' order by t limit 2`));
const tickTag = isoPlus(kandidat[1].t, -3);
await q(`update komm_veroeffentlichungen set partner_uebernommen_am = now(), partner_name = 'Kollektiv', abgabe_am = now() where id = $1`, [kandidat[1].id]);
HEUTE = tickTag;
const tk = await K.tick();
/* Erwartet zurück: jeder partnerfähige, nicht übernommene Beitrag mit T zwischen Ticktag und Ticktag + 10. */
const sollZurueck = await q(`select id, freigabe_status from komm_veroeffentlichungen where partnerfaehig and partner_uebernommen_am is null and t >= $1::date and t <= ($1::date + 10)`, [tickTag]);
const z0 = { freigabe_status: sollZurueck.length && sollZurueck.every(r => r.freigabe_status === 'zurueck_an_redaktion') ? 'zurueck_an_redaktion' : 'offen' };
const z1 = (await q(`select freigabe_status, partner_name from komm_veroeffentlichungen where id = $1`, [kandidat[1].id]))[0];
wahr('Tick: unübernommener Slot zurück an die Redaktion, übernommener bleibt', z0.freigabe_status === 'zurueck_an_redaktion' && z1.freigabe_status === 'offen' && z1.partner_name === 'Kollektiv', JSON.stringify([z0, z1, tk]));
wahr('Tick: Hinweis an Asana bei Abgabe ohne Freigabe', A.stories.some(s => s.task === kandidat[1].asana_task_gid && s.text.includes('Freigabe fehlt')));
const anz = A.stories.length; await K.tick();
gleich('Hinweis nur einmal', A.stories.length, anz);
HEUTE = '2026-10-07';

console.log('\n13. Fortsetzung, Mitgliedschaft, Sperre, Aufräumen, Ratenlimit (Review 32c)');
{
  /* Wiederholt knappes Budget: jeder Aufruf kommt voran, keine Aufgabe wird doppelt bearbeitet. */
  await q(`delete from komm_versandlauf`);
  A.verzoegerung = 15; Deno.env.set('KOMM_SEND_BUDGET_MS', '60');
  const runden: any[] = [];
  for (let i = 0; i < 80; i++) { const r = await ruf('komm_send', { festival: 'FLRD27', by: 'Alex', bestaetigt: true }); runden.push(r.body); if (!r.body.weiter) break; }
  Deno.env.delete('KOMM_SEND_BUDGET_MS'); A.verzoegerung = 0;
  const pf = [...A.projekte.values()].find(p => p.name === 'Kommunikation Fluidity 2027')!;
  const summeNeu = runden.reduce((x, r) => x + (r.neu || 0), 0), summeAkt = runden.reduce((x, r) => x + (r.aktualisiert || 0), 0);
  wahr('knappes Budget: mehrere Aufrufe, jeder kommt voran, am Ende vollständig', runden.length > 3 && runden.every(r => (r.neu || 0) + (r.aktualisiert || 0) > 0) && runden[runden.length - 1].weiter === false, JSON.stringify(runden.map(r => [r.neu, r.aktualisiert, r.rest])));
  gleich('kein Wiederholen bereits bearbeiteter Aufgaben im selben Lauf', summeNeu + summeAkt, runden[0].aufgaben);
  gleich('Projekt Fluidity vollständig und ohne Dubletten', [aufgabenIn(pf.gid).length, new Set(aufgabenIn(pf.gid).map(t => t.name)).size], [runden[0].aufgaben, runden[0].aufgaben]);
  const neuerLauf = await ruf('komm_send', { festival: 'FLRD27', by: 'Alex', bestaetigt: true });
  gleich('nach Abschluss beginnt ein neuer Lauf: alles aktualisiert, nichts neu', [neuerLauf.body.neu, neuerLauf.body.aktualisiert, neuerLauf.body.weiter], [0, runden[0].aufgaben, false]);
}
{
  /* Unterbrochener Projektwechsel: eine Übernahme scheitert, der nächste Aufruf holt sie nach. */
  const alt = [...A.projekte.values()].find(p => p.name === 'Kommunikation by nature 2027' && !p.archived)!;
  alt.archived = true;
  A.stoerung.push({ methode: 'POST', muster: /^\/tasks\/\d+\/addProject$/, status: 500, text: 'Probe: Übernahme scheitert' });
  const r1 = await ruf('komm_send', { festival: 'BYNRD27', by: 'Alex', bestaetigt: true });
  const ziel = [...A.projekte.values()].find(p => p.name === alt.name && !p.archived)!;
  wahr('erster Versuch: eine Aufgabe nicht übernommen, als Fehler gemeldet', r1.body.fehler.length === 1 && aufgabenIn(ziel.gid).length === r1.body.aufgaben - 1, JSON.stringify(r1.body.fehler));
  const r2 = await ruf('komm_send', { festival: 'BYNRD27', by: 'Alex', bestaetigt: true });
  gleich('zweiter Versuch: alle gemerkten Aufgaben im Zielprojekt', [aufgabenIn(ziel.gid).length, r2.body.neu, r2.body.fehler.length], [r2.body.aufgaben, 0, 0]);
}
{
  /* Sperre läuft während einer hängenden Anfrage ab: der hängende Lauf hört auf, keine Dubletten. */
  await q(`delete from komm_versandlauf where schluessel = 'WMRD27'`);
  const pw = [...A.projekte.values()].find(p => p.name.startsWith('Kommunikation Wilde Möhre') && !p.archived)!;
  for (const t of aufgabenIn(pw.gid)) t.geloescht = true;
  await q(`update komm_veroeffentlichungen set asana_task_gid = null, gesendet_am = null where festival_short = 'WMRD27'`);
  let loslassen: () => void = () => {};
  const haengt = new Promise<void>(r => { loslassen = r; });
  let einmal = true;
  A.haenger = (m, p) => (einmal && m === 'POST' && p.endsWith('/tasks')) ? (einmal = false, haengt) : null;
  const a = ruf('komm_send', { festival: 'WMRD27', by: 'Alex', bestaetigt: true });
  await new Promise(r => setTimeout(r, 300));
  await q(`update komm_sperre set bis = now() - interval '1 second' where schluessel = 'festival:WMRD27'`);
  const b = await ruf('komm_send', { festival: 'WMRD27', by: 'Lea', bestaetigt: true });
  loslassen(); A.haenger = null;
  const ra = await a;
  const namen = aufgabenIn(pw.gid).map(t => t.name);
  wahr('zweiter Lauf übernimmt nach Ablauf, der hängende hört nach seiner Anfrage auf', b.status === 200 && ra.status === 200 && ra.body.unterbrochen?.includes('Sperre verloren'), JSON.stringify([b.status, ra.body.unterbrochen, ra.body.neu]));
  gleich('keine Dubletten im Projekt', namen.length, new Set(namen).size);
}
{
  /* Ratenlimit mit langer Wartezeit: geordnete Unterbrechung mit frühestem Fortsetzungszeitpunkt. */
  await q(`delete from komm_versandlauf where schluessel = 'FAMRD27'`);
  A.stoerung.push({ methode: 'PUT', muster: /^\/tasks\/\d+$/, status: 429, text: 'rate limit', retryAfter: 120 });
  const r = await ruf('komm_send', { festival: 'FAMRD27', by: 'Alex', bestaetigt: true });
  wahr('Ratenlimit 120 s (länger als das Budget): unterbrochen, weiter, fortsetzen_ab rund zwei Minuten später', r.body.weiter === true && !!r.body.unterbrochen && Date.parse(r.body.fortsetzen_ab) - Date.now() > 100000 && r.body.rest > 0, JSON.stringify([r.body.unterbrochen, r.body.fortsetzen_ab, r.body.rest]));
  A.aufrufe = [];
  const r2 = await ruf('komm_send', { festival: 'FAMRD27', by: 'Alex', bestaetigt: true });
  wahr('vor dem gespeicherten Zeitpunkt: keine Anfrage an Asana, Hinweis mit Uhrzeit', A.aufrufe.length === 0 && r2.body.weiter === true && /frühestens/.test(r2.body.unterbrochen || ''), JSON.stringify([A.aufrufe.length, r2.body.unterbrochen]));
  await q(`update komm_versandlauf set fortsetzen_ab = now() - interval '1 second' where schluessel = 'FAMRD27'`);
  const r3 = await ruf('komm_send', { festival: 'FAMRD27', by: 'Alex', bestaetigt: true });
  gleich('nach dem Zeitpunkt bearbeitet die Fortsetzung nur den Rest', [r3.body.weiter, r3.body.neu + r3.body.aktualisiert], [false, r.body.rest]);
}
{
  /* Aufräumen mit einer nicht löschbaren Aufgabe: Projekt bleibt, zweiter Aufruf räumt fertig auf. */
  await ruf('komm_send', { festival: 'LUSRD27', by: 'Alex', test: true });
  A.stoerung.push({ methode: 'DELETE', muster: /^\/tasks\/\d+$/, status: 500, text: 'Probe: Löschen scheitert' });
  const c1 = await ruf('komm_test_aufraeumen', { by: 'Alex' });
  const pt = [...A.projekte.values()].find(p => p.name === 'Kommunikation TEST' && !p.geloescht);
  wahr('eine Aufgabe nicht gelöscht: Projekt bleibt, Fehler gemeldet', c1.body.ok === false && !!pt && aufgabenIn(pt.gid).length === 1, JSON.stringify(c1.body));
  const c2 = await ruf('komm_test_aufraeumen', { by: 'Alex' });
  wahr('zweiter Aufruf räumt fertig auf', c2.body.ok === true && c2.body.aufgaben === 1 && pt!.geloescht === true, JSON.stringify(c2.body));
}

console.log('\n15. Nach Review 32c, Runde 2');
{
  /* Anlage mit verlorener Antwort: im selben Aufruf keine zweite Anlage (auch kein Nachsehen, das scheitern könnte). */
  const pl = [...A.projekte.values()].find(p => p.name === 'Kommunikation Lusatia 2027' && !p.archived)!;
  const eine = aufgabenIn(pl.gid).find(t => t.name.startsWith('Prüfpunkt'))!;
  eine.geloescht = true;
  await q(`update komm_veroeffentlichungen set asana_task_gid = null, gesendet_am = null where asana_task_gid = $1`, [eine.gid]);
  await q(`delete from komm_versandlauf where schluessel = 'LUSRD27'`);
  A.stoerung.push({ methode: 'POST', muster: /^\/tasks$/, netzNachher: true });
  const r1 = await ruf('komm_send', { festival: 'LUSRD27', by: 'Alex', bestaetigt: true });
  A.stoerung = [];
  const namen1 = aufgabenIn(pl.gid).map(t => t.name);
  wahr('unklare Anlage: Lauf unterbricht, keine Dublette', !!r1.body.unterbrochen && /unklar/.test(r1.body.unterbrochen) && namen1.length === new Set(namen1).size, JSON.stringify([r1.status, r1.body.unterbrochen, r1.body.error]));
  const r2 = await ruf('komm_send', { festival: 'LUSRD27', by: 'Alex', bestaetigt: true });
  const namen2 = aufgabenIn(pl.gid).map(t => t.name);
  wahr('nächster Aufruf findet die doch angelegte Aufgabe, schließt ab, keine Dublette', r2.body.abgeschlossen === true && namen2.length === new Set(namen2).size && namen2.length === r2.body.aufgaben, JSON.stringify([r2.body.neu, r2.body.aktualisiert, namen2.length, r2.body.aufgaben]));
}
{
  /* Sperre läuft während der Teamsuche vor der Projektanlage ab: kein zweites Projekt, Fortschritt des Nachfolgers bleibt. */
  await q(`delete from komm_versandlauf where schluessel = 'test:LUSRD27'`);
  let los: () => void = () => {};
  const warte = new Promise<void>(r => { los = r; });
  let einmal = true;
  A.haenger = (m, p) => (einmal && m === 'GET' && p.endsWith('/projects') ) ? (einmal = false, warte) : null;
  const a = ruf('komm_send', { festival: 'LUSRD27', by: 'Alex', test: true });
  await new Promise(r => setTimeout(r, 200));
  await q(`update komm_sperre set bis = now() - interval '1 second' where schluessel = 'festival:LUSRD27'`);
  A.haenger = null;
  const b = await ruf('komm_send', { festival: 'LUSRD27', by: 'Lea', test: true });
  los();
  const ra = await a;
  const testProjekte = [...A.projekte.values()].filter(p => p.name === 'Kommunikation TEST' && !p.geloescht);
  const lauf = (await q(`select abgeschlossen, cardinality(erledigt) n from komm_versandlauf where schluessel = 'test:LUSRD27'`))[0];
  wahr('abgelöster Lauf legt kein zweites Projekt an und lässt den Fortschritt des Nachfolgers stehen', testProjekte.length === 1 && ra.status === 409 && b.body.abgeschlossen === true && lauf.abgeschlossen === true && lauf.n === b.body.aufgaben, JSON.stringify([testProjekte.length, ra.status, lauf]));
  await ruf('komm_test_aufraeumen', { by: 'Alex' });
}
{
  /* Projektwechsel mitten in einem Lauf: der neue Lauf prüft alle Aufgaben gegen das neue Projekt. */
  await q(`delete from komm_versandlauf where schluessel = 'WMRD27'`);
  Deno.env.set('KOMM_SEND_BUDGET_MS', '0');
  const t1 = await ruf('komm_send', { festival: 'WMRD27', by: 'Alex', bestaetigt: true });
  Deno.env.delete('KOMM_SEND_BUDGET_MS');
  const alt = [...A.projekte.values()].find(p => p.gid === t1.body.projekt)!;
  alt.archived = true;
  const t2 = await ruf('komm_send', { festival: 'WMRD27', by: 'Alex', bestaetigt: true });
  const neuP = [...A.projekte.values()].find(p => p.name === alt.name && !p.archived)!;
  gleich('nach Archivieren mitten im Lauf: vollständig im neuen Projekt', [t1.body.weiter, t2.body.abgeschlossen, aufgabenIn(neuP.gid).length], [true, true, t2.body.aufgaben]);
}
{
  /* Kennung nicht gespeichert: die Aufgabe gilt nicht als erledigt und wird beim nächsten Aufruf nachgeholt. */
  await q(`delete from komm_versandlauf where schluessel = 'BYNRD27'`);
  await q(`update komm_veroeffentlichungen set asana_task_gid = null, gesendet_am = null where festival_short = 'BYNRD27' and regel_id = 'SLOT'`);
  RPC_STOERUNG.add('hh_komm_gesendet');
  const s1 = await ruf('komm_send', { festival: 'BYNRD27', by: 'Alex', bestaetigt: true });
  wahr('ein Speicherfehler: Lauf nicht abgeschlossen, Fehler gemeldet', s1.body.abgeschlossen === false && s1.body.weiter === true && s1.body.fehler.some((x: string) => /nicht merken/.test(x)), JSON.stringify([s1.body.abgeschlossen, s1.body.rest, s1.body.fehler.slice(0, 2)]));
  const s2 = await ruf('komm_send', { festival: 'BYNRD27', by: 'Alex', bestaetigt: true });
  const ohne = (await q(`select count(*)::int n from komm_veroeffentlichungen where festival_short = 'BYNRD27' and t >= '2026-10-07' and asana_task_gid is null`))[0].n;
  gleich('Fortsetzung holt die Kennung nach: alle Veröffentlichungen gemerkt, Lauf abgeschlossen', [s2.body.abgeschlossen, ohne], [true, 0]);
}

console.log('\n16. Nach Review 32c, Runde 3');
{
  /* Unklare Anlage, die beim nächsten Lesen noch nicht sichtbar ist: keine zweite Anlage, als ungeklärt gemeldet. */
  const pl = [...A.projekte.values()].find(p => p.name === 'Kommunikation Lusatia 2027' && !p.archived)!;
  const eine = aufgabenIn(pl.gid).find(t => t.name.startsWith('Prüfpunkt 2'))!;
  eine.geloescht = true;
  await q(`update komm_veroeffentlichungen set asana_task_gid = null, gesendet_am = null where asana_task_gid = $1`, [eine.gid]);
  await q(`delete from komm_versandlauf where schluessel = 'LUSRD27'`);
  let neueGidVorher = A.n;
  A.stoerung.push({ methode: 'POST', muster: /^\/tasks$/, netzNachher: true });
  const u1 = await ruf('komm_send', { festival: 'LUSRD27', by: 'Alex', bestaetigt: true });
  A.stoerung = [];
  const angelegt = [...A.aufgaben.values()].find(t => Number(t.gid) > neueGidVorher && t.name === eine.name)!;
  angelegt.unsichtbar = 1;   // beim nächsten Lesen der Projektliste noch nicht sichtbar
  const u2 = await ruf('komm_send', { festival: 'LUSRD27', by: 'Alex', bestaetigt: true });
  const gleichnamig = aufgabenIn(pl.gid).filter(t => t.name === eine.name).length;
  wahr('verzögerte Sichtbarkeit: keine zweite Anlage, „ungeklärt“ gemeldet, nicht abgeschlossen', gleichnamig === 1 && u2.body.abgeschlossen === false && u2.body.fehler.some((x: string) => /ungeklärt/.test(x)), JSON.stringify([gleichnamig, u2.body.abgeschlossen, u2.body.fehler]));
  const u3 = await ruf('komm_send', { festival: 'LUSRD27', by: 'Alex', bestaetigt: true });
  wahr('sobald sichtbar: übernommen, abgeschlossen, weiterhin genau eine', u3.body.abgeschlossen === true && aufgabenIn(pl.gid).filter(t => t.name === eine.name).length === 1, JSON.stringify([u1.body.unterbrochen, u3.body.abgeschlossen, u3.body.fehler]));
}
{
  /* Abschnitt lässt sich nicht anlegen: Aufgaben dieses Monats warten, beim nächsten Senden kommen sie in den Abschnitt. */
  const alt = [...A.projekte.values()].find(p => p.name === 'Kommunikation Fluidity 2027' && !p.archived)!;
  alt.archived = true;
  await q(`update komm_veroeffentlichungen set asana_task_gid = null, gesendet_am = null where festival_short = 'FLRD27'`);
  for (const t of [...A.aufgaben.values()]) if (t.mitglied.some((x: any) => x.project === alt.gid)) t.geloescht = true;
  A.stoerung.push({ methode: 'POST', muster: /^\/projects\/\d+\/sections$/, status: 503, text: 'Probe: Abschnitt nicht angelegt' });
  const a1 = await ruf('komm_send', { festival: 'FLRD27', by: 'Alex', bestaetigt: true });
  const pn = [...A.projekte.values()].find(p => p.name === alt.name && !p.archived)!;
  const ohneAbschnitt = aufgabenIn(pn.gid).filter(t => t.mitglied.some((x: any) => x.project === pn.gid && !x.section)).length;
  wahr('fehlender Abschnitt: keine Aufgabe ohne Abschnitt, weiter, gemeldet', ohneAbschnitt === 0 && a1.body.weiter === true && a1.body.fehler.some((x: string) => /Abschnitt fehlt/.test(x)), JSON.stringify([ohneAbschnitt, a1.body.weiter, a1.body.fehler.slice(0, 2)]));
  const a2 = await ruf('komm_send', { festival: 'FLRD27', by: 'Alex', bestaetigt: true });
  const ohne2 = aufgabenIn(pn.gid).filter(t => t.mitglied.some((x: any) => x.project === pn.gid && !x.section)).length;
  gleich('nächstes Senden: alle Aufgaben im Projekt, alle in einem Monatsabschnitt', [a2.body.abgeschlossen, aufgabenIn(pn.gid).length, ohne2], [true, a2.body.aufgaben, 0]);
}
{
  /* Eigentum: abgelehntes owner beim Anlegen und gescheiterte Übertragung, beim nächsten Senden nachgeholt. */
  const alt = [...A.projekte.values()].find(p => p.name === 'Kommunikation Wilde Möhre 2027' && !p.archived)!;
  alt.archived = true;
  A.stoerung.push({ methode: 'POST', muster: /^\/projects$/, status: 400, text: 'owner: Not a recognized ID' });
  A.stoerung.push({ methode: 'PUT', muster: /^\/projects\/\d+$/, status: 500, text: 'Probe: Eigentum nicht übertragen' });
  A.stoerung.push({ methode: 'PUT', muster: /^\/projects\/\d+$/, status: 500, text: 'Probe: Eigentum nicht übertragen' });
  const o1 = await ruf('komm_send', { festival: 'WMRD27', by: 'Alex', bestaetigt: true });
  A.stoerung = [];
  const pn = [...A.projekte.values()].find(p => p.name === alt.name && !p.archived)!;
  wahr('Eigentum offen: nicht abgeschlossen, gemeldet', !pn.owner && o1.body.abgeschlossen === false && o1.body.fehler.some((x: string) => /Eigentum/.test(x)), JSON.stringify([pn.owner, o1.body.abgeschlossen, o1.body.fehler.slice(0, 3)]));
  const o2 = await ruf('komm_send', { festival: 'WMRD27', by: 'Alex', bestaetigt: true });
  gleich('nächstes Senden holt das Eigentum nach und schließt ab', [pn.owner, o2.body.abgeschlossen], ['U-CHR', true]);
  pn.owner = 'U-ANNIE';
  await ruf('komm_send', { festival: 'WMRD27', by: 'Alex', bestaetigt: true });
  gleich('ein gesetztes Eigentum bleibt, wer es auch hält', pn.owner, 'U-ANNIE');
}
{
  /* Ratenlimit im Vorlauf: Zeitpunkt gespeichert, nächster Aufruf ohne Anfrage an Asana. */
  await q(`delete from komm_versandlauf where schluessel = 'BYNRD27'`);
  A.stoerung.push({ methode: 'GET', muster: /^\/projects\/\d+\/sections$/, status: 429, text: 'rate limit', retryAfter: 120 });
  const r1 = await ruf('komm_send', { festival: 'BYNRD27', by: 'Alex', bestaetigt: true });
  A.aufrufe = [];
  const r2 = await ruf('komm_send', { festival: 'BYNRD27', by: 'Alex', bestaetigt: true });
  const lauf = (await q(`select fortsetzen_ab from komm_versandlauf where schluessel = 'BYNRD27'`))[0];
  wahr('429 im Vorlauf: weiter mit Zeitpunkt, gespeichert, Folgeaufruf ohne Asana', r1.status === 200 && r1.body.weiter === true && !!r1.body.fortsetzen_ab && !!lauf?.fortsetzen_ab && A.aufrufe.length === 0, JSON.stringify([r1.status, r1.body.fortsetzen_ab, lauf, A.aufrufe.length]));
  await q(`update komm_versandlauf set fortsetzen_ab = null where schluessel = 'BYNRD27'`);
}

console.log('\n12. Redaktionstabelle');
const t0 = await ruf('komm_tabelle_sync', { festival: 'alle', by: 'Alex' });
wahr('ohne Dienstkonto: nicht konfiguriert, Vorschau, nichts geschrieben', t0.body.konfiguriert === false && t0.body.zellen > 50 && S.schreibe.length === 0);
const schluessel = await crypto.subtle.generateKey({ name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['sign', 'verify']);
const pkcs8 = new Uint8Array(await crypto.subtle.exportKey('pkcs8', (schluessel as CryptoKeyPair).privateKey));
const pem = '-----BEGIN PRIVATE KEY-----\n' + btoa(String.fromCharCode(...pkcs8)).replace(/(.{64})/g, '$1\n') + '\n-----END PRIVATE KEY-----\n';
Deno.env.set('GOOGLE_DIENSTKONTO_JSON', JSON.stringify({ client_email: 'hohes-haus@probe.iam.gserviceaccount.com', private_key: pem }));
/* Ohne Schreibfreigabe nur Trockenlauf, auch mit Dienstkonto (Review 32d, Runde 3, Befund 1). */
const ohneFreigabe = await ruf('komm_tabelle_sync', { festival: 'alle', by: 'Alex' });
wahr('mit Dienstkonto, ohne KOMM_TABELLE_SCHREIBEN: nichts geschrieben, ok false', S.schreibe.length === 0 && ohneFreigabe.body.schreibfreigabe === false && ohneFreigabe.body.ok === false && /Schreiben gesperrt/.test(ohneFreigabe.body.ergebnis), JSON.stringify([S.schreibe.length, ohneFreigabe.body.ergebnis]));
Deno.env.set('KOMM_TABELLE_SCHREIBEN', 'ja');
/* Fremde Inhalte: Christians Eintrag am 15.10.2026 (Lusatia VVK) und eine fremde Formel mit leerem Ergebnis am 15.06.2027. */
const spalteVon = (iso: string) => 5 + Math.round((Date.parse(iso) - Date.parse('2026-10-01')) / 86400000);
zelle6(spalteVon('2026-10-15'), { stringValue: 'Takeover Christian' });
zelle6(spalteVon('2027-06-15'), { formulaValue: '=""' });
const tr = await ruf('komm_tabelle_sync', { festival: 'alle', by: 'Alex', trocken: true });
wahr('Trockenlauf schreibt nichts, auch F5 nicht', tr.body.ergebnis === 'Trockenlauf' && S.schreibe.length === 0 && S.f5 === '=DATE($B$2,1,1)', JSON.stringify(tr.body).slice(0, 300));
const ts = await ruf('komm_tabelle_sync', { festival: 'alle', by: 'Alex' });
gleich('F5 auf =DATE(2026,10,1) gesetzt', S.f5, '=DATE(2026,10,1)');
wahr('geschrieben nur in Zeile 6 und F5', S.schreibe.every(w => w.zeile === 6 || (w.zeile === 5 && w.spalte === 5)) && S.schreibe.filter(w => w.zeile === 5).length === 1);
wahr('Feldmasken nur Wert und Hinweis (keine Auswahllisten, keine Formate)', S.schreibe.every(w => w.felder === 'userEnteredValue,note' || (w.zeile === 5 && w.felder === 'userEnteredValue')));
gleich('fremde Zellen nicht überschrieben, gemeldet', [S.zeile6.get(spalteVon('2026-10-15')).userEnteredValue.stringValue, S.zeile6.get(spalteVon('2027-06-15')).userEnteredValue.formulaValue, ts.body.fremd.map((x: any) => x.datum)], ['Takeover Christian', '=""', ['2026-10-15', '2027-06-15']]);
const lus = S.zeile6.get(spalteVon('2027-07-23'));
wahr('Lusatia öffnet am 23.07.2027: Text und Kennung im Hinweis', lus?.userEnteredValue?.stringValue === 'LUS F' && /^komm:fix-2027-07-23/.test(lus.note));
wahr('Spalten reichen bis über den 31.12.2027', ts.body.reicht_bis_2027 === true);
const n1 = S.schreibe.length;
const ts2 = await ruf('komm_tabelle_sync', { festival: 'alle', by: 'Alex' });
gleich('zweiter Lauf schreibt nichts (idempotent)', [S.schreibe.length - n1, ts2.body.geplant], [0, 0]);
/* Christian ändert eine unserer Zellen: sie gilt danach als fremd. */
S.zeile6.get(spalteVon('2027-07-23')).userEnteredValue = { stringValue: 'LUS F (Aufbau ab 15.07.)' };
const ts3 = await ruf('komm_tabelle_sync', { festival: 'alle', by: 'Alex' });
wahr('von Hand geänderte eigene Zelle bleibt und wird gemeldet', S.zeile6.get(spalteVon('2027-07-23')).userEnteredValue.stringValue === 'LUS F (Aufbau ab 15.07.)' && ts3.body.fremd.some((x: any) => x.datum === '2027-07-23'));
/* Ein Termin entfällt: Lusatia verschiebt F um eine Woche; die alte Zelle wird geleert, die neue gesetzt. */
FESTE[0].starts_on = '2027-07-30'; FESTE[0].ends_on = '2027-08-01';
S.zeile6.get(spalteVon('2027-07-23')).userEnteredValue = { stringValue: 'LUS F' };
await ruf('komm_tabelle_sync', { festival: 'alle', by: 'Alex' });
wahr('verschobener Termin: alte eigene Zelle geleert, neuer Tag gesetzt', !S.zeile6.get(spalteVon('2027-07-23'))?.userEnteredValue && /LUS F/.test(S.zeile6.get(spalteVon('2027-07-30'))?.userEnteredValue?.stringValue || ''));
FESTE[0].starts_on = '2027-07-23'; FESTE[0].ends_on = '2027-07-25';
const sperrTest = await Promise.all([ruf('komm_tabelle_sync', { festival: 'alle', by: 'Alex' }), ruf('komm_tabelle_sync', { festival: 'alle', by: 'Lea' })]);
gleich('zwei gleichzeitige Abgleiche: einer 409', sperrTest.map(r => r.status).sort(), [200, 409]);


console.log('\n14. Tabelle und Hinweise nach den Reviews 32d und 32e');
{
  /* Eigene Kennung ohne Inhaltszeile: Konflikt, nicht überschreiben. */
  zelle6(spalteVon('2027-08-06'), { formulaValue: '=A1' }, 'komm:fix-2027-08-06');
  const r1 = await ruf('komm_tabelle_sync', { festival: 'alle', by: 'Alex' });
  wahr('unvollständiger eigener Hinweis: Zelle bleibt, als fremd gemeldet', S.zeile6.get(spalteVon('2027-08-06')).userEnteredValue.formulaValue === '=A1' && r1.body.fremd.some((x: any) => x.datum === '2027-08-06'));
  /* Änderung zwischen Lesen und Schreiben: frisch gelesen, Zelle nicht überschrieben. */
  zelle6(spalteVon('2027-08-06'), undefined, undefined);
  const zielSpalte = spalteVon('2027-08-06'), start = S.gelesen;
  S.nachLesen = (n) => { if (n === start + 2) zelle6(zielSpalte, { stringValue: 'Christian tippt gerade' }); };
  const r2 = await ruf('komm_tabelle_sync', { festival: 'alle', by: 'Alex' });
  S.nachLesen = null;
  wahr('Änderung während des Abgleichs: nicht überschrieben, gemeldet', S.zeile6.get(zielSpalte).userEnteredValue.stringValue === 'Christian tippt gerade' && r2.body.fremd.some((x: any) => x.datum === '2027-08-06' && x.grund), JSON.stringify(r2.body.fremd.slice(-2)));
  /* Laufender Abgleich hält die Sperre: ein zweiter liest gar nicht erst. */
  await q(`select public.hh_komm_sperre('tabelle', 60, 'fremd')`);
  const vorher = S.gelesen;
  const r3 = await ruf('komm_tabelle_sync', { festival: 'alle', by: 'Lea' });
  await q(`select public.hh_komm_frei('tabelle', 'fremd')`);
  gleich('gesperrt: 409 ohne Lesen der Tabelle', [r3.status, S.gelesen - vorher], [409, 0]);
  /* F5 nur einmal: nach Rückstellung durch die Redaktion bleibt es und steht als Konflikt im Bericht. */
  S.f5 = '=DATE($B$2,1,1)';
  const r4 = await ruf('komm_tabelle_sync', { festival: 'alle', by: 'Alex' });
  wahr('zurückgestelltes F5 bleibt, Konflikt gemeldet', S.f5 === '=DATE($B$2,1,1)' && r4.body.konflikt.length === 1 && r4.body.ok === false, JSON.stringify(r4.body.konflikt));
  S.f5 = '=DATE(2026,10,1)';
  /* Vergangene Prüfpunkte bleiben: Lauf nach dem Prüfpunkt am 08.06.2027. */
  HEUTE = '2027-06-09';
  await ruf('komm_tabelle_sync', { festival: 'alle', by: 'Alex' });
  HEUTE = '2026-10-07';
  wahr('Prüfpunkt Lusatia am 08.06.2027 steht nach dem Tag weiter in der Tabelle', (S.zeile6.get(spalteVon('2027-06-08'))?.userEnteredValue?.stringValue || '').includes('LUS Prüfpunkt'));
}
{
  /* Hinweise: fehlgeschlagene Zustellung wird wiederholt, gleichzeitige Ticks schicken nicht doppelt. */
  const k = (await q(`select id, t, asana_task_gid from komm_veroeffentlichungen where partnerfaehig and festival_short = 'LUSRD27' and t > '2026-12-01' and asana_task_gid is not null order by t limit 1`))[0];
  await q(`update komm_veroeffentlichungen set partner_uebernommen_am = now(), partner_name = 'Kollektiv', abgabe_am = now(), freigabe_status = 'offen' where id = $1`, [k.id]);
  HEUTE = isoPlus(k.t, -2);
  A.stoerung.push({ methode: 'POST', muster: /\/stories$/, status: 503, text: 'Probe: Asana nicht erreichbar' });
  const vorher = A.stories.filter(x => x.task === k.asana_task_gid).length;
  await K.tick();
  gleich('Zustellung gescheitert: kein Kommentar, als offen protokolliert', [A.stories.filter(x => x.task === k.asana_task_gid).length - vorher, (await q(`select count(*)::int n from komm_log where what = 'komm_hinweis_offen' and detail->>'id' = $1`, [k.id]))[0].n], [0, 1]);
  A.verzoegerung = 30;
  await Promise.all([K.tick(), K.tick()]);
  A.verzoegerung = 0;
  gleich('nächste Ticks, gleichzeitig: genau ein Kommentar', A.stories.filter(x => x.task === k.asana_task_gid).length - vorher, 1);
  await K.tick();
  gleich('danach kein weiterer Kommentar', A.stories.filter(x => x.task === k.asana_task_gid).length - vorher, 1);
  HEUTE = '2026-10-07';
}
{
  /* Vertraulichkeit der Slot-Details: Freigabename, Freigabenotiz und E-Mail des Partners gehen nicht hinaus. */
  const z = (await q(`select id from komm_veroeffentlichungen where partnerfaehig and t > '2027-03-01' limit 1`))[0];
  await q(`update komm_veroeffentlichungen set partner_email = 'kollektiv@example.org', partner_name = 'Kollektiv', freigabe_von = 'Christian Linck', freigabe_notiz = 'interne Notiz' where id = $1`, [z.id]);
  const d = await ruf('komm_slot_details', { id: z.id });
  const text = JSON.stringify(d.body);
  wahr('Details ohne E-Mail, Freigabename und Freigabenotiz', d.status === 200 && !text.includes('@') && !text.includes('Christian Linck') && !text.includes('interne Notiz'));
}


console.log('\n17. Nach Review 32d und 32e, Runde 2');
{
  /* Datumszeile ändert sich vor der letzten Prüfung: nichts geschrieben, Konflikt. */
  FESTE[2].starts_on = '2027-08-13'; FESTE[2].ends_on = '2027-08-15';   // by nature verschiebt sich, damit es etwas zu schreiben gibt
  const vorher = S.schreibe.length, start = S.gelesen;
  S.nachLesen = (n) => { if (n === start + 2) S.f5 = '=DATE(2026,10,2)'; };
  const d1 = await ruf('komm_tabelle_sync', { festival: 'alle', by: 'Alex' });
  S.nachLesen = null; S.f5 = '=DATE(2026,10,1)';
  wahr('Datumszeile geändert: nichts geschrieben, Konflikt, ok false', S.schreibe.length === vorher && d1.body.ok === false && d1.body.konflikt.some((x: string) => /Datumszeile/.test(x)), JSON.stringify([S.schreibe.length - vorher, d1.body.konflikt]));
  /* Sperre läuft vor dem Schreiben ab: 409, nichts geschrieben. */
  const v2 = S.schreibe.length, st2 = S.gelesen;
  S.nachLesen = (n) => { if (n === st2 + 2) q(`update komm_sperre set bis = now() - interval '1 second' where schluessel = 'tabelle'`); };
  const d2 = await ruf('komm_tabelle_sync', { festival: 'alle', by: 'Alex' });
  S.nachLesen = null;
  gleich('Sperre vor dem Schreiben verloren: 409, nichts geschrieben', [d2.status, S.schreibe.length - v2], [409, 0]);
  /* Einzellauf by nature räumt den alten Tag mit. */
  const d3 = await ruf('komm_tabelle_sync', { festival: 'BYNRD27', by: 'Alex' });
  const altTag = S.zeile6.get(spalteVon('2027-08-06'))?.userEnteredValue?.stringValue || '';
  const neuTag = S.zeile6.get(spalteVon('2027-08-13'))?.userEnteredValue?.stringValue || '';
  wahr('Einzellauf: neuer Tag mit BN F, alter Tag ohne BN F', /BN F/.test(neuTag) && !/BN F/.test(altTag), JSON.stringify([altTag, neuTag, d3.body.ergebnis]));
  FESTE[2].starts_on = '2027-08-06'; FESTE[2].ends_on = '2027-08-08';
  await ruf('komm_tabelle_sync', { festival: 'alle', by: 'Alex' });
  /* Fremde Zelle verhindert einen Termin: ok false, ausgelassen gezählt. */
  zelle6(spalteVon('2027-07-25'), { stringValue: 'Christian: Abbau-Story' });
  const d4 = await ruf('komm_tabelle_sync', { festival: 'alle', by: 'Alex' });
  wahr('fremde Zelle: unvollständig, ok false, ausgelassen > 0', d4.body.ok === false && d4.body.ausgelassen > 0 && /unvollständig/.test(d4.body.ergebnis), JSON.stringify([d4.body.ok, d4.body.ausgelassen, d4.body.ergebnis]));
  wahr('Termine vor dem Kalenderbeginn zählen nicht als unvollständig', d4.body.vor_beginn >= 1 && d4.body.ausserhalb.length === 0, JSON.stringify([d4.body.vor_beginn, d4.body.ausserhalb.length]));
}
{
  /* F5: Reservierung vor dem Schreiben; scheitert das Schreiben, gibt es keinen zweiten Versuch. */
  await q(`delete from komm_log where what = 'komm_tabelle_f5'`);
  S.f5 = '=DATE($B$2,1,1)';
  S.postFehler = true;
  const f1 = await ruf('komm_tabelle_sync', { festival: 'alle', by: 'Alex' }).catch(e => ({ status: 500, body: { error: String(e) } }));
  const res = (await q(`select detail->>'stand' st from komm_log where what = 'komm_tabelle_f5' order by id`)).map(r => r.st);
  const v5 = S.schreibe.length;
  const f2 = await ruf('komm_tabelle_sync', { festival: 'alle', by: 'Alex' });
  wahr('F5 reserviert, Schreiben gescheitert, kein zweiter Versuch, Konflikt', res[0] === 'reserviert' && S.f5 === '=DATE($B$2,1,1)' && !S.schreibe.slice(v5).some(w => w.zeile === 5) && f2.body.konflikt.length > 0, JSON.stringify([f1.status, res, S.f5, f2.body.konflikt]));
  S.f5 = '=DATE(2026,10,1)';
}
{
  /* Hinweis mit verlorener Antwort: der nächste Tick findet die Marke und sendet nicht noch einmal. */
  const k = (await q(`select id, t, asana_task_gid from komm_veroeffentlichungen where partnerfaehig and festival_short = 'FLRD27' and t > '2026-12-01' and asana_task_gid is not null order by t limit 1`))[0];
  await q(`update komm_veroeffentlichungen set partner_uebernommen_am = now(), partner_name = 'Kollektiv', abgabe_am = now(), freigabe_status = 'offen' where id = $1`, [k.id]);
  HEUTE = isoPlus(k.t, -2);
  const vorher = A.stories.filter(x => x.task === k.asana_task_gid).length;
  A.stoerung.push({ methode: 'POST', muster: /\/stories$/, netzNachher: true });
  await K.tick();
  A.stoerung = [];
  const nach1 = A.stories.filter(x => x.task === k.asana_task_gid).length - vorher;
  await K.tick();
  const nach2 = A.stories.filter(x => x.task === k.asana_task_gid).length - vorher;
  gleich('verlorene Antwort: genau ein Kommentar nach zwei Ticks, mit Marke', [nach1, nach2, A.stories.filter(x => x.task === k.asana_task_gid).every(x => !x.text.startsWith('Hinweis') || x.text.includes(`[komm:hinweis:${k.id}]`))], [1, 1, true]);
  HEUTE = '2026-10-07';
}

{
  /* Unbekanntes F5: Konflikt, ok false (Runde 3, Befund 2). */
  S.f5 = '=DATE(2027,1,1)';
  const u = await ruf('komm_tabelle_sync', { festival: 'alle', by: 'Alex' });
  wahr('unbekanntes F5: Konflikt, ok false', u.body.ok === false && u.body.konflikt.some((x: string) => /weder die alte|schon einmal umgestellt/.test(x)), JSON.stringify(u.body.konflikt));
  S.f5 = '=DATE(2026,10,1)';
  await ruf('komm_tabelle_sync', { festival: 'alle', by: 'Alex' });
  /* Verhinderte Bereinigung: Christian ergänzt eine eigene Zelle, der Termin entfällt danach (Runde 3, Befund 3). */
  const sp = spalteVon('2027-08-08'); const z = S.zeile6.get(sp);
  z.userEnteredValue = { stringValue: (z.userEnteredValue?.stringValue || '') + ' · Christian ergänzt' };
  FESTE[2].starts_on = '2027-08-13'; FESTE[2].ends_on = '2027-08-15';
  const b = await ruf('komm_tabelle_sync', { festival: 'BYNRD27', by: 'Alex' });
  FESTE[2].starts_on = '2027-08-06'; FESTE[2].ends_on = '2027-08-08';
  wahr('verhinderte Bereinigung gemeldet, Ergänzung bleibt, ok false', b.body.ok === false && b.body.fremd.some((x: any) => x.datum === '2027-08-08') && /Christian ergänzt/.test(S.zeile6.get(sp).userEnteredValue.stringValue), JSON.stringify([b.body.ok, b.body.fremd.map((x: any) => x.datum)]));
}

console.log(`\n${ok} ok, ${fehler} Fehler`);
Deno.exit(fehler ? 1 : 0);
