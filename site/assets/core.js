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
const GF_AVATAR={ Alex:"/assets/img/avatar-alex.webp", Lea:"/assets/img/avatar-lea.webp" };
function gfAvatarTag(who, cls="av"){ const w=(who||"").trim(); const src=GF_AVATAR[w]; return src?`<img class="${cls}" src="${src}" alt="" width="32" height="32" loading="lazy">`:""; }
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
        <a class="brand" href="index.html"><div class="mark pic"><img src="/assets/img/burg-144.png" srcset="/assets/img/burg-288.png 2x" alt="" width="36" height="36"></div><div class="brand-txt"><h1>${GF_APP_NAME}</h1><div class="meta">${GF_APP_SUB}</div></div></a>
        <button class="sb-toggle" id="navToggle" aria-label="Menü einklappen" title="Menü einklappen">${GF_ICONS.chev}</button>
        <button class="sb-close" id="navClose" aria-label="Menü schließen">${GF_ICONS.x}</button>
      </div>
      <nav class="nav sb-nav" aria-label="Hauptnavigation">${groups}</nav>
      <div class="sb-foot">
        <div class="tb-ctl">
          ${themeSw("themeSw")}
          <div class="whoami" id="whoSw" role="group" aria-label="Aktive Person"><span>als</span><button data-w="Alex">${gfAvatarTag("Alex")}<span>Alex</span></button><button data-w="Lea">${gfAvatarTag("Lea")}<span>Lea</span></button></div>
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
  el.className="hero"+(opts.compact?" compact":"")+(opts.slim?" slim":"");
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
  L.push(`Erstellt mit Das Hohe Haus · hohes-haus.netlify.app`);
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

/* ===========================================================
   V19 (15.09.2026) · Neuigkeiten schlank: Laufband, Detailfenster, Gesehen-Marke.
   Wird von neuigkeiten.html und index.html genutzt. Die Marke „gesehen“ liegt je Person in localStorage gf_news_seen_<Person>.
   =========================================================== */
