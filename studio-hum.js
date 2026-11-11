/* KYMA · studio/hum — the Hum studio
   A voice desk over the shared timeline: choose Hum a melody or Beatbox a beat, pick the track and
   the instrument it plays as, then record with a count-in. The take is turned into notes by
   features/hum and lands on the timeline below; the live scope shows your voice and its pitch. */
const HS={mode:'hum',len:'song',track:null};
try{ const h=JSON.parse(localStorage.getItem('kyma.humstudio')||'{}'); if(h.mode==='beat') HS.mode='beat'; if(['song','head','open'].includes(h.len)) HS.len=h.len; }catch(e){}
const hsSave=()=>{ try{ localStorage.setItem('kyma.humstudio',JSON.stringify({mode:HS.mode,len:HS.len})); }catch(e){} };
const HS_KITS=()=>INSTS.filter(i=>i.kind==='drum').slice(0,8);
const hsFits=t=>HS.mode==='beat'?t.kind==='drum':(t.kind!=='drum'&&!['atmos','fxkit'].includes(INST[t.inst]?.engine));
function hsTarget(create,fresh){
  let tr=fresh?null:trackById(HS.track); if(!fresh&&(!tr||!hsFits(tr))) tr=S.tracks.find(t=>hsFits(t)&&(HS.mode==='beat'||['melody','counter'].includes(trackRole(t))))||S.tracks.find(hsFits);
  if(fresh) tr=null;
  if(!tr&&create){ const I=HS.mode==='beat'?(HS_KITS()[0]):(INSTS.find(i=>i.name==='Cello')||INSTS.find(i=>i.kind!=='drum'));
    pushHist(); tr=newTrack(I.id,{name:(HS.mode==='beat'?'Beatbox · ':'Hum · ')+I.name}); tr.role=HS.mode==='beat'?'drums':'melody'; S.tracks.push(tr); if(G) applyGraph(G); renderTracks(); persist(); }
  if(tr){ HS.track=tr.id; FOCUS=tr.id; if(typeof markFocus==='function') markFocus(); } return tr;
}
function hsRange(){ const p=Math.floor(curStep()/16)*16; return HS.len==='head'&&p>0&&p<S.len-4?{a:p,b:S.len}:{a:0,b:S.len}; }
function hsGo(){
  if(HUM.busy) return;
  if(HUM.recording){ if(HUM.counting){ HUM.t0=ac.currentTime+.02; return; } HUM.finish(false); return; }
  const tr=hsTarget(true); UI.humOpen=HS.len==='open'; UI.humBacking=$('hdBacking').checked; UI.humReplace=$('hdReplace').checked; saveUI();
  startHum(tr,hsRange());
}
function hsUseFile(){ const tr=hsTarget(true); HUM.fileTarget=tr.id; HUMPOP.mode=HS.len==='head'?'head':'song'; UI.humOpen=HS.len==='open'; $('humFile').click(); }

/* ---------- render ---------- */
const HS_TIPS={
  hum:[['mmm','Hum on “mmm” or “doo”, close to the mic. Words work too, but vowels track best.'],['4','A four-beat count-in plays first. Pauses are fine: the take runs to the end.'],['key','Every note snaps to the song’s key. Kyma offers to switch the key to yours afterwards.']],
  beat:[['kick','Short sounds land best. Keep them close to the mic and leave a little space between hits.'],['4','A four-beat count-in plays first, then beatbox over the song or a click.'],['grid','Hits snap to the track’s grid, and the kit learns which of your sounds is the snare and which the hat.']]};
