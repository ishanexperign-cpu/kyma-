/* KYMA · app/shell — the chrome every studio shares
   Header (home, project, transport, tempo, key, master, save, export), popovers, the export sheet,
   shared keys, the animation frame loop and the boot sequence. A studio calls boot({init}) once. */

/* ---------- header ---------- */
function renderPlayBtn(){ const b=$('playBtn'); if(!b) return; b.innerHTML=playing?ICONS.pause:ICONS.play; b.classList.toggle('on',playing); const l=playing?'Pause (Space)':'Play (Space)'; b.setAttribute('aria-label',l); b.title=l; }
function renderHeader(){
  $('projName').value=S.name; $('bpm').value=S.bpm; $('root').value=S.root; $('scale').value=S.scale;
  const lb=$('loopBtn'); if(lb) lb.setAttribute('aria-pressed',S.loop);
  emit('header');
}
function updateClock(){
  const sd=stepDur(), el=curStep()*sd, tot=S.len*sd, ck=fmtClock(el), cn=$('clockNow'); if(!cn) return;
  if(ck!==updateClock.last){ updateClock.last=ck; cn.innerHTML=ck.slice(0,-2)+'<i>'+ck.slice(-2)+'</i>'; }
  $('clockTot').textContent=fmtMS(tot); $('clockMode').textContent=UI.loopSel&&RANGE?'SEL':S.loop?'LOOP':'SONG';
  const cb=$('clockBar'); if(cb){ const st=Math.floor(curStep()), t=String(Math.floor(st/16)+1).padStart(3,'0')+'.'+(Math.floor(st%16/4)+1); if(cb.textContent!==t) cb.textContent=t; }
  hudMeter();
}
/* the header's output meter: peak per channel with a short fall */
const HM={buf:null,hold:[0,0]};
function hudMeter(){ const m=$('cbMeter'); if(!m) return; const bars=m.children; HM.buf=HM.buf||new Float32Array(1024);
  [anaL,anaR].forEach((a,i)=>{ let pk=0; if(a&&ac&&ac.state==='running'){ a.getFloatTimeDomainData(HM.buf); for(let j=0;j<HM.buf.length;j+=2) pk=Math.max(pk,Math.abs(HM.buf[j])); }
    const db=pk>0?20*Math.log10(pk):-60, v=clamp((db+48)/48,0,1); HM.hold[i]=Math.max(v,HM.hold[i]*.9); bars[i].style.setProperty('--v',HM.hold[i].toFixed(3)); bars[i].classList.toggle('hot',db>-1.5); }); }
function renderAll(){ readTheme(); renderHeader(); renderTracks(); renderPlayBtn(); emit('all'); }
/* tap tempo: the average of the last few taps, reset after a pause */
const TAP={t:[]};
function tapTempo(){ const now=performance.now(); TAP.t=TAP.t.filter(x=>now-x<2200); TAP.t.push(now); const b=$('tapBtn'); if(b){ b.classList.remove('hit'); void b.offsetWidth; b.classList.add('hit'); }
  if(TAP.t.length<2){ toast('Keep tapping the beat…',null,1200); return; } const iv=(TAP.t[TAP.t.length-1]-TAP.t[0])/(TAP.t.length-1); setBpm(60000/iv); toast('Tempo '+S.bpm+' BPM',null,1200); }
function setBpm(v){ S.bpm=clamp(Math.round(v)||100,40,220); $('bpm').value=S.bpm; if(G) applyGraph(G); persist(); requestDraw(); emit('bpm'); emit('header'); }

