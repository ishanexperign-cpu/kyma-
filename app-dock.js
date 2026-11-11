/* KYMA · app/dock — your panels: header pins and the dock
   Every studio registers the controls it can offer with control({...}). The person picks which ones
   live in the sticky dock at the bottom of the screen (collapsible) and which sit in the sticky header
   next to Export. The choice is kept per studio in this browser.
     control({id, label, group, icon, kind, tip, run, pressed, spec, get, set, min, max, step})
       kind: 'button' (default) · 'toggle' · 'knob' · 'slider' · 'meter'
       label and icon may be functions, so a control can show its state (Play / Pause). */
const PANELS={defs:{},order:[],cfg:null,live:[],defaults:{},t:0};
const PANEL_KEY='kyma.panels', HEAD_MAX=4;
function control(def){ if(!PANELS.defs[def.id]) PANELS.order.push(def.id); PANELS.defs[def.id]={kind:'button',group:'Studio',...def}; }
function panelDefaults(studio,o){ PANELS.defaults[studio]=o; }
const pVal=(v)=>typeof v==='function'?v():v;
const headOk=d=>d.kind==='button'||d.kind==='toggle';

/* ---------- saved choice ---------- */
function panelCfg(){
  if(PANELS.cfg) return PANELS.cfg;
  let all={}; try{ all=JSON.parse(localStorage.getItem(PANEL_KEY)||'{}')||{}; }catch(e){}
  const def=PANELS.defaults[STUDIO]||{dock:[],head:[]}, mine=all[STUDIO];
  const ok=id=>!!PANELS.defs[id];
  PANELS.cfg=mine&&Array.isArray(mine.dock)?{dock:mine.dock.filter(ok),head:(mine.head||[]).filter(id=>ok(id)&&headOk(PANELS.defs[id])).slice(0,HEAD_MAX),open:mine.open!==false}
    :{dock:def.dock.filter(ok),head:(def.head||[]).filter(ok),open:true};
  return PANELS.cfg;
}
function savePanels(){ try{ const all=JSON.parse(localStorage.getItem(PANEL_KEY)||'{}')||{}; all[STUDIO]=PANELS.cfg; localStorage.setItem(PANEL_KEY,JSON.stringify(all)); }catch(e){} }

/* ---------- building one control ---------- */
function buildControl(d,place){
  const head=place==='head';
  if(d.kind==='knob'){ const w=document.createElement('div'); w.className='dk-knob'; w.title=d.tip||d.label;
    const k=knob(d.spec,d.get,v=>{ d.set(v); },'var(--orange)',d.start||pushHistOnce); w.appendChild(k); return {el:w,refresh:()=>k._show&&k._show()}; }
  if(d.kind==='slider'){ const w=document.createElement('label'); w.className='dk-slider'; w.title=d.tip||pVal(d.label);
    w.innerHTML='<span class="dk-l"></span><input type="range">'; const inp=w.querySelector('input'); inp.min=d.min??0; inp.max=d.max??1; inp.step=d.step??.01; inp.setAttribute('aria-label',pVal(d.label));
    w.querySelector('.dk-l').textContent=pVal(d.label); inp.oninput=()=>d.set(+inp.value); inp.onchange=()=>d.commit&&d.commit(+inp.value);
    return {el:w,refresh:()=>{ if(document.activeElement!==inp){ const v=d.get(); if(isFinite(v)) inp.value=v; } inp.disabled=!!(d.disabled&&d.disabled()); }}; }
  if(d.kind==='meter'){ const w=document.createElement('div'); w.className='dk-meter'; w.title='Output level'; w.innerHTML='<span class="dk-l">out</span><div class="dkm"><i></i><i></i></div>';
    const bars=w.querySelectorAll('.dkm i'), buf=new Float32Array(1024), hold=[0,0];
    return {el:w,meter:true,refresh:()=>{ [anaL,anaR].forEach((a,i)=>{ let pk=0; if(a&&ac&&ac.state==='running'){ a.getFloatTimeDomainData(buf); for(let j=0;j<buf.length;j+=2) pk=Math.max(pk,Math.abs(buf[j])); }
      const db=pk>0?20*Math.log10(pk):-60, v=clamp((db+48)/48,0,1); hold[i]=Math.max(v,hold[i]*.92); bars[i].style.setProperty('--v',hold[i]); bars[i].classList.toggle('hot',db>-1.5); }); }}; }
  const b=document.createElement('button'); b.type='button'; b.className=head?'ibtn':'dk-btn'; b.dataset.id=d.id;
  b.innerHTML=head?'<span class="ib-ic"></span><span class="ib-t"></span>':'<span class="dk-ic"></span><span class="dk-l"></span>';
  const ic=b.firstChild, lb=b.lastChild; let lastIcon=null;
  b.onclick=e=>{ try{ d.run(e); }catch(err){ console.error(err); } setTimeout(refreshPanels,30); };
  const refresh=()=>{ const icon=pVal(d.icon)||'dial'; if(icon!==lastIcon){ ic.innerHTML=ICONS[icon]||ICONS.dial; lastIcon=icon; }
    const l=pVal(d.label); if(lb.textContent!==l){ lb.textContent=l; b.setAttribute('aria-label',l); } b.title=(d.tip||l)+(d.keys?' ('+d.keys+')':'');
    if(d.kind==='toggle'||d.pressed) b.setAttribute('aria-pressed',!!(d.pressed&&d.pressed()));
    b.disabled=!!(d.disabled&&d.disabled()); if(d.hot) b.classList.toggle('hot',!!pVal(d.hot)); };
  return {el:b,refresh};
}

