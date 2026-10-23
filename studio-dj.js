/* KYMA · studio/dj — the DJ studio
   Deck A plays the open project live (jump points, track mutes, EQ). Deck B plays a demo song, a
   take or any audio file, with pitch, sync and loop. A crossfader, the recorder, and the OP-Deck
   master: four encoders, an XY filter pad and eight hold-to-play performance pads (keys Q–I). */
const PADS=[
  {id:'r4',label:'Repeat 1/4',key:'q',c:'--te-blue',down:()=>repeatOn(4),up:repeatOff},
  {id:'r8',label:'Repeat 1/8',key:'w',c:'--te-blue',down:()=>repeatOn(2),up:repeatOff},
  {id:'r16',label:'Repeat 1/16',key:'e',c:'--te-blue',down:()=>repeatOn(1),up:repeatOff},
  {id:'stop',label:'Tape stop',key:'r',c:'--te-white',down:tapeStopOn,up:tapeStopOff},
  {id:'lp',label:'LP sweep',key:'t',c:'--te-green',down:()=>sweepOn('lp'),up:sweepOff},
  {id:'hp',label:'HP sweep',key:'y',c:'--te-green',down:()=>sweepOn('hp'),up:sweepOff},
  {id:'crush',label:'Crush',key:'u',c:'--te-orange',down:crushOn,up:crushOff},
  {id:'throw',label:'Echo throw',key:'i',c:'--te-orange',down:throwOn,up:throwOff},
];
const padState={};
function padDown(pd){ if(padState[pd.id]) return; ensureAudio(); if(ac.state!=='running') ac.resume(); padState[pd.id]=true; try{ pd.down(); }catch(e){ console.warn(e); } const el=document.querySelector(`.ppad[data-id="${pd.id}"]`); el&&el.classList.add('on'); }
function padUp(pd){ if(!padState[pd.id]) return; padState[pd.id]=false; try{ pd.up(); }catch(e){ console.warn(e); } const el=document.querySelector(`.ppad[data-id="${pd.id}"]`); el&&el.classList.remove('on'); }
function renderOpDeck(){
  const enc=$('opEnc'); enc.innerHTML='';
  const E=[
    {spec:P('filter','Filter',-1,1,0,{fmt:v=>Math.abs(v)<.02?'open':(v<0?'LP ':'HP ')+Math.round(Math.abs(v)*100)}),c:'--te-blue',dot:'#fff',get:()=>PERF.filter,set:v=>{PERF.filter=Math.abs(v)<.03?0:v; setDJFilter(PERF.filter);},perf:true},
    {spec:P('space','Space',0,1.5,.5,{fmt:fmtPct}),c:'--te-green',dot:'#062a1a',get:()=>S.master.space,set:v=>{S.master.space=v; S.master.size=1.5+v/1.5*7;}},
    {spec:P('drive','Drive',0,1,.3,{fmt:fmtPct}),c:'--te-white',dot:'#111',get:()=>S.master.tape,set:v=>{S.master.tape=v;}},
    {spec:P('punch','Punch',0,1,.3,{fmt:fmtPct}),c:'--te-orange',dot:'#2a0f00',get:()=>MACROS[2].get(S.master),set:v=>MACROS[2].set(S.master,v)},
  ];
  E.forEach(e=>{ const k=knob(e.spec,e.get,v=>{ e.set(v); if(!e.perf){ if(G) applyGraph(G); persist(); } },'var('+e.c+')',e.perf?null:pushHistOnce);
    k.classList.add('te'); k.style.setProperty('--cap','var('+e.c+')'); k.style.setProperty('--capdot',e.dot); enc.appendChild(k); });
  const pads=$('opPads'); pads.innerHTML='';
  PADS.forEach(pd=>{ const b=document.createElement('button'); b.className='ppad'; b.dataset.id=pd.id; b.style.setProperty('--pc','var('+pd.c+')');
    b.innerHTML=`<i></i><span>${pd.label}</span><kbd>${pd.key.toUpperCase()}</kbd>`; b.setAttribute('aria-label',pd.label+' (hold, key '+pd.key.toUpperCase()+')');
    b.addEventListener('pointerdown',e=>{ e.preventDefault(); b.setPointerCapture(e.pointerId); padDown(pd); });
    ['pointerup','pointercancel','lostpointercapture'].forEach(ev=>b.addEventListener(ev,()=>padUp(pd)));
    b.addEventListener('keydown',e=>{ if(e.key==='Enter'&&!e.repeat){ e.preventDefault(); padDown(pd);} });
    b.addEventListener('keyup',e=>{ if(e.key==='Enter') padUp(pd); });
    pads.appendChild(b); });
}
/* ---- XY pad ---- */
const XY={on:false,x:.5,y:0,trail:[]};
function xyApply(){ if(!OUT) return; const f=XY.x*2-1; setDJFilter(f,.7+XY.y*11); const th=clamp((XY.y-.6)/.4,0,1); OUT.thD.delayTime.setValueAtTime(Math.min(2.9,.75*60/S.bpm),ac.currentTime); fade(OUT.thS.gain,th*.9,.02); }
function drawXY(){
  const cv=$('xyCv'), dpr=devicePixelRatio||1, W=cv.clientWidth, H=cv.clientHeight; if(!W) return;
  if(cv.width!==Math.round(W*dpr)){ cv.width=Math.round(W*dpr); cv.height=Math.round(H*dpr); }
  const g=cv.getContext('2d'); g.setTransform(dpr,0,0,dpr,0,0); g.fillStyle='#1d1823'; g.fillRect(0,0,W,H);
  g.strokeStyle='rgba(243,239,245,.12)'; g.lineWidth=1; for(let i=1;i<6;i++){ g.beginPath(); g.moveTo(i*W/6,0); g.lineTo(i*W/6,H); g.stroke(); g.beginPath(); g.moveTo(0,i*H/6); g.lineTo(W,i*H/6); g.stroke(); }
  g.fillStyle='rgba(240,122,58,.5)'; g.font='600 9px '+getComputedStyle(document.body).getPropertyValue('--font-mono'); g.fillText('LP',4,H-5); g.fillText('HP',W-16,H-5); g.fillText('RES',4,11);
  XY.trail=XY.trail.filter(p=>performance.now()-p.t<500);
  XY.trail.forEach(p=>{ const a=1-(performance.now()-p.t)/500; g.fillStyle=`rgba(243,239,245,${a*.5})`; g.fillRect(p.x*W-2,(1-p.y)*H-2,4,4); });
  const fx = XY.on?XY.x:(PERF.filter+1)/2, fy=XY.on?XY.y:0;
  g.strokeStyle=XY.on?'#f3eff5':'rgba(243,239,245,.45)'; g.beginPath(); g.moveTo(fx*W,0); g.lineTo(fx*W,H); g.moveTo(0,(1-fy)*H); g.lineTo(W,(1-fy)*H); g.stroke();
  g.fillStyle=XY.on?'#f0784f':'rgba(240,122,58,.6)'; g.beginPath(); g.arc(fx*W,(1-fy)*H,XY.on?7:4,0,Math.PI*2); g.fill();
}
(function xyInput(){ const cv=$('xyCv'); const at=e=>{ const r=cv.getBoundingClientRect(); XY.x=clamp((e.clientX-r.left)/r.width,0,1); XY.y=clamp(1-(e.clientY-r.top)/r.height,0,1); XY.trail.push({x:XY.x,y:XY.y,t:performance.now()}); };
  cv.addEventListener('pointerdown',e=>{ e.preventDefault(); ensureAudio(); cv.setPointerCapture(e.pointerId); XY.on=true; at(e); xyApply(); });
  cv.addEventListener('pointermove',e=>{ if(!XY.on) return; at(e); xyApply(); });
  const end=()=>{ if(!XY.on) return; XY.on=false; setDJFilter(PERF.filter); if(!padState.throw) throwOff(); };
  cv.addEventListener('pointerup',end); cv.addEventListener('pointercancel',end); })();
