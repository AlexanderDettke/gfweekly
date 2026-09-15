/* ===========================================================
   Das Hohe Haus · Habitat-Punkte (V17)
   Spielschicht über dem Cockpit: Einchecken beim Entsperren,
   Serie, Taler-Zähler in der Kopfzeile, aufsteigende Marker
   bei jedem Gewinn, Tageskarte, Abzeichen- und Stufenkarten.
   Die Vergabe passiert serverseitig (Edge Function v22); hier
   wird nur gezeigt, was die Antworten unter `gains` und `state`
   mitbringen. Bilder: /assets/game/*.webp (Asset-Brief 9).
   Zum Testen: ?game=karte | ?game=abzeichen | ?game=stufe
   =========================================================== */
(function(){
  const REDUCED = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s,r=document)=>r.querySelector(s);
  const params = new URLSearchParams(location.search); const FORCE = params.get("game") || "";
  const DIR="/assets/game/";
  const HAVE=new Set(("abzeichen-altlast abzeichen-erste-entscheidung abzeichen-fruehaufsteher abzeichen-jahresring abzeichen-kurz-und-knackig abzeichen-leere-agenda abzeichen-marathon abzeichen-meilenstein abzeichen-merle abzeichen-protokollant abzeichen-ritualmeister abzeichen-wochenmail abzeichen-zehn-entscheidungen aufgabe-erledigt aufgabe-haupt aufgabe-neben entscheidungen-kopf habitat-1-lichtung habitat-2-lagerplatz habitat-3-dorf habitat-4-festival habitat-5-habitat kpi-punkte phase-endspurt phase-fruehbucher phase-planung-szene phase-produktion-szene phase-regulaer phase-verbesserung-szene portraet-lea punkte-altlast punkte-besprechung punkte-entscheidung punkte-levelup punkte-meilenstein punkte-ritual punkte-taler punkte-thema rang-bronze rang-gold rang-silber runde schatzbuch-stempel-amsel schatzbuch-stempel-baum schatzbuch-stempel-feuer schatzbuch-stempel-stern schatzbuch-stempel-wasser schatzbuch-stempel-zelt spalte-entschieden spalte-erledigt spalte-in-klaerung spalte-zu-besprechen streak-1-glut streak-2-flamme streak-3-feuer streak-4-fest tempo-1 tempo-2 tempo-4 tipp uebergang-jahresabschluss uebergang-planungsauftakt uebergang-produktionsfreigabe uebergang-retro weiter wochenmail-kopf zustand-fehler zustand-gespeichert zustand-leer zustand-suche-leer").split(" "));
  /* Bilder, die in Brief 9 noch fehlen, bekommen einen sinnvollen Ersatz */
  const FALLBACK={ "punkte-einchecken":"punkte-taler", "punkte-thema-neu":"punkte-thema", "punkte-saat":"punkte-thema", "punkte-bewegen":"weiter", "punkte-tagesziel":"aufgabe-erledigt", "punkte-wochenziel":"aufgabe-haupt",
    "abzeichen-drei-tage":"streak-2-flamme", "abzeichen-volle-woche":"streak-3-feuer", "abzeichen-ein-monat":"streak-4-fest", "abzeichen-saatgut":"punkte-thema", "abzeichen-gaertner":"punkte-thema", "abzeichen-vollstaendig":"aufgabe-erledigt", "abzeichen-tagesziel-serie":"aufgabe-erledigt", "portraet-alex":"" };
  function icon(key){ key=(key||"").toString(); if(HAVE.has(key)) return DIR+key+".webp"; const f=FALLBACK[key]; if(f&&HAVE.has(f)) return DIR+f+".webp"; return DIR+"punkte-taler.webp"; }
  function streakIcon(n){ return icon(n>=30?"streak-4-fest":n>=7?"streak-3-feuer":n>=3?"streak-2-flamme":"streak-1-glut"); }
  const BADGE_ALL=[["erste-entscheidung","Erste Entscheidung"],["zehn-entscheidungen","Zehn Entscheidungen"],["altlast","Altlast geräumt"],["meilenstein","Meilenstein gesetzt"],["protokollant","Protokollant"],["marathon","Marathon"],["kurz-und-knackig","Kurz und knackig"],["leere-agenda","Leere Agenda"],["ritualmeister","Ritualmeister"],["wochenmail","Vier Wochen Wochenmail"],["jahresring","Jahresring"],["drei-tage","Drei Tage in Folge"],["volle-woche","Volle Woche"],["ein-monat","Ein Monat"],["fruehaufsteher","Frühaufsteher"],["saatgut","Saatgut"],["gaertner","Gärtner"],["vollstaendig","Vollständig"],["tagesziel-serie","Tagesziel-Serie"]];
  const G = window.GF_GAME = { state:null, icon, streakIcon, badges:BADGE_ALL, localDay, refresh, showCard, celebrate };

  function localDay(d=new Date()){ const p=n=>String(n).padStart(2,"0"); return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`; }
  function who(){ return typeof gfWho==="function" ? gfWho() : "Alex"; }
  function esc(s){ return typeof gfEsc==="function"?gfEsc(s):String(s||""); }

  /* ---- gfApi umwickeln: Person und lokaler Tag mitschicken, Gewinne und Stand auswerten ---- */
  function wrapApi(){
    if(typeof gfApi!=="function" || gfApi.__game) return false;
    const orig=gfApi;
    const wrapped=async function(action, payload){
      const p=Object.assign({}, payload||{}); if(p.who==null) p.who=who(); if(p.local_day==null) p.local_day=localDay();
      const d=await orig(action, p);
      try{ if(d && d.state) setState(d.state); if(d && Array.isArray(d.gains) && d.gains.length) showGains(d.gains, !d.state); if(d && d.gains && d.gains.length && !d.state && action!=="score_get") refresh(); }catch(e){ console.warn("game", e); }
      return d;
    };
    wrapped.__game=true; window.gfApi=wrapped; gfApi=wrapped; return true;
  }

  /* ---- Stand ---- */
  function setState(s){
    if(!s) return; G.state=s; const st=s;
    renderTopbar(st);
    let prev=null; try{ prev=localStorage.getItem("gf_level"); }catch(e){}
    if(prev && st.level && st.level.key!==prev && levelIndex(st.level.key)>levelIndex(prev)) levelUp(st);
    try{ if(st.level) localStorage.setItem("gf_level", st.level.key); }catch(e){}
    document.dispatchEvent(new CustomEvent("gf-game",{detail:st}));
  }
  const LEVELS=["lichtung","lagerplatz","dorf","festival","habitat"];
  function levelIndex(k){ return LEVELS.indexOf(k); }
  async function refresh(){ try{ const d=await gfApi("score_get",{}); if(d && d.state) setState(d.state); }catch(e){} return G.state; }

  /* ---- Kopfzeile: Taler und Serie ---- */
  function renderTopbar(st){
    const ctl=$("#topbar .tb-ctl"); if(!ctl) return;
    let el=$("#gameBar", ctl);
    if(!el){ el=document.createElement("div"); el.id="gameBar"; el.className="gamebar"; ctl.prepend(el); }
    const lvl=st.level||{}; const nx=st.next; const pct=nx?Math.min(100,Math.round((st.total-(lvl.threshold||0))/((nx.threshold-(lvl.threshold||0))||1)*100)):100;
    const ttl=`${st.total} Habitat-Taler dieses Jahr · Stufe ${lvl.label||""}${nx?` · ${nx.threshold-st.total} bis ${nx.label}`:" · höchste Stufe erreicht"} · diese Woche ${st.weekPts}${st.rank?` (${st.rank})`:""}`;
    el.innerHTML=`<a class="taler" href="index.html#habitat" title="${esc(ttl)}"><img src="${icon("punkte-taler")}" alt="" width="22" height="22"><b id="talerN" data-n="${st.total}">${st.total}</b><span class="lvl"><span>${esc(lvl.label||"")}</span><i style="--p:${pct}%"></i></span></a>
      <span class="flame ${st.streak?"":"cold"}" title="${st.streak?`${who()}: Tag ${st.streak} in Folge`:`${who()}: heute noch nicht eingecheckt`}"><img src="${streakIcon(st.streak)}" alt="" width="22" height="22"><b>${st.streak||0}</b></span>`;
  }
  function bumpCounter(total){ const b=$("#talerN"); if(!b) return; const from=parseInt(b.dataset.n)||0; b.dataset.n=total; if(REDUCED){ b.textContent=total; return; } const t0=performance.now(); const ms=600; (function step(now){ const p=Math.min(1,(now-t0)/ms); const e=1-Math.pow(1-p,3); b.textContent=Math.round(from+(total-from)*e); if(p<1) requestAnimationFrame(step); })(t0); b.classList.add("pop"); setTimeout(()=>b.classList.remove("pop"),500); }

  /* ---- Gewinne zeigen: aufsteigende Marker, Abzeichenkarte ---- */
  function showGains(gains, bump){
    const mine=gains.filter(g=>g.points>0);
    const total=bump?mine.reduce((n,g)=>n+g.points,0):0;
    mine.forEach((g,i)=>setTimeout(()=>marker(g), i*220));
    const badges=gains.filter(g=>g.badge);
    badges.forEach((g,i)=>setTimeout(()=>showCard({ kind:"abzeichen", title:g.label.replace(/^Abzeichen: /,""), sub:`Neues Abzeichen für ${g.who==="Team"?"die Geschäftsleitung":g.who}. +${g.points} Taler.`, img:icon("abzeichen-"+g.badge), auto:7000 }), 600+i*900));
    if(G.state && total){ G.state.total+=total; setTimeout(()=>bumpCounter(G.state.total), 300); }
  }
  function marker(g){
    let host=$("#gameMarks"); if(!host){ host=document.createElement("div"); host.id="gameMarks"; host.className="gmarks"; document.body.appendChild(host); }
    const el=document.createElement("div"); el.className="gmark"; el.innerHTML=`<img src="${icon(g.icon)}" alt=""><b>+${g.points}</b><span>${esc(g.label||g.kind)}</span>`;
    host.appendChild(el); setTimeout(()=>el.remove(), REDUCED?2200:2600);
  }

  /* ---- Karten in der Bildmitte (Tageskarte, Abzeichen, Stufe) ---- */
  const QUEUE=[];
  function showCard(o){
    if($("#gameCard")){ QUEUE.push(o); return null; }
    const el=document.createElement("div"); el.id="gameCard"; el.className="gcard-back"; el.setAttribute("role","dialog"); el.setAttribute("aria-label",o.title||"");
    el.innerHTML=`<div class="gcard ${o.kind||""}">${o.img?`<div class="gc-pic ${o.wide?"wide":""}"><img src="${o.img}" alt=""></div>`:""}<div class="gc-body">${o.eyebrow?`<div class="gc-eye">${esc(o.eyebrow)}</div>`:""}<h3>${esc(o.title||"")}</h3>${o.sub?`<p>${o.sub}</p>`:""}${o.rows?`<div class="gc-rows">${o.rows}</div>`:""}<div class="gc-f">${o.actions||""}<button class="btn btn-sm btn-primary" data-close>Weiter</button></div></div></div>`;
    document.body.appendChild(el);
    const close=()=>{ el.remove(); const n=QUEUE.shift(); if(n) setTimeout(()=>showCard(n),250); };
    el.addEventListener("click",e=>{ if(e.target===el || e.target.closest("[data-close]")) close(); });
    document.addEventListener("keydown",function k(e){ if(e.key==="Escape"){ close(); document.removeEventListener("keydown",k); } });
    if(o.auto) setTimeout(()=>{ if(el.isConnected && !el.matches(":hover")) close(); }, o.auto);
    return el;
  }
  function celebrate(){ document.dispatchEvent(new CustomEvent("gf-egg-konfetti")); }
  function levelUp(st){
    const lvl=st.level; celebrate();
    showCard({ kind:"stufe", eyebrow:"Stufenaufstieg", title:`Aus der ${prevLabel(lvl.key)} ist ${withArticle(lvl.label)} geworden`, sub:`${st.total} Habitat-Taler im gemeinsamen Topf.${st.next?` Nächste Stufe ${st.next.label} ab ${st.next.threshold}.`:" Das Habitat steht."}`, img:icon(lvl.image||("habitat-"+(levelIndex(lvl.key)+1))), wide:true });
  }
  const LEVEL_LABEL={lichtung:"Lichtung",lagerplatz:"Lagerplatz",dorf:"Dorf",festival:"Festival",habitat:"Habitat"};
  function prevLabel(k){ const i=levelIndex(k); return i>0?({lichtung:"Lichtung",lagerplatz:"dem Lagerplatz",dorf:"dem Dorf",festival:"dem Festival"})[LEVELS[i-1]]:"Lichtung"; }
  function withArticle(l){ return ({Lagerplatz:"ein Lagerplatz",Dorf:"ein Dorf",Festival:"ein Festival",Habitat:"ein Habitat"})[l]||l; }

  /* ---- Einchecken: einmal je Person und Tag, beim ersten Öffnen nach dem Entsperren ---- */
  let checking=false;
  async function checkin(force){
    if(checking) return; if(typeof gfPW!=="function" || !gfPW()) return;
    const w=who(), day=localDay(), key=`gf_ci_${w}_${day}`;
    let done=false; try{ done=localStorage.getItem(key)==="1"; }catch(e){}
    if(done && !force){ if(!G.state || G.state.who!==w) await refresh(); return; }
    checking=true;
    try{
      const d=await gfApi("checkin",{who:w, local_day:day, hour:new Date().getHours()});
      try{ localStorage.setItem(key,"1"); }catch(e){}
      if(d.first || FORCE==="karte") tageskarte(d);
    }catch(e){ console.warn("checkin", e); }
    checking=false;
  }
  function tageskarte(d){
    const st=d.state||G.state||{}; const w=who(); const h=new Date().getHours(); const gruss=h<11?"Guten Morgen":h<18?"Guten Tag":"Guten Abend";
    const streak=d.streak||st.streak||1;
    const bonus=(d.gains||[]).filter(g=>/^serie_/.test(g.kind)).map(g=>`<div class="gc-row"><img src="${icon(g.icon)}" alt=""><span>${esc(g.label)}</span><b>+${g.points}</b></div>`).join("");
    const goal=st.goal?`<div class="gc-row ${st.goal.done?"done":""}"><img src="${icon("punkte-tagesziel")}" alt=""><span>Tagesziel: ${esc(st.goal.label)}</span><b>${st.goal.done?"erfüllt":"+10"}</b></div>`:"";
    const wk=st.weekGoal?`<div class="gc-row ${st.weekGoal.done?"done":""}"><img src="${icon("punkte-wochenziel")}" alt=""><span>Wochenziel: ${esc(st.weekGoal.label)}</span><b>${st.weekGoal.done?"erfüllt":"+40"}</b></div>`:"";
    showCard({ kind:"tag", eyebrow:`${w} · ${new Date().toLocaleDateString("de-DE",{weekday:"long",day:"numeric",month:"long"})}`, title:`${gruss}, ${w}. ${streak>1?`Tag ${streak} in Folge.`:"Schön, dass du da bist."}`, sub:`Eingecheckt, +5 Habitat-Taler. ${st.total?`Im Topf: ${st.total}, Stufe ${esc(st.level?.label||"")}.`:""}`, img:streakIcon(streak),
      rows:`<div class="gc-row"><img src="${icon("punkte-einchecken")}" alt=""><span>Eingecheckt</span><b>+5</b></div>${bonus}${goal}${wk}`, auto:9000 });
  }

  /* ---- Anlaufen: Kopfzeile wird per JS gebaut, deshalb beobachten ---- */
  wrapApi();
  function boot(){
    if(typeof gfApi!=="function") return;
    const mo=new MutationObserver(()=>{ if($("#topbar .tb-ctl") && !$("#gameBar")){ if(G.state) renderTopbar(G.state); checkin(); } });
    mo.observe(document.body,{childList:true,subtree:true});
    if($("#topbar .tb-ctl")) checkin();
    document.addEventListener("gf-who",()=>{ checkin(); });
    if(FORCE==="abzeichen") setTimeout(()=>showCard({kind:"abzeichen",title:"Erste Entscheidung",sub:"Neues Abzeichen für die Geschäftsleitung. +25 Taler.",img:icon("abzeichen-erste-entscheidung"),auto:7000}),1500);
    if(FORCE==="stufe") setTimeout(()=>levelUp({level:{key:"lagerplatz",label:"Lagerplatz",image:"habitat-2-lagerplatz"},total:612,next:{label:"Dorf",threshold:1800}}),1500);
    if(FORCE==="marker") setTimeout(()=>showGains([{kind:"thema_erledigt",points:10,label:"Thema erledigt",icon:"punkte-thema"},{kind:"altlast",points:15,label:"Altlast geräumt",icon:"punkte-altlast"}]),1500);
  }
  if(document.readyState!=="loading") boot(); else document.addEventListener("DOMContentLoaded",boot);
})();