/* ---------- render the header pins and the dock ---------- */
function renderPanels(){
  const cfg=panelCfg(); PANELS.live=[];
  const row=$('dockRow'), pins=$('cbPins'); if(!row) return;
  row.innerHTML=''; if(pins) pins.innerHTML='';
  cfg.dock.forEach(id=>{ const c=buildControl(PANELS.defs[id],'dock'); c.el.classList.add('dk-item'); row.appendChild(c.el); PANELS.live.push(c); });
  if(!cfg.dock.length){ const p=document.createElement('button'); p.className='dk-empty'; p.textContent='Your dock is empty. Pin the controls you reach for most.'; p.onclick=openPanelSheet; row.appendChild(p); }
  if(pins) cfg.head.forEach(id=>{ const c=buildControl(PANELS.defs[id],'head'); pins.appendChild(c.el); PANELS.live.push(c); });
  if(pins) pins.hidden=!cfg.head.length;
  const dock=$('dock'); dock.dataset.open=cfg.open; $('dockToggle').setAttribute('aria-expanded',cfg.open); $('dockCount').textContent=cfg.dock.length;
  $('dockToggle').title=cfg.open?'Fold the dock away':'Show the dock'; row.hidden=!cfg.open;
  refreshPanels(); sizeDock();
}
function refreshPanels(){ PANELS.live.forEach(c=>{ if(!c.meter) try{ c.refresh(); }catch(e){} }); }
function sizeDock(){ const d=$('dock'); if(!d) return; requestAnimationFrame(()=>{ const h=d.getBoundingClientRect().height; document.documentElement.style.setProperty('--dock-h',Math.round(h)+'px'); }); }

