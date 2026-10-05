/* Das Hohe Haus · Edge Function „organisation“ (V32, 05.10.2026)
   Seite site/organisation.html: acht Entscheidungen vor Stufe 1 (Wahl, Freigabe Alex und Lea, Begründung),
   Teamaufbau je Rolle (Schritt 0 bis 6, Leitung, Stellvertretung) und Tore der vier Aufbaustufen.
   Eigene kleine Funktion wie „saison“ und „besetzung“ (gfweekly ist zu groß für den Deploy aus Cowork).
   Auth wie gfweekly: Passwort im Body oder im Header x-gfweekly-key, geprüft gegen das Secret GFWEEKLY_PASSWORD.
   Schreibt nur in gfweekly_org_entscheidung, gfweekly_org_rolle, gfweekly_org_tor, gfweekly_org_log.
   Das Entscheidungslog (gfweekly_decisions, mit Habitat-Talern) schreibt die Seite über gfweekly/decision_add;
   hier wird nur die Kennung des Logeintrags an der Entscheidung vermerkt (log_verknuepfen, einmalig). */
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

/* Rollen und die Entscheidungen, an denen sie hängen. Gespiegelt aus site/organisation.html (dort gepflegt). */
const DEP: Record<string, number[]> = {
  gf: [1, 2], daten: [1], wm: [3, 5, 8], flu: [5, 8], lus: [5, 8], mal: [5, 8], byn: [5, 8],
  prod: [4], tech: [6], sich: [6], tick: [6], crew: [6], gastro: [6], verm: [6], prog: [6],
  kfm: [2], recht: [5, 8], beirat: [7], studio: [1],
};
const OPTS: Record<number, number> = { 1: 3, 2: 2, 3: 3, 4: 3, 5: 2, 6: 4, 7: 3, 8: 2 };
const TORE: Record<number, number> = { 1: 3, 2: 3, 3: 1, 4: 2 };