const GF_NEWS_SRC={ notiz:"Notiz", mail:"Mail", asana:"Asana", kalender:"Termin", entscheidung:"Entscheidung", protokoll:"Protokoll", manuell:"manuell" };
function gfNewsSeenKey(){ return "gf_news_seen_"+gfWho(); }
function gfNewsLastSeen(){ try{ return localStorage.getItem(gfNewsSeenKey())||"1970-01-01"; }catch(e){ return "1970-01-01"; } }
function gfNewsMarkSeen(){ try{ localStorage.setItem(gfNewsSeenKey(), new Date().toISOString()); }catch(e){} }
function gfNewsIsNew(x){ return (x.created_at||"")>gfNewsLastSeen(); }
/* Kurze Zeitangabe: „heute 14:20“, „gestern 09:10“, „Mo 08.09.“, Zukunft „Do 17.09. 10:00“ */
function gfNewsWhen(iso){
  if(!iso) return "";
  const d=new Date(iso), t=new Date(); const day=new Date(d); day.setHours(0,0,0,0); t.setHours(0,0,0,0);
  const diff=Math.round((day-t)/86400000); const hm=d.toLocaleTimeString("de-DE",{hour:"2-digit",minute:"2-digit"});
  if(diff===0) return "heute "+hm; if(diff===-1) return "gestern "+hm; if(diff===1) return "morgen "+hm;
  const wd=d.toLocaleDateString("de-DE",{weekday:"short",day:"2-digit",month:"2-digit"}).replace(",","");
  return diff>1 ? wd+" "+hm : wd;
}
/* Personen als Avatare (Alex, Lea), sonst als Text */
function gfNewsWho(who, cls="av-k"){
  const names=(who||"").split(/\s*(?:,|&|\+|\/| und )\s*/).map(s=>s.trim()).filter(Boolean); if(!names.length) return "";
  const av=names.map(n=>gfAvatarTag(n,cls)).filter(Boolean).join("");
  const rest=names.filter(n=>!GF_AVATAR[n]);
  return `<span class="nw-who" title="${gfEsc(names.join(", "))}">${av}${rest.length?`<span class="nw-who-t">${gfEsc(rest.join(", "))}</span>`:""}</span>`;
}
/* Detailfenster zu einem Ereignis (Ticker oder Kandidat) */
function gfNewsModal(x, opts={}){
  let m=document.getElementById("gfModal");
  if(!m){ m=document.createElement("div"); m.id="gfModal"; m.className="modal-back"; document.body.appendChild(m); }
  const topic=opts.topic||null;
  m.innerHTML=`<div class="modal nw-modal" role="dialog" aria-modal="true" aria-label="${gfEsc(x.title)}">
    <div class="modal-h"><h3>${gfEsc(x.title)}</h3><button class="icon-btn" data-x title="Schließen">✕</button></div>
    <div class="nw-mbody">
      <div class="nw-mmeta"><span class="nw-src src-${gfEsc(x.source)}">${GF_NEWS_SRC[x.source]||gfEsc(x.source||"")}</span><span>${gfEsc(gfNewsWhen(x.happened_at))}</span>${x.who?gfNewsWho(x.who):""}${opts.strand?`<span>${gfEsc(opts.strand)}</span>`:""}${x.relevance?`<span class="nw-rel rel-${x.relevance}">${x.relevance}</span>`:""}</div>
      ${x.body?`<p>${gfEsc(x.body)}</p>`:""}
      ${x.quote?`<blockquote>„${gfEsc(x.quote)}“</blockquote>`:""}
      <div class="tk-links">${x.source_url?`<a href="${gfEsc(x.source_url)}" target="_blank" rel="noopener">${gfEsc(x.source_title||"Quelle öffnen")} ↗</a>`:(x.source_title?`<span class="nw-srct">${gfEsc(x.source_title)}</span>`:"")}${topic?`<a href="board.html?topic=${topic.id}">Thema: ${gfEsc(topic.title.slice(0,60))}</a>`:""}${opts.links||""}</div>
    </div>
    <div class="modal-f">${opts.actions||""}<button class="btn btn-ghost" data-x style="margin-left:auto">Schließen</button></div>
  </div>`;
  m.classList.add("open");
  m.querySelectorAll("[data-x]").forEach(b=>b.onclick=()=>m.classList.remove("open"));
  m.onclick=e=>{ if(e.target===m) m.classList.remove("open"); };
  const esc=e=>{ if(e.key==="Escape"){ m.classList.remove("open"); document.removeEventListener("keydown",esc); } }; document.addEventListener("keydown",esc);
  return m;
}
/* Auswahl fürs Laufband: neu seit dem letzten Besuch, sonst die letzten 24 Stunden, sonst die letzten sechs; höchstens 20, neueste zuerst */
function gfBandPick(items){
  const t=items.filter(x=>x.kind==="ticker").sort((a,b)=>a.happened_at<b.happened_at?1:-1);
  const now=new Date(), nowIso=now.toISOString();
  const past=t.filter(x=>x.happened_at<=nowIso);
  let pick=past.filter(gfNewsIsNew); let mode="neu";
  if(!pick.length){ const d=new Date(now-86400000).toISOString(); pick=past.filter(x=>x.happened_at>=d); mode="24h"; }
  if(!pick.length){ pick=past.slice(0,6); mode="zuletzt"; }
  return { items:pick.slice(0,20), mode };
}
/* Laufband: eine Zeile, läuft von rechts nach links, hält bei Berührung, Klick öffnet das Ereignis.
   Bei „Bewegung reduzieren“ steht es und lässt sich seitlich schieben. Passt der Inhalt in die Breite, läuft nichts. */