/* ---------- the customise sheet ---------- */
function openPanelSheet(){ renderPanelSheet(); $('dockSheet').hidden=false; $('dkDone').focus(); }
function closePanelSheet(){ $('dockSheet').hidden=true; }
function panelToggle(place,id){
  const cfg=panelCfg(), list=cfg[place], i=list.indexOf(id);
  if(i>=0) list.splice(i,1);
  else { if(place==='head'&&list.length>=HEAD_MAX){ toast(`The header holds ${HEAD_MAX} controls. Take one out first.`); return; } list.push(id); }
  savePanels(); renderPanels(); renderPanelSheet();
}
function panelMove(place,id,dir){ const l=panelCfg()[place], i=l.indexOf(id), j=i+dir; if(i<0||j<0||j>=l.length) return; [l[i],l[j]]=[l[j],l[i]]; savePanels(); renderPanels(); renderPanelSheet(); }
function renderPanelSheet(){
  const cfg=panelCfg();
  const chipList=(box,place)=>{ box.innerHTML=''; const l=cfg[place];
    if(!l.length){ box.innerHTML=`<p class="hint">${place==='head'?'Nothing pinned to the header yet.':'Nothing in the dock yet.'}</p>`; return; }
    l.forEach((id,i)=>{ const d=PANELS.defs[id], c=document.createElement('div'); c.className='dkchip';
      c.innerHTML=`<span class="dkc-ic">${ICONS[pVal(d.icon)]||ICONS.dial}</span><b></b><span class="dkc-acts"><button data-a="l" aria-label="Move left">${ICONS.left}</button><button data-a="r" aria-label="Move right">${ICONS.right}</button><button data-a="x" aria-label="Remove">${ICONS.close}</button></span>`;
      c.querySelector('b').textContent=pVal(d.label); c.querySelector('[data-a=l]').disabled=i===0; c.querySelector('[data-a=r]').disabled=i===l.length-1;
      c.querySelector('[data-a=l]').onclick=()=>panelMove(place,id,-1); c.querySelector('[data-a=r]').onclick=()=>panelMove(place,id,1); c.querySelector('[data-a=x]').onclick=()=>panelToggle(place,id);
      box.appendChild(c); }); };
  chipList($('dkMine'),'dock'); chipList($('dkHead'),'head');
  const all=$('dkAll'); all.innerHTML=''; const groups={};
  PANELS.order.forEach(id=>{ const d=PANELS.defs[id]; (groups[d.group]=groups[d.group]||[]).push(d); });
  const rank=g=>({Transport:0,Project:1,'Master bus':9})[g]??5;
  Object.entries(groups).sort((a,b)=>rank(a[0])-rank(b[0])).forEach(([g,list])=>{ const sec=document.createElement('section'); sec.className='dkgroup'; sec.innerHTML='<span class="lbl"></span><div class="dkgrid"></div>'; sec.querySelector('.lbl').textContent=g;
    list.forEach(d=>{ const it=document.createElement('div'); it.className='dkopt'; const inDock=cfg.dock.includes(d.id), inHead=cfg.head.includes(d.id);
      it.innerHTML=`<span class="dko-ic">${ICONS[pVal(d.icon)]||ICONS.dial}</span><span class="dko-t"><b></b><small></small></span><span class="dko-acts"><button class="pin" data-p="dock" aria-pressed="${inDock}">Dock</button>${headOk(d)?`<button class="pin" data-p="head" aria-pressed="${inHead}">Header</button>`:''}</span>`;
      it.querySelector('b').textContent=pVal(d.label); it.querySelector('small').textContent=d.tip||({knob:'Knob',slider:'Slider',meter:'Level meter',toggle:'Switch',button:'Button'})[d.kind];
      it.querySelectorAll('.pin').forEach(p=>p.onclick=()=>panelToggle(p.dataset.p,d.id)); sec.querySelector('.dkgrid').appendChild(it); });
    all.appendChild(sec); });
}

