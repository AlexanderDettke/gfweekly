/* Kompass · Verkauf 2027 je Festival (25.10.2026). Auftrag und Rechenregeln: docs/PAKET-VERKAUF-2027.md (Abschnitt 0, Stufe 1b).
   Tabellen hh_verkauf_ziel und hh_verkauf_stand (Migration 20261024223230_hh_verkauf). Zwei Aktionen:
   verkauf_list {saison=2027}: je aktivem Festival Ziel, letzter Stand, Vorwoche, Anteil, Tempo und nötiges Tempo, dazu die
     letzten fünf Stände; Summe und ältester Stand für die Kopfzeile.
   verkauf_set {festival_key, stichtag?, tickets, umsatz_euro?, notiz?, by}: Handeingabe (quelle hand), Upsert auf
     Festival, Saison, Stichtag und Quelle; antwortet mit derselben Liste wie verkauf_list.
   verkaufRechne ist rein (ohne Datenbank), damit pruefung/verkauf-probe.mjs die Regeln mit festen Daten prüfen kann. */
// deno-lint-ignore-file no-explicit-any
type Any = any;

export const VERKAUF_SAISON = 2027;
const QUELLE_RANG: Record<string, number> = { xceed_api: 3, xceed_mail: 2, hand: 1 };
const TAG = /^\d{4}-\d{2}-\d{2}$/;

/* Tage zwischen zwei Kalendertagen (JJJJ-MM-TT), in UTC gerechnet. */
function tage(von: string, bis: string): number {
  const t = (s: string) => Date.UTC(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10));
  return Math.round((t(bis) - t(von)) / 86400000);
}
function addTage(tag: string, n: number): string {
  const d = new Date(tag + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10);
}
export function gueltigerTag(x: unknown): boolean {
  if (typeof x !== 'string' || !TAG.test(x)) return false;
  const d = new Date(x + 'T00:00:00Z'); return !isNaN(d.getTime()) && d.toISOString().slice(0, 10) === x;
}
/* Jüngster Stichtag zuerst; bei gleichem Stichtag gewinnt xceed_api vor xceed_mail vor hand. */
function vorrang(a: Any, b: Any): number {
  if (a.stichtag !== b.stichtag) return a.stichtag < b.stichtag ? 1 : -1;
  return (QUELLE_RANG[b.quelle] || 0) - (QUELLE_RANG[a.quelle] || 0);
}
const r1 = (x: number) => Math.round(x * 10) / 10;
function standAus(s: Any) {
  return { stichtag: s.stichtag, tickets: s.tickets, umsatz_euro: s.umsatz_brutto_cents == null ? null : Number(s.umsatz_brutto_cents) / 100,
    quelle: s.quelle, notiz: s.notiz ?? null, by: s.by ?? '', updated_at: s.updated_at ?? null };
}

/* ziele: Zeilen aus hh_verkauf_ziel; staende: Zeilen aus hh_verkauf_stand derselben Saison; heute: JJJJ-MM-TT (Europe/Berlin). */
export function verkaufRechne(ziele: Any[], staende: Any[], heute: string) {
  const festivals = ziele.filter(z => z.aktiv !== false).sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0) || String(a.name).localeCompare(String(b.name)))
    .map(z => {
      const eigene = staende.filter(s => s.festival_key === z.festival_key).sort(vorrang);
      const letzter = eigene[0] || null;
      const vorwoche = letzter ? (eigene.find(s => { const d = tage(s.stichtag, letzter.stichtag); return d >= 7 && d <= 13; }) || null) : null;
      let tempo: number | null = null, noetig: number | null = null, plan = 'kein_stand';
      if (letzter) {
        const t = letzter.tickets;
        if (z.vvk_start && z.vvk_start <= letzter.stichtag) tempo = t / Math.max(1, tage(z.vvk_start, letzter.stichtag) / 7);
        const rest = z.ziel_tickets - t;
        const wochen = tage(letzter.stichtag, addTage(z.festival_von, -14)) / 7;
        if (rest <= 0) noetig = 0; else if (wochen > 0) noetig = rest / wochen;
        if (!z.vvk_start) plan = 'start_offen';
        else if (z.vvk_start > letzter.stichtag) plan = 'vvk_ab';
        else if (rest <= 0) plan = 'im_plan';
        else if (noetig === null) plan = 'unter_plan';
        else plan = (tempo as number) >= noetig ? 'im_plan' : 'unter_plan';
      } else if (!z.vvk_start) plan = 'start_offen';
      else if (z.vvk_start > heute) plan = 'vvk_ab';
      return {
        festival_key: z.festival_key, name: z.name, ziel: z.ziel_tickets, minimal: z.minimal_tickets ?? null,
        vvk_start: z.vvk_start ?? null, festival_von: z.festival_von, event_id: z.event_id ?? null,
        stand: letzter ? standAus(letzter) : null,
        vorwoche: vorwoche ? { stichtag: vorwoche.stichtag, tickets: vorwoche.tickets } : null,
        trend: letzter && vorwoche ? letzter.tickets - vorwoche.tickets : null,
        anteil: letzter ? r1(letzter.tickets / z.ziel_tickets * 100) : null,
        tempo: tempo === null ? null : r1(tempo), tempo_noetig: noetig === null ? null : r1(noetig), plan,
        alter_tage: letzter ? tage(letzter.stichtag, heute) : null,
        verlauf: eigene.slice(0, 5).map(standAus),
      };
    });
  const mitStand = festivals.filter(f => f.stand);
  return {
    heute, festivals,
    summe: { tickets: mitStand.reduce((n, f) => n + f.stand!.tickets, 0), ziel: festivals.reduce((n, f) => n + f.ziel, 0) },
    aeltester_tage: mitStand.length ? Math.max(...mitStand.map(f => f.alter_tage as number)) : null,
    ohne_stand: festivals.length - mitStand.length,
  };
}