function hsRender(){
  const beat=HS.mode==='beat', tr=hsTarget(false);
  $('hdMode').querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.v===HS.mode));
  $('hdLen').querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.v===HS.len));
  $('hdStyle').querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',(b.dataset.v==='detail')===(UI.humStyle==='detail')));
  $('hdStyleRow').hidden=beat; $('hdReadL').textContent=beat?'hits':'pitch';
  const sel=$('hdTrack'); sel.innerHTML=''; S.tracks.filter(hsFits).forEach(t=>{ const o=document.createElement('option'); o.value=t.id; o.textContent=t.name; sel.appendChild(o); });
  const nw=document.createElement('option'); nw.value='__new'; nw.textContent=beat?'+ New beatbox track':'+ New hum track'; sel.appendChild(nw); sel.value=tr?tr.id:'__new';
  $('hdAsL').textContent=beat?'kit':'plays as';
  const as=$('hdAs'); as.innerHTML=''; (beat?HS_KITS():HUM_VOICES.map(n=>INSTS.find(i=>i.name===n)).filter(Boolean)).forEach(I=>{ const b=document.createElement('button'); b.className='mchip'; b.textContent=I.name; b.setAttribute('aria-pressed',!!tr&&tr.inst===I.id);
    b.onclick=()=>{ const t=hsTarget(true); if(t.inst!==I.id){ pushHist(); setTrackInst(t,I); persist(); renderTracks(); } previewInst(I); hsRender(); }; as.appendChild(b); });
  $('hdBacking').checked=!!UI.humBacking; $('hdReplace').checked=!!UI.humReplace;
  $('hdGuideL').textContent=beat?'how to beatbox':'how to hum';
  const g=$('hdGuide'); g.innerHTML=HS_TIPS[HS.mode].map(([k,t])=>`<div class="hd-tip"><i>${k}</i><span>${t}</span></div>`).join('');
  if(beat){ const pads=document.createElement('div'); pads.className='hd-pads'; [['boom','kick',0],['ka · psh','snare',1],['ts','hat',4]].forEach(([say,what,n])=>{ const b=document.createElement('button'); b.className='hd-pad'; b.innerHTML=`<b>${say}</b><small>${what}</small>`; b.title='Hear the '+what;
      b.onclick=()=>{ const t=hsTarget(true); audition(t.id,n); b.classList.add('hit'); setTimeout(()=>b.classList.remove('hit'),160); }; pads.appendChild(b); }); g.appendChild(pads); }
  hsState();
}
function hsState(){
  const beat=HS.mode==='beat', rec=HUM.recording, b=$('hdRec');
  b.classList.toggle('rec',rec&&!HUM.counting); b.classList.toggle('busy',!!HUM.busy);
  b.setAttribute('aria-label',rec?'Stop and make notes':'Start recording');
  $('hdGoT').textContent=HUM.busy?'Making notes…':rec?(HUM.counting?'Get ready…':'Stop and make notes'):(beat?'Start beatboxing':'Start humming');
  const r=hsRange(), sd=stepDur();
  $('hdGoS').textContent=rec?'press again to finish':HS.len==='open'?'count-in, then record until you stop':`count-in, then ${fmtMS(r.a*sd)} → ${fmtMS(r.b*sd)}`;
  $('hdState').textContent=HUM.busy?'processing':rec?(HUM.counting?'count-in':'recording'):'ready';
}
/* ---------- the live scope ---------- */
const HSV={buf:null,last:0};
function hsScope(now){
  const cv=$('hdScope'); if(!cv) return; const dpr=devicePixelRatio||1, W=cv.clientWidth, H=cv.clientHeight; if(!W||!H) return;
  if(cv.width!==Math.round(W*dpr)){ cv.width=Math.round(W*dpr); cv.height=Math.round(H*dpr); }
  const g=cv.getContext('2d'); g.setTransform(dpr,0,0,dpr,0,0); g.clearRect(0,0,W,H);
  const mid=H*.62; g.strokeStyle='rgba(238,241,240,.22)'; g.lineWidth=1; g.beginPath(); g.moveTo(0,mid); g.lineTo(W,mid); g.stroke();
  if(HUM.recording&&HUM.ana){ HSV.buf=HSV.buf||new Float32Array(1024); HUM.ana.getFloatTimeDomainData(HSV.buf);
    g.strokeStyle=HUM.counting?'rgba(238,241,240,.6)':'#ff613d'; g.lineWidth=1.5; g.beginPath(); for(let i=0;i<HSV.buf.length;i+=4){ const x=i/HSV.buf.length*W, y=mid-HSV.buf[i]*H*.9; i?g.lineTo(x,y):g.moveTo(x,y); } g.stroke();
    /* the pitch trace of the last few seconds, or the hits for a beat */
    const tr=HUM.trace, t1=HUM.cur, span=32;
    if(HS.mode==='beat'){ g.fillStyle='#eef1f0'; tr.forEach(p=>{ const x=W-(t1-p.s)/span*W; if(x>0) g.fillRect(x,H-14,2,8); }); }
    else { const ms=tr.filter(p=>p.m!=null&&t1-p.s<span); if(ms.length){ const lo=Math.min(...ms.map(p=>p.m))-3, hi=Math.max(...ms.map(p=>p.m))+3; g.fillStyle='#eef1f0';
      ms.forEach(p=>{ const x=W-(t1-p.s)/span*W, y=H-10-(p.m-lo)/Math.max(6,hi-lo)*(H*.45); g.fillRect(x,y,2,2); }); } }
  }
  if(now-HSV.last>120){ HSV.last=now; hsState();
    if(HUM.recording){ if(HS.mode==='beat') $('hdNote').textContent=String(HUM.trace.length); else { const p=[...HUM.trace].reverse().find(x=>x.m!=null); $('hdNote').textContent=p?midiName(Math.round(p.m)):'—'; } }
    else if(!HUM.busy) $('hdNote').textContent='—'; }
}