function gfMountBand(el, pick, opts={}){
  if(!el) return; const items=pick.items||[]; const mode=pick.mode||"neu";
  if(!items.length){ el.innerHTML=""; el.hidden=true; return; }
  el.hidden=false;
  const label={neu:"Neu für dich", "24h":"Letzte 24 Stunden", zuletzt:"Zuletzt"}[mode]||"Neu";
  const item=x=>`<button type="button" class="bi src-${gfEsc(x.source)} ${gfNewsIsNew(x)?"is-new":""}" data-id="${x.id}" title="${gfEsc(GF_NEWS_SRC[x.source]||x.source)}: ${gfEsc(x.title)}"><span class="bt">${gfEsc(gfNewsWhen(x.happened_at))}</span>${gfNewsWho(x.who,"av-b")}<span class="bx">${gfEsc(x.title)}</span></button>`;
  const set=items.map(item).join("");
  const head=opts.link?`<a class="band-l" href="${opts.link}" title="Neuigkeiten öffnen"><span class="band-lt">${label}</span><b>${items.length}</b></a>`:`<span class="band-l"><span class="band-lt">${label}</span><b>${items.length}</b></span>`;
  el.innerHTML=`<div class="band" role="region" aria-label="Laufband Neuigkeiten">${head}<div class="band-vp"><div class="band-track"><div class="band-set">${set}</div><div class="band-set dup" aria-hidden="true">${set}</div></div></div><button type="button" class="band-p" aria-label="Laufband anhalten" title="Anhalten / weiter">❚❚</button></div>`;
  const band=el.querySelector(".band"), track=el.querySelector(".band-track"), vp=el.querySelector(".band-vp"), p=el.querySelector(".band-p");
  const fit=()=>{ const w=el.querySelector(".band-set").getBoundingClientRect().width; const fits=w<=vp.getBoundingClientRect().width-8; band.classList.toggle("static",fits); track.style.setProperty("--dur", Math.max(18, Math.round(w/55))+"s"); p.hidden=fits; };
  requestAnimationFrame(fit); if(!el.__bandRO && window.ResizeObserver){ el.__bandRO=new ResizeObserver(()=>fit()); el.__bandRO.observe(vp); }
  p.onclick=()=>{ const on=band.classList.toggle("paused"); p.textContent=on?"▶":"❚❚"; p.setAttribute("aria-label",on?"Laufband weiterlaufen lassen":"Laufband anhalten"); };
  el.querySelectorAll(".bi").forEach(b=>b.onclick=()=>{ const x=items.find(i=>i.id===b.dataset.id); if(!x) return; if(opts.onOpen) opts.onOpen(x); else gfNewsModal(x,{links:opts.link?`<a href="${opts.link}">Alle Neuigkeiten</a>`:""}); });
}
/* Startseite: Laufband laden (Ticker der letzten 14 Tage) */
async function gfLoadBand(el, opts={}){
  if(!el) return;
  try{ const since=new Date(Date.now()-14*86400000).toISOString(); const d=await gfApi("news_list",{kinds:["ticker"],since,limit:300}); gfMountBand(el, gfBandPick(d.items||[]), opts); }
  catch(e){ el.innerHTML=""; el.hidden=true; }
}

/* ===========================================================
   V20 (16.09.2026) · Team, letzte 3 Monate: Schnelleinschätzung aus der Team- und Partneranalyse auf der Startseite.
   Liest die Aktion overview der Edge Function „tpa“ (gleiches Passwort). Faktenlage = Belege nach Richtung und Monat;
   Trend = Gesamtwert (Mittel der sechs Werte, im Browser gerechnet) letzte bestätigte Einschätzung gegen den jüngeren Stand;
   stammt der jüngere Stand aus einem unbestätigten Entwurf, ist er als Entwurf gekennzeichnet. Nichts wird hier geschrieben.
   =========================================================== */
