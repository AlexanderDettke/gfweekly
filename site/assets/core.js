/* ===========================================================
   Das Hohe Haus (vormals GF Weekly) · V18 · gemeinsamer Kern
   API-Zugriff, Login-Gate, Navigation, Theme-Umschaltung, Helfer.
   Es werden bewusst KEINE apikey/Authorization-Header gesendet
   (das Supabase-Gateway lehnt sonst ab); Auth läuft über das
   Passwort im Request-Body (serverseitig in der Edge Function geprüft).
   =========================================================== */
const GF_FN = "https://bnfmupnmqyrcltrphfak.supabase.co/functions/v1/gfweekly";

/* ---- session helpers ---- */
function gfPW(){ return sessionStorage.getItem("gf_pw") || ""; }
function gfWho(){ return sessionStorage.getItem("gf_who") || "Alex"; }
function gfSetWho(w){ sessionStorage.setItem("gf_who", w); }
function gfEsc(s){ return (s||"").toString().replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c])); }

/* ---- API ---- */
async function gfApi(action, payload){
  const res = await fetch(GF_FN, { method:"POST", headers:{ "Content-Type":"application/json" }, keepalive:true,
    body: JSON.stringify({ action, password: gfPW(), payload }) });
  let d={}; try{ d = await res.json(); }catch(e){}
  if(res.status===401) throw { auth:true };
  if(!res.ok) throw new Error(d.error || ("HTTP "+res.status));
  return d;
}

/* ---- toast ---- */
let _gft;
function gfToast(m){
  let t=document.getElementById("toast");
  if(!t){ t=document.createElement("div"); t.id="toast"; t.className="toast"; document.body.appendChild(t); }
  t.textContent=m; t.classList.add("show"); clearTimeout(_gft); _gft=setTimeout(()=>t.classList.remove("show"),2600);
}
function gfCopy(text){ try{ navigator.clipboard.writeText(text); gfToast("In die Zwischenablage kopiert"); }catch(e){ gfToast("Kopieren nicht möglich"); } }

/* ---- Theme (dark Standard / light), persistiert in localStorage ---- */
function gfTheme(){ const t=localStorage.getItem("gf_theme"); return (t==="light"||t==="dark") ? t : (t==="colorful" ? "light" : "dark"); }
function gfApplyTheme(n){ document.documentElement.dataset.theme = n; localStorage.setItem("gf_theme", n); }
/* Frühes Setzen gegen Flackern: in <head> zusätzlich inline aufrufen. */
gfApplyTheme(gfTheme());

/* ---- Login-Gate (validiert das Passwort über people_list) ---- */
function gfGate(onReady){
  const gate=document.getElementById("gate"), inp=document.getElementById("pw"), btn=document.getElementById("unlock"), err=document.getElementById("gateErr");
  async function attempt(pw){
    sessionStorage.setItem("gf_pw", pw);
    try{ await gfApi("people_list"); if(gate) gate.style.display="none"; await onReady(); }
    catch(e){ if(err) err.textContent = e.auth ? "Falsches Passwort." : ("Fehler: "+(e.message||"Verbindung")); sessionStorage.removeItem("gf_pw"); }
  }
  if(btn) btn.onclick=()=>attempt(inp.value.trim());
  if(inp) inp.addEventListener("keydown",e=>{ if(e.key==="Enter") btn.click(); });
  if(gfPW()) attempt(gfPW()); else if(inp) inp.focus();
}

/* ---- Seitenleiste (V18): links, einklappbar zur Symbolleiste, am Handy als Schublade hinter einer schmalen Kopfzeile.
   Gruppen: Heute (Start, Neuigkeiten, Check-in) · Arbeiten (Themen mit Board/Kacheln/Liste/Entscheidungen, Eingabe) · Verwalten (Wichtige Seiten, Bearbeiten).
   Unten: Habitat-Taler (game.js hängt sich an .tb-ctl), Dunkel/Hell, Person. Zustand offen/schmal in localStorage gf_nav. ---- */