/* ---------- wiring ---------- */
panelDefaults('hum',{dock:['play','restart','loop','hsrec','hsmode','undo','redo','split','addtrack','m_space','m_out','meter'],head:['undo','redo']});
function initHumStudio(){
  control({id:'hsrec',group:'Hum',kind:'toggle',label:()=>HUM.recording?'Stop take':'Record voice',icon:()=>HUM.recording?'stop':'mic',keys:'R',hot:()=>HUM.recording,run:hsGo,pressed:()=>HUM.recording});
  control({id:'hsmode',group:'Hum',label:()=>HS.mode==='beat'?'Mode: beatbox':'Mode: hum',icon:()=>HS.mode==='beat'?'dice':'note',tip:'Switch between humming a melody and beatboxing a beat',run:()=>{ HS.mode=HS.mode==='beat'?'hum':'beat'; HS.track=null; hsSave(); hsRender(); }});
  $('hdMode').querySelectorAll('button').forEach(b=>b.onclick=()=>{ HS.mode=b.dataset.v; HS.track=null; hsSave(); hsRender(); });
  $('hdLen').querySelectorAll('button').forEach(b=>b.onclick=()=>{ HS.len=b.dataset.v; hsSave(); hsRender(); });
  $('hdStyle').querySelectorAll('button').forEach(b=>b.onclick=()=>{ UI.humStyle=b.dataset.v; saveUI(); hsRender(); });
  $('hdTrack').onchange=e=>{ if(e.target.value==='__new'){ hsTarget(true,true); } else HS.track=e.target.value; hsTarget(false); hsRender(); };
  $('hdBacking').onchange=e=>{ UI.humBacking=e.target.checked; saveUI(); }; $('hdReplace').onchange=e=>{ UI.humReplace=e.target.checked; saveUI(); };
  $('hdRec').onclick=hsGo; $('hdFile').onclick=hsUseFile; $('hdCompose').onclick=()=>{ Project.saveNow(); location.href='compose.html'; };
  on('tracks',hsRender); on('restore',hsRender); on('song',hsRender); on('header',hsState);
  on('frame',hsScope);
  on('key',(e,c)=>{ if(!c) return false; const {typing,sheetOpen,mod,k}=c; if(typing||sheetOpen||mod) return false; if(k==='r'&&!e.repeat){ hsGo(); return true; } return false; });
  hsRender();
}
boot({ init(){ initTimeline(); initHumStudio(); } });
