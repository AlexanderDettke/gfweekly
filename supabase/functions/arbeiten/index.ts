/* Das Hohe Haus · Edge Function „arbeiten“ (V33 So arbeiten wir, 09.10.2026)
   Ist-Aufnahme der Abläufe je Person, Systeme damals und heute, Umfrage für Alex und Lea, Einordnung der Werkzeuge
   aus dem Hub-Register.

   Regeln
   - Steckbriefe gehören der Person, die sie schreibt. Die andere Person sieht einen Steckbrief erst nach Freigabe.
   - Umfrage: jede Person antwortet für sich. Die Antworten der anderen Person liefert diese Funktion erst, wenn beide
     die Runde abgegeben haben. Nach der Abgabe sind die eigenen Antworten der Runde fest; zurücknehmen geht nur,
     solange die andere Person noch nicht abgegeben hat. V34: vorher liefert lage von der anderen Person nur die Nummern
     beantworteter Fragen (Stand für den Wegweiser), nie Werte oder Texte.
   - Hub-Register (hub.werkzeuge) nur lesen über hh_sa_werkzeuge; die Einordnung je Werkzeug liegt im Haus.
   - Auth wie gfweekly, saison, besetzung: Passwort im Body oder Header x-gfweekly-key gegen GFWEEKLY_PASSWORD.
     Eigene Funktion, damit die große Funktion gfweekly unberührt bleibt. */
import { createClient } from 'jsr:@supabase/supabase-js@2';

const VERSION = 3;   // V34: lage liefert umfrage.andere_beantwortet (nur Nummern)
const PASSWORD = Deno.env.get('GFWEEKLY_PASSWORD') ?? '';
const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-gfweekly-key',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } });

const PERSONEN = ['Alex', 'Lea'];
const EINORDNUNG = ['offen', 'behalten', 'anpassen', 'umbauen', 'weglassen'];
const REIFE_SYSTEM = ['frueher', 'entwicklung', 'erprobung', 'alltag', 'ruht', 'abgeloest'];
const REIFE_HUB = ['', 'entwicklung', 'erprobung', 'alltag'];
const IST_TEXT: Record<string, number> = { ablauf: 200, haeufigkeit: 80, startet_wenn: 2000, schritte: 4000, werkzeuge: 2000, beteiligte: 2000, ergebnis_ort: 2000, laeuft_gut: 2000, hakt: 2000 };
const SYS_TEXT: Record<string, number> = { name: 160, wofuer: 1000, beobachtung: 2000, stand_quelle: 300 };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const str = (v: unknown, n = 2000) => (v ?? '').toString().slice(0, n);
const who = (v: unknown) => { const s = str(v, 60).toLowerCase(); return s.includes('lea') ? 'Lea' : s.includes('alex') ? 'Alex' : ''; };
const andere = (w: string) => (w === 'Alex' ? 'Lea' : 'Alex');
const heuteBerlin = () => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Berlin' }).format(new Date());

class Fehler extends Error { constructor(public status: number, msg: string) { super(msg); } }

