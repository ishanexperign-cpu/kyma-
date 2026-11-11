/* KYMA · studio/compose-chords — the optional chord strips in Compose
   Shown with the Chords button (or C). Chords play through a track of the song:
     Play        just sound
     Step write  each chord lands at the playhead for ½, 1 or 2 bars, and the playhead moves on
     Record      while the song runs, what you play is written where you play it; hold to let it ring
   Written chords also tell Magic the harmony of those bars, so generated parts follow them. */
const CS={open:false,mode:'play',col:0,spread:0,len:16,track:null,strip:null,held:[],lastRec:0,keyDown:null};
try{ const c=JSON.parse(localStorage.getItem('kyma.chords')||'{}'); if(typeof c.open==='boolean') CS.open=c.open; if(['play','step','rec'].includes(c.mode)) CS.mode=c.mode;
  if([0,1,2,3].includes(c.col)) CS.col=c.col; CS.spread=c.spread?1:0; if([8,16,32].includes(c.len)) CS.len=c.len; }catch(e){}
function csSave(){ try{ localStorage.setItem('kyma.chords',JSON.stringify({open:CS.open,mode:CS.mode,col:CS.col,spread:CS.spread,len:CS.len})); }catch(e){} }

/* ---------- which track the chords play on ---------- */
const csCandidates=()=>S.tracks.filter(t=>t.kind!=='drum'&&!['atmos','fxkit'].includes(INST[t.inst]?.engine));
function csTrack(){
  const list=csCandidates(); let tr=list.find(t=>t.id===CS.track);
  if(!tr) tr=list.find(t=>['chords','pad'].includes(trackRole(t)))||list.find(t=>trackRole(t)!=='bass')||list[0];
  if(tr) CS.track=tr.id; return tr||null;
}
function csNewTrack(){
  const I=INSTS.find(i=>i.name==='Soft Keys')||INSTS.find(i=>i.cat==='Keys')||INSTS.find(i=>i.kind!=='drum');
  pushHist(); const tr=newTrack(I.id,{name:'Chords · '+I.name}); tr.role='chords'; S.tracks.push(tr); CS.track=tr.id; FOCUS=tr.id;
  if(G) applyGraph(G); markDirty(); persist(); renderTracks(); return tr;
}
function renderCsTracks(){
  const sel=$('csTrack'); if(!sel) return; const cur=csTrack(); sel.innerHTML='';
  csCandidates().forEach(t=>{ const o=document.createElement('option'); o.value=t.id; o.textContent=t.name; sel.appendChild(o); });
  const o=document.createElement('option'); o.value='__new'; o.textContent='+ New chord track'; sel.appendChild(o);
  sel.value=cur?cur.id:'__new';
}

/* ---------- sound ---------- */
function csVoice(tr,degs,o={}){
  ensureAudio(); if(ac.state!=='running') ac.resume(); if(!tr) return;
  const I=INST[tr.inst], T=channel(G,tr), t0=ac.currentTime+.01, dur=o.dur||clamp(stepDur()*8,.5,2.2);
  degs.forEach((d,i)=>{ try{ VOICES[I.engine](ac,T.in,tr.p,t0+(o.strum??.016)*i,(o.vel||.72)*(i?.92:1),dur,degToMidi(d,tr.oct),G.R); }catch(e){ console.warn(e); } });
}

/* ---------- writing ---------- */
function csClipFor(tr,a,b){
  let c=tr.clips.find(x=>x.start<=a&&clipEnd(x)>a);
  if(c&&c.loop) bakeClip(c);
  if(!c){ const s=Math.floor(a/16)*16, nxt=tr.clips.filter(x=>x.start>s).reduce((m,x)=>Math.min(m,x.start),Infinity);
    c=newClip(s,Math.max(16,Math.min(Math.ceil(b/16)*16,nxt)-s),[],{name:'Chords'}); tr.clips.push(c); }
  if(clipEnd(c)<b) c.len=b-c.start;
  if(clipEnd(c)>S.len){ S.len=Math.ceil(clipEnd(c)/16)*16; if(typeof renderSongLen==='function') renderSongLen(); }
  return c;
}
function csMarkHarmony(deg,a,b){ S.magic=S.magic||{prog:{}}; S.magic.prog=S.magic.prog||{}; for(let bar=Math.floor(a/16);bar*16<b;bar++) S.magic.prog[bar]=clamp(deg,0,6); }
function csWritten(){ markDirty(); persist(); requestDraw(); }