/* ---------- popovers ---------- */
function closePop(){ const p=$('pop'); if(p) p.hidden=true; }
function placePop(p,x,y){ p.hidden=false; const w=p.offsetWidth, h=p.offsetHeight; p.style.left=clamp(x,8,innerWidth-w-8)+'px'; p.style.top=clamp(y,8,innerHeight-h-8)+'px'; }
function popMenu(anchor,items){
  const p=$('pop'); p.innerHTML=''; p.className='pop menu';
  items.forEach(it=>{ if(it.sep){ const s=document.createElement('hr'); p.appendChild(s); return; } const b=document.createElement('button'); b.textContent=it.label; if(it.danger) b.className='danger'; if(it.hint){ const sm=document.createElement('small'); sm.textContent=it.hint; b.appendChild(sm); } b.onclick=()=>{ closePop(); it.fn(); }; p.appendChild(b); });
  const r=anchor.getBoundingClientRect(); placePop(p,r.left,r.bottom+4);
}
function fileMenu(anchor){
  popMenu(anchor,[
    {label:'Save',hint:'⌘S',fn:()=>Project.saveNow(true)},
    {label:'Save a copy',fn:()=>Project.saveCopy()},
    {sep:true},
    {label:'Download project file',hint:'.kyma',fn:()=>Project.download()},
    {label:'Open a project file…',fn:()=>$('openFile').click()},
    {sep:true},
    {label:'All projects and studios',fn:()=>Project.home()},
  ]);
}
/* master bus: the song's mix-bus settings in one popover */
function masterPop(anchor){
  const p=$('pop'); p.innerHTML=''; p.className='pop clipmenu masterpop';
  p.innerHTML='<div class="rackhead"><span class="lbl">Master bus · this song</span><button class="btn ghost" data-a="x">Done</button></div><div class="knobs"></div><p class="hint" style="margin:0">Applies to playback and every export.</p>';
  const k=p.querySelector('.knobs');
  MASTER.forEach(spec=>k.appendChild(knob(spec,()=>S.master[spec.k],v=>{ S.master[spec.k]=v; if(G) applyGraph(G); persist(); },'var(--orange)',pushHistOnce)));
  p.querySelector('[data-a=x]').onclick=closePop;
  const r=anchor.getBoundingClientRect(); placePop(p,r.left-120,r.bottom+6);
}

/* ---------- load a whole song into the open project ---------- */
function loadSong(song,label){
  pushHist(); const was=playing; if(was){ playing=false; TIMER.halt(); killVoices(); }
  const keep=S.name&&!/^Untitled( \d+)?$/.test(S.name)?S.name:null; /* a project you named keeps its name */
  S=sanitizeSong(JSON.parse(JSON.stringify(song))); S.tracks.forEach(t=>t.open=false); PH.step=0; SEL={clips:new Set(),notes:new Set()}; RANGE=null; FOCUS=S.tracks[0]?.id||null; markDirty();
  if(keep) S.name=keep;
  if(G) applyGraph(G); UI.pps=0; renderAll(); emit('song'); persist();
  startPlay(); toast(label+' · '+fmtMS(S.len*stepDur())+' · '+S.tracks.length+' tracks',[{label:'Undo',fn:undo}]);
}
async function loadUserSample(file){
  try{ ensureAudio(); let buf=await ac.decodeAudioData(await file.arrayBuffer());
    if(buf.length*buf.numberOfChannels*4>140e6){ const n=Math.min(buf.length,Math.floor(buf.sampleRate*480)), m=new AudioBuffer({length:n,numberOfChannels:1,sampleRate:buf.sampleRate}), md=m.getChannelData(0), a=buf.getChannelData(0), b=buf.numberOfChannels>1?buf.getChannelData(1):a; for(let i=0;i<n;i++) md[i]=(a[i]+b[i])*.5; buf=m; }
    SAMPLE.buffer=buf; SAMPLE.follow=true; SAMPLE.name=file.name+' · '+fmtTime(buf.duration); SAMPLE.peaks=computePeaks(buf); renderTracks(); toast('Loaded '+file.name+' into the Voice instruments'); return true; }
  catch(e){ toast('That file could not be decoded. Try a WAV, MP3 or M4A.'); return false; }
}

