/* Das Hohe Haus · Edge Function „saison“ (24.09.2026)
   Jahresrad der Festivalsaison: Zeilen (Kreislauf, Metaphasen, Departments, Festivals, Stränge) und Elemente.
   Eigene kleine Funktion statt weiterer Aktionen in „gfweekly“ (die ist zu groß für den Deploy aus Cowork).
   Auth wie gfweekly: Passwort im Body oder im Header x-gfweekly-key, geprüft gegen das Secret GFWEEKLY_PASSWORD.
   Schreibt nur in gfweekly_saison_rows, gfweekly_saison_items, gfweekly_saison_log. */
import { createClient } from 'jsr:@supabase/supabase-js@2';

const VERSION = 1;
const PASSWORD = Deno.env.get('GFWEEKLY_PASSWORD') ?? '';
const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-gfweekly-key',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } });

const CATS = ['nach', 'sys', 'plan', 'prod', 'fest', 'sales', 'koll', 'prog'];
const FORMS = ['band', 'light', 'thin', 'dot'];
const ANCHORS = ['fest', 'vvk', 'festival', 'festival_ende'];
const STATUS = ['vorschlag', 'abgestimmt', 'strittig'];
const KINDS = ['kreislauf', 'meta', 'department', 'festival', 'strang'];
const ISO = /^\d{4}-\d{2}-\d{2}$/;

const str = (v: unknown, n = 2000) => (v ?? '').toString().slice(0, n);
const opt = (v: unknown, n = 4000) => { const s = str(v, n).trim(); return s ? s : null; };
const who = (v: unknown) => { const s = str(v, 60).toLowerCase(); return s.includes('lea') ? 'Lea' : s.includes('alex') ? 'Alex' : (str(v, 60) || 'unbekannt'); };
const day = (s: string) => Date.UTC(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10)) / 864e5;
const iso = (d: number) => new Date(d * 864e5).toISOString().slice(0, 10);
const dateOrNull = (v: unknown) => { const s = str(v, 10); return ISO.test(s) ? s : null; };