function drawScope(){
  const cv=$('scopeCv'); if(!cv) return; const dpr=devicePixelRatio||1, W=cv.clientWidth, H=cv.clientHeight; if(!W) return;
  if(cv.width!==Math.round(W*dpr)){ cv.width=Math.round(W*dpr); cv.height=Math.round(H*dpr); }
  const g=cv.getContext('2d'); g.setTransform(dpr,0,0,dpr,0,0); g.fillStyle='rgba(18,18,17,.55)'; g.fillRect(0,0,W,H);
  g.strokeStyle='rgba(243,239,245,.08)'; for(let i=1;i<4;i++){ g.beginPath(); g.moveTo(0,i*H/4); g.lineTo(W,i*H/4); g.stroke(); }
  if(!anaS) return; if(!drawScope.buf) drawScope.buf=new Float32Array(1024);
  const b=drawScope.buf; anaS.getFloatTimeDomainData(b);
  g.strokeStyle='#f3eff5'; g.lineWidth=1.5; g.shadowColor='rgba(243,239,245,.6)'; g.shadowBlur=6; g.beginPath();
  for(let i=0;i<b.length;i+=2){ const x=i/b.length*W, y=H*.62-b[i]*H*.45; i?g.lineTo(x,y):g.moveTo(x,y); } g.stroke(); g.shadowBlur=0;
}


