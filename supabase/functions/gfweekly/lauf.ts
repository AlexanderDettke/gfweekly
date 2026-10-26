/* Kompass · Stufe 3 (26.10.2026): der Lauf im Kompass (docs/PAKET-STUFE-3-LAUF-IM-KOMPASS.md, Abschnitt 2).
   Aktionen: lauf_tick, lauf_einstellungen_get, lauf_einstellungen_set, lauf_gmail_probe, lauf_retro_auswertung.
   Ein Tick bearbeitet ein Postfach und höchstens `batch` Threads. Mails kommen aus Gmail (Dienstkonto mit Delegation, Secret
   GOOGLE_SA_JSON) oder als `mails:[…]` in der Nutzlast (Fixtures der Probe, Rückblick aus der Terminal-Sitzung).
   Harte Regeln stehen hier im Code, nicht nur im Prompt: erledigt nur bei „sicher“ mit belegtem Abschluss, nie ein Punkt, der schon
   einmal zurückgenommen wurde, Deckel je Berliner Tag, keine Frist (nur gate_frist als Vorschlag), keine Themen, kein Kandidat aus
   gesendeten Mails, Einwurf-Adressen bleiben beim Einwurf-Weg. Schreibwege wie docs/auftraege/STUFE2-LAEUFE.md, deshalb gelten
   Rückgängig (hh_lauf_rueckgaengig), Verfall (hh_vorschlag_verfall) und Bilanz (lauf_bilanz) unverändert. */
// deno-lint-ignore-file no-explicit-any
type Any = any;

export class LaufFehler extends Error { status: number; constructor(m: string, status = 400) { super(m); this.status = status; } }

export const LAUF_MODI = ['aus', 'probe', 'vorschlag', 'live'];
const EINWURF = ['alex+einwurf@wildemoehre.org', 'lea+einwurf@wildemoehre.org'];
const SCOPE = 'https://www.googleapis.com/auth/gmail.readonly';
const TIMEOUT_MS = 25000;

/* ---- reine Helfer (auch für Proben importierbar) ---- */
export function laufStufe(roh: Any, punktBekannt: boolean, vorhabenBekannt: boolean): 'sicher' | 'wahrscheinlich' | 'unklar' {
  const s = Number(roh?.sicherheit); const sich = isFinite(s) ? Math.max(0, Math.min(1, s)) : 0;
  if (punktBekannt && sich >= 0.8 && roh?.abschluss_belegt === true) return 'sicher';
  if ((punktBekannt || vorhabenBekannt) && sich >= 0.6) return 'wahrscheinlich';
  return 'unklar';
}
export function laufAktion(stufe: string, modus: string, hatPunkt: boolean, hatKandidat: boolean, gesendet: boolean, gesperrt: boolean): string {
  if (stufe === 'sicher' && hatPunkt) { if (gesperrt) return 'gesperrt'; return modus === 'live' ? 'erledigt' : 'vorschlag'; }
  if (stufe === 'wahrscheinlich') return hatPunkt || !hatKandidat ? 'vorschlag' : (gesendet ? 'nichts' : 'kandidat');
  if (hatKandidat && !gesendet) return 'kandidat';
  return 'nichts';
}
export function mailText(m: Any, max = 3500): string {
  const kopf = `Von: ${m.von || ''}\nAn: ${m.an || ''}\nDatum: ${m.datum || ''}\nBetreff: ${m.betreff || ''}\n`;
  return (kopf + '\n' + String(m.text || m.snippet || '').replace(/\r/g, '').replace(/\n{3,}/g, '\n\n')).slice(0, max);
}
export function istEinwurfMail(m: Any): boolean { const an = String(m.an || '').toLowerCase(); return EINWURF.some(e => an.includes(e)); }

function b64url(x: string | ArrayBuffer): string {
  const bytes = typeof x === 'string' ? new TextEncoder().encode(x) : new Uint8Array(x);
  let s = ''; for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function b64urlDecode(s: string): string {
  const t = s.replace(/-/g, '+').replace(/_/g, '/'); const pad = t.length % 4 ? '='.repeat(4 - (t.length % 4)) : '';
  const bin = atob(t + pad); const bytes = Uint8Array.from(bin, c => c.charCodeAt(0));
  return new TextDecoder('utf-8', { fatal: false }).decode(bytes);
}
function pemToDer(pem: string): ArrayBuffer {
  const b = pem.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '');
  const bin = atob(b); const arr = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return arr.buffer;
}