/* ---------- export the song ---------- */
const EX={range:'song',loud:-14,result:null,zip:null,previewSrc:null};
function openExport(){ if(!$('exportSheet')) return; $('exportSheet').hidden=false; syncExSeg(); $('exRender').focus(); }
function closeExport(){ stopPreview(); if($('exportSheet')) $('exportSheet').hidden=true; }
function syncExSeg(){ $('exRange').querySelectorAll('button').forEach(b=>{ b.setAttribute('aria-pressed',b.dataset.v===EX.range); if(b.dataset.v==='sel') b.disabled=!(RANGE&&RANGE.b>RANGE.a); }); $('exLoud').querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',+b.dataset.v===EX.loud)); }
async function doExport(){
  const btn=$('exRender'); btn.disabled=true; $('exSave').hidden=$('exPreview').hidden=true; $('exStats').hidden=true; EX.result=null; EX.zip=null;
  const bar=$('exBar'), status=$('exStatus'), setP=(f,msg)=>{ bar.style.width=Math.round(f*100)+'%'; status.textContent=msg; };
  if(playing) stopPlay();
  try{
    const sel=EX.range==='sel'&&RANGE&&RANGE.b>RANGE.a, a=sel?RANGE.a:0, b=sel?RANGE.b:S.len, anySolo=S.tracks.some(t=>t.solo);
    const stems=$('exStems').checked?S.tracks.filter(t=>audibleT(t,anySolo)&&t.clips.some(c=>c.start<b&&clipEnd(c)>a)):[], total=1+stems.length;
    setP(.02,'Rendering the mix…'); await new Promise(r=>setTimeout(r,30));
    let buf=await renderSong({a,b,onProgress:f=>setP(.02+f*(.9/total),'Rendering the mix… '+Math.round(f*100)+'%')}); buf=trimTail(buf);
    setP(.95/total,'Mastering to '+EX.loud+' LUFS…'); await new Promise(r=>setTimeout(r,20));
    const st=masterBuffer(buf,EX.loud), base=slug(S.name), files=[{name:`${base}/${base}-master.wav`,data:encodeWav(buf,24)}];
    for(let i=0;i<stems.length;i++){ const tr=stems[i];
      let sb=await renderSong({a,b,only:tr.id,onProgress:f=>setP((i+1+f*.9)/total,`Rendering stem ${i+1} of ${stems.length}: ${tr.name}… ${Math.round(f*100)}%`)});
      const len=Math.min(sb.length,buf.length); if(len<sb.length){ const t=new AudioBuffer({length:len,numberOfChannels:2,sampleRate:sb.sampleRate}); t.copyToChannel(sb.getChannelData(0).subarray(0,len),0); t.copyToChannel(sb.getChannelData(1).subarray(0,len),1); sb=t; }
      let pk=0; for(let c=0;c<2;c++){ const dd=sb.getChannelData(c); for(let j=0;j<dd.length;j++) pk=Math.max(pk,Math.abs(dd[j])); } if(pk>.98){ const kk=.98/pk; for(let c=0;c<2;c++){ const dd=sb.getChannelData(c); for(let j=0;j<dd.length;j++) dd[j]*=kk; } }
      files.push({name:`${base}/stems/${String(i+1).padStart(2,'0')}-${slug(tr.name)}.wav`,data:encodeWav(sb,24)}); }
    files.push({name:`${base}/${base}.kyma`,data:new TextEncoder().encode(Store.toFile(Project.snapshot()))});
    EX.zip=makeZip(files); EX.result=buf; setP(1,'Done. '+files.length+' files in the archive.');
    const s2=$('exStats'); s2.hidden=false;
    s2.innerHTML=`<div class="stat"><span>Length</span><b>${fmtTime(buf.duration)}</b></div><div class="stat"><span>Loudness</span><b>${st.lufs.toFixed(1)} LUFS</b></div><div class="stat"><span>Peak</span><b>${st.peak.toFixed(1)} dBFS</b></div><div class="stat"><span>Archive</span><b>${(EX.zip.size/1048576).toFixed(1)} MB</b></div>`;
    $('exSave').hidden=false; $('exPreview').hidden=false; $('exSave').focus();
  }catch(e){ console.error(e); setP(0,'The render stopped: '+(e.message||e)+'. Try a shorter range or fewer stems.'); }
  btn.disabled=false;
}
function stopPreview(){ if(EX.previewSrc){ try{EX.previewSrc.stop();}catch(e){} EX.previewSrc=null; const b=$('exPreview'); if(b) b.textContent='Preview master'; } }
function togglePreview(){ if(EX.previewSrc) return stopPreview(); if(!EX.result) return; ensureAudio(); ac.resume(); if(playing) stopPlay();
  const s=LIVE.rawB(); s.buffer=EX.result; s.connect(ac.destination); s.onended=()=>{ if(EX.previewSrc===s) stopPreview(); }; s.start(); EX.previewSrc=s; $('exPreview').textContent='Stop preview'; }

/* ---------- frame loop ---------- */
function frame(){
  if(ac&&playing){ while(uiQueue.length&&uiQueue[0].t<=ac.currentTime){ const ev=uiQueue.shift(); playView={step:ev.step,t:ev.t}; ev.hits.forEach(h=>lastHit[h]=performance.now()); } }
  const now=performance.now();
  updateClock(); emit('frame',now);
  if(REC.on&&now-(frame.rt||0)>250){ frame.rt=now; renderRec(); }
  requestAnimationFrame(frame);
}

/* ---------- wiring ---------- */
function setupShell(){
  NOTE_NAMES.forEach((n,i)=>{ const o=document.createElement('option'); o.value=i; o.textContent=n; $('root').appendChild(o); });
  Object.keys(SCALES).forEach(n=>{ const o=document.createElement('option'); o.value=n; o.textContent=n; $('scale').appendChild(o); });
  paintIcons(document);
  $('homeBtn').onclick=()=>Project.home();
  const nb=$('newBtn'); if(nb) nb.onclick=()=>Project.newFile();
  const ob=$('openBtn'); if(ob) ob.onclick=()=>$('openFile').click();
  const tb=$('tapBtn'); if(tb) tb.onclick=tapTempo;
  const bar=$('cmdbar'); if(bar){ const sc=()=>bar.classList.toggle('scrolled',scrollY>6); addEventListener('scroll',sc,{passive:true}); sc(); }
  const pb=$('playBtn'); if(pb){ pb.onclick=()=>playing?stopPlay():startPlay(); $('restartBtn').onclick=restartPlay; }
  const lb=$('loopBtn'); if(lb) lb.onclick=()=>{ S.loop=!S.loop; lb.setAttribute('aria-pressed',S.loop); persist(); };
  $('projName').onchange=e=>{ S.name=e.target.value.trim()||'Untitled'; e.target.value=S.name; persist(); emit('header'); };
  $('bpm').onchange=e=>{ pushHist(); setBpm(+e.target.value); }; $('bpmDown').onclick=()=>setBpm(S.bpm-1); $('bpmUp').onclick=()=>setBpm(S.bpm+1);
  $('root').onchange=e=>{ pushHist(); S.root=+e.target.value; persist(); requestDraw(); emit('key'); emit('header'); };
  $('scale').onchange=e=>{ pushHist(); S.scale=e.target.value; persist(); requestDraw(); emit('key'); emit('header'); };
  const mb=$('masterBtn'); if(mb) mb.onclick=e=>masterPop(e.currentTarget);
  const rb=$('recBtn'); if(rb) rb.onclick=toggleRec;
  $('saveBtn').onclick=()=>Project.saveNow(true);
  $('fileBtn').onclick=e=>fileMenu(e.currentTarget);
  $('openFile').onchange=e=>{ const f=e.target.files[0]; e.target.value=''; if(f) Project.openFile(f); };
  const xb=$('exportBtn'); if(xb) xb.onclick=()=>{ if(!emit('export')) openExport(); };
  if($('exportSheet')){
    $('exClose').onclick=closeExport; $('exportSheet').addEventListener('click',e=>{ if(e.target.id==='exportSheet') closeExport(); });
    $('exRange').querySelectorAll('button').forEach(b=>b.onclick=()=>{ EX.range=b.dataset.v; syncExSeg(); });
    $('exLoud').querySelectorAll('button').forEach(b=>b.onclick=()=>{ EX.loud=+b.dataset.v; syncExSeg(); });
    $('exRender').onclick=doExport; $('exPreview').onclick=togglePreview; $('exSave').onclick=()=>{ if(EX.zip) offerFile(slug(S.name)+'.zip',EX.zip); };
  }
  document.addEventListener('pointerdown',e=>{ const p=$('pop'); if(p&&!p.hidden&&!p.contains(e.target)&&!e.target.closest('.tmore,#fileBtn,#masterBtn')) closePop(); },true);
  document.addEventListener('keydown',e=>{
    const tag=(e.target.tagName||'').toLowerCase(), typing=tag==='input'&&!['range','checkbox','radio'].includes(e.target.type)||tag==='select'||tag==='textarea';
    const sheets=[...document.querySelectorAll('.sheet')], sheetOpen=sheets.some(s=>!s.hidden), mod=e.metaKey||e.ctrlKey, k=(e.key||'').toLowerCase();
    if(mod&&k==='s'){ e.preventDefault(); Project.saveNow(true); return; }
    if(emit('key',e,{typing,sheetOpen,mod,k})) return;
    if(e.key==='Escape'){ closePop(); sheets.forEach(s=>s.hidden=true); stopPreview(); return; }
    if(typing||sheetOpen) return;
    if(mod&&k==='z'){ e.preventDefault(); e.shiftKey?redo():undo(); return; }
    if(mod) return;
    if(e.code==='Space'&&$('playBtn')){ e.preventDefault(); if(e.repeat) return; if(e.target.blur&&e.target!==document.body) e.target.blur(); playing?stopPlay():startPlay(); return; }
    if(k==='home'&&$('playBtn')){ restartPlay(); return; }
    if(k==='z'&&!e.repeat&&$('recBtn')){ toggleRec(); return; }
    if(k==='t'&&!e.repeat){ tapTempo(); return; }
  });
  const re=()=>{ readTheme(); requestDraw(); emit('theme'); }; const mq=matchMedia('(prefers-color-scheme: dark)'); mq.addEventListener&&mq.addEventListener('change',re);
  new MutationObserver(re).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
}
async function boot(opts){
  setupShell();
  const p=await Project.open();
  FOCUS=S.tracks[0]?.id||null;
  try{ opts.init&&opts.init(); }catch(e){ console.error(e); }
  try{ initPanels(); }catch(e){ console.error(e); }
  emit('project',p);
  renderAll();
  requestAnimationFrame(frame);
  if(Project.cur.fresh&&opts.fresh) opts.fresh();
  await initChoir(); emit('choir');
  if(document.fonts&&document.fonts.ready) document.fonts.ready.then(()=>requestDraw());
}

/* =========================================================
   SIMPLE / PRO
   Simple is the default: fewer controls, same engine. Pro reveals everything.
   ========================================================= */
const ViewMode=(()=>{
  const KEY='kyma.viewmode'; let mode='simple';
  try{ if(localStorage.getItem(KEY)==='pro') mode='pro'; }catch(e){}
  const root=document.documentElement;
  const paint=()=>{ root.classList.toggle('simple',mode==='simple'); const sw=document.getElementById('modeSw'); if(sw) sw.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.m===mode)); };
  const set=m=>{ mode=m==='pro'?'pro':'simple'; try{ localStorage.setItem(KEY,mode); }catch(e){} paint(); try{ window.dispatchEvent(new Event('resize')); if(typeof requestDraw==='function') requestDraw(); }catch(e){} };
  /* long chip lists fold to three rows with a "Show all" link */
  const fold=()=>['mgMoods','mgGenres','mgUses'].forEach(id=>{ const box=document.getElementById(id); if(!box||box.dataset.fold) return; box.dataset.fold='1'; box.classList.add('fold');
    const b=document.createElement('button'); b.type='button'; b.className='chips-more'; b.textContent='Show all'; b.setAttribute('aria-expanded','false');
    b.onclick=()=>{ const all=box.classList.toggle('all'); b.textContent=all?'Show fewer':'Show all'; b.setAttribute('aria-expanded',all); };
    box.after(b); new MutationObserver(()=>{ b.hidden=box.hidden; }).observe(box,{attributes:true,attributeFilter:['hidden']}); b.hidden=box.hidden; });
  paint();
  const boot=()=>{ paint(); fold(); const sw=document.getElementById('modeSw'); if(sw) sw.addEventListener('click',e=>{ const b=e.target.closest('button[data-m]'); if(b) set(b.dataset.m); }); };
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else setTimeout(boot,0);
  return {get:()=>mode,set};
})();