/* ---- DJ desk: deck B ---- */
const DB={buf:null,name:'Empty',bpm:0,src:null,startT:0,offset:0,playing:false,loop:true,pitch:0,synced:false,peaks:null,rate:1,loading:0};
function dbRate(){ if(DB.synced&&DB.bpm){ let r=S.bpm/DB.bpm; while(r<.72) r*=2; while(r>1.42) r/=2; return r; } return 1+DB.pitch/100; }
function dbPos(){ if(!DB.buf) return 0; let p=DB.offset+(DB.playing&&ac?Math.max(0,ac.currentTime-DB.startT)*DB.rate:0); const d=DB.buf.duration; return DB.loop?((p%d)+d)%d:Math.min(p,d); }
function dbStart(at,offset){
  if(!DB.buf) return; ensureAudio(); dbStopSrc();
  const s=LIVE.rawB(); s.buffer=DB.buf; s.loop=DB.loop; DB.rate=dbRate(); s.playbackRate.value=DB.rate; s.connect(DECK.B.in);
  const t=Math.max(ac.currentTime+.01,at||0); DB.offset=offset==null?dbPos():offset; s.start(t,DB.offset%DB.buf.duration); DB.src=s; DB.startT=t; DB.playing=true;
  s.onended=()=>{ if(DB.src===s){ DB.src=null; DB.playing=false; DB.offset=0; renderDeckB(); } };
  renderDeckB();
}
function dbStopSrc(){ if(DB.src){ const s=DB.src; DB.src=null; try{ s.onended=null; s.stop(); }catch(e){} } }
function dbPause(){ if(!DB.playing) return; DB.offset=dbPos(); dbStopSrc(); DB.playing=false; renderDeckB(); }
function dbSetRate(){ if(!DB.playing||!DB.src) return; DB.offset=dbPos(); DB.startT=ac.currentTime; DB.rate=dbRate(); DB.src.playbackRate.setTargetAtTime(DB.rate,ac.currentTime,.02); }
function nextLiveBar(){ // time of deck A's next bar line
  if(!playing||!recent.length) return ac.currentTime+.05;
  const sd=stepDur(), fut=uiQueue.find(e=>e.step%16===0); if(fut) return fut.t;
  const last=uiQueue.length?uiQueue[uiQueue.length-1]:recent[recent.length-1]; return last.t+((16-last.step%16)%16||16)*sd;
}
function dbSync(){
  if(!DB.buf) return; if(!DB.bpm){ toast('Type deck B’s BPM first, then press Sync.'); return; }
  DB.synced=!DB.synced;
  if(DB.synced){ ensureAudio(); const barB=4*60/DB.bpm, off=Math.round(dbPos()/barB)*barB; dbStart(nextLiveBar(),off); toast('Deck B locked to '+S.bpm+' BPM and started on the next bar'); }
  else dbSetRate();
  renderDeckB();
}
async function loadDeck(buf,name,bpm){
  dbStopSrc(); DB.playing=false; DB.buf=buf; DB.name=name; DB.bpm=bpm||0; DB.offset=0; DB.synced=false;
  const d=buf.getChannelData(0), n=900, step=Math.max(1,Math.floor(d.length/n)), pk=new Float32Array(n);
  for(let i=0;i<n;i++){ let m=0; for(let j=i*step;j<Math.min(d.length,(i+1)*step);j+=8) m=Math.max(m,Math.abs(d[j])); pk[i]=m; }
  let mx=0; pk.forEach(v=>mx=Math.max(mx,v)); if(mx>0) for(let i=0;i<n;i++) pk[i]/=mx; DB.peaks=pk;
  renderDeckB(); toast(`Deck B: ${name} loaded (${fmtMS(buf.duration)})`);
}
function renderDeckB(){
  if(!$('dBName')) return;
  $('dBName').textContent=DB.name; $('dBBpm').textContent=DB.bpm?(DB.synced?`${DB.bpm} → ${(DB.bpm*dbRate()).toFixed(0)} BPM${Math.abs(DB.bpm*dbRate()-S.bpm)>1?' (×'+(S.bpm/(DB.bpm*dbRate())).toFixed(1)+')':''}`:`${(DB.bpm*dbRate()).toFixed(1)} BPM`):(DB.buf?'BPM unknown':'');
  $('dBPlay').textContent=DB.playing?'Pause':'Play'; $('dBSync').setAttribute('aria-pressed',DB.synced); $('dBLoop').setAttribute('aria-pressed',DB.loop);
  $('dBPitch').value=DB.pitch; $('dBPitch').disabled=DB.synced; const r=(dbRate()-1)*100; $('dBRate').textContent=(r>=0?'+':'')+r.toFixed(1)+'%';
  if(document.activeElement!==$('dBBpmIn')) $('dBBpmIn').value=DB.bpm||'';
  drawDeckB();
}
function drawDeckB(){
  const cv=$('dBWave'); if(!cv) return; const dpr=devicePixelRatio||1, W=cv.clientWidth, H=cv.clientHeight; if(!W) return;
  if(cv.width!==Math.round(W*dpr)){ cv.width=Math.round(W*dpr); cv.height=Math.round(H*dpr); }
  const g=cv.getContext('2d'); g.setTransform(dpr,0,0,dpr,0,0); g.fillStyle='#1d1823'; g.fillRect(0,0,W,H);
  const font=getComputedStyle(document.body).getPropertyValue('--font-mono');
  if(DB.loading){ g.fillStyle='rgba(243,239,245,.25)'; g.fillRect(0,0,W*DB.loading,H); g.fillStyle='#f3eff5'; g.font='600 11px '+font; g.fillText('RENDERING '+Math.round(DB.loading*100)+'%',10,H/2+4); return; }
  if(!DB.buf){ g.fillStyle='#9b92a1'; g.font='500 11.5px '+font; g.textAlign='center'; g.fillText('Load a demo, the current song, a take or an audio file',W/2,H/2+4); g.textAlign='left'; return; }
  const pk=DB.peaks, dur=DB.buf.duration;
  if(DB.bpm){ const bar=4*60/DB.bpm; g.fillStyle='rgba(255,255,255,.06)'; for(let t=0;t<dur;t+=bar) g.fillRect(t/dur*W,0,1,H); }
  const ph=dbPos()/dur;
  for(let x=0;x<W;x++){ const v=pk[Math.floor(x/W*pk.length)], h=Math.max(1,v*(H-10)); g.fillStyle=x/W<ph?'#f3eff5':'rgba(243,239,245,.38)'; g.fillRect(x,(H-h)/2,1,h); }
  g.fillStyle='#f0784f'; g.fillRect(ph*W-1,0,2,H);
  g.fillStyle='rgba(18,18,17,.7)'; g.fillRect(0,0,118,18); g.fillStyle='#f3eff5'; g.font='500 10px '+font; g.fillText(fmtClock(dbPos())+' / '+fmtMS(dur),8,13);
}
function renderDeckBLoad(){
  const s=$('dBLoad'); s.innerHTML='';
  const add=(v,t)=>{ const o=document.createElement('option'); o.value=v; o.textContent=t; s.appendChild(o); };
  add('','Load a track…'); add('__current','This song (render it)');
  Object.keys(STARTERS).filter(n=>n!=='Blank canvas').forEach(n=>add(n,'Demo: '+n));
  REC.takes.forEach((t,i)=>add('take:'+i,t.name));
}
/* ---- realtime recorder ---- */