export function laufModul(deps: { admin: Any; json: (b: Any, s?: number) => Response; heuteBerlin: () => string; whoNorm: (s: string) => string; rueckkehrLage?: (t: Any) => Promise<Any>; laufBilanz?: (t: Any) => Promise<Any> }) {
  const { admin, json, heuteBerlin, whoNorm } = deps;
  const tokens = new Map<string, { token: string; bis: number }>();

  async function rpc(name: string, args: Record<string, unknown>) {
    const { data, error } = await admin.rpc(name, args);
    if (error) {
      const code = (error as Any).code || '';
      const status = code === 'PT404' ? 404 : code === 'PT409' ? 409 : code === 'PT400' ? 400 : 500;
      throw new LaufFehler(String(error.message || 'Datenbankfehler').replace(/^.*?:\s*/, ''), status);
    }
    return data;
  }
  function by(t: Any): string {
    const w = whoNorm((t?.by ?? '').toString().trim());
    if (w !== 'Alex' && w !== 'Lea') throw new LaufFehler('by muss Alex oder Lea sein');
    return w;
  }
  async function einstellungen(): Promise<Any> {
    const { data, error } = await admin.from('hh_lauf_einstellungen').select('*').eq('id', 1).maybeSingle();
    if (error) throw error; if (!data) throw new LaufFehler('Einstellungen fehlen (Migration 20261026120000)', 500);
    return data;
  }

  /* ---- Google: Dienstkonto mit domänenweiter Delegation, JWT mit WebCrypto, kein Schlüssel im Log ---- */
  function saLesen(): Any {
    const raw = (Deno.env.get('GOOGLE_SA_JSON') || '').trim();
    if (!raw) throw new LaufFehler('Google-Zugang fehlt: Supabase-Secret GOOGLE_SA_JSON setzen (Paket Stufe 3, Abschnitt 2.4)', 503);
    try { return JSON.parse(raw.startsWith('{') ? raw : atob(raw)); } catch { throw new LaufFehler('GOOGLE_SA_JSON ist kein JSON (roh oder base64)', 503); }
  }
  async function gmailToken(postfach: string): Promise<string> {
    const c = tokens.get(postfach); if (c && c.bis > Date.now() + 60000) return c.token;
    const sa = saLesen();
    const now = Math.floor(Date.now() / 1000);
    const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
    const claim = b64url(JSON.stringify({ iss: sa.client_email, sub: postfach, scope: SCOPE, aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 }));
    const key = await crypto.subtle.importKey('pkcs8', pemToDer(sa.private_key), { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
    const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(header + '.' + claim));
    const jwt = `${header}.${claim}.${b64url(sig)}`;
    const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt }) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok || !d.access_token) throw new LaufFehler('Google-Token für ' + postfach + ' abgelehnt: ' + (d.error_description || d.error || r.status) + ' (Delegation für ' + SCOPE + ' eingetragen?)', 502);
    tokens.set(postfach, { token: d.access_token, bis: Date.now() + (Number(d.expires_in) || 3600) * 1000 });
    return d.access_token;
  }
  async function gmailGet(postfach: string, pfad: string): Promise<Any> {
    const token = await gmailToken(postfach);
    const ctl = new AbortController(); const timer = setTimeout(() => ctl.abort(), TIMEOUT_MS);
    try {
      const r = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/' + pfad, { headers: { authorization: 'Bearer ' + token }, signal: ctl.signal });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new LaufFehler('Gmail ' + postfach + ': ' + (d?.error?.message || r.status), 502);
      return d;
    } finally { clearTimeout(timer); }
  }
  function kopf(headers: Any[], name: string): string { return (headers || []).find((h: Any) => String(h.name).toLowerCase() === name.toLowerCase())?.value || ''; }
  function textTeil(payload: Any): string {
    if (!payload) return '';
    if (payload.mimeType === 'text/plain' && payload.body?.data) return b64urlDecode(payload.body.data);
    for (const p of payload.parts || []) { const t = textTeil(p); if (t) return t; }
    if (payload.mimeType === 'text/html' && payload.body?.data) return b64urlDecode(payload.body.data).replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ');
    return '';
  }
  /* Threads eines Postfachs im Fenster; je Thread die jüngste Nachricht als Quelle, der Threadtext (höchstens 3 Nachrichten) als Kontext. */
  async function gmailMails(postfach: string, q: string, max: number): Promise<Any[]> {
    const liste = await gmailGet(postfach, `threads?maxResults=${Math.min(50, max)}&q=${encodeURIComponent(q)}`);
    const aus: Any[] = [];
    for (const t of (liste.threads || []).slice(0, max)) {
      const th = await gmailGet(postfach, `threads/${t.id}?format=full`);
      const msgs = (th.messages || []).slice(-3);
      const letzte = msgs[msgs.length - 1]; if (!letzte) continue;
      const h = letzte.payload?.headers || [];
      const text = msgs.map((m: Any) => `[${kopf(m.payload?.headers, 'Date')}] ${kopf(m.payload?.headers, 'From')}: ${textTeil(m.payload).slice(0, 1500)}`).join('\n\n');
      aus.push({ thread_id: t.id, message_id: letzte.id, von: kopf(h, 'From'), an: kopf(h, 'To') + (kopf(h, 'Cc') ? ', ' + kopf(h, 'Cc') : ''), betreff: kopf(h, 'Subject'), datum: new Date(Number(letzte.internalDate || Date.now())).toISOString(),
        text, snippet: th.snippet || '', gesendet: (letzte.labelIds || []).includes('SENT'), labels: letzte.labelIds || [] });
    }
    return aus;
  }

  /* ---- Kontext: aktive Vorhaben mit offenen Punkten, gesperrte Punkte ---- */
  async function kontext() {
    const [vh, pk, sperre] = await Promise.all([
      admin.from('hh_vorhaben').select('id,slug,title,phase,fokus,ball,ball_name,stand,naechster_schritt,frist').in('status', ['aktiv', 'pausiert']).order('sort'),
      admin.from('hh_vorhaben_punkte').select('id,vorhaben_id,titel,stand,wer,frist').eq('erledigt', false),
      admin.from('hh_vorhaben_verlauf').select('punkt_id').like('source_ref', 'rueckgaengig:lauf:%'),
    ]);
    for (const r of [vh, pk, sperre]) if (r.error) throw r.error;
    const punkte = new Map<string, Any[]>();
    for (const p of (pk.data || []) as Any[]) { if (!punkte.has(p.vorhaben_id)) punkte.set(p.vorhaben_id, []); punkte.get(p.vorhaben_id)!.push(p); }
    const liste = ((vh.data || []) as Any[]).map(v => ({ ...v, punkte: punkte.get(v.id) || [] }));
    return { liste, gesperrt: new Set(((sperre.data || []) as Any[]).map(x => x.punkt_id).filter(Boolean)) };
  }

  /* ---- Claude: eine Mail gegen die Akten einordnen (Werkzeugschema wie der Einwurf) ---- */
  async function einordnen(mail: Any, ktx: Any[], modell: string, person: string): Promise<Any> {
    const key = Deno.env.get('ANTHROPIC_API_KEY') || ''; if (!key) throw new LaufFehler('ANTHROPIC_API_KEY fehlt', 503);
    const system = `Du prüfst für die Geschäftsführung der Wilde Möhre GmbH (Alex und Lea), ob eine E-Mail belegt, dass ein offener Punkt eines laufenden Vorhabens erledigt ist, oder ob sie ein Vorhaben betrifft. Du entscheidest nichts, du ordnest ein.
Regeln:
- vorhaben_slug nur aus der Liste; passt keines eindeutig, nenne den besten Treffer mit sicherheit unter 0.5.
- punkt_id nur aus den offenen Punkten dieses Vorhabens. abschluss_belegt ist nur dann true, wenn die Mail die Handlung des Punkts als geschehen zeigt (gesendete Antwort, Zusage, Zahlung, Termin bestätigt, Unterschrift), nicht wenn sie nur darüber spricht.
- sicherheit: 0.9 und mehr nur, wenn Betreff oder Text den Punkt oder den Partner in seiner Rolle eindeutig nennen; sonst niedriger.
- beleg: ein Satz mit Datum, Betrag oder Name, wenn vorhanden. Keine Zitate, keine Zugangsdaten, keine Konto- oder Kartennummern.
- kandidat: nur, wenn die Mail eine neue Entscheidung oder Aufgabe der Geschäftsführung nennt, die noch kein Punkt ist; sonst null. Keine Kandidaten aus Newslettern, Rechnungen, Systemmails, Kalendereinladungen, privater Post.
- frist_datum: nur ein Datum, das in der Mail steht (JJJJ-MM-TT), sonst null.
- Vertraulich: keine Aussagen über Gesundheit, Befinden oder Eignung von Personen, keine Bewertungen von Menschen, keine privaten Angelegenheiten; Personalthemen nur auf Sachebene.
- Erfinde nichts. Sprache Deutsch, keine Gedankenstriche.`;
    const liste = ktx.map(v => ({ slug: v.slug, titel: v.title, phase: v.phase, stand: v.stand, naechster_schritt: v.naechster_schritt,
      offene_punkte: v.punkte.map((p: Any) => ({ id: p.id, titel: p.titel, stand: p.stand, wer: p.wer, frist: p.frist })) }));
    const body = {
      model: modell, max_tokens: 900, system,
      tools: [{ name: 'einordnung', description: 'Einordnung der Mail gegen die Akten.', input_schema: { type: 'object', additionalProperties: false, required: ['vorhaben_slug', 'sicherheit', 'abschluss_belegt', 'beleg'],
        properties: { vorhaben_slug: { type: ['string', 'null'] }, punkt_id: { type: ['string', 'null'] }, sicherheit: { type: 'number' }, abschluss_belegt: { type: 'boolean' }, beleg: { type: 'string' },
          kandidat: { type: ['object', 'null'], properties: { titel: { type: 'string' }, body: { type: 'string' } }, required: ['titel'] }, frist_datum: { type: ['string', 'null'] } } } }],
      tool_choice: { type: 'tool', name: 'einordnung' },
      messages: [{ role: 'user', content: `Heute: ${heuteBerlin()}. Postfach: ${person}. ${mail.gesendet ? 'Die Mail wurde von dieser Person gesendet.' : 'Die Mail ist eingegangen.'}\n\nMail:\n${mailText(mail)}\n\nAktive Vorhaben:\n${JSON.stringify(liste)}` }],
    };
    const ctl = new AbortController(); const timer = setTimeout(() => ctl.abort(), TIMEOUT_MS);
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', signal: ctl.signal, headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' }, body: JSON.stringify(body) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new LaufFehler('Anthropic: ' + (data?.error?.message || res.status), 502);
      const tool = (data.content || []).find((c: Any) => c.type === 'tool_use');
      if (!tool?.input) throw new LaufFehler('Anthropic: keine Antwort im erwarteten Format', 502);
      return tool.input;
    } finally { clearTimeout(timer); }
  }

  const VERTRAULICH = /(passwort|kennwort|zugangsdaten|\bpin\b|\btan\b|\biban\b|\bDE\d{2}(?:\s?\d{4}){4}|\b(?:\d{4}[ -]?){3}\d{4}\b|krank|diagnose|therapie|psychisch|depress|burn-?out|schwanger|\barzt|klinik|gesundheit)/i;
  const txt = (x: unknown, n: number) => (x ?? '').toString().trim().slice(0, n);
  const tag = (x: unknown) => { const s = txt(x, 10); return /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(Date.parse(s + 'T00:00:00Z')) ? s : null; };

  /* ---- ein Tick ---- */
  async function tick(t: Any) {
    const e = await einstellungen();
    const probe = t.probe === true;
    const modus = probe ? 'probe' : e.modus;
    const runId = txt(t.run_id, 80) || `lauf-${new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14)}`;
    if (modus === 'aus' && !Array.isArray(t.mails)) return { uebersprungen: true, modus, grund: 'Lauf ist aus' };
    const heute = heuteBerlin();
    const batch = Math.max(1, Math.min(50, parseInt(t.batch) || e.batch || 8));
    let postfach = txt(t.postfach, 120);
    let mails: Any[] = [];
    let quelle = 'nutzlast';
    let cursorNeu: string | null = null;
    if (Array.isArray(t.mails)) {
      mails = t.mails.slice(0, batch); postfach = postfach || 'fixtures';
    } else {
      quelle = 'gmail';
      if (!postfach) {
        const { data: cur } = await admin.from('hh_lauf_cursor').select('postfach,bis_at');
        const c = new Map<string, string>(((cur || []) as Any[]).map(x => [x.postfach, x.bis_at]));
        postfach = [...(e.postfaecher || [])].sort((a: string, b: string) => String(c.get(a) || '').localeCompare(String(c.get(b) || '')))[0] || '';
      }
      if (!postfach) throw new LaufFehler('kein Postfach eingestellt');
      const { data: cur } = await admin.from('hh_lauf_cursor').select('bis_at').eq('postfach', postfach).maybeSingle();
      const seit = t.after ? new Date(t.after) : new Date(cur?.bis_at ? Date.parse(cur.bis_at) - 3600e3 : Date.now() - (e.fenster_stunden || 26) * 3600e3);
      const bisD = t.before ? new Date(t.before) : new Date();
      const q = `after:${Math.floor(seit.getTime() / 1000)} before:${Math.floor(bisD.getTime() / 1000) + 1} -category:promotions -category:social ${EINWURF.map(x => '-to:' + x).join(' ')}`;
      mails = await gmailMails(postfach, q, batch);
      cursorNeu = t.after || t.before ? null : bisD.toISOString();
    }
    const person = /^lea/i.test(postfach) ? 'Lea' : 'Alex';
    const { liste, gesperrt } = await kontext();
    const bySlug = new Map<string, Any>(liste.map((v: Any) => [v.slug, v]));
    const zusammen = { geprueft: 0, erledigt: 0, vorschlag: 0, kandidat: 0, unklar: 0, gedeckelt: 0, gesperrt: 0, uebersprungen: 0, fehler: 0 } as Record<string, number>;
    const zeilen: Any[] = [];
    for (const m of mails) {
      const ref = `mail:${txt(m.thread_id, 80) || 'x'}:${txt(m.message_id, 80) || 'x'}`;
      const { data: schon } = await admin.from('hh_lauf_protokoll').select('id').like('schluessel', ref + ':%').limit(1);
      if ((schon || []).length) { zusammen.uebersprungen++; continue; }
      let zeile: Any = { run_id: runId, modus, postfach, quelle_art: 'mail', quelle_ref: ref, punkt_id: null, vorhaben_id: null, stufe: 'keine', aktion: 'nichts', beleg: null, ausgefuehrt: false };
      try {
        if (istEinwurfMail(m)) { zeile.beleg = 'Einwurf-Adresse, bleibt beim Einwurf-Weg'; zeile.aktion = 'uebersprungen'; }
        else {
          zusammen.geprueft++;
          const roh = await einordnen(m, liste, e.modell, person);
          const vh = roh?.vorhaben_slug ? bySlug.get(String(roh.vorhaben_slug)) : null;
          const punkt = vh && roh?.punkt_id ? (vh.punkte as Any[]).find((p: Any) => p.id === String(roh.punkt_id)) : null;
          const stufe = laufStufe(roh, !!punkt, !!vh);
          let beleg = txt(roh?.beleg, 600); if (VERTRAULICH.test(beleg)) beleg = 'Beleg weggelassen (möglicherweise vertraulich)';
          const kand = roh?.kandidat && txt(roh.kandidat.titel, 300) && !VERTRAULICH.test(txt(roh.kandidat.titel, 300) + ' ' + txt(roh.kandidat.body, 600)) ? { titel: txt(roh.kandidat.titel, 300), body: txt(roh.kandidat.body, 600) } : null;
          const gesp = !!punkt && gesperrt.has(punkt.id);
          const aktion = laufAktion(stufe, modus, !!punkt, !!kand && !!vh, !!m.gesendet, gesp);
          zeile = { ...zeile, punkt_id: punkt?.id || null, vorhaben_id: vh?.id || null, stufe, aktion, beleg: beleg || null };
          const frist = tag(roh?.frist_datum);
          const link = m.thread_id && !/^fix|^test/i.test(String(m.thread_id)) ? `https://mail.google.com/mail/u/0/#all/${m.thread_id}` : null;
          if (modus !== 'probe' && (aktion === 'vorschlag' || aktion === 'kandidat')) {
            const frei = await rpc('hh_lauf_sichtung', { p_tag: heute, p_n: 1 });
            if (Number(frei) < 1) zeile.aktion = 'gedeckelt';
          }
          if (modus !== 'probe') {
            if (zeile.aktion === 'erledigt') {
              await rpc('hh_punkt_toggle', { p_id: punkt.id, p_erledigt: true, p_by: 'lauf', p_quelle: `${ref}:erledigt:${punkt.id}` });
              await admin.from('hh_vorhaben_verlauf').upsert({ vorhaben_id: vh.id, punkt_id: punkt.id, art: 'mail', wer: 'Lauf', text: `Erledigt (Lauf): ${beleg || 'Beleg in der Mail'}`, status: 'bestaetigt', created_by: 'lauf', source_ref: `${ref}:beleg:${punkt.id}`, source_url: link, happened_at: m.datum || new Date().toISOString() }, { onConflict: 'source_ref', ignoreDuplicates: true });
              zeile.ausgefuehrt = true;
            } else if (zeile.aktion === 'vorschlag' && vh) {
              const tg = punkt ? (stufe === 'sicher' || roh?.abschluss_belegt ? 'Vorschlag: Punkt erledigt' : 'Vorschlag: Stand') : 'Vorschlag: Stand';
              const text = punkt ? `${beleg || 'Die Mail'} spricht dafür, dass „${punkt.titel}“ ${tg === 'Vorschlag: Punkt erledigt' ? 'erledigt ist' : 'sich geändert hat'}.` : `${beleg || 'Die Mail'} betrifft dieses Vorhaben.`;
              await admin.from('hh_vorhaben_verlauf').upsert({ vorhaben_id: vh.id, punkt_id: punkt?.id || null, art: 'mail', wer: 'Lauf', text: text.slice(0, 2000), tag: tg, status: 'vorschlag', created_by: 'lauf', source_ref: `${ref}:vorschlag:${punkt?.id || 'k'}`, source_url: link, happened_at: m.datum || new Date().toISOString() }, { onConflict: 'source_ref', ignoreDuplicates: true });
              zeile.ausgefuehrt = true;
            } else if (zeile.aktion === 'kandidat' && kand) {
              await admin.from('gfweekly_news').upsert({ kind: 'kandidat', title: kand.titel, body: kand.body || null, who: person, source: 'mail', source_title: txt(m.betreff, 200) || 'Mail', source_url: link, source_ref: `${ref}:k1`, happened_at: m.datum || new Date().toISOString(), status: 'neu', gate: 'gf', gate_by: 'lauf', gate_at: new Date().toISOString(), gate_frist: frist, vorhaben_vorschlag: vh?.id || null, run_id: runId }, { onConflict: 'source_ref', ignoreDuplicates: true });
              zeile.ausgefuehrt = true;
            }
          }
        }
      } catch (err) {
        zeile.aktion = 'fehler'; zeile.beleg = txt((err as Error).message, 600); zusammen.fehler++;
      }
      zusammen[zeile.aktion] = (zusammen[zeile.aktion] || 0) + 1;
      if (zeile.stufe === 'unklar') zusammen.unklar++;
      await admin.from('hh_lauf_protokoll').upsert(zeile, { onConflict: 'schluessel', ignoreDuplicates: true });
      zeilen.push({ ref, betreff: txt(m.betreff, 80), stufe: zeile.stufe, aktion: zeile.aktion, punkt: zeile.punkt_id, beleg: zeile.beleg });
    }
    if (cursorNeu && modus !== 'probe') await admin.from('hh_lauf_cursor').upsert({ postfach, bis_at: cursorNeu, updated_at: new Date().toISOString() }, { onConflict: 'postfach' });
    let abschaltung: Any = null;
    if (modus === 'live') abschaltung = await selbstabschaltung(e);
    let brief: Any = null;
    if (modus !== 'probe' && !Array.isArray(t.mails)) brief = await rueckkehrBriefe(e.modell).catch((err: Error) => ({ fehler: err.message }));
    if (!probe) {
      await admin.from('hh_lauf_einstellungen').update({ letzter_lauf_at: new Date().toISOString(), letzter_fehler: zusammen.fehler ? `${zusammen.fehler} Fehler im Lauf ${runId}` : null, updated_at: new Date().toISOString() }).eq('id', 1);
      if (modus !== 'aus' && mails.length) {
        const { data: tagz } = await admin.from('hh_lauf_protokoll').select('aktion').gte('created_at', heute + 'T00:00:00+01:00');
        const z: Record<string, number> = {}; for (const r of (tagz || []) as Any[]) z[r.aktion] = (z[r.aktion] || 0) + 1;
        await admin.from('gfweekly_news').upsert({ kind: 'ticker', title: `Lauf ${heute}: erledigt ${z.erledigt || 0}, Vorschläge ${z.vorschlag || 0}, Kandidaten ${z.kandidat || 0}, unklar oder nichts ${z.nichts || 0}${z.gedeckelt ? ', gedeckelt ' + z.gedeckelt : ''}`, body: `Modus ${modus}, Postfach ${postfach}.`, who: 'Lauf', source: 'lauf', source_ref: `lauf:tag:${heute}`, happened_at: new Date().toISOString(), status: 'neu' }, { onConflict: 'source_ref' });
      }
    }
    return { run_id: runId, modus, postfach, quelle, mails: mails.length, zusammen, zeilen, cursor: cursorNeu, abschaltung, brief };
  }

  /* Stufe 4: unter 50 % bleibende Erledigungen über zwei Wochen (bei mindestens fünf) schaltet der Lauf sich auf „vorschlag“. */
  async function selbstabschaltung(e: Any) {
    const seit = new Date(Date.now() - 14 * 86400000).toISOString();
    const [er, rz] = await Promise.all([
      admin.from('hh_vorhaben_verlauf').select('id', { count: 'exact', head: true }).eq('created_by', 'lauf').eq('art', 'system').like('text', 'Punkt erledigt:%').gte('created_at', seit),
      admin.from('hh_vorhaben_verlauf').select('id', { count: 'exact', head: true }).like('source_ref', 'rueckgaengig:lauf:%').gte('created_at', seit),
    ]);
    const erledigt = er.count || 0, zurueck = rz.count || 0;
    const quote = erledigt ? Math.round(100 * (erledigt - zurueck) / erledigt) : null;
    if (erledigt >= 5 && quote !== null && quote < 50) {
      const grund = `Selbstabschaltung ${heuteBerlin()}: von ${erledigt} Lauf-Erledigungen der letzten 14 Tage wurden ${zurueck} zurückgenommen (${quote} % bleibend, Schwelle 50 %). Modus auf vorschlag.`;
      await admin.from('hh_lauf_einstellungen').update({ modus: 'vorschlag', abbruch_grund: grund, updated_at: new Date().toISOString() }).eq('id', 1);
      await admin.from('hh_lauf_protokoll').upsert({ run_id: 'abschaltung:' + heuteBerlin(), modus: 'vorschlag', quelle_art: 'system', quelle_ref: 'abschaltung:' + heuteBerlin(), stufe: 'keine', aktion: 'nichts', beleg: grund.slice(0, 600), ausgefuehrt: true }, { onConflict: 'schluessel', ignoreDuplicates: true });
      await admin.from('gfweekly_news').upsert({ kind: 'ticker', title: 'Lauf auf Vorschlag zurückgestellt', body: grund, who: 'Lauf', source: 'lauf', source_ref: 'lauf:abschaltung:' + heuteBerlin(), happened_at: new Date().toISOString(), status: 'neu' }, { onConflict: 'source_ref', ignoreDuplicates: true });
      return { abgeschaltet: true, erledigt, zurueck, quote };
    }
    return { abgeschaltet: false, erledigt, zurueck, quote };
  }

  /* Rückkehr-Brief: am Morgen einer Rückkehr (status rueckkehr oder bis = heute) aus rueckkehr_lage in fünf bis acht Sätzen, nur wenn leer. */
  async function rueckkehrBriefe(modell: string) {
    if (!deps.rueckkehrLage) return null;
    const heute = heuteBerlin();
    const { data: abs } = await admin.from('gfweekly_absences').select('id,person,status,bis,note_rueckkehr,test').or(`status.eq.rueckkehr,bis.eq.${heute}`).in('status', ['aktiv', 'rueckkehr']).is('note_rueckkehr', null);
    const aus: Any[] = [];
    for (const a of (abs || []) as Any[]) {
      if (a.test) continue;
      const lage = await deps.rueckkehrLage({ absence_id: a.id });
      const kurz = { person: lage.person, von: lage.von, bis: lage.bis, zaehler: lage.zaehler, phasen: (lage.phasen || []).map((p: Any) => ({ phase: p.phase, entschieden: p.entschieden.slice(0, 8).map((x: Any) => ({ text: x.text, ergebnis: x.ergebnis, wer: x.wer, vorhaben: x.vorhaben })), bewegt: p.bewegt.slice(0, 6).map((x: Any) => ({ title: x.title, stand: x.stand, anzahl: x.anzahl })), wartet: p.wartet.slice(0, 8).map((x: Any) => ({ text: x.text, wer: x.wer, vorhaben: x.vorhaben })) })) };
      const key = Deno.env.get('ANTHROPIC_API_KEY') || ''; if (!key) break;
      const body = { model: modell, max_tokens: 700, system: 'Du schreibst für die zurückkehrende Person der Geschäftsführung der Wilde Möhre GmbH einen Absatz von fünf bis acht Sätzen: je Phase (Launch, Formatpartner, Systembau, Weiteres) was entschieden wurde, was sich bewegt hat, was auf sie wartet; nenne Vorhaben beim Namen, keine Bewertungen von Menschen, nichts Privates, keine Gedankenstriche, Deutsch, Du-Ansprache mit Vornamen.', messages: [{ role: 'user', content: JSON.stringify(kurz) }] };
      const res = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' }, body: JSON.stringify(body) });
      const d = await res.json().catch(() => ({}));
      const text = (d.content || []).filter((c: Any) => c.type === 'text').map((c: Any) => c.text).join('\n').trim();
      if (res.ok && text && !VERTRAULICH.test(text)) {
        await admin.from('gfweekly_absences').update({ note_rueckkehr: text.slice(0, 4000), updated_at: new Date().toISOString() }).eq('id', a.id).is('note_rueckkehr', null);
        aus.push({ absence_id: a.id, person: a.person, geschrieben: true });
      } else aus.push({ absence_id: a.id, person: a.person, geschrieben: false, grund: d?.error?.message || 'leer oder vertraulich' });
    }
    return aus;
  }

  /* Rückblick auswerten: sichere Treffer gegen die Wirklichkeit (von Hand erledigte Punkte im Zeitraum). */
  async function retroAuswertung(t: Any) {
    const von = tag(t.von) || heuteBerlin(); const bis = tag(t.bis) || heuteBerlin(); const run = txt(t.run_id, 80) || 'retro';
    const [pr, pk] = await Promise.all([
      admin.from('hh_lauf_protokoll').select('punkt_id,vorhaben_id,stufe,aktion,beleg,quelle_ref').like('run_id', run + '%'),
      admin.from('hh_vorhaben_punkte').select('id,titel,erledigt,erledigt_at,erledigt_by,vorhaben_id').eq('erledigt', true).gte('erledigt_at', von + 'T00:00:00+01:00').lte('erledigt_at', bis + 'T23:59:59+01:00'),
    ]);
    for (const r of [pr, pk]) if (r.error) throw r.error;
    const P = (pr.data || []) as Any[]; const hand = ((pk.data || []) as Any[]).filter(p => !/^lauf$/i.test(p.erledigt_by || ''));
    const sicher = P.filter(x => x.stufe === 'sicher' && x.punkt_id);
    const handIds = new Set(hand.map(p => p.id));
    const treffer = sicher.filter(x => handIds.has(x.punkt_id)).length;
    const offen = sicher.filter(x => !handIds.has(x.punkt_id));
    const { data: nochOffen } = offen.length ? await admin.from('hh_vorhaben_punkte').select('id,erledigt').in('id', offen.map(x => x.punkt_id)) : { data: [] };
    const fehlalarm = ((nochOffen || []) as Any[]).filter(p => !p.erledigt).length;
    const verpasst = hand.filter(p => !sicher.some(x => x.punkt_id === p.id)).length;
    const wahrsch = P.filter(x => x.stufe === 'wahrscheinlich').length;
    const tage = Math.max(1, Math.round((Date.parse(bis) - Date.parse(von)) / 86400000) + 1);
    const sichtungen = P.filter(x => x.aktion === 'vorschlag' || x.aktion === 'kandidat').length;
    return { run_id: run, von, bis, geprueft: P.length, sicher: sicher.length, treffer, fehlalarm, unentschieden: sicher.length - treffer - fehlalarm, verpasst_von_hand_erledigt: verpasst, wahrscheinlich: wahrsch, unklar: P.filter(x => x.stufe === 'unklar').length,
      praezision: sicher.length ? Math.round(100 * treffer / Math.max(1, treffer + fehlalarm)) : null, sichtungen_je_tag: Math.round(10 * sichtungen / tage) / 10, hand_erledigt: hand.length };
  }

  async function einstellungenGet() {
    const e = await einstellungen();
    const seit = new Date(Date.now() - 28 * 86400000).toISOString();
    const [pr, cron] = await Promise.all([
      admin.from('hh_lauf_protokoll').select('run_id,modus,postfach,quelle_art,stufe,aktion,beleg,ausgefuehrt,created_at,punkt_id,vorhaben_id').gte('created_at', seit).order('created_at', { ascending: false }).limit(2000),
      admin.rpc('hh_lauf_cron_steht').then((r: Any) => r, () => ({ data: null })),
    ]);
    if (pr.error) throw pr.error;
    const W: Record<string, Any> = {};
    const woche = (d: string) => { const x = new Date(d); const t0 = new Date(Date.UTC(x.getUTCFullYear(), x.getUTCMonth(), x.getUTCDate())); const tg = t0.getUTCDay() || 7; t0.setUTCDate(t0.getUTCDate() + 4 - tg); const j1 = new Date(Date.UTC(t0.getUTCFullYear(), 0, 1)); return `${t0.getUTCFullYear()}-W${String(Math.ceil(((t0.getTime() - j1.getTime()) / 86400000 + 1) / 7)).padStart(2, '0')}`; };
    for (const r of (pr.data || []) as Any[]) { if (r.quelle_art === 'system') continue; const w = woche(r.created_at); W[w] = W[w] || { woche: w, geprueft: 0, sicher: 0, wahrscheinlich: 0, unklar: 0, erledigt: 0, vorschlag: 0, kandidat: 0, gedeckelt: 0, gesperrt: 0, fehler: 0 }; W[w].geprueft++; if (W[w][r.stufe] !== undefined) W[w][r.stufe]++; if (W[w][r.aktion] !== undefined) W[w][r.aktion]++; }
    const bilanz = deps.laufBilanz ? await deps.laufBilanz({ wochen: 4 }).catch(() => null) : null;
    const s = bilanz?.summe || {};
    const bleibend = s.erledigt ? Math.round(100 * Math.max(0, s.erledigt - (s.zurueckgenommen || 0)) / s.erledigt) : null;
    const { count: offen } = await admin.from('hh_entscheidungen').select('id', { count: 'exact', head: true }).eq('status', 'offen');
    const tage = Object.values(W).reduce((n: number, w: Any) => n + 0, 0);
    const sichtTag = (() => { const je: Record<string, number> = {}; for (const r of (pr.data || []) as Any[]) if (r.aktion === 'vorschlag' || r.aktion === 'kandidat') { const d = String(r.created_at).slice(0, 10); je[d] = (je[d] || 0) + 1; } const v = Object.values(je); return v.length ? Math.round(10 * v.reduce((a, b) => a + b, 0) / v.length) / 10 : 0; })();
    const kriterien = [
      { kennung: 'a', text: 'Trefferquote des Laufs mindestens 50 %', wert: bilanz?.trefferquote ?? null, ziel: 50, einheit: '%', ok: bilanz?.trefferquote != null ? bilanz.trefferquote >= 50 : null },
      { kennung: 'b', text: 'Mindestens 70 % der Lauf-Erledigungen bleiben', wert: bleibend, ziel: 70, einheit: '%', ok: bleibend != null ? bleibend >= 70 : null },
      { kennung: 'c', text: 'Entscheidungsliste unter 15 offenen Einträgen', wert: offen || 0, ziel: 15, einheit: '', ok: (offen || 0) < 15 },
      { kennung: 'd', text: 'Höchstens 5 Sichtungen am Tag', wert: sichtTag, ziel: 5, einheit: '', ok: sichtTag <= 5 },
    ];
    void tage;
    return { einstellungen: e, gmail_konfiguriert: !!(Deno.env.get('GOOGLE_SA_JSON') || '').trim(), ki_konfiguriert: !!Deno.env.get('ANTHROPIC_API_KEY'), cron: cron?.data ?? null, wochen: Object.values(W).sort((a: Any, b: Any) => String(b.woche).localeCompare(String(a.woche))), letzte: ((pr.data || []) as Any[]).slice(0, 30), bilanz, kriterien };
  }

  async function gmailProbe(t: Any) {
    const e = await einstellungen();
    const postfach = txt(t.postfach, 120) || e.postfaecher?.[0];
    if (!postfach) throw new LaufFehler('postfach fehlt');
    const d = await gmailGet(postfach, 'threads?maxResults=1&q=' + encodeURIComponent('newer_than:1d'));
    return { postfach, ok: true, threads_24h: Number(d.resultSizeEstimate ?? (d.threads || []).length) };
  }

  async function handle(action: string, t: Any): Promise<Response> {
    try {
      if (action === 'lauf_tick') return json(await tick(t));
      if (action === 'lauf_einstellungen_get') return json(await einstellungenGet());
      if (action === 'lauf_einstellungen_set') { const wer = by(t); const patch: Any = {}; for (const k of ['modus', 'deckel_tag', 'modell']) if (t[k] !== undefined) patch[k] = t[k]; if (!Object.keys(patch).length) throw new LaufFehler('nichts zu ändern'); return json(await rpc('hh_lauf_einstellungen_set', { p_patch: patch, p_by: wer })); }
      if (action === 'lauf_gmail_probe') return json(await gmailProbe(t));
      if (action === 'lauf_retro_auswertung') return json(await retroAuswertung(t));
      return json({ error: 'unbekannte Aktion' }, 404);
    } catch (e) {
      if (e instanceof LaufFehler) return json({ error: e.message }, e.status);
      console.error('lauf', action, e);
      return json({ error: 'Lauf: ' + ((e as Error).message || 'Fehler') }, 500);
    }
  }
  return { handle, tick, einstellungenGet, retroAuswertung };
}
