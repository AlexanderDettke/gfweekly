/* Kompass Vorstandsbüro. Gemeinsame Daten kommen ausschließlich vom geschützten Server. */
(() => {
  const ENDPOINT='https://bnfmupnmqyrcltrphfak.supabase.co/functions/v1/vorstand';
  const LABELS={pruefen:'Zu prüfen',in_bearbeitung:'In Bearbeitung',wartet:'Wartet',erledigt:'Erledigt'};
  const STAGES={besprochen:'Besprochen',vorgeschlagen:'Vorgeschlagen',entschieden:'Entschieden',vorbereitet:'Vorbereitet',umgesetzt:'Umgesetzt',technisch_geprueft:'Technisch geprüft',fachlich_angenommen:'Fachlich angenommen',wirkung_beobachtet:'Wirkung beobachtet'};
  const isChat=x=>x?.source_kind==='chat';
  const sourceDate=s=>!s?'Datum offen':/^\d{4}-\d{2}-\d{2}$/.test(s)?s.split('-').reverse().join('.'):Number.isFinite(Date.parse(s))?new Date(s).toLocaleDateString('de-DE',{day:'2-digit',month:'2-digit',year:'numeric',timeZone:'Europe/Berlin'}):'Datum offen';
  const esc=s=>gfEsc(s==null?'':String(s));
  const date=s=>s?new Date(s).toLocaleString('de-DE',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}):'';
  async function api(action,payload={}) {
    const r=await fetch(ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,password:gfPW(),payload:{...payload,by:gfWho()==='Lea'?'Lea':'Alex'}}),signal:AbortSignal.timeout(45000)});
    let d;try{d=await r.json();}catch{throw new Error('Der Server hat die Aktion nicht eindeutig bestätigt.');}
    if(!r.ok){const e=new Error(d.error||'Die Aktion konnte nicht bestätigt werden.');e.status=r.status;e.item=d.item;e.releaseAllowed=d.releaseAllowed;throw e;}return d;
  }
  function summary(items) {const open=items.filter(x=>x.status!=='erledigt');return {open:open.length,urgent:open.filter(x=>x.priority).length,waiting:open.filter(x=>x.status==='wartet').length};}
  let cardRun=0;
  window.gfLoadVorstandCard=async function() {
    const box=document.getElementById('fdVorstandL');if(!box)return;
    const seq=++cardRun,me=gfWho()==='Lea'?'Lea':'Alex';
    try{
      const d=await api('lage');if(seq!==cardRun||me!==(gfWho()==='Lea'?'Lea':'Alex'))return;const n=summary(d.items||[]);
      const list=(d.items||[]).filter(x=>x.status!=='erledigt'&&(!x.owner||x.owner===me)).slice(0,3);
      document.getElementById('fdVorstandN').textContent=n.open+' offen';
      box.innerHTML='<p class="vb-card-meta">mit Freude eG · '+n.urgent+' dringend · '+n.waiting+' warten</p>'+list.map(x=>'<div class="fd-row"><a class="t" href="vorstand.html?id='+encodeURIComponent(x.id)+'">'+esc(x.title)+'</a><span>'+esc(x.owner||'Noch unzugewiesen')+'</span>'+gfZustand(x.status==='wartet'?'warn':'offen',LABELS[x.status])+'<a href="vorstand.html?id='+encodeURIComponent(x.id)+'&tab='+(isChat(x)?'insight':'reply')+'">'+(isChat(x)?'Einordnung':'Antwortentwurf')+'</a><a href="vorstand.html?id='+encodeURIComponent(x.id)+'&tab=task">Aufgabe</a></div>').join('')+(list.length?'':'<p class="vb-card-meta">Gerade kein offener Vorgang bei dir oder ohne Zuständigkeit.</p>');
    }catch(e){if(seq!==cardRun)return;document.getElementById('fdVorstandN').textContent='';box.innerHTML='<p class="vb-card-meta">Gemeinsamer Stand derzeit nicht geladen. <a href="vorstand.html">Vorstandsbüro öffnen</a></p>';}
  };
  window.gfVorstandStart=function() {
    const root=document.getElementById('vb');if(!root)return;
    const $=s=>root.querySelector(s),q=new URLSearchParams(location.search);
    let items=[],current=null,dirty=false,busy=false,run=0,filter='offen',tab=['reply','task','status','insight'].includes(q.get('tab'))?q.get('tab'):'reply',asanaReady=false,sourceFilter='alle',newDirty=false,newKey=crypto.randomUUID();
    const text=(id,value)=>{$(id).textContent=value;};
    function note(message,error=false){text('#vbNotice',message);$('#vbNotice').classList.toggle('vb-error',error);}
    function setBusy(on){busy=on;root.querySelectorAll('[data-write],#vbTake,#vbSuggest,#vbReload,#vbDetail input,#vbDetail textarea,#vbDetail select,#vbNew input,#vbNew textarea,#vbNew select').forEach(b=>b.disabled=on);if(!on&&current&&['creating','unclear','created'].includes(current.task_state))for(const id of ['vbTaskTitle','vbTaskNotes','vbTaskWho','vbTaskDue'])$('#'+id).disabled=true;taskButtons();}
    function taskButtons(){
      const pending=current&&['creating','unclear','created'].includes(current.task_state);
      $('#vbTaskCreate').disabled=busy||!current||pending||!asanaReady;
      $('#vbTaskLinkBox').hidden=!current||!['creating','unclear'].includes(current.task_state);
      $('#vbTaskRelease').hidden=!current?true:!current.releaseAllowed;$('#vbTaskRelease').disabled=busy;
      $('#vbTaskCheck').disabled=busy||!current||!['creating','unclear','created'].includes(current.task_state)||!asanaReady;
    }
    function showTab(){if(current){if(isChat(current)&&tab==='reply')tab='insight';if(!isChat(current)&&tab==='insight')tab='reply';}root.querySelectorAll('[data-tab]').forEach(b=>{b.hidden=b.dataset.tab==='reply'&&isChat(current)||b.dataset.tab==='insight'&&!isChat(current);b.setAttribute('aria-selected',String(b.dataset.tab===tab));});root.querySelectorAll('[data-panel]').forEach(p=>p.hidden=p.dataset.panel!==tab);}
    function list(){
      const n=summary(items);text('#vbCounts',n.open+' offen · '+n.urgent+' dringend · '+n.waiting+' warten');
      const me=gfWho()==='Lea'?'Lea':'Alex';
      const rows=items.filter(x=>sourceFilter==='alle'||(isChat(x)?'chat':'mail')===sourceFilter).filter(x=>filter==='alle'||filter==='erledigt'&&x.status==='erledigt'||filter==='offen'&&x.status!=='erledigt'||filter==='meine'&&x.status!=='erledigt'&&x.owner===me||filter==='unzugewiesen'&&x.status!=='erledigt'&&!x.owner||filter==='wartet'&&x.status==='wartet');
      $('#vbList').innerHTML=rows.map(x=>'<button type="button" class="vb-mail'+(current?.id===x.id?' active':'')+'" data-case="'+esc(x.id)+'" aria-pressed="'+String(current?.id===x.id)+'"><span class="vb-mail-meta">'+esc(isChat(x)?'Chaterkenntnis · '+sourceDate(x.insight?.occurred_at):'Mailvorgang · '+x.id)+(x.priority?' · Dringend':'')+'</span><strong>'+esc(x.title)+'</strong><span>'+esc(x.owner||'Noch unzugewiesen')+' · '+LABELS[x.status]+'</span></button>').join('')||'<p class="vb-muted">In dieser Ansicht gibt es keine Vorgänge.</p>';
      root.querySelectorAll('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.filter===filter)));root.querySelectorAll('[data-source]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.source===sourceFilter)));
    }
    function readPatch(){const patch={owner:$('#vbOwner').value,status:$('#vbStatus').value,due_on:$('#vbDue').value||null,waiting_on:$('#vbWaiting').value,completion_evidence:$('#vbEvidence').value,next_action:$('#vbNext').value,reply_to:$('#vbTo').value,reply_subject:$('#vbSubject').value,reply_body:$('#vbBody').value,task_title:$('#vbTaskTitle').value,task_notes:$('#vbTaskNotes').value,task_assignee:$('#vbTaskWho').value,task_due_on:$('#vbTaskDue').value||null};if(isChat(current)){patch.finding=$('#vbInsightFinding').value;patch.insight={...current.insight,evidence_stage:$('#vbInsightStage').value,evidence_basis:$('#vbInsightBasis').value,leadership_relevance:$('#vbInsightRelevance').value,open_decision:$('#vbInsightDecision').value,recommendation:$('#vbInsightRecommendation').value};}return patch;}
    function mailLink(){
      const to=$('#vbTo').value.trim(),body=$('#vbBody').value;
      const ok=/^[^\s<>@,;]+@[^\s<>@,;]+\.[^\s<>@,;]+$/.test(to)&&body.trim();
      const a=$('#vbMailto');a.hidden=!ok||isChat(current);if(ok&&!isChat(current))a.href='mailto:'+encodeURIComponent(to)+'?cc='+encodeURIComponent('vorstand@freude-eg.de')+'&subject='+encodeURIComponent($('#vbSubject').value)+'&body='+encodeURIComponent(body);
    }
    function draw(){
      const x=current;$('#vbDetail').hidden=!x;$('#vbEmpty').hidden=!!x;if(!x){taskButtons();return;}
      text('#vbCaseId',x.id);$('#vbCaseId').hidden=isChat(x);text('#vbTitle',x.title);text('#vbFinding',x.finding||'Noch kein belegter Stand erfasst.');text('#vbBasis','Ausgangsprüfung: '+date(x.basis_at));text('#vbSaved','Gemeinsam gespeichert von '+x.last_by+' · '+date(x.updated_at));
      $('#vbOriginal').href=x.source_url;$('#vbReplyOriginal').href=x.source_url;
      text('#vbOriginal',isChat(x)?'Originalchat öffnen ↗':'Originalverlauf öffnen ↗');text('#vbSourceType',isChat(x)?'Chaterkenntnis · mit Freude eG':'Mailvorgang · mit Freude eG');
      if(isChat(x)){
        const i=x.insight||{};text('#vbProvenance','Quelle vom '+sourceDate(i.occurred_at)+(i.turn_id?' · genauer Beitrag zugeordnet':' · Belegauszug ohne genaue Beitragskennung'));
        text('#vbExcerpt',i.excerpt||'Der genaue Originalbeitrag ist verlinkt.');
        $('#vbInsightFinding').value=x.finding||'';$('#vbInsightStage').value=i.evidence_stage||'vorgeschlagen';$('#vbInsightBasis').value=i.evidence_basis||'quellchat';$('#vbInsightRelevance').value=i.leadership_relevance||'';$('#vbInsightDecision').value=i.open_decision||'';$('#vbInsightRecommendation').value=i.recommendation||'';
        $('#vbReferences').replaceChildren();for(const r of i.references||[]){let url;try{url=new URL(r.url);}catch{continue;}if(!['https:','codex:'].includes(url.protocol)||url.username||url.password)continue;const a=document.createElement('a');a.href=r.url;a.target='_blank';a.rel='noopener';a.textContent=r.label||'Ergänzender Beleg';$('#vbReferences').append(a);}
      }

      const fields={vbOwner:x.owner,vbStatus:x.status,vbDue:x.due_on,vbWaiting:x.waiting_on,vbEvidence:x.completion_evidence,vbNext:x.next_action,vbTo:x.reply_to,vbSubject:x.reply_subject,vbBody:x.reply_body,vbTaskTitle:x.task_title,vbTaskNotes:x.task_notes,vbTaskWho:x.task_assignee,vbTaskDue:x.task_due_on};
      for(const [id,v] of Object.entries(fields))$('#'+id).value=v||'';
      const locked=['creating','unclear','created'].includes(x.task_state);
      for(const id of ['vbTaskTitle','vbTaskNotes','vbTaskWho','vbTaskDue'])$('#'+id).disabled=locked;
      const link=$('#vbAsana');link.hidden=!x.asana_gid;if(x.asana_gid){link.href=x.asana_url;text('#vbTaskResult','Aufgabe angelegt · '+(x.asana_completed?'in Asana erledigt':'in Asana offen')+(x.asana_checked_at?' · abgeglichen '+date(x.asana_checked_at):''));}
      else text('#vbTaskResult',x.task_state==='creating'?'Anlage angefordert. Vor einer Wiederholung abgleichen.':x.task_state==='unclear'?'Anlage nicht eindeutig bestätigt. Zuerst in Asana abgleichen.':x.task_error||(!asanaReady?'Asana Verbindung derzeit nicht verfügbar.':'Noch keine Aufgabe angelegt.'));
      dirty=false;$('#vbChanged').hidden=true;showTab();mailLink();taskButtons();
    }
    async function load(force=false){
      const seq=++run;
      try{
        const d=await api('lage');if(seq!==run)return;items=d.items||[];asanaReady=d.asanaConfigured;
        if(!current){current=items.find(x=>x.id===q.get('id'))||items.find(x=>x.status!=='erledigt')||items[0]||null;draw();}
        else {const fresh=items.find(x=>x.id===current.id);if(fresh&&(force||!dirty)){current=fresh;draw();}else if(fresh&&fresh.version!==current.version){$('#vbChanged').hidden=false;}}
        list();
      }catch(e){note(e.message||'Der gemeinsame Stand konnte nicht geladen werden.',true);}
    }
    async function save(){
      if(!current)throw new Error('Bitte zuerst einen Vorgang wählen.');
      const d=await api('case_save',{id:current.id,version:current.version,patch:readPatch()});current=d.item;items=items.map(x=>x.id===current.id?current:x);draw();list();note('Gemeinsamer Stand gespeichert.');return current;
    }
    root.addEventListener('input',e=>{if(e.target.closest('#vbNew'))newDirty=true;if(e.target.closest('#vbDetail')&&e.target.matches('input,textarea,select')){dirty=true;mailLink();text('#vbSaved','Ungespeicherte Änderungen');}});
    root.addEventListener('change',e=>{if(e.target.closest('#vbNew'))newDirty=true;if(e.target.closest('#vbDetail')&&e.target.matches('input,textarea,select')){dirty=true;mailLink();text('#vbSaved','Ungespeicherte Änderungen');}});
    root.addEventListener('click',async e=>{
      const pick=e.target.closest('[data-case]');if(pick){if(busy)return;if(dirty&&!confirm('Ungespeicherte Änderungen verwerfen und den anderen Vorgang öffnen?'))return;current=items.find(x=>x.id===pick.dataset.case);draw();list();history.replaceState(null,'','vorstand.html?id='+encodeURIComponent(current.id)+'&tab='+tab);return;}
      const sf=e.target.closest('[data-source]');if(sf){sourceFilter=sf.dataset.source;list();return;}
      const f=e.target.closest('[data-filter]');if(f){filter=f.dataset.filter;list();return;}
      const b=e.target.closest('[data-tab]');if(b){tab=b.dataset.tab;showTab();return;}
    });
    $('#vbSave').onclick=async()=>{setBusy(true);try{await save();}catch(e){note(e.message,true);}finally{setBusy(false);}};
    $('#vbReload').onclick=async()=>{if(dirty&&!confirm('Ungespeicherte Änderungen verwerfen und den gemeinsamen Stand laden?'))return;dirty=false;await load(true);};
    $('#vbCopy').onclick=async()=>{try{await navigator.clipboard.writeText($('#vbBody').value);note('Antworttext kopiert. Im Originalverlauf einfügen und dort prüfen.');}catch{note('Kopieren derzeit nicht möglich. Du kannst den Text im Entwurfsfeld markieren.',true);}};
    $('#vbSuggest').onclick=()=>{if($('#vbBody').value.trim()&&!confirm('Den bisherigen Antworttext durch einen neuen Vorschlag ersetzen?'))return;$('#vbBody').value='Guten Tag,\n\nvielen Dank für Ihre Nachricht. Wir übernehmen die Klärung im Vorstand und prüfen den aktuellen Bearbeitungsstand. Anschließend melden wir uns mit dem geprüften Ergebnis und den nächsten Schritten.\n\nFreundliche Grüße\n'+(gfWho()==='Lea'?'Lea':'Alexander');dirty=true;mailLink();text('#vbSaved','Vorschlag eingefügt, noch nicht gespeichert');};
    $('#vbTake').onclick=()=>{$('#vbOwner').value=gfWho()==='Lea'?'Lea':'Alex';if($('#vbStatus').value==='pruefen')$('#vbStatus').value='in_bearbeitung';dirty=true;tab='status';showTab();text('#vbSaved','Übernahme gewählt, bitte speichern');};
    $('#vbTaskCreate').onclick=async()=>{
      setBusy(true);try{
        await save();const d=await api('task_create',{id:current.id,version:current.version});current=d.item;items=items.map(x=>x.id===current.id?current:x);draw();list();note(d.existing?'Die vorhandene Aufgabe ist verknüpft.':'Asana hat die Aufgabe bestätigt. Der Mailvorgang bleibt offen.');
      }catch(e){if(e.item){current={...e.item,releaseAllowed:!!e.releaseAllowed};draw();}note(e.message,true);if(!e.item)await load(false);}finally{setBusy(false);}
    };
    $('#vbTaskCheck').onclick=async()=>{setBusy(true);try{if(dirty)await save();const d=await api('task_check',{id:current.id});current=d.item;draw();await load(false);note('Asana Stand abgeglichen. Die Erledigung des Mailvorgangs wird gesondert geprüft.');}catch(e){if(e.item){current={...e.item,releaseAllowed:!!e.releaseAllowed};draw();}note(e.message,true);}finally{setBusy(false);}};
    $('#vbTaskLink').onclick=async()=>{setBusy(true);try{if(dirty)await save();const d=await api('task_link',{id:current.id,asana_url:$('#vbTaskLinkUrl').value});current=d.item;draw();await load(false);note('Vorhandene Asana Aufgabe geprüft und verknüpft.');}catch(e){note(e.message,true);}finally{setBusy(false);}};
    $('#vbTaskRelease').onclick=async()=>{if(!confirm('Nach erneutem vollständigem Asana Abgleich die Reservierung freigeben? Nur bestätigen, wenn ihr keine passende Aufgabe selbst angelegt oder verschoben habt.'))return;setBusy(true);try{if(dirty)await save();const d=await api('task_release',{id:current.id,version:current.version,confirm:true});current=d.item;draw();await load(false);note('Abgleich bestätigt. Eine neue Anlage ist jetzt wieder möglich.');}catch(e){note(e.message,true);}finally{setBusy(false);}};
    $('#vbNewToggle').onclick=()=>{$('#vbNew').hidden=!$('#vbNew').hidden;if(!$('#vbNew').hidden)$('#vbNewTitle').focus();};
    function newKind(){const chat=$('#vbNewKind').value==='chat';$('#vbNewChat').hidden=!chat;text('#vbNewSourceLabel',chat?'Originalchat in ChatGPT oder Codex':'Originalverlauf in der Vorstandsgruppe oder Gmail');}
    $('#vbNewKind').onchange=newKind;
    for(const id of ['vbNewStage','vbInsightStage'])$('#'+id).innerHTML=Object.entries(STAGES).map(([v,l])=>'<option value="'+v+'">'+l+'</option>').join('');$('#vbNewStage').value='vorgeschlagen';
    $('#vbNewSave').onclick=async()=>{setBusy(true);try{
      if(dirty)throw new Error('Bitte zuerst den offenen Vorgang speichern.');
      const title=$('#vbNewTitle').value.trim(),url=$('#vbNewSource').value.trim(),chat=$('#vbNewKind').value==='chat';
      let d;
      if(chat){
        let parsed;try{parsed=new URL(url);}catch{throw new Error('Bitte den Originalchat verlinken.');}
        const thread=parsed.pathname.split('/').filter(Boolean).at(-1)?.toLowerCase(),turn=$('#vbNewTurn').value.trim().toLowerCase();
        d=await api('chat_add',{organization:'mit-freude',source_url:url,source_key:'chat:'+thread+':'+(turn||'manual')+':'+newKey,insight:{thread_id:thread,turn_id:turn,occurred_at:$('#vbNewDate').value,evidence_stage:$('#vbNewStage').value,evidence_basis:$('#vbNewBasis').value,leadership_relevance:$('#vbNewRelevance').value,excerpt:$('#vbNewExcerpt').value,open_decision:$('#vbNewDecision').value,recommendation:$('#vbNewRecommendation').value,references:$('#vbNewResult').value.trim()?[{url:$('#vbNewResult').value.trim(),label:'Ergebnisbeleg'}]:[]},patch:{title,finding:$('#vbNewFinding').value,next_action:$('#vbNewNext').value}});
      }else d=await api('case_add',{source_url:url,patch:{title,next_action:$('#vbNewNext').value,task_title:title,task_notes:$('#vbNewNext').value,task_assignee:gfWho()==='Lea'?'Lea':'Alex'}});
      items=items.some(x=>x.id===d.item.id)?items.map(x=>x.id===d.item.id?d.item:x):[d.item,...items];current=d.item;tab=chat?'insight':'reply';sourceFilter='alle';filter='offen';$('#vbNew').hidden=true;
      for(const input of $('#vbNew').querySelectorAll('input,textarea'))input.value='';newKey=crypto.randomUUID();newDirty=false;draw();list();note(d.existing?'Diese Erkenntnis ist bereits vorhanden. Der gemeinsame Stand blieb unverändert.':'Vorgang gemeinsam aufgenommen.');
    }catch(e){note(e.message,true);}finally{setBusy(false);}};
    document.addEventListener('gf-who',()=>{list();if(!dirty)draw();});
    window.addEventListener('beforeunload',e=>{if(dirty||newDirty){e.preventDefault();e.returnValue='';}});
    document.addEventListener('visibilitychange',()=>{if(!document.hidden&&!busy)load(false);});
    setInterval(()=>{if(!document.hidden&&!busy)load(false);},45000);
    load(true);
  };
})();