/* ---------- deck A: the open project ---------- */
/* ---------- DJ deck A for the timeline ---------- */
function renderDeckA(){
  if(!$('dAName')) return;
  $('dAName').textContent=S.name; $('dABpm').textContent=S.bpm+' BPM · '+fmtMS(S.len*stepDur());
  const lp=$('dALayers'); lp.innerHTML='';
  S.tracks.forEach(tr=>{ const b=document.createElement('button'); b.className='lpad'; b.dataset.id=tr.id; b.style.setProperty('--tc',`var(${COLORS[tr.color%COLORS.length]})`); b.textContent=tr.name; b.setAttribute('aria-pressed',!tr.mute);
    b.onclick=()=>{ tr.mute=!tr.mute; tr.solo=false; if(G) applyGraph(G); persist(); b.setAttribute('aria-pressed',!tr.mute); }; lp.appendChild(b); });
  const jp=$('dAJump'); jp.innerHTML=''; const bars=Math.ceil(S.len/16), n=Math.min(8,Math.max(1,Math.ceil(bars/4)));
  for(let i=0;i<n;i++){ const s=Math.floor(i*S.len/n/16)*16, b=document.createElement('button'); b.className='dpad'; b.textContent=fmtMS(s*stepDur()); b.title='Jump to '+fmtMS(s*stepDur()); b.onclick=()=>seekTo(s); jp.appendChild(b); }
}
async function loadDeckDemo(key){
  const song=key==='__current'?sanitizeSong(JSON.parse(snapshot())):demoSong(key);
  DB.loading=.01; DB.name='Rendering '+song.name; renderDeckB();
  try{ let buf=await renderSong({state:song,onProgress:f=>{ DB.loading=f; drawDeckB(); }}); buf=trimTail(buf); masterBuffer(buf,-14); DB.loading=0; await loadDeck(buf,song.name,song.bpm); }
  catch(e){ console.warn(e); DB.loading=0; DB.name='Empty'; renderDeckB(); toast('That render stopped. Try again.'); }
}
function renderEqs(){
  ['A','B'].forEach(k=>{ const box=$('d'+k+'Eq'); if(!box) return; box.innerHTML=''; const kn=document.createElement('div'); kn.className='knobs';
    const fdb=v=>(v>0?'+':'')+v.toFixed(1)+'dB';
    [P('hi','High',-26,6,0,{fmt:fdb}),P('mid','Mid',-26,6,0,{fmt:fdb}),P('lo','Low',-26,6,0,{fmt:fdb}),P('lvl','Level',0,1.2,1,{fmt:v=>v<=.001?'−∞':(20*Math.log10(v)).toFixed(1)+'dB'})].forEach(sp=>{
      kn.appendChild(knob(sp,()=>PERF.eq[k][sp.k],v=>{ PERF.eq[k][sp.k]=v; applyDeckEq(); },k==='A'?'var(--accent)':'var(--play)')); });
    box.appendChild(kn); });
}