function anchorDate(row: any, a: string): string | null {
  if (a === 'vvk') return row?.vvk_start ?? null;
  if (a === 'festival') return row?.festival_start ?? null;
  if (a === 'festival_ende') return row?.festival_end ?? null;
  return null;
}
async function log(w: string, what: string, item_id: string | null, row_id: string | null, detail: unknown) {
  await db.from('gfweekly_saison_log').insert({ who: w, what, item_id, row_id, detail });
}
async function getRow(id: string) {
  const { data } = await db.from('gfweekly_saison_rows').select('*').eq('id', id).maybeSingle();
  return data;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method' }, 405);
  let body: any; try { body = await req.json(); } catch { return json({ error: 'bad json' }, 400); }
  const given = str(body?.password, 200) || str(req.headers.get('x-gfweekly-key'), 200);
  if (!PASSWORD || given !== PASSWORD) return json({ error: 'unauthorized' }, 401);
  const action = str(body?.action, 40);
  const t = body?.payload ?? {};
  const W = who(t.who);

  try {
    if (action === 'ping') return json({ ok: true, version: VERSION });

    if (action === 'get') {
      const [r, i] = await Promise.all([
        db.from('gfweekly_saison_rows').select('*').eq('archived', false).order('sort'),
        db.from('gfweekly_saison_items').select('*').eq('archived', false).order('sort'),
      ]);
      if (r.error) throw r.error; if (i.error) throw i.error;
      return json({ rows: r.data, items: i.data, version: VERSION });
    }

    if (action === 'item_save') {
      const rowId = str(t.row_id, 40);
      const row = await getRow(rowId);
      if (!row) return json({ error: 'Zeile nicht gefunden' }, 400);
      const s = dateOrNull(t.starts_on), e = dateOrNull(t.ends_on) ?? s;
      if (!s || !e) return json({ error: 'Datum fehlt' }, 400);
      if (day(e) < day(s)) return json({ error: 'Ende liegt vor dem Anfang' }, 400);
      const aS = ANCHORS.includes(t.anchor_start) ? t.anchor_start : 'fest';
      const aE = ANCHORS.includes(t.anchor_end) ? t.anchor_end : 'fest';
      const dS = anchorDate(row, aS), dE = anchorDate(row, aE);
      const rec: Record<string, unknown> = {
        row_id: rowId,
        title: str(t.title, 200).trim() || 'Ohne Titel',
        starts_on: s, ends_on: e,
        cat: CATS.includes(t.cat) ? t.cat : 'plan',
        form: FORMS.includes(t.form) ? t.form : 'band',
        anchor_start: dS ? aS : 'fest', off_start: dS ? day(s) - day(dS) : null,
        anchor_end: dE ? aE : 'fest', off_end: dE ? day(e) - day(dE) : null,
        body: opt(t.body),
        status: STATUS.includes(t.status) ? t.status : 'vorschlag',
        note_alex: opt(t.note_alex), note_lea: opt(t.note_lea),
        updated_by: W, updated_at: new Date().toISOString(),
      };
      if (Number.isFinite(+t.sort)) rec.sort = +t.sort;
      let res;
      if (t.id) res = await db.from('gfweekly_saison_items').update(rec).eq('id', str(t.id, 40)).select().single();
      else res = await db.from('gfweekly_saison_items').insert(rec).select().single();
      if (res.error) throw res.error;
      await log(W, t.id ? 'item_update' : 'item_add', res.data.id, rowId, { title: rec.title, status: rec.status });
      return json({ item: res.data });
    }

    if (action === 'item_delete') {
      const id = str(t.id, 40);
      const { error } = await db.from('gfweekly_saison_items').update({ archived: true, updated_by: W, updated_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
      await log(W, 'item_delete', id, null, null);
      return json({ ok: true });
    }

    if (action === 'row_save') {
      const id = str(t.id, 40) || ('z' + Date.now().toString(36));
      const old = await getRow(id);
      const rec: Record<string, unknown> = {
        id,
        label: str(t.label, 120).trim() || 'Neue Zeile',
        level: [1, 2, 3].includes(+t.level) ? +t.level : 2,
        kind: KINDS.includes(t.kind) ? t.kind : 'department',
        festival_start: dateOrNull(t.festival_start), festival_end: dateOrNull(t.festival_end), vvk_start: dateOrNull(t.vvk_start),
        target: Number.isFinite(+t.target) && t.target !== '' && t.target !== null ? Math.round(+t.target) : null,
        note: opt(t.note, 1000),
        updated_by: W, updated_at: new Date().toISOString(),
      };
      if (Number.isFinite(+t.sort)) rec.sort = +t.sort; else if (!old) rec.sort = 1000;
      const { data, error } = await db.from('gfweekly_saison_rows').upsert(rec).select().single();
      if (error) throw error;
      /* Relative Elemente wandern mit, wenn sich VVK-Start oder Festivaltermin der Zeile ändert. */
      let moved = 0;
      if (old) {
        const { data: items } = await db.from('gfweekly_saison_items').select('*').eq('row_id', id).eq('archived', false);
        for (const it of items ?? []) {
          const dS = anchorDate(data, it.anchor_start), dE = anchorDate(data, it.anchor_end);
          const ns = dS && it.off_start !== null ? iso(day(dS) + it.off_start) : it.starts_on;
          const ne = dE && it.off_end !== null ? iso(day(dE) + it.off_end) : it.ends_on;
          if (ns !== it.starts_on || ne !== it.ends_on) {
            const fin = day(ne) < day(ns) ? ns : ne;
            await db.from('gfweekly_saison_items').update({ starts_on: ns, ends_on: fin, updated_by: W, updated_at: new Date().toISOString() }).eq('id', it.id);
            moved++;
          }
        }
      }
      await log(W, old ? 'row_update' : 'row_add', null, id, { label: rec.label, moved });
      return json({ row: data, moved });
    }

    if (action === 'row_delete') {
      const id = str(t.id, 40);
      const now = new Date().toISOString();
      await db.from('gfweekly_saison_items').update({ archived: true, updated_by: W, updated_at: now }).eq('row_id', id);
      const { error } = await db.from('gfweekly_saison_rows').update({ archived: true, updated_by: W, updated_at: now }).eq('id', id);
      if (error) throw error;
      await log(W, 'row_delete', null, id, null);
      return json({ ok: true });
    }

    if (action === 'log') {
      const { data, error } = await db.from('gfweekly_saison_log').select('*').order('at', { ascending: false }).limit(Math.min(200, +t.limit || 50));
      if (error) throw error;
      return json({ log: data });
    }

    return json({ error: 'unknown action' }, 400);
  } catch (err) {
    return json({ error: (err as any)?.message ?? String(err) }, 500);
  }
});