function csStep(deg,degs){
  let tr=csTrack()||csNewTrack(); const q=Math.min(CS.len,16), from=playing?curStep():PH.step, a=Math.floor(from/q+1e-6)*q, b=a+CS.len;
  pushHist(); const c=csClipFor(tr,a,b), ca=a-c.start+c.offset, cb=ca+CS.len;
  c.notes=c.notes.filter(n=>n.t<ca-1e-6||n.t>=cb-1e-6);
  degs.forEach((d,i)=>c.notes.push({t:ca,d:CS.len,n:d,v:i?.72:.8}));
  csMarkHarmony(deg,a,b);
  csWritten(); csVoice(tr,degs,{dur:clamp(CS.len*stepDur(),.6,2.6)});
  if(!playing){ if(b>=S.len){ S.len=Math.ceil((b+16)/16)*16; if(typeof renderSongLen==='function') renderSongLen(); } seekTo(b); }
  $('csHint').textContent=`${chordInfo(deg,CS.col).name} written at ${fmtMS(a*stepDur())} on “${tr.name}”. Next one goes at ${fmtMS(b*stepDur())}.`;
}
function csRecord(deg,degs,isChord){
  let tr=csTrack()||csNewTrack();
  if(!playing){ startPlay(); CS.lastRec=0; }
  const q=isChord?4:1, at=Math.max(0,snapTo(curStep(),q)), now=performance.now();
  if(now-CS.lastRec>4000) pushHist(); CS.lastRec=now;
  const c=csClipFor(tr,at,at+q), ct=at-c.start+c.offset;
  degs.forEach((d,i)=>{ const n={t:ct,d:q,n:d,v:i?.72:.82}; c.notes.push(n); CS.held.push({n,c,at,q}); });
  if(isChord) csMarkHarmony(deg,at,at+16);
  csWritten(); csVoice(tr,degs,{dur:isChord?1.4:.9,strum:isChord?.014:0});
}
/* releasing a recorded chord or string sets how long it rings */
function csUp(){
  if(!CS.held.length) return; const end=curStep();
  CS.held.forEach(h=>{ const len=Math.max(h.q,Math.round((end-h.at)/h.q)*h.q); h.n.d=len; if(h.at+len>clipEnd(h.c)) h.c.len=h.at+len-h.c.start; });
  CS.held=[]; csWritten();
}

/* ---------- the panel ---------- */
function csPlayChord(deg,_,e){
  const degs=chordDegs(deg,CS.col,CS.spread), info=chordInfo(deg,CS.col);
  $('csNow').textContent=info.name; $('csNow').title=info.notes.join(' ');
  if(CS.mode==='step') csStep(deg,degs);
  else if(CS.mode==='rec') csRecord(deg,degs,true);
  else csVoice(csTrack(),degs);
}
function csPlayNote(deg,nd){
  if(CS.mode==='rec') csRecord(deg,[nd],false);
  else csVoice(csTrack(),[nd],{dur:clamp(stepDur()*6,.4,1.6)});
  $('csNow').textContent=chordInfo(deg,CS.col).name;
}
const CS_HINT={play:'Tap a chord, touch a string for one note, or drag across the strings to strum. Number keys 1–7 play the chords.',
  step:'Each chord lands at the playhead and the playhead moves on, so you can write a progression bar by bar. Undo takes the last one back.',
  rec:'Play chords while the song runs and they’re written where you play them. Hold a chord to let it ring. The first chord starts the song.'};
function renderChords(){
  const p=$('chordPanel'); if(!p) return;
  p.hidden=!CS.open; $('chordsBtn').setAttribute('aria-pressed',CS.open);
  $('csMode').querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.v===CS.mode));
  $('csCol').querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',+b.dataset.v===CS.col));
  $('csLen').querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',+b.dataset.v===CS.len)); $('csLen').hidden=CS.mode!=='step';
  $('csSpread').setAttribute('aria-pressed',!!CS.spread);
  $('csKey').textContent='in '+NOTE_NAMES[S.root]+' '+S.scale; $('csHint').textContent=CS_HINT[CS.mode];
  if(CS.open){ CS.strip.render(); renderCsTracks(); }
}
function csToggle(on){ CS.open=on??!CS.open; csSave(); renderChords(); if(CS.open) ensureAudio(); }
function initChords(){
  if(!$('chordPanel')) return;
  control({id:'chords',group:'Compose',kind:'toggle',label:'Chord strips',icon:'chords',keys:'C',tip:'Show or hide the chord strips',run:()=>csToggle(),pressed:()=>CS.open});
  control({id:'csmode',group:'Compose',label:()=>'Chords: '+({play:'play',step:'step write',rec:'record'})[CS.mode],icon:'note',tip:'Step through Play, Step write and Record',run:()=>{ CS.mode={play:'step',step:'rec',rec:'play'}[CS.mode]; csSave(); if(!CS.open) csToggle(true); else renderChords(); }});
  CS.strip=ChordStrip($('csStrips'),{colour:()=>CS.col,onChord:csPlayChord,onNote:csPlayNote,onUp:csUp});
  $('chordsBtn').onclick=()=>csToggle(); $('csClose').onclick=()=>csToggle(false);
  $('csMode').querySelectorAll('button').forEach(b=>b.onclick=()=>{ CS.mode=b.dataset.v; csSave(); renderChords(); });
  $('csCol').querySelectorAll('button').forEach(b=>b.onclick=()=>{ CS.col=+b.dataset.v; csSave(); renderChords(); });
  $('csLen').querySelectorAll('button').forEach(b=>b.onclick=()=>{ CS.len=+b.dataset.v; csSave(); renderChords(); });
  $('csSpread').onclick=()=>{ CS.spread=CS.spread?0:1; csSave(); renderChords(); };
  $('csTrack').onchange=e=>{ if(e.target.value==='__new') csNewTrack(); else { CS.track=e.target.value; FOCUS=CS.track; if(typeof markFocus==='function') markFocus(); } renderCsTracks(); };
  on('tracks',renderCsTracks); on('header',()=>{ if(CS.open) renderChords(); }); on('restore',renderCsTracks);
  on('key',(e,c)=>{ if(!c) return false; const {typing,sheetOpen,mod,k}=c; if(typing||sheetOpen||mod) return false;
    if(k==='c'&&!e.repeat){ csToggle(); return true; }
    if(CS.open&&/^[1-9]$/.test(e.key)){ e.preventDefault(); if(!e.repeat){ CS.keyDown=e.key; CS.strip.play(+e.key-1,{first:true}); } return true; }
    return false; });
  document.addEventListener('keyup',e=>{ if(e.key===CS.keyDown){ CS.keyDown=null; csUp(); } });
  renderChords();
}