function djFrame(now){
  if(ac) drawScope();
  if(XY.on||XY.trail.length||!djFrame.xy){ drawXY(); djFrame.xy=1; }
  if(DB.playing||DB.loading) drawDeckB();
  document.querySelectorAll('.lpad').forEach(r=>r.classList.toggle('hit',now-(lastHit[r.dataset.id]||0)<120));
}
function initDJ(){
  $('xfader').oninput=e=>{ PERF.xf=e.target.value/100; applyXf(); };
  $('dBLoad').onchange=e=>{ const v=e.target.value; e.target.value=''; if(!v) return; if(v.startsWith('take:')){ const t=REC.takes[+v.slice(5)]; if(t) loadDeck(t.buf,t.name,t.bpm); } else loadDeckDemo(v); };
  $('dBFile').onclick=()=>$('dBFileIn').click();
  $('dBFileIn').onchange=async e=>{ const f=e.target.files[0]; e.target.value=''; if(!f) return; try{ ensureAudio(); const b=await ac.decodeAudioData(await f.arrayBuffer()); loadDeck(b,f.name,0); }catch(x){ toast('That file could not be decoded. Try a WAV, MP3 or M4A.'); } };
  $('dBPlay').onclick=()=>{ if(!DB.buf) return toast('Load something into deck B first'); if(DB.playing) dbPause(); else dbStart(DB.synced?nextLiveBar():0); };
  $('dBCue').onclick=()=>{ if(!DB.buf) return; if(DB.playing) dbStart(DB.synced?nextLiveBar():0,0); else { DB.offset=0; renderDeckB(); } };
  $('dBSync').onclick=dbSync; $('dBLoop').onclick=()=>{ DB.loop=!DB.loop; if(DB.playing) dbStart(0); else renderDeckB(); };
  $('dBPitch').oninput=e=>{ DB.pitch=+e.target.value; dbSetRate(); renderDeckB(); }; $('dBPitch').ondblclick=()=>{ DB.pitch=0; dbSetRate(); renderDeckB(); };
  $('dBBpmIn').onchange=e=>{ const v=+e.target.value; DB.bpm=v>=40&&v<=220?v:0; if(DB.synced) dbSetRate(); renderDeckB(); };
  $('dBWave').addEventListener('click',e=>{ if(!DB.buf) return; const r=e.currentTarget.getBoundingClientRect(), o=clamp((e.clientX-r.left)/r.width,0,1)*DB.buf.duration; if(DB.playing) dbStart(0,o); else { DB.offset=o; renderDeckB(); } });
  $('recBig').onclick=toggleRec;
  on('tracks',renderDeckA); on('mix',renderDeckA); on('header',renderDeckA); on('bpm',()=>{ if(DB.synced) dbSetRate(); renderDeckB(); });
  on('frame',djFrame);
  on('key',(e,{typing,sheetOpen,mod,k})=>{ if(typing||sheetOpen||mod) return false; const pd=PADS.find(x=>x.key===k); if(pd&&!e.repeat){ e.preventDefault(); padDown(pd); return true; } return false; });
  document.addEventListener('keyup',e=>{ const pd=PADS.find(x=>x.key===(e.key||'').toLowerCase()); if(pd) padUp(pd); },true);
  window.addEventListener('blur',()=>PADS.forEach(padUp));
  renderOpDeck(); renderEqs(); renderDeckBLoad(); renderDeckB(); renderTakes();
}
boot({init:initDJ});