const str = (v: unknown, n = 2000) => (v ?? '').toString().slice(0, n);
const who = (v: unknown) => { const s = str(v, 60).toLowerCase(); return s.includes('lea') ? 'Lea' : s.includes('alex') ? 'Alex' : ''; };
const intOr = (v: unknown, d: number | null) => (v === null || v === undefined || v === '' || isNaN(Number(v))) ? d : Math.trunc(Number(v));
function fehler(e: any) {
  const m = (e?.message ?? String(e)).toString();
  const c = e?.code ?? '';
  const s = c === 'PT409' ? 409 : c === 'PT404' ? 404 : c === 'PT400' ? 400 : 500;
  return json({ error: m }, s);
}
async function log(w: string, what: string, ref: string, detail: unknown) {
  await db.from('gfweekly_org_log').insert({ who: w, what, ref, detail });
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
  const schreibt = action !== 'ping' && action !== 'get';
  if (schreibt && !W) return json({ error: 'Nur Alex oder Lea können hier schreiben' }, 400);

  try {
    if (action === 'ping') return json({ ok: true, version: VERSION });

    if (action === 'get') {
      const [e, r, g, l] = await Promise.all([
        db.from('gfweekly_org_entscheidung').select('*').order('id'),
        db.from('gfweekly_org_rolle').select('*'),
        db.from('gfweekly_org_tor').select('*'),
        db.from('gfweekly_org_log').select('*').order('at', { ascending: false }).limit(40),
      ]);
      for (const x of [e, r, g, l]) if (x.error) throw x.error;
      return json({ entscheidungen: e.data, rollen: r.data, tore: g.data, log: l.data, version: VERSION });
    }

    if (action === 'wahl') {
      const id = intOr(t.id, 0)!; const wahl = intOr(t.wahl, null);
      if (!OPTS[id]) return json({ error: 'Unbekannte Entscheidung' }, 400);
      if (wahl !== null && (wahl < 0 || wahl >= OPTS[id])) return json({ error: 'Unbekannte Möglichkeit' }, 400);
      const { data, error } = await db.rpc('hh_org_wahl', { p_id: id, p_wahl: wahl, p_by: W, p_expect_rev: intOr(t.expect_rev, null) });
      if (error) return fehler(error);
      return json({ entscheidung: data });
    }

    if (action === 'freigabe') {
      const id = intOr(t.id, 0)!;
      if (!OPTS[id]) return json({ error: 'Unbekannte Entscheidung' }, 400);
      const { data, error } = await db.rpc('hh_org_freigabe', { p_id: id, p_who: W, p_on: t.on !== false, p_expect_wahl: intOr(t.expect_wahl, null) });
      if (error) return fehler(error);
      return json(data);
    }

    if (action === 'begruendung') {
      const id = intOr(t.id, 0)!;
      if (!OPTS[id]) return json({ error: 'Unbekannte Entscheidung' }, 400);
      const text = str(t.text, 4000).trim() || null;
      const { data, error } = await db.from('gfweekly_org_entscheidung').update({ begruendung: text, updated_by: W, updated_at: new Date().toISOString() }).eq('id', id).select().single();
      if (error) throw error;
      return json({ entscheidung: data });
    }

    if (action === 'log_verknuepfen') {
      const id = intOr(t.id, 0)!; const did = str(t.decision_id, 60);
      if (!OPTS[id] || !/^[0-9a-f-]{36}$/.test(did)) return json({ error: 'Angaben fehlen' }, 400);
      const { data, error } = await db.from('gfweekly_org_entscheidung').update({ log_decision_id: did }).eq('id', id).is('log_decision_id', null).select();
      if (error) throw error;
      return json({ verknuepft: (data || []).length === 1 });
    }

    if (action === 'rolle') {
      const id = str(t.id, 40);
      if (!DEP[id]) return json({ error: 'Unbekannte Rolle' }, 400);
      const p = t.patch ?? {};
      const { data: alt, error: e1 } = await db.from('gfweekly_org_rolle').select('*').eq('id', id).maybeSingle();
      if (e1) throw e1;
      const rev = alt?.rev ?? 0;
      if (t.expect_rev !== undefined && t.expect_rev !== null && intOr(t.expect_rev, -1) !== rev) return json({ error: 'Inzwischen geändert', rolle: alt }, 409);
      const neu: Record<string, unknown> = { id, rev: rev + 1, updated_by: W, updated_at: new Date().toISOString() };
      if (p.schritt !== undefined) {
        const s = intOr(p.schritt, 0)!;
        if (s < 0 || s > 6) return json({ error: 'Schritt 0 bis 6' }, 400);
        if (s > 0) {
          const { data: ent, error: e2 } = await db.from('gfweekly_org_entscheidung').select('id,freigegeben_am').in('id', DEP[id]);
          if (e2) throw e2;
          const offen = DEP[id].filter(d => !(ent || []).find((x: any) => x.id === d && x.freigegeben_am));
          if (offen.length) return json({ error: 'Wartet auf Entscheidung ' + offen.join(', ') }, 409);
        }
        neu.schritt = s;
      }
      if (p.leitung !== undefined) neu.leitung = str(p.leitung, 120).trim() || null;
      if (p.stellvertretung !== undefined) neu.stellvertretung = str(p.stellvertretung, 120).trim() || null;
      const q = alt
        ? db.from('gfweekly_org_rolle').update(neu).eq('id', id).eq('rev', rev).select()
        : db.from('gfweekly_org_rolle').insert(neu).select();
      const { data, error } = await q;
      if (error) { if ((error as any).code === '23505') return json({ error: 'Inzwischen geändert' }, 409); throw error; }
      if (!data || data.length !== 1) return json({ error: 'Inzwischen geändert' }, 409);
      await log(W, 'rolle', id, p);
      return json({ rolle: data[0] });
    }

    if (action === 'tor') {
      const key = str(t.key, 5);
      const m = /^([1-4])-([0-9])$/.exec(key);
      if (!m || Number(m[2]) >= TORE[Number(m[1])]) return json({ error: 'Unbekanntes Tor' }, 400);
      const on = t.on !== false;
      const { data, error } = await db.from('gfweekly_org_tor').upsert({ key, erfuellt: on, updated_by: W, updated_at: new Date().toISOString() }).select().single();
      if (error) throw error;
      await log(W, on ? 'tor' : 'tor_zurueck', key, null);
      return json({ tor: data });
    }

    return json({ error: 'unknown action' }, 400);
  } catch (e) {
    return fehler(e);
  }
});