export class VerkaufFehler extends Error { status: number; constructor(m: string, s = 400) { super(m); this.status = s; } }

/* Eingaben für verkauf_set prüfen; wirft VerkaufFehler (400). by: Alex oder Lea (whoNorm wie im Kompass). */
export function verkaufEingabe(t: Any, heute: string, whoNorm: (w: unknown) => string) {
  const key = (t?.festival_key ?? '').toString().trim();
  if (!/^[a-z0-9-]{2,40}$/.test(key)) throw new VerkaufFehler('festival_key fehlt');
  const saison = t?.saison === undefined || t?.saison === null || t?.saison === '' ? VERKAUF_SAISON : Number(t.saison);
  if (!Number.isInteger(saison) || saison < 2020 || saison > 2100) throw new VerkaufFehler('saison ist kein Jahr');
  const stichtag = t?.stichtag === undefined || t?.stichtag === null || t?.stichtag === '' ? heute : t.stichtag;
  if (!gueltigerTag(stichtag)) throw new VerkaufFehler('stichtag ist kein Datum (JJJJ-MM-TT)');
  if (stichtag > heute) throw new VerkaufFehler('stichtag liegt in der Zukunft');
  const tickets = typeof t?.tickets === 'string' && /^\d+$/.test(t.tickets.trim()) ? Number(t.tickets.trim()) : t?.tickets;
  if (!Number.isInteger(tickets) || tickets < 0 || tickets > 1000000) throw new VerkaufFehler('tickets: ganze Zahl ab 0');
  let cents: number | null = null;
  const u = t?.umsatz_euro;
  if (u !== undefined && u !== null && u !== '') {
    const n = typeof u === 'number' ? u : typeof u === 'string' && /^\d+([.,]\d{1,2})?$/.test(u.trim()) ? Number(u.trim().replace(',', '.')) : NaN;
    if (!Number.isFinite(n) || n < 0 || n > 100000000) throw new VerkaufFehler('umsatz_euro: Betrag ab 0');
    cents = Math.round(n * 100);
  }
  const notiz = (t?.notiz ?? '').toString().trim().slice(0, 500) || null;
  const roh = (t?.by ?? '').toString().trim();
  if (!roh) throw new VerkaufFehler('by fehlt (Alex oder Lea)');
  const by = whoNorm(roh);
  if (by !== 'Alex' && by !== 'Lea') throw new VerkaufFehler('by muss Alex oder Lea sein');
  return { festival_key: key, saison, stichtag, tickets, umsatz_brutto_cents: cents, notiz, by };
}

export function verkaufModul(ctx: { admin: Any, json: (b: unknown, s?: number) => Response, heuteBerlin: () => string, whoNorm: (w: unknown) => string }) {
  const { admin, json, heuteBerlin, whoNorm } = ctx;

  async function liste(saison: number) {
    const [z, s] = await Promise.all([
      admin.from('hh_verkauf_ziel').select('*').eq('saison', saison),
      admin.from('hh_verkauf_stand').select('festival_key,stichtag,tickets,umsatz_brutto_cents,quelle,notiz,by,updated_at').eq('saison', saison)
        .order('stichtag', { ascending: false }).limit(5000),
    ]);
    if (z.error) throw z.error; if (s.error) throw s.error;
    return { saison, ...verkaufRechne(z.data || [], s.data || [], heuteBerlin()) };
  }

  async function handle(action: string, t: Any): Promise<Response> {
    try {
      if (action === 'verkauf_list') {
        const saison = t?.saison === undefined || t?.saison === null || t?.saison === '' ? VERKAUF_SAISON : Number(t.saison);
        if (!Number.isInteger(saison) || saison < 2020 || saison > 2100) return json({ error: 'saison ist kein Jahr' }, 400);
        return json(await liste(saison));
      }
      if (action === 'verkauf_set') {
        const e = verkaufEingabe(t, heuteBerlin(), whoNorm);
        const { data: z, error: ze } = await admin.from('hh_verkauf_ziel').select('festival_key,aktiv').eq('festival_key', e.festival_key).eq('saison', e.saison).maybeSingle();
        if (ze) throw ze;
        if (!z || z.aktiv === false) return json({ error: 'Festival gibt es in dieser Saison nicht' }, 404);
        const { data, error } = await admin.from('hh_verkauf_stand').upsert({ ...e, quelle: 'hand', updated_at: new Date().toISOString() },
          { onConflict: 'festival_key,saison,stichtag,quelle' }).select('festival_key,stichtag,tickets,umsatz_brutto_cents,quelle,notiz,by,updated_at').single();
        if (error) throw error;
        return json({ gespeichert: standAus(data), ...(await liste(e.saison)) });
      }
      return json({ error: 'unknown action' }, 400);
    } catch (e) {
      if (e instanceof VerkaufFehler) return json({ error: e.message }, e.status);
      throw e;
    }
  }
  return { handle };
}