const GF_APP_NAME="Das Hohe Haus";
const GF_APP_SUB="Geschäftsführung der Wilden Habitate";
const GF_APP_MOTTO="Große Fragen. Klare Entscheidungen. Gelegentlich Kaffee oder besser Wein?";
const GF_ICONS={
  home:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10.5V20h13v-9.5"/><path d="M10 20v-5h4v5"/></svg>',
  bell:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2H4.5L6 16Z"/><path d="M10 20a2 2 0 0 0 4 0"/></svg>',
  check:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="4" width="14" height="17"/><path d="M9 4.5V3h6v1.5"/><path d="m8.5 13 2.5 2.5 4.5-5"/></svg>',
  board:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="4" width="5" height="16"/><rect x="9.5" y="4" width="5" height="11"/><rect x="15.5" y="4" width="5" height="7"/></svg>',
  pen:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4l11-11-4-4L4 16v4Z"/><path d="m13 7 4 4"/></svg>',
  grid:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="7" height="7"/><rect x="13" y="4" width="7" height="7"/><rect x="4" y="13" width="7" height="7"/><path d="M13 16.5h7M16.5 13v7"/></svg>',
  sliders:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M4 12h16M4 17h16"/><circle cx="9" cy="7" r="2" fill="var(--header-bg,#111)"/><circle cx="15" cy="12" r="2" fill="var(--header-bg,#111)"/><circle cx="7" cy="17" r="2" fill="var(--header-bg,#111)"/></svg>',
  menu:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
  chev:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m14 6-6 6 6 6"/></svg>',
  x:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="m6 6 12 12M18 6 6 18"/></svg>'
};
const GF_NAV=[
  ["Heute",[["start","index.html","Start","home",null,"Zyklus, Kennzahlen, Rituale, Habitat"],["neuigkeiten","neuigkeiten.html","Neuigkeiten","bell","newsBadge","Ticker, Sichtungskorb, Themenlage"],["checkin","checkin.html","Check-in","check",null,"Vorbereitung auf das Weekly"]]],
  ["Arbeiten",[["themen","board.html","Themen","board","themenBadge","Board, Kacheln, Liste, Entscheidungen"],["capture","capture.html","Eingabe","pen",null,"Thema erfassen"]]],
  ["Verwalten",[["seiten","seiten.html","Wichtige Seiten","grid",null,"Arbeitsseiten mit Zugang"],["edit","bearbeiten.html","Bearbeiten","sliders",null,"Themen, Personen, Links pflegen"]]]
];
const GF_SUBNAV=[["board","board.html?view=board","Board","Spalten nach Ablauf, Prio, Zeitraum oder Person, verschiebbar"],["kacheln","board.html?view=kacheln","Kacheln","Gruppen als Kachelraster"],["liste","cockpit.html","Liste","Ausführliche Liste mit Details und Protokoll"],["entscheidungen","entscheidungen.html","Entscheidungen","Entscheidungslog, Protokolle der Besprechungen, Wochenmail"]];
function gfNavMode(){
  if(window.matchMedia("(max-width:1023px)").matches) return "drawer";
  let s=null; try{ s=localStorage.getItem("gf_nav"); }catch(e){}
  return (s==="open"||s==="rail") ? s : (window.matchMedia("(min-width:1280px)").matches ? "open" : "rail");
}
function gfApplyNav(){
  const m=gfNavMode(), h=document.documentElement; h.dataset.nav=m; if(m!=="drawer") delete h.dataset.drawer;
  const ctl=document.querySelector("#topbar .tb-ctl"), foot=document.querySelector("#topbar .sb-foot"), slot=document.getElementById("mbSlot");
  if(ctl&&foot&&slot){ const want=(m==="drawer")?slot:foot; if(ctl.parentElement!==want) want.prepend(ctl); }
  const t=document.getElementById("navToggle"); if(t){ const l=(m==="rail")?"Menü ausklappen":"Menü einklappen"; t.setAttribute("aria-label",l); t.title=l; }
  const sb=document.getElementById("sidebar"); if(sb) sb.setAttribute("aria-hidden", m==="drawer" && h.dataset.drawer!=="open" ? "true":"false");
}
function gfDrawer(open){ const h=document.documentElement; if(open) h.dataset.drawer="open"; else delete h.dataset.drawer; const b=document.getElementById("navOpen"); if(b) b.setAttribute("aria-expanded", open?"true":"false"); const sb=document.getElementById("sidebar"); if(sb) sb.setAttribute("aria-hidden", open?"false":"true"); if(open){ const f=sb&&sb.querySelector("a.active")||sb&&sb.querySelector("a"); if(f) setTimeout(()=>f.focus(),60); } }
function gfMountTopbar(active){
  const el=document.getElementById("topbar"); if(!el) return;
  el.className="topbar";
  const themeSw=(id)=>`<div class="theme-sw" id="${id}" role="group" aria-label="Designmodus"><button data-th="dark" aria-label="Dunkler Modus">Dunkel</button><button data-th="light" aria-label="Heller Modus">Hell</button></div>`;
  const groups=GF_NAV.map(([g,items])=>`<div class="sb-group"><div class="sb-gl">${g}</div>${items.map(([k,h,l,ic,badge,tip])=>`<a href="${h}" data-k="${k}" title="${gfEsc(tip||l)}"><span class="ic">${GF_ICONS[ic]||""}</span><span class="lbl">${l}</span>${badge?`<span class="nbadge" id="${badge}" style="display:none">0</span>`:""}</a>${k==="themen"?`<div class="sb-sub" id="subnavSlot">${GF_SUBNAV.map(([sk,sh,sl,st])=>`<a href="${sh}" data-sk="${sk}" title="${gfEsc(st)}">${sl}</a>`).join("")}</div>`:""}`).join("")}</div>`).join("");
  el.innerHTML=`
    <div class="mbar" id="mbar">
      <button class="mb-menu" id="navOpen" aria-label="Menü öffnen" aria-controls="sidebar" aria-expanded="false">${GF_ICONS.menu}</button>
      <a class="mb-title" href="index.html">${GF_APP_NAME}</a>
      <div class="mb-slot" id="mbSlot"></div>
    </div>
    <div class="sb-backdrop" id="navBackdrop"></div>
    <aside class="sidebar" id="sidebar" aria-label="Navigation">
      <div class="sb-head">
        <a class="brand" href="index.html"><div class="mark pic"><img src="/assets/img/flagge-72.png" srcset="/assets/img/flagge-144.png 2x" alt="" width="36" height="36"></div><div class="brand-txt"><h1>${GF_APP_NAME}</h1><div class="meta">${GF_APP_SUB}</div></div></a>
        <button class="sb-toggle" id="navToggle" aria-label="Menü einklappen" title="Menü einklappen">${GF_ICONS.chev}</button>
        <button class="sb-close" id="navClose" aria-label="Menü schließen">${GF_ICONS.x}</button>
      </div>
      <nav class="nav sb-nav" aria-label="Hauptnavigation">${groups}</nav>
      <div class="sb-foot">
        <div class="tb-ctl">
          ${themeSw("themeSw")}
          <div class="whoami" id="whoSw" role="group" aria-label="Aktive Person"><span>als</span><button data-w="Alex">Alex</button><button data-w="Lea">Lea</button></div>
        </div>
        <div class="sb-drawer-only">${themeSw("themeSw2")}</div>
      </div>
    </aside>`;
  const a=el.querySelector(`.sb-nav a[data-k="${active}"]`); if(a){ a.classList.add("active"); a.setAttribute("aria-current","page"); }
  const cur=gfTheme();
  el.querySelectorAll(".theme-sw button").forEach(b=>{ if(b.dataset.th===cur) b.classList.add("on");
    b.onclick=()=>{ gfApplyTheme(b.dataset.th); el.querySelectorAll(".theme-sw button").forEach(x=>x.classList.toggle("on",x.dataset.th===b.dataset.th)); }; });
  const w0=gfWho()==="Lea"?"Lea":"Alex"; if(gfWho()!==w0) gfSetWho(w0);
  el.querySelectorAll("#whoSw button").forEach(b=>{ b.classList.toggle("on",b.dataset.w===w0);
    b.onclick=()=>{ gfSetWho(b.dataset.w); el.querySelectorAll("#whoSw button").forEach(x=>x.classList.toggle("on",x===b)); document.dispatchEvent(new CustomEvent("gf-who",{detail:b.dataset.w})); }; });
  /* Ein-/Ausklappen, Schublade */
  el.querySelector("#navToggle").onclick=()=>{ const m=gfNavMode()==="rail"?"open":"rail"; try{ localStorage.setItem("gf_nav",m); }catch(e){} gfApplyNav(); };
  el.querySelector("#navOpen").onclick=()=>gfDrawer(true);
  el.querySelector("#navClose").onclick=()=>gfDrawer(false);
  el.querySelector("#navBackdrop").onclick=()=>gfDrawer(false);
  el.querySelectorAll(".sb-nav a").forEach(x=>x.addEventListener("click",()=>{ if(document.documentElement.dataset.nav==="drawer") gfDrawer(false); }));
  document.addEventListener("keydown",e=>{ if(e.key==="Escape" && document.documentElement.dataset.drawer==="open") gfDrawer(false); });
  if(!window.__gfNavMQ){ window.__gfNavMQ=true; [window.matchMedia("(max-width:1023px)"),window.matchMedia("(min-width:1280px)")].forEach(mq=>mq.addEventListener("change",gfApplyNav)); }
  gfApplyNav();
  const legacy=document.getElementById("subnav"); if(legacy){ legacy.style.display="none"; legacy.innerHTML=""; }
  /* V16: Sichtungskorb-Zähler (Kandidaten mit Status neu) an „Neuigkeiten“ */
  if(active!=="neuigkeiten") gfApi("news_list",{kinds:["kandidat"],statuses:["neu"],limit:500}).then(d=>{ const n=(d.items||[]).length; const b=el.querySelector("#newsBadge"); if(n>0){ b.textContent=n; b.style.display="inline-flex"; b.title=n+" Kandidaten im Sichtungskorb"; } }).catch(()=>{});
  if(active!=="themen") gfApi("list").then(d=>{ const n=(d.topics||[]).filter(t=>t.board_lane==="zu_besprechen" && t.kind!=="recurring").length; const b=el.querySelector("#themenBadge"); if(n>0){ b.textContent=n; b.style.display="inline-flex"; b.title=n+" Themen zu besprechen"; } }).catch(()=>{});
}

/* ---- Unternavigation „Themen“ (V18): sitzt als Einrückung unter „Themen“ in der Seitenleiste; hier wird nur der aktive Punkt markiert ---- */
function gfMountSubnav(active){
  document.querySelectorAll("#subnavSlot a").forEach(x=>x.classList.toggle("on", x.dataset.sk===active));
  const legacy=document.getElementById("subnav"); if(legacy){ legacy.style.display="none"; legacy.innerHTML=""; }
}

/* ---- Kopfbild (V12): Grafik frei sichtbar, ohne Scrim und ohne Text darauf; Titel und Knöpfe stehen darunter ---- */
const GF_IMG={ tor:"/assets/img/tor-menschen.webp", ankunft:"/assets/img/ankunft.webp", kiste:"/assets/img/kiste-regen.webp", lager:"/assets/img/lager-begruessung.webp", buehne:"/assets/img/buehne-herbst.webp", lagerfeuer:"/assets/img/lagerfeuer.webp", karten:"/assets/game/phase-planung-szene.webp", aufbau:"/assets/game/phase-produktion-szene.webp", pflege:"/assets/game/phase-verbesserung-szene.webp", entscheidungen:"/assets/game/entscheidungen-kopf.webp", wochenmail:"/assets/game/wochenmail-kopf.webp" };
const GF_IMG_ALT={ tor:"Festivaltor mit ankommenden Menschen", ankunft:"Ankunft auf dem Festivalgelände", kiste:"Kiste im Regen zwischen den Zelten", lager:"Begrüßung im Lager", buehne:"Bühne im Herbstwald", lagerfeuer:"Lagerfeuer am Abend", karten:"Kartentisch mit Plänen vor der Waldlichtung", aufbau:"Bühnenaufbau auf dem Festivalgelände", pflege:"Herbstlager mit Notizbuch am Feuer", entscheidungen:"Richterhammer und Wegweiser im Abendlicht", wochenmail:"Brief mit Siegel, Feder und Kaffeebecher" };
function gfMountHero(img, title, sub, opts={}){
  const el=document.getElementById("hero"); if(!el) return;
  el.className="hero"+(opts.compact?" compact":"");
  const src=GF_IMG[img]||img;
  el.innerHTML=`<figure class="hero-pic"><img src="${src}" alt="${gfEsc(GF_IMG_ALT[img]||"")}" width="1600" height="900" decoding="async" fetchpriority="high"></figure>
    <div class="hero-head"><div class="hero-text"><h2 id="heroTitle">${title}</h2>${sub?`<p id="heroSub">${sub}</p>`:""}</div>${opts.aside?`<div class="hero-aside">${opts.aside}</div>`:""}</div>`;
}
function gfHeroText(title, sub){ const t=document.getElementById("heroTitle"), s=document.getElementById("heroSub"); if(t&&title!=null) t.innerHTML=title; if(s&&sub!=null) s.innerHTML=sub; }

/* ---- Lange Texte einklappen (ab ~220 Zeichen), Zustand je Schlüssel gemerkt ---- */
const GF_CLAMP=220;
function gfClamp(text, key, limit=GF_CLAMP){
  const t=(text||"").toString(); if(t.length<=limit+40) return gfEsc(t);
  let open=false; try{ open=localStorage.getItem("gf_open_"+key)==="1"; }catch(e){}
  const cut=t.slice(0,limit).replace(/\s+\S*$/,"");
  return `<span class="clamp ${open?"open":""}" data-key="${gfEsc(key)}"><span class="c-short">${gfEsc(cut)}… </span><span class="c-full">${gfEsc(t)} </span><button type="button" class="c-more">${open?"weniger":"mehr"}</button></span>`;
}
document.addEventListener("click",e=>{
  const b=e.target.closest(".c-more"); if(!b) return;
  e.preventDefault(); e.stopPropagation();
  const c=b.closest(".clamp"); const open=!c.classList.contains("open"); c.classList.toggle("open",open); b.textContent=open?"weniger":"mehr";
  try{ localStorage.setItem("gf_open_"+c.dataset.key, open?"1":"0"); }catch(err){}
});

/* ---- Lebendigkeit: gestaffeltes Einlaufen, Zähler ---- */
function gfStagger(root, sel){
  const els=(root||document).querySelectorAll(sel); els.forEach((el,i)=>{ el.classList.add("ht-rise"); el.style.animationDelay=(Math.min(i,8)*40)+"ms"; });
}
function gfCountUp(el, to, ms=400){
  if(!el) return; const n=parseInt(to); if(isNaN(n)){ el.textContent=to; return; }
  if(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches){ el.textContent=n; return; }
  const t0=performance.now(); const from=0;
  function step(now){ const p=Math.min(1,(now-t0)/ms); const e=1-Math.pow(1-p,3); el.textContent=Math.round(from+(n-from)*e); if(p<1) requestAnimationFrame(step); }
  requestAnimationFrame(step);
}
function gfSkeleton(n=3, cls="card"){ return Array.from({length:n},()=>`<div class="skel ${cls}"><i></i><i class="w60"></i><i class="w80"></i></div>`).join(""); }

/* ---- Personen (für Delegation) ---- */
let GF_PEOPLE=[];
async function gfLoadPeople(){ try{ const d=await gfApi("people_list"); GF_PEOPLE=(d.people||[]).filter(p=>p.active!==false); }catch(e){ GF_PEOPLE=[]; } return GF_PEOPLE; }
function gfAssignable(){ return GF_PEOPLE.filter(p=>p.assignable!==false); }

/* ---- Anzeige-Helfer ---- */
const GF_REL_RANK={ kritisch:0, hoch:1, mittel:2, niedrig:3, "":4 };
const GF_PRANK={ hoch:0, mittel:1, niedrig:2 };
function gfRelLabel(r){ return r ? (r.charAt(0).toUpperCase()+r.slice(1)) : ""; }
function gfDefaultTime(t){ if(t.time_minutes) return t.time_minutes; return t.priority==="hoch"?15:(t.priority==="niedrig"?5:10); }
function gfSrcBadge(src){ return ({ki:"KI-Vorschlag",manuell:"manuell",pruefen:"prüfen",bestaetigt:"bestätigt"})[src]||src||""; }
function gfNames(s){ return (s||"").split(",").map(x=>x.trim()).filter(Boolean); }
function gfTomorrow(){ const d=new Date(Date.now()+86400000); return d.toISOString().slice(0,10); }

/* Delegations-Nachricht (kopierbar – es wird KEINE Mail automatisch versendet) */
function gfDelegationMsg(t){
  const who=t.delegate_to || t.owner || "[Name]";
  const ctx=(t.short_description || (t.context||"").split("\n")[0] || "").slice(0,240);
  return `Hi ${who},\n\nkönntest du „${t.title}" übernehmen?\nKontext: ${ctx}\nNächster Schritt: ${t.next_action||"[nächster Schritt]"}\nRückmeldung/Follow-up bis: ${t.next_suggested||gfTomorrow()}\n\nDanke dir!\n${gfWho()}`;
}
/* Asana-fertiger Text (Option B). Echte API-Anbindung: siehe README + netlify/functions/asana.js */
function gfAsanaText(t){
  return `Titel: ${t.title}\n`+
         `Zuständig: ${t.delegate_to||t.owner||"—"}\n`+
         `Fällig: ${gfTomorrow()} (morgen)\n`+
         `Kontext: ${t.short_description||(t.context||"").split("\n")[0]||"—"}\n`+
         `Empfehlung: ${t.recommendation||"—"}\n`+
         `Nächster Schritt: ${t.next_action||"—"}\n`+
         `Quelle: Das Hohe Haus`;
}

/* ---- V13: Modal mit Text (Protokoll, Wochenmail): kopieren, per Mail, schließen ---- */
const GF_MAIL_TO="alex@wildemoehre.org,lea@wildemoehre.org";
function gfTextModal(title, text, opts={}){
  let m=document.getElementById("gfModal");
  if(!m){ m=document.createElement("div"); m.id="gfModal"; m.className="modal-back"; document.body.appendChild(m); }
  const subject=opts.subject||title;
  const mailto=`mailto:${opts.to||GF_MAIL_TO}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;
  m.innerHTML=`<div class="modal" role="dialog" aria-modal="true" aria-label="${gfEsc(title)}">
    <div class="modal-h"><h3>${gfEsc(title)}</h3><button class="icon-btn" data-x title="Schließen">✕</button></div>
    ${opts.pic?`<figure class="modal-pic"><img src="${GF_IMG[opts.pic]||opts.pic}" alt="${gfEsc(GF_IMG_ALT[opts.pic]||"")}"></figure>`:""}${opts.intro?`<p class="modal-intro">${opts.intro}</p>`:""}
    <textarea class="modal-text" readonly>${gfEsc(text)}</textarea>
    <div class="modal-f"><button class="btn btn-primary" data-copy>Kopieren</button><a class="btn btn-ghost" href="${mailto}">Per Mail senden</a>${opts.extra||""}<button class="btn btn-ghost" data-x style="margin-left:auto">Schließen</button></div>
  </div>`;
  m.classList.add("open");
  m.querySelectorAll("[data-x]").forEach(b=>b.onclick=()=>m.classList.remove("open"));
  m.onclick=e=>{ if(e.target===m) m.classList.remove("open"); };
  m.querySelector("[data-copy]").onclick=()=>gfCopy(text);
  /* V17: Protokoll verschickt zählt (5 Taler, einmal je Protokoll), serverseitig eindeutig über den Betreff */
  if(/Protokoll/i.test(subject)){ const a=m.querySelector('a[href^="mailto:"]'); if(a) a.addEventListener("click",()=>{ gfApi("score_event",{kind:"protokoll", ref:subject}).catch(()=>{}); }); }
  return m;
}
function gfFmtDay(d){ return new Date(d).toLocaleDateString("de-DE",{weekday:"long",day:"2-digit",month:"2-digit",year:"numeric"}); }
function gfFmtShort(d){ return d?new Date(d.length===10?d+"T00:00:00":d).toLocaleDateString("de-DE",{day:"2-digit",month:"2-digit",year:"numeric"}):""; }
function gfFmtTime(d){ return new Date(d).toLocaleTimeString("de-DE",{hour:"2-digit",minute:"2-digit"}); }

/* Protokolltext aus einem Besprechungs-Log: Einträge {title, outcome, decision, next_action, owner, until} */
function gfProtocolText(meta, log, openTopics){
  const L=[]; const dur=meta.ended&&meta.started?Math.round((new Date(meta.ended)-new Date(meta.started))/60000):null;
  L.push(`GF-Besprechung Wilde Möhre · ${gfFmtDay(meta.started||Date.now())}${meta.started?` · ${gfFmtTime(meta.started)}${meta.ended?"–"+gfFmtTime(meta.ended):""}`:""}${dur!=null?` (${dur} min)`:""}`);
  if(meta.participants) L.push(`Teilnehmende: ${meta.participants}`);
  L.push("");
  const grp=(key,label,fmt)=>{ const items=log.filter(e=>e.outcome===key); if(!items.length) return; L.push(label); items.forEach((e,i)=>L.push(fmt(e,i+1))); L.push(""); };
  grp("entschieden","Entscheidungen",(e,i)=>`${i}. ${e.title}: ${e.decision||"–"}${e.next_action?`
   Nächster Schritt: ${e.next_action}`:""}${e.owner?` (Verantwortung: ${e.owner})`:""}`);
  grp("in_klaerung","In Klärung",(e)=>`- ${e.title}${e.next_action?`: ${e.next_action}`:""}${e.owner?` (${e.owner})`:""}`);
  grp("erledigt","Erledigt",(e)=>`- ${e.title}`);
  grp("vertagt","Vertagt",(e)=>`- ${e.title}${e.until?` → ${gfFmtShort(e.until)}`:""}`);
  grp("besprochen","Besprochen ohne Beschluss",(e)=>`- ${e.title}${e.next_action?`: ${e.next_action}`:""}`);
  if(openTopics&&openTopics.length){ L.push(`Offen geblieben (zu besprechen): ${openTopics.length}`); openTopics.slice(0,12).forEach(t=>L.push(`- ${t.title}${t.priority==="hoch"?" (hoch)":""}`)); if(openTopics.length>12) L.push(`- … und ${openTopics.length-12} weitere`); L.push(""); }
  L.push(`Erstellt mit Das Hohe Haus · gfweekly.netlify.app`);
  return L.join("\n");
}

/* ===========================================================
   V15 · Bereinigen: markierten Eingabetext in Felder zerlegen.
   Gleiche Logik liegt in der Edge Function (topicFromCapture, tidyParse),
   Änderungen bitte an beiden Stellen nachziehen.
   Rückgabe: { changes:{feld:neuerWert}, found:[Marker…] } oder null, wenn nichts zu tun ist.
   =========================================================== */
const GF_TIDY_MARKERS=[
  ["title",   ["Titel","Thema","Betreff"]],
  ["about",   ["Worum geht es","Worum geht’s","Worum geht's","Zusammenfassung","Kurz","Hintergrund","Kontext","Stand","Aktueller Stand","Agenda","Ziel","Situation","Entscheidungsgrundlage","Offen","Offene Fragen","Offene Punkte","Zu entscheiden in dieser Runde","Zu entscheiden","Zu klären","Lage","Ausgangslage"]],
  ["why",     ["Warum ins Weekly","Warum","Relevanz","Warum jetzt"]],
  ["next",    ["Vorschlag","Empfehlung","Nächster Schritt","Naechster Schritt","Nächste Schritte","Naechste Schritte","To do","Todo","Maßnahme","Massnahme","Aufgabe","Nächstes"]],
  ["owner",   ["Verantwortlich","Verantwortliche","Verantwortlichkeit","Verantwortung","Owner","Zuständig","Zustaendig"]],
  ["decision",["Entscheidung","Entschieden","Beschluss"]],
  ["notes",   ["Quelle","Quellen","Typ","Eingang","Notiz","Notizen","Hinweis","Anmerkung","Termin","Frist","Fällig","Faellig","Deadline"]],
];
const GF_TIDY_KIND={}; GF_TIDY_MARKERS.forEach(([k,ls])=>ls.forEach(l=>GF_TIDY_KIND[l.toLowerCase()]=k));
const GF_TIDY_ALT=GF_TIDY_MARKERS.flatMap(([k,ls])=>ls).sort((a,b)=>b.length-a.length).map(l=>l.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")).join("|");
/* Marker = bekanntes Label (großgeschrieben) + Doppelpunkt. Erlaubt ist davor: Zeilenanfang, Leerraum, Emoji/Strich-Präfix
   oder ein Kleinbuchstabe bzw. Satzzeichen (der ChatGPT-Kanal klebt Zeilen zusammen: „SchrittWorum geht es:“). */
const GF_TIDY_LABEL_RE=new RegExp("(?<![A-ZÄÖÜ])("+GF_TIDY_ALT+")\\s*:","gu");
const GF_TIDY_STRIP_L=/^[\s—–*_#>\u2600-\u27BF\uFE0F\u200D\p{Extended_Pictographic}]+/u, GF_TIDY_STRIP_R=/[\s—–\-•*_#>\u2600-\u27BF\uFE0F\u200D\p{Extended_Pictographic}]+$/u;
const GF_TIDY_SHORT=new Set(["title","next","owner","decision","notes"]);
function gfTidyKind(label){ return GF_TIDY_KIND[label.trim().replace(/\s+/g," ").toLowerCase()]||null; }
function gfTidyClean(s){ return (s||"").replace(GF_TIDY_STRIP_L,"").replace(GF_TIDY_STRIP_R,"").trim(); }
function gfTidySegments(text){
  const src=(text||"").replace(/\r/g,"").replace(/^\s*[—–-]{1,2}\s*(.+?)\s*[—–-]{1,2}\s*$/gmu,"\n$1:\n"); // „— Claude-Recherche —“ wird zur Überschrift
  const raw=[]; let last=0, cur=null;
  for(const m of src.matchAll(GF_TIDY_LABEL_RE)){
    const kind=gfTidyKind(m[1]); if(!kind) continue;
    const before=gfTidyClean(src.slice(last, m.index));
    if(cur) cur.text=before; else if(before) raw.push({kind:"pre",label:"",text:before});
    cur={kind,label:m[1].trim(),text:""}; raw.push(cur); last=m.index+m[0].length;
  }
  const tail=gfTidyClean(src.slice(last)); if(cur) cur.text=tail; else if(tail) raw.push({kind:"pre",label:"",text:tail});
  // Kurze Felder enden am ersten Absatzwechsel, der Rest wird wieder Kontext
  const out=[];
  for(const s of raw){
    if(GF_TIDY_SHORT.has(s.kind)){ const k=s.text.search(/\n\s*\n/); if(k>0){ out.push({...s,text:s.text.slice(0,k).trim()}); const rest=gfTidyClean(s.text.slice(k)); if(rest) out.push({kind:"pre",label:"",text:rest}); continue; } }
    out.push(s);
  }
  return out.filter(s=>s.kind!=="pre"||s.text);
}
function gfTidyHasMarkers(text){ for(const m of (text||"").matchAll(GF_TIDY_LABEL_RE)) if(gfTidyKind(m[1])) return true; return false; }
function gfFirstSentence(s, max=180){ const t=(s||"").replace(/\s+/g," ").trim(); if(!t) return ""; let m=t.match(/^.{20,}?[.!?](?=\s|$)/); if(m && m[0].length<45){ const m2=t.match(/^.{45,}?[.!?](?=\s|$)/); if(m2 && m2[0].length<=max) m=m2; } const out=(m?m[0]:t); return out.length>max?out.slice(0,max-1).trimEnd()+"…":out; }
function gfTidyTopic(t){
  const title=(t.title||"").trim(), context=(t.context||"").trim();
  const titleDump=gfTidyHasMarkers(title) || title.length>140;
  const segs=(titleDump?gfTidySegments(title):[]).concat(gfTidySegments(context));
  if(!segs.some(s=>s.kind!=="pre")) return null;
  const pick=k=>segs.filter(s=>s.kind===k);
  const found=[...new Set(segs.filter(s=>s.kind!=="pre").map(s=>s.label))];
  const ch={};
  // Titel
  let newTitle=pick("title").map(s=>s.text).find(Boolean)||"";
  if(!newTitle && titleDump){ const ab=pick("about")[0]; newTitle=gfFirstSentence(ab?ab.text:title,120); }
  if(newTitle){ newTitle=newTitle.replace(/\s+/g," ").replace(/[.:]\s*$/,"").slice(0,300); if(newTitle!==title && (titleDump||!title)) ch.title=newTitle; }
  // Kontext neu zusammensetzen: Vorspann + Worum/Stand… (Label nur, wenn es nicht „Worum geht es“ ist) + Warum ins Weekly
  const ctxParts=[];
  segs.forEach(s=>{ if(s.kind==="pre"){ if(s.text && s.text!==title) ctxParts.push(s.text); return; } if(s.kind!=="about"||!s.text) return; const plain=/^(worum|zusammenfassung|kurz|kontext|hintergrund|lage|ausgangslage)/i.test(s.label); ctxParts.push(plain?s.text:(s.label+": "+s.text)); });
  pick("why").forEach(s=>{ if(s.text) ctxParts.push("Warum ins Weekly: "+s.text); });
  const newCtx=ctxParts.join("\n\n").trim();
  if(newCtx!==context) ch.context=newCtx;
  // Ein Satz
  if(!(t.short_description||"").trim()){ const ab=segs.find(s=>(s.kind==="about"||s.kind==="pre")&&s.text&&s.text!==title); const sd=gfFirstSentence(ab?ab.text:"",180); if(sd && sd!==(ch.title||title)) ch.short_description=sd; }
  // Nächster Schritt
  const nx=pick("next").map(s=>s.text).filter(Boolean); if(nx.length){ const cur=(t.next_action||"").trim(); const add=nx.filter(x=>!cur.includes(x)); if(add.length) ch.next_action=[cur,...add].filter(Boolean).join("\n"); }
  // Verantwortung
  const ow=pick("owner").map(s=>s.text).find(Boolean); if(ow && !(t.owner||"").trim()) ch.owner=ow.split(/[\n;]/)[0].slice(0,120);
  // Entscheidung
  const dc=pick("decision").map(s=>s.text).filter(Boolean); if(dc.length && !(t.decision||"").trim()) ch.decision=dc.join("\n");
  // Notizen (anhängen)
  const nt=pick("notes").filter(s=>s.text).map(s=>s.label.replace(/^eingang$/i,"Eingang")+": "+s.text); if(nt.length){ const cur=(t.notes||"").trim(); const add=nt.filter(x=>!cur.includes(x)); if(add.length) ch.notes=[cur,...add].filter(Boolean).join("\n"); }
  if(!Object.keys(ch).length) return null;
  return { changes:ch, found };
}
const GF_TIDY_FIELDS={ title:"Titel", short_description:"Ein Satz", context:"Kontext", next_action:"Nächster Schritt", owner:"Verantwortung", decision:"Entscheidung", notes:"Notizen" };