async function log(wer: string, what: string, detail: unknown) {
  try { await db.from('gfweekly_sa_log').insert({ who: wer, what, detail }); } catch (_e) { /* Protokoll ist nicht tragend */ }
}
async function runde(nr: number) {
  const { data, error } = await db.from('gfweekly_sa_runden').select('*').eq('nr', nr).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Fehler(404, 'Diese Runde gibt es nicht.');
  return data as any;
}
const abgegeben = (r: any, p: string) => (p === 'Alex' ? r.abgegeben_alex : r.abgegeben_lea);
const feldAbgabe = (p: string) => (p === 'Alex' ? 'abgegeben_alex' : 'abgegeben_lea');

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method' }, 405);
  let body: any; try { body = await req.json(); } catch { return json({ error: 'bad json' }, 400); }
  const given = str(body?.password, 200) || str(req.headers.get('x-gfweekly-key'), 200);
  if (!PASSWORD || given !== PASSWORD) return json({ error: 'unauthorized' }, 401);
  const action = str(body?.action, 40);
  const t = body?.payload ?? {};
  const W = who(t.who ?? t.by);

  try {
    if (action === 'ping') return json({ ok: true, version: VERSION });
    if (!W) throw new Fehler(400, 'Wer arbeitet gerade? In der Kopfzeile Alex oder Lea wählen.');
    const A = andere(W);

    /* Alles für die Seite in einem Aufruf. */
    if (action === 'lage') {
      const [ist, fremd, fremdZahl, systeme, hub, hubStand, runden, fragen] = await Promise.all([
        db.from('gfweekly_sa_ist').select('*').eq('person', W).order('sort').order('created_at'),
        db.from('gfweekly_sa_ist').select('*').eq('person', A).eq('freigegeben', true).order('sort').order('created_at'),
        db.from('gfweekly_sa_ist').select('id', { count: 'exact', head: true }).eq('person', A),
        db.from('gfweekly_sa_systeme').select('*').order('sort').order('created_at'),
        db.rpc('hh_sa_werkzeuge'),
        db.from('gfweekly_sa_hub_stand').select('*'),
        db.from('gfweekly_sa_runden').select('*').order('nr'),
        db.from('gfweekly_sa_fragen').select('*').eq('aktiv', true).order('sort'),
      ]);
      for (const r of [ist, fremd, fremdZahl, systeme, hub, hubStand, runden, fragen]) if ((r as any).error) throw new Error((r as any).error.message);
      const stand = new Map<string, any>((hubStand.data || []).map((s: any) => [s.werkzeug_id, s]));
      const werkzeuge = (hub.data || []).map((w: any) => ({ ...w, stand: stand.get(w.id) || { reifegrad: '', einordnung: 'offen', notiz: '' } }));
      const alleRunden = (runden.data || []) as any[];
      const aktuelle = alleRunden[alleRunden.length - 1] || null;
      let eigene: any[] = [], fremde: any[] = [], beide = false, andereBeantwortet: number[] = [];
      if (aktuelle) {
        beide = !!(aktuelle.abgegeben_alex && aktuelle.abgegeben_lea);
        const { data: e, error: ee } = await db.from('gfweekly_sa_antworten').select('*').eq('runde', aktuelle.nr).eq('person', W);
        if (ee) throw new Error(ee.message); eigene = e || [];
        /* V34: Stand der anderen Person für den Wegweiser, nur die Nummern beantworteter Fragen, keine Inhalte. */
        const { data: f, error: ef } = await db.from('gfweekly_sa_antworten').select('nr,wert,kann_nicht,beispiel').eq('runde', aktuelle.nr).eq('person', A);
        if (ef) throw new Error(ef.message);
        const art = new Map<number, string>((fragen.data || []).map((q: any) => [q.nr, q.art]));
        andereBeantwortet = (f || []).filter((x: any) => x.kann_nicht || (art.get(x.nr) === 'text' ? !!(x.beispiel || '').trim() : x.wert != null)).map((x: any) => x.nr).sort((p: number, q: number) => p - q);
        if (beide) {
          const { data: g, error: eg } = await db.from('gfweekly_sa_antworten').select('*').eq('runde', aktuelle.nr).eq('person', A);
          if (eg) throw new Error(eg.message); fremde = g || [];
        }
      }
      /* Frühere Runden, die beide abgegeben haben: komplett, für den Verlauf. */
      const fertige = alleRunden.filter((r) => r.abgegeben_alex && r.abgegeben_lea && (!aktuelle || r.nr !== aktuelle.nr)).map((r) => r.nr);
      let verlauf: any[] = [];
      if (fertige.length) {
        const { data: v, error: ev } = await db.from('gfweekly_sa_antworten').select('*').in('runde', fertige);
        if (ev) throw new Error(ev.message); verlauf = v || [];
      }
      return json({
        ok: true, heute: heuteBerlin(), who: W, andere: A,
        ist: { eigene: ist.data || [], andere: fremd.data || [], andere_gesamt: (fremdZahl as any).count ?? 0 },
        systeme: systeme.data || [], werkzeuge,
        umfrage: { fragen: fragen.data || [], runden: alleRunden, runde: aktuelle, beide, eigene, andere: fremde, andere_beantwortet: andereBeantwortet, verlauf },
      });
    }

    /* Steckbriefe */
    if (action === 'ist_save') {
      const row: Record<string, unknown> = { updated_at: new Date().toISOString() };
      for (const f of Object.keys(IST_TEXT)) if (t[f] !== undefined) row[f] = str(t[f], IST_TEXT[f]).trim();
      if (t.beruehrt_andere !== undefined) row.beruehrt_andere = !!t.beruehrt_andere;
      if (t.einordnung !== undefined) row.einordnung = EINORDNUNG.includes(t.einordnung) ? t.einordnung : 'offen';
      if (t.sort !== undefined) row.sort = parseInt(t.sort) || 0;
      const id = str(t.id, 40);
      if (id) {
        if (!UUID.test(id)) throw new Fehler(400, 'Kennung ungültig.');
        if (row.ablauf !== undefined && !row.ablauf) throw new Fehler(400, 'Der Ablauf braucht einen Namen.');
        const { data, error } = await db.from('gfweekly_sa_ist').update(row).eq('id', id).eq('person', W).select('*');
        if (error) throw new Error(error.message);
        if (!data || !data.length) throw new Fehler(404, 'Dieser Steckbrief gehört nicht dir oder gibt es nicht mehr.');
        return json({ ok: true, ist: data[0] });
      }
      if (!row.ablauf) throw new Fehler(400, 'Der Ablauf braucht einen Namen.');
      row.person = W;
      const { data, error } = await db.from('gfweekly_sa_ist').insert(row).select('*').single();
      if (error) throw new Error(error.message);
      await log(W, 'ist_neu', { id: data.id, ablauf: data.ablauf });
      return json({ ok: true, ist: data });
    }
    if (action === 'ist_delete') {
      const id = str(t.id, 40); if (!UUID.test(id)) throw new Fehler(400, 'Kennung ungültig.');
      const { data, error } = await db.from('gfweekly_sa_ist').delete().eq('id', id).eq('person', W).select('id,ablauf');
      if (error) throw new Error(error.message);
      if (!data || !data.length) throw new Fehler(404, 'Dieser Steckbrief gehört nicht dir oder gibt es nicht mehr.');
      await log(W, 'ist_geloescht', data[0]);
      return json({ ok: true });
    }
    if (action === 'ist_freigeben') {
      const id = str(t.id, 40); if (!UUID.test(id)) throw new Fehler(400, 'Kennung ungültig.');
      const { data, error } = await db.from('gfweekly_sa_ist').update({ freigegeben: !!t.freigegeben, updated_at: new Date().toISOString() }).eq('id', id).eq('person', W).select('*');
      if (error) throw new Error(error.message);
      if (!data || !data.length) throw new Fehler(404, 'Dieser Steckbrief gehört nicht dir oder gibt es nicht mehr.');
      await log(W, t.freigegeben ? 'ist_freigegeben' : 'ist_zurueckgezogen', { id, ablauf: data[0].ablauf });
      return json({ ok: true, ist: data[0] });
    }

    /* Systeme damals und heute (gemeinsame Liste) */
    if (action === 'system_save') {
      const row: Record<string, unknown> = { updated_at: new Date().toISOString(), updated_by: W };
      for (const f of Object.keys(SYS_TEXT)) if (t[f] !== undefined) row[f] = str(t[f], SYS_TEXT[f]).trim();
      if (t.reifegrad !== undefined) row.reifegrad = REIFE_SYSTEM.includes(t.reifegrad) ? t.reifegrad : 'alltag';
      if (t.einordnung !== undefined) row.einordnung = EINORDNUNG.includes(t.einordnung) ? t.einordnung : 'offen';
      if (t.sort !== undefined) row.sort = parseInt(t.sort) || 0;
      const id = str(t.id, 40);
      if (id) {
        if (!UUID.test(id)) throw new Fehler(400, 'Kennung ungültig.');
        if (row.name !== undefined && !row.name) throw new Fehler(400, 'Das System braucht einen Namen.');
        const { data, error } = await db.from('gfweekly_sa_systeme').update(row).eq('id', id).select('*').single();
        if (error) throw new Error(error.message);
        return json({ ok: true, system: data });
      }
      if (!row.name) throw new Fehler(400, 'Das System braucht einen Namen.');
      const { data: max } = await db.from('gfweekly_sa_systeme').select('sort').order('sort', { ascending: false }).limit(1);
      if (row.sort === undefined) row.sort = ((max && max[0]?.sort) || 0) + 10;
      const { data, error } = await db.from('gfweekly_sa_systeme').insert(row).select('*').single();
      if (error) throw new Error(error.message);
      await log(W, 'system_neu', { id: data.id, name: data.name });
      return json({ ok: true, system: data });
    }
    if (action === 'system_delete') {
      const id = str(t.id, 40); if (!UUID.test(id)) throw new Fehler(400, 'Kennung ungültig.');
      const { data, error } = await db.from('gfweekly_sa_systeme').delete().eq('id', id).select('id,name');
      if (error) throw new Error(error.message);
      if (data && data.length) await log(W, 'system_geloescht', data[0]);
      return json({ ok: true });
    }

    /* Einordnung je Werkzeug aus dem Hub-Register */
    if (action === 'hub_stand_set') {
      const id = str(t.werkzeug_id, 40); if (!UUID.test(id)) throw new Fehler(400, 'Werkzeug fehlt.');
      const { data: alt } = await db.from('gfweekly_sa_hub_stand').select('*').eq('werkzeug_id', id).maybeSingle();
      const row: Record<string, unknown> = {
        werkzeug_id: id, updated_by: W, updated_at: new Date().toISOString(),
        reifegrad: t.reifegrad !== undefined ? (REIFE_HUB.includes(t.reifegrad) ? t.reifegrad : '') : (alt?.reifegrad ?? ''),
        einordnung: t.einordnung !== undefined ? (EINORDNUNG.includes(t.einordnung) ? t.einordnung : 'offen') : (alt?.einordnung ?? 'offen'),
        notiz: t.notiz !== undefined ? str(t.notiz, 1000).trim() : (alt?.notiz ?? ''),
      };
      const { data, error } = await db.from('gfweekly_sa_hub_stand').upsert(row, { onConflict: 'werkzeug_id' }).select('*').single();
      if (error) throw new Error(error.message);
      return json({ ok: true, stand: data });
    }

    /* Umfrage */
    if (action === 'antwort_set') {
      const nr = parseInt(t.runde); const fnr = parseInt(t.nr);
      if (!nr || !fnr) throw new Fehler(400, 'Runde oder Frage fehlt.');
      const r = await runde(nr);
      if (abgegeben(r, W)) throw new Fehler(409, 'Du hast diese Runde schon abgegeben. Zum Ändern erst die Abgabe zurücknehmen.');
      const { data: frage, error: ef } = await db.from('gfweekly_sa_fragen').select('*').eq('nr', fnr).eq('aktiv', true).maybeSingle();
      if (ef) throw new Error(ef.message);
      if (!frage) throw new Fehler(404, 'Diese Frage gibt es nicht.');
      const kann_nicht = !!t.kann_nicht;
      let wert: number | null = null;
      if (!kann_nicht && t.wert !== undefined && t.wert !== null && t.wert !== '') {
        const v = parseInt(t.wert);
        if (frage.art === 'skala' && !(v >= 1 && v <= 5)) throw new Fehler(400, 'Die Skala geht von 1 bis 5.');
        if (frage.art === 'zahl' && !(v >= 0 && v <= 999)) throw new Fehler(400, 'Bitte eine Zahl von 0 bis 999.');
        if (frage.art === 'wahl') { const n = frage.optionen.split('|').length; if (!(v >= 1 && v <= n)) throw new Fehler(400, 'Diese Option gibt es nicht.'); }
        if (frage.art === 'text') throw new Fehler(400, 'Diese Frage wird mit Text beantwortet.');
        wert = isNaN(v) ? null : v;
      }
      const row = { runde: nr, person: W, nr: fnr, wert, kann_nicht, beispiel: str(t.beispiel, 3000).trim(), updated_at: new Date().toISOString() };
      const { data, error } = await db.from('gfweekly_sa_antworten').upsert(row, { onConflict: 'runde,person,nr' }).select('*').single();
      if (error) throw new Error(error.message);
      return json({ ok: true, antwort: data });
    }
    if (action === 'abgeben') {
      const nr = parseInt(t.runde); if (!nr) throw new Fehler(400, 'Runde fehlt.');
      const r = await runde(nr);
      if (abgegeben(r, W)) return json({ ok: true, runde: r, schon: true });
      const { data, error } = await db.from('gfweekly_sa_runden').update({ [feldAbgabe(W)]: new Date().toISOString() }).eq('nr', nr).is(feldAbgabe(W), null).select('*').maybeSingle();
      if (error) throw new Error(error.message);
      if (!data) return json({ ok: true, runde: await runde(nr), schon: true });
      await log(W, 'umfrage_abgegeben', { runde: nr });
      return json({ ok: true, runde: data, beide: !!(data.abgegeben_alex && data.abgegeben_lea) });
    }
    if (action === 'abgabe_zurueck') {
      const nr = parseInt(t.runde); if (!nr) throw new Fehler(400, 'Runde fehlt.');
      const r = await runde(nr);
      if (abgegeben(r, A)) throw new Fehler(409, `${A} hat schon abgegeben, die Antworten sind beiden sichtbar. Für Änderungen eine neue Runde starten.`);
      const { data, error } = await db.from('gfweekly_sa_runden').update({ [feldAbgabe(W)]: null }).eq('nr', nr).is(feldAbgabe(A), null).select('*').maybeSingle();
      if (error) throw new Error(error.message);
      if (!data) throw new Fehler(409, `${A} hat schon abgegeben, die Antworten sind beiden sichtbar. Für Änderungen eine neue Runde starten.`);
      await log(W, 'umfrage_zurueck', { runde: nr });
      return json({ ok: true, runde: data });
    }
    if (action === 'runde_neu') {
      const { data: alle, error } = await db.from('gfweekly_sa_runden').select('*').order('nr');
      if (error) throw new Error(error.message);
      const letzte = (alle || [])[(alle || []).length - 1];
      if (letzte && !(letzte.abgegeben_alex && letzte.abgegeben_lea)) throw new Fehler(409, 'Die laufende Runde ist noch nicht von beiden abgegeben.');
      const neu = { nr: (letzte?.nr || 0) + 1, bezug: str(t.bezug, 120).trim() || 'die letzten vier Wochen', gestartet_von: W };
      const { data, error: ei } = await db.from('gfweekly_sa_runden').insert(neu).select('*').single();
      if (ei) throw new Error(ei.message);
      await log(W, 'umfrage_runde_neu', { runde: data.nr });
      return json({ ok: true, runde: data });
    }

    return json({ error: 'Unbekannte Aktion' }, 400);
  } catch (e) {
    if (e instanceof Fehler) return json({ error: e.message }, e.status);
    return json({ error: (e as Error).message || 'Fehler' }, 500);
  }
});