const GF_TPA_FN="https://bnfmupnmqyrcltrphfak.supabase.co/functions/v1/tpa";
const GF_TPA_URL="https://team-partner-analyse.netlify.app";
const GF_TPA_AVATAR={ alex:"Alex", lea:"Lea" };
async function gfTpaApi(action, payload){
  const res=await fetch(GF_TPA_FN,{ method:"POST", headers:{ "Content-Type":"application/json" }, body:JSON.stringify({ action, password:gfPW(), payload }) });
  let d={}; try{ d=await res.json(); }catch(e){}
  if(res.status===401) throw { auth:true, message:"Die Analyse kennt dieses Passwort nicht." };
  if(!res.ok) throw new Error(d.error||("HTTP "+res.status));
  return d;
}
function gfTeamOverall(scores){ const v=Object.values(scores||{}).filter(x=>typeof x==="number"); if(!v.length) return null; return Math.round(v.reduce((a,b)=>a+b,0)/v.length); }
function gfTeamMonthLabel(m){ const d=new Date(m+"-01T00:00:00"); return d.toLocaleDateString("de-DE",{month:"short"}).replace(".",""); }
function gfTeamShortDate(iso){ return iso?new Date(iso.length===10?iso+"T00:00:00":iso).toLocaleDateString("de-DE",{day:"2-digit",month:"2-digit"}):""; }
/* Trend je Person: Basis = letzte bestätigte Einschätzung; Stand = jüngerer Entwurf (gekennzeichnet) oder, ohne Entwurf, die letzte bestätigte gegen die vorherige */
function gfTeamTrend(p){
  const latest=p.latest, draft=p.draft, prev=p.previous;
  if(draft && (!latest || draft.assessed_at>latest.assessed_at)){ return { base:latest?gfTeamOverall(latest.scores):null, baseOn:latest?latest.assessed_at:null, cur:gfTeamOverall(draft.scores), curOn:draft.assessed_at, curScores:draft.scores, baseScores:latest?latest.scores:{}, draft:true }; }
  if(latest && prev){ return { base:gfTeamOverall(prev.scores), baseOn:prev.assessed_at, cur:gfTeamOverall(latest.scores), curOn:latest.assessed_at, curScores:latest.scores, baseScores:prev.scores, draft:false }; }
  if(latest){ return { base:null, baseOn:null, cur:gfTeamOverall(latest.scores), curOn:latest.assessed_at, curScores:latest.scores, baseScores:{}, draft:false }; }
  return null;
}
function gfTeamTrendHTML(t){
  if(!t || t.cur==null) return `<span class="tm-none" title="Noch keine Einschätzung">–</span>`;
  const d=(t.base!=null)?t.cur-t.base:null;
  const arrow=d==null?"":(Math.abs(d)<2?`<span class="tm-flat">·</span>`:(d>0?`<span class="tm-up">▲${d}</span>`:`<span class="tm-down">▼${Math.abs(d)}</span>`));
  const title=d==null?`Gesamtwert ${t.cur} (Stand ${gfTeamShortDate(t.curOn)})`:`${t.base} (${gfTeamShortDate(t.baseOn)}) → ${t.cur} (${gfTeamShortDate(t.curOn)})${t.draft?", Stand aus unbestätigtem Entwurf":""}`;
  return `<span class="tm-trend ${t.draft?"is-draft":""}" title="${gfEsc(title)}"><b>${t.cur}</b>${arrow}${t.draft?`<i class="tm-dtag">Entwurf</i>`:""}</span>`;
}
function gfTeamMonths(ev, months, max){
  return `<span class="tm-months" aria-hidden="true">${months.map(m=>{ const o=(ev.months||{})[m]||{stuetzt:0,neutral:0,schwaecht:0}; const tot=o.stuetzt+o.neutral+o.schwaecht; const h=x=>max?Math.round(x/max*100):0; return `<span class="tm-col" title="${gfEsc(gfTeamMonthLabel(m))}: ${tot} Belege (${o.stuetzt} stützen, ${o.neutral} neutral, ${o.schwaecht} schwächen)"><span class="tm-stack">${o.schwaecht?`<i class="w" style="height:${h(o.schwaecht)}%"></i>`:""}${o.neutral?`<i class="n" style="height:${h(o.neutral)}%"></i>`:""}${o.stuetzt?`<i class="s" style="height:${h(o.stuetzt)}%"></i>`:""}</span><small>${gfEsc(gfTeamMonthLabel(m))}</small></span>`; }).join("")}</span>`;
}
function gfTeamBar(ev){
  const tot=ev.total||0; if(!tot) return `<span class="tm-bar empty" title="Keine Belege im Zeitraum"><small>keine Belege</small></span>`;
  const w=x=>Math.round(x/tot*100);
  return `<span class="tm-bar" title="${tot} Belege: ${ev.stuetzt} stützen, ${ev.neutral} neutral, ${ev.schwaecht} schwächen${ev.proposals?`, ${ev.proposals} ungeprüft`:""}"><span class="tm-seg s" style="width:${w(ev.stuetzt)}%"></span><span class="tm-seg n" style="width:${w(ev.neutral)}%"></span><span class="tm-seg w" style="width:${w(ev.schwaecht)}%"></span></span><span class="tm-nums"><b>${tot}</b><span class="s">${ev.stuetzt}</span><span class="w">${ev.schwaecht}</span></span>`;
}
function gfTeamAvatar(p){
  const who=GF_TPA_AVATAR[p.id]; const av=who?gfAvatarTag(who,"tm-av"):""; if(av) return av;
  return `<span class="tm-ini" aria-hidden="true">${gfEsc((p.initials||p.name||"?").slice(0,2))}</span>`;
}
function gfTeamRow(p, months, max, dims){
  const t=gfTeamTrend(p); const ev=p.evidence||{total:0};
  const deltas=t&&t.base!=null?dims.map(d=>{ const a=t.baseScores?.[d.key], b=t.curScores?.[d.key]; if(typeof a!=="number"||typeof b!=="number") return ""; const x=b-a; return `<span class="tm-dim ${x>1?"up":(x<-1?"down":"")}">${gfEsc(d.short_label)} <b>${b}</b>${Math.abs(x)>=2?`<i>${x>0?"+":""}${x}</i>`:""}</span>`; }).join(""):"";
  const link=`${GF_TPA_URL}/person.html?id=${encodeURIComponent(p.id)}`;
  return `<article class="tm" data-id="${gfEsc(p.id)}">
    <button type="button" class="tm-row" aria-expanded="false">
      ${gfTeamAvatar(p)}
      <span class="tm-name"><b>${gfEsc(p.name)}</b><small>${gfEsc((p.role||"").split(/[·;(]/)[0].trim())}</small></span>
      ${gfTeamMonths(ev,months,max)}
      <span class="tm-belege">${gfTeamBar(ev)}</span>
      ${gfTeamTrendHTML(t)}
      <span class="tm-last">${ev.last_on?`zuletzt ${gfEsc(gfTeamShortDate(ev.last_on))}`:""}</span>
      <span class="chev" aria-hidden="true"></span>
    </button>
    <div class="tm-more">
      ${ev.last_summary?`<p class="tm-sum"><span>Letzter Beleg (${gfEsc(gfTeamShortDate(ev.last_on))}):</span> ${gfEsc(ev.last_summary)}</p>`:""}
      ${deltas?`<div class="tm-dims">${deltas}</div>`:(t&&t.cur!=null?`<div class="tm-dims">${dims.map(d=>{ const b=t.curScores?.[d.key]; return typeof b==="number"?`<span class="tm-dim">${gfEsc(d.short_label)} <b>${b}</b></span>`:""; }).join("")}</div>`:"")}
      <div class="tk-links">${t?`<span class="nw-srct">${t.draft?`Stand aus KI-Entwurf vom ${gfEsc(gfTeamShortDate(t.curOn))}, noch nicht bestätigt${t.baseOn?`; Basis bestätigt ${gfEsc(gfTeamShortDate(t.baseOn))}`:""}`:`Bestätigt ${gfEsc(gfTeamShortDate(t.curOn))}${t.baseOn?`, davor ${gfEsc(gfTeamShortDate(t.baseOn))}`:""}`}${ev.proposals?` · ${ev.proposals} Belege ungeprüft`:""}</span>`:""}<a href="${link}" target="_blank" rel="noopener">In der Analyse öffnen ↗</a></div>
    </div>
  </article>`;
}
function gfRenderTeam(el, data, circle){
  const people=(data.people||[]).filter(p=>p.circle===circle).sort((a,b)=>(a.is_leader?0:1)-(b.is_leader?0:1)||(b.evidence?.total||0)-(a.evidence?.total||0)||a.name.localeCompare(b.name,"de"));
  const months=data.months||[]; const dims=(data.dimensions||[]).slice().sort((a,b)=>(a.sort||0)-(b.sort||0));
  let max=0; people.forEach(p=>months.forEach(m=>{ const o=(p.evidence?.months||{})[m]; if(o) max=Math.max(max,o.stuetzt+o.neutral+o.schwaecht); }));
  const body=el.querySelector(".tm-list");
  body.innerHTML=people.length?people.map(p=>gfTeamRow(p,months,max,dims)).join(""):`<div class="empty soft">Keine aktiven Personen in diesem Kreis.</div>`;
  const n=el.querySelector(".tm-n"); if(n) n.textContent=people.length;
  const drafts=people.filter(p=>gfTeamTrend(p)?.draft).length; const hint=el.querySelector(".tm-hint"); if(hint) hint.textContent=drafts?`${drafts} von ${people.length} Trends aus unbestätigten Entwürfen`:"";
  body.querySelectorAll(".tm").forEach(row=>{ const b=row.querySelector(".tm-row"); b.onclick=e=>{ if(e.target.closest("a")) return; const o=row.classList.toggle("open"); b.setAttribute("aria-expanded",o?"true":"false"); }; });
  gfStagger(body,".tm");
}
async function gfLoadTeam(el){
  if(!el) return;
  const circles=[["team","Team"],["geschaeftsfuehrung","GF"],["partner","Partner"],["support","Support"]];
  let circle="team"; try{ circle=localStorage.getItem("gf_team_circle")||"team"; }catch(e){}
  let open=true; try{ open=localStorage.getItem("gf_nw_team")!=="0"; }catch(e){}
  el.innerHTML=`<details class="nw-sec tm-sec" ${open?"open":""}>
    <summary><h2>Team, letzte 3 Monate</h2><span class="n tm-n"></span><span class="hint">Belege nach Richtung je Monat, Gesamtwert und Trend aus der Team- und Partneranalyse. Klick öffnet Details.</span><span class="tm-hint"></span><span class="chev"></span></summary>
    <div class="nw-body">
      <div class="tm-top"><div class="segs tm-segs">${circles.map(([k,l])=>`<button type="button" class="seg ${k===circle?"on":""}" data-c="${k}">${l}</button>`).join("")}</div><span class="tm-legend"><i class="s"></i>stützt <i class="n"></i>neutral <i class="w"></i>schwächt <i class="d"></i>Entwurf</span><a class="btn btn-sm btn-ghost" href="${GF_TPA_URL}" target="_blank" rel="noopener">Zur Analyse ↗</a></div>
      <div class="tm-list"><div class="loading">lädt …</div></div>
    </div>
  </details>`;
  const det=el.querySelector("details"); det.addEventListener("toggle",()=>{ try{ localStorage.setItem("gf_nw_team",det.open?"1":"0"); }catch(e){} });
  let data=null;
  try{ data=await gfTpaApi("overview",{days:90}); }
  catch(e){ el.querySelector(".tm-list").innerHTML=`<div class="empty soft">${gfEsc(e.message||"Die Analyse ist gerade nicht erreichbar.")}${e.auth?` <a href="${GF_TPA_URL}" target="_blank" rel="noopener">Analyse öffnen ↗</a>`:""}</div>`; return; }
  gfRenderTeam(el,data,circle);
  el.querySelectorAll(".tm-segs .seg").forEach(b=>b.onclick=()=>{ circle=b.dataset.c; el.querySelectorAll(".tm-segs .seg").forEach(x=>x.classList.toggle("on",x===b)); try{ localStorage.setItem("gf_team_circle",circle); }catch(e){} gfRenderTeam(el,data,circle); });
}