/* ---------- controls every studio shares ---------- */
function registerShellControls(){
  if($('playBtn')){
    control({id:'play',group:'Transport',kind:'toggle',label:()=>playing?'Pause':'Play',icon:()=>playing?'pause':'play',keys:'Space',hot:()=>playing,tip:'Play or pause the song',run:()=>playing?stopPlay():startPlay(),pressed:()=>playing});
    control({id:'restart',group:'Transport',label:'To start',icon:'restart',keys:'Home',run:()=>restartPlay()});
    control({id:'loop',group:'Transport',kind:'toggle',label:'Loop',icon:'loop',run:()=>$('loopBtn').click(),pressed:()=>S.loop});
  }
  if($('recBtn')) control({id:'rec',group:'Transport',kind:'toggle',label:()=>REC.on?'Stop take':'Record',icon:'rec',keys:'Z',tip:'Record everything you hear',hot:()=>REC.on,run:()=>toggleRec(),pressed:()=>REC.on});
  control({id:'tap',group:'Transport',label:'Tap tempo',icon:'tap',keys:'T',tip:'Tap the beat to set the tempo',run:()=>tapTempo()});
  control({id:'tempo',group:'Transport',kind:'knob',label:'Tempo',spec:P('bpm','Tempo',40,220,100,{step:1,fmt:v=>Math.round(v)+' bpm'}),get:()=>S.bpm,set:v=>setBpm(v)});
  control({id:'undo',group:'Project',label:'Undo',icon:'undo',keys:'⌘Z',run:()=>undo()});
  control({id:'redo',group:'Project',label:'Redo',icon:'redo',keys:'⇧⌘Z',run:()=>redo()});
  control({id:'save',group:'Project',label:'Save',icon:'save',keys:'⌘S',run:()=>Project.saveNow(true)});
  control({id:'newfile',group:'Project',label:'New project',icon:'new',run:()=>Project.newFile()});
  control({id:'openfile',group:'Project',label:'Open file',icon:'open',run:()=>$('openFile').click()});
  control({id:'savecopy',group:'Project',label:'Save a copy',icon:'duplicate',run:()=>Project.saveCopy()});
  control({id:'download',group:'Project',label:'Download',icon:'download',tip:'Download the project as a .kyma file',run:()=>Project.download()});
  control({id:'export',group:'Project',label:'Export',icon:'export',run:()=>$('exportBtn').click()});
  control({id:'home',group:'Project',label:'All studios',icon:'home',run:()=>Project.home()});
  const mk=(k,label)=>{ const spec=MASTER.find(m=>m.k===k); if(spec) control({id:'m_'+k,group:'Master bus',kind:'knob',label,spec:{...spec,label},get:()=>S.master[k],set:v=>{ S.master[k]=v; if(G) applyGraph(G); persist(); }}); };
  [['space','Space'],['echo','Repeats'],['glue','Glue'],['tape','Tape'],['width','Width'],['tone','Tilt'],['warble','Wobble'],['out','Output']].forEach(([k,l])=>mk(k,l));
  MACROS.forEach(M=>control({id:'mac_'+M.label.toLowerCase(),group:'Master bus',kind:'knob',label:M.label,spec:P('mac',M.label,0,1,.5,{fmt:v=>v<.05?M.lo:v>.95?M.hi:fmtPct(v),tip:M.lo+' to '+M.hi}),get:()=>M.get(S.master),set:v=>{ M.set(S.master,v); if(G) applyGraph(G); persist(); }}));
  control({id:'meter',group:'Master bus',kind:'meter',label:'Level meter',tip:'Left and right output level'});
}

function initPanels(){
  if(!$('dock')) return;
  registerShellControls();
  paintIcons($('dock')); paintIcons($('dockSheet'));
  $('dockToggle').onclick=()=>{ const c=panelCfg(); c.open=!c.open; savePanels(); renderPanels(); };
  $('dockEdit').onclick=openPanelSheet; $('dkDone').onclick=closePanelSheet;
  $('dockSheet').addEventListener('click',e=>{ if(e.target.id==='dockSheet') closePanelSheet(); });
  $('dkReset').onclick=()=>{ PANELS.cfg=null; try{ const all=JSON.parse(localStorage.getItem(PANEL_KEY)||'{}')||{}; delete all[STUDIO]; localStorage.setItem(PANEL_KEY,JSON.stringify(all)); }catch(e){} renderPanels(); renderPanelSheet(); };
  on('frame',now=>{ PANELS.live.forEach(c=>{ if(c.meter&&panelCfg().open) c.refresh(); }); if(now-PANELS.t>200){ PANELS.t=now; refreshPanels(); } });
  addEventListener('resize',sizeDock);
  renderPanels();
}
